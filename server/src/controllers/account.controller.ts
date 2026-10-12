import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AccountService } from '../services/account.service.js';

const nullableTrimmed = (max: number) => z.string().trim().max(max).transform(v => v || null).nullable().optional();
const profileSchema = z.object({ fullName: nullableTrimmed(120), phone: nullableTrimmed(30), address: nullableTrimmed(1000) }).strict();
const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), phone: z.string().trim().min(6).max(30),
  email: z.string().email().max(254), addressLine1: z.string().trim().min(3).max(250), addressLine2: nullableTrimmed(250), city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100), postalCode: z.string().trim().min(3).max(20), country: z.string().trim().min(2).max(80).default('India'),
  landmark: nullableTrimmed(180), addressType: z.enum(['home','work','other']).default('home'), isDefault: z.boolean().default(false)
}).strict();
const addressPatchSchema = addressSchema.partial().strict();
const idSchema = z.string().uuid();

export class AccountController {
  constructor(private readonly service: AccountService) {}
  getProfile: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.getProfile(req.auth!.userId)}); } catch(e){next(e);} };
  updateProfile: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.updateProfile(req.auth!.userId,profileSchema.parse(req.body))}); } catch(e){next(e);} };
  listAddresses: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.listAddresses(req.auth!.userId)}); } catch(e){next(e);} };
  createAddress: RequestHandler = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.service.createAddress(req.auth!.userId,addressSchema.parse(req.body))}); } catch(e){next(e);} };
  updateAddress: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.updateAddress(req.auth!.userId,idSchema.parse(req.params.id),addressPatchSchema.parse(req.body))}); } catch(e){next(e);} };
  deleteAddress: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.deleteAddress(req.auth!.userId,idSchema.parse(req.params.id))}); } catch(e){next(e);} };
  setDefaultAddress: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.service.setDefaultAddress(req.auth!.userId,idSchema.parse(req.params.id))}); } catch(e){next(e);} };
}
