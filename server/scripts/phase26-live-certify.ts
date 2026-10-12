import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';

type Check = { name: string; status: 'PASS'|'FAIL'|'SKIP'; detail?: string };
const checks: Check[]=[];
const pass=(name:string,detail='')=>checks.push({name,status:'PASS',detail});
const fail=(name:string,detail='')=>checks.push({name,status:'FAIL',detail});
const skip=(name:string,detail='')=>checks.push({name,status:'SKIP',detail});

const dbUrl=process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if(!dbUrl || !/^postgres(ql)?:\/\//.test(dbUrl)){
  console.error('PHASE 26 LIVE CERTIFICATION: BLOCKED — set MIGRATION_DATABASE_URL or DATABASE_URL.');
  process.exit(2);
}

const manifest=JSON.parse(await readFile(resolve(process.cwd(),'database/contracts/migration-checksums.json'),'utf8')) as {
  migrations:Array<{version:string;sha256:string}>;
};
const client=new Client({
  connectionString:dbUrl,
  ssl:process.env.DB_SSL==='false'?false:{rejectUnauthorized:true},
  application_name:'electroobuddy-phase26-certifier'
});

try{
  await client.connect();
  const ping=await client.query<{db:string;version:string}>("SELECT current_database() AS db, current_setting('server_version') AS version");
  pass('neon_postgres_connectivity',`${ping.rows[0]?.db} PostgreSQL ${ping.rows[0]?.version}`);

  const reg=await client.query<{ok:boolean}>("SELECT to_regclass('public.schema_migrations') IS NOT NULL AS ok");
  if(!reg.rows[0]?.ok) fail('schema_migrations_present','public.schema_migrations is missing');
  else {
    const applied=await client.query<{version:string;checksum:string}>('SELECT version, checksum FROM public.schema_migrations ORDER BY version');
    const dbMap=new Map(applied.rows.map(r=>[r.version,r.checksum]));
    const missing:string[]=[]; const drift:string[]=[];
    for(const m of manifest.migrations){
      const c=dbMap.get(m.version);
      if(!c) missing.push(m.version); else if(c!==m.sha256) drift.push(m.version);
    }
    if(!missing.length && !drift.length) pass('migration_chain_immutable',`${manifest.migrations.length}/${manifest.migrations.length} migrations applied with matching checksums`);
    else fail('migration_chain_immutable',`missing=${missing.join(',')||'none'} drift=${drift.join(',')||'none'}`);
  }

  const required=['users','profiles','products','bookings','technicians','orders','order_items','order_refunds','order_returns','notifications','push_subscriptions','site_settings'];
  const tableRows=await client.query<{table_name:string}>(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])`,[required]);
  const got=new Set(tableRows.rows.map(r=>r.table_name));
  const absent=required.filter(x=>!got.has(x));
  if(absent.length) fail('critical_tables_present',absent.join(',')); else pass('critical_tables_present',`${required.length}/${required.length}`);

  const authDefault=await client.query<{column_default:string|null}>(`SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='auth_source'`);
  if((authDefault.rows[0]?.column_default||'').includes('native')) pass('native_auth_default'); else fail('native_auth_default',String(authDefault.rows[0]?.column_default));

  const integrity=await client.query<{orphan_orders:string;orphan_bookings:string}>(`
    SELECT
      (SELECT count(*)::text FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE o.user_id IS NOT NULL AND u.id IS NULL) AS orphan_orders,
      (SELECT count(*)::text FROM bookings b LEFT JOIN users u ON u.id=b.user_id WHERE b.user_id IS NOT NULL AND u.id IS NULL) AS orphan_bookings
  `);
  const ir=integrity.rows[0];
  if(ir && ir.orphan_orders==='0' && ir.orphan_bookings==='0') pass('critical_foreign_key_integrity');
  else fail('critical_foreign_key_integrity',JSON.stringify(ir));

  const counts=await client.query<{users:string;products:string;bookings:string;orders:string}>(`SELECT
    (SELECT count(*)::text FROM users) users,
    (SELECT count(*)::text FROM products) products,
    (SELECT count(*)::text FROM bookings) bookings,
    (SELECT count(*)::text FROM orders) orders`);
  pass('live_row_counts',JSON.stringify(counts.rows[0]));
} catch(e:any){
  fail('database_live_checks',e?.message||String(e));
} finally { await client.end().catch(()=>undefined); }

const apiBase=(process.env.PHASE26_API_BASE_URL||'').replace(/\/$/,'');
if(!apiBase){
  skip('api_smoke','PHASE26_API_BASE_URL not set; database checks only');
} else {
  const get=async(path:string)=>{const r=await fetch(apiBase+path,{headers:{accept:'application/json'}}); const text=await r.text(); return {r,text};};
  for(const path of ['/health','/ready','/products','/services']){
    try{
      const {r,text}=await get(path);
      if(r.ok) pass(`api:${path}`,String(r.status)); else fail(`api:${path}`,`${r.status} ${text.slice(0,200)}`);
    }catch(e:any){fail(`api:${path}`,e?.message||String(e));}
  }
}

// Mutating provider/payment/order tests are opt-in so production data is never changed by default.
const allowMutations=process.env.PHASE26_ALLOW_MUTATIONS === 'true';
if(!allowMutations){
  skip('mutating_e2e_flows','Set PHASE26_ALLOW_MUTATIONS=true only on a dedicated staging/test dataset.');
} else {
  skip('mutating_e2e_flows','Mutation flag enabled; use dedicated seeded staging credentials/provider sandbox values with the Phase 26 smoke collection.');
}

console.log('=== Phase 26 Live Neon/API Certification ===');
for(const c of checks) console.log(`${c.status}: ${c.name}${c.detail?' — '+c.detail:''}`);
const failures=checks.filter(c=>c.status==='FAIL');
if(failures.length){console.error(`PHASE 26 LIVE CERTIFICATION: FAIL (${failures.length})`);process.exit(1);}
console.log('PHASE 26 LIVE CERTIFICATION: PASS (for executed checks)');
