import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient, clearPrivateQueryCache, queryKeys } from '../../queryClient';

const notificationMocks = vi.hoisted(() => ({
  unsubscribeFcm: vi.fn(),
  subscribeFcm: vi.fn(),
  hasActiveFcm: vi.fn(),
}));
const firebaseMocks = vi.hoisted(() => ({
  initFirebase: vi.fn(() => true),
  requestFirebasePermission: vi.fn(),
  onFirebaseMessage: vi.fn(),
}));

vi.mock('../../nativeNotifications', () => ({ nativeNotifications: notificationMocks }));
vi.mock('@/integrations/firebase/config', () => firebaseMocks);
vi.mock('../../logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { hasActiveSubscription, subscribeToPush, unsubscribeFromPush } from '../../../utils/firebaseNotifications';

describe('session and device isolation', () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('clears private query cache without deleting public cache', async () => {
    queryClient.setQueryData(queryKeys.private.admin.orders, [{ id: 'private-order' }]);
    queryClient.setQueryData(queryKeys.public.services, [{ id: 'public-service' }]);

    await clearPrivateQueryCache();

    expect(queryClient.getQueryData(queryKeys.private.admin.orders)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.public.services)).toEqual([{ id: 'public-service' }]);
  });

  it('binds a locally stored FCM token to the owning user', async () => {
    firebaseMocks.requestFirebasePermission.mockResolvedValue('fcm-owned-token');
    notificationMocks.subscribeFcm.mockResolvedValue({ id: 'sub-1' });

    expect(await subscribeToPush('user-1')).toBe(true);
    expect(await hasActiveSubscription('user-2')).toBe(false);
    expect(notificationMocks.hasActiveFcm).not.toHaveBeenCalled();

    notificationMocks.hasActiveFcm.mockResolvedValue({ active: true });
    expect(await hasActiveSubscription('user-1')).toBe(true);
  });

  it('unregisters and removes only the token owned by the signing-out user', async () => {
    localStorage.setItem('electroobuddy_fcm_token', 'token-1');
    localStorage.setItem('electroobuddy_fcm_owner', 'user-1');
    notificationMocks.unsubscribeFcm.mockResolvedValue({ success: true });

    await unsubscribeFromPush('user-2');
    expect(localStorage.getItem('electroobuddy_fcm_token')).toBe('token-1');
    expect(notificationMocks.unsubscribeFcm).not.toHaveBeenCalled();

    await unsubscribeFromPush('user-1');
    expect(notificationMocks.unsubscribeFcm).toHaveBeenCalledWith('token-1');
    expect(localStorage.getItem('electroobuddy_fcm_token')).toBeNull();
    expect(localStorage.getItem('electroobuddy_fcm_owner')).toBeNull();
  });
});
