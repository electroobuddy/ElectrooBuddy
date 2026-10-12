import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeApiError, nativeApiFetch, setNativeAccessToken } from '../apiClient';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
}

describe('nativeApiFetch', () => {
  beforeEach(() => {
    setNativeAccessToken(null);
    vi.restoreAllMocks();
  });

  it('returns parsed envelope data instead of a Response object', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ success: true, data: { id: 'order-1' } }));

    const result = await nativeApiFetch<{ id: string }>('/orders/order-1');

    expect(result).toEqual({ id: 'order-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).not.toBeInstanceOf(Response);
  });

  it('throws a normalized NativeApiError for API failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(
      { success: false, error: { code: 'PAYMENT_ORDER_MISMATCH', message: 'Payment order mismatch', details: { field: 'orderId' } } },
      { status: 409, headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' } },
    ));

    await expect(nativeApiFetch('/payments/razorpay/verify', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      name: 'NativeApiError',
      code: 'PAYMENT_ORDER_MISMATCH',
      status: 409,
      requestId: 'req-123',
      message: 'Payment order mismatch',
    });
  });

  it('normalizes network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await nativeApiFetch('/products');
      throw new Error('expected nativeApiFetch to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(NativeApiError);
      expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0, retriable: true });
    }
  });
});
