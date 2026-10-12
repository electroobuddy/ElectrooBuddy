import type { RequestHandler } from 'express'; import { z } from 'zod'; import type { CartService } from '../services/cart.service.js';
const uuid=z.string().uuid(); const add=z.object({productId:uuid,quantity:z.number().int().min(1).max(99),installationService:z.boolean().default(false)}).strict(); const qty=z.object({quantity:z.number().int().min(1).max(99)}).strict(); const merge=z.object({items:z.array(add).max(100)}).strict();
export class CartController { constructor(private readonly s:CartService){}
 list:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.list(req.auth!.userId)});}catch(e){next(e)}};
 add:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await this.s.add(req.auth!.userId,add.parse(req.body))});}catch(e){next(e)}};
 quantity:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.quantity(req.auth!.userId,uuid.parse(req.params.id),qty.parse(req.body).quantity)});}catch(e){next(e)}};
 toggle:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.toggle(req.auth!.userId,uuid.parse(req.params.id))});}catch(e){next(e)}};
 remove:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.remove(req.auth!.userId,uuid.parse(req.params.id))});}catch(e){next(e)}};
 clear:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.clear(req.auth!.userId)});}catch(e){next(e)}};
 merge:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.merge(req.auth!.userId,merge.parse(req.body).items)});}catch(e){next(e)}};
 wishlist:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.wishlist(req.auth!.userId)});}catch(e){next(e)}};
 addWishlist:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await this.s.addWishlist(req.auth!.userId,uuid.parse(req.params.productId))});}catch(e){next(e)}};
 removeWishlist:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.s.removeWishlist(req.auth!.userId,uuid.parse(req.params.productId))});}catch(e){next(e)}};
}
