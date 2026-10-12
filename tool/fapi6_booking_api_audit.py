from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name, cond, detail=''):
    checks.append((name,bool(cond),detail))
def text(path): return (ROOT/path).read_text(encoding='utf-8')
form=text(Path('src/pages/BookingForm.tsx'))
request=text(Path('src/components/Requestservicesection.tsx'))
detail=text(Path('src/pages/BookingDetails.tsx'))
tracking=text(Path('src/pages/BookingTracking.tsx'))
user=text(Path('src/pages/user/UserBookings.tsx'))
tech=text(Path('src/pages/technician/TechnicianBookings.tsx'))
contracts=text(Path('src/lib/apiContracts.ts'))
native=text(Path('src/lib/nativeBooking.ts'))
server=text(Path('server/src/services/booking.service.ts'))

check('BookingForm uses booking quote endpoint', 'quoteNativeBooking' in form and 'bookingQuote' in form)
check('RequestService uses booking quote endpoint', 'quoteNativeBooking' in request and 'bookingQuote' in request)
check('BookingForm removed local discount arithmetic', 'calculateDiscount' not in form and 'totalDiscount' not in form)
check('RequestService removed local discount arithmetic', 'totalDiscount' not in request and 'Math.round(base' not in request)
check('BookingForm requotes before create', 'latestQuote = await refreshBookingQuote' in form)
check('RequestService requotes before create', 'latestQuote = await refreshBookingQuote' in request)
check('BookingForm sends server quote inputs', 'useSubscription: Boolean(activeSubscription)' in form and 'useFreeServiceCall: Boolean(useFreeServiceCall)' in form)
check('RequestService sends server quote inputs', 'useSubscription: Boolean(activeSubscription)' in request and 'useFreeServiceCall: Boolean(useFreeServiceCall)' in request)
check('Server chooses one best benefit', "selected:'coupon'|'subscription'|'none'" in server and 'subscriptionDiscount>=couponDiscount' in server)
check('Booking tracking is typed', 'useState<NativeBooking|null>' in tracking)
check('Booking detail is typed', 'useState<NativeBooking | null>' in detail)
check('User booking list is typed', 'useState<NativeBooking[]>' in user)
check('Technician booking list is typed', 'useState<NativeBooking[]>' in tech)
check('Booking detail does not fake local booking status', 'setBooking({...booking,status:' not in detail and 'setBooking({ ...booking, status:' not in detail)
check('User cancellation refetches server state', 'await cancelNativeBooking(id);\n      await loadBookings();' in user)
check('Technician transition uses returned server booking', 'const updated = await transitionNativeTechnicianBooking' in tech and '? updated : b' in tech)
check('Admin/user detail cancellation refetches', 'await cancelNativeBooking(booking.id); await loadBooking();' in detail)
check('Assign/unassign refetch booking detail', 'await assignNativeBooking' in detail and 'await loadBooking();' in detail and 'await unassignNativeBooking' in detail)
check('Booking contract contains financial benefit fields', 'subscription_benefit_used?: string | null;' in contracts and "selected_benefit: 'coupon'|'subscription'|'none';" in contracts)
check('Native booking API remains Express-backed', "'/bookings/quote'" in native and "'/bookings'" in native and "'/booking-tracking/lookup'" in native)
check('Legacy free_service_call frontend label removed', 'free_service_call' not in form and 'free_service_call' not in request and 'free_service_call' not in user)

validator=text(Path('src/utils/bookingUtils.ts'))
service_booking=text(Path('src/lib/serviceBooking.ts'))
controller=text(Path('server/src/controllers/booking.controller.ts'))
repo=text(Path('server/src/repositories/booking.repository.ts'))
check('Shared validator requires date when requested', 'requireDate && !form.preferred_date' in validator)
check('Shared validator requires time when requested', 'requireTime && !form.preferred_time' in validator)
check('Both booking forms require email/date/time', 'requireDate: true' in form and 'requireEmail: true' in form and 'requireDate: true' in request and 'requireEmail: true' in request)
check('Fan diagnostic answers sent by client', 'isSwitchWorking:form.is_switch_working' in service_booking and 'hasOldFan:form.has_old_fan' in service_booking and 'isElectricitySupplyOn:form.is_electricity_supply_on' in service_booking)
check('Fan diagnostic answers accepted by server', 'isSwitchWorking:z.string()' in controller and 'hasOldFan:z.string()' in controller and 'isElectricitySupplyOn:z.string()' in controller)
check('Fan diagnostic answers persisted', 'is_switch_working,has_old_fan,is_electricity_supply_on' in repo)

failed=[x for x in checks if not x[1]]
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL'), name, detail)
print(f'FAPI-6 checks: {len(checks)-len(failed)}/{len(checks)} PASS')
if failed:
    sys.exit(1)
print('FAPI-6 BOOKING API INTEGRATION: PASS')
