import { createHash, createHmac } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import type { DatabaseClient } from '../config/database.js';
import { AppError } from '../errors/app-error.js';

const payload = z.object({
  requestId: z.string().uuid(),
  serviceId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().max(254),
  address: z.string().trim().min(10).max(300),
  exactLocation: z.string().trim().max(300).nullish(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
  description: z.string().trim().max(1000).nullish(),
  // Honeypot populated by automated submissions, hidden from legitimate customers.
  companyWebsite: z.string().max(0).optional(),
}).strict();

export function createGuestBookingRouter(env: AppEnv, db: DatabaseClient) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  router.post('/guest/bookings', limiter, async (req, res, next) => {
    try {
      const input = payload.parse(req.body);
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      const requestedDay = new Date(`${input.preferredDate}T00:00:00Z`);
      if (Number.isNaN(requestedDay.getTime()) || requestedDay.toISOString().slice(0, 10) !== input.preferredDate || input.preferredDate < today) {
        throw new AppError(400, 'BOOKING_DATE_INVALID', 'Preferred date must be a valid future date');
      }

      // A stable, unguessable token permits a safe retry without persisting raw tokens.
      // Rotate JWT_ACCESS_SECRET only with a planned tracking-token migration.
      const token = createHmac('sha256', env.JWT_ACCESS_SECRET)
        .update(`guest-booking:v1:${input.phone}:${input.requestId}`)
        .digest('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const result = await db.withTransaction(async tx => {
        await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`guest:${input.phone}:${input.requestId}`]);
        const existing = await tx.query('SELECT id,status FROM bookings WHERE user_id IS NULL AND phone=$1 AND booking_request_id=$2 AND deleted_at IS NULL', [input.phone, input.requestId]);
        if (existing.rows[0]) return { id: existing.rows[0].id as string, status: existing.rows[0].status as string, idempotent: true };

        const serviceRows = await tx.query('SELECT id,title,service_charge,show_visit_charge,book_now_enabled FROM services WHERE id=$1', [input.serviceId]);
        const service = serviceRows.rows[0];
        if (!service || service.book_now_enabled !== true) throw new AppError(409, 'SERVICE_UNAVAILABLE', 'Service is unavailable');
        const total = service.show_visit_charge ? Number(service.service_charge ?? 0) : 0;
        if (!Number.isFinite(total) || total < 0) throw new AppError(409, 'SERVICE_PRICE_INVALID', 'Service pricing is unavailable');

        const created = await tx.query(`INSERT INTO bookings
          (user_id,service_id,booking_request_id,name,phone,email,address,exact_location,service_type,
           preferred_date,preferred_time,description,status,original_amount,final_amount,
           discount_amount,subscription_discount,offer_applied,tracking_token_hash)
          VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$12,0,0,false,$13)
          RETURNING id,status`, [input.serviceId,input.requestId,input.name,input.phone,input.email,input.address,
          input.exactLocation ?? null,service.title,input.preferredDate,input.preferredTime,input.description ?? null,
          total.toFixed(2),tokenHash]);
        const createdBooking = created.rows[0]; if (!createdBooking) throw new Error('Guest booking insert returned no row'); return { id: createdBooking.id as string, status: createdBooking.status as string, idempotent: false };
      });

      // Never cache sensitive booking or tracking-token responses.
      res.setHeader('Cache-Control', 'no-store');
      res.status(result.idempotent ? 200 : 201).json({ success: true, data: {
        id: result.id, status: result.status, idempotent: result.idempotent, tracking_token: token,
      }});
    } catch (error) { next(error); }
  });
  return router;
}
