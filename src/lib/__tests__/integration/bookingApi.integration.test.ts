import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeApiFetch } from '../../apiClient';
import {
  quoteNativeBooking,
  createNativeBooking,
  transitionNativeTechnicianBooking,
  transitionNativeAdminBooking,
} from '../../nativeBooking';

vi.mock('../../apiClient', () => ({ nativeApiFetch: vi.fn() }));
const api = vi.mocked(nativeApiFetch);

describe('booking API contract integration', () => {
  beforeEach(() => api.mockReset());

  it('quotes before creation using the complete server pricing input', async () => {
    api.mockResolvedValueOnce({ total: 450 } as never);
    const input = {
      serviceId: 'svc-1',
      couponCode: 'SAVE10',
      subscriptionId: 'sub-1',
    } as Parameters<typeof quoteNativeBooking>[0];

    await quoteNativeBooking(input);

    expect(api).toHaveBeenCalledWith('/bookings/quote', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  });

  it('submits the booking payload without client-side transformation', async () => {
    api.mockResolvedValueOnce({ id: 'b1' } as never);
    const input = {
      serviceId: 'svc-1', name: 'A', email: 'a@example.com', phone: '9999999999',
      address: 'Bhopal', preferredDate: '2026-10-15', preferredTime: '10:00',
      isSwitchWorking: true, hasOldFan: false, isElectricitySupplyOn: true,
    } as Parameters<typeof createNativeBooking>[0];

    await createNativeBooking(input);

    expect(api).toHaveBeenCalledWith('/bookings', { method: 'POST', body: JSON.stringify(input) });
  });

  it('uses the legal technician and admin transition endpoints', async () => {
    api.mockResolvedValue({ id: 'b1' } as never);
    await transitionNativeTechnicianBooking('b1', 'in_progress');
    await transitionNativeAdminBooking('b1', 'confirmed');

    expect(api).toHaveBeenNthCalledWith(1, '/technician/bookings/b1/transition', {
      method: 'POST', body: JSON.stringify({ target: 'in_progress' }),
    });
    expect(api).toHaveBeenNthCalledWith(2, '/admin/bookings/b1/transition', {
      method: 'POST', body: JSON.stringify({ target: 'confirmed' }),
    });
  });
});
