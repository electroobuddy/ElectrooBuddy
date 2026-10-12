import { create } from 'zustand';
import { listPublicServices } from '@/lib/publicApi';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/optimization-config';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
  image_url?: string;
  service_charge?: string;
  show_visit_charge?: boolean;
  visit_charge_label?: string;
  whatsapp_enabled?: boolean;
  call_enabled?: boolean;
  book_now_enabled?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BookingService {
  id: string;
  title: string;
  service_charge?: string;
  show_visit_charge?: boolean;
  visit_charge_label?: string;
}

interface ServicesState {
  services: Service[];
  bookingServices: BookingService[];
  loading: boolean;
  bookingServicesLoading: boolean;
  error: Error | null;
  bookingServicesError: Error | null;
  fetchServices: () => Promise<void>;
  fetchBookingServices: () => Promise<void>;
  refreshServices: () => Promise<void>;
  getServiceByTitle: (title: string) => Service | undefined;
  getServiceCharge: (title: string) => { amount: string; label: string; show: boolean } | null;
  clearCache: () => void;
}

async function fetchServicesThroughQueryClient() {
  return queryClient.fetchQuery({
    queryKey: queryKeys.public.services,
    queryFn: ({ signal }) => listPublicServices(signal) as Promise<Service[]>,
    staleTime: CACHE_CONFIG.SERVICES,
  });
}

function toBookingServices(services: Service[]): BookingService[] {
  return services.map((service) => ({
    id: service.id,
    title: service.title,
    service_charge: service.service_charge,
    show_visit_charge: service.show_visit_charge ?? false,
    visit_charge_label: service.visit_charge_label || 'Visit Charge',
  }));
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  bookingServices: [],
  loading: false,
  bookingServicesLoading: false,
  error: null,
  bookingServicesError: null,

  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const services = await fetchServicesThroughQueryClient();
      set({ services, bookingServices: toBookingServices(services), loading: false });
    } catch (error) {
      set({ services: [], loading: false, error: error instanceof Error ? error : new Error('Failed to load services') });
    }
  },

  fetchBookingServices: async () => {
    set({ bookingServicesLoading: true, bookingServicesError: null });
    try {
      const services = await fetchServicesThroughQueryClient();
      set({ services, bookingServices: toBookingServices(services), bookingServicesLoading: false });
    } catch (error) {
      set({ bookingServices: [], bookingServicesLoading: false, bookingServicesError: error instanceof Error ? error : new Error('Failed to load booking services') });
    }
  },

  refreshServices: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.public.services });
    const services = await fetchServicesThroughQueryClient();
    set({ services, bookingServices: toBookingServices(services), loading: false, bookingServicesLoading: false, error: null, bookingServicesError: null });
  },

  getServiceByTitle: (title) => get().services.find((service) => service.title === title),
  getServiceCharge: (title) => {
    const service = get().bookingServices.find((item) => item.title === title);
    if (!service?.show_visit_charge || !service.service_charge) return null;
    return { amount: service.service_charge, label: service.visit_charge_label || 'Visit Charge', show: true };
  },
  clearCache: () => {
    queryClient.removeQueries({ queryKey: queryKeys.public.services });
    set({ services: [], bookingServices: [] });
  },
}));

export default useServicesStore;
