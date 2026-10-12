import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeApiFetch } from '../../apiClient';
import {
  getNativeTechnicianApplication,
  getNativeTechnicianDashboard,
  updateNativeTechnicianProfile,
} from '../../nativeTechnician';
import { nativeNotifications } from '../../nativeNotifications';

vi.mock('../../apiClient', () => ({ nativeApiFetch: vi.fn() }));
const api = vi.mocked(nativeApiFetch);

describe('technician and notification contracts', () => {
  beforeEach(() => api.mockReset());

  it('loads technician application state and dashboard from server authority', async () => {
    api.mockResolvedValue({} as never);
    await getNativeTechnicianApplication();
    await getNativeTechnicianDashboard();

    expect(api).toHaveBeenNthCalledWith(1, '/technician/application');
    expect(api).toHaveBeenNthCalledWith(2, '/technician/dashboard');
  });

  it('persists technician self-editable profile fields through PATCH', async () => {
    api.mockResolvedValue({} as never);
    const patch = { name: 'Tech A', experience: 4, dailyLimit: 6, status: 'available' } as Parameters<typeof updateNativeTechnicianProfile>[0];
    await updateNativeTechnicianProfile(patch);

    expect(api).toHaveBeenCalledWith('/technician/profile', { method: 'PATCH', body: JSON.stringify(patch) });
  });

  it('uses the notification preference and FCM subscription endpoints', async () => {
    api.mockResolvedValue({} as never);
    const preferences = {
      in_app_notifications: true, push_notifications: true, email_notifications: false,
      order_updates: true, payment_updates: true, shipping_updates: true,
      refund_updates: true, return_updates: true, booking_updates: true,
    };
    await nativeNotifications.savePreferences(preferences);
    await nativeNotifications.subscribeFcm('fcm-token');
    await nativeNotifications.unsubscribeFcm('fcm-token');

    expect(api).toHaveBeenNthCalledWith(1, '/notification-preferences', { method: 'PUT', body: JSON.stringify(preferences) });
    expect(api).toHaveBeenNthCalledWith(2, '/push-subscriptions/fcm', { method: 'POST', body: JSON.stringify({ token: 'fcm-token' }) });
    expect(api).toHaveBeenNthCalledWith(3, '/push-subscriptions/fcm', { method: 'DELETE', body: JSON.stringify({ token: 'fcm-token' }) });
  });

  it('retries an existing admin outbox record instead of constructing a fresh notification', async () => {
    api.mockResolvedValue({ id: 'outbox-1' } as never);
    await nativeNotifications.retry('outbox-1');
    expect(api).toHaveBeenCalledWith('/admin/notifications/outbox/outbox-1/retry', { method: 'POST' });
  });
});
