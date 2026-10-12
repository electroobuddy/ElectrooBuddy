const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://electroobuddy.com';

export function getSiteUrl(): string {
  return SITE_URL;
}

export function getNotificationUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export const NOTIFICATION_URLS = {
  adminBookings: getNotificationUrl('/admin/bookings'),
  adminBookingsDetails: getNotificationUrl('/admin/bookings/:id'),
  userBookings: getNotificationUrl('/dashboard/bookings'),
  userOrders: getNotificationUrl('/dashboard/orders'),
  userDashboard: getNotificationUrl('/dashboard'),
};