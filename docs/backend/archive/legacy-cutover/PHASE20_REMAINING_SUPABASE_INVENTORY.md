# Phase 20 Remaining Supabase Inventory

- Frontend scanner-visible consumers: **52**
- Distinct RPCs: **17**
- Frontend-invoked Edge Functions: **11**

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
- `create-technician-by-admin`
- `notify-booking-status`
- `process-return-resolution`
- `reconcile-order-refunds`
- `request-order-refund`
- `send-fcm-notification`
- `send-push-notification`
- `verify-commerce-payment`

## Remaining direct tables
- `bookings`
- `cart_items`
- `contact_messages`
- `images`
- `notification_preferences`
- `notifications`
- `offers`
- `order_refunds`
- `order_returns`
- `orders`
- `products`
- `profiles`
- `projects`
- `push_subscriptions`
- `services`
- `shipping_settings`
- `site_settings`
- `team_members`
- `technicians`
- `testimonials`
- `user_roles`

## Remaining consumer files
- `src/pages/OrderSuccess.tsx`
- `src/pages/ProductDetails.tsx`
- `src/pages/Index.tsx`
- `src/pages/Review.tsx`
- `src/pages/BookingDetails.tsx`
- `src/pages/BookingForm.tsx`
- `src/pages/BookingTracking.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/Projects.tsx`
- `src/pages/OrderTracking.tsx`
- `src/hooks/useOptimizedData.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useAuth.tsx`
- `src/lib/nativeTechnician.ts`
- `src/lib/storageApi.ts`
- `src/lib/nativeRefunds.ts`
- `src/lib/nativeOrders.ts`
- `src/lib/serviceBooking.ts`
- `src/lib/nativeBooking.ts`
- `src/lib/publicApi.ts`
- `src/lib/admin-setup.ts`
- `src/contexts/CartContext.tsx`
- `src/utils/pushNotifications.ts`
- `src/utils/notificationUtils.ts`
- `src/utils/firebaseNotifications.ts`
- `src/components/NotificationSettings.tsx`
- `src/components/Requestservicesection.tsx`
- `src/components/OptimizedImage.tsx`
- `src/stores/productsStore.ts`
- `src/integrations/supabase/client.ts`
- `src/integrations/firebase/config.ts`
- `src/pages/user/UserProfile.tsx`
- `src/pages/user/UserOrders.tsx`
- `src/pages/user/UserAuth.tsx`
- `src/pages/user/UserBookings.tsx`
- `src/pages/user/UserDashboard.tsx`
- `src/pages/technician/TechnicianBookings.tsx`
- `src/pages/technician/TechnicianLogin.tsx`
- `src/pages/technician/TechnicianDashboard.tsx`
- `src/pages/technician/TechnicianProfile.tsx`
- `src/pages/technician/TechnicianLayout.tsx`
- `src/pages/technician/TechnicianSettings.tsx`
- `src/pages/technician/TechnicianSignUp.tsx`
- `src/pages/admin/AdminOrders.tsx`
- `src/pages/admin/AdminTechnicians.tsx`
- `src/pages/admin/AdminPayments.tsx`
- `src/pages/admin/AdminCouponsCategories.tsx`
- `src/pages/admin/AdminReturns.tsx`
- `src/pages/admin/AdminBookings.tsx`
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/AdminShippingSettings.tsx`
- `src/pages/admin/AdminNotifications.tsx`

These remain explicit migration work items; legacy artifacts are not deleted until callers are retired and staging parity is certified.
