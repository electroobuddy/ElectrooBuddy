import { createHash, randomBytes } from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import type { DatabaseClient, QueryableDatabase } from '../config/database.js';
import type { BookingRepository } from '../repositories/booking.repository.js';
const money=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export interface BookingCreateInput {requestId:string;serviceId?:string|null|undefined;isCustomService?:boolean|undefined;name:string;phone:string;email:string;address:string;exactLocation?:string|null|undefined;preferredDate:string;preferredTime:string;description?:string|null|undefined;customServiceDemand?:string|null|undefined;isSwitchWorking?:string|null|undefined;hasOldFan?:string|null|undefined;isElectricitySupplyOn?:string|null|undefined;couponCode?:string|null|undefined;useSubscription?:boolean|undefined;useFreeServiceCall?:boolean|undefined}
export interface BookingQuoteInput {serviceId?:string|null|undefined;isCustomService?:boolean|undefined;customServiceDemand?:string|null|undefined;couponCode?:string|null|undefined;useSubscription?:boolean|undefined;useFreeServiceCall?:boolean|undefined}
export interface GuestBookingCreateInput {requestId:string;serviceId?:string|null|undefined;isCustomService?:boolean|undefined;name:string;phone:string;email?:string|null|undefined;address:string;exactLocation?:string|null|undefined;preferredDate:string;preferredTime:string;description?:string|null|undefined;customServiceDemand?:string|null|undefined;isSwitchWorking?:string|null|undefined;hasOldFan?:string|null|undefined;isElectricitySupplyOn?:string|null|undefined}

type FinancialQuote={service:any;base:number;coupon:any|null;couponDiscount:number;subscription:any|null;subscriptionDiscount:number;benefit:string|null;final:number;selected:'coupon'|'subscription'|'none'};

