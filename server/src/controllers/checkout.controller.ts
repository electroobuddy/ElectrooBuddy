import { omitUndefined } from '../utils/omit-undefined.js';
import type { Request,Response,NextFunction } from 'express';
import { z } from 'zod';
import type { CheckoutService } from '../services/checkout.service.js';
import { AppError } from '../errors/app-error.js';
const uuid=z.string().uuid();
const schema=z.object({requestId:uuid.optional(),items:z.array(z.object({productId:uuid,quantity:z.number().int().min(1).max(99),installationService:z.boolean().default(false)})).min(1).max(100),address:z.object({fullName:z.string().trim().min(2).max(120),email:z.string().email().max(254),phone:z.string().regex(/^[6-9]\d{9}$/),addressLine1:z.string().trim().min(3).max(240),addressLine2:z.string().trim().max(240).nullable().optional(),city:z.string().trim().min(2).max(120),state:z.string().trim().min(2).max(120),postalCode:z.string().regex(/^\d{6}$/),landmark:z.string().trim().max(180).nullable().optional(),country:z.string().trim().min(2).max(80).default('India')}),paymentMethod:z.enum(['cod','razorpay']),couponCode:z.string().trim().max(64).nullable().optional()});
export class CheckoutController{
 constructor(private readonly service:CheckoutService){}
 create=async(req:Request,res:Response,next:NextFunction)=>{try{
  const input=schema.parse(req.body);
  const header=typeof req.headers['idempotency-key']==='string'?req.headers['idempotency-key']:undefined;
  const requestId=header??input.requestId;
  if(!requestId||!uuid.safeParse(requestId).success) throw new AppError(400,'IDEMPOTENCY_KEY_REQUIRED','A UUID Idempotency-Key header is required');
  if(input.requestId&&input.requestId!==requestId) throw new AppError(400,'IDEMPOTENCY_KEY_MISMATCH','Idempotency key does not match request body');
  const data=await this.service.create(req.auth!.userId,{...omitUndefined(input), address: omitUndefined(input.address), requestId});
  res.status(data.idempotent?200:201).json({success:true,data});
 }catch(e){next(e)}}
}
