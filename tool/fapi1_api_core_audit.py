from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
checks = []

def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

api = (root/'src/lib/apiClient.ts').read_text(encoding='utf-8')
payment = (root/'src/lib/nativePayment.ts').read_text(encoding='utf-8')
checkout = (root/'src/pages/Checkout.tsx').read_text(encoding='utf-8')

check('shared API timeout exists', 'DEFAULT_TIMEOUT_MS' in api and 'fetchWithTimeout' in api)
check('normalized API error exists', 'class NativeApiError' in api and "code: 'NETWORK_ERROR'" in api and "code: 'REQUEST_TIMEOUT'" in api)
check('401 refresh retry retained', "response.status === 401" in api and 'refreshAccessToken()' in api)
check('payment wrapper returns parsed data', 'return nativeApiFetch<NativeRazorpayVerificationResult>' in payment)
check('payment wrapper no Response.json misuse', '.json()' not in payment)
check('checkout uses normalized API error message', 'nativeApiErrorMessage' in checkout)
check('API client regression tests exist', (root/'src/lib/__tests__/apiClient.test.ts').exists())
check('payment regression test exists', (root/'src/lib/__tests__/nativePayment.test.ts').exists())

for name, ok, detail in checks:
    print(f"{'PASS' if ok else 'FAIL'} {name}{': '+detail if detail else ''}")

failed = [name for name, ok, _ in checks if not ok]
print(f"\nFAPI-1 checks: {len(checks)-len(failed)}/{len(checks)} PASS")
if failed:
    sys.exit(1)
print('FAPI-1 API CORE + RAZORPAY REPAIR: PASS')
