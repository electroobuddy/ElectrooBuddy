import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeApiFetch } from '../../apiClient';
import { createNativeCheckout } from '../../nativeCheckout';
import { verifyNativeRazorpayPayment } from '../../nativePayment';
import { getNativeOrderLifecycle, trackNativeOrder } from '../../nativeOrders';
import { requestNativeRefund } from '../../nativeRefunds';
import { requestNativeReturn } from '../../nativeReturns';

vi.mock('../../apiClient', () => ({ nativeApiFetch: vi.fn() }));
const api = vi.mocked(nativeApiFetch);

describe('checkout and post-purchase API contracts', () => {
  beforeEach(() => api.mockReset());

  it('sends checkout idempotency key and server-owned payment method', async () => {
    api.mockResolvedValueOnce({ success: true, orderId: 'o1' } as never);
    const input = {
      requestId: 'idem-checkout-1',
      items: [{ productId: 'p1', quantity: 2, installationService: true }],
      address: { fullName: 'A', email: 'a@example.com', phone: '9999999999', addressLine1: 'Street', city: 'Bhopal', state: 'MP', postalCode: '462001' },
      paymentMethod: 'razorpay' as const,
      couponCode: 'SAVE10',
    };

    await createNativeCheckout(input);

    expect(api).toHaveBeenCalledWith('/checkout', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Idempotency-Key': 'idem-checkout-1' }),
      body: JSON.stringify(input),
    }));
  });

  it('verifies Razorpay against the native payment verification endpoint', async () => {
    api.mockResolvedValueOnce({ success: true } as never);
    const input = { orderId: 'o1', razorpayPaymentId: 'pay_1', razorpayOrderId: 'rp_1', razorpaySignature: 'sig_1' };

    await verifyNativeRazorpayPayment(input);

    expect(api).toHaveBeenCalledWith('/payments/razorpay/verify', {
      method: 'POST', body: JSON.stringify(input), timeoutMs: 30_000,
    });
  });

  it('reads lifecycle and secure tracking from server endpoints', async () => {
    api.mockResolvedValue({} as never);
    await getNativeOrderLifecycle('o1');
    await trackNativeOrder('track-token');

    expect(api).toHaveBeenNthCalledWith(1, '/orders/o1/lifecycle');
    expect(api).toHaveBeenNthCalledWith(2, '/order-tracking/lookup', {
      method: 'POST', body: JSON.stringify({ token: 'track-token' }),
    });
  });

  it('keeps refund and return retry idempotency keys in request payloads', async () => {
    api.mockResolvedValue({} as never);
    await requestNativeRefund({ orderId: 'o1', requestKey: 'refund-stable-1', amount: 100, reason: 'cancel' });
    await requestNativeReturn({
      orderId: 'o1', requestKey: 'return-stable-1',
      items: [{ orderItemId: 'oi1', quantity: 1 }], reason: 'damaged', resolution: 'refund',
    });

    expect(api).toHaveBeenNthCalledWith(1, '/orders/o1/refunds', {
      method: 'POST', body: JSON.stringify({ requestKey: 'refund-stable-1', amount: 100, reason: 'cancel' }),
    });
    expect(api).toHaveBeenNthCalledWith(2, '/orders/o1/returns', {
      method: 'POST',
      body: JSON.stringify({ requestKey: 'return-stable-1', items: [{ orderItemId: 'oi1', quantity: 1 }], reason: 'damaged', resolution: 'refund' }),
    });
  });
});
