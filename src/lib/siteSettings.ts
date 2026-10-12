import { getPublicSiteSettings } from '@/lib/publicApi';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/optimization-config';

export type SiteSettingsMap = Record<string, string>;

export async function getSiteSettingsCached(): Promise<SiteSettingsMap> {
  return queryClient.fetchQuery({
    queryKey: queryKeys.public.siteSettings,
    queryFn: ({ signal }) => getPublicSiteSettings(signal),
    staleTime: CACHE_CONFIG.SERVICES,
  });
}

export async function invalidateSiteSettingsCache() {
  await queryClient.invalidateQueries({ queryKey: queryKeys.public.siteSettings });
}
