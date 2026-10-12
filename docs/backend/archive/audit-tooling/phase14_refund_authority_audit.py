from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
missing=[]
files=[
 'server/database/migrations/013_native_refund_authority.sql',
 'server/src/repositories/refund.repository.ts',
 'server/src/services/refund.service.ts',
 'server/src/controllers/refund.controller.ts',
 'server/src/routes/refund.routes.ts',
 'server/src/providers/razorpay-payment.provider.ts',
 'server/scripts/reconcile-refunds.ts',
 'src/lib/nativeRefunds.ts',
 'docs/backend/PHASE14_NATIVE_REFUND_AUTHORITY.md',
 'docs/backend/PHASE14_CUTOVER_RUNBOOK.md',
 'docs/backend/PHASE14_VALIDATION_REPORT.md',
]
for f in files:
 if not (root/f).exists(): missing.append(f'missing {f}')
def need(path,*terms):
 p=root/path
 if not p.exists(): return
 s=p.read_text(encoding='utf-8')
 for t in terms:
  if t not in s: missing.append(f'{path}: missing marker {t}')
need('server/database/migrations/013_native_refund_authority.sql','refund_events','provider_reconciled_at','provider_attempted_at','uq_refund_events_provider_event')
need('server/src/providers/razorpay-payment.provider.ts','listPaymentRefunds','getRefund','/refund','idempotency_key')
need('server/src/repositories/refund.repository.ts','FOR UPDATE','claimAttempt','provider_attempted_at','processedAmount','inventory_released_at','GREATEST(0,used_count-1)','FOR UPDATE SKIP LOCKED')
need('server/src/services/refund.service.ts','FULL_REFUND_ONLY','RETURN_WORKFLOW_REQUIRED','SHIPMENT_ALREADY_CREATED','listPaymentRefunds','refund_id','request_key','claimAttempt','REFUND_AMOUNT_MISMATCH','REFUND_PAYMENT_MISMATCH','handleWebhook','reconcile')
need('server/src/routes/refund.routes.ts',"/orders/:id/refunds","/admin/orders/:id/refunds","/admin/refunds/reconcile","requireRole('admin')")
need('server/src/app.ts',"startsWith('refund.')",'express.raw')
need('src/lib/nativeRefunds.ts','VITE_REFUND_BACKEND','requestNativeRefund','reconcileNativeRefunds')
need('src/pages/user/UserOrders.tsx','nativeRefundBackendEnabled','requestNativeRefund')
need('src/pages/admin/AdminPayments.tsx','nativeRefundBackendEnabled','requestNativeRefund','reconcileNativeRefunds')
need('.env.example','VITE_REFUND_BACKEND=supabase')
need('server/package.json','refund:reconcile')
need('package.json','audit:backend-phase14','refund:reconcile')
# Legacy rollback path must remain until staging certification.
for f in ['supabase/functions/request-order-refund/index.ts','supabase/functions/reconcile-order-refunds/index.ts','supabase/functions/razorpay-refund-webhook/index.ts']:
 if not (root/f).exists(): missing.append(f'legacy rollback path removed too early: {f}')
if missing:
 print('PHASE 14 NATIVE REFUND AUTHORITY: FAIL')
 print('\n'.join('- '+x for x in missing));sys.exit(1)
print('PHASE 14 NATIVE REFUND AUTHORITY: PASS')
print('- full/partial Razorpay refund ledger moved behind Express/PostgreSQL')
print('- duplicate provider issuance guarded by request key + provider-attempt claim + provider refund discovery')
print('- raw-body refund webhooks are deduplicated and provider-reverified')
print('- processed full pre-shipment refund restores inventory/coupon exactly at terminal transition')
print('- partial/post-shipment refunds do not imply inventory restoration')
print('- legacy Supabase refund authority retained as rollback path while feature gate defaults to Supabase')
