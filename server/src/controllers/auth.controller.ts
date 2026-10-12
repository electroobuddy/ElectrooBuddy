import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import type { AuthService } from '../services/auth.service.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../auth/refresh-cookie.js';
import { AppError } from '../errors/app-error.js';

const email = z.string().email().max(254);
const password = z.string().min(12).max(128).regex(/[A-Z]/, 'Must include an uppercase letter').regex(/[a-z]/, 'Must include a lowercase letter').regex(/[0-9]/, 'Must include a number');
const registerSchema = z.object({ email, password });
const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const refreshSchema = z.object({ refreshToken: z.string().min(40).max(200).optional() }).default({});
const resetRequestSchema = z.object({ email });
const resetSchema = z.object({ token: z.string().min(40).max(200), newPassword: password });
const verifySchema = z.object({ token: z.string().min(40).max(200) });
const resendSchema = z.object({ email });

function context(req: Parameters<RequestHandler>[0]) {
  return { requestId: req.requestId, ipAddress: req.ip, userAgent: req.get('user-agent') ?? undefined };
}
function withoutRefresh<T extends { refreshToken: string }>(value: T) {
  const { refreshToken: _hidden, ...rest } = value;
  return rest;
}

export class AuthController {
  constructor(private readonly env: AppEnv, private readonly auth: AuthService) {}
  register: RequestHandler = async (req,res,next) => { try { res.status(201).json({success:true,data:await this.auth.register(registerSchema.parse(req.body),context(req))}); } catch(e){next(e);} };
  login: RequestHandler = async (req,res,next) => { try { const result=await this.auth.login(loginSchema.parse(req.body),context(req)); setRefreshCookie(res,this.env,result.refreshToken); res.json({success:true,data:withoutRefresh(result)}); } catch(e){next(e);} };
  refresh: RequestHandler = async (req,res,next) => { try { const body=refreshSchema.parse(req.body ?? {}); const token=readRefreshCookie(req,this.env) ?? body.refreshToken; if(!token) throw new AppError(401,'INVALID_REFRESH_TOKEN','Session is no longer valid'); const result=await this.auth.refresh(token,context(req)); setRefreshCookie(res,this.env,result.refreshToken); res.json({success:true,data:withoutRefresh(result)}); } catch(e){ clearRefreshCookie(res,this.env); next(e);} };
  logout: RequestHandler = async (req,res,next) => { try { await this.auth.logout(req.auth!.userId,req.auth!.sessionId,context(req)); clearRefreshCookie(res,this.env); res.json({success:true,data:{loggedOut:true}}); } catch(e){next(e);} };
  logoutAll: RequestHandler = async (req,res,next) => { try { await this.auth.logoutAll(req.auth!.userId,context(req)); clearRefreshCookie(res,this.env); res.json({success:true,data:{loggedOutAll:true}}); } catch(e){next(e);} };
  me: RequestHandler = async (req,res,next) => { try { res.json({success:true,data:await this.auth.me(req.auth!.userId)}); } catch(e){next(e);} };
  requestPasswordReset: RequestHandler = async (req,res,next) => { try { const body=resetRequestSchema.parse(req.body); res.json({success:true,data:await this.auth.requestPasswordReset(body.email,context(req))}); } catch(e){next(e);} };
  resetPassword: RequestHandler = async (req,res,next) => { try { const body=resetSchema.parse(req.body); clearRefreshCookie(res,this.env); res.json({success:true,data:await this.auth.resetPassword(body.token,body.newPassword,context(req))}); } catch(e){next(e);} };
  resendVerification: RequestHandler = async (req,res,next) => { try { const body=resendSchema.parse(req.body); res.json({success:true,data:await this.auth.resendVerification(body.email,context(req))}); } catch(e){next(e);} };
  verifyEmail: RequestHandler = async (req,res,next) => { try { const body=verifySchema.parse(req.body); res.json({success:true,data:await this.auth.verifyEmail(body.token,context(req))}); } catch(e){next(e);} };
}
