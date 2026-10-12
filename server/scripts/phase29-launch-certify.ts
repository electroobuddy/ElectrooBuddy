import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

type Status='PASS'|'FAIL';
type Check={status:Status;name:string;detail?:string};
const checks:Check[]=[];
const add=(status:Status,name:string,detail='')=>checks.push({status,name,detail});
const pass=(n:string,d='')=>add('PASS',n,d); const fail=(n:string,d='')=>add('FAIL',n,d);
const required=(name:string,value:string|undefined)=>{ if(value?.trim()) pass(`env:${name}`); else fail(`env:${name}`,'missing'); };
const truthy=(v:string|undefined)=>/^(1|true|yes)$/i.test(v??'');
const frontend=(process.env.PHASE29_FRONTEND_URL||'').replace(/\/$/,'');
const api=(process.env.PHASE29_API_ORIGIN||'').replace(/\/$/,'');
const dbUrl=process.env.MIGRATION_DATABASE_URL||process.env.DATABASE_URL||'';

required('PHASE29_FRONTEND_URL',frontend); required('PHASE29_API_ORIGIN',api); required('DATABASE_URL/MIGRATION_DATABASE_URL',dbUrl);
if(frontend && (!frontend.startsWith('https://')||/localhost|127\.0\.0\.1/i.test(frontend))) fail('production_frontend_https',frontend); else if(frontend) pass('production_frontend_https');
if(api && (!api.startsWith('https://')||/localhost|127\.0\.0\.1/i.test(api))) fail('production_api_https',api); else if(api) pass('production_api_https');

