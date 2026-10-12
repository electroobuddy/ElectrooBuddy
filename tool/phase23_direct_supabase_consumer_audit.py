#!/usr/bin/env python3
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'

def files():
    for p in SRC.rglob('*'):
        if p.is_file() and p.suffix in {'.ts','.tsx'} and 'integrations/supabase' not in p.as_posix():
            yield p

patterns={
    'supabase_client_import': re.compile(r'integrations/supabase/client|@supabase/supabase-js'),
    'direct_supabase_runtime': re.compile(r'\bsupabase\s*\.\s*(?:from|auth|storage|channel|rpc|functions)\b',re.S),
    'edge_invoke': re.compile(r'\.functions\s*\.\s*invoke\s*\(|functions\s*\.\s*invoke\s*\(',re.S),
    'rpc_call': re.compile(r'\.rpc\s*\(',re.S),
}
violations={k:[] for k in patterns}
for p in files():
    text=p.read_text(encoding='utf-8',errors='ignore')
    for name,rx in patterns.items():
        if rx.search(text): violations[name].append(str(p.relative_to(ROOT)))

required=[
 'server/src/routes/admin-operations.routes.ts',
 'server/src/routes/technician.routes.ts',
 'server/src/routes/notification.routes.ts',
 'src/lib/nativeAdminOperations.ts',
 'src/lib/nativeTechnician.ts',
 'src/lib/nativeNotifications.ts',
]
missing=[x for x in required if not (ROOT/x).exists()]
checks={
 'public testimonial endpoint': ('server/src/routes/admin-operations.routes.ts', '/public/testimonials'),
 'admin site settings endpoint': ('server/src/routes/admin-operations.routes.ts', '/admin/site-settings'),
 'public stats endpoint': ('server/src/routes/admin-operations.routes.ts', '/public/stats'),
 'technician booking history endpoint': ('server/src/routes/technician.routes.ts', '/admin/technicians/:id/bookings'),
 'FCM status endpoint': ('server/src/routes/notification.routes.ts', '/push-subscriptions/fcm/status'),
}
missing_contract=[]
for label,(f,needle) in checks.items():
    if needle not in (ROOT/f).read_text(encoding='utf-8',errors='ignore'): missing_contract.append(label)

print('=== Phase 23 Direct Supabase Consumer Retirement Audit ===')
print(f"frontend Supabase client imports: {len(violations['supabase_client_import'])}")
print(f"frontend direct table/auth/storage/realtime/RPC runtime calls: {len(violations['direct_supabase_runtime'])}")
print(f"frontend RPC callers: {len(violations['rpc_call'])}")
print(f"frontend Edge Function invocations: {len(violations['edge_invoke'])}")
print(f"missing required files: {len(missing)}")
print(f"missing native endpoint contracts: {len(missing_contract)}")
for k,v in violations.items():
    for f in v: print(f'FAIL {k}: {f}')
for x in missing: print(f'FAIL missing file: {x}')
for x in missing_contract: print(f'FAIL missing contract: {x}')
failed=any(violations.values()) or missing or missing_contract
print('PHASE 23:', 'FAIL' if failed else 'PASS')
sys.exit(1 if failed else 0)
