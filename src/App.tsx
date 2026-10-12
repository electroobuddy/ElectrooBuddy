import { logger } from "@/lib/logger";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from 'react-helmet-async';
import PageTransition from "@/components/PageTransition";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ErrorBoundary from "@/components/ErrorBoundary";
import AsyncErrorBoundary from "@/components/AsyncErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import {
  HomeSkeleton,
  AboutSkeleton,
  ServicesSkeleton,
  ProductsSkeleton,
  ContactSkeleton,
  AuthSkeleton,
  AdminSkeleton,
  DashboardSkeleton,
  GenericSkeleton,
} from "@/components/PageSkeleton";

// Lazy load heavy components
const BookingModal = lazy(() => import("@/components/BookingModal"));
const PushNotificationPrompt = lazy(() => import("@/components/PushNotificationPrompt"));
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Projects = lazy(() => import("./pages/Projects"));
const Contact = lazy(() => import("./pages/Contact"));
const BookingForm = lazy(() => import("./pages/BookingForm"));
const BookingTracking = lazy(() => import("./pages/BookingTracking"));
const Review = lazy(() => import("./pages/Review"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Tips = lazy(() => import("./pages/Tips"));
const UserAuth = lazy(() => import("./pages/user/UserAuth"));
const ForgotPassword = lazy(() => import("./pages/user/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/user/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/user/VerifyEmail"));
const UserLayout = lazy(() => import("./pages/user/UserLayout"));
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const UserBookings = lazy(() => import("./pages/user/UserBookings"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const UserOrders = lazy(() => import("./pages/user/UserOrders"));
const UserSubscriptions = lazy(() => import("./pages/user/UserSubscriptions"));
const UserProducts = lazy(() => import("./pages/user/UserProducts"));
const UserServices = lazy(() => import("./pages/user/UserServices"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminOperations = lazy(() => import("./pages/admin/AdminOperations"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminCouponsCategories = lazy(() => import("@/pages/admin/AdminCouponsCategories"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminShippingSettings = lazy(() => import("./pages/admin/AdminShippingSettings"));
const AdminFulfillment = lazy(() => import("./pages/admin/AdminFulfillment"));
const AdminTechnicians = lazy(() => import("./pages/admin/AdminTechnicians"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const TechnicianLogin = lazy(() => import("./pages/technician/TechnicianLogin"));
const TechnicianLayout = lazy(() => import("./pages/technician/TechnicianLayout"));
const TechnicianDashboard = lazy(() => import("./pages/technician/TechnicianDashboard"));
const TechnicianBookings = lazy(() => import("./pages/technician/TechnicianBookings"));
const TechnicianProfile = lazy(() => import("./pages/technician/TechnicianProfile"));
const TechnicianSettings = lazy(() => import("./pages/technician/TechnicianSettings"));
const TechnicianSignUp = lazy(() => import("./pages/technician/TechnicianSignUp"));
const Subscriptions = lazy(() => import("@/components/Subscriptions"));
const AdminSubscriptions = lazy(() => import("@/components/AdminSubscriptions"));
const AdminPlanManagement = lazy(() => import("@/pages/admin/AdminPlanManagement"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));


const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = location.pathname.startsWith("/admin");
  const isUserPanel = location.pathname.startsWith("/dashboard") || location.pathname === "/login";
  const isTechnicianPanel = location.pathname.startsWith("/technician") && !location.pathname.startsWith("/technician/login") && !location.pathname.startsWith("/technician/signup");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasShownInSession, setHasShownInSession] = useState(false);
  const [shouldCheckModal, setShouldCheckModal] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || !shouldCheckModal) return;
    
    // Check if modal should be shown based on localStorage with 30-minute expiry
    const showModalConfig = localStorage.getItem('bookingModalConfig');
    const now = Date.now();
    
    // Don't show if already shown in this session
    if (hasShownInSession) {
      setShouldCheckModal(false);
      return;
    }
    
    if (!showModalConfig) {
      // First time ever - show modal after delay
      const timer = setTimeout(() => {
        setShowBookingModal(true);
        setHasShownInSession(true);
        setShouldCheckModal(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const { dismissedAt, expiresAt } = JSON.parse(showModalConfig);
        // Check if expired (30 minutes = 1800000 ms)
        if (now > expiresAt) {
          // Expired - show modal again
          localStorage.removeItem('bookingModalConfig');
          const timer = setTimeout(() => {
            setShowBookingModal(true);
            setHasShownInSession(true);
            setShouldCheckModal(false);
          }, 1200);
          return () => clearTimeout(timer);
        }
        // Not expired - don't show (user dismissed within 30 min)
        setShouldCheckModal(false);
      } catch {
        // Invalid data - show modal
        const timer = setTimeout(() => {
          setShowBookingModal(true);
          setHasShownInSession(true);
          setShouldCheckModal(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted, hasShownInSession, shouldCheckModal]);

  return (
    <>
      <OfflineBanner />
      {!isAdmin && !isUserPanel && !isTechnicianPanel && <Navbar />}
      <main className={isAdmin || isUserPanel || isTechnicianPanel ? "" : "min-h-screen"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Suspense fallback={<HomeSkeleton />}><AsyncErrorBoundary><Index /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/about" element={<PageTransition><Suspense fallback={<AboutSkeleton />}><AsyncErrorBoundary><About /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/services" element={<PageTransition><Suspense fallback={<ServicesSkeleton />}><AsyncErrorBoundary><Services /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/projects" element={<PageTransition><Suspense fallback={<ServicesSkeleton />}><AsyncErrorBoundary><Projects /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Suspense fallback={<ContactSkeleton />}><AsyncErrorBoundary><Contact /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/booking" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><BookingForm /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/track-booking" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><BookingTracking /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/review" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Review /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/faq" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><FAQ /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/tips" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Tips /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Privacy /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/subscriptions" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Subscriptions /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/subscription-success" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><SubscriptionSuccess /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Terms /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/products" element={<PageTransition><Suspense fallback={<ProductsSkeleton />}><AsyncErrorBoundary><Products /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/products/:slug" element={<PageTransition><Suspense fallback={<ProductsSkeleton />}><AsyncErrorBoundary><ProductDetails /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Cart /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/checkout" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><Checkout /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/order-success" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><OrderSuccess /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/track-order/:orderNumber" element={<PageTransition><Suspense fallback={<GenericSkeleton />}><AsyncErrorBoundary><OrderTracking /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/login" element={<PageTransition><Suspense fallback={<AuthSkeleton />}><AsyncErrorBoundary><UserAuth /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><Suspense fallback={<AuthSkeleton />}><AsyncErrorBoundary><ForgotPassword /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><Suspense fallback={<AuthSkeleton />}><AsyncErrorBoundary><ResetPassword /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route path="/verify-email" element={<PageTransition><Suspense fallback={<AuthSkeleton />}><AsyncErrorBoundary><VerifyEmail /></AsyncErrorBoundary></Suspense></PageTransition>} />
            <Route element={<Suspense fallback={<DashboardSkeleton />}><AsyncErrorBoundary><UserLayout /></AsyncErrorBoundary></Suspense>}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/dashboard/bookings" element={<UserBookings />} />
              <Route path="/dashboard/bookings/:id" element={<BookingDetails />} />
              <Route path="/dashboard/orders" element={<UserOrders />} />
              <Route path="/dashboard/subscriptions" element={<UserSubscriptions />} />
              <Route path="/dashboard/products" element={<UserProducts />} />
              <Route path="/dashboard/services" element={<UserServices />} />
              <Route path="/dashboard/profile" element={<UserProfile />} />
            </Route>

            {/* Admin routes - hidden, no public links */}
            <Route path="/admin" element={<Suspense fallback={<AuthSkeleton />}><AdminLogin /></Suspense>} />
            <Route element={<Suspense fallback={<AdminSkeleton />}><AdminLayout /></Suspense>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/coupons-categories" element={<AdminCouponsCategories />} />
              <Route path="/admin/offers" element={<AdminOffers />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/bookings/:id" element={<BookingDetails />} />
              <Route path="/admin/technicians" element={<AdminTechnicians />} />
              <Route path="/admin/team" element={<AdminTeam />} />
              <Route path="/admin/testimonials" element={<AdminTestimonials />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/subscribers" element={<AdminSubscribers />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/returns" element={<AdminReturns />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/plan-management" element={<AdminPlanManagement />} />
              <Route path="/admin/shipping" element={<AdminShippingSettings />} />
              <Route path="/admin/fulfillment" element={<AdminFulfillment />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/operations" element={<AdminOperations />} />
            </Route>

            {/* Technician routes - hidden, no public links */}
            <Route path="/technician/login" element={<Suspense fallback={<AuthSkeleton />}><TechnicianLogin /></Suspense>} />
            <Route path="/technician/signup" element={<Suspense fallback={<AuthSkeleton />}><TechnicianSignUp /></Suspense>} />
            <Route element={<Suspense fallback={<AdminSkeleton />}><TechnicianLayout /></Suspense>}>
              <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
              <Route path="/technician/bookings" element={<TechnicianBookings />} />
              <Route path="/technician/bookings/:id" element={<BookingDetails />} />
              <Route path="/technician/profile" element={<TechnicianProfile />} />
              <Route path="/technician/settings" element={<TechnicianSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdmin && !isUserPanel && !isTechnicianPanel && <Footer />}
      {!isAdmin && !isUserPanel && !isTechnicianPanel && <WhatsAppFloat onBackToTopClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} backToTopVisible={false} />}
      
      {/* Global Booking Modal - appears on all public pages */}
      {mounted && !isAdmin && !isUserPanel && (
        <AnimatePresence>
          {showBookingModal && (
            <Suspense fallback={null}><BookingModal 
              onClose={() => {
                setShowBookingModal(false);
                setHasShownInSession(true);
                setShouldCheckModal(false);
              }} 
            /></Suspense>
          )}
        </AnimatePresence>
      )}
      
      {/* Push Notification Prompt */}
      {user && <Suspense fallback={null}><PushNotificationPrompt userId={user.id} /></Suspense>}
    </>
  );
};

const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.error('Global App Error:', error, errorInfo);
      // TODO: Add error reporting service here
    }}
  >
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <TooltipProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <CartProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <AppContent />
                    </BrowserRouter>
                  </CartProvider>
                </ErrorBoundary>
              </AuthProvider>
            </TooltipProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
