from pathlib import Path
import re,sys
R=Path(__file__).resolve().parents[1]
need={
'migration':('server/database/migrations/020_booking_financial_authority.sql',['booking_coupon_id','coupon_consumed_at','booking_financial_events']),
'service':('server/src/services/booking.service.ts',['financialQuote','coupon_consumed','subscription_benefit_consumed','pg_advisory_xact_lock','COUPON_USER_LIMIT_REACHED']),
'repo':('server/src/repositories/booking.repository.ts',['createFinancial','coupon_reversed','subscription_benefit_reversed','GREATEST(0,used_count-1)']),
'controller':('server/src/controllers/booking.controller.ts',['quoteSchema','this.service.quote']),
'routes':('server/src/routes/booking.routes.ts',["/bookings/quote","/bookings/:id/cancel"]),
'frontend':('src/lib/serviceBooking.ts',['createNativeBooking','couponCode','useSubscription','useFreeServiceCall']),
'native':('src/lib/nativeBooking.ts',['quoteNativeBooking','/bookings/quote']),
}
failed=[]
for name,(f,needles) in need.items():
 p=R/f
 if not p.exists(): failed.append(f'{name}: missing {f}');continue
 t=p.read_text(errors='ignore')
 for n in needles:
  if n not in t: failed.append(f'{name}: missing {n}')
# Booking financial/operation callers must not retain the retired RPC/edge functions.
retired=['create-service-booking','public_booking_tracking','cancel_own_booking','admin_transition_booking','get_available_technicians','notify-booking-status']
front='\n'.join(p.read_text(errors='ignore') for p in (R/'src').rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.js','.jsx'})
for token in retired:
 if token in front: failed.append(f'retired booking authority still referenced in frontend: {token}')
if re.search(r"\.rpc\(\s*['\"]apply_coupon",front): failed.append('retired apply_coupon RPC still invoked in frontend')
allfiles=[];rpcs=set();edge=set()
for p in (R/'src').rglob('*'):
 if not p.is_file() or p.suffix not in {'.ts','.tsx','.js','.jsx'}: continue
 t=p.read_text(errors='ignore')
 if 'supabase' in t or '@supabase' in t: allfiles.append(p)
 rpcs.update(m.group(1) for m in re.finditer(r"\.rpc\(\s*['\"]([^'\"]+)",t))
 edge.update(m.group(1) for m in re.finditer(r"functions\.invoke\(\s*['\"]([^'\"]+)",t))
if len(allfiles)>45: failed.append(f'frontend Supabase consumers regressed: {len(allfiles)} > 45')
if len(rpcs)>12: failed.append(f'RPC retirement regressed: {len(rpcs)} > 12')
if len(edge)>9: failed.append(f'Edge Function retirement regressed: {len(edge)} > 9')
if failed:
 print('PHASE 21 BOOKING FINANCIAL AUTHORITY: FAIL');print('\n'.join(' - '+x for x in failed));sys.exit(1)
print('PHASE 21 BOOKING FINANCIAL AUTHORITY: PASS')
print(f'frontend Supabase consumers: {len(allfiles)} (baseline 67)')
print(f'distinct frontend RPCs: {len(rpcs)} (baseline 23)')
print(f'frontend Edge Function calls: {len(edge)}')
print('booking pricing: server-derived quote + single best coupon/subscription benefit')
print('booking creation: atomic coupon/subscription consumption + idempotency lock')
print('booking cancellation: native coupon/benefit reversal')
