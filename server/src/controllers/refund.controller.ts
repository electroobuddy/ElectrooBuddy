import type {Request,Response,NextFunction} from 'express';import {z} from 'zod';import type {RefundService} from '../services/refund.service.js';import {AppError} from '../errors/app-error.js';
const id=z.string().uuid();const reqSchema=z.object({requestKey:z.string().uuid(),amount:z.number().positive().optional(),reason:z.string().max(500).optional()});
export class RefundController{constructor(private readonly s:RefundService){}private actor(req:Request){if(!req.auth?.userId)throw new AppError(401,'AUTH_REQUIRED','Authentication required');return{userId:req.auth.userId,admin:req.auth.roles?.includes('admin')??false};}
 requestOwn=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.request(this.actor(req),{orderId:id.parse(req.params.id),...reqSchema.parse(req.body)})});}catch(e){next(e)}};
 requestAdmin=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.request(this.actor(req),{orderId:id.parse(req.params.id),...reqSchema.parse(req.body)})});}catch(e){next(e)}};
 listOwn=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listOwn(this.actor(req).userId)});}catch(e){next(e)}};
 reconcile=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.reconcile(100)});}catch(e){next(e)}};
 webhook=async(req:Request,res:Response,next:NextFunction)=>{try{if(!Buffer.isBuffer(req.body))throw new AppError(400,'INVALID_WEBHOOK_BODY','Webhook body must be raw');res.json(await this.s.handleWebhook(req.body,String(req.header('x-razorpay-signature')??''),req.header('x-razorpay-event-id')));}catch(e){next(e)}};
}
