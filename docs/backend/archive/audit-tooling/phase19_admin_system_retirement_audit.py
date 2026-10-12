from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1]
checks={
 'migration':('server/database/migrations/018_admin_system_operations_retirement.sql',['request_key','idx_contact_messages_read_created','idx_newsletter_subscribers_created']),
 'repository':('server/src/repositories/admin-operations.repository.ts',['submitContact','subscribe(email','dashboardCounts','databaseStats','listUsers','userBookings']),
 'service':('server/src/services/admin-operations.service.ts',['dashboard()','listMessages()','listSubscribers()','listUsers()']),
 'controller':('server/src/controllers/admin-operations.controller.ts',['contact=','subscribe=','messages=','dashboard=']),
 'routes':('server/src/routes/admin-operations.routes.ts',['/public/contact','/public/newsletter','/admin/messages','/admin/subscribers','/admin/users','/admin/system/dashboard','createPublicFormRateLimiter']),
 'frontend':('src/lib/nativeAdminOperations.ts',['submitNativeContact','subscribeNativeNewsletter','getNativeAdminDashboard','listNativeAdminUsers']),
 'app':('server/src/app.ts',['AdminOperationsRepository','AdminOperationsController','adminOperationsController']),
}
failed=[]
for name,(file,needles) in checks.items():
 p=R/file
 if not p.exists(): failed.append(f'{name}: missing {file}');continue
 t=p.read_text(errors='ignore')
 for n in needles:
  if n not in t: failed.append(f'{name}: missing {n}')
retired=['src/pages/Contact.tsx','src/pages/admin/AdminMessages.tsx','src/pages/admin/AdminSubscribers.tsx','src/pages/admin/AdminUsers.tsx','src/pages/admin/AdminDashboard.tsx']
for f in retired:
 t=(R/f).read_text(errors='ignore')
 if '@/integrations/supabase/client' in t or 'supabase.' in t: failed.append(f'retirement: direct Supabase remains in {f}')
# Freeze scanner-compatible counts.
files=[];rpcs=set()
for p in (R/'src').rglob('*'):
 if not p.is_file() or p.suffix not in {'.ts','.tsx','.js','.jsx'}: continue
 t=p.read_text(errors='ignore')
 if 'supabase' in t or '@supabase' in t: files.append(p)
 for m in re.finditer(r"\.rpc\(\s*['\"]([^'\"]+)",t): rpcs.add(m.group(1))
if len(files)>62: failed.append(f'dependency retirement regressed: {len(files)} frontend Supabase consumers > 62')
if len(rpcs)>17: failed.append(f'RPC retirement regressed: {len(rpcs)} distinct RPCs > 17')
if failed:
 print('PHASE 19 ADMIN/SYSTEM OPERATIONS + SUPABASE RETIREMENT: FAIL')
 print('\n'.join(' - '+x for x in failed));sys.exit(1)
print('PHASE 19 ADMIN/SYSTEM OPERATIONS + SUPABASE RETIREMENT: PASS')
print(f'frontend Supabase consumers: <=62 retirement target met ({len(files)} scanner-visible)')
print(f'distinct frontend RPCs: <=17 retirement target met ({len(rpcs)})')
print('retired domains: contact, newsletter admin, admin messages/users/dashboard system metrics')
print('rollback rule: database migration is additive; retired frontend domains no longer depend on Supabase')
