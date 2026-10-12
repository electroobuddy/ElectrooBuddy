import { describe, it, expect, vi } from 'vitest';
import { PaymentService } from '../services/payment.service.js';

const order = { id: 'order-1', payment_status: 'pending', payment_method: 'razorpay', status: 'pending', inventory_reserved_at: new Date(), inventory_released_at: null, quote_expires_at: new Date(Date.now()+60000), razorpay_order_id: 'rp-order', total_amount: 100 };
function fixture(paymentOverrides: Record<string,unknown> = {}) {
  const payment = { providerPaymentId:'rp-payment', providerOrderId:'rp-order', amountMinor:10000, currency:'INR', status:'captured', captured:true, ...paymentOverrides };
  const repoCalls: string[] = [];
  const db = { withTransaction: async (callback: any) => callback({ query: async (sql: string) => {
    repoCalls.push(sql);
    if (sql.includes('FROM orders')) return { rows: [order] };
    return { rows: [] };
  } }) };
  const provider = { verifyPaymentSignature: vi.fn().mockReturnValue(true), getPayment: vi.fn().mockResolvedValue(payment) };
  return { service: new PaymentService({} as any, db as any, provider as any), provider, db, repoCalls };
}
const request = { orderId:'order-1', razorpayPaymentId:'rp-payment', razorpayOrderId:'rp-order', razorpaySignature:'valid-signature' };
describe('A5 payment verification security', () => {
  it('rejects bad signatures before calling payment provider or database', async () => {
    const { service, provider } = fixture();
    provider.verifyPaymentSignature.mockReturnValue(false);
    await expect(service.verifyUserPayment('user-1', request))
      .rejects.toMatchObject({ statusCode:400, code:'INVALID_PAYMENT_SIGNATURE' });
    expect(provider.getPayment).not.toHaveBeenCalled();
  });
  it('rejects a payment whose provider reports a different currency', async () => {
    const { service } = fixture({ currency:'USD' });
    await expect(service.verifyUserPayment('user-1', request)).rejects.toMatchObject({code:'PAYMENT_CURRENCY_MISMATCH'});
  });
  it('rejects a payment whose provider reports a different amount', async () => {
    const { service } = fixture({ amountMinor:1 });
    await expect(service.verifyUserPayment('user-1', request)).rejects.toMatchObject({code:'PAYMENT_AMOUNT_MISMATCH'});
  });
});
