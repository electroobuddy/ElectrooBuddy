import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeApiFetch } from '../../apiClient';
import { getNativeOpsStatus } from '../../nativeAdminOperations';
import { nativeNotifications } from '../../nativeNotifications';
import { transitionNativeAdminOrder } from '../../nativeOrders';
import { inspectNativeReturn, resolveNativeReturn } from '../../nativeReturns';

vi.mock('../../apiClient', () => ({ nativeApiFetch: vi.fn() }));
const api = vi.mocked(nativeApiFetch);

describe('admin operational API contracts', () => {
  beforeEach(() => api.mockReset());

  it('reads worker/lease health through the protected operations endpoint', async () => {
    api.mockResolvedValue({} as never);
    await getNativeOpsStatus();
    expect(api).toHaveBeenCalledWith('/admin/ops/status');
  });

  it('uses only legal generic order transition targets', async () => {
    api.mockResolvedValue({} as never);
    await transitionNativeAdminOrder('o1', 'processing');
    expect(api).toHaveBeenCalledWith('/admin/orders/o1/transition', {
      method: 'POST', body: JSON.stringify({ target: 'processing' }),
    });
  });

  it('keeps return inspection and resolution as server operations', async () => {
    api.mockResolvedValue({} as never);
    await inspectNativeReturn('r1', [{ returnItemId: 'ri1', acceptedQuantity: 1 }], 'checked');
    await resolveNativeReturn('r1');

    expect(api).toHaveBeenNthCalledWith(1, '/admin/returns/r1/inspect', {
      method: 'POST', body: JSON.stringify({ accept: [{ returnItemId: 'ri1', acceptedQuantity: 1 }], notes: 'checked' }),
    });
    expect(api).toHaveBeenNthCalledWith(2, '/admin/returns/r1/resolve', { method: 'POST' });
  });

  it('processes the existing notification outbox instead of bypassing it', async () => {
    api.mockResolvedValue({ claimed: 2, processed: 2 } as never);
    await nativeNotifications.process(10);
    expect(api).toHaveBeenCalledWith('/admin/notifications/process', {
      method: 'POST', body: JSON.stringify({ limit: 10 }),
    });
  });
});
