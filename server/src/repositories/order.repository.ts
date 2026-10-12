import type { QueryableDatabase } from '../config/database.js';

const orderSelect = `
  SELECT o.*,
         COALESCE(o.shipping_address_data->>'full_name', p.full_name, u.email, 'Customer') AS customer_name,
         COALESCE(o.shipping_address_data->>'email', p.email, u.email) AS customer_email,
         COALESCE(o.shipping_address_data->>'phone', p.phone) AS customer_phone,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
           'id',oi.id,'product_id',oi.product_id,'product_name',oi.product_name,'product_sku',oi.product_sku,
           'product_image',oi.product_image,'quantity',oi.quantity,'unit_price',oi.unit_price,'total_price',oi.total_price,
           'installation_service',oi.installation_service,'installation_charge',oi.installation_charge,
           'fulfillment_status',oi.fulfillment_status,'tracking_number',oi.tracking_number,'created_at',oi.created_at
         ) ORDER BY oi.created_at) FROM order_items oi WHERE oi.order_id=o.id),'[]'::jsonb) AS items,
         (SELECT to_jsonb(fj) FROM fulfillment_jobs fj WHERE fj.order_id=o.id ORDER BY fj.created_at DESC LIMIT 1) AS fulfillment_job
  FROM orders o
  JOIN users u ON u.id=o.user_id
  LEFT JOIN profiles p ON p.user_id=o.user_id`;

export class OrderRepository {
  constructor(private readonly db: QueryableDatabase) {}
  private q(db?: QueryableDatabase){ return db ?? this.db; }

  async listOwn(userId:string, limit=100){
    const r=await this.db.query<any>(`${orderSelect} WHERE o.user_id=$1 AND o.deleted_at IS NULL ORDER BY o.ordered_at DESC LIMIT $2`,[userId,limit]);
    return r.rows;
  }
  async getOwn(userId:string,id:string){
    const r=await this.db.query<any>(`${orderSelect} WHERE o.user_id=$1 AND o.id=$2 AND o.deleted_at IS NULL`,[userId,id]); return r.rows[0]??null;
  }
  async getOwnByNumber(userId:string,orderNumber:string){const r=await this.db.query<any>(`${orderSelect} WHERE o.user_id=$1 AND o.order_number=$2 AND o.deleted_at IS NULL`,[userId,orderNumber]);return r.rows[0]??null;}
  async trackByHash(hash:string){const r=await this.db.query<any>(`SELECT order_number,status,fulfillment_status,tracking_number,courier_name,estimated_delivery_date FROM orders WHERE tracking_token_hash=$1 AND deleted_at IS NULL LIMIT 1`,[hash]);return r.rows[0]??null;}
  async adminList(limit=500){
    const r=await this.db.query<any>(`${orderSelect} WHERE o.deleted_at IS NULL AND o.archived_at IS NULL ORDER BY o.ordered_at DESC LIMIT $1`,[limit]); return r.rows;
  }
  async adminGet(id:string){const r=await this.db.query<any>(`${orderSelect} WHERE o.id=$1 AND o.deleted_at IS NULL`,[id]);return r.rows[0]??null;}
  async lockOwn(userId:string,id:string,db?:QueryableDatabase){const r=await this.q(db).query<any>(`SELECT * FROM orders WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL FOR UPDATE`,[id,userId]);return r.rows[0]??null;}
  async lockAdmin(id:string,db?:QueryableDatabase){const r=await this.q(db).query<any>(`SELECT * FROM orders WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[id]);return r.rows[0]??null;}
  async releaseInventory(orderId:string,db:QueryableDatabase){
    const items=await db.query<any>(`SELECT product_id,quantity FROM order_items WHERE order_id=$1 ORDER BY product_id FOR UPDATE`,[orderId]);
    for(const item of items.rows) await db.query(`UPDATE products SET inventory_quantity=inventory_quantity+$2,updated_at=now() WHERE id=$1`,[item.product_id,item.quantity]);
    await db.query(`UPDATE orders SET inventory_released_at=COALESCE(inventory_released_at,now()),updated_at=now() WHERE id=$1`,[orderId]);
  }
  async releaseCoupon(order:any,db:QueryableDatabase){
    if(!order.coupon_code) return;
    if(order.coupon_consumed_at){
      await db.query(`UPDATE coupons SET used_count=GREATEST(0,used_count-1),updated_at=now() WHERE upper(code)=upper($1)`,[order.coupon_code]);
    }
    await db.query(`UPDATE orders SET coupon_reserved_at=NULL,coupon_consumed_at=NULL,updated_at=now() WHERE id=$1`,[order.id]);
  }
  async cancel(orderId:string,db:QueryableDatabase){const r=await db.query<any>(`UPDATE orders SET status='cancelled',cancelled_at=COALESCE(cancelled_at,now()),updated_at=now() WHERE id=$1 RETURNING *`,[orderId]);return r.rows[0];}
  async transition(orderId:string,target:string,db:QueryableDatabase){
    const r=await db.query<any>(`UPDATE orders SET status=$2,confirmed_at=CASE WHEN $2='confirmed' THEN COALESCE(confirmed_at,now()) ELSE confirmed_at END,cancelled_at=CASE WHEN $2='cancelled' THEN COALESCE(cancelled_at,now()) ELSE cancelled_at END,updated_at=now() WHERE id=$1 RETURNING *`,[orderId,target]);return r.rows[0];
  }
  async archive(orderId:string,db:QueryableDatabase){await db.query(`UPDATE orders SET archived_at=COALESCE(archived_at,now()),updated_at=now() WHERE id=$1`,[orderId]);}
  async checkoutEvent(orderId:string,eventType:string,metadata:Record<string,unknown>,db:QueryableDatabase){await db.query(`INSERT INTO checkout_events(order_id,event_type,metadata) VALUES($1,$2,$3::jsonb)`,[orderId,eventType,JSON.stringify(metadata)]);}
  async listPaymentOps(limit=500){
    const orders=await this.adminList(limit);
    const refunds=await this.db.query<any>(`SELECT id,order_id,refund_type,amount,reason,status,razorpay_refund_id,provider_status,last_error,requested_at,processed_at FROM order_refunds ORDER BY requested_at DESC LIMIT 500`);
    return {orders,refunds:refunds.rows};
  }
}
