import { describe, expect, it } from 'vitest';
import { PricingService } from '../src/services/pricing.service.js';
const repo:any={
 products:async()=>[{id:'11111111-1111-4111-8111-111111111111',name:'Fan',price:'1000.00',installation_charge:'100.00',installation_available:true,weight:'2.0',category:'Fans',category_id:'22222222-2222-4222-8222-222222222222',inventory_quantity:10,track_inventory:true,allow_backorder:false,is_active:true}],
 coupon:async()=>({id:'33333333-3333-4333-8333-333333333333',code:'SAVE10',description:null,discount_type:'percentage',discount_value:'10',min_order_value:'0',max_discount_amount:null,usage_limit:null,used_count:0,usage_limit_per_user:null,valid_from:new Date(Date.now()-1000),valid_until:null,applicable_categories:[],applicable_products:[],excluded_products:[],applicable_to_all:true,applicable_to_new_users_only:false,minimum_cart_items:1,is_active:true}),
 userCompletedOrderExists:async()=>false,activeCouponUsage:async()=>0,
 shipping:async()=>({zone_id:'z',zone_name:'Metro',base_charge:'40',per_kg_charge:'0',free_shipping_threshold:'500',estimated_days_min:1,estimated_days_max:2}),
 taxSlabs:async()=>[{id:'t',rate:'18',applicable_categories:[],applicable_to_all:true}]
};
describe('PricingService',()=>{it('builds a non-mutating server authoritative quote',async()=>{const q=await new PricingService(repo).quote('u',{items:[{productId:'11111111-1111-4111-8111-111111111111',quantity:1,installationService:true}],state:'Delhi',couponCode:'SAVE10'});expect(q.subtotal).toBe(1000);expect(q.installationTotal).toBe(100);expect(q.discountAmount).toBe(100);expect(q.shipping.amount).toBe(0);expect(q.tax.amount).toBe(162);expect(q.total).toBe(1162);expect(q.quoteOnly).toBe(true);});});
