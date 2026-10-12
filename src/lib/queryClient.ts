import { QueryClient, type QueryKey } from '@tanstack/react-query';
import { isNativeApiError } from '@/lib/apiClient';

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES) return false;
  if (isNativeApiError(error)) return error.retriable;
  return error instanceof TypeError;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

export const queryKeys = {
  public: {
    root: ['public'] as const,
    products: (filters: Record<string, unknown> = {}) => ['public', 'products', filters] as const,
    services: ['public', 'services'] as const,
    team: ['public', 'team'] as const,
    testimonials: ['public', 'testimonials'] as const,
    projects: ['public', 'projects'] as const,
    offers: (visibility = 'home_hero') => ['public', 'offers', visibility] as const,
    siteSettings: ['public', 'site-settings'] as const,
  },
  private: {
    root: ['private'] as const,
    admin: {
      dashboard: ['private', 'admin', 'dashboard'] as const,
      orders: ['private', 'admin', 'orders'] as const,
      bookings: ['private', 'admin', 'bookings'] as const,
      products: ['private', 'admin', 'catalog', 'products'] as const,
      users: ['private', 'admin', 'users'] as const,
      services: ['private', 'admin', 'catalog', 'services'] as const,
      messages: ['private', 'admin', 'messages'] as const,
    },
  },
};

export async function invalidateQuery(key: QueryKey) {
  await queryClient.invalidateQueries({ queryKey: key });
}

export async function clearPrivateQueryCache() {
  await queryClient.cancelQueries({ queryKey: queryKeys.private.root });
  queryClient.removeQueries({ queryKey: queryKeys.private.root });
}
