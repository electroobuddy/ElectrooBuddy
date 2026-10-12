import { AppError } from '../errors/app-error.js';
import type { CartRepository, CartLineInput } from '../repositories/cart.repository.js';
const num=(v:any)=>v==null?0:Number(v);
export class CartService {
 constructor(private readonly repo:CartRepository){}
 private map(rows:any[]){ return rows.filter(r=>r.is_active&&!r.deleted_at).map(r=>({id:r.id,product_id:r.product_id,product_name:r.name,product_slug:r.slug,product_image:r.main_image_url,price:num(r.price),quantity:Number(r.quantity),installation_service:Boolean(r.installation_service),installation_charge:r.installation_service?num(r.installation_charge):0,original_installation_charge:num(r.installation_charge),track_inventory:Boolean(r.track_inventory),inventory_quantity:Number(r.inventory_quantity??0),allow_backorder:Boolean(r.allow_backorder)})); }
 async list(userId:string){ return this.map(await this.repo.listCart(userId)); }
 async add(userId:string,input:CartLineInput){ const x=await this.repo.upsertCartItem(userId,input); this.guard(x); return this.list(userId); }
 async quantity(userId:string,id:string,quantity:number){ const x=await this.repo.setQuantity(userId,id,quantity); this.guard(x); return this.list(userId); }
 async toggle(userId:string,id:string){ if(!await this.repo.toggleInstallation(userId,id)) throw new AppError(404,'CART_ITEM_NOT_FOUND','Cart item not found'); return this.list(userId); }
 async remove(userId:string,id:string){ if(!await this.repo.deleteItem(userId,id)) throw new AppError(404,'CART_ITEM_NOT_FOUND','Cart item not found'); return this.list(userId); }
 async clear(userId:string){ await this.repo.clear(userId); return []; }
 async merge(userId:string,items:CartLineInput[]){ await this.repo.merge(userId,items); return this.list(userId); }
 async wishlist(userId:string){ return (await this.repo.listWishlist(userId)).filter((r:any)=>r.is_active&&!r.deleted_at).map((r:any)=>({id:r.id,product_id:r.product_id,created_at:r.created_at,product:{id:r.product_id,name:r.name,slug:r.slug,price:num(r.price),compare_at_price:r.compare_at_price==null?null:num(r.compare_at_price),main_image_url:r.main_image_url,track_inventory:Boolean(r.track_inventory),inventory_quantity:Number(r.inventory_quantity??0)}})); }
 async addWishlist(userId:string,pid:string){ if(!await this.repo.addWishlist(userId,pid)) throw new AppError(404,'PRODUCT_NOT_FOUND','Product not found'); return this.wishlist(userId); }
 async removeWishlist(userId:string,pid:string){ await this.repo.removeWishlist(userId,pid); return this.wishlist(userId); }
 private guard(x:any){ if(x.kind==='missing') throw new AppError(404,'PRODUCT_OR_CART_NOT_FOUND','Product or cart item not found'); if(x.kind==='unavailable') throw new AppError(409,'PRODUCT_UNAVAILABLE','Product is unavailable'); if(x.kind==='stock') throw new AppError(409,'INSUFFICIENT_STOCK',`Only ${x.available} item(s) available`); }
}
