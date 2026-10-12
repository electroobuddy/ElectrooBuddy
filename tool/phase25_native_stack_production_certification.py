from pathlib import Path
import json, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; checks=[]
def need(rel, token=None):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing required file: {rel}'); return ''
    t=p.read_text(errors='ignore')
    if token and token not in t: errors.append(f'{rel}: missing {token}')
    return t

def ok(name, cond, detail=''):
    checks.append((name, bool(cond), detail))
    if not cond: errors.append(f'{name}: {detail or "failed"}')

# Phase 24 regression gate.
r=subprocess.run([sys.executable, str(ROOT/'tool/phase24_zero_supabase_production_audit.py')], cwd=ROOT, text=True, capture_output=True)
ok('phase24_zero_supabase_regression', r.returncode==0, (r.stdout+r.stderr).strip())

pkg=json.loads(need('package.json') or '{}')
scripts=pkg.get('scripts',{})
ok('production_cert_script', scripts.get('audit:backend-phase25')=='python tool/phase25_native_stack_production_certification.py')
ok('full_cert_script', 'server:verify' in scripts.get('certify:production','') and 'npm run build' in scripts.get('certify:production',''))
# Old contradictory audit commands must not stay active.
stale=[k for k in scripts if re.fullmatch(r'audit:backend-phase(?:[0-9]|1[0-9]|2[01])',k)]
ok('stale_pre_cutover_audit_commands_retired', not stale, ', '.join(stale))

# Native security boundaries.
sec=need('server/src/middleware/security.ts')
env=need('server/src/config/env.ts')
booking=need('server/src/routes/booking.routes.ts')
order=need('server/src/routes/order.routes.ts')
media=need('server/src/routes/media.routes.ts')
ok('tracking_rate_limiter_defined', 'createPublicTrackingRateLimiter' in sec and 'TRACKING_RATE_LIMITED' in sec)
ok('tracking_limits_configurable', 'TRACKING_RATE_LIMIT_WINDOW_MS' in env and 'TRACKING_RATE_LIMIT_MAX' in env)
ok('booking_tracking_rate_limited', "r.post('/booking-tracking/lookup',trackingLimit,c.track)" in booking)
ok('order_tracking_rate_limited', "r.post('/order-tracking/lookup',trackingLimit,c.track)" in order)
ok('admin_media_requires_write_permission', media.count("requirePermission('admin:write')") >= 2)

# Database migration sequence integrity.
mig=ROOT/'server/database/migrations'
files=sorted(p.name for p in mig.glob('*.sql'))
nums=[]
for f in files:
    m=re.match(r'^(\d{3})_',f)
    if m: nums.append(int(m.group(1)))
ok('migration_sequence_contiguous_from_001', nums==list(range(1,max(nums)+1)) and nums[:21]==list(range(1,22)), str(nums))
need('server/database/migrations/021_final_provider_runtime_shutdown.sql', "DEFAULT 'native'")

# Deployable source should no longer carry one-time import/freeze artifacts.
for rel in ['server/database/auth_supabase_export.example.json','docs/backend/contracts/supabase-freeze.json']:
    ok(f'retired_artifact:{rel}', not (ROOT/rel).exists(), 'still present')
archive=ROOT/'docs/backend/archive/audit-tooling'
ok('historical_audits_archived', archive.exists() and len(list(archive.glob('*.py')))>=20, 'expected archived auditors')

# Lockfile status: root is mandatory; server lock is highly recommended/CI blocking for npm ci.
ok('root_lockfile_present', (ROOT/'package-lock.json').exists())
if not (ROOT/'server/package-lock.json').exists():
    warnings.append('server/package-lock.json is missing; npm --prefix server ci cannot be used until a server lockfile is generated.')

print('=== Phase 25 Native Stack Production Certification ===')
for name,status,detail in checks:
    print(('PASS' if status else 'FAIL')+': '+name+(f' — {detail}' if detail and not status else ''))
for w in warnings: print('WARN:',w)
if errors:
    print(f'PHASE 25: FAIL ({len(errors)} blockers)')
    for e in errors: print(' -',e)
    raise SystemExit(1)
print('PHASE 25 STATIC CERTIFICATION: PASS')
print(f'warnings: {len(warnings)}')
