import { describe, expect, it, vi } from 'vitest';
import * as apiClient from '../apiClient';
import { verifyNativeRazorpayPayment } from '../nativePayment';

describe('verifyNativeRazorpayPayment', () => {
  it('returns the already-parsed payment verification result', async () => {
    const result = {
      success: true as const,
      alreadyVerified: false,
      orderId: '11111111-1111-4111-8111-111111111111',
      orderNumber: 'EB-1001',
    };
    const fetchSpy = vi.spyOn(apiClient, 'nativeApiFetch').mockResolvedValue(result);

    await expect(verifyNativeRazorpayPayment({
      orderId: result.orderId,
      razorpayPaymentId: 'pay_123',
      razorpayOrderId: 'order_123',
      razorpaySignature: 'a'.repeat(64),
    })).resolves.toEqual(result);

    expect(fetchSpy).toHaveBeenCalledWith('/payments/razorpay/verify', expect.objectContaining({
      method: 'POST',
      timeoutMs: 30_000,
    }));
  });
});
