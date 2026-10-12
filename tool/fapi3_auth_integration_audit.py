from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
checks=[]

def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

api=(ROOT/'src/lib/apiClient.ts').read_text()
app=(ROOT/'src/App.tsx').read_text()
auth=(ROOT/'src/hooks/useAuth.tsx').read_text()
server=(ROOT/'server/src/routes/auth.routes.ts').read_text()
userauth=(ROOT/'src/pages/user/UserAuth.tsx').read_text()

for endpoint, fn in [
    ('/auth/password-reset/request','nativeRequestPasswordReset'),
    ('/auth/password-reset/confirm','nativeConfirmPasswordReset'),
    ('/auth/email-verification/resend','nativeResendEmailVerification'),
    ('/auth/email-verification/verify','nativeVerifyEmail'),
    ('/auth/logout-all','nativeLogoutAll'),
]:
    check(f'client {fn}', endpoint in api and f'function {fn}' in api)
    check(f'server route {endpoint}', endpoint.replace('/auth','') in server)

for route, file in [
    ('/forgot-password','src/pages/user/ForgotPassword.tsx'),
    ('/reset-password','src/pages/user/ResetPassword.tsx'),
    ('/verify-email','src/pages/user/VerifyEmail.tsx'),
]:
    check(f'route {route}', f'path="{route}"' in app)
    check(f'page {file}', (ROOT/file).exists())

check('auth context exposes logout-all', 'signOutAll' in auth and 'refreshUser' in auth)
check('auth context is native-only', 'nativeReady' not in auth and 'backend:' not in auth and 'session:' not in auth)
check('frontend consumers have no migration auth flags', all(x not in '\n'.join(p.read_text(errors='ignore') for p in (ROOT/'src').rglob('*.tsx') if p.is_file()) for x in ['nativeReady', 'backend !== \'express\'']))
check('login links forgot password', '/forgot-password' in userauth)
check('login can direct email verification', '/verify-email' in userauth)
check('profile has logout-all', 'signOutAll' in (ROOT/'src/pages/user/UserProfile.tsx').read_text())
check('technician security uses real reset API', 'nativeRequestPasswordReset' in (ROOT/'src/pages/technician/TechnicianSettings.tsx').read_text())

failed=[c for c in checks if not c[1]]
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL'), name, detail)
print(f'FAPI-3 checks: {len(checks)-len(failed)}/{len(checks)} PASS')
if failed:
    sys.exit(1)
print('FAPI-3 AUTH INTEGRATION: PASS')
