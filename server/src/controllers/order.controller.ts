import type {Request,Response,NextFunction} from 'express';import {z} from 'zod';import {AppError} from '../errors/app-error.js';import type {OrderService} from '../services/order.service.js';
const id=z.string().uuid();const orderNumber=z.string().min(3).max(80).regex(/^[A-Za-z0-9_-]+$/);const token=z.string().min(40).max(200);const transition=z.object({target:z.enum(['confirmed','processing','cancelled'])});
export class OrderController{constructor(private readonly s:OrderService){}
 private user(req:Request){if(!req.auth?.userId)throw new AppError(401,'AUTH_REQUIRED','Authentication required');return req.auth.userId;}
 listOwn=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listOwn(this.user(req))});}catch(e){next(e)}};
 getOwn=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.getOwn(this.user(req),id.parse(req.params.id))});}catch(e){next(e)}};
 lifecycle=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.lifecycle(this.user(req),id.parse(req.params.id))});}catch(e){next(e)}};
 getOwnByNumber=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.getOwnByNumber(this.user(req),orderNumber.parse(req.params.orderNumber))});}catch(e){next(e)}};
 track=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.track(token.parse(req.body?.token))});}catch(e){next(e)}};
 cancelOwn=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.cancelOwn(this.user(req),id.parse(req.params.id))});}catch(e){next(e)}};
 adminList=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.adminList()});}catch(e){next(e)}};
 adminGet=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.adminGet(id.parse(req.params.id))});}catch(e){next(e)}};
 adminTransition=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.adminTransition(id.parse(req.params.id),transition.parse(req.body).target)});}catch(e){next(e)}};
 adminArchive=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.adminArchive(id.parse(req.params.id))});}catch(e){next(e)}};
 paymentOps=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.paymentOps()});}catch(e){next(e)}};
}
