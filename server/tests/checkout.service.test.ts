import { describe,it,expect,vi } from 'vitest';
import { CheckoutService } from '../src/services/checkout.service.js';

describe('CheckoutService boundaries',()=>{
 it('does not call payment provider for COD',async()=>{
  const payment={createOrder:vi.fn(),verifyPayment:vi.fn(),refund:vi.fn()};
  const order={id:'o',order_number:'ORD1',total_amount:'118.00',payment_method:'cod',razorpay_order_id:null,quote_expires_at:null,subtotal:'100',installation_total:'0',shipping_charge:'0',tax_amount:'18',discount_amount:'0'};
  const q:any={query:vi.fn(async(sql:string)=>{
   if(sql.includes('pg_advisory')) return {rows:[],rowCount:1};
   if(sql.includes('FROM orders WHERE user_id')) return {rows:[]};
   if(sql.includes('FROM products p')) return {rows:[{id:'11111111-1111-4111-8111-111111111111',name:'P',sku:null,main_image_url:null,price:'100',installation_charge:'0',installation_available:false,inventory_quantity:5,track_inventory:true,allow_backorder:false,is_active:true,weight:'0',category:null,category_id:null}]};
   if(sql.startsWith('UPDATE products SET inventory_quantity=inventory_quantity-')) return {rows:[],rowCount:1};
   if(sql.includes('FROM tax_slabs')) return {rows:[{rate:'18',applicable_categories:[],applicable_to_all:true}]};
   if(sql.includes('WITH zone AS')) return {rows:[{zone_id:'z',zone_name:'Metro',base_charge:'0',per_kg_charge:'0',free_shipping_threshold:'0',estimated_days_min:1,estimated_days_max:2}]};
   if(sql.startsWith('INSERT INTO orders')) return {rows:[order],rowCount:1};
   return {rows:[],rowCount:1};
  })};
  const db:any={withTransaction:(fn:any)=>fn(q),query:q.query};
  const env:any={CHECKOUT_MAX_QUANTITY_PER_PRODUCT:20,CHECKOUT_QUOTE_TTL_MINUTES:20,RAZORPAY_KEY_ID:''};
  const service=new CheckoutService(env,db,payment as any);
  const result=await service.create('22222222-2222-4222-8222-222222222222',{requestId:'33333333-3333-4333-8333-333333333333',items:[{productId:'11111111-1111-4111-8111-111111111111',quantity:1,installationService:false}],address:{fullName:'A User',email:'a@example.com',phone:'9876543210',addressLine1:'Street',city:'Indore',state:'Madhya Pradesh',postalCode:'452001'},paymentMethod:'cod'});
  expect(payment.createOrder).not.toHaveBeenCalled(); expect(result.paymentMethod).toBe('cod');
 });
});
