from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name, cond, detail=''):
    checks.append((name,bool(cond),detail))
q=(ROOT/'src/lib/queryClient.ts').read_text()
app=(ROOT/'src/App.tsx').read_text()
hooks=(ROOT/'src/hooks/useOptimizedData.ts').read_text()
api=(ROOT/'src/lib/publicApi.ts').read_text()
settings=(ROOT/'src/lib/siteSettings.ts').read_text()
auth=(ROOT/'src/hooks/useAuth.tsx').read_text()
services=(ROOT/'src/stores/servicesStore.ts').read_text()
check('shared query client exists', 'export const queryClient = new QueryClient' in q)
check('query defaults configure stale/gc/retry', all(x in q for x in ['staleTime:', 'gcTime:', 'retry:', 'retryDelay:']))
check('app uses singleton query client', 'import { queryClient } from "@/lib/queryClient"' in app and 'new QueryClient()' not in app)
check('public hooks use TanStack Query', 'useQuery' in hooks and 'useInfiniteQuery' in hooks)
check('product pagination uses infinite query', 'useInfiniteQuery' in hooks and 'fetchNextPage' in hooks)
check('public API supports AbortSignal', 'signal?:AbortSignal' in api and 'apiGet<T>(path:string, signal?:AbortSignal)' in api)
check('query functions forward cancellation signal', 'listPublicServices(signal)' in hooks and 'listPublicProducts({' in hooks and '}, signal)' in hooks)
check('site settings share query cache', 'queryClient.fetchQuery' in settings and 'queryKeys.public.siteSettings' in settings)
check('private cache cleared on auth boundary', 'clearPrivateQueryCache' in auth and auth.count('clearPrivateQueryCache') >= 3)
check('services store delegates cache to query client', 'queryClient.fetchQuery' in services and 'servicesCache' not in services and 'bookingServicesCache' not in services)
check('legacy cache manager removed', not (ROOT/'src/lib/cache-manager.ts').exists())
check('legacy product cache store removed', not (ROOT/'src/stores/productsStore.ts').exists())
check('legacy cached-list hook removed', 'useCachedList' not in hooks and 'fetchWithCache' not in hooks)
check('query invalidation centralized', 'queryClient.invalidateQueries' in hooks and 'queryKeys.private.admin' in hooks)
check('private query namespace exists', "root: ['private'] as const" in q)
check('public query namespace exists', "root: ['public'] as const" in q)
failed=[x for x in checks if not x[1]]
for name, ok, detail in checks:
    print(('PASS' if ok else 'FAIL')+': '+name+((' - '+detail) if detail else ''))
print(f'FAPI-14: {len(checks)-len(failed)}/{len(checks)} PASS')
sys.exit(1 if failed else 0)
