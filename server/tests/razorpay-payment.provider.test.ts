import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RazorpayPaymentProvider } from '../src/providers/razorpay-payment.provider.js';

const env:any={RAZORPAY_KEY_ID:'rzp_test_key',RAZORPAY_KEY_SECRET:'01234567890123456789012345678901',RAZORPAY_WEBHOOK_SECRET:'webhook-secret-01234567890123456789'};

describe('RazorpayPaymentProvider signatures',()=>{
  it('verifies checkout signatures and rejects tampering',()=>{
    const p=new RazorpayPaymentProvider(env);
    const order='order_123', payment='pay_456';
    const signature=createHmac('sha256',env.RAZORPAY_KEY_SECRET).update(`${order}|${payment}`).digest('hex');
    expect(p.verifyPaymentSignature({providerOrderId:order,providerPaymentId:payment,signature})).toBe(true);
    expect(p.verifyPaymentSignature({providerOrderId:order,providerPaymentId:'pay_other',signature})).toBe(false);
  });
  it('verifies webhook signature over raw bytes',()=>{
    const p=new RazorpayPaymentProvider(env); const body=Buffer.from('{"event":"payment.captured"}');
    const signature=createHmac('sha256',env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
    expect(p.verifyWebhookSignature(body,signature)).toBe(true);
    expect(p.verifyWebhookSignature(Buffer.from('{}'),signature)).toBe(false);
  });
});
