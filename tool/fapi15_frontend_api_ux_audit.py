from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]

def read(rel): return (ROOT / rel).read_text(encoding='utf-8')
checks=[]
def check(name, ok):
    checks.append((name, bool(ok)))

api_state=read('src/components/ApiState.tsx')
mutation=read('src/components/MutationButton.tsx')
public=read('src/components/PublicApiState.tsx')
app=read('src/App.tsx')
cart=read('src/pages/Cart.tsx')
checkout=read('src/pages/Checkout.tsx')
orders=read('src/pages/user/UserOrders.tsx')
tech=read('src/pages/technician/TechnicianBookings.tsx')
ops=read('src/pages/admin/AdminOperations.tsx')
online=read('src/hooks/useOnlineStatus.ts')

check('online/offline hook listens to browser connectivity', "addEventListener('online'" in online and "addEventListener('offline'" in online)
check('global offline banner is mounted', 'OfflineBanner' in app and '<OfflineBanner />' in app)
check('shared ApiState supports loading', 'loadingLabel' in api_state and 'Loader2' in api_state)
check('shared ApiState supports error + retry', 'onRetry' in api_state and 'nativeApiErrorMessage' in api_state)
check('shared ApiState supports explicit empty state', 'emptyTitle' in api_state and 'emptyMessage' in api_state)
check('shared ApiState distinguishes offline failures', 'You are offline' in api_state and 'NETWORK_ERROR' in api_state)
check('MutationButton blocks duplicate submits', 'pending ||' in mutation and 'aria-busy' in mutation)
check('MutationButton blocks online-required mutations while offline', 'requireOnline' in mutation and '!online' in mutation)
check('public API state delegates to unified ApiState', '<ApiState' in public)
check('cart consumes loading/error/refetch/mutation context', 'loading: cartLoading' in cart and 'error: cartError' in cart and 'refreshCart' in cart and 'mutating' in cart)
check('cart uses standardized API states', '<ApiState loading' in cart and 'errorTitle="Could not load your cart"' in cart)
check('cart checkout action uses MutationButton', '<MutationButton' in cart and 'pending={mutating}' in cart)
check('checkout pricing failure uses standardized API state', 'errorTitle="Pricing unavailable"' in checkout and '<ApiState' in checkout)
check('checkout submit uses MutationButton', '<MutationButton' in checkout and 'pending={loading}' in checkout and 'Place Order' in checkout)
check('user orders persist load errors for retry UI', 'loadError' in orders and 'setLoadError(error)' in orders)
check('user orders use standardized load/error/empty states', 'Loading your orders' in orders and 'Could not load your orders' in orders and 'emptyTitle="No orders yet"' in orders)
check('post-purchase mutations have a page-level duplicate-submit guard', 'busyAction' in orders and 'if (busyAction) return' in orders)
check('post-purchase actions use MutationButton progress states', orders.count('<MutationButton') >= 4)
check('technician bookings use standardized API state + mutation progress', '<ApiState' in tech and tech.count('<MutationButton') >= 2)
check('operations dashboard uses standardized API state + mutation progress', '<ApiState' in ops and ops.count('<MutationButton') >= 3)

package=json.loads(read('package.json'))
check('package exposes FAPI-15 audit command', package.get('scripts',{}).get('audit:fapi15') == 'python tool/fapi15_frontend_api_ux_audit.py')

passed=sum(ok for _,ok in checks)
for name,ok in checks:
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'FAPI-15: {passed}/{len(checks)} PASS')
if passed != len(checks): sys.exit(1)
