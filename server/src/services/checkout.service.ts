import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { DatabaseClient, QueryableDatabase } from '../config/database.js';
import { AppError } from '../errors/app-error.js';
import type { PaymentProvider } from '../providers/payment.provider.js';
import { CheckoutRepository } from '../repositories/checkout.repository.js';

const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export interface CheckoutItemInput { productId:string; quantity:number; installationService:boolean }
export interface CheckoutAddress { fullName:string; email:string; phone:string; addressLine1:string; addressLine2?:string|null; city:string; state:string; postalCode:string; landmark?:string|null; country?:string }
export interface CreateCheckoutInput { requestId:string; items:CheckoutItemInput[]; address:CheckoutAddress; paymentMethod:'cod'|'razorpay'; couponCode?:string|null }

export class CheckoutService {
 constructor(private readonly env:AppEnv, private readonly db:DatabaseClient, private readonly payment:PaymentProvider){}
 private response(order:any,trackingToken?:string|null){ return {success:true,idempotent:!trackingToken,trackingToken:trackingToken??null,orderId:order.id,orderNumber:order.order_number,amount:Number(order.total_amount),paymentMethod:order.payment_method,razorpayOrderId:order.razorpay_order_id??null,razorpayKeyId:order.payment_method==='razorpay'?this.env.RAZORPAY_KEY_ID:null,quoteExpiresAt:order.quote_expires_at,totals:{subtotal:Number(order.subtotal),installationTotal:Number(order.installation_total),shipping:Number(order.shipping_charge),tax:Number(order.tax_amount),discount:Number(order.discount_amount),total:Number(order.total_amount)}}; }
 private async coupon(tx:CheckoutRepository,userId:string,row:any,items:any[],subtotal:number){
  const now=new Date(); if(!row.is_active||new Date(row.valid_from)>now||(row.valid_until&&new Date(row.valid_until)<now)) throw new AppError(400,'INVALID_COUPON','Invalid or expired coupon');
  if(subtotal<Number(row.min_order_value)) throw new AppError(400,'COUPON_MINIMUM_NOT_MET','Minimum order value not met');
  const count=items.reduce((a,x)=>a+x.quantity,0); if(count<row.minimum_cart_items) throw new AppError(400,'COUPON_MINIMUM_ITEMS_NOT_MET','Minimum cart items not met');
  if(row.usage_limit!==null && await tx.activeCouponUsage(row.code)>=row.usage_limit) throw new AppError(409,'COUPON_USAGE_LIMIT_REACHED','Coupon usage limit reached');
  if(row.usage_limit_per_user!==null && await tx.activeCouponUsage(row.code,userId)>=row.usage_limit_per_user) throw new AppError(409,'COUPON_USER_LIMIT_REACHED','Coupon usage limit reached for this user');
  if(row.applicable_to_new_users_only && await tx.userCompletedOrderExists(userId)) throw new AppError(400,'COUPON_NEW_USERS_ONLY','Coupon is for new users only');
  if(items.some(x=>(row.excluded_products??[]).includes(x.productId))) throw new AppError(400,'COUPON_EXCLUDED_PRODUCT','Coupon does not apply to one or more products');
  const eligible=items.filter(x=>row.applicable_to_all||(row.applicable_products??[]).includes(x.productId)||(x.categoryId&&(row.applicable_categories??[]).includes(x.categoryId)));
  if(!row.applicable_to_all&&((row.applicable_products??[]).length||(row.applicable_categories??[]).length)&&eligible.length===0) throw new AppError(400,'COUPON_NOT_APPLICABLE','Coupon is not applicable to this cart');
  const base=money((eligible.length?eligible:items).reduce((a,x)=>a+x.lineSubtotal,0)); let discount=0;
  if(row.discount_type==='percentage') discount=base*Number(row.discount_value)/100; else if(row.discount_type==='fixed') discount=Math.min(Number(row.discount_value),base);
  if(row.max_discount_amount!==null) discount=Math.min(discount,Number(row.max_discount_amount));
  return {id:row.id,code:row.code,discount:money(Math.max(0,discount)),freeShipping:row.discount_type==='free_shipping'};
 }
 async create(userId:string,input:CreateCheckoutInput){
  const prepared=await this.db.withTransaction(async q=>{
   await q.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`${userId}:${input.requestId}`]);
   const r=new CheckoutRepository(q); const existing=await r.existing(userId,input.requestId,true);
   if(existing){
    if(existing.status==='cancelled'||(existing.quote_expires_at&&new Date(existing.quote_expires_at)<=new Date())) throw new AppError(409,'CHECKOUT_REQUEST_EXPIRED','This checkout request is no longer usable. Start a new checkout.');
    if(existing.payment_method==='razorpay'&&!existing.razorpay_order_id) throw new AppError(409,'CHECKOUT_INITIALIZING','Checkout payment initialization is already in progress');
    return {existing};
   }
   const merged=new Map<string,{quantity:number;installationService:boolean}>();
   for(const item of input.items){const old=merged.get(item.productId); const next=(old?.quantity??0)+item.quantity; if(next>this.env.CHECKOUT_MAX_QUANTITY_PER_PRODUCT) throw new AppError(400,'QUANTITY_LIMIT_EXCEEDED','Maximum quantity exceeded'); merged.set(item.productId,{quantity:next,installationService:Boolean(old?.installationService||item.installationService)});}
   const ids=[...merged.keys()].sort(); const products=await r.products(ids); if(products.length!==ids.length) throw new AppError(409,'PRODUCT_NOT_AVAILABLE','One or more products are unavailable');
   const items=products.map(p=>{const req=merged.get(p.id)!; if(!p.is_active) throw new AppError(409,'PRODUCT_NOT_AVAILABLE',`${p.name} is unavailable`); if(req.installationService&&!p.installation_available) throw new AppError(400,'INSTALLATION_NOT_AVAILABLE',`Installation is unavailable for ${p.name}`); if(p.track_inventory&&!p.allow_backorder&&p.inventory_quantity<req.quantity) throw new AppError(409,'INSUFFICIENT_STOCK',`Insufficient stock for ${p.name}`); const unit=Number(p.price),inst=req.installationService?Number(p.installation_charge):0; return {productId:p.id,name:p.name,sku:p.sku,image:p.main_image_url,quantity:req.quantity,unitPrice:unit,lineSubtotal:money(unit*req.quantity),installationService:req.installationService&&p.installation_available,installationUnit:inst,installationTotal:money(inst*req.quantity),weight:Number(p.weight??0)*req.quantity,categoryId:p.category_id,trackInventory:p.track_inventory,allowBackorder:p.allow_backorder};});
   const subtotal=money(items.reduce((a,x)=>a+x.lineSubtotal,0)),installation=money(items.reduce((a,x)=>a+x.installationTotal,0)),weight=items.reduce((a,x)=>a+x.weight,0);
   let coupon:any=null; const code=input.couponCode?.trim().toUpperCase(); if(code){const row=await r.coupon(code); if(!row) throw new AppError(400,'INVALID_COUPON','Invalid coupon code'); coupon=await this.coupon(r,userId,row,items,subtotal);}
   const discounted=money(Math.max(0,subtotal-(coupon?.discount??0))); const ship=await r.shipping(input.address.state,discounted,weight); let shipping=ship?Number(ship.base_charge)+(weight>1?Math.max(0,weight-1)*Number(ship.per_kg_charge):0):50; if(ship?.free_shipping_threshold!==null&&ship?.free_shipping_threshold!==undefined&&discounted>=Number(ship.free_shipping_threshold)) shipping=0; if(coupon?.freeShipping) shipping=0; shipping=money(shipping);
   const slabs=await r.taxSlabs(); let tax=0; let representativeRate=18; for(const x of items){const slab=slabs.find((s:any)=>(s.applicable_categories??[]).includes(x.categoryId??''))??slabs.find((s:any)=>s.applicable_to_all); const rate=Number(slab?.rate??18); representativeRate=rate; const allocated=subtotal>0?(coupon?.discount??0)*(x.lineSubtotal/subtotal):0; tax+=money(Math.max(0,x.lineSubtotal-allocated)*rate/100);} tax=money(tax); const total=money(discounted+installation+shipping+tax);
   const trackingToken=randomBytes(32).toString('base64url'); const expires=new Date(Date.now()+this.env.CHECKOUT_QUOTE_TTL_MINUTES*60000); const orderNumber=`ORD${Date.now()}${randomUUID().slice(0,6).toUpperCase()}`;
   await r.reserveInventory(items);
   const now=new Date(); const order=await r.insertOrder({orderNumber,userId,requestId:input.requestId,status:input.paymentMethod==='cod'?'confirmed':'pending',subtotal,shipping,installation,tax,discount:coupon?.discount??0,total,couponId:coupon?.id??null,couponCode:coupon?.code??null,couponReservedAt:coupon?now:null,couponConsumedAt:input.paymentMethod==='cod'&&coupon?now:null,expiresAt:input.paymentMethod==='razorpay'?expires:null,shippingZoneId:ship?.zone_id??null,taxRate:representativeRate,paymentMethod:input.paymentMethod,address:input.address,weight,trackingHash:hash(trackingToken),confirmedAt:input.paymentMethod==='cod'?now:null});
   await r.insertItems(order.id,items);
   if(input.paymentMethod==='cod'&&coupon){await q.query(`UPDATE coupons SET used_count=used_count+1,updated_at=now() WHERE id=$1`,[coupon.id]);}
   if(input.paymentMethod==='razorpay') await q.query(`UPDATE orders SET payment_init_started_at=now() WHERE id=$1`,[order.id]);
   await r.event(order.id,'checkout.created',input.requestId,{paymentMethod:input.paymentMethod});
   return {order,trackingToken,needsProvider:input.paymentMethod==='razorpay'};
  },{isolationLevel:'READ COMMITTED'});
  if('existing' in prepared) return this.response(prepared.existing);
  if(!prepared.needsProvider) return this.response(prepared.order,prepared.trackingToken);
  try{
   const payment=await this.payment.createOrder({amountMinor:Math.round(Number(prepared.order.total_amount)*100),currency:'INR',receipt:prepared.order.order_number,idempotencyKey:input.requestId,notes:{user_id:userId,internal_order_id:prepared.order.id,checkout_request_id:input.requestId}});
   await this.db.withTransaction(async q=>{const r=new CheckoutRepository(q); const locked=await r.existing(userId,input.requestId,true); if(!locked) throw new Error('Order disappeared during payment initialization'); if(locked.razorpay_order_id&&locked.razorpay_order_id!==payment.providerOrderId) throw new Error('Conflicting provider order'); await r.setRazorpay(locked.id,payment.providerOrderId); await q.query(`UPDATE orders SET payment_init_started_at=NULL WHERE id=$1`,[locked.id]); await r.event(locked.id,'checkout.payment_order_created',input.requestId,{provider:'razorpay'});});
   const refreshed=await new CheckoutRepository(this.db).existing(userId,input.requestId); return this.response(refreshed,prepared.trackingToken);
  }catch(error){
   await this.db.withTransaction(async q=>{const r=new CheckoutRepository(q); const locked=await r.existing(userId,input.requestId,true); if(locked&&locked.inventory_reserved_at&&!locked.inventory_released_at){await r.releaseInventory(locked.id); await r.markProviderFailure(locked.id); await r.event(locked.id,'checkout.payment_init_failed',input.requestId);}}).catch(()=>{});
   throw new AppError(502,'PAYMENT_INITIALIZATION_FAILED','Unable to initialize payment. No payment was taken.');
  }
 }
 async expire(limit=50){ return this.db.withTransaction(async q=>{const r=new CheckoutRepository(q); const rows=await r.expired(limit); for(const row of rows) await r.expireOrder(row.id); return rows.length;}); }
}
