import { describe,it,expect,vi } from 'vitest';
import { OrderService } from '../src/services/order.service.js';

describe('OrderService authority boundaries',()=>{
 it('releases native inventory and consumed COD coupon when eligible order is cancelled',async()=>{
  const calls:string[]=[];
  const order:any={id:'11111111-1111-4111-8111-111111111111',user_id:'22222222-2222-4222-8222-222222222222',status:'confirmed',payment_method:'cod',payment_status:'pending',fulfillment_status:'unfulfilled',shiprocket_order_id:null,inventory_reserved_at:new Date(),inventory_released_at:null,coupon_code:'SAVE10',coupon_consumed_at:new Date()};
  const tx:any={query:vi.fn(async(sql:string)=>{calls.push(sql);
   if(sql.includes('FROM orders WHERE id=$1 AND user_id=$2')) return {rows:[order],rowCount:1};
   if(sql.includes('FROM order_items')) return {rows:[{product_id:'33333333-3333-4333-8333-333333333333',quantity:2}],rowCount:1};
   if(sql.includes("SET status='cancelled'")) return {rows:[{...order,status:'cancelled'}],rowCount:1};
   return {rows:[],rowCount:1};
  })};
  const db:any={query:tx.query,withTransaction:(fn:any)=>fn(tx)};
  const result=await new OrderService(db).cancelOwn(order.user_id,order.id);
  expect(result.status).toBe('cancelled');
  expect(calls.some(x=>x.includes('inventory_quantity=inventory_quantity+$2'))).toBe(true);
  expect(calls.some(x=>x.includes('GREATEST(0,used_count-1)'))).toBe(true);
 });

 it('blocks direct cancellation of a paid Razorpay order',async()=>{
  const order:any={id:'11111111-1111-4111-8111-111111111111',user_id:'22222222-2222-4222-8222-222222222222',status:'confirmed',payment_method:'razorpay',payment_status:'paid',fulfillment_status:'unfulfilled',shiprocket_order_id:null};
  const tx:any={query:vi.fn(async(sql:string)=>sql.includes('FROM orders WHERE id=$1 AND user_id=$2')?{rows:[order],rowCount:1}:{rows:[],rowCount:1})};
  const db:any={query:tx.query,withTransaction:(fn:any)=>fn(tx)};
  await expect(new OrderService(db).cancelOwn(order.user_id,order.id)).rejects.toMatchObject({code:'REFUND_REQUIRED'});
 });
});
