import {describe,it,expect,vi} from 'vitest';
import {RefundService} from '../src/services/refund.service.js';

describe('RefundService authority boundaries',()=>{
 it('blocks customer partial refunds',async()=>{
  const order:any={id:'11111111-1111-4111-8111-111111111111',user_id:'22222222-2222-4222-8222-222222222222',payment_method:'razorpay',payment_status:'paid',razorpay_payment_id:'pay_1',total_amount:'100.00',fulfillment_status:'unfulfilled',shiprocket_order_id:null};
  const tx:any={query:vi.fn(async(sql:string)=>{
   if(sql.includes('FROM order_refunds WHERE order_id=$1 AND request_key=$2')) return {rows:[],rowCount:0};
   if(sql.includes('FROM orders WHERE id=$1 FOR UPDATE')) return {rows:[order],rowCount:1};
   if(sql.includes("COALESCE(SUM(amount),0)::text")) return {rows:[{amount:'0'}],rowCount:1};
   return {rows:[],rowCount:1};
  })};
  const db:any={query:tx.query,withTransaction:(fn:any)=>fn(tx)};
  const provider:any={};
  await expect(new RefundService(db,provider).request({userId:order.user_id,admin:false},{orderId:order.id,requestKey:'33333333-3333-4333-8333-333333333333',amount:50})).rejects.toMatchObject({code:'FULL_REFUND_ONLY'});
 });

 it('blocks delivered orders from direct refund workflow',async()=>{
  const order:any={id:'11111111-1111-4111-8111-111111111111',user_id:'22222222-2222-4222-8222-222222222222',payment_method:'razorpay',payment_status:'paid',razorpay_payment_id:'pay_1',total_amount:'100.00',fulfillment_status:'delivered',shiprocket_order_id:'sr_1'};
  const tx:any={query:vi.fn(async(sql:string)=>sql.includes('FROM order_refunds WHERE order_id=$1 AND request_key=$2')?{rows:[],rowCount:0}:sql.includes('FROM orders WHERE id=$1 FOR UPDATE')?{rows:[order],rowCount:1}:{rows:[],rowCount:1})};
  const db:any={query:tx.query,withTransaction:(fn:any)=>fn(tx)};
  await expect(new RefundService(db,{} as any).request({userId:order.user_id,admin:false},{orderId:order.id,requestKey:'33333333-3333-4333-8333-333333333333'})).rejects.toMatchObject({code:'RETURN_WORKFLOW_REQUIRED'});
 });
});
