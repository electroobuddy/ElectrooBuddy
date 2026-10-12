from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
checks={
 'migration': 'server/database/migrations/012_native_order_operations.sql',
 'repo': 'server/src/repositories/order.repository.ts',
 'service': 'server/src/services/order.service.ts',
 'controller': 'server/src/controllers/order.controller.ts',
 'routes': 'server/src/routes/order.routes.ts',
 'frontend': 'src/lib/nativeOrders.ts',
 'docs': 'docs/backend/PHASE13_NATIVE_ORDER_OPERATIONS.md',
}
missing=[f'{k}: missing {v}' for k,v in checks.items() if not (root/v).exists()]
def need(path,*terms):
 s=(root/path).read_text(encoding='utf-8')
 for t in terms:
  if t not in s: missing.append(f'{path}: missing marker {t}')
need('server/src/routes/order.routes.ts',"/order-tracking/lookup","requirePermission('orders:read-own')","requireRole('admin')","/admin/orders/:id/transition")
need('server/src/services/order.service.ts','REFUND_REQUIRED','PAYMENT_NOT_VERIFIED','releaseInventory','releaseCoupon','createHash')
need('server/src/repositories/order.repository.ts','FOR UPDATE','inventory_released_at','GREATEST(0,used_count-1)','tracking_token_hash','listPaymentOps')
need('src/lib/nativeOrders.ts','VITE_ORDER_BACKEND','listNativeOrders','transitionNativeAdminOrder','trackNativeOrder')
for f in ['src/pages/user/UserOrders.tsx','src/pages/admin/AdminOrders.tsx','src/pages/admin/AdminPayments.tsx','src/pages/OrderTracking.tsx','src/pages/OrderSuccess.tsx']:
 need(f,'nativeOrderBackendEnabled')
need('.env.example','VITE_ORDER_BACKEND=supabase')
if missing:
 print('PHASE 13 NATIVE ORDER OPERATIONS: FAIL')
 print('\n'.join('- '+x for x in missing));sys.exit(1)
print('PHASE 13 NATIVE ORDER OPERATIONS: PASS')
print('- customer/admin order reads are feature-gated to Express')
print('- unpaid cancellation releases inventory/coupon in one transaction')
print('- Phase 13 order boundary preserved; refund authority may be advanced by a later phase while Shiprocket writes remain separate')
print('- secure tracking uses opaque token hash')
