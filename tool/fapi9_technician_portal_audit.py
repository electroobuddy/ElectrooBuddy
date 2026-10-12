from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
checks=[]
def add(name, cond): checks.append((name, bool(cond)))
def text(rel): return (root/rel).read_text(encoding='utf-8')
api=text('src/lib/nativeTechnician.ts'); routes=text('server/src/routes/technician.routes.ts'); ctrl=text('server/src/controllers/technician.controller.ts'); repo=text('server/src/repositories/technician.repository.ts'); bookings=text('src/pages/technician/TechnicianBookings.tsx'); signup=text('src/pages/technician/TechnicianSignUp.tsx'); login=text('src/pages/technician/TechnicianLogin.tsx'); profile=text('src/pages/technician/TechnicianProfile.tsx'); contracts=text('src/lib/apiContracts.ts')
add('application status GET route', "r.get('/technician/application'" in routes)
add('application status client', 'getNativeTechnicianApplication' in api)
add('pending application login UX', 'approval_status === "pending"' in login)
add('rejected application login UX', 'approval_status === "rejected"' in login)
add('signup handles email verification', 'EMAIL_NOT_VERIFIED' in signup and '/verify-email?email=' in signup)
add('signup no instant-access claim', 'Instant Access' not in signup)
add('technician self update name', 'name:z.string()' in ctrl and "add('name',input.name)" in repo)
add('technician self update experience', 'experience:z.number()' in ctrl and "add('experience',input.experience)" in repo)
add('technician self update daily limit', 'dailyLimit:z.number()' in ctrl and "add('daily_limit',input.dailyLimit)" in repo)
add('typed technician profile', 'useState<NativeTechnician | null>' in profile)
add('typed technician layout', 'useState<NativeTechnician | null>' in text('src/pages/technician/TechnicianLayout.tsx'))
add('typed dashboard bookings', 'useState<NativeBooking[]>' in text('src/pages/technician/TechnicianDashboard.tsx'))
add('dashboard contract flat counters', 'total_count: number' in contracts and 'pending_count: number' in contracts)
add('assigned cannot complete directly', 'booking.status === "assigned" || booking.status === "confirmed"' in bookings and 'booking.status === "assigned" || booking.status === "pending"' not in bookings)
add('technician booking mutation lock', 'mutatingId' in bookings)
add('technician booking retry refetch', 'setRefreshNonce' in bookings and 'window.location.reload()' not in bookings)
add('profile persists editable fields', 'dailyLimit:form.daily_limit' in profile and 'experience:form.experience' in profile and 'name:form.name.trim()' in profile)
failed=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL')+': '+n)
print(f'FAPI-9 checks: {len(checks)-len(failed)}/{len(checks)} PASS')
if failed: sys.exit(1)
