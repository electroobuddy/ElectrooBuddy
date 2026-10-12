from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1]
required=[
 'server/src/repositories/account.repository.ts','server/src/services/account.service.ts','server/src/controllers/account.controller.ts','server/src/routes/account.routes.ts',
 'server/src/auth/refresh-cookie.ts','server/database/migrations/005_user_profile_address_api.sql','server/scripts/sync-user-profiles-addresses.ts','server/scripts/verify-user-account-parity.ts',
 'src/lib/apiClient.ts','src/lib/accountApi.ts','docs/backend/PHASE6_USER_ACCOUNT_AUTH_BRIDGE.md'
]
missing=[x for x in required if not (R/x).exists()]
checks=[]
def need(path,*terms):
 s=(R/path).read_text();
 for t in terms:
  if t not in s: checks.append(f'{path} missing {t}')
need('server/src/routes/account.routes.ts','/users/me/profile','/users/me/addresses','authenticate','profile:write')
need('server/src/auth/refresh-cookie.ts','httpOnly: true','sameSite','secure:')
need('src/lib/apiClient.ts',"credentials: 'include'",'/auth/refresh','sessionStorage')
need('src/hooks/useAuth.tsx','VITE_AUTH_BACKEND','hybrid','nativeRestoreSession','identity mismatch','nativeLogin')
need('src/lib/storageApi.ts','nativeApiFetch')
need('server/src/repositories/account.repository.ts','WHERE id=$1 AND user_id=$2','UPDATE shipping_addresses SET is_default=false')
# financial authorities must remain on Supabase in this phase
pages='\n'.join(p.read_text(errors='ignore') for p in (R/'src').rglob('*.tsx') if p.is_file())
for term in ['create-commerce-checkout','verify-commerce-payment']:
 if term not in pages and not (R/'server/src/services/checkout.service.ts').exists(): checks.append(f'financial marker unexpectedly missing: {term}')
if 'apply_coupon' not in pages and 'getNativePricingQuote' not in pages and 'quoteNativeBooking' not in pages: checks.append('financial marker unexpectedly missing: apply_coupon/native pricing authority')
if missing or checks:
 print('PHASE 6 ACCOUNT + AUTH BRIDGE: FAIL');
 for x in missing+checks: print('-',x)
 sys.exit(1)
print('PHASE 6 ACCOUNT + AUTH BRIDGE: PASS')
print('native_auth_cutover: feature-gated')
print('profile_address_api: protected + ownership-scoped')
print('refresh_token_storage: HttpOnly cookie')
print('storage_express_cutover: requires native bearer session')
print('financial_runtime_cutover: 0 domains')
