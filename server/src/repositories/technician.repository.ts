import type { DatabaseClient, QueryableDatabase } from '../config/database.js';

export interface TechnicianInput {
  name:string; email:string; phone?:string|null|undefined; address?:string|null|undefined; skills:string[]; experience:number;
  dailyLimit:number; priority:number; status:'active'|'busy'|'offline'; profileUrl?:string|null|undefined;
}

export class TechnicianRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listAdmin(date:string, approval?:string|undefined, status?:string) {
    const values:any[]=[date]; let where='1=1';
    if (approval) { values.push(approval); where+=` AND t.approval_status=$${values.length}`; }
    if (status) { values.push(status); where+=` AND t.status=$${values.length}`; }
    const r=await this.db.query(`SELECT t.id,t.user_id,t.name,t.email,t.phone,t.address,t.skills,t.experience,t.daily_limit,t.status,t.approval_status,t.priority,t.profile_url,t.created_at,t.updated_at,t.reviewed_at,
      COALESCE((SELECT count(*)::int FROM bookings b WHERE b.assigned_technician_id=t.id AND b.assignment_date=$1::date AND b.status<>'cancelled' AND b.deleted_at IS NULL),0)::int AS today_count,
      COALESCE((SELECT count(*)::int FROM bookings b WHERE b.assigned_technician_id=t.id AND b.status IN ('assigned','confirmed','in_progress') AND b.deleted_at IS NULL),0)::int AS active_count
      FROM technicians t WHERE ${where} ORDER BY CASE t.approval_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,t.priority DESC,t.created_at DESC,t.id`,values);
    return r.rows;
  }

  async getAdmin(id:string) { const r=await this.db.query(`SELECT t.*,COALESCE((SELECT count(*)::int FROM bookings b WHERE b.assigned_technician_id=t.id AND b.status IN ('assigned','confirmed','in_progress') AND b.deleted_at IS NULL),0)::int AS active_count FROM technicians t WHERE t.id=$1`,[id]); return r.rows[0]??null; }

  async listAdminBookings(id:string,limit:number) { const r=await this.db.query(`SELECT id,user_id,name,email,phone,address,service_type,status,preferred_date,preferred_time,description,exact_location,custom_service_demand,is_switch_working,has_old_fan,is_electricity_supply_on,assigned_technician_id,assigned_at,assignment_date,technician_name,technician_phone,coupon_code,offer_applied,discount_amount,original_amount,final_amount,created_at FROM bookings WHERE assigned_technician_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC,id DESC LIMIT $2`,[id,limit]); return r.rows; }

  async getForUser(userId:string) { const r=await this.db.query(`SELECT id,user_id,name,email,phone,address,skills,experience,daily_limit,status,approval_status,priority,profile_url,created_at,updated_at FROM technicians WHERE user_id=$1 LIMIT 1`,[userId]); return r.rows[0]??null; }

  async dashboard(userId:string) {
    const r=await this.db.query(`SELECT t.id,t.name,t.status,t.approval_status,t.daily_limit,
      count(b.id)::int AS total_count,
      count(b.id) FILTER (WHERE b.status IN ('assigned','confirmed'))::int AS pending_count,
      count(b.id) FILTER (WHERE b.status='completed')::int AS completed_count,
      count(b.id) FILTER (WHERE b.assignment_date=CURRENT_DATE AND b.status<>'cancelled')::int AS today_count
      FROM technicians t LEFT JOIN bookings b ON b.assigned_technician_id=t.id AND b.deleted_at IS NULL
      WHERE t.user_id=$1 GROUP BY t.id`,[userId]); return r.rows[0]??null;
  }

  async createByAdmin(input:TechnicianInput,passwordHash:string,adminUserId:string) { return this.db.withTransaction(async tx=>{
    const u=await tx.query(`INSERT INTO users(email,password_hash,email_verified_at,status,auth_source,updated_at) VALUES(lower($1),$2,now(),'active','native',now()) RETURNING id,email`,[input.email,passwordHash]);
    const user=u.rows[0]; if (!user) throw new Error('Technician user creation returned no row');
    await tx.query(`INSERT INTO user_roles(user_id,role) VALUES($1,'technician') ON CONFLICT DO NOTHING`,[user.id]);
    await tx.query(`INSERT INTO profiles(user_id,email,full_name,phone,address) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,phone=EXCLUDED.phone,address=EXCLUDED.address,updated_at=now()`,[user.id,user.email,input.name,input.phone??null,input.address??null]);
    const t=await tx.query(`INSERT INTO technicians(user_id,name,email,phone,address,skills,experience,daily_limit,status,approval_status,priority,profile_url,reviewed_at,reviewed_by,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10,$11,now(),$12,now()) RETURNING *`,[user.id,input.name,user.email,input.phone??null,input.address??null,input.skills,input.experience,input.dailyLimit,input.status,input.priority,input.profileUrl??null,adminUserId]);
    return t.rows[0];
  }); }

  async updateAdmin(id:string,input:Partial<TechnicianInput>) { const fields:string[]=[]; const values:any[]=[]; const add=(col:string,val:any)=>{values.push(val);fields.push(`${col}=$${values.length}`)};
    if(input.name!==undefined)add('name',input.name); if(input.phone!==undefined)add('phone',input.phone); if(input.address!==undefined)add('address',input.address); if(input.skills!==undefined)add('skills',input.skills); if(input.experience!==undefined)add('experience',input.experience); if(input.dailyLimit!==undefined)add('daily_limit',input.dailyLimit); if(input.priority!==undefined)add('priority',input.priority); if(input.status!==undefined)add('status',input.status); if(input.profileUrl!==undefined)add('profile_url',input.profileUrl); if(!fields.length)return this.getAdmin(id); values.push(id); const r=await this.db.query(`UPDATE technicians SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values); return r.rows[0]??null; }

  async review(id:string,decision:'approved'|'rejected',adminUserId:string) { return this.db.withTransaction(async tx=>{
    const r=await tx.query(`SELECT id,user_id,approval_status FROM technicians WHERE id=$1 FOR UPDATE`,[id]); const t=r.rows[0]; if(!t)return null;
    await tx.query(`UPDATE technicians SET approval_status=$2,status=CASE WHEN $2='approved' THEN 'active' ELSE 'offline' END,reviewed_at=now(),reviewed_by=$3,updated_at=now() WHERE id=$1`,[id,decision,adminUserId]);
    if(t.user_id){ await tx.query(`INSERT INTO user_roles(user_id,role) SELECT $1,'technician' WHERE $2='approved' ON CONFLICT DO NOTHING`,[t.user_id,decision]); if(decision==='rejected')await tx.query(`DELETE FROM user_roles WHERE user_id=$1 AND role='technician'`,[t.user_id]); }
    return this.getAdminTx(id,tx);
  }); }

  async disable(id:string,adminUserId:string) { return this.db.withTransaction(async tx=>{
    const r=await tx.query(`SELECT id,user_id FROM technicians WHERE id=$1 FOR UPDATE`,[id]); const t=r.rows[0]; if(!t)return null;
    const active=await tx.query(`SELECT count(*)::int AS n FROM bookings WHERE assigned_technician_id=$1 AND status IN ('assigned','confirmed','in_progress') AND deleted_at IS NULL`,[id]); if(Number(active.rows[0]?.n??0)>0)return {blocked:true,activeCount:Number(active.rows[0]?.n ?? 0)};
    await tx.query(`UPDATE technicians SET status='offline',approval_status='rejected',disabled_at=now(),reviewed_at=now(),reviewed_by=$2,updated_at=now() WHERE id=$1`,[id,adminUserId]);
    if(t.user_id){await tx.query(`UPDATE users SET status='disabled',updated_at=now() WHERE id=$1`,[t.user_id]);await tx.query(`UPDATE auth_sessions SET revoked_at=COALESCE(revoked_at,now()),revoke_reason=COALESCE(revoke_reason,'technician_disabled') WHERE user_id=$1 AND revoked_at IS NULL`,[t.user_id]);}
    return {blocked:false};
  }); }

  async updateSelf(userId:string,input:{name?:string|undefined;phone?:string|undefined;address?:string|undefined;skills?:string[]|undefined;experience?:number|undefined;dailyLimit?:number|undefined;status?:'active'|'busy'|'offline'|undefined;profileUrl?:string|null|undefined}) { const fields:string[]=[]; const values:any[]=[]; const add=(c:string,v:any)=>{values.push(v);fields.push(`${c}=$${values.length}`)}; if(input.name!==undefined)add('name',input.name);if(input.phone!==undefined)add('phone',input.phone);if(input.address!==undefined)add('address',input.address);if(input.skills!==undefined)add('skills',input.skills);if(input.experience!==undefined)add('experience',input.experience);if(input.dailyLimit!==undefined)add('daily_limit',input.dailyLimit);if(input.status!==undefined)add('status',input.status);if(input.profileUrl!==undefined)add('profile_url',input.profileUrl);if(!fields.length)return this.getForUser(userId);values.push(userId);const r=await this.db.query(`UPDATE technicians SET ${fields.join(',')},updated_at=now() WHERE user_id=$${values.length} AND approval_status='approved' RETURNING *`,values);return r.rows[0]??null; }

  private async getAdminTx(id:string,tx:QueryableDatabase){const r=await tx.query(`SELECT * FROM technicians WHERE id=$1`,[id]);return r.rows[0]??null;}
  async submitApplication(userId:string,input:{name:string;email:string;phone?:string|null|undefined;address?:string|null|undefined;skills:string[];experience:number;profileUrl?:string|null|undefined}) { return this.db.withTransaction(async tx=>{
    const existing=await tx.query(`SELECT id,approval_status FROM technicians WHERE user_id=$1 FOR UPDATE`,[userId]);
    if(existing.rows[0]){const r=await tx.query(`UPDATE technicians SET name=$2,email=lower($3),phone=$4,address=$5,skills=$6,experience=$7,status='offline',approval_status='pending',profile_url=$8,reviewed_at=NULL,reviewed_by=NULL,disabled_at=NULL,updated_at=now() WHERE user_id=$1 RETURNING *`,[userId,input.name,input.email,input.phone??null,input.address??null,input.skills,input.experience,input.profileUrl??null]);return r.rows[0];}
    const r=await tx.query(`INSERT INTO technicians(user_id,name,email,phone,address,skills,experience,daily_limit,status,approval_status,priority,profile_url,updated_at) VALUES($1,$2,lower($3),$4,$5,$6,$7,5,'offline','pending',1,$8,now()) RETURNING *`,[userId,input.name,input.email,input.phone??null,input.address??null,input.skills,input.experience,input.profileUrl??null]);return r.rows[0];
  }); }

}
