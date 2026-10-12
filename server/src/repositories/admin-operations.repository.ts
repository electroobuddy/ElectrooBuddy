import type { DatabaseClient, QueryableDatabase } from '../config/database.js';

export class AdminOperationsRepository {
  constructor(private readonly db: DatabaseClient) {}

  async submitContact(input:{requestKey:string;name:string;phone:string;email:string;service?:string|null;message:string}) {
    const r=await this.db.query(`INSERT INTO contact_messages(request_key,name,phone,email,service,message)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT (request_key) WHERE request_key IS NOT NULL DO UPDATE SET request_key=EXCLUDED.request_key
      RETURNING id,created_at`,[input.requestKey,input.name,input.phone,input.email,input.service??null,input.message]);
    return r.rows[0];
  }
  async submitTestimonial(input:{name:string;service?:string|null;rating:number;text:string}) {
    const r=await this.db.query(`INSERT INTO testimonials(name,service,rating,text) VALUES($1,$2,$3,$4) RETURNING id,name,service,rating,text,created_at`,[input.name,input.service??null,input.rating,input.text]);
    return r.rows[0];
  }
  async listSiteSettings(){return (await this.db.query(`SELECT id,key,value,updated_at FROM site_settings ORDER BY key ASC`)).rows;}
  async saveSiteSettings(settings:Record<string,string>){
    return this.db.withTransaction(async tx=>{
      for(const [key,value] of Object.entries(settings)) await tx.query(`INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[key,value]);
      return (await tx.query(`SELECT id,key,value,updated_at FROM site_settings ORDER BY key ASC`)).rows;
    });
  }
  async subscribe(email:string){
    const inserted=await this.db.query(`INSERT INTO newsletter_subscribers(email) VALUES($1) ON CONFLICT(email) DO NOTHING RETURNING id,email,created_at`,[email]);
    if(inserted.rows[0]) return {...inserted.rows[0],alreadySubscribed:false};
    const existing=await this.db.query(`SELECT id,email,created_at FROM newsletter_subscribers WHERE email=$1 LIMIT 1`,[email]);
    return {...existing.rows[0],alreadySubscribed:true};
  }
  async listMessages(){return (await this.db.query(`SELECT id,name,email,phone,service,message,read,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 1000`)).rows;}
  async markMessageRead(id:string){return (await this.db.query(`UPDATE contact_messages SET read=true WHERE id=$1 RETURNING id,read`,[id])).rows[0]??null;}
  async listSubscribers(){return (await this.db.query(`SELECT id,email,created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 5000`)).rows;}
  async deleteSubscriber(id:string){return (await this.db.query(`DELETE FROM newsletter_subscribers WHERE id=$1 RETURNING id`,[id])).rows[0]??null;}
  async listUsers(){
    return (await this.db.query(`SELECT u.id AS user_id,COALESCE(p.full_name,'') AS full_name,COALESCE(p.phone,'') AS phone,
      COALESCE(p.address,'') AS address,u.email,u.status,u.auth_source,u.created_at,u.last_login_at,
      COALESCE((SELECT ur.role FROM user_roles ur WHERE ur.user_id=u.id ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'technician' THEN 2 ELSE 3 END LIMIT 1),'user') AS role,
      COALESCE((SELECT b.name FROM bookings b WHERE b.user_id=u.id ORDER BY b.created_at DESC LIMIT 1),'') AS booking_name
      FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.created_at DESC LIMIT 5000`)).rows;
  }
  async userBookings(userId:string){return (await this.db.query(`SELECT id,created_at,service_type AS service,status,phone,address,preferred_date,preferred_time FROM bookings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500`,[userId])).rows;}
  async publicStats(){const r=await this.db.query(`SELECT (SELECT count(*)::int FROM bookings) clients,(SELECT count(*)::int FROM bookings WHERE status='completed') projects`);return r.rows[0];}
  async dashboardCounts(){
    const r=await this.db.query(`SELECT
      (SELECT count(*)::int FROM products) products,
      (SELECT count(*)::int FROM orders) orders,
      (SELECT count(*)::int FROM bookings) bookings,
      (SELECT count(*)::int FROM services) services,
      (SELECT count(*)::int FROM projects) projects,
      (SELECT count(*)::int FROM testimonials) testimonials,
      (SELECT count(*)::int FROM contact_messages) contact_messages,
      (SELECT count(*)::int FROM users) users,
      (SELECT count(*)::int FROM technicians) technicians,
      (SELECT count(*)::int FROM newsletter_subscribers) subscribers`);
    return r.rows[0];
  }
  async databaseStats(){
    const [tables,indexes,cache,size,metrics]=await Promise.all([
      this.db.query(`SELECT relname AS table_name,pg_size_pretty(pg_total_relation_size(relid)) total_size,pg_size_pretty(pg_relation_size(relid)) data_size,pg_size_pretty(pg_indexes_size(relid)) index_size,n_live_tup::int row_count FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 50`),
      this.db.query(`SELECT schemaname,relname AS tablename,indexrelname AS indexname,pg_size_pretty(pg_relation_size(indexrelid)) index_size,idx_scan::bigint FROM pg_stat_user_indexes ORDER BY pg_relation_size(indexrelid) DESC LIMIT 100`),
      this.db.query(`SELECT CASE WHEN sum(blks_hit)+sum(blks_read)=0 THEN 100 ELSE round(1.0*sum(blks_hit)/(sum(blks_hit)+sum(blks_read)),4) END ratio FROM pg_stat_database WHERE datname=current_database()`),
      this.db.query(`SELECT pg_database_size(current_database())::bigint total_bytes,pg_size_pretty(pg_database_size(current_database())) total_size`),
      this.db.query(`SELECT extract(epoch from (now()-pg_postmaster_start_time()))::bigint uptime_seconds,(SELECT count(*)::int FROM pg_stat_activity WHERE datname=current_database()) active_connections,(SELECT COALESCE(sum(xact_commit+xact_rollback),0)::bigint FROM pg_stat_database WHERE datname=current_database()) total_queries,(SELECT COALESCE(sum(n_dead_tup),0)::bigint FROM pg_stat_user_tables) dead_tuples,(SELECT max(last_vacuum) FROM pg_stat_user_tables) last_vacuum,(SELECT max(last_analyze) FROM pg_stat_user_tables) last_analyze`)
    ]);
    return {tableSizes:tables.rows,indexStats:indexes.rows,cacheHitRatio:Number(cache.rows[0]?.ratio??100),totalSize:size.rows[0]?.total_size??'0 bytes',totalBytes:Number(size.rows[0]?.total_bytes??0),metrics:metrics.rows[0]};
  }
  async technicianStats(){return (await this.db.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='active')::int active,count(*) FILTER(WHERE status='busy')::int busy,count(*) FILTER(WHERE (SELECT count(*) FROM bookings b WHERE b.assigned_technician_id=technicians.id AND b.assignment_date=current_date AND b.status IN ('assigned','confirmed','in_progress'))>=daily_limit)::int at_capacity FROM technicians WHERE approval_status='approved'`)).rows[0];}
  async pushStats(){return (await this.db.query(`SELECT count(*) FILTER(WHERE is_active=true)::int total,count(*) FILTER(WHERE subscription_type='fcm' AND is_active=true)::int fcm,count(*) FILTER(WHERE is_active=false)::int inactive FROM push_subscriptions`)).rows[0];}
}
