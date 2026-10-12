import { nativeApiFetch } from './apiClient';
import type { AdminNotificationInput, NativeNotification, NotificationCreateInput, NotificationOutboxItem, NotificationPreferences } from './apiContracts';
export const nativeNotifications = {
  list: () => nativeApiFetch<NativeNotification[]>('/notifications'),
  markRead: (id:string) => nativeApiFetch<{id:string}>(`/notifications/${id}/read`,{method:'POST'}),
  markAll: () => nativeApiFetch<{count:number}>('/notifications/read-all',{method:'POST'}),
  remove: (id:string) => nativeApiFetch<{id:string}>(`/notifications/${id}`,{method:'DELETE'}),
  createSelf: (body:NotificationCreateInput) => nativeApiFetch<NativeNotification>('/notifications',{method:'POST',body:JSON.stringify(body)}),
  adminSend: (body:AdminNotificationInput) => nativeApiFetch<{queued:number}>('/admin/notifications/send',{method:'POST',body:JSON.stringify(body)}),
  preferences: () => nativeApiFetch<NotificationPreferences>('/notification-preferences'),
  savePreferences: (body:NotificationPreferences) => nativeApiFetch<NotificationPreferences>('/notification-preferences',{method:'PUT',body:JSON.stringify(body)}),
  hasActiveFcm: () => nativeApiFetch<{active:boolean}>('/push-subscriptions/fcm/status'),
  subscribeFcm: (token:string) => nativeApiFetch<{id:string}>('/push-subscriptions/fcm',{method:'POST',body:JSON.stringify({token})}),
  unsubscribeFcm: (token:string) => nativeApiFetch<{success:boolean}>('/push-subscriptions/fcm',{method:'DELETE',body:JSON.stringify({token})}),
  adminOutbox: () => nativeApiFetch<NotificationOutboxItem[]>('/admin/notifications/outbox'),
  process: (limit=25) => nativeApiFetch<{claimed:number;processed:number}>('/admin/notifications/process',{method:'POST',body:JSON.stringify({limit})}),
  retry: (id:string) => nativeApiFetch<NotificationOutboxItem>(`/admin/notifications/outbox/${id}/retry`,{method:'POST'}),
};
