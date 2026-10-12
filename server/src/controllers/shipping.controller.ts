import type {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import type {ShippingService} from '../services/shipping.service.js';
const uuid=z.string().uuid();
const settings=z.object({enabled:z.boolean(),autoCreateShipment:z.boolean(),defaultWeight:z.number().positive().max(100),defaultLength:z.number().positive().max(500),defaultBreadth:z.number().positive().max(500),defaultHeight:z.number().positive().max(500)});
export class ShippingController{
 constructor(private s:ShippingService){}
 getSettings=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.settings()});}catch(e){next(e)}};
 saveSettings=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.saveSettings(settings.parse(req.body))});}catch(e){next(e)}};
 test=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.test()});}catch(e){next(e)}};
 create=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.create(uuid.parse(req.params.id))});}catch(e){next(e)}};
 cancel=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.cancel(uuid.parse(req.params.id))});}catch(e){next(e)}};
 sync=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.sync(uuid.parse(req.params.id))});}catch(e){next(e)}};
 documents=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.documents(uuid.parse(req.params.id))});}catch(e){next(e)}};
 operations=async(req:Request,res:Response,next:NextFunction)=>{try{const limit=Math.min(200,Math.max(1,Number(req.query.limit||100)));res.json({success:true,data:await this.s.operations(limit)});}catch(e){next(e)}};
 retryOrder=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.retryOrder(uuid.parse(req.params.id))});}catch(e){next(e)}};
 createReplacement=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.createReplacement(uuid.parse(req.params.id))});}catch(e){next(e)}};
 retryReplacement=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.retryReplacement(uuid.parse(req.params.id))});}catch(e){next(e)}};
 replacementDocuments=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.replacementDocuments(uuid.parse(req.params.id))});}catch(e){next(e)}};
 process=async(_req:Request,res:Response,next:NextFunction)=>{try{const orders=await this.s.processQueue(),replacements=await this.s.processReplacementQueue();res.json({success:true,data:{orders,replacements}});}catch(e){next(e)}};
 webhook=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.webhook(Buffer.isBuffer(req.body)?req.body:Buffer.from(''),req.headers)});}catch(e){next(e)}};
}
