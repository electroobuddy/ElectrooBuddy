#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
required=[
 'server/database/migrations/002_auth_sessions_rbac.sql',
 'server/src/auth/crypto.ts','server/src/auth/jwt.ts','server/src/auth/permissions.ts',
 'server/src/repositories/auth.repository.ts','server/src/services/auth.service.ts',
 'server/src/controllers/auth.controller.ts','server/src/routes/auth.routes.ts',
 'server/src/middleware/auth.ts','server/src/providers/auth-delivery.provider.ts',
 'server/scripts/import-supabase-users.ts',
 'docs/backend/PHASE3_AUTH_SESSION_RBAC_FOUNDATION.md','docs/backend/PHASE3_SECURITY_MODEL.md'
]
for f in required:
    if not (ROOT/f).exists(): errors.append(f'missing Phase 3 artifact: {f}')

sql=(ROOT/'server/database/migrations/002_auth_sessions_rbac.sql').read_text(encoding='utf-8')
for token in ['auth_sessions','password_reset_tokens','email_verification_tokens','security_audit_events','refresh_token_hash','token_family_id']:
    if token not in sql: errors.append(f'missing auth schema token: {token}')

svc=(ROOT/'server/src/services/auth.service.ts').read_text(encoding='utf-8')
repo=(ROOT/'server/src/repositories/auth.repository.ts').read_text(encoding='utf-8')
crypto=(ROOT/'server/src/auth/crypto.ts').read_text(encoding='utf-8')
for token in ['argon2.argon2id','createOpaqueToken','sha256']:
    if token not in crypto: errors.append(f'missing crypto control: {token}')
for token in ['refresh_token_reuse','password_reset','EMAIL_NOT_VERIFIED','PASSWORD_SETUP_REQUIRED']:
    if token not in svc: errors.append(f'missing auth invariant: {token}')
if 'FOR UPDATE' not in repo: errors.append('refresh/token consumption paths must use row locks')
if "status=CASE WHEN status='disabled' THEN 'disabled' ELSE 'active' END" not in repo:
    errors.append('email verification must not reactivate disabled users')

pkg=json.loads((ROOT/'server/package.json').read_text())
for dep in ['argon2','jose','nodemailer']:
    if dep not in pkg.get('dependencies',{}): errors.append(f'missing server dependency: {dep}')

# Phase 3 must not cut over frontend auth.
frontend=(ROOT/'src')
if not (frontend/'integrations/supabase/client.ts').exists(): errors.append('Supabase frontend client unexpectedly removed')
freeze=json.loads((ROOT/'docs/backend/contracts/supabase-freeze.json').read_text())
expected=freeze.get('frontend_supabase_consumers')
# Count files with @supabase/supabase-js or integrations/supabase references, matching broad freeze intent.
consumers=[]
for p in frontend.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in {'.ts','.tsx','.js','.jsx'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    if 'integrations/supabase' in t or '@supabase/supabase-js' in t:
        consumers.append(str(p.relative_to(ROOT)))
if isinstance(expected,int) and len(consumers)!=expected:
    errors.append(f'frontend Supabase consumer freeze changed: {len(consumers)} != {expected}')

if errors:
    for e in errors: print('FAIL',e)
    sys.exit(1)
print('PHASE 3 AUTH + SESSION + RBAC FOUNDATION: PASS')
print('auth_migration: 002_auth_sessions_rbac.sql')
print('portable_roles: user, technician, admin')
print('frontend_auth_cutover: 0 domains')
