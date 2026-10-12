import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { PaymentService } from '../services/payment.service.js';
import { AppError } from '../errors/app-error.js';

const verifySchema=z.object({
  orderId:z.string().uuid(),
  razorpayPaymentId:z.string().min(1).max(200),
  razorpayOrderId:z.string().min(1).max(200),
  razorpaySignature:z.string().regex(/^[0-9a-f]{64}$/i),
});

export class PaymentController {
  constructor(private readonly service:PaymentService){}
  verify=async(req:Request,res:Response,next:NextFunction)=>{try{
    if(!req.auth?.userId) throw new AppError(401,'UNAUTHORIZED','Authentication required');
    const input=verifySchema.parse(req.body);
    res.json({success:true,data:await this.service.verifyUserPayment(req.auth.userId,input)});
  }catch(e){next(e)}};

  webhook=async(req:Request,res:Response,next:NextFunction)=>{try{
    if(!Buffer.isBuffer(req.body)) throw new AppError(400,'INVALID_WEBHOOK_BODY','Webhook body must be raw');
    const sig=String(req.header('x-razorpay-signature')??'');
    const eventId=req.header('x-razorpay-event-id');
    const data=await this.service.handleWebhook(req.body,sig,eventId);
    res.json(data);
  }catch(e){next(e)}};
}
