export interface PaymentOrderInput {
  amountMinor: number;
  currency: string;
  receipt: string;
  idempotencyKey: string;
  notes?: Record<string,string>;
}

export interface PaymentOrderResult { providerOrderId:string; amountMinor:number; currency:string; }
export interface ProviderPayment {
  providerPaymentId:string; providerOrderId:string|null; amountMinor:number; currency:string; status:string; captured:boolean;
  method?:string|null; email?:string|null; contact?:string|null;
}
export interface ProviderRefund {
  providerRefundId:string; providerPaymentId:string|null; amountMinor:number; currency:string; status:string;
  notes:Record<string,string>; createdAt?:number|null;
}
export interface PaymentProvider {
  createOrder(input:PaymentOrderInput):Promise<PaymentOrderResult>;
  verifyPaymentSignature(input:{providerOrderId:string;providerPaymentId:string;signature:string}):boolean;
  getPayment(providerPaymentId:string):Promise<ProviderPayment>;
  listOrderPayments(providerOrderId:string):Promise<ProviderPayment[]>;
  verifyWebhookSignature(rawBody:Buffer,signature:string):boolean;
  refund(input:{providerPaymentId:string;amountMinor:number;idempotencyKey:string;notes?:Record<string,string>}):Promise<ProviderRefund>;
  getRefund(providerRefundId:string):Promise<ProviderRefund>;
  listPaymentRefunds(providerPaymentId:string):Promise<ProviderRefund[]>;
}
