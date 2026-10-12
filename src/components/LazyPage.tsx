/**
 * Lazy Loading Components for Route Splitting
 * 
 * Use these to lazy load page components
 * Reduces initial bundle size significantly
 */

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Lazy loaded pages
export const LazyIndex = lazy(() => import('@/pages/Index'));
export const LazyAbout = lazy(() => import('@/pages/About'));
export const LazyServices = lazy(() => import('@/pages/Services'));
export const LazyProjects = lazy(() => import('@/pages/Projects'));
export const LazyContact = lazy(() => import('@/pages/Contact'));
export const LazyBookingForm = lazy(() => import('@/pages/BookingForm'));
export const LazyFAQ = lazy(() => import('@/pages/FAQ'));
export const LazyPrivacy = lazy(() => import('@/pages/Privacy'));
export const LazyTerms = lazy(() => import('@/pages/Terms'));
export const LazyProducts = lazy(() => import('@/pages/Products'));
export const LazyProductDetails = lazy(() => import('@/pages/ProductDetails'));
export const LazyCart = lazy(() => import('@/pages/Cart'));
export const LazyCheckout = lazy(() => import('@/pages/Checkout'));
export const LazyOrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
export const LazyOrderTracking = lazy(() => import('@/pages/OrderTracking'));
export const LazyUserAuth = lazy(() => import('@/pages/user/UserAuth'));
export const LazyUserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
export const LazyUserBookings = lazy(() => import('@/pages/user/UserBookings'));
export const LazyUserProfile = lazy(() => import('@/pages/user/UserProfile'));
export const LazyUserOrders = lazy(() => import('@/pages/user/UserOrders'));
export const LazyUserProducts = lazy(() => import('@/pages/user/UserProducts'));
export const LazyUserServices = lazy(() => import('@/pages/user/UserServices'));
export const LazyAdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
export const LazyAdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
export const LazyAdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
export const LazyAdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
export const LazyAdminServices = lazy(() => import('@/pages/admin/AdminServices'));
export const LazyAdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
export const LazyAdminTeam = lazy(() => import('@/pages/admin/AdminTeam'));
export const LazyAdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
export const LazyAdminProjects = lazy(() => import('@/pages/admin/AdminProjects'));
export const LazyAdminMessages = lazy(() => import('@/pages/admin/AdminMessages'));
export const LazyAdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
export const LazyAdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
export const LazyAdminShippingSettings = lazy(() => import('@/pages/admin/AdminShippingSettings'));
export const LazyAdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

/**
 * Wrapper component for lazy loaded pages
 */
export function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}
