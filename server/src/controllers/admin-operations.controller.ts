import type{Request,Response,NextFunction}from'express';import{z}from'zod';import type{AdminOperationsService}from'../services/admin-operations.service.js';
const uuid=z.string().uuid();const testimonial=z.object({name:z.string().trim().min(2).max(120),service:z.string().trim().max(160).nullable().optional(),rating:z.number().int().min(1).max(5),text:z.string().trim().min(5).max(3000)});const settings=z.record(z.string().max(10000));const contact=z.object({requestKey:uuid,name:z.string().trim().min(2).max(120),phone:z.string().trim().min(5).max(32),email:z.string().trim().email().max(320),service:z.string().trim().max(160).nullable().optional(),message:z.string().trim().min(5).max(5000)});const newsletter=z.object({email:z.string().trim().email().max(320)});
export class AdminOperationsController{constructor(private readonly s:AdminOperationsService){}
 contact=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json({success:true,data:await this.s.submitContact(contact.parse(req.body))})}catch(e){next(e)}};
 testimonial=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json({success:true,data:await this.s.submitTestimonial(testimonial.parse(req.body))})}catch(e){next(e)}};
 subscribe=async(req:Request,res:Response,next:NextFunction)=>{try{res.status(201).json({success:true,data:await this.s.subscribe(newsletter.parse(req.body).email)})}catch(e){next(e)}};
 publicStats=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.publicStats()})}catch(e){next(e)}};
 messages=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listMessages()})}catch(e){next(e)}};
 markMessageRead=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.markMessageRead(uuid.parse(req.params.id))})}catch(e){next(e)}};
 subscribers=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listSubscribers()})}catch(e){next(e)}};
 deleteSubscriber=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.deleteSubscriber(uuid.parse(req.params.id))})}catch(e){next(e)}};
 users=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listUsers()})}catch(e){next(e)}};
 userBookings=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.userBookings(uuid.parse(req.params.id))})}catch(e){next(e)}};
 siteSettings=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.listSiteSettings()})}catch(e){next(e)}};
 saveSiteSettings=async(req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.saveSiteSettings(settings.parse(req.body))})}catch(e){next(e)}};
 dashboard=async(_req:Request,res:Response,next:NextFunction)=>{try{res.json({success:true,data:await this.s.dashboard()})}catch(e){next(e)}};
}
