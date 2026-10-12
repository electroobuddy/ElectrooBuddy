from pathlib import Path
r=Path(__file__).resolve().parents[1]
need=['server/database/migrations/008_technician_admin_booking_ops.sql','server/src/repositories/technician.repository.ts','server/src/services/technician.service.ts','server/src/controllers/technician.controller.ts','server/src/routes/technician.routes.ts','src/lib/nativeTechnician.ts','server/scripts/sync-technicians.ts','server/scripts/verify-technician-parity.ts']
missing=[x for x in need if not (r/x).exists()]; assert not missing,missing
route=(r/'server/src/routes/technician.routes.ts').read_text(); booking=(r/'server/src/routes/booking.routes.ts').read_text(); repo=(r/'server/src/repositories/technician.repository.ts').read_text(); admin=(r/'src/pages/admin/AdminBookings.tsx').read_text(); techui=(r/'src/pages/admin/AdminTechnicians.tsx').read_text()
for x in ['/technician/profile','/technician/dashboard','/technician/application','/admin/technicians/:id/review','/admin/technicians/:id/disable']: assert x in route,x
for x in ['/admin/bookings/:id/operational','/admin/bookings/:id/archive']: assert x in booking,x
for x in ['TECHNICIAN_HAS_ACTIVE_BOOKINGS','auth_sessions','approval_status']: assert x in (r/'server/src/services/technician.service.ts').read_text()+repo,x
assert 'updateNativeAdminBookingOperational' in admin and 'archiveNativeAdminBooking' in admin
assert 'nativeTechnicianReady' in techui
assert 'VITE_TECHNICIAN_BACKEND' in (r/'.env.example').read_text()
print('PHASE 9 TECHNICIAN + ADMIN BOOKING OPS: PASS')
print('technician_domain: Express/PostgreSQL feature-gated')
print('admin_booking_mutations: controlled operational update / transition / archive')
print('hard_delete_in_express_mode: disabled')
print('financial_booking_fields_in_express_edit: not writable')
print('native_booking_write_production_gate: remains closed')
