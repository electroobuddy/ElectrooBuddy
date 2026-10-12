from pathlib import Path
import json, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name, ok, detail=''):
    checks.append((name,bool(ok),detail))

mig=ROOT/'server/database/migrations/022_operational_readiness.sql'
check('migration 022 exists',mig.exists())
text=mig.read_text() if mig.exists() else ''
check('worker run ledger table','ops_worker_runs' in text)
check('worker lease table','ops_worker_leases' in text)
runner=(ROOT/'server/src/services/worker-runner.ts').read_text()
check('worker lease acquisition','ops_worker_leases' in runner and 'lease_until' in runner)
check('worker durable result','ops_worker_runs' in runner and "status='failed'" in runner and "status='succeeded'" in runner)
check('worker failure alert','OPS_ALERT_WEBHOOK_URL' in runner)
workers=['expire-checkouts.ts','reconcile-payments.ts','reconcile-refunds.ts','sync-shipments.ts','process-fulfillment.ts','process-notifications.ts','reconcile-subscriptions.ts']
for w in workers:
    t=(ROOT/'server/scripts'/w).read_text()
    check(f'{w} managed','runManagedWorker' in t)
route=(ROOT/'server/src/routes/ops.routes.ts').read_text()
check('ops status protected','admin:security' in route and 'authenticate' in route)
env=(ROOT/'server/src/config/env.ts').read_text()
for key in ['WORKER_LEASE_SECONDS','OPS_ALERT_WEBHOOK_URL','OPS_STALE_WORKER_MINUTES']:
    check(f'env {key}',key in env)
check('backup tool',(ROOT/'tool/ops/neon_backup.ps1').exists())
restore=(ROOT/'tool/ops/neon_restore_drill.ps1').read_text()
check('restore production guard','TargetDatabaseUrl -eq $env:DATABASE_URL' in restore)
check('restore checksum verification','Get-FileHash' in restore)
manifest=json.loads((ROOT/'server/database/contracts/migration-checksums.json').read_text())
entry=next((x for x in manifest['migrations'] if x['version']=='022_operational_readiness.sql'),None)
actual=hashlib.sha256(mig.read_bytes()).hexdigest() if mig.exists() else ''
check('migration checksum registered',bool(entry) and entry['sha256']==actual)
check('migration manifest count',manifest.get('count')==len(manifest.get('migrations',[]))==22)
check('incident runbook',(ROOT/'docs/backend/PHASE28_OPERATIONS_INCIDENT_READINESS.md').exists())
failed=[x for x in checks if not x[1]]
for name,ok,detail in checks: print(('PASS' if ok else 'FAIL'),name,detail)
print(f'PHASE 28: {len(checks)-len(failed)}/{len(checks)} checks PASS')
if failed: sys.exit(1)
print('PHASE 28 OPERATIONS READINESS: PASS')
