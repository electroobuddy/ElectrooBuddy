from pathlib import Path
import hashlib, json, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; checks=[]

def ok(name, cond, detail=''):
    checks.append((name,bool(cond),detail))
    if not cond: errors.append(f'{name}: {detail or "failed"}')

def read(rel):
    p=ROOT/rel
    if not p.exists():
        errors.append(f'missing required file: {rel}')
        return ''
    return p.read_text(errors='ignore')

# Phase 25 must remain clean.
r=subprocess.run([sys.executable,str(ROOT/'tool/phase25_native_stack_production_certification.py')],cwd=ROOT,text=True,capture_output=True)
ok('phase25_regression',r.returncode==0,(r.stdout+r.stderr).strip())

pkg=json.loads(read('package.json') or '{}')
spkg=json.loads(read('server/package.json') or '{}')
ok('phase26_audit_script',pkg.get('scripts',{}).get('audit:backend-phase26')=='python tool/phase26_live_readiness_audit.py')
ok('phase26_live_script','phase26:live' in spkg.get('scripts',{}))
ok('phase26_live_root_script','server:phase26:live' in pkg.get('scripts',{}))
ok('phase26_production_live_gate','certify:production:live' in pkg.get('scripts',{}))

# Migration chain and immutable checksum contract.
mig=ROOT/'server/database/migrations'
files=sorted(mig.glob('[0-9][0-9][0-9]_*.sql'))
nums=[int(p.name[:3]) for p in files]
ok('migration_sequence_contiguous_from_001',nums==list(range(1,max(nums)+1)) and nums[:21]==list(range(1,22)),str(nums))
manifest_path=ROOT/'server/database/contracts/migration-checksums.json'
ok('migration_checksum_manifest_present',manifest_path.exists())
if manifest_path.exists():
    manifest=json.loads(manifest_path.read_text())
    expected={x['version']:x['sha256'] for x in manifest.get('migrations',[])}
    actual={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    ok('migration_checksum_manifest_complete',expected==actual,'migration hashes differ from committed manifest')

# Live certification implementation must cover DB + API readiness without forcing writes.
live=read('server/scripts/phase26-live-certify.ts')
for token in ['schema_migrations','migration-checksums.json','/health','/ready','/products','/services','PHASE26_API_BASE_URL','PHASE26_ALLOW_MUTATIONS']:
    ok('live_harness:'+token,token in live,f'missing {token}')
ok('live_harness_readonly_default',"PHASE26_ALLOW_MUTATIONS === 'true'" in live or "PHASE26_ALLOW_MUTATIONS === \"true\"" in live)

# Production route domains expected after Supabase shutdown.
route_tokens={
 'auth':'createAuthRouter','catalog':'createCatalogRouter','booking':'createBookingRouter','technician':'createTechnicianRouter',
 'checkout':'createCheckoutRouter','payment':'createPaymentRouter','orders':'createOrderRouter','refunds':'createRefundRouter',
 'returns':'createReturnRouter','shipping':'createShippingRouter','notifications':'createNotificationRouter',
 'admin':'createAdminOperationsRouter','subscriptions':'createSubscriptionRouter'
}
app=read('server/src/routes/index.ts')
for name,token in route_tokens.items(): ok('route_domain:'+name,token in app,f'{token} not registered')

# No real environment/secrets should be committed.
committed=[]
for p in ROOT.rglob('.env'):
    if 'node_modules' not in p.parts: committed.append(str(p.relative_to(ROOT)))
ok('no_committed_runtime_env',not committed,', '.join(committed))
secret_patterns=[
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'postgres(?:ql)?://[^\s:@]+:[^\s@]+@[^\s]+',re.I),
]
secret_hits=[]
for base in [ROOT/'src',ROOT/'server/src',ROOT/'server/scripts',ROOT/'tool']:
    if not base.exists(): continue
    for p in base.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.ts','.tsx','.js','.mjs','.py','.json'}: continue
        t=p.read_text(errors='ignore')
        if any(x.search(t) for x in secret_patterns): secret_hits.append(str(p.relative_to(ROOT)))
ok('no_embedded_runtime_secrets',not secret_hits,', '.join(secret_hits))

# Deployment reproducibility.
ok('root_lockfile_present',(ROOT/'package-lock.json').exists())
if not (ROOT/'server/package-lock.json').exists():
    warnings.append('server/package-lock.json is still missing; deterministic server npm ci remains a production blocker until generated and committed.')

# Live inputs are deliberately not stored in source.
server_env=read('server/.env.example')
for token in ['DATABASE_URL=','MIGRATION_DATABASE_URL=','RAZORPAY_KEY_ID=','SHIPROCKET_EMAIL=','FIREBASE_PROJECT_ID=']:
    ok('env_contract:'+token.split('=')[0],token in server_env,f'{token} absent from server env contract')

print('=== Phase 26 Live Production Readiness Audit ===')
for name,status,detail in checks:
    print(('PASS' if status else 'FAIL')+': '+name+(f' — {detail}' if detail and not status else ''))
for w in warnings: print('WARN:',w)
if errors:
    print(f'PHASE 26 STATIC READINESS: FAIL ({len(errors)} blockers)')
    for e in errors: print(' -',e)
    raise SystemExit(1)
print('PHASE 26 STATIC READINESS: PASS')
print(f'warnings: {len(warnings)}')
