import type { DatabaseClient, QueryableDatabase } from '../config/database.js';

export interface CartLineInput { productId:string; quantity:number; installationService:boolean }
export class CartRepository {
  constructor(private readonly db: DatabaseClient) {}
  async listCart(userId:string, tx:QueryableDatabase=this.db){
    const r=await tx.query(`SELECT c.id,c.product_id,c.quantity,c.installation_service,p.name,p.slug,p.price,p.main_image_url,p.installation_charge,p.is_active,p.deleted_at,p.track_inventory,p.inventory_quantity,p.allow_backorder
      FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 ORDER BY c.created_at`,[userId]);
    return r.rows;
  }
  async lockProduct(productId:string, tx:QueryableDatabase){ const r=await tx.query(`SELECT id,name,slug,price,main_image_url,installation_charge,is_active,deleted_at,track_inventory,inventory_quantity,allow_backorder FROM products WHERE id=$1 FOR UPDATE`,[productId]); return r.rows[0]??null; }
  async upsertCartItem(userId:string,input:CartLineInput){ return this.db.withTransaction(async tx=>{
    const p=await this.lockProduct(input.productId,tx); if(!p) return {kind:'missing' as const};
    const existing=await tx.query(`SELECT id,quantity FROM cart_items WHERE user_id=$1 AND product_id=$2 AND installation_service=$3 FOR UPDATE`,[userId,input.productId,input.installationService]);
    const total=await tx.query(`SELECT COALESCE(sum(quantity),0)::int AS quantity FROM cart_items WHERE user_id=$1 AND product_id=$2`,[userId,input.productId]);
    const nextTotal=Number(total.rows[0]?.quantity??0)+input.quantity;
    const next=(existing.rows[0]?.quantity??0)+input.quantity;
    if(!p.is_active||p.deleted_at) return {kind:'unavailable' as const};
    if(p.track_inventory&&!p.allow_backorder&&nextTotal>p.inventory_quantity) return {kind:'stock' as const,available:Number(p.inventory_quantity)};
    if(existing.rows[0]) await tx.query(`UPDATE cart_items SET quantity=$2,updated_at=now() WHERE id=$1`,[existing.rows[0].id,next]);
    else await tx.query(`INSERT INTO cart_items(user_id,product_id,quantity,installation_service) VALUES($1,$2,$3,$4)`,[userId,input.productId,input.quantity,input.installationService]);
    return {kind:'ok' as const};
  });}
  async setQuantity(userId:string,id:string,quantity:number){ return this.db.withTransaction(async tx=>{
    const row=await tx.query(`SELECT c.id,c.product_id FROM cart_items c WHERE c.id=$1 AND c.user_id=$2 FOR UPDATE`,[id,userId]); if(!row.rows[0]) return {kind:'missing' as const};
    const p=await this.lockProduct(row.rows[0].product_id,tx); if(!p||!p.is_active||p.deleted_at) return {kind:'unavailable' as const};
    const other=await tx.query(`SELECT COALESCE(sum(quantity),0)::int AS quantity FROM cart_items WHERE user_id=$1 AND product_id=$2 AND id<>$3`,[userId,row.rows[0].product_id,id]);
    if(p.track_inventory&&!p.allow_backorder&&(Number(other.rows[0]?.quantity??0)+quantity)>p.inventory_quantity) return {kind:'stock' as const,available:Number(p.inventory_quantity)};
    await tx.query(`UPDATE cart_items SET quantity=$3,updated_at=now() WHERE id=$1 AND user_id=$2`,[id,userId,quantity]); return {kind:'ok' as const};
  });}
  async toggleInstallation(userId:string,id:string){ return this.db.withTransaction(async tx=>{
    const row=await tx.query(`SELECT id,product_id,installation_service FROM cart_items WHERE id=$1 AND user_id=$2 FOR UPDATE`,[id,userId]); if(!row.rows[0]) return false;
    const next=!row.rows[0].installation_service;
    const collision=await tx.query(`SELECT id,quantity FROM cart_items WHERE user_id=$1 AND product_id=$2 AND installation_service=$3 AND id<>$4 FOR UPDATE`,[userId,row.rows[0].product_id,next,id]);
    if(collision.rows[0]) { await tx.query(`UPDATE cart_items SET quantity=quantity+(SELECT quantity FROM cart_items WHERE id=$2),updated_at=now() WHERE id=$1`,[collision.rows[0].id,id]); await tx.query(`DELETE FROM cart_items WHERE id=$1`,[id]); }
    else await tx.query(`UPDATE cart_items SET installation_service=$3,updated_at=now() WHERE id=$1 AND user_id=$2`,[id,userId,next]); return true;
  });}
  async deleteItem(userId:string,id:string){ const r=await this.db.query(`DELETE FROM cart_items WHERE id=$1 AND user_id=$2 RETURNING id`,[id,userId]); return Boolean(r.rows[0]); }
  async clear(userId:string){ await this.db.query(`DELETE FROM cart_items WHERE user_id=$1`,[userId]); }
  async merge(userId:string,items:CartLineInput[]){ for(const item of items) await this.upsertCartItem(userId,item); }
  async listWishlist(userId:string){ const r=await this.db.query(`SELECT w.id,w.product_id,w.created_at,p.name,p.slug,p.price,p.compare_at_price,p.main_image_url,p.is_active,p.deleted_at,p.track_inventory,p.inventory_quantity FROM wishlist w JOIN products p ON p.id=w.product_id WHERE w.user_id=$1 ORDER BY w.created_at DESC`,[userId]); return r.rows; }
  async addWishlist(userId:string,productId:string){ const r=await this.db.query(`INSERT INTO wishlist(user_id,product_id) SELECT $1,p.id FROM products p WHERE p.id=$2 AND p.is_active=true AND p.deleted_at IS NULL ON CONFLICT(user_id,product_id) DO NOTHING RETURNING id`,[userId,productId]); if(r.rows[0]) return true; const e=await this.db.query(`SELECT 1 FROM wishlist WHERE user_id=$1 AND product_id=$2`,[userId,productId]); return Boolean(e.rows[0]); }
  async removeWishlist(userId:string,productId:string){ await this.db.query(`DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2`,[userId,productId]); }
}