export class BookingService {
 constructor(private readonly db:DatabaseClient,private readonly repo:BookingRepository){}
 private async serviceFor(input:{serviceId?:string|null|undefined;isCustomService?:boolean|undefined;customServiceDemand?:string|null|undefined},tx:QueryableDatabase=this.db){
  let service:any=null;if(input.serviceId)service=await this.repo.getService(input.serviceId,tx);
  const demand=(input.customServiceDemand??'').trim();
  if(!service&&input.isCustomService&&demand.length>=20)service={id:null,title:`Custom: ${demand.slice(0,120)}`,service_charge:0,show_visit_charge:false,book_now_enabled:true};
  if(!service||service.book_now_enabled===false)throw new AppError(409,'SERVICE_UNAVAILABLE','Service is unavailable');return service;
 }
 private async financialQuote(userId:string,input:BookingQuoteInput,tx:QueryableDatabase=this.db,lock=false):Promise<FinancialQuote>{
  const service=await this.serviceFor(input,tx);const base=service.show_visit_charge?money(Number(service.service_charge??0)):0;
  let coupon:any=null,couponDiscount=0;const code=(input.couponCode??'').trim().toUpperCase();
  if(code){
   const cr=await tx.query(`SELECT id,code,discount_type,discount_value,min_order_value,max_discount_amount,valid_from,valid_until,is_active,usage_limit,used_count,usage_limit_per_user,applicable_to_new_users_only FROM coupons WHERE upper(code)=upper($1) ${lock?'FOR UPDATE':''}`,[code]);coupon=cr.rows[0]??null;const now=Date.now();
   if(!coupon||!coupon.is_active||new Date(coupon.valid_from).getTime()>now||(coupon.valid_until&&new Date(coupon.valid_until).getTime()<now))throw new AppError(400,'COUPON_INVALID','Coupon is invalid or expired');
   if(base<Number(coupon.min_order_value??0))throw new AppError(400,'COUPON_MINIMUM_NOT_MET','Coupon minimum value not met');
   if(coupon.usage_limit!=null&&Number(coupon.used_count??0)>=Number(coupon.usage_limit))throw new AppError(409,'COUPON_LIMIT_REACHED','Coupon usage limit reached');
   const ur=await tx.query(`SELECT count(*)::int AS n FROM bookings WHERE user_id=$1 AND upper(coupon_code)=upper($2) AND status<>'cancelled'`,[userId,code]);
   if(coupon.usage_limit_per_user!=null&&Number(ur.rows[0]?.n??0)>=Number(coupon.usage_limit_per_user))throw new AppError(409,'COUPON_USER_LIMIT_REACHED','Coupon usage limit reached');
   if(coupon.applicable_to_new_users_only){const nr=await tx.query(`SELECT count(*)::int AS n FROM bookings WHERE user_id=$1 AND status<>'cancelled'`,[userId]);if(Number(nr.rows[0]?.n??0)>0)throw new AppError(409,'COUPON_NEW_USERS_ONLY','Coupon is for new users only');}
   if(coupon.discount_type==='percentage')couponDiscount=base*Number(coupon.discount_value??0)/100;else if(coupon.discount_type==='fixed')couponDiscount=Number(coupon.discount_value??0);else throw new AppError(400,'COUPON_NOT_APPLICABLE','This coupon is not applicable to service bookings');
   if(coupon.max_discount_amount!=null)couponDiscount=Math.min(couponDiscount,Number(coupon.max_discount_amount));couponDiscount=money(Math.min(base,Math.max(0,couponDiscount)));
  }
  let subscription:any=null,subscriptionDiscount=0,benefit:string|null=null;
  if(input.useSubscription){
   const sr=await tx.query(`SELECT us.id,us.end_date,us.status,sp.max_service_calls,sp.parts_discount_percent FROM user_subscriptions us JOIN subscription_plans sp ON sp.id=us.plan_id WHERE us.user_id=$1 AND us.status='active' AND us.end_date>now() ORDER BY us.created_at DESC LIMIT 1 ${lock?'FOR UPDATE OF us':''}`,[userId]);subscription=sr.rows[0]??null;
   if(subscription){
    if(input.useFreeServiceCall&&Number(subscription.max_service_calls??0)>0){const br=await tx.query(`SELECT count(*)::int AS n FROM subscription_benefits_usage WHERE user_subscription_id=$1 AND benefit_type='service_call'`,[subscription.id]);if(Number(br.rows[0]?.n??0)<Number(subscription.max_service_calls)){subscriptionDiscount=base;benefit='service_call';}}
    else if(Number(subscription.parts_discount_percent??0)>0){subscriptionDiscount=money(base*Number(subscription.parts_discount_percent)/100);benefit='parts_discount';}
   }
  }
  let selected:'coupon'|'subscription'|'none'='none';
  if(subscriptionDiscount>=couponDiscount&&subscriptionDiscount>0){coupon=null;couponDiscount=0;selected='subscription';}
  else if(couponDiscount>0){subscription=null;subscriptionDiscount=0;benefit=null;selected='coupon';}
  else {coupon=null;subscription=null;benefit=null;couponDiscount=0;subscriptionDiscount=0;}
  const final=money(Math.max(0,base-couponDiscount-subscriptionDiscount));return {service,base,coupon,couponDiscount,subscription,subscriptionDiscount,benefit,final,selected};
 }
 async quote(userId:string,input:BookingQuoteInput){const q=await this.financialQuote(userId,input);return {success:true,service_id:q.service.id,service_type:q.service.title,original_amount:q.base,discount_amount:q.couponDiscount,subscription_discount:q.subscriptionDiscount,final_amount:q.final,selected_benefit:q.selected,coupon_code:q.coupon?.code??null,subscription_benefit_used:q.benefit};}
 async create(userId:string,input:BookingCreateInput){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(input.preferredDate<today)throw new AppError(400,'BOOKING_DATE_PAST','Preferred date cannot be in the past');
  const old=await this.repo.findIdempotent(userId,input.requestId);if(old)return {...this.map(old),idempotent:true};
  const token=randomBytes(32).toString('hex');const hash=createHash('sha256').update(token).digest('hex');
  const created=await this.db.withTransaction(async tx=>{
   await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`booking:${userId}:${input.requestId}`]);const again=await this.repo.findIdempotent(userId,input.requestId,tx);if(again)return {booking:again,idempotent:true};
   const q=await this.financialQuote(userId,{serviceId:input.serviceId??null,isCustomService:input.isCustomService??false,customServiceDemand:input.customServiceDemand??input.description??null,couponCode:input.couponCode??null,useSubscription:input.useSubscription??false,useFreeServiceCall:input.useFreeServiceCall??false},tx,true);
   const demand=(input.customServiceDemand??input.description??'').trim();
   const b=await this.repo.createFinancial({userId,requestId:input.requestId,serviceId:q.service.id,name:input.name,phone:input.phone,email:input.email,address:input.address,exactLocation:input.exactLocation??null,serviceType:q.service.title,customServiceDemand:q.service.id?null:demand,preferredDate:input.preferredDate,preferredTime:input.preferredTime,description:input.description??null,isSwitchWorking:input.isSwitchWorking??null,hasOldFan:input.hasOldFan??null,isElectricitySupplyOn:input.isElectricitySupplyOn??null,originalAmount:q.base,finalAmount:q.final,trackingTokenHash:hash,couponId:q.coupon?.id??null,couponCode:q.coupon?.code??null,couponDiscount:q.couponDiscount,userSubscriptionId:q.subscription?.id??null,subscriptionDiscount:q.subscriptionDiscount,benefit:q.benefit},tx);
   if (!b) throw new Error('Booking creation returned no row');
   if(q.coupon){await tx.query(`UPDATE coupons SET used_count=used_count+1,updated_at=now() WHERE id=$1`,[q.coupon.id]);await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,coupon_id,amount) VALUES($1,$2,'coupon_consumed',$3,$4)`,[b.id,userId,q.coupon.id,q.couponDiscount]);}
   if(q.subscription&&q.benefit){await tx.query(`INSERT INTO subscription_benefits_usage(user_subscription_id,user_id,benefit_type,booking_id,description) VALUES($1,$2,$3,$4,$5)`,[q.subscription.id,userId,q.benefit,b.id,q.benefit==='service_call'?'Free service call used':'Subscription service discount used']);await tx.query(`INSERT INTO booking_financial_events(booking_id,user_id,event_type,user_subscription_id,benefit_type,amount) VALUES($1,$2,'subscription_benefit_consumed',$3,$4,$5)`,[b.id,userId,q.subscription.id,q.benefit,q.subscriptionDiscount]);}
   return {booking:b,idempotent:false};
  },{isolationLevel:'READ COMMITTED'});
  if (!created.booking) throw new Error('Booking transaction returned no row'); if(created.idempotent)return {...this.map(created.booking),idempotent:true};const assignment=await this.repo.autoAssign(created.booking.id).catch(()=>({kind:'none'} as any));return {...this.map(created.booking),tracking_token:token,idempotent:false,technician:assignment.kind==='ok'?assignment.technician:null};
 }
 async list(userId:string,status?:string){return (await this.repo.listOwn(userId,status)).map(x=>this.map(x));}
 async createGuest(input:GuestBookingCreateInput){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(input.preferredDate<today)throw new AppError(400,'BOOKING_DATE_PAST','Preferred date cannot be in the past');
  const phone=input.phone.trim();
  const created=await this.db.withTransaction(async tx=>{
   await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`guest-booking:${phone}`]);
   const old=await this.repo.findGuestIdempotent(phone,input.requestId,tx);if(old)return {booking:old,idempotent:true,token:null as string|null};
   const service=await this.serviceFor({serviceId:input.serviceId??null,isCustomService:input.isCustomService??false,customServiceDemand:input.customServiceDemand??input.description??null},tx);
   const demand=(input.customServiceDemand??input.description??'').trim();
   if(await this.repo.findActiveGuestDuplicate(phone,service.title,input.preferredDate,tx))throw new AppError(409,'BOOKING_DUPLICATE','A booking for this service and date already exists for this phone number');
   if(await this.repo.countActiveGuestBookings(phone,tx)>=3)throw new AppError(409,'GUEST_BOOKING_LIMIT','Too many active bookings for this phone number. Please call us directly.');
   const token=randomBytes(32).toString('hex');const hash=createHash('sha256').update(token).digest('hex');
   const base=service.show_visit_charge?money(Number(service.service_charge??0)):0;
   const b=await this.repo.createFinancial({userId:null,requestId:input.requestId,serviceId:service.id??null,name:input.name,phone,email:input.email??null,address:input.address,exactLocation:input.exactLocation??null,serviceType:service.title,customServiceDemand:service.id?null:demand,preferredDate:input.preferredDate,preferredTime:input.preferredTime,description:input.description??null,isSwitchWorking:input.isSwitchWorking??null,hasOldFan:input.hasOldFan??null,isElectricitySupplyOn:input.isElectricitySupplyOn??null,originalAmount:base,finalAmount:base,trackingTokenHash:hash,couponId:null,couponCode:null,couponDiscount:0,userSubscriptionId:null,subscriptionDiscount:0,benefit:null},tx);
   if (!b) throw new Error('Guest booking creation returned no row');
   return {booking:b,idempotent:false,token};
  },{isolationLevel:'READ COMMITTED'});
  if (!created.booking) throw new Error('Guest booking transaction returned no row');
  if(created.idempotent)return {...this.map(created.booking),idempotent:true};
  const assignment=await this.repo.autoAssign(created.booking.id).catch(()=>({kind:'none'} as any));
  return {...this.map(created.booking),tracking_token:created.token,idempotent:false,technician:assignment.kind==='ok'?assignment.technician:null};
 }
 async get(userId:string,id:string){const b=await this.repo.getOwn(userId,id);if(!b)throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');return this.map(b);}
 async cancel(userId:string,id:string){const r=await this.repo.cancelOwn(userId,id);if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='state')throw new AppError(409,'BOOKING_CANNOT_CANCEL','Booking can no longer be cancelled online');return {cancelled:true};}
 async track(token:string){const hash=createHash('sha256').update(token).digest('hex');const b=await this.repo.lookupTracking(hash);return b?this.map(b):null;}
 async autoAssign(id:string){const r=await this.repo.autoAssign(id);if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='state')throw new AppError(409,'BOOKING_ASSIGNMENT_STATE','Booking is not assignable');return r;}
 async adminAssign(id:string,technicianId:string){const r=await this.repo.adminAssign(id,technicianId);if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='tech_missing')throw new AppError(404,'TECHNICIAN_NOT_FOUND','Technician not found');if(r.kind==='tech_unavailable')throw new AppError(409,'TECHNICIAN_UNAVAILABLE','Technician is unavailable');if(r.kind==='state')throw new AppError(409,'BOOKING_ASSIGNMENT_STATE','Booking is not assignable');return r;}
 async adminTransition(id:string,target:string){const r=await this.repo.transition(id,target,{type:'admin'});return this.guardTransition(r);}
 async availableTechnicians(date:string){return this.repo.listAvailableTechnicians(date);}
 async adminUnassign(id:string){const r=await this.repo.adminUnassign(id);if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='state')throw new AppError(409,'BOOKING_UNASSIGN_STATE','Booking cannot be unassigned in its current state');return {unassigned:true};}
 async adminList(status?:string){return (await this.repo.listAdmin(status)).map(x=>this.map(x));}
 async adminGet(id:string){const b=await this.repo.getAdmin(id);if(!b)throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');return this.map(b);}
 async technicianList(userId:string){return (await this.repo.listTechnician(userId)).map(x=>this.map(x));}
 async technicianTransition(userId:string,id:string,target:string){const technicianId=await this.repo.technicianIdForUser(userId);if(!technicianId)throw new AppError(403,'TECHNICIAN_NOT_APPROVED','Approved technician profile required');const r=await this.repo.transition(id,target,{type:'technician',technicianId});return this.guardTransition(r);}
 private guardTransition(r:any){if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='state')throw new AppError(409,'INVALID_BOOKING_TRANSITION',`Invalid booking transition ${r.from??''} -> ${r.to??''}`);if(r.kind==='forbidden')throw new AppError(403,'BOOKING_TRANSITION_FORBIDDEN','Technician cannot perform this transition');return this.map(r.booking);}
 private map(b:any){return {...b,original_amount:b.original_amount==null?null:Number(b.original_amount),discount_amount:b.discount_amount==null?0:Number(b.discount_amount),subscription_discount:b.subscription_discount==null?0:Number(b.subscription_discount),final_amount:b.final_amount==null?null:Number(b.final_amount)};}
 async adminUpdateOperational(id:string,input:any){const b=await this.repo.adminUpdateOperational(id,input);if(!b)throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');return this.map(b);}
 async adminArchive(id:string){const r=await this.repo.adminArchive(id);if(r.kind==='missing')throw new AppError(404,'BOOKING_NOT_FOUND','Booking not found');if(r.kind==='state')throw new AppError(409,'BOOKING_ARCHIVE_STATE','Only completed or cancelled bookings can be archived');return {archived:true};}
}
