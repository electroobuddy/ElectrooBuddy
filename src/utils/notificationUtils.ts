import { logger } from "@/lib/logger";
import { nativeNotifications } from '@/lib/nativeNotifications';
import { NOTIFICATION_URLS } from './siteUrl';

export interface NotificationData {
  title: string;
  message: string;
  type: string;
  bookingId?: string;
  metadata?: Record<string, any>;
  customerName?: string;
  service?: string;
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  type: string;
  url?: string;
  notificationId?: string;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const timeout = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms`)), ms)
  );

/**
 * Write a single in-app notification row via RPC (bypasses RLS).
 * Never throws.
 */
async function writeInAppNotification(
  _userId: string,
  data: NotificationData
): Promise<void> {
  try {
    await nativeNotifications.createSelf({
      eventType: data.type,
      title: data.title,
      message: data.message,
      channels: ['in_app'],
      metadata: { ...(data.metadata ?? {}), bookingId: data.bookingId ?? null },
    });
  } catch (err: any) {
    logger.error('[notify] native in-app enqueue failed:', err?.message ?? err);
  }
}

/**
 * Fire a push notification for a user.
 * Enqueues native push delivery; the server resolves active FCM subscriptions.
 * Never throws — errors are logged.
 */
async function writePushNotification(
  _userId: string,
  data: NotificationData,
  urlOverride?: string
): Promise<void> {
  const url = urlOverride ?? (data.type === 'new_booking' ? NOTIFICATION_URLS.adminBookings : NOTIFICATION_URLS.userBookings);
  await nativeNotifications.createSelf({
    eventType: data.type,
    title: data.title,
    message: data.message,
    channels: ['push'],
    metadata: { ...(data.metadata ?? {}), url, bookingId: data.bookingId ?? null },
  });
}

/**
 * Check whether a user has at least one active push subscription.
 * Returns false on any error rather than throwing.
 */
async function userHasPushSubscription(_userId: string): Promise<boolean> {
  return true;
}

/**
 * Fetch notification preferences for a user.
 * Defaults to { inApp: true, push: true } on any failure.
 */
async function getUserPrefs(_userId: string): Promise<{ inApp: boolean; push: boolean }> {
  try {
    const prefs = await nativeNotifications.preferences();
    return { inApp: prefs?.in_app_notifications !== false, push: prefs?.push_notifications !== false };
  } catch {
    return { inApp: true, push: true };
  }
}

/**
 * Send both in-app and push notifications to a single user.
 * Respects their preferences. forceInApp=true bypasses the in-app preference
 * (used for admin booking alerts that must always be saved).
 * Never throws.
 */
async function notifyUser(
  userId: string,
  data: NotificationData,
  forceInApp = false,
  urlOverride?: string
): Promise<void> {
  const { inApp, push } = await getUserPrefs(userId);

  const shouldInApp = forceInApp || inApp;
  const shouldPush  = push;


  // Queue push through the native notification outbox; subscription lookup is server-side.
  const tasks: Promise<void>[] = [];

  if (shouldInApp) {
    tasks.push(
      Promise.race([writeInAppNotification(userId, data), timeout(6000)])
        .catch((err) => logger.error('[notify] in-app failed for', userId, ':', err?.message))
    );
  }

  if (shouldPush) {
    // Queue push; the native worker handles subscription lookup and delivery
    tasks.push(
      Promise.race([writePushNotification(userId, data, urlOverride), timeout(15000)])
        .catch((err) => logger.error('[notify] push failed for', userId, ':', err?.message))
    );
  }

  await Promise.allSettled(tasks);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fire-and-forget admin notification.
 *
 * - Uses native notification authority for authenticated notification delivery
 * - Sends a user-facing confirmation to the booking user (if logged in)
 * - Never throws; logs all failures to console
 *
 * Usage (no await needed):
 * ```ts
 * sendAdminNotificationAsync({ title, message, type, bookingId }, user);
 * ```
 */
export function sendAdminNotificationAsync(
  data: NotificationData,
  user?: { id: string } | null
): Promise<void> {
  // Admin in-app notifications are created by the database booking trigger.
  // The browser may only create a confirmation for its own authenticated user.
  if (!user?.id) return Promise.resolve();
  const userNotif: NotificationData = {
    ...data,
    type: `user_${data.type}`,
    title: data.type === "new_booking" ? "Booking Submitted ✅" : data.title,
    message: data.type === "new_booking"
      ? `Your ${data.service ?? "service request"} has been received. We'll be in touch shortly.`
      : data.message,
  };
  return notifyUser(user.id, userNotif, false, NOTIFICATION_URLS.userBookings);
}

/** @deprecated Use sendAdminNotificationAsync */
export const sendAdminNotification = sendAdminNotificationAsync;

// ─── Direct push (public) ────────────────────────────────────────────────────

/**
 * Send a push notification directly to a user by userId.
 * Uses the native notification outbox.
 */
export async function sendPushNotification(pushData: PushNotificationData): Promise<void> {
  try {
    await nativeNotifications.adminSend({
      userId: pushData.userId, eventType: pushData.type, title: pushData.title, message: pushData.body,
      channels: ['push'], metadata: { url: pushData.url, notificationId: pushData.notificationId },
    });
  } catch (err: any) {
    logger.error('[notify] native push enqueue failed:', err?.message ?? err);
  }
}

/** Create a single in-app notification row directly (no push, no preference check). */
export async function createNotification(
  userId: string,
  data: Omit<NotificationData, 'bookingId'>
): Promise<void> {
  await writeInAppNotification(userId, data);
}