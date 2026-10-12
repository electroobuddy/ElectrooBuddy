import type { DatabaseClient, QueryableDatabase } from '../config/database.js';

export interface CreateBookingRow {
  userId:string; requestId:string; serviceId:string|null; name:string; phone:string; email:string; address:string;
  exactLocation:string|null; serviceType:string; customServiceDemand:string|null; preferredDate:string; preferredTime:string;
  description:string|null; isSwitchWorking?:string|null; hasOldFan?:string|null; isElectricitySupplyOn?:string|null; originalAmount:number; finalAmount:number; trackingTokenHash:string;
}
export interface CreateFinancialBookingRow extends CreateBookingRow {couponId:string|null;couponCode:string|null;couponDiscount:number;userSubscriptionId:string|null;subscriptionDiscount:number;benefit:string|null;}


export class BookingRepository {
  constructor(private readonly db:DatabaseClient) {}
  async findIdempotent(userId:string, requestId:string, tx:QueryableDatabase=this.db){
    const r=await tx.query(`SELECT id,service_type,preferred_date,preferred_time,status,original_amount,discount_amount,subscription_discount,final_amount,created_at FROM bookings WHERE user_id=$1 AND booking_request_id=$2 AND deleted_at IS NULL`,[userId,requestId]); return r.rows[0]??null;
  }
  async getService(serviceId:string, tx:QueryableDatabase=this.db){
    const r=await tx.query(`SELECT id,title,service_charge,show_visit_charge,book_now_enabled FROM services WHERE id=$1`,[serviceId]); return r.rows[0]??null;
  }
  async create(row:CreateBookingRow, tx:QueryableDatabase){
    const r=await tx.query(`INSERT INTO bookings(user_id,service_id,booking_request_id,name,phone,email,address,exact_location,service_type,custom_service_demand,preferred_date,preferred_time,description,status,original_amount,final_amount,discount_amount,subscription_discount,offer_applied,tracking_token_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending',$14,$15,0,0,false,$16)
      RETURNING id,user_id,service_id,service_type,preferred_date,preferred_time,status,original_amount,discount_amount,subscription_discount,final_amount,created_at`,
      [row.userId,row.serviceId,row.requestId,row.name,row.phone,row.email,row.address,row.exactLocation,row.serviceType,row.customServiceDemand,row.preferredDate,row.preferredTime,row.description,row.originalAmount,row.finalAmount,row.trackingTokenHash]);
    return r.rows[0];
  }
  async createFinancial(row:CreateFinancialBookingRow, tx:QueryableDatabase){
    const r=await tx.query(`INSERT INTO bookings(user_id,service_id,booking_request_id,name,phone,email,address,exact_location,service_type,custom_service_demand,preferred_date,preferred_time,description,is_switch_working,has_old_fan,is_electricity_supply_on,status,original_amount,final_amount,discount_amount,subscription_discount,offer_applied,tracking_token_hash,booking_coupon_id,coupon_code,coupon_consumed_at,user_subscription_id,subscription_benefit_used,financial_authority_version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending',$17,$18,$19,$20,$21,$22,$23,$24,CASE WHEN $23::uuid IS NULL THEN NULL ELSE now() END,$25,$26,21)
      RETURNING id,user_id,service_id,service_type,preferred_date,preferred_time,status,original_amount,discount_amount,subscription_discount,subscription_benefit_used,coupon_code,final_amount,created_at`,
      [row.userId,row.serviceId,row.requestId,row.name,row.phone,row.email,row.address,row.exactLocation,row.serviceType,row.customServiceDemand,row.preferredDate,row.preferredTime,row.description,row.isSwitchWorking??null,row.hasOldFan??null,row.isElectricitySupplyOn??null,row.originalAmount,row.finalAmount,row.couponDiscount,row.subscriptionDiscount,row.couponDiscount>0,row.trackingTokenHash,row.couponId,row.couponCode,row.userSubscriptionId,row.benefit]);
    return r.rows[0];
  }
  async listOwn(userId:string,status?:string){
    const vals:any[]=[userId]; let where=`b.user_id=$1 AND b.deleted_at IS NULL`; if(status){vals.push(status);where+=` AND b.status=$2`;}
    const r=await this.db.query(`SELECT b.id,b.user_id,b.service_id,b.name,b.service_type,b.status,b.preferred_date,b.preferred_time,b.address,b.phone,b.email,b.description,b.assigned_technician_id,b.technician_name,b.technician_phone,b.original_amount,b.discount_amount,b.subscription_discount,b.subscription_benefit_used,b.offer_applied,b.coupon_code,b.final_amount,b.created_at,b.updated_at FROM bookings b WHERE ${where} ORDER BY b.created_at DESC`,vals); return r.rows;
  }
  async getOwn(userId:string,id:string){ const r=await this.db.query(`SELECT * FROM bookings WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,[id,userId]); return r.rows[0]??null; }
  async cancelOwn(userId:string,id:string){ return this.db.withTransaction(async tx=>{
    const r=await tx.query(`SELECT id,status,user_id,booking_coupon_id,coupon_consumed_at,user_subscription_id,subscription_benefit_used,discount_amount,subscription_discount FROM bookings WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL FOR UPDATE`,[id,userId]); const b=r.rows[0]; if(!b)return {kind:'missing' as const};
    if(!['pending','assigned','confirmed'].includes(b.status))return {kind:'state' as const,status:b.status};
    if(b.booking_coupon_id&&b.coupon_consumed_at){await tx.query(`UPDATE coupons SET used_count=GREATEST(0,used_count-1),updated_at=now() WHERE id=$1`,[b.booking_coupon_id]);await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,coupon_id,amount) VALUES($1,$2,'coupon_reversed',$3,$4)`,[id,b.user_id,b.booking_coupon_id,b.discount_amount??0]);}
    const benefit=await tx.query(`DELETE FROM subscription_benefits_usage WHERE booking_id=$1 RETURNING user_subscription_id,benefit_type`,[id]);if(benefit.rows[0])await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,user_subscription_id,benefit_type,amount) VALUES($1,$2,'subscription_benefit_reversed',$3,$4,$5)`,[id,b.user_id,benefit.rows[0].user_subscription_id,benefit.rows[0].benefit_type,b.subscription_discount??0]);
    await tx.query(`UPDATE bookings SET status='cancelled',coupon_consumed_at=NULL,updated_at=now() WHERE id=$1`,[id]);
    await tx.query(`INSERT INTO booking_notifications(booking_id,old_status,new_status) VALUES($1,$2,'cancelled')`,[id,b.status]); return {kind:'ok' as const};
  });}
  async lookupTracking(hash:string){ const r=await this.db.query(`SELECT service_type,status,preferred_date,preferred_time,CASE WHEN status IN('assigned','confirmed','in_progress') THEN technician_name ELSE NULL END AS technician_name,created_at FROM bookings WHERE tracking_token_hash=$1 AND deleted_at IS NULL LIMIT 1`,[hash]); return r.rows[0]??null; }
  async autoAssign(bookingId:string){ return this.db.withTransaction(async tx=>{
    const br=await tx.query(`SELECT id,status,assigned_technician_id FROM bookings WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[bookingId]); const b=br.rows[0];
    if(!b)return {kind:'missing' as const}; if(b.assigned_technician_id)return {kind:'already' as const,technicianId:b.assigned_technician_id}; if(b.status!=='pending')return {kind:'state' as const};
    const tech=await tx.query(`SELECT t.id,t.name,t.phone,t.email,t.skills,t.daily_limit,t.priority,
      COALESCE((SELECT count(*)::int FROM bookings b2 WHERE b2.assigned_technician_id=t.id AND b2.assignment_date=CURRENT_DATE AND b2.status<>'cancelled'),0)::int AS today_count
      FROM technicians t
      WHERE t.approval_status='approved' AND t.status='active'
        AND COALESCE((SELECT count(*) FROM bookings b3 WHERE b3.assigned_technician_id=t.id AND b3.assignment_date=CURRENT_DATE AND b3.status<>'cancelled'),0)<t.daily_limit
      ORDER BY t.priority DESC, today_count ASC, t.id FOR UPDATE OF t SKIP LOCKED LIMIT 1`);
    const t=tech.rows[0]; if(!t)return {kind:'none' as const};
    await tx.query(`UPDATE bookings SET assigned_technician_id=$2,technician_name=$3,technician_phone=$4,status='assigned',assigned_at=now(),assignment_date=CURRENT_DATE,updated_at=now() WHERE id=$1`,[bookingId,t.id,t.name,t.phone]);
    await tx.query(`INSERT INTO booking_notifications(booking_id,old_status,new_status) VALUES($1,'pending','assigned')`,[bookingId]);
    return {kind:'ok' as const,technician:t};
  });}
  async adminAssign(bookingId:string,technicianId:string){ return this.db.withTransaction(async tx=>{
    const b=await tx.query(`SELECT id,status FROM bookings WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[bookingId]); if(!b.rows[0])return {kind:'missing' as const}; if(!['pending','assigned'].includes(b.rows[0].status))return {kind:'state' as const};
    const t=await tx.query(`SELECT id,name,phone,email,skills,status,approval_status FROM technicians WHERE id=$1 FOR UPDATE`,[technicianId]); const tech=t.rows[0]; if(!tech)return {kind:'tech_missing' as const}; if(tech.approval_status!=='approved'||tech.status==='offline')return {kind:'tech_unavailable' as const};
    await tx.query(`UPDATE bookings SET assigned_technician_id=$2,technician_name=$3,technician_phone=$4,status='assigned',assigned_at=now(),assignment_date=CURRENT_DATE,updated_at=now() WHERE id=$1`,[bookingId,tech.id,tech.name,tech.phone]); await tx.query(`INSERT INTO booking_notifications(booking_id,old_status,new_status) VALUES($1,$2,'assigned')`,[bookingId,b.rows[0].status]); return {kind:'ok' as const,technician:tech};
  });}
  async transition(bookingId:string,target:string,actor:{type:'admin'|'technician';technicianId?:string}){ return this.db.withTransaction(async tx=>{
    const vals:any[]=[bookingId]; let q=`SELECT * FROM bookings WHERE id=$1 AND deleted_at IS NULL`; if(actor.type==='technician'){vals.push(actor.technicianId);q+=` AND assigned_technician_id=$2`;} q+=` FOR UPDATE`;
    const r=await tx.query(q,vals); const b=r.rows[0]; if(!b)return {kind:'missing' as const};
    const allowed:Record<string,string[]>={pending:['assigned','confirmed','cancelled'],assigned:['confirmed','in_progress','cancelled','pending'],confirmed:['in_progress','cancelled'],in_progress:['completed'],completed:[],cancelled:[]};
    if(!(allowed[b.status]??[]).includes(target))return {kind:'state' as const,from:b.status,to:target};
    if(actor.type==='technician' && !['in_progress','completed'].includes(target))return {kind:'forbidden' as const};
    const u=await tx.query(`UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1 RETURNING *`,[bookingId,target]);
    await tx.query(`INSERT INTO booking_notifications(booking_id,old_status,new_status) VALUES($1,$2,$3)`,[bookingId,b.status,target]);
    if(target==='cancelled'){if(b.booking_coupon_id&&b.coupon_consumed_at){await tx.query(`UPDATE coupons SET used_count=GREATEST(0,used_count-1),updated_at=now() WHERE id=$1`,[b.booking_coupon_id]);await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,coupon_id,amount) VALUES($1,$2,'coupon_reversed',$3,$4)`,[bookingId,b.user_id,b.booking_coupon_id,b.discount_amount??0]);}const benefit=await tx.query(`DELETE FROM subscription_benefits_usage WHERE booking_id=$1 RETURNING user_subscription_id,benefit_type`,[bookingId]);if(benefit.rows[0])await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,user_subscription_id,benefit_type,amount) VALUES($1,$2,'subscription_benefit_reversed',$3,$4,$5)`,[bookingId,b.user_id,benefit.rows[0].user_subscription_id,benefit.rows[0].benefit_type,b.subscription_discount??0]);await tx.query(`UPDATE bookings SET coupon_consumed_at=NULL WHERE id=$1`,[bookingId]);} return {kind:'ok' as const,booking:u.rows[0]};
  });}
  async listAvailableTechnicians(date:string){ const r=await this.db.query(`SELECT t.id,t.name,t.email,t.phone,t.skills,t.daily_limit,t.priority,COALESCE((SELECT count(*)::int FROM bookings b WHERE b.assigned_technician_id=t.id AND b.assignment_date=$1::date AND b.status<>'cancelled'),0)::int AS today_count FROM technicians t WHERE t.approval_status='approved' AND t.status='active' AND COALESCE((SELECT count(*) FROM bookings b2 WHERE b2.assigned_technician_id=t.id AND b2.assignment_date=$1::date AND b2.status<>'cancelled'),0)<t.daily_limit ORDER BY t.priority DESC,today_count ASC,t.id`,[date]); return r.rows; }
  async adminUnassign(bookingId:string){ return this.db.withTransaction(async tx=>{ const r=await tx.query(`SELECT id,status,assigned_technician_id FROM bookings WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[bookingId]); const b=r.rows[0]; if(!b)return {kind:'missing' as const}; if(!b.assigned_technician_id)return {kind:'ok' as const}; if(!['assigned','pending'].includes(b.status))return {kind:'state' as const}; await tx.query(`UPDATE bookings SET assigned_technician_id=NULL,technician_name=NULL,technician_phone=NULL,assigned_at=NULL,assignment_date=NULL,status='pending',updated_at=now() WHERE id=$1`,[bookingId]); await tx.query(`INSERT INTO booking_notifications(booking_id,old_status,new_status) VALUES($1,$2,'pending')`,[bookingId,b.status]); return {kind:'ok' as const}; }); }
  async listAdmin(status?:string){ const vals:any[]=[]; let where=`b.deleted_at IS NULL`; if(status){vals.push(status);where+=` AND b.status=$1`;} const r=await this.db.query(`SELECT b.* FROM bookings b WHERE ${where} ORDER BY b.created_at DESC`,vals); return r.rows; }
  async getAdmin(id:string){ const r=await this.db.query(`SELECT * FROM bookings WHERE id=$1 AND deleted_at IS NULL`,[id]); return r.rows[0]??null; }
  async listTechnician(userId:string){ const r=await this.db.query(`SELECT b.* FROM bookings b JOIN technicians t ON t.id=b.assigned_technician_id WHERE t.user_id=$1 AND b.deleted_at IS NULL ORDER BY b.created_at DESC`,[userId]); return r.rows; }
  async technicianIdForUser(userId:string){ const r=await this.db.query(`SELECT id FROM technicians WHERE user_id=$1 AND approval_status='approved' LIMIT 1`,[userId]); return r.rows[0]?.id??null; }
  async adminUpdateOperational(bookingId:string,input:{name?:string;phone?:string;email?:string;address?:string;preferredDate?:string;preferredTime?:string;description?:string|null;exactLocation?:string|null;customServiceDemand?:string|null;isSwitchWorking?:string|null;hasOldFan?:string|null;isElectricitySupplyOn?:string|null}) {
    const fields:string[]=[]; const values:any[]=[]; const add=(c:string,v:any)=>{values.push(v);fields.push(`${c}=$${values.length}`)};
    if(input.name!==undefined)add('name',input.name);if(input.phone!==undefined)add('phone',input.phone);if(input.email!==undefined)add('email',input.email);if(input.address!==undefined)add('address',input.address);if(input.preferredDate!==undefined)add('preferred_date',input.preferredDate);if(input.preferredTime!==undefined)add('preferred_time',input.preferredTime);if(input.description!==undefined)add('description',input.description);if(input.exactLocation!==undefined)add('exact_location',input.exactLocation);if(input.customServiceDemand!==undefined)add('custom_service_demand',input.customServiceDemand);if(input.isSwitchWorking!==undefined)add('is_switch_working',input.isSwitchWorking);if(input.hasOldFan!==undefined)add('has_old_fan',input.hasOldFan);if(input.isElectricitySupplyOn!==undefined)add('is_electricity_supply_on',input.isElectricitySupplyOn);
    if(!fields.length)return this.getAdmin(bookingId); values.push(bookingId); const r=await this.db.query(`UPDATE bookings SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} AND deleted_at IS NULL RETURNING *`,values); return r.rows[0]??null;
  }
  async adminArchive(bookingId:string){return this.db.withTransaction(async tx=>{const r=await tx.query(`SELECT id,status FROM bookings WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[bookingId]);const b=r.rows[0];if(!b)return {kind:'missing' as const};if(!['completed','cancelled'].includes(b.status))return {kind:'state' as const,status:b.status};await tx.query(`UPDATE bookings SET deleted_at=now(),updated_at=now() WHERE id=$1`,[bookingId]);return {kind:'ok' as const};});}

}
