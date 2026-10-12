import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/lib/optimization-config';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { listPublicProducts, listPublicServices, listPublicTeam, listPublicTestimonials, listPublicProjects } from '@/lib/publicApi';
import { getNativeAdminDashboard, listNativeAdminMessages, listNativeAdminUsers } from '@/lib/nativeAdminOperations';
import { listNativeAdminOrders } from '@/lib/nativeOrders';
import { listNativeAdminBookings } from '@/lib/nativeBooking';
import { listAdminCatalog } from '@/lib/nativeCatalogAdmin';
export interface Product {
  id: string; name: string; slug: string; description?: string; short_description?: string; price: number; compare_at_price?: number; main_image_url?: string; category?: string; brand?: string; is_featured?: boolean; is_active?: boolean; track_inventory?: boolean; inventory_quantity?: number; sort_order?: number; created_at?: string; updated_at?: string;
}
export interface ProductFilters { category?: string; brand?: string; searchTerm?: string; sortBy?: string; }
import type { ApiRecord } from '@/lib/apiContracts';

const PRODUCTS_PER_PAGE = 12;

function publicSort(sortBy?: string) {
  const sortMap: Record<string, 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name'> = {
    'price-low': 'price-asc',
    'price-high': 'price-desc',
    name: 'name',
  };
  return sortBy ? sortMap[sortBy] ?? 'featured' : 'featured';
}

