import { omitUndefined } from '../utils/omit-undefined.js';
import type { RequestHandler } from 'express';
import { z } from 'zod'; import type { TechnicianService } from '../services/technician.service.js';

const uuid=z.string().uuid();
const status=z.enum(['active','busy','offline']);
const input=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(254),password:z.string().min(12).max(128),phone:z.string().trim().max(30).optional().nullable(),address:z.string().trim().max(300).optional().nullable(),skills:z.array(z.string().trim().min(1).max(80)).max(40).default([]),experience:z.number().int().min(0).max(80).default(0),dailyLimit:z.number().int().min(0).max(100).default(5),priority:z.number().int().min(-100).max(100).default(1),status:status.default('active'),profileUrl:z.string().url().max(2000).optional().nullable()}).strict();
const update=input.omit({email:true,password:true}).partial().strict();
const application=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(254),phone:z.string().trim().max(30).optional().nullable(),address:z.string().trim().max(300).optional().nullable(),skills:z.array(z.string().trim().min(1).max(80)).max(40).default([]),experience:z.number().int().min(0).max(80).default(0),profileUrl:z.string().url().max(2000).optional().nullable()}).strict();
const self=z.object({name:z.string().trim().min(2).max(100).optional(),phone:z.string().trim().max(30).optional(),address:z.string().trim().max(300).optional(),skills:z.array(z.string().trim().min(1).max(80)).max(40).optional(),experience:z.number().int().min(0).max(80).optional(),dailyLimit:z.number().int().min(1).max(100).optional(),status:status.optional(),profileUrl:z.string().url().max(2000).optional().nullable()}).strict();
export class TechnicianController { constructor(private readonly service:TechnicianService){}
 adminList:RequestHandler=async(req,res,next)=>{try{const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);const approval=typeof req.query.approval==='string'?z.enum(['pending','approved','rejected']).parse(req.query.approval):undefined;const st=typeof req.query.status==='string'?status.parse(req.query.status):undefined;res.json({success:true,data:await this.service.listAdmin(date,approval,st)});}catch(e){next(e)}};
 adminGet:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.getAdmin(uuid.parse(req.params.id))});}catch(e){next(e)}};
 adminBookings:RequestHandler=async(req,res,next)=>{try{const limit=z.coerce.number().int().min(1).max(50).default(10).parse(req.query.limit);res.json({success:true,data:await this.service.listAdminBookings(uuid.parse(req.params.id),limit)});}catch(e){next(e)}};
 adminCreate:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await this.service.createByAdmin(req.auth!.userId,input.parse(req.body))});}catch(e){next(e)}};
 adminUpdate:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.updateAdmin(uuid.parse(req.params.id),omitUndefined(update.parse(req.body)))});}catch(e){next(e)}};
 adminReview:RequestHandler=async(req,res,next)=>{try{const b=z.object({decision:z.enum(['approved','rejected'])}).strict().parse(req.body);res.json({success:true,data:await this.service.review(req.auth!.userId,uuid.parse(req.params.id),b.decision)});}catch(e){next(e)}};
 adminDisable:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.disable(req.auth!.userId,uuid.parse(req.params.id))});}catch(e){next(e)}};
 applicationGet:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.getApplication(req.auth!.userId)});}catch(e){next(e)}};
 selfGet:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.getSelf(req.auth!.userId)});}catch(e){next(e)}};
 selfUpdate:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.updateSelf(req.auth!.userId,omitUndefined(self.parse(req.body)))});}catch(e){next(e)}};
 selfDashboard:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await this.service.dashboard(req.auth!.userId)});}catch(e){next(e)}};
 application:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await this.service.submitApplication(req.auth!.userId,application.parse(req.body))});}catch(e){next(e)}};

}
