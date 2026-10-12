from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
TEST_DIR = ROOT / 'src/lib/__tests__/integration'
expected = {
    'authSession.integration.test.ts': ['nativeLogin', '/auth/refresh', 'nativeLogout'],
    'bookingApi.integration.test.ts': ['/bookings/quote', '/bookings', '/technician/bookings/', '/admin/bookings/'],
    'checkoutPostPurchase.integration.test.ts': ['Idempotency-Key', '/payments/razorpay/verify', '/lifecycle', '/refunds', '/returns'],
    'technicianNotifications.integration.test.ts': ['/technician/application', '/technician/dashboard', '/notification-preferences', '/push-subscriptions/fcm', '/retry'],
    'sessionIsolation.integration.test.ts': ['clearPrivateQueryCache', 'electroobuddy_fcm_owner', 'unsubscribeFromPush'],
    'adminOperations.integration.test.ts': ['/admin/ops/status', '/admin/orders/', '/admin/returns/', '/admin/notifications/process'],
}
checks=[]
def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

check('integration test directory exists', TEST_DIR.is_dir())
for name, needles in expected.items():
    p=TEST_DIR/name
    check(f'{name} exists', p.is_file())
    if p.is_file():
        text=p.read_text(encoding='utf-8')
        check(f'{name} has executable tests', bool(re.search(r'\b(it|test)\s*\(', text)))
        check(f'{name} is not skipped', not re.search(r'\b(?:describe|it|test)\.skip\s*\(', text))
        for needle in needles:
            check(f'{name} covers {needle}', needle in text)

pkg=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
scripts=pkg.get('scripts',{})
check('test:integration script present', scripts.get('test:integration') == 'vitest run src/lib/__tests__/integration')
check('audit:fapi16 script present', scripts.get('audit:fapi16') == 'python tool/fapi16_integration_tests_audit.py')
check('certify:fapi16 chains audit and tests', scripts.get('certify:fapi16') == 'npm run audit:fapi16 && npm run test:integration')

# Guard the most important test infrastructure contracts.
vitest=(ROOT/'vitest.config.ts').read_text(encoding='utf-8')
check('Vitest runs in jsdom', 'environment: "jsdom"' in vitest or "environment: 'jsdom'" in vitest)
check('Vitest setup file configured', 'src/test/setup.ts' in vitest)
setup=(ROOT/'src/test/setup.ts').read_text(encoding='utf-8')
check('jest-dom matchers configured', '@testing-library/jest-dom' in setup)

passed=sum(ok for _,ok,_ in checks)
print(f'FAPI-16 integration-test audit: {passed}/{len(checks)} PASS')
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL'), '-', name, (f'({detail})' if detail else ''))
if passed != len(checks):
    sys.exit(1)
