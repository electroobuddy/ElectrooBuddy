from pathlib import Path
import re,sys
R=Path(__file__).resolve().parents[1]
failed=[]
front=[]; rpcs=set(); edge=set(); consumers=[]
for p in (R/'src').rglob('*'):
    if not p.is_file() or p.suffix not in {'.ts','.tsx','.js','.jsx'}: continue
    t=p.read_text(errors='ignore')
    if 'supabase' in t or '@supabase' in t: consumers.append(p)
    rpcs.update(m.group(1) for m in re.finditer(r"\.rpc\(\s*['\"]([^'\"]+)",t))
    edge.update(m.group(1) for m in re.finditer(r"functions\.invoke\(\s*['\"]([^'\"]+)",t))
retired_rpc={
'admin_archive_order','admin_get_technicians','admin_transition_order','cancel_own_order','create_notification_v2',
'create_return_request','get_active_coupons','inspect_return','mark_all_notifications_read','mark_notification_read',
'public_order_tracking','review_technician_application'}
retired_edge={'create-commerce-checkout','create-shiprocket-order','create-technician-by-admin','process-return-resolution','reconcile-order-refunds','request-order-refund','send-fcm-notification','send-push-notification','verify-commerce-payment'}
if rpcs: failed.append('frontend RPC callers remain: '+', '.join(sorted(rpcs)))
if edge: failed.append('frontend Edge Function callers remain: '+', '.join(sorted(edge)))
checks={
'native orders':('src/lib/nativeOrders.ts',['/orders/','/admin/orders/','/order-tracking/lookup']),
'native returns':('src/lib/nativeReturns.ts',['/orders/${input.orderId}/returns','/admin/returns/${id}/inspect','/admin/returns/${id}/resolve']),
'native refunds':('src/lib/nativeRefunds.ts',['/orders/${input.orderId}/refunds','/admin/refunds/reconcile']),
'native technician':('src/lib/nativeTechnician.ts',['/admin/technicians','/review']),
'native notification':('src/lib/nativeNotifications.ts',["'/notifications'","'/admin/notifications/send'"]),
'native checkout':('src/lib/nativeCheckout.ts',["'/checkout'"]),
'coupon admin':('server/src/repositories/admin-catalog.repository.ts',["coupons:{table:'coupons'"]),
}
for name,(f,needles) in checks.items():
    p=R/f
    if not p.exists(): failed.append(f'{name}: missing {f}'); continue
    t=p.read_text(errors='ignore')
    for n in needles:
        if n not in t: failed.append(f'{name}: missing {n}')
if failed:
    print('PHASE 22 RPC/EDGE RETIREMENT: FAIL')
    print('\n'.join(' - '+x for x in failed));sys.exit(1)
print('PHASE 22 RPC/EDGE RETIREMENT: PASS')
print('retired frontend RPC names: 12/12')
print('retired frontend Edge Function names: 9/9')
print('frontend RPC callers: 0')
print('frontend Edge Function callers: 0')
print(f'scanner-visible direct Supabase consumers remaining: {len(consumers)}')
