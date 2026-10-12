import type { QueryableDatabase } from '../config/database.js';

export class RefundRepository {
  constructor(private readonly db:QueryableDatabase){}

  async lockOrder(orderId:string){const r=await this.db.query<any>(`SELECT * FROM orders WHERE id=$1 FOR UPDATE`,[orderId]);return r.rows[0]??null;}
  async getByRequest(orderId:string,requestKey:string){const r=await this.db.query<any>(`SELECT * FROM order_refunds WHERE order_id=$1 AND request_key=$2`,[orderId,requestKey]);return r.rows[0]??null;}
  async lockRefund(id:string){const r=await this.db.query<any>(`SELECT * FROM order_refunds WHERE id=$1 FOR UPDATE`,[id]);return r.rows[0]??null;}
  async lockRefundByProviderId(id:string){const r=await this.db.query<any>(`SELECT * FROM order_refunds WHERE razorpay_refund_id=$1 FOR UPDATE`,[id]);return r.rows[0]??null;}
  async activeAmount(orderId:string){const r=await this.db.query<{amount:string}>(`SELECT COALESCE(SUM(amount),0)::text amount FROM order_refunds WHERE order_id=$1 AND status IN('requested','provider_pending','processed')`,[orderId]);return Number(r.rows[0]?.amount??0);}
  async processedAmount(orderId:string){const r=await this.db.query<{amount:string}>(`SELECT COALESCE(SUM(amount),0)::text amount FROM order_refunds WHERE order_id=$1 AND status='processed'`,[orderId]);return Number(r.rows[0]?.amount??0);}
  async create(input:{order:any;requestKey:string;amount:number;reason:string;requestedBy:string;refundType:'full'|'partial'}){
    const r=await this.db.query<any>(`INSERT INTO order_refunds(order_id,user_id,request_key,refund_type,amount,reason,requested_by,provider_attempted_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,NULL)
      ON CONFLICT(order_id,request_key) DO UPDATE SET updated_at=order_refunds.updated_at RETURNING *`,[input.order.id,input.order.user_id,input.requestKey,input.refundType,input.amount,input.reason||null,input.requestedBy]);
    await this.db.query(`UPDATE orders SET refund_status='requested',updated_at=now() WHERE id=$1`,[input.order.id]); return r.rows[0];
  }
  async claimAttempt(id:string){const r=await this.db.query<any>(`UPDATE order_refunds SET provider_attempted_at=now(),status=CASE WHEN status='failed' THEN 'requested' ELSE status END,failed_at=CASE WHEN status='failed' THEN NULL ELSE failed_at END,last_error=CASE WHEN status='failed' THEN NULL ELSE last_error END,updated_at=now() WHERE id=$1 AND (provider_attempted_at IS NULL OR status='failed') RETURNING *`,[id]);return r.rows[0]??null;}
  async finalize(refund:any,provider:{id?:string|null;status:string;error?:string|null}){
    const status=provider.status.toLowerCase(); const order=await this.lockOrder(refund.order_id); if(!order) throw new Error('ORDER_NOT_FOUND');
    if(['processed','refunded'].includes(status)){
      await this.db.query(`UPDATE order_refunds SET status='processed',provider_status=$2,razorpay_refund_id=COALESCE($3,razorpay_refund_id),processed_at=COALESCE(processed_at,now()),failed_at=NULL,last_error=NULL,provider_reconciled_at=now(),updated_at=now() WHERE id=$1`,[refund.id,provider.status,provider.id??null]);
      const total=await this.processedAmount(order.id); const full=total+0.005>=Number(order.total_amount);
      const cancel=full && !order.shiprocket_order_id && !['shipped','delivered','cancelled'].includes(order.status);
      await this.db.query(`UPDATE orders SET refunded_amount=LEAST(total_amount,$2),refund_status=$3,payment_status=$4,refunded_at=CASE WHEN $5 THEN COALESCE(refunded_at,now()) ELSE refunded_at END,status=CASE WHEN $6 THEN 'cancelled' ELSE status END,cancelled_at=CASE WHEN $6 THEN COALESCE(cancelled_at,now()) ELSE cancelled_at END,updated_at=now() WHERE id=$1`,[order.id,total,full?'refunded':'partial',full?'refunded':'partially_refunded',full,cancel]);
      if(cancel){
        if(order.inventory_reserved_at&&!order.inventory_released_at){await this.db.query(`WITH q AS (SELECT product_id,SUM(quantity)::int qty FROM order_items WHERE order_id=$1 GROUP BY product_id) UPDATE products p SET inventory_quantity=p.inventory_quantity+q.qty,updated_at=now() FROM q WHERE p.id=q.product_id`,[order.id]);await this.db.query(`UPDATE orders SET inventory_released_at=COALESCE(inventory_released_at,now()),updated_at=now() WHERE id=$1`,[order.id]);}
        if(order.coupon_code&&order.coupon_consumed_at){await this.db.query(`UPDATE coupons SET used_count=GREATEST(0,used_count-1),updated_at=now() WHERE upper(code)=upper($1)`,[order.coupon_code]);}
        await this.db.query(`UPDATE orders SET coupon_reserved_at=NULL,coupon_consumed_at=NULL,updated_at=now() WHERE id=$1`,[order.id]);
      }
    } else if(['failed','rejected'].includes(status)){
      await this.db.query(`UPDATE order_refunds SET status='failed',provider_status=$2,razorpay_refund_id=COALESCE($3,razorpay_refund_id),last_error=LEFT(COALESCE($4,'Provider refund failed'),2000),failed_at=now(),provider_reconciled_at=now(),updated_at=now() WHERE id=$1`,[refund.id,provider.status,provider.id??null,provider.error??null]);
      await this.db.query(`UPDATE orders SET refund_status='failed',updated_at=now() WHERE id=$1`,[order.id]);
    } else {
      await this.db.query(`UPDATE order_refunds SET status='provider_pending',provider_status=$2,razorpay_refund_id=COALESCE($3,razorpay_refund_id),last_error=NULL,provider_reconciled_at=now(),updated_at=now() WHERE id=$1`,[refund.id,provider.status,provider.id??null]);
      await this.db.query(`UPDATE orders SET refund_status='processing',updated_at=now() WHERE id=$1`,[order.id]);
    }
    return (await this.db.query<any>(`SELECT * FROM order_refunds WHERE id=$1`,[refund.id])).rows[0];
  }
  async createEvent(input:{eventType:string;providerEventId?:string|null;providerRefundId?:string|null;providerPaymentId?:string|null;payloadSha256:string;metadata?:Record<string,unknown>}){
    const r=await this.db.query<any>(`INSERT INTO refund_events(event_type,provider_event_id,provider_refund_id,provider_payment_id,payload_sha256,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING RETURNING *`,[input.eventType,input.providerEventId??null,input.providerRefundId??null,input.providerPaymentId??null,input.payloadSha256,JSON.stringify(input.metadata??{})]);return r.rows[0]??null;
  }
  async markEvent(id:number,status:'processed'|'ignored'|'failed',error?:string|null,refundId?:string|null,orderId?:string|null){await this.db.query(`UPDATE refund_events SET status=$2,error_code=$3,refund_id=COALESCE($4,refund_id),order_id=COALESCE($5,order_id),processed_at=now() WHERE id=$1`,[id,status,error??null,refundId??null,orderId??null]);}
  async pending(limit:number){const r=await this.db.query<any>(`WITH c AS (SELECT id FROM order_refunds WHERE status IN('requested','provider_pending') AND (provider_reconciled_at IS NULL OR provider_reconciled_at<now()-interval '2 minutes') ORDER BY requested_at FOR UPDATE SKIP LOCKED LIMIT $1) UPDATE order_refunds r SET provider_reconciled_at=now(),updated_at=now() FROM c WHERE r.id=c.id RETURNING r.*`,[limit]);return r.rows;}
  async listOwn(userId:string){const r=await this.db.query<any>(`SELECT id,order_id,request_key,refund_type,amount,reason,status,razorpay_refund_id,provider_status,requested_at,processed_at,failed_at,last_error FROM order_refunds WHERE user_id=$1 ORDER BY requested_at DESC LIMIT 200`,[userId]);return r.rows;}
}
