import { createHash } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { DatabaseClient } from '../config/database.js';
import { AppError } from '../errors/app-error.js';
import type { PaymentProvider, ProviderPayment } from '../providers/payment.provider.js';
import { PaymentRepository } from '../repositories/payment.repository.js';

export class PaymentService {
  constructor(private readonly env:AppEnv, private readonly db:DatabaseClient, private readonly provider:PaymentProvider) {}

  private assertPayable(order:any){
    if(!order) throw new AppError(404,'ORDER_NOT_FOUND','Order not found');
    if(order.payment_status==='paid') return;
    if(order.payment_method!=='razorpay' || order.payment_status!=='pending' || order.status==='cancelled' || !order.inventory_reserved_at || order.inventory_released_at || !order.quote_expires_at || new Date(order.quote_expires_at)<=new Date()) {
      throw new AppError(409,'CHECKOUT_NOT_PAYABLE','Checkout session expired or is not payable');
    }
    if(!order.razorpay_order_id) throw new AppError(409,'PAYMENT_ORDER_MISSING','Payment order is not initialized');
  }

  private assertProviderPayment(order:any,payment:ProviderPayment){
    if(payment.providerOrderId!==order.razorpay_order_id) throw new AppError(409,'PAYMENT_ORDER_MISMATCH','Payment order mismatch');
    if(payment.amountMinor!==Math.round(Number(order.total_amount)*100)) throw new AppError(409,'PAYMENT_AMOUNT_MISMATCH','Payment amount does not match this order');
    if(payment.currency!=='INR') throw new AppError(409,'PAYMENT_CURRENCY_MISMATCH','Payment currency does not match this order');
    if(!['captured','authorized'].includes(payment.status)) throw new AppError(409,'PAYMENT_NOT_AUTHORIZED','Payment is not captured or authorized');
  }

  async verifyUserPayment(userId:string,input:{orderId:string;razorpayPaymentId:string;razorpayOrderId:string;razorpaySignature:string}){
    if(!this.provider.verifyPaymentSignature({providerOrderId:input.razorpayOrderId,providerPaymentId:input.razorpayPaymentId,signature:input.razorpaySignature})) {
      throw new AppError(400,'INVALID_PAYMENT_SIGNATURE','Payment verification failed');
    }
    const payment=await this.provider.getPayment(input.razorpayPaymentId).catch(()=>{throw new AppError(502,'PAYMENT_PROVIDER_UNAVAILABLE','Could not confirm payment with payment provider');});
    return await this.db.withTransaction(async q=>{
      const repo=new PaymentRepository(q);
      const order=await repo.lockOrderForUser(input.orderId,userId);
      if(!order) throw new AppError(404,'ORDER_NOT_FOUND','Order not found');
      if(order.payment_status==='paid') return {success:true,alreadyVerified:true,orderId:order.id,orderNumber:order.order_number};
      if(order.razorpay_order_id!==input.razorpayOrderId) throw new AppError(400,'PAYMENT_ORDER_MISMATCH','Payment order mismatch');
      this.assertPayable(order);
      this.assertProviderPayment(order,payment);
      try{
        const updated=await repo.finalizePaid(order,{id:payment.providerPaymentId,signature:input.razorpaySignature,providerStatus:payment.status,method:payment.method},'user_verify');
        await repo.checkoutEvent(order.id,'payment.verified',{provider:'razorpay',paymentId:payment.providerPaymentId,status:payment.status});
        return {success:true,alreadyVerified:false,orderId:updated.id,orderNumber:updated.order_number};
      }catch(e:any){
        if(e?.message==='PAYMENT_ALREADY_USED') throw new AppError(409,'PAYMENT_ALREADY_USED','Payment has already been used');
        if(e?.message==='PAYMENT_TRANSITION_CONFLICT') throw new AppError(409,'PAYMENT_TRANSITION_CONFLICT','Payment transition conflict');
        throw e;
      }
    });
  }

