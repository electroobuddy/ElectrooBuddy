import { useQuery } from '@tanstack/react-query';
import { getPublicSiteSettings } from '@/lib/publicApi';
import { queryKeys } from '@/lib/queryClient';

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.public.siteSettings,
    queryFn: ({ signal }) => getPublicSiteSettings(signal),
    staleTime: 5 * 60 * 1000,
  });
}
