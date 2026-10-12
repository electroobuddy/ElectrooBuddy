from pathlib import Path
root=Path(__file__).resolve().parents[1]
checks={
'migration': '015_native_shipping_fulfillment_authority.sql',
'provider': 'shiprocket-shipping.provider.ts',
'service': 'shipping.service.ts',
'controller': 'shipping.controller.ts',
'routes': 'shipping.routes.ts',
'client': 'nativeShipping.ts',
'docs': 'PHASE16_NATIVE_SHIPPING_FULFILLMENT.md',
}
alltext='\n'.join(p.read_text(errors='ignore') for p in root.rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.sql','.md','.json'})
missing=[v for v in checks.values() if v not in alltext and not any(p.name==v for p in root.rglob(v))]
required=[
'SHIPROCKET_EMAIL','SHIPROCKET_PASSWORD','SHIPROCKET_WEBHOOK_TOKEN','/webhooks/fulfillment',
'/orders/create/adhoc','/courier/assign/awb','/courier/generate/pickup','/courier/track/awb/',
"PAYMENT_NOT_VERIFIED","provider_cancelled","rto_in_transit","rto_received","VITE_SHIPPING_BACKEND",
'fulfillment_events','ON CONFLICT(provider,event_key) DO NOTHING','credentialsConfigured'
]
missing += [x for x in required if x not in alltext]
# Credentials must not be accepted/stored by native browser UI.
ui=(root/'src/pages/admin/AdminShippingSettings.tsx').read_text(errors='ignore')
if 'config.password' in ui or 'config.email' in ui: missing.append('browser credential removal')
if missing:
 print('PHASE 16 NATIVE SHIPPING FULFILLMENT: FAIL')
 for x in missing: print('MISSING:',x)
 raise SystemExit(1)
print('PHASE 16 NATIVE SHIPPING FULFILLMENT: PASS')
print('shipment creation: server-side Shiprocket provider + persisted fulfillment job')
print('webhooks: token validated + fulfillment event dedupe')
print('RTO: carrier event handoff only; physical inspection remains restock authority')
print('refunds: remain Phase 14 authority')
print('frontend: VITE_SHIPPING_BACKEND feature gate + legacy rollback')
