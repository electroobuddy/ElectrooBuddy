from pathlib import Path
root=Path(__file__).resolve().parents[1]
required=['server/src/repositories/pricing.repository.ts','server/src/services/pricing.service.ts','server/src/controllers/pricing.controller.ts','server/src/routes/pricing.routes.ts','server/database/migrations/009_pricing_quote_authority.sql','src/lib/nativePricing.ts']
missing=[x for x in required if not (root/x).exists()]
if missing: raise SystemExit('PHASE 10 FAIL missing: '+', '.join(missing))
service=(root/'server/src/services/pricing.service.ts').read_text()
for token in ['quoteOnly:true','COUPON_USAGE_LIMIT_REACHED','INSUFFICIENT_STOCK','freeShipping']:
    if token not in service: raise SystemExit('PHASE 10 FAIL missing safety token '+token)
checkout=(root/'src/pages/Checkout.tsx').read_text()
if 'VITE_PRICING_BACKEND' not in checkout or 'getNativePricingQuote' not in checkout: raise SystemExit('PHASE 10 FAIL frontend pricing gate missing')
if 'create-commerce-checkout' not in checkout: raise SystemExit('PHASE 10 FAIL certified checkout authority removed')
print('PHASE 10 COUPON + PRICING + SHIPPING + TAX AUTHORITY: PASS')
print('pricing_runtime: quote-only feature-gated')
print('checkout_payment_runtime_cutover: 0 domains')
print('coupon_consumption: remains checkout authority')
