from pathlib import Path
root=Path(__file__).resolve().parents[1]
checks=[]
def ok(name,cond): checks.append((name,bool(cond)))
all_src='\n'.join(p.read_text(errors='ignore') for p in (root/'src').rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx'})
orders=(root/'src/pages/admin/AdminOrders.tsx').read_text()
bookings=(root/'src/pages/admin/AdminBookings.tsx').read_text()
payments=(root/'src/pages/admin/AdminPayments.tsx').read_text()
returns=(root/'src/pages/admin/AdminReturns.tsx').read_text()
fulfill=(root/'src/pages/admin/AdminFulfillment.tsx').read_text()
flags=['VITE_ORDER_BACKEND','VITE_SHIPPING_BACKEND','VITE_REFUND_BACKEND','VITE_RETURN_BACKEND','VITE_BOOKING_BACKEND','VITE_BOOKING_WRITE_BACKEND','VITE_TECHNICIAN_BACKEND','VITE_NOTIFICATION_BACKEND']
ok('migration backend switches removed', not any(x in all_src for x in flags))
ok('order mutation control limited to native legal transitions', "['confirmed','processing','cancelled'] as const" in orders)
ok('admin order list typed', 'const ordersData = await listNativeAdminOrders()' in orders and 'const ordersData: any[]' not in orders)
ok('booking list typed', 'useState<NativeBooking[]>' in bookings)
ok('booking modal refetches server truth after status', 'setViewing(await getNativeAdminBooking(id))' in bookings)
ok('booking assignment refetches server truth', 'setViewing(await getNativeAdminBooking(bookingId))' in bookings)
ok('payment orders use NativeOrder', 'type Order = NativeOrder' in payments)
ok('refund rows use NativeRefund', 'useState<NativeRefund[]>' in payments)
ok('admin refund retry key stable', 'refundKeys.get(keyId)' in payments and 'refundKeys.delete(keyId)' in payments)
ok('returns worklist typed', 'useState<NativeReturn[]>' in returns)
ok('return items typed', 'NativeReturnItem' in returns)
ok('fulfillment result typed', 'useState<FulfillmentOperationsResult>' in fulfill)
ok('fulfillment jobs typed', 'FulfillmentJob|ReplacementShipmentJob' in fulfill)
failed=[n for n,v in checks if not v]
for n,v in checks: print(('PASS' if v else 'FAIL')+': '+n)
print(f'FAPI-10: {sum(v for _,v in checks)}/{len(checks)} PASS')
raise SystemExit(1 if failed else 0)
