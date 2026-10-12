# Phase 19 Remaining Supabase Inventory

- Frontend consumers: **62**
- Distinct RPCs: **17**
- Frontend-invoked Edge Functions: **13**

## Remaining RPCs

- `admin_archive_order`
- `admin_get_technicians`
- `admin_transition_booking`
- `admin_transition_order`
- `apply_coupon`
- `cancel_own_booking`
- `cancel_own_order`
- `create_notification_v2`
- `create_return_request`
- `get_active_coupons`
- `get_available_technicians`
- `inspect_return`
- `mark_all_notifications_read`
- `mark_notification_read`
- `public_booking_tracking`
- `public_order_tracking`
- `review_technician_application`

## Remaining Edge Function calls

- `create-commerce-checkout`
- `create-service-booking`
- `create-shiprocket-order`
- `create-subscription-order`
- `create-technician-by-admin`
- `notify-booking-status`
- `process-return-resolution`
- `reconcile-order-refunds`
- `request-order-refund`
- `send-fcm-notification`
- `send-push-notification`
- `verify-commerce-payment`
- `verify-subscription-payment`

## Remaining direct tables

- `bookings`
- `cart_items`
- `contact_messages`
- `images`
- `notification_preferences`
- `notifications`
- `offer_products`
- `offer_services`
- `offers`
- `order_refunds`
- `order_returns`
- `orders`
- `product_categories`
- `products`
- `profiles`
- `projects`
- `push_subscriptions`
- `services`
- `shipping_settings`
- `site_settings`
- `subscription_benefits_usage`
- `subscription_plans`
- `team_members`
- `technicians`
- `testimonials`
- `user_roles`
- `user_subscriptions`

## Remaining auth methods

- `admin`
- `getSession`
- `getUser`
- `onAuthStateChange`
- `signInWithPassword`
- `signOut`
- `signUp`

## Remaining consumer files

- `src/components/AdminSubscriptions.tsx`
- `src/components/NotificationSettings.tsx`
- `src/components/OptimizedImage.tsx`
- `src/components/Requestservicesection.tsx`
- `src/components/Subscriptions.tsx`
- `src/contexts/CartContext.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useNotifications.ts`
- `src/hooks/useOptimizedData.ts`
- `src/hooks/useSubscription.ts`
- `src/integrations/firebase/config.ts`
- `src/integrations/supabase/client.ts`
- `src/lib/admin-setup.ts`
- `src/lib/nativeBooking.ts`
- `src/lib/nativeOrders.ts`
- `src/lib/nativeRefunds.ts`
- `src/lib/nativeTechnician.ts`
- `src/lib/publicApi.ts`
- `src/lib/serviceBooking.ts`
- `src/lib/storageApi.ts`
- `src/pages/BookingDetails.tsx`
- `src/pages/BookingForm.tsx`
- `src/pages/BookingTracking.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/Index.tsx`
- `src/pages/OrderSuccess.tsx`
- `src/pages/OrderTracking.tsx`
- `src/pages/ProductDetails.tsx`
- `src/pages/Projects.tsx`
- `src/pages/Review.tsx`
- `src/pages/admin/AdminBookings.tsx`
- `src/pages/admin/AdminCouponsCategories.tsx`
- `src/pages/admin/AdminNotifications.tsx`
- `src/pages/admin/AdminOffers.tsx`
- `src/pages/admin/AdminOrders.tsx`
- `src/pages/admin/AdminPayments.tsx`
- `src/pages/admin/AdminPlanManagement.tsx`
- `src/pages/admin/AdminProducts.tsx`
- `src/pages/admin/AdminProjects.tsx`
- `src/pages/admin/AdminReturns.tsx`
- `src/pages/admin/AdminServices.tsx`
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/AdminShippingSettings.tsx`
- `src/pages/admin/AdminTeam.tsx`
- `src/pages/admin/AdminTechnicians.tsx`
- `src/pages/admin/AdminTestimonials.tsx`
- `src/pages/technician/TechnicianBookings.tsx`
- `src/pages/technician/TechnicianDashboard.tsx`
- `src/pages/technician/TechnicianLayout.tsx`
- `src/pages/technician/TechnicianLogin.tsx`
- `src/pages/technician/TechnicianProfile.tsx`
- `src/pages/technician/TechnicianSettings.tsx`
- `src/pages/technician/TechnicianSignUp.tsx`
- `src/pages/user/UserAuth.tsx`
- `src/pages/user/UserBookings.tsx`
- `src/pages/user/UserDashboard.tsx`
- `src/pages/user/UserOrders.tsx`
- `src/pages/user/UserProfile.tsx`
- `src/stores/productsStore.ts`
- `src/utils/firebaseNotifications.ts`
- `src/utils/notificationUtils.ts`
- `src/utils/pushNotifications.ts`

These are migration work items. Do not delete the corresponding Supabase artifact until every active caller has been retired and staging-certified.
