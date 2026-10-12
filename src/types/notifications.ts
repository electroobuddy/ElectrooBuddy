// Notification types for the new notification system

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  booking_id: string | null;
  order_id: string | null;
  is_read: boolean;
  read_at: string | null;
  is_pushed: boolean;
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  user?: {
    email: string;
    raw_user_meta_data?: Record<string, any>;
  };
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  in_app_notifications: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  type_preferences: Record<string, {
    enabled: boolean;
    quiet_hours: boolean;
  }>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
  device_type: string;
  browser: string;
  is_active: boolean;
  failure_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  notification_id: string | null;
  user_id: string;
  action: string;
  channel: string;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type NotificationType = 
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_assigned'
  | 'booking_in_progress'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'new_order'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'payment_failed'
  | 'welcome'
  | 'general'
  | 'system';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  bookingId?: string;
  orderId?: string;
  customerName?: string;
  service?: string;
  metadata?: Record<string, any>;
}
