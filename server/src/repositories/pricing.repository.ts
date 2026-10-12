import type { QueryableDatabase } from '../config/database.js';

export interface PricingProduct {
  id:string; name:string; price:string; installation_charge:string; installation_available:boolean;
  weight:string|null; category:string|null; inventory_quantity:number; track_inventory:boolean; allow_backorder:boolean; is_active:boolean;
  category_id:string|null;
}
export interface CouponRow { id:string; code:string; description:string|null; discount_type:'percentage'|'fixed'|'free_shipping'; discount_value:string; min_order_value:string; max_discount_amount:string|null; usage_limit:number|null; used_count:number; usage_limit_per_user:number|null; valid_from:Date; valid_until:Date|null; applicable_categories:string[]; applicable_products:string[]; excluded_products:string[]; applicable_to_all:boolean; applicable_to_new_users_only:boolean; minimum_cart_items:number; is_active:boolean; }
export interface ShippingRateRow { zone_id:string; zone_name:string; base_charge:string; per_kg_charge:string; free_shipping_threshold:string|null; estimated_days_min:number|null; estimated_days_max:number|null; }
export interface TaxSlabRow { id:string; rate:string; applicable_categories:string[]; applicable_to_all:boolean; }

export class PricingRepository {
  constructor(private readonly db: QueryableDatabase) {}
  async products(ids:string[]) {
    const r=await this.db.query<PricingProduct>(`SELECT p.id,p.name,p.price,p.installation_charge,p.installation_available,p.weight,p.category,p.inventory_quantity,p.track_inventory,p.allow_backorder,p.is_active,pc.id AS category_id FROM products p LEFT JOIN product_categories pc ON lower(pc.name)=lower(p.category) AND pc.is_active=true WHERE p.id = ANY($1::uuid[]) AND p.deleted_at IS NULL`,[ids]);
    return r.rows;
  }
  async coupon(code:string){ const r=await this.db.query<CouponRow>(`SELECT * FROM coupons WHERE upper(code)=upper($1) LIMIT 1`,[code]); return r.rows[0]??null; }
  async userCompletedOrderExists(userId:string){ const r=await this.db.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM orders WHERE user_id=$1 AND status <> 'cancelled' AND deleted_at IS NULL AND (payment_method='cod' OR payment_status='paid')) AS exists`,[userId]); return r.rows[0]?.exists??false; }
  async activeCouponUsage(code:string,userId?:string){ const r=await this.db.query<{count:string}>(`SELECT count(*)::text AS count FROM orders WHERE upper(coupon_code)=upper($1) AND status <> 'cancelled' AND deleted_at IS NULL AND (payment_method='cod' OR payment_status='paid' OR (payment_status='pending' AND quote_expires_at>now())) AND ($2::uuid IS NULL OR user_id=$2)`,[code,userId??null]); return Number(r.rows[0]?.count??0); }
  async shipping(state:string,orderValue:number,weight:number){ const r=await this.db.query<ShippingRateRow>(`WITH zone AS (SELECT id,name FROM shipping_zones WHERE is_active=true AND EXISTS (SELECT 1 FROM unnest(states) AS state_name WHERE lower(state_name)=lower($1)) ORDER BY created_at LIMIT 1), chosen_zone AS (SELECT * FROM zone UNION ALL SELECT id,name FROM shipping_zones WHERE is_active=true AND lower(name)='other states' AND NOT EXISTS(SELECT 1 FROM zone) ORDER BY name LIMIT 1) SELECT sr.zone_id,cz.name AS zone_name,sr.base_charge,sr.per_kg_charge,sr.free_shipping_threshold,sr.estimated_days_min,sr.estimated_days_max FROM chosen_zone cz JOIN shipping_rates sr ON sr.zone_id=cz.id WHERE sr.is_active=true AND $2 >= sr.min_order_value AND (sr.max_order_value IS NULL OR $2 <= sr.max_order_value) AND $3 >= sr.min_weight AND (sr.max_weight IS NULL OR $3 <= sr.max_weight) ORDER BY sr.min_order_value DESC,sr.min_weight DESC LIMIT 1`,[state,orderValue,weight]); return r.rows[0]??null; }
  async taxSlabs(){ const r=await this.db.query<TaxSlabRow>(`SELECT id,rate,applicable_categories,applicable_to_all FROM tax_slabs WHERE is_active=true ORDER BY applicable_to_all ASC,created_at ASC`); return r.rows; }
}