  async handleWebhook(rawBody:Buffer, signature:string, providerEventId?:string|null){
    if(!this.provider.verifyWebhookSignature(rawBody,signature)) throw new AppError(400,'INVALID_WEBHOOK_SIGNATURE','Invalid webhook signature');
    let body:any; try{body=JSON.parse(rawBody.toString('utf8'));}catch{throw new AppError(400,'INVALID_WEBHOOK_PAYLOAD','Invalid webhook payload');}
    const eventType=String(body?.event??'unknown');
    const entity=body?.payload?.payment?.entity ?? null;
    const providerPaymentId=entity?.id ? String(entity.id) : null;
    const providerOrderId=entity?.order_id ? String(entity.order_id) : null;
    const payloadSha256=createHash('sha256').update(rawBody).digest('hex');

    const event=await this.db.withTransaction(async q=>new PaymentRepository(q).createPaymentEvent({eventType,providerEventId:providerEventId??null,providerOrderId,providerPaymentId,payloadSha256,metadata:{source:'webhook'}}));
    if(!event) return {success:true,duplicate:true};

    if(!['payment.captured','order.paid'].includes(eventType) || !providerPaymentId || !providerOrderId){
      await this.db.withTransaction(async q=>new PaymentRepository(q).markPaymentEvent(event.id,'ignored'));
      return {success:true,ignored:true};
    }

    try{
      const payment=await this.provider.getPayment(providerPaymentId);
      await this.db.withTransaction(async q=>{
        const repo=new PaymentRepository(q);
        const order=await repo.lockOrderByProviderOrderId(providerOrderId);
        if(!order){ await repo.markPaymentEvent(event.id,'ignored','ORDER_NOT_FOUND'); return; }
        if(order.payment_status==='paid'){ await repo.markPaymentEvent(event.id,'processed',null,order.id); return; }
        this.assertPayable(order);
        this.assertProviderPayment(order,payment);
        try{
          await repo.finalizePaid(order,{id:payment.providerPaymentId,providerStatus:payment.status,method:payment.method},'webhook');
          await repo.checkoutEvent(order.id,'payment.webhook_confirmed',{provider:'razorpay',paymentId:payment.providerPaymentId,eventType});
          await repo.markPaymentEvent(event.id,'processed',null,order.id);
        }catch(e:any){
          if(e?.message==='PAYMENT_ALREADY_USED') throw new AppError(409,'PAYMENT_ALREADY_USED','Payment has already been used');
          throw e;
        }
      });
      return {success:true};
    }catch(e:any){
      await this.db.withTransaction(async q=>new PaymentRepository(q).markPaymentEvent(event.id,'failed',e?.code??'PROCESSING_FAILED')).catch(()=>{});
      throw e;
    }
  }

  async reconcile(limit=50){
    const results:{checked:number;confirmed:number;unchanged:number;errors:number}={checked:0,confirmed:0,unchanged:0,errors:0};
    const orders=await this.db.withTransaction(async q=>new PaymentRepository(q).pendingReconciliation(limit));
    for(const order of orders){
      results.checked++;
      try{
        const payments=await this.provider.listOrderPayments(order.razorpay_order_id);
        const match=payments.find(p=>['captured','authorized'].includes(p.status) && p.amountMinor===Math.round(Number(order.total_amount)*100) && p.currency==='INR');
        if(!match){ results.unchanged++; continue; }
        await this.db.withTransaction(async q=>{
          const repo=new PaymentRepository(q);
          const locked=await repo.lockOrderByProviderOrderId(order.razorpay_order_id);
          if(!locked || locked.payment_status==='paid') return;
          this.assertPayable(locked);
          this.assertProviderPayment(locked,match);
          await repo.finalizePaid(locked,{id:match.providerPaymentId,providerStatus:match.status,method:match.method},'reconciliation');
          await repo.checkoutEvent(locked.id,'payment.reconciled',{provider:'razorpay',paymentId:match.providerPaymentId,status:match.status});
        });
        results.confirmed++;
      }catch(e:any){
        results.errors++;
        await this.db.withTransaction(async q=>new PaymentRepository(q).markReconcileError(order.id,e?.message??'Reconciliation failed')).catch(()=>{});
      }
    }
    return results;
  }
}
