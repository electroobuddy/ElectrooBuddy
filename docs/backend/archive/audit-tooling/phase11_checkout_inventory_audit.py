from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
required=[
 'server/database/migrations/010_native_commerce_checkout.sql','server/src/services/checkout.service.ts','server/src/repositories/checkout.repository.ts','server/src/controllers/checkout.controller.ts','server/src/routes/checkout.routes.ts','server/src/providers/razorpay-payment.provider.ts','server/scripts/expire-checkouts.ts','src/lib/nativeCheckout.ts'
]
missing=[p for p in required if not (root/p).exists()]
if missing:
 print('PHASE 11 NATIVE CHECKOUT: FAIL missing',*missing,sep='\n');sys.exit(1)
svc=(root/'server/src/services/checkout.service.ts').read_text()
repo=(root/'server/src/repositories/checkout.repository.ts').read_text()
page=(root/'src/pages/Checkout.tsx').read_text()
checks={
 'row_lock_products':'FOR UPDATE OF p' in repo,
 'idempotency_lock':'pg_advisory_xact_lock' in svc,
 'inventory_decrement':'inventory_quantity=inventory_quantity-$2' in repo,
 'inventory_release':'inventory_quantity=inventory_quantity+$2' in repo,
 'expiry_skip_locked':'SKIP LOCKED' in repo,
 'coupon_locked':'FOR UPDATE' in repo and 'coupons' in repo,
 'razorpay_creation':'RazorpayPaymentProvider' in (root/'server/src/providers/razorpay-payment.provider.ts').read_text(),
 'payment_verification_boundary_preserved':('Payment verification is not enabled until Phase 12' in (root/'server/src/providers/razorpay-payment.provider.ts').read_text()) or (root/'server/src/services/payment.service.ts').exists(),
 'frontend_feature_gate':'VITE_CHECKOUT_BACKEND' in page,
 'frontend_native_razorpay_boundary':('remains on Supabase until Phase 12' in page) or ('verifyNativeRazorpayPayment' in page),
}
failed=[k for k,v in checks.items() if not v]
if failed:
 print('PHASE 11 NATIVE CHECKOUT: FAIL',failed);sys.exit(1)
print('PHASE 11 NATIVE COMMERCE CHECKOUT + INVENTORY: PASS')
print('native_checkout_api: implemented + feature-gated')
print('inventory_reservation: row-locked + compensating release')
print('razorpay_order_creation: implemented')
print('razorpay_payment_verification: phase boundary preserved or advanced by later phase')
print('production_frontend_cutover: controlled by VITE_CHECKOUT_BACKEND')
