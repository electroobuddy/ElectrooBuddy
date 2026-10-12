import type { QueryableDatabase } from '../config/database.js';

export class PaymentRepository {
  constructor(private readonly db: QueryableDatabase) {}

  async lockOrderForUser(orderId: string, userId: string) {
    const r = await this.db.query<any>(`SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`, [orderId, userId]);
    return r.rows[0] ?? null;
  }

  async lockOrderByProviderOrderId(providerOrderId: string) {
    const r = await this.db.query<any>(`SELECT * FROM orders WHERE razorpay_order_id=$1 FOR UPDATE`, [providerOrderId]);
    return r.rows[0] ?? null;
  }

  async paymentIdInUse(paymentId: string, excludingOrderId: string) {
    const r = await this.db.query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM orders WHERE razorpay_payment_id=$1 AND id<>$2) AS exists`, [paymentId, excludingOrderId]);
    return r.rows[0]?.exists ?? false;
  }

  async finalizePaid(order: any, payment: { id: string; signature?: string | null; providerStatus: string; method?: string | null }, eventType: string) {
    if (await this.paymentIdInUse(payment.id, order.id)) throw new Error('PAYMENT_ALREADY_USED');
    const r = await this.db.query<any>(`
      UPDATE orders
      SET razorpay_payment_id=$2,
          razorpay_signature=COALESCE($3, razorpay_signature),
          payment_status='paid',
          payment_provider_status=$4,
          payment_provider_method=$5,
          payment_verified_at=COALESCE(payment_verified_at, now()),
          payment_reconciled_at=CASE WHEN $6='reconciliation' THEN now() ELSE payment_reconciled_at END,
          payment_last_error=NULL,
          status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
          confirmed_at=COALESCE(confirmed_at, now()),
          coupon_consumed_at=CASE WHEN coupon_code IS NOT NULL THEN COALESCE(coupon_consumed_at, now()) ELSE NULL END,
          updated_at=now()
      WHERE id=$1 AND payment_status='pending'
      RETURNING *
    `,[order.id,payment.id,payment.signature??null,payment.providerStatus,payment.method??null,eventType]);
    if (r.rowCount !== 1) throw new Error('PAYMENT_TRANSITION_CONFLICT');
    if (order.coupon_code && !order.coupon_consumed_at) {
      await this.db.query(`UPDATE coupons SET used_count=used_count+1,updated_at=now() WHERE upper(code)=upper($1)`, [order.coupon_code]);
    }
    return r.rows[0];
  }

  async checkoutEvent(orderId: string, type: string, metadata: Record<string, unknown> = {}) {
    await this.db.query(`INSERT INTO checkout_events(order_id,event_type,metadata) VALUES($1,$2,$3::jsonb)`, [orderId,type,JSON.stringify(metadata)]);
  }

  async createPaymentEvent(input: { orderId?: string|null; eventType: string; providerEventId?: string|null; providerOrderId?: string|null; providerPaymentId?: string|null; payloadSha256?: string|null; metadata?: Record<string,unknown> }) {
    const r=await this.db.query<any>(`
      INSERT INTO payment_events(order_id,event_type,provider_event_id,provider_order_id,provider_payment_id,payload_sha256,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)
      ON CONFLICT DO NOTHING
      RETURNING *
    `,[input.orderId??null,input.eventType,input.providerEventId??null,input.providerOrderId??null,input.providerPaymentId??null,input.payloadSha256??null,JSON.stringify(input.metadata??{})]);
    return r.rows[0]??null;
  }

  async markPaymentEvent(id:string,status:'processed'|'ignored'|'failed',errorCode?:string|null,orderId?:string|null){
    await this.db.query(`UPDATE payment_events SET status=$2,error_code=$3,order_id=COALESCE($4,order_id),processed_at=now() WHERE id=$1`,[id,status,errorCode??null,orderId??null]);
  }

  async pendingReconciliation(limit:number){
    const r=await this.db.query<any>(`
      WITH candidates AS (
        SELECT id FROM orders
        WHERE payment_method='razorpay'
          AND payment_status='pending'
          AND status='pending'
          AND razorpay_order_id IS NOT NULL
          AND inventory_reserved_at IS NOT NULL
          AND inventory_released_at IS NULL
          AND deleted_at IS NULL
          AND (quote_expires_at IS NULL OR quote_expires_at > now())
          AND (payment_reconciled_at IS NULL OR payment_reconciled_at < now() - interval '2 minutes')
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT $1
      )
      UPDATE orders o SET payment_reconciled_at=now(),updated_at=now()
      FROM candidates c WHERE o.id=c.id
      RETURNING o.*
    `,[limit]);
    return r.rows;
  }

  async markReconcileError(orderId:string,message:string){
    await this.db.query(`UPDATE orders SET payment_last_error=$2,payment_reconciled_at=now(),updated_at=now() WHERE id=$1`,[orderId,message.slice(0,500)]);
  }
}
