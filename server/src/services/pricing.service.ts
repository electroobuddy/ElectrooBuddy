import { AppError } from '../errors/app-error.js';
import type { PricingRepository, CouponRow, PricingProduct } from '../repositories/pricing.repository.js';
export interface QuoteItem { productId:string; quantity:number; installationService:boolean }
export interface QuoteInput { items:QuoteItem[]; state:string; couponCode?:string|null }
const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export class PricingService {
 constructor(private readonly r:PricingRepository){}
 private async couponPreview(userId:string,coupon:CouponRow,items:{p:PricingProduct;q:number;line:number}[],subtotal:number){
   const now=new Date(); if(!coupon.is_active||coupon.valid_from>now||(coupon.valid_until&&coupon.valid_until<now)) throw new AppError(400,'INVALID_COUPON','Invalid or expired coupon');
   if(subtotal<Number(coupon.min_order_value)) throw new AppError(400,'COUPON_MINIMUM_NOT_MET',`Minimum order value of ₹${coupon.min_order_value} required`);
   const itemCount=items.reduce((a,x)=>a+x.q,0); if(itemCount<coupon.minimum_cart_items) throw new AppError(400,'COUPON_MINIMUM_ITEMS_NOT_MET',`Minimum ${coupon.minimum_cart_items} items required`);
   if(coupon.usage_limit!==null&&(await this.r.activeCouponUsage(coupon.code))>=coupon.usage_limit) throw new AppError(400,'COUPON_USAGE_LIMIT_REACHED','Coupon usage limit reached');
   if(coupon.applicable_to_new_users_only&&await this.r.userCompletedOrderExists(userId)) throw new AppError(400,'COUPON_NEW_USERS_ONLY','This coupon is for new users only');
   if(coupon.usage_limit_per_user!==null&&(await this.r.activeCouponUsage(coupon.code,userId))>=coupon.usage_limit_per_user) throw new AppError(400,'COUPON_USER_LIMIT_REACHED','Coupon usage limit reached for this user');
   if(items.some(({p})=>coupon.excluded_products.includes(p.id))) throw new AppError(400,'COUPON_EXCLUDED_PRODUCT','Coupon does not apply to one or more products');
   const eligible=items.filter(({p})=>coupon.applicable_to_all||coupon.applicable_products.includes(p.id)||(p.category_id?coupon.applicable_categories.includes(p.category_id):false));
   if(!coupon.applicable_to_all&&(coupon.applicable_products.length||coupon.applicable_categories.length)&&eligible.length===0) throw new AppError(400,'COUPON_NOT_APPLICABLE','Coupon is not applicable to this cart');
   const base=money((eligible.length?eligible:items).reduce((a,x)=>a+x.line,0)); let discount=0;
   if(coupon.discount_type==='percentage') discount=base*(Number(coupon.discount_value)/100); else if(coupon.discount_type==='fixed') discount=Math.min(Number(coupon.discount_value),base);
   if(coupon.max_discount_amount!==null) discount=Math.min(discount,Number(coupon.max_discount_amount));
   return {id:coupon.id,code:coupon.code,type:coupon.discount_type,discountAmount:money(Math.max(0,discount)),freeShipping:coupon.discount_type==='free_shipping'};
 }
 async quote(userId:string,input:QuoteInput){
   const ids=[...new Set(input.items.map(i=>i.productId))]; const products=await this.r.products(ids); const map=new Map<string,PricingProduct>(products.map(p=>[p.id,p])); if(products.length!==ids.length) throw new AppError(400,'PRODUCT_NOT_AVAILABLE','One or more products are unavailable');
   const lines=input.items.map(i=>{const p=map.get(i.productId)!; if(!p.is_active) throw new AppError(400,'PRODUCT_NOT_AVAILABLE',`${p.name} is unavailable`); if(i.installationService&&!p.installation_available) throw new AppError(400,'INSTALLATION_NOT_AVAILABLE',`Installation is not available for ${p.name}`); if(p.track_inventory&&!p.allow_backorder&&i.quantity>p.inventory_quantity) throw new AppError(409,'INSUFFICIENT_STOCK',`Insufficient stock for ${p.name}`); const unit=Number(p.price),inst=i.installationService?Number(p.installation_charge):0; return {p,q:i.quantity,line:money(unit*i.quantity),installation:money(inst*i.quantity),weight:Number(p.weight??0)*i.quantity,unitPrice:unit,installationUnit:inst};});
   const subtotal=money(lines.reduce((a,x)=>a+x.line,0)); const installation=money(lines.reduce((a,x)=>a+x.installation,0)); const weight=lines.reduce((a,x)=>a+x.weight,0);
   let coupon=null as any; if(input.couponCode?.trim()){ const row=await this.r.coupon(input.couponCode.trim()); if(!row) throw new AppError(400,'INVALID_COUPON','Invalid coupon code'); coupon=await this.couponPreview(userId,row,lines,subtotal); }
   const discountedSubtotal=money(Math.max(0,subtotal-(coupon?.discountAmount??0))); const ship=await this.r.shipping(input.state,discountedSubtotal,weight); let shipping=ship?Number(ship.base_charge)+(weight>1?Math.max(0,weight-1)*Number(ship.per_kg_charge):0):50; if(ship?.free_shipping_threshold!==null&&ship?.free_shipping_threshold!==undefined&&discountedSubtotal>=Number(ship.free_shipping_threshold)) shipping=0; if(coupon?.freeShipping) shipping=0; shipping=money(shipping);
   const slabs=await this.r.taxSlabs(); let tax=0; const taxLines=lines.map(x=>{const slab=slabs.find(s=>s.applicable_categories.includes(x.p.category_id??''))??slabs.find(s=>s.applicable_to_all); const rate=Number(slab?.rate??18); const allocatedDiscount=subtotal>0?(coupon?.discountAmount??0)*(x.line/subtotal):0; const taxable=money(Math.max(0,x.line-allocatedDiscount)); const amount=money(taxable*rate/100); tax+=amount; return {productId:x.p.id,rate,taxableAmount:taxable,taxAmount:amount};}); tax=money(tax);
   const total=money(discountedSubtotal+installation+shipping+tax);
   return {policyVersion:'phase10-v1',currency:'INR',items:lines.map(x=>({productId:x.p.id,name:x.p.name,quantity:x.q,unitPrice:x.unitPrice,lineSubtotal:x.line,installationUnit:x.installationUnit,installationTotal:x.installation})),subtotal,installationTotal:installation,coupon,discountAmount:coupon?.discountAmount??0,shipping:{amount:shipping,zone:ship?.zone_name??'Standard',estimatedDays:ship?.estimated_days_min&&ship?.estimated_days_max?`${ship.estimated_days_min}-${ship.estimated_days_max} days`:'3-5 days',free:shipping===0},tax:{amount:tax,lines:taxLines},total,quoteOnly:true};
 }
}
