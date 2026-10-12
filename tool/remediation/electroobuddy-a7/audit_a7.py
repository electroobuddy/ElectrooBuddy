#!/usr/bin/env python3
"""Read-only repository audit for ElectrooBuddy operations controls."""
from pathlib import Path
import json, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
checks=[]
def inspect(path, name, predicate, remediation):
    p=root/path
    if not p.is_file():
        checks.append({'check':name,'status':'FAIL','detail':f'Missing {path}','remediation':remediation})
        return
    data=p.read_text(encoding='utf-8')
    passed=predicate(data)
    checks.append({'check':name,'status':'PASS' if passed else 'FAIL','detail':str(path),'remediation':None if passed else remediation})
inspect('server/scripts/db-migrate.ts','migration checksums',lambda t:'checksum' in t and 'schema_migrations' in t and 'pg_advisory_lock' in t,'Enforce immutable migration checksums and serial migration runner.')
inspect('server/scripts/db-status.ts','drift returns nonzero',lambda t: 'process.exitCode' in t or 'process.exit(1)' in t,'Make pending/drift return nonzero in strict CI mode.')
inspect('server/src/services/worker-runner.ts','worker lease protection',lambda t:'ops_worker_leases' in t and 'lease_until' in t,'Ensure worker leases are acquired atomically.')
inspect('server/src/services/worker-runner.ts','lease heartbeat or enforced max runtime',lambda t:'heartbeat' in t.lower() or 'renewlease' in t.lower() or 'MAX_WORKER_RUNTIME' in t,'Add lease renewal/fencing or enforce worker deadline below lease expiry.')
inspect('tool/ops/neon_backup.ps1','backup checksum manifest',lambda t:'Get-FileHash' in t and 'pg_dump' in t,'Write a SHA256 manifest beside a custom-format backup.')
inspect('tool/ops/neon_restore_drill.ps1','restore checksum',lambda t:'Get-FileHash' in t and 'pg_restore' in t,'Verify backup checksum before restoring.')
inspect('tool/ops/neon_restore_drill.ps1','explicit disposable-target confirmation',lambda t:'TargetDatabaseName' in t or 'ConfirmDisposable' in t or 'ExpectedDatabase' in t,'Require an explicit disposable database identity and compare resolved database/server identity; never rely on raw URL equality.')
for c in checks:
    print(f"{c['status']:4} {c['check']}: {c['detail']}")
failed=sum(c['status']=='FAIL' for c in checks)
(root/'a7-audit-results.json').write_text(json.dumps({'checks':checks,'failed':failed},indent=2),encoding='utf-8') if (root/'server').exists() else None
sys.exit(1 if failed else 0)
