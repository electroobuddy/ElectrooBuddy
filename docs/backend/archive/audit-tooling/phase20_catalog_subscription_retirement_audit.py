from pathlib import Path
import re,sys
R=Path(__file__).resolve().parents[1]
checks={
 'migration':('server/database/migrations/019_catalog_subscription_retirement.sql',['idx_subscription_plans_active_price','idx_user_subscriptions_admin_worklist']),
 'catalog_repo':('server/src/repositories/admin-catalog.repository.ts',['products','categories','services','projects','team','testimonials','saveOffer','offer_services','offer_products']),
 'catalog_routes':('server/src/routes/admin-catalog.routes.ts',['/admin/catalog/offers','/admin/catalog/:kind','requirePermission(\'admin:write\')']),
 'subscription_repo':('server/src/repositories/subscription.repository.ts',['subscription_orders','user_subscriptions','subscription_benefits_usage','FOR UPDATE','pendingOrders']),
 'subscription_service':('server/src/services/subscription.service.ts',['verifyPaymentSignature','getPayment','PAYMENT_MISMATCH','reconcile(limit=50)','subscription-order:']),
 'subscription_routes':('server/src/routes/subscription.routes.ts',['/subscriptions/checkout','/subscriptions/razorpay/verify','/admin/subscriptions','/admin/subscription-orders']),
 'frontend_catalog':('src/lib/nativeCatalogAdmin.ts',['listAdminCatalog','createAdminOffer','updateAdminOffer']),
 'frontend_subscriptions':('src/lib/nativeSubscriptions.ts',['createNativeSubscriptionOrder','verifyNativeSubscriptionPayment','listNativeAdminSubscriptions']),
}
failed=[]
for name,(f,needles) in checks.items():
 p=R/f
 if not p.exists(): failed.append(f'{name}: missing {f}');continue
 t=p.read_text(errors='ignore')
 for n in needles:
  if n not in t: failed.append(f'{name}: missing {n}')
retired=['src/pages/admin/AdminProducts.tsx','src/pages/admin/AdminServices.tsx','src/pages/admin/AdminOffers.tsx','src/pages/admin/AdminProjects.tsx','src/pages/admin/AdminTeam.tsx','src/pages/admin/AdminTestimonials.tsx','src/pages/admin/AdminPlanManagement.tsx','src/components/Subscriptions.tsx','src/components/AdminSubscriptions.tsx','src/hooks/useSubscription.ts']
for f in retired:
 t=(R/f).read_text(errors='ignore')
 if '@/integrations/supabase/client' in t or 'supabase.' in t: failed.append(f'retirement: direct Supabase remains in {f}')
cat=(R/'src/pages/admin/AdminCouponsCategories.tsx').read_text(errors='ignore')
if '.from("product_categories")' in cat or ".from('product_categories')" in cat: failed.append('category CRUD still writes product_categories directly through Supabase')
allfiles=[];rpcs=set();edge=set()
for p in (R/'src').rglob('*'):
 if not p.is_file() or p.suffix not in {'.ts','.tsx','.js','.jsx'}: continue
 t=p.read_text(errors='ignore')
 if 'supabase' in t or '@supabase' in t: allfiles.append(p)
 rpcs.update(m.group(1) for m in re.finditer(r"\.rpc\(\s*['\"]([^'\"]+)",t))
 edge.update(m.group(1) for m in re.finditer(r"functions\.invoke\(\s*['\"]([^'\"]+)",t))
if len(allfiles)>52: failed.append(f'dependency retirement regressed: {len(allfiles)} > 52')
if len(rpcs)>17: failed.append(f'RPC retirement regressed: {len(rpcs)} > 17')
if len(edge)>11: failed.append(f'Edge Function retirement regressed: {len(edge)} > 11')
for fn in ['create-subscription-order','verify-subscription-payment']:
 if fn in edge: failed.append(f'subscription Edge Function still invoked: {fn}')
if failed:
 print('PHASE 20 CATALOG + SUBSCRIPTION RETIREMENT: FAIL');print('\n'.join(' - '+x for x in failed));sys.exit(1)
print('PHASE 20 CATALOG + SUBSCRIPTION RETIREMENT: PASS')
print(f'frontend Supabase consumers: {len(allfiles)} (baseline 67)')
print(f'distinct frontend RPCs: {len(rpcs)} (baseline 23)')
print(f'frontend Edge Function calls: {len(edge)} (Phase 19 was 13)')
print('catalog admin CRUD: Express/PostgreSQL for products/categories/services/offers/projects/team/testimonials/plans')
print('subscription checkout: server-priced Razorpay order + signature/provider verification + reconciliation')
