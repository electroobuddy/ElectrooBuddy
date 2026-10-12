from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
checks=[]
def add(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

def text(path): return (root/path).read_text(encoding='utf-8')
cart=text('src/contexts/CartContext.tsx')
api=text('src/lib/cartApi.ts')
profile=text('src/pages/user/UserProfile.tsx')
details=text('src/pages/ProductDetails.tsx')
cartpage=text('src/pages/Cart.tsx')
account=text('src/lib/accountApi.ts')
add('cart mutations use cart-line IDs', 'nativeCart.remove(cartLineId)' in cart and 'nativeCart.quantity(cartLineId, quantity)' in cart and 'updateQuantity(item.id' in cartpage and 'removeFromCart(item.id' in cartpage)
add('server cart mutations serialized', 'mutationQueue' in cart and 'runServerMutation' in cart)
add('auth identity guards stale cart responses', 'identityRef.current === identity' in cart and 'setItems(user ? [] : readGuestCart())' in cart)
add('guest cart parsing is defensive', 'function readGuestCart()' in cart and 'JSON.parse' in cart and 'localStorage.removeItem(GUEST_CART_KEY)' in cart)
add('guest cart mutations use functional state', 'saveGuest(current =>' in cart)
add('cart exposes retryable load errors', 'refreshCart' in cart and 'error: string | null' in cart and 'Try again' in cartpage)
add('cart quantity constrained to backend range', 'Math.min(99' in cart)
add('wishlist API is typed', 'NativeWishlistItem' in api and 'nativeApiFetch<NativeWishlistItem[]>' in api and 'any[]' not in api)
add('wishlist stale loads are guarded', 'let active = true' in details and 'wishlistLoading' in details)
add('wishlist optimistic mutation rolls back', 'setWishlisted(!wasWishlisted)' in details and 'setWishlisted(wasWishlisted)' in details)
add('profile address form is typed', 'useState<ShippingAddressInput>' in profile and 'useState<any>' not in profile)
add('profile uses normalized API errors', 'nativeApiErrorMessage' in profile and 'catch(e:any)' not in profile)
add('profile stale loads are guarded', 'loadGeneration' in profile)
add('profile has retry state', 'Could not load your profile' in profile and 'Try again' in profile)
add('address mutations rollback on failure', 'setAddresses(previous)' in profile)
add('address API has enum contract', "export type AddressType = 'home' | 'work' | 'other'" in account)
add('product add-to-cart awaits mutation', 'await addToCart(product, quantity, false)' in details)
# active source should not target cart variants by product id
active_files=[root/'src/contexts/CartContext.tsx', root/'src/pages/Cart.tsx']
joined='\n'.join(p.read_text(encoding='utf-8') for p in active_files)
add('no active product-id cart line mutation', not re.search(r'(removeFromCart|updateQuantity|toggleInstallation)\(item\.product_id', joined))
failed=[c for c in checks if not c[1]]
for name,ok,detail in checks: print(('PASS' if ok else 'FAIL')+': '+name+((' — '+detail) if detail else ''))
print(f'FAPI-5 checks: {len(checks)-len(failed)}/{len(checks)} PASS')
sys.exit(1 if failed else 0)