export function useServices(limit?: number) {
  const query = useQuery({
    queryKey: queryKeys.public.services,
    queryFn: ({ signal }) => listPublicServices(signal),
    staleTime: CACHE_CONFIG.SERVICES,
  });
  const services = (query.data ?? []).slice(0, limit ?? Number.POSITIVE_INFINITY);
  return { services, loading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useTeamMembers() {
  const query = useQuery({
    queryKey: queryKeys.public.team,
    queryFn: ({ signal }) => listPublicTeam(signal),
    staleTime: CACHE_CONFIG.TEAM_MEMBERS,
  });
  return { team: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useTestimonials() {
  const query = useQuery({
    queryKey: queryKeys.public.testimonials,
    queryFn: ({ signal }) => listPublicTestimonials(50, signal),
    staleTime: CACHE_CONFIG.TESTIMONIALS,
  });
  return { testimonials: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useProducts(filters: ProductFilters = {}) {
  const normalized = {
    category: filters.category || undefined,
    brand: filters.brand || undefined,
    searchTerm: filters.searchTerm || undefined,
    sortBy: filters.sortBy || undefined,
  };
  const query = useInfiniteQuery({
    queryKey: queryKeys.public.products(normalized),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => listPublicProducts({
      page: pageParam,
      limit: PRODUCTS_PER_PAGE,
      category: normalized.category,
      brand: normalized.brand,
      search: normalized.searchTerm,
      sort: publicSort(normalized.sortBy),
    }, signal) as Promise<Product[]>,
    getNextPageParam: (lastPage, allPages) => lastPage.length === PRODUCTS_PER_PAGE ? allPages.length + 1 : undefined,
    staleTime: CACHE_CONFIG.PRODUCTS,
  });

  const products = query.data?.pages.flat() ?? [];
  return {
    products,
    loading: query.isPending,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => query.fetchNextPage(),
    refetch: query.refetch,
  };
}

export function useProjects() {
  const query = useQuery({
    queryKey: queryKeys.public.projects,
    queryFn: ({ signal }) => listPublicProjects(50, signal),
    staleTime: CACHE_CONFIG.PROJECTS || CACHE_CONFIG.TESTIMONIALS,
  });
  return { projects: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useCacheInvalidation() {
  return {
    invalidateProducts: () => queryClient.invalidateQueries({ queryKey: ['public', 'products'] }),
    invalidateServices: () => queryClient.invalidateQueries({ queryKey: queryKeys.public.services }),
    invalidateTeam: () => queryClient.invalidateQueries({ queryKey: queryKeys.public.team }),
    invalidateTestimonials: () => queryClient.invalidateQueries({ queryKey: queryKeys.public.testimonials }),
    invalidateProjects: () => queryClient.invalidateQueries({ queryKey: queryKeys.public.projects }),
  };
}

export function useAdminDashboardStats() {
  const query = useQuery({
    queryKey: queryKeys.private.admin.dashboard,
    queryFn: ({ signal }) => getNativeAdminDashboard(signal),
    staleTime: CACHE_CONFIG.ADMIN_DASHBOARD,
  });
  return { stats: query.data?.counts ?? null, loading: query.isPending, error: query.error, refetch: query.refetch };
}

function usePagedRows<T>(data: T[] | undefined, pageSize: number) {
  const [page, setPage] = useState(1);
  const total = data?.length ?? 0;
  useEffect(() => { setPage(1); }, [data, pageSize]);
  const visible = page * pageSize;
  return {
    rows: (data ?? []).slice(0, visible),
    hasMore: visible < total,
    loadMore: () => setPage((value) => value + 1),
  };
}

export function useAdminOrders(pageSize = 50) {
  const query = useQuery({ queryKey: queryKeys.private.admin.orders, queryFn: ({ signal }) => listNativeAdminOrders(signal), staleTime: CACHE_CONFIG.ADMIN_ORDERS });
  const { rows, hasMore, loadMore } = usePagedRows(query.data, pageSize);
  return { orders: rows, loading: query.isPending, error: query.error, hasMore, loadMore, refetch: query.refetch };
}
export function useAdminBookings(pageSize = 50) {
  const query = useQuery({ queryKey: queryKeys.private.admin.bookings, queryFn: ({ signal }) => listNativeAdminBookings(undefined, signal), staleTime: CACHE_CONFIG.ADMIN_BOOKINGS });
  const { rows, hasMore, loadMore } = usePagedRows(query.data, pageSize);
  return { bookings: rows, loading: query.isPending, error: query.error, hasMore, loadMore, refetch: query.refetch };
}
export function useAdminProducts() {
  const query = useQuery({ queryKey: queryKeys.private.admin.products, queryFn: ({ signal }) => listAdminCatalog<ApiRecord>('products', signal), staleTime: CACHE_CONFIG.ADMIN_PRODUCTS });
  return { products: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}
export function useAdminUsers() {
  const query = useQuery({ queryKey: queryKeys.private.admin.users, queryFn: ({ signal }) => listNativeAdminUsers(signal), staleTime: CACHE_CONFIG.ADMIN_USERS });
  return { users: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}
export function useAdminServices() {
  const query = useQuery({ queryKey: queryKeys.private.admin.services, queryFn: ({ signal }) => listAdminCatalog<ApiRecord>('services', signal), staleTime: CACHE_CONFIG.ADMIN_SERVICES });
  return { services: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}
export function useAdminMessages() {
  const query = useQuery({ queryKey: queryKeys.private.admin.messages, queryFn: ({ signal }) => listNativeAdminMessages(signal), staleTime: CACHE_CONFIG.ADMIN_MESSAGES });
  return { messages: query.data ?? [], loading: query.isPending, error: query.error, refetch: query.refetch };
}
export function useAdminCacheInvalidation() {
  const base = useCacheInvalidation();
  return {
    ...base,
    invalidateDashboardStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.dashboard }),
    invalidateOrders: () => queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.orders }),
    invalidateBookings: () => queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.bookings }),
    invalidateProducts: () => Promise.all([base.invalidateProducts(), queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.products })]),
    invalidateUsers: () => queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.users }),
    invalidateServices: () => Promise.all([base.invalidateServices(), queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.services })]),
    invalidateMessages: () => queryClient.invalidateQueries({ queryKey: queryKeys.private.admin.messages }),
    invalidateTestimonials: base.invalidateTestimonials,
    invalidateProjects: base.invalidateProjects,
  };
}
