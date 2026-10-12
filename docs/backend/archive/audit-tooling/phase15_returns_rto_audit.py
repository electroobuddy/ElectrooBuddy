from pathlib import Path
root=Path(__file__).resolve().parents[1]
def need(path,*parts):
 s=(root/path).read_text(encoding='utf-8')
 miss=[p for p in parts if p not in s]
 if miss: raise SystemExit(f'FAIL {path}: missing {miss}')
need('server/database/migrations/014_native_returns_rto_authority.sql','resolution_refund_id','replacement_authorized_at','idx_order_returns_worklist')
need('server/src/repositories/return.repository.ts','accepted_quantity','restocked_quantity','inventory_quantity=inventory_quantity+$2','RETURN')
need('server/src/services/return.service.ts','RETURN_WINDOW_EXPIRED','RETURN_QUANTITY_EXCEEDED','RETURN_NOT_RECEIVED','replacement_pending','viaReturn:true','rto_in_transit')
need('server/src/controllers/return.controller.ts','requestOwn','inspect','resolve','rto')
need('server/src/routes/return.routes.ts',"'/returns'","'/orders/:id/returns'","'/admin/returns/:id/inspect'","'/admin/returns/rto'")
need('server/src/services/refund.service.ts','viaReturn?:boolean','actor.admin&&input.viaReturn')
need('src/lib/nativeReturns.ts','VITE_RETURN_BACKEND','requestNativeReturn','inspectNativeReturn','resolveNativeReturn')
need('src/pages/user/UserOrders.tsx','nativeReturnBackendEnabled','requestNativeReturn')
need('src/pages/admin/AdminReturns.tsx','listNativeAdminReturns','inspectNativeReturn','resolveNativeReturn')
need('.env.example','VITE_RETURN_BACKEND=supabase')
print('PHASE 15 RETURNS / RTO / POST-SHIPMENT AUTHORITY: PASS')
print('return requests: native + idempotent + quantity bounded')
print('restock authority: admin physical inspection only')
print('refund-after-return: handed to Phase 14 refund ledger')
print('replacement authority: explicit post-inspection transition')
print('RTO: native worklist/state authority; carrier integration remains separate')
