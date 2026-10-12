from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
required=[
 'server/database/migrations/011_razorpay_payment_authority.sql',
 'server/src/services/payment.service.ts','server/src/repositories/payment.repository.ts',
 'server/src/controllers/payment.controller.ts','server/src/routes/payment.routes.ts',
 'server/src/providers/razorpay-payment.provider.ts','server/scripts/reconcile-payments.ts',
 'src/lib/nativePayment.ts','docs/backend/PHASE12_RAZORPAY_PAYMENT_AUTHORITY.md'
]
missing=[p for p in required if not (root/p).exists()]
if missing:
 print('PHASE 12 PAYMENT AUTHORITY: FAIL missing',*missing,sep='\n');sys.exit(1)
svc=(root/'server/src/services/payment.service.ts').read_text()
repo=(root/'server/src/repositories/payment.repository.ts').read_text()
provider=(root/'server/src/providers/razorpay-payment.provider.ts').read_text()
app=(root/'server/src/app.ts').read_text()
checkout=(root/'src/pages/Checkout.tsx').read_text()
checks={
 'checkout_signature_hmac':'verifyPaymentSignature' in provider and 'timingSafeEqual' in provider,
 'webhook_raw_body':"express.raw" in app and '/webhooks/razorpay' in app,
 'webhook_signature':'verifyWebhookSignature' in provider and 'RAZORPAY_WEBHOOK_SECRET' in provider,
 'server_payment_lookup':'getPayment' in provider and '/v1/payments/' in provider,
 'amount_currency_order_match':'PAYMENT_AMOUNT_MISMATCH' in svc and 'PAYMENT_CURRENCY_MISMATCH' in svc and 'PAYMENT_ORDER_MISMATCH' in svc,
 'payment_row_lock':'FOR UPDATE' in repo and 'lockOrderForUser' in repo,
 'unique_payment_reuse_guard':'PAYMENT_ALREADY_USED' in svc and 'razorpay_payment_id' in repo,
 'coupon_consume_after_payment':'used_count=used_count+1' in repo and 'coupon_consumed_at' in repo,
 'webhook_dedup':'payment_events' in repo and 'payload_sha256' in repo,
 'reconciliation':'listOrderPayments' in provider and 'payment:reconcile' in (root/'server/package.json').read_text(),
 'frontend_native_verify':'verifyNativeRazorpayPayment' in checkout,
 'native_razorpay_unblocked':'remains on Supabase until Phase 12' not in checkout,
 'refund_boundary_preserved_or_advanced':('Refunds are not enabled until the refund phase' in provider) or ((root/'server/src/services/refund.service.ts').exists() and 'listPaymentRefunds' in provider),
}
failed=[k for k,v in checks.items() if not v]
if failed:
 print('PHASE 12 PAYMENT AUTHORITY: FAIL',failed);sys.exit(1)
print('PHASE 12 RAZORPAY PAYMENT AUTHORITY: PASS')
print('browser_verification: HMAC + provider lookup + row-locked finalization')
print('webhook_processing: raw-body signature + dedupe + provider lookup')
print('reconciliation: enabled for pending native Razorpay orders')
print('native_razorpay_frontend: enabled when VITE_CHECKOUT_BACKEND=express')
print('refund_runtime_cutover: Phase 12 boundary preserved or advanced by later phase')
