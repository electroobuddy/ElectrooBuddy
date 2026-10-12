import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { PaymentOrderInput, PaymentOrderResult, PaymentProvider, ProviderPayment, ProviderRefund } from './payment.provider.js';

interface RazorpayPaymentBody {
  id?: string; order_id?: string | null; amount?: number; currency?: string; status?: string; captured?: boolean;
  method?: string | null; email?: string | null; contact?: string | null;
}
interface RazorpayRefundBody { id?:string; payment_id?:string|null; amount?:number; currency?:string; status?:string; notes?:Record<string,unknown>|null; created_at?:number|null; }

export class RazorpayPaymentProvider implements PaymentProvider {
  constructor(private readonly env: AppEnv) {}

  private authHeader(): string {
    if (!this.env.RAZORPAY_KEY_ID || !this.env.RAZORPAY_KEY_SECRET) throw new Error('Payment service is not configured');
    return `Basic ${Buffer.from(`${this.env.RAZORPAY_KEY_ID}:${this.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`;
  }

  private normalizePayment(body: RazorpayPaymentBody): ProviderPayment {
    if (!body.id || typeof body.amount !== 'number' || !body.currency || !body.status) throw new Error('Invalid payment provider response');
    return {
      providerPaymentId: body.id,
      providerOrderId: body.order_id ?? null,
      amountMinor: body.amount,
      currency: body.currency,
      status: body.status,
      captured: body.captured === true || body.status === 'captured',
      method: body.method ?? null,
      email: body.email ?? null,
      contact: body.contact ?? null,
    };
  }

  async createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult> {
    const response=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:this.authHeader(),'Content-Type':'application/json'},body:JSON.stringify({amount:input.amountMinor,currency:input.currency,receipt:input.receipt,notes:{idempotency_key:input.idempotencyKey,...(input.notes??{})}}),signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error('Unable to initialize payment');
    const body=await response.json() as {id?:string;amount?:number;currency?:string};
    if(!body.id||body.amount!==input.amountMinor||body.currency!==input.currency) throw new Error('Invalid payment provider order response');
    return {providerOrderId:body.id,amountMinor:body.amount,currency:body.currency};
  }

  verifyPaymentSignature(input: { providerOrderId: string; providerPaymentId: string; signature: string }): boolean {
    if (!this.env.RAZORPAY_KEY_SECRET || !/^[0-9a-f]{64}$/i.test(input.signature)) return false;
    const expected = createHmac('sha256', this.env.RAZORPAY_KEY_SECRET).update(`${input.providerOrderId}|${input.providerPaymentId}`).digest();
    const received = Buffer.from(input.signature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.env.RAZORPAY_WEBHOOK_SECRET || !/^[0-9a-f]{64}$/i.test(signature)) return false;
    const expected = createHmac('sha256', this.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest();
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(providerPaymentId)}`, { headers: { Authorization: this.authHeader() }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Could not confirm payment with payment provider');
    return this.normalizePayment(await response.json() as RazorpayPaymentBody);
  }

  async listOrderPayments(providerOrderId: string): Promise<ProviderPayment[]> {
    const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(providerOrderId)}/payments`, { headers: { Authorization: this.authHeader() }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Could not reconcile order payments with payment provider');
    const body = await response.json() as { items?: RazorpayPaymentBody[] };
    return (body.items ?? []).map((item) => this.normalizePayment(item));
  }

  private normalizeRefund(body:RazorpayRefundBody):ProviderRefund {
    if(!body.id || typeof body.amount!=='number' || !body.currency) throw new Error('Invalid refund provider response');
    const notes:Record<string,string>={}; for(const [k,v] of Object.entries(body.notes??{})) if(v!=null) notes[k]=String(v);
    return {providerRefundId:body.id,providerPaymentId:body.payment_id??null,amountMinor:body.amount,currency:body.currency,status:body.status??'pending',notes,createdAt:body.created_at??null};
  }

  async refund(input:{providerPaymentId:string;amountMinor:number;idempotencyKey:string;notes?:Record<string,string>}):Promise<ProviderRefund>{
    const response=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(input.providerPaymentId)}/refund`,{method:'POST',headers:{Authorization:this.authHeader(),'Content-Type':'application/json'},body:JSON.stringify({amount:input.amountMinor,speed:'normal',notes:{idempotency_key:input.idempotencyKey,...(input.notes??{})}}),signal:AbortSignal.timeout(10000)});
    if(!response.ok){let detail='Unable to initialize refund';try{const b=await response.json() as any;detail=String(b?.error?.description??detail)}catch{}throw new Error(detail);}
    return this.normalizeRefund(await response.json() as RazorpayRefundBody);
  }
  async getRefund(providerRefundId:string):Promise<ProviderRefund>{
    const response=await fetch(`https://api.razorpay.com/v1/refunds/${encodeURIComponent(providerRefundId)}`,{headers:{Authorization:this.authHeader()},signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error('Could not reconcile refund with payment provider');
    return this.normalizeRefund(await response.json() as RazorpayRefundBody);
  }
  async listPaymentRefunds(providerPaymentId:string):Promise<ProviderRefund[]>{
    const response=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(providerPaymentId)}/refunds`,{headers:{Authorization:this.authHeader()},signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error('Could not list payment refunds from payment provider');
    const body=await response.json() as {items?:RazorpayRefundBody[]}; return (body.items??[]).map(x=>this.normalizeRefund(x));
  }
}
