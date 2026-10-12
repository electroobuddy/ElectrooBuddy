import { Router } from 'express';
import type { AppEnv } from '../config/env.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { PaymentController } from '../controllers/payment.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export function createPaymentRouter(env:AppEnv,c:PaymentController,a:AuthRepository){
  const r=Router(); const auth=authenticate(env,a);
  r.post('/payments/razorpay/verify',auth,requirePermission('checkout:create'),c.verify);
  return r;
}
