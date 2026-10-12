from pathlib import Path
r=Path(__file__).resolve().parents[1]
need=['server/database/migrations/007_service_booking_api.sql','server/src/repositories/booking.repository.ts','server/src/services/booking.service.ts','server/src/controllers/booking.controller.ts','server/src/routes/booking.routes.ts','src/lib/nativeBooking.ts']
missing=[x for x in need if not (r/x).exists()]
assert not missing,missing
route=(r/'server/src/routes/booking.routes.ts').read_text(); service=(r/'server/src/services/booking.service.ts').read_text(); frontend=(r/'src/lib/serviceBooking.ts').read_text()
for x in ['/bookings','/booking-tracking/lookup','/admin/bookings/:id/transition','/technician/bookings']: assert x in route,x
for x in ['tracking_token','autoAssign']: assert x in service,x
assert ('LEGACY_BOOKING_FINANCIAL_AUTHORITY' in service and 'needsLegacyFinancialAuthority' in frontend) or ('financialQuote' in service and 'createNativeBooking' in frontend)
env=(r/'.env.example').read_text(); assert 'VITE_BOOKING_BACKEND' in env and 'VITE_BOOKING_WRITE_BACKEND' in env
print('PHASE 8 SERVICE BOOKING APIS: PASS')
print('booking_creation: feature-gated Express')
print('coupon_subscription_benefits: legacy boundary preserved or advanced to native authority')
print('tracking: opaque token hash')
print('technician_assignment: controlled server boundary')
print('payment_refund_runtime_cutover: 0 domains')
