export {
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPermission,
  isPushSupported,
  hasActiveSubscription,
  requestNotificationPermission,
  sendMessageToServiceWorker,
} from '@/utils/firebaseNotifications';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }); }
  catch { return null; }
}

export async function refreshPushSubscription(userId: string): Promise<boolean> {
  const mod = await import('@/utils/firebaseNotifications');
  await mod.unsubscribeFromPush(userId);
  return mod.subscribeToPush(userId);
}

export async function getUserSubscriptions(userId: string): Promise<any[]> {
  const mod = await import('@/utils/firebaseNotifications');
  return (await mod.hasActiveSubscription(userId)) ? [{ active: true }] : [];
}

export function onServiceWorkerMessage(callback: (event: MessageEvent) => void): void {
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', callback);
}
