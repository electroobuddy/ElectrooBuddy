import { createHash } from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import type { DatabaseClient } from '../config/database.js';
import { OrderRepository } from '../repositories/order.repository.js';

const moneyKeys=['subtotal','shipping_charge','installation_total','tax_amount','discount_amount','total_amount','coupon_discount','tax_rate','cgst_amount','sgst_amount','igst_amount','refunded_amount'];
export class OrderService {
  private readonly repo:OrderRepository;
  constructor(private readonly db:DatabaseClient){this.repo=new OrderRepository(db);}
  private capabilities(o:any){
    const fulfillment=String(o?.fulfillment_status??'pending');
    const baseCancelable=['pending','confirmed'].includes(String(o?.status))&&!['in_transit','out_for_delivery','delivered'].includes(fulfillment)&&!o?.shiprocket_order_id;
    const paidRazorpay=o?.payment_method==='razorpay'&&['paid','partially_refunded'].includes(String(o?.payment_status));
    const deliveredAt=o?.delivered_at?new Date(o.delivered_at):null;
    const returnWindowEndsAt=deliveredAt?new Date(deliveredAt.getTime()+7*86400000):null;
    const returnWindowOpen=String(o?.status)==='delivered'&&!!deliveredAt&&returnWindowEndsAt!.getTime()>=Date.now();
    return {
      can_cancel:baseCancelable&&!paidRazorpay,
      can_refund_to_cancel:baseCancelable&&paidRazorpay,
      can_return:returnWindowOpen,
      can_replace:returnWindowOpen,
      return_window_ends_at:returnWindowEndsAt?.toISOString()??null,
    };
  }
  private map(o:any){if(!o)return o;const out={...o};for(const k of moneyKeys)if(out[k]!=null)out[k]=Number(out[k]);if(Array.isArray(out.items))out.items=out.items.map((i:any)=>({...i,unit_price:Number(i.unit_price),total_price:Number(i.total_price),installation_charge:Number(i.installation_charge)}));out.post_purchase=this.capabilities(out);return out;}
  async listOwn(userId:string){return (await this.repo.listOwn(userId)).map(x=>this.map(x));}
  async getOwn(userId:string,id:string){const o=await this.repo.getOwn(userId,id);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');return this.map(o);}
  async getOwnByNumber(userId:string,orderNumber:string){const o=await this.repo.getOwnByNumber(userId,orderNumber);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');return this.map(o);}
  async track(token:string){const hash=createHash('sha256').update(token).digest('hex');return this.repo.trackByHash(hash);}
  async lifecycle(userId:string,id:string){
    const order=await this.getOwn(userId,id);
    const [refunds,returns,prior]=await Promise.all([
      this.db.query<any>(`SELECT id,order_id,request_key,refund_type,amount,reason,status,razorpay_refund_id,provider_status,requested_at,processed_at,failed_at,last_error FROM order_refunds WHERE user_id=$1 AND order_id=$2 ORDER BY requested_at DESC`,[userId,id]),
      this.db.query<any>(`SELECT r.*,COALESCE(json_agg(ri ORDER BY ri.id) FILTER(WHERE ri.id IS NOT NULL),'[]') items FROM order_returns r LEFT JOIN order_return_items ri ON ri.return_id=r.id WHERE r.user_id=$1 AND r.order_id=$2 GROUP BY r.id ORDER BY r.requested_at DESC`,[userId,id]),
      this.db.query<any>(`SELECT oi.id order_item_id,oi.quantity,COALESCE(SUM(CASE WHEN rr.status NOT IN('rejected','cancelled') THEN ri.quantity ELSE 0 END),0)::int prior_quantity FROM order_items oi LEFT JOIN order_return_items ri ON ri.order_item_id=oi.id LEFT JOIN order_returns rr ON rr.id=ri.return_id WHERE oi.order_id=$1 GROUP BY oi.id,oi.quantity`,[id]),
    ]);
    const priorById=new Map(prior.rows.map((r:any)=>[String(r.order_item_id),Number(r.prior_quantity??0)]));
    const items=(order.items??[]).map((item:any)=>({...item,return_eligible_quantity:Math.max(0,Number(item.quantity)-Number(priorById.get(String(item.id))??0))}));
    const refundableActive=refunds.rows.filter((r:any)=>['requested','provider_pending','processed'].includes(String(r.status))).reduce((sum:number,r:any)=>sum+Number(r.amount??0),0);
    return {
      order:{...order,items},
      refunds:refunds.rows.map((r:any)=>({...r,amount:Number(r.amount)})),
      returns:returns.rows,
      capabilities:{...order.post_purchase,refundable_amount:Math.max(0,Number(order.total_amount??0)-refundableActive),has_active_return:returns.rows.some((r:any)=>!['rejected','cancelled','refunded','replaced'].includes(String(r.status)))},
    };
  }

  async cancelOwn(userId:string,id:string){
    return this.db.withTransaction(async tx=>{
      const repo=new OrderRepository(tx); const o=await repo.lockOwn(userId,id,tx); if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');
      if(!['pending','confirmed'].includes(o.status)||['in_transit','out_for_delivery','delivered'].includes(o.fulfillment_status)||o.shiprocket_order_id)throw new AppError(409,'ORDER_CANNOT_CANCEL','Order can no longer be cancelled online');
      if(o.payment_method==='razorpay'&&['paid','partially_refunded'].includes(o.payment_status))throw new AppError(409,'REFUND_REQUIRED','Paid Razorpay orders must use the refund request flow');
      if(o.inventory_reserved_at&&!o.inventory_released_at)await repo.releaseInventory(o.id,tx);
      await repo.releaseCoupon(o,tx); const updated=await repo.cancel(o.id,tx); await repo.checkoutEvent(o.id,'order.cancelled',{actor:'customer'},tx); return this.map(updated);
    });
  }
  async adminList(){return (await this.repo.adminList()).map(x=>this.map(x));}
  async adminGet(id:string){const o=await this.repo.adminGet(id);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');return this.map(o);}
  async adminTransition(id:string,target:string){
    return this.db.withTransaction(async tx=>{
      const repo=new OrderRepository(tx); const o=await repo.lockAdmin(id,tx);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');
      if(target==='confirmed'&&o.status==='pending') {if(o.payment_method==='razorpay'&&o.payment_status!=='paid')throw new AppError(409,'PAYMENT_NOT_VERIFIED','Razorpay payment is not verified');}
      else if(target==='processing'&&o.status==='confirmed'){}
      else if(target==='cancelled'&&['pending','confirmed'].includes(o.status)){
        if(o.shiprocket_order_id||['in_transit','out_for_delivery','delivered'].includes(o.fulfillment_status))throw new AppError(409,'SHIPMENT_ACTIVE','Shipment must be resolved before cancellation');
        if(o.payment_method==='razorpay'&&['paid','partially_refunded'].includes(o.payment_status))throw new AppError(409,'REFUND_REQUIRED','Paid order requires refund authority');
        if(o.inventory_reserved_at&&!o.inventory_released_at)await repo.releaseInventory(o.id,tx); await repo.releaseCoupon(o,tx);
      } else throw new AppError(409,'INVALID_ORDER_TRANSITION',`Invalid order transition ${o.status} -> ${target}`);
      const updated=await repo.transition(o.id,target,tx);await repo.checkoutEvent(o.id,'order.admin_transition',{from:o.status,to:target,actor:'admin'},tx);return this.map(updated);
    });
  }
  async adminArchive(id:string){return this.db.withTransaction(async tx=>{const repo=new OrderRepository(tx);const o=await repo.lockAdmin(id,tx);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');if(!['cancelled','delivered'].includes(o.status))throw new AppError(409,'ORDER_ARCHIVE_STATE','Only terminal orders can be archived');await repo.archive(id,tx);return {archived:true};});}
  async paymentOps(){const x=await this.repo.listPaymentOps();return {orders:x.orders.map(o=>this.map(o)),refunds:x.refunds.map((r:any)=>({...r,amount:Number(r.amount)}))};}
}