const providers=(process.env.PHASE29_REQUIRED_PROVIDERS||'razorpay,shiprocket,firebase,smtp,storage,ops-alert').split(',').map(x=>x.trim()).filter(Boolean);
const providerChecks:Record<string,()=>void>={
 razorpay:()=>['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET'].forEach(k=>required(k,process.env[k])),
 shiprocket:()=>['SHIPROCKET_EMAIL','SHIPROCKET_PASSWORD','SHIPROCKET_WEBHOOK_TOKEN'].forEach(k=>required(k,process.env[k])),
 firebase:()=>['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'].forEach(k=>required(k,process.env[k])),
 smtp:()=>['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].forEach(k=>required(k,process.env[k])),
 storage:()=>{ if(process.env.STORAGE_ENABLED!=='true') fail('env:STORAGE_ENABLED','must be true for launch certification'); ['STORAGE_ENDPOINT','STORAGE_BUCKET','STORAGE_ACCESS_KEY_ID','STORAGE_SECRET_ACCESS_KEY','STORAGE_PUBLIC_BASE_URL'].forEach(k=>required(k,process.env[k])); },
 'ops-alert':()=>required('OPS_ALERT_WEBHOOK_URL',process.env.OPS_ALERT_WEBHOOK_URL),
};
for(const p of providers){const fn=providerChecks[p]; if(fn) fn(); else fail(`provider:${p}`,'unknown provider in PHASE29_REQUIRED_PROVIDERS');}

// Backup evidence is mandatory for GO. The backup manifest format comes from tool/ops/neon_backup.ps1.
const backupManifest=process.env.PHASE29_BACKUP_MANIFEST||'';
if(!backupManifest||!existsSync(backupManifest)){ fail('backup_evidence','PHASE29_BACKUP_MANIFEST missing/not found'); }
else try{
  const m=JSON.parse(readFileSync(backupManifest,'utf8')) as {file?:string;sha256?:string};
  const dump=m.file?resolve(resolve(backupManifest,'..'),m.file):'';
  if(!dump||!existsSync(dump)||!m.sha256) fail('backup_evidence','manifest or dump incomplete');
  else {const actual=createHash('sha256').update(readFileSync(dump)).digest('hex'); actual===m.sha256?pass('backup_evidence',dump):fail('backup_evidence','SHA-256 mismatch');}
}catch(e:any){fail('backup_evidence',e?.message||String(e));}
const restoreEvidence=process.env.PHASE29_RESTORE_DRILL_EVIDENCE||'';
if(!restoreEvidence||!existsSync(restoreEvidence)) fail('restore_drill_evidence','PHASE29_RESTORE_DRILL_EVIDENCE missing/not found');
else try{const t=readFileSync(restoreEvidence,'utf8'); /PASS|passed|success/i.test(t)?pass('restore_drill_evidence'):fail('restore_drill_evidence','evidence does not contain a PASS/success marker');}catch(e:any){fail('restore_drill_evidence',e?.message||String(e));}

if(dbUrl){
 const manifest=JSON.parse(await readFile(resolve(process.cwd(),'database/contracts/migration-checksums.json'),'utf8')) as {migrations:Array<{version:string;sha256:string}>};
 const client=new Client({connectionString:dbUrl,ssl:process.env.DB_SSL==='false'?false:{rejectUnauthorized:true},application_name:'electroobuddy-phase29-launch-certifier'});
 try{
  await client.connect();
  const ping=await client.query<{db:string}>(`SELECT current_database() db`); pass('database_connectivity',ping.rows[0]?.db||'connected');
  const applied=await client.query<{version:string;checksum:string}>(`SELECT version,checksum FROM public.schema_migrations ORDER BY version`);
  const map=new Map(applied.rows.map(x=>[x.version,x.checksum])); const missing:string[]=[],drift:string[]=[];
  for(const m of manifest.migrations){const c=map.get(m.version); if(!c)missing.push(m.version);else if(c!==m.sha256)drift.push(m.version);}
  (!missing.length&&!drift.length)?pass('migration_chain_immutable',`${manifest.migrations.length}/${manifest.migrations.length}`):fail('migration_chain_immutable',`missing=${missing.join(',')||'none'} drift=${drift.join(',')||'none'}`);
  const critical=['users','profiles','products','bookings','technicians','orders','order_items','order_refunds','order_returns','notifications','push_subscriptions','site_settings','ops_worker_runs','ops_worker_leases'];
  const tr=await client.query<{table_name:string}>(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])`,[critical]);
  const got=new Set(tr.rows.map(x=>x.table_name)), absent=critical.filter(x=>!got.has(x)); absent.length?fail('critical_tables',absent.join(',')):pass('critical_tables',`${critical.length}/${critical.length}`);
  const ints=await client.query<{orphan_orders:string;orphan_bookings:string}>(`SELECT (SELECT count(*)::text FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE o.user_id IS NOT NULL AND u.id IS NULL) orphan_orders,(SELECT count(*)::text FROM bookings b LEFT JOIN users u ON u.id=b.user_id WHERE b.user_id IS NOT NULL AND u.id IS NULL) orphan_bookings`);
  const ir=ints.rows[0]; ir?.orphan_orders==='0'&&ir?.orphan_bookings==='0'?pass('critical_foreign_key_integrity'):fail('critical_foreign_key_integrity',JSON.stringify(ir));
  const workers=['checkout-expiry','payment-reconciliation','refund-reconciliation','shipment-sync','fulfillment-queue','notification-delivery','subscription-reconciliation'];
  const maxAge=Math.max(5,Number(process.env.PHASE29_WORKER_MAX_AGE_MINUTES||process.env.OPS_STALE_WORKER_MINUTES||30));
  const wr=await client.query<{worker_name:string;status:string;started_at:string}>(`SELECT DISTINCT ON(worker_name) worker_name,status,started_at::text FROM ops_worker_runs WHERE worker_name=ANY($1::text[]) ORDER BY worker_name,started_at DESC`,[workers]);
  const wm=new Map(wr.rows.map(x=>[x.worker_name,x])); const stale:string[]=[];
  for(const w of workers){const r=wm.get(w); if(!r||r.status!=='succeeded'||Date.now()-new Date(r.started_at).getTime()>maxAge*60000) stale.push(`${w}:${r?.status||'missing'}:${r?.started_at||'never'}`);}
  stale.length?fail('worker_freshness',stale.join(' | ')):pass('worker_freshness',`${workers.length}/${workers.length} succeeded within ${maxAge}m`);
  const fr=await client.query<{count:string}>(`SELECT count(*)::text count FROM ops_worker_runs WHERE status='failed' AND started_at>=now()-interval '24 hours'`);
  fr.rows[0]?.count==='0'?pass('worker_failures_24h','0'):fail('worker_failures_24h',fr.rows[0]?.count||'unknown');
  const lease=await client.query<{count:string}>(`SELECT count(*)::text count FROM ops_worker_leases WHERE lease_until < now()`);
  lease.rows[0]?.count==='0'?pass('expired_worker_leases','0'):fail('expired_worker_leases',lease.rows[0]?.count||'unknown');
 }catch(e:any){fail('database_live_checks',e?.message||String(e));}finally{await client.end().catch(()=>undefined);}
}

async function fetchCheck(name:string,url:string,expectProxy=false){try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'ElectrooBuddy-Phase29-Certifier'}});const body=await r.text();let success=r.ok;try{const p=JSON.parse(body);success=success&&p?.success===true;}catch{}if(expectProxy)success=success&&r.headers.get('x-electroobuddy-proxy')==='vercel';success?pass(name,`${r.status}; proxy=${r.headers.get('x-electroobuddy-proxy')||'none'}`):fail(name,`${r.status} ${body.slice(0,160)}`);}catch(e:any){fail(name,e?.message||String(e));}}
if(frontend&&api){
 await fetchCheck('direct_api_health',`${api}/api/v1/health`); await fetchCheck('direct_api_ready',`${api}/api/v1/ready`);
 await fetchCheck('vercel_proxy_health',`${frontend}/api/v1/health`,true); await fetchCheck('vercel_proxy_ready',`${frontend}/api/v1/ready`,true);
 await fetchCheck('public_products',`${frontend}/api/v1/products`,true); await fetchCheck('public_services',`${frontend}/api/v1/services`,true);
 try{const r=await fetch(`${frontend}/products`,{redirect:'follow'});r.ok?pass('spa_deep_link',String(r.status)):fail('spa_deep_link',String(r.status));}catch(e:any){fail('spa_deep_link',e?.message||String(e));}
 const forged=async(name:string,path:string,headers:Record<string,string>)=>{try{const r=await fetch(`${frontend}${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:'{}'});(!r.ok&&[400,401,403].includes(r.status))?pass(name,String(r.status)):fail(name,`unexpected status ${r.status}`);}catch(e:any){fail(name,e?.message||String(e));}};
 await forged('forged_razorpay_webhook_rejected','/api/v1/webhooks/razorpay',{'x-razorpay-signature':'0'.repeat(64)});
 await forged('forged_shiprocket_webhook_rejected','/api/v1/webhooks/fulfillment',{'x-api-key':'phase29-invalid-token'});
}

console.log('=== Phase 29 FINAL LIVE PRODUCTION LAUNCH CERTIFICATION ===');
for(const c of checks)console.log(`${c.status}: ${c.name}${c.detail?' — '+c.detail:''}`);
const failures=checks.filter(c=>c.status==='FAIL');
console.log(`RESULT: ${failures.length?'NO-GO':'GO'} (${checks.length-failures.length}/${checks.length} checks passed)`);
if(failures.length) process.exit(1);
console.log('PHASE 29 FINAL LIVE PRODUCTION LAUNCH CERTIFICATION: GO');
