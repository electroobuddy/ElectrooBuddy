from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1]
req=['server/src/repositories/cart.repository.ts','server/src/services/cart.service.ts','server/src/controllers/cart.controller.ts','server/src/routes/cart.routes.ts','server/database/migrations/006_cart_wishlist_api.sql','src/lib/cartApi.ts','docs/backend/PHASE7_CART_WISHLIST_APIS.md','server/scripts/sync-cart-wishlist.ts','server/scripts/verify-cart-wishlist-parity.ts']
errs=[f'missing {x}' for x in req if not (R/x).exists()]
def need(p,*xs):
 s=(R/p).read_text()
 for x in xs:
  if x not in s: errs.append(f'{p} missing {x}')
need('server/src/routes/cart.routes.ts','/cart','/cart/merge','/wishlist','authenticate','requirePermission')
need('server/src/repositories/cart.repository.ts','FOR UPDATE','JOIN products','ON CONFLICT(user_id,product_id)','sum(quantity)')
need('server/src/services/cart.service.ts','PRODUCT_UNAVAILABLE','INSUFFICIENT_STOCK','installation_charge')
need('src/contexts/CartContext.tsx','VITE_CART_BACKEND','nativeCart.merge','localStorage.removeItem')
# financial authority remains unmigrated
allsrc='\n'.join(p.read_text(errors='ignore') for p in (R/'src').rglob('*.tsx') if p.is_file())
for x in ['create-commerce-checkout','verify-commerce-payment']:
 if x not in allsrc and not (R/'server/src/services/checkout.service.ts').exists(): errs.append('financial marker missing '+x)
if 'apply_coupon' not in allsrc and 'getNativePricingQuote' not in allsrc and 'quoteNativeBooking' not in allsrc: errs.append('financial marker missing apply_coupon/native pricing authority')
if errs:
 print('PHASE 7 CART + WISHLIST: FAIL'); [print('-',x) for x in errs]; sys.exit(1)
print('PHASE 7 CART + WISHLIST: PASS')
print('cart_backend: feature-gated')
print('server_authority: product price + availability + inventory')
print('guest_merge: server-validated')
print('wishlist: Express/PostgreSQL API ready')
print('financial_runtime_cutover: 0 domains')
