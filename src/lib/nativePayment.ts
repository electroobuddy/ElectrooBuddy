import { nativeApiFetch } from './apiClient';

export type NativeRazorpayVerificationInput = {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export type NativeRazorpayVerificationResult = {
  success: true;
  alreadyVerified: boolean;
  orderId: string;
  orderNumber: string;
};

/**
 * `nativeApiFetch` already validates the HTTP/envelope status and returns
 * `payload.data`, so payment verification must consume the parsed result
 * directly rather than treating it as a Fetch `Response`.
 */
export function verifyNativeRazorpayPayment(input: NativeRazorpayVerificationInput) {
  return nativeApiFetch<NativeRazorpayVerificationResult>('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(input),
    timeoutMs: 30_000,
  });
}
