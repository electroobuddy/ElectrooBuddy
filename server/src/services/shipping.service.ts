import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { DatabaseClient } from '../config/database.js';
import { AppError } from '../errors/app-error.js';
import type { CreateShipmentInput, ShippingProvider } from '../providers/shipping.provider.js';
import { ShippingRepository } from '../repositories/shipping.repository.js';

const safeEq=(a:string,b:string)=>{const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb)};

export class ShippingService {
  constructor(private env:AppEnv,private db:DatabaseClient,private provider:ShippingProvider){}

  async settings(){
    const s=await new ShippingRepository(this.db).settings();
    return {...s,credentialsConfigured:Boolean(this.env.SHIPROCKET_EMAIL&&this.env.SHIPROCKET_PASSWORD),webhookUrl:`${this.env.PUBLIC_API_URL.replace(/\/$/,'')}${this.env.API_PREFIX}/webhooks/fulfillment`,worker:{maxAttempts:this.env.FULFILLMENT_MAX_ATTEMPTS,retryMinutes:this.env.FULFILLMENT_RETRY_MINUTES,staleLockMinutes:this.env.FULFILLMENT_STALE_LOCK_MINUTES,batch:this.env.FULFILLMENT_WORKER_BATCH}};
  }
  async saveSettings(i:any){return new ShippingRepository(this.db).saveSettings({...i,webhookUrl:`${this.env.PUBLIC_API_URL.replace(/\/$/,'')}${this.env.API_PREFIX}/webhooks/fulfillment`});}
  async test(){await this.provider.testConnection();return{connected:true};}

  private shipmentInput(o:any,items:any[],s:any,reference?:string):CreateShipmentInput{
    const a=o.shipping_address_data||{};
    return {
      orderId:o.id,
      orderNumber:reference||o.order_number,
      orderedAt:new Date(o.ordered_at||o.created_at),
      paymentMethod:'prepaid',
      total:Number(o.total_amount||0),
      subtotal:Number(o.subtotal||0),
      weight:Number(o.shipping_weight||s.default_weight||1),
      length:Number(o.shipping_dimensions?.length||s.default_length||10),
      breadth:Number(o.shipping_dimensions?.breadth||o.shipping_dimensions?.width||s.default_width||10),
      height:Number(o.shipping_dimensions?.height||s.default_height||10),
      address:{name:a.fullName||a.full_name||'Customer',email:a.email||'',phone:a.phone||'',address:a.addressLine1||a.address_line1||'',address2:a.addressLine2||a.address_line2||'',city:a.city||'',state:a.state||'',pincode:a.postalCode||a.postal_code||'',country:a.country||'India'},
      items:items.map((x:any)=>({name:x.product_name,sku:x.product_sku,units:Number(x.quantity??x.accepted_quantity),sellingPrice:Number(x.unit_price)}))
    };
  }

  private async send(input:CreateShipmentInput){
    let out=await this.provider.createShipment(input);
    if(!out.awbCode){const awb=await this.provider.assignAwb(out.providerShipmentId);out={...out,...awb,providerOrderId:out.providerOrderId||awb.providerOrderId};}
    let pickup=false;
    if(out.providerShipmentId){await this.provider.schedulePickup(out.providerShipmentId).then(()=>pickup=true).catch(()=>{});}
    return {out,pickup};
  }

  async create(orderId:string){
    let prepared:any;
    await this.db.withTransaction(async q=>{
      const r=new ShippingRepository(q),o=await r.lockOrder(orderId);
      if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');
      if(o.status==='cancelled')throw new AppError(409,'ORDER_CANCELLED','Cancelled order cannot be shipped');
      if(o.payment_method==='razorpay'&&o.payment_status!=='paid')throw new AppError(409,'PAYMENT_NOT_VERIFIED','Online payment must be verified before shipment');
      if(o.shiprocket_order_id){prepared={existing:o};return;}
      const s=await r.settings();if(!s?.enabled)throw new AppError(409,'SHIPPING_DISABLED','Shiprocket integration is disabled');
      const items=await r.orderItems(o.id);await r.job(o.id,this.env.FULFILLMENT_MAX_ATTEMPTS);
      const claimed=await r.claimJob(o.id);if(!claimed)throw new AppError(409,'SHIPMENT_ALREADY_PROCESSING','Shipment creation is already processing, exhausted, or completed');
      prepared={o,items,s};
    });
    if(prepared.existing)return prepared.existing;
    const {o,items,s}=prepared;
    try{
      const input=this.shipmentInput(o,items,s);
      input.paymentMethod=o.payment_method==='cod'?'cod':'prepaid';
      const {out,pickup}=await this.send(input);
      await this.db.withTransaction(async q=>{
        const r=new ShippingRepository(q);
        await q.query(`UPDATE orders SET shiprocket_order_id=$2,shiprocket_shipment_id=$3,tracking_number=$4,courier_name=$5,tracking_url=$6,shipping_carrier='shiprocket',fulfillment_status=CASE WHEN $4 IS NULL THEN 'created' ELSE 'in_transit' END,status=CASE WHEN status IN('confirmed','processing') AND $4 IS NOT NULL THEN 'shipped' ELSE status END,shipped_at=CASE WHEN $4 IS NOT NULL THEN COALESCE(shipped_at,now()) ELSE shipped_at END,updated_at=now() WHERE id=$1`,[o.id,out.providerOrderId,out.providerShipmentId,out.awbCode||null,out.courierName||'Shiprocket',out.trackingUrl||null]);
        await r.success(o.id,out,pickup);await r.event(o.id,`create:${out.providerShipmentId}`,'created',{awb:out.awbCode,pickup});await r.operationEvent('order',o.id,'shipment_created',{providerShipmentId:out.providerShipmentId,awb:out.awbCode,pickup});
      });
      return out;
    }catch(e:any){await new ShippingRepository(this.db).fail(o.id,e?.message||'Shiprocket failure',this.env.FULFILLMENT_RETRY_MINUTES).catch(()=>{});throw new AppError(502,'SHIPMENT_CREATE_FAILED','Unable to create shipment');}
  }

  async enqueueEligible(limit=this.env.FULFILLMENT_WORKER_BATCH){const r=new ShippingRepository(this.db);const rows=await r.enqueueEligible(limit,this.env.FULFILLMENT_MAX_ATTEMPTS);return {queued:rows.length,orderIds:rows.map((x:any)=>x.order_id)};}
  async processQueue(limit=this.env.FULFILLMENT_WORKER_BATCH){const r=new ShippingRepository(this.db);await r.recoverStale(this.env.FULFILLMENT_STALE_LOCK_MINUTES);await this.enqueueEligible(limit);const ids=await r.readyOrderIds(limit);let succeeded=0,failed=0;for(const id of ids){try{await this.create(id);succeeded++;}catch{failed++;}}return {checked:ids.length,succeeded,failed};}
  async operations(limit=100){const r=new ShippingRepository(this.db);return {orders:await r.fulfillmentOps(limit),replacements:await r.replacementOps(limit)};}
  async retryOrder(orderId:string){const r=new ShippingRepository(this.db),job=await r.retryJob(orderId);if(!job)throw new AppError(409,'FULFILLMENT_NOT_RETRYABLE','Fulfillment job is not retryable');await r.operationEvent('order',orderId,'manual_retry',{});return job;}

  async createReplacement(returnId:string){
    const repo=new ShippingRepository(this.db);await repo.replacement(returnId,this.env.FULFILLMENT_MAX_ATTEMPTS);
    let prepared:any;
    await this.db.withTransaction(async q=>{const r=new ShippingRepository(q),x=await r.lockReplacement(returnId);if(!x)throw new AppError(404,'REPLACEMENT_NOT_FOUND','Approved replacement not found');if(!x.replacement_authorized_at||x.return_status!=='replaced')throw new AppError(409,'REPLACEMENT_NOT_AUTHORIZED','Replacement must be inspected and explicitly authorized first');if(x.provider_shipment_id){prepared={existing:x};return;}const s=await r.settings();if(!s?.enabled)throw new AppError(409,'SHIPPING_DISABLED','Shiprocket integration is disabled');const items=await r.replacementItems(returnId);if(!items.length)throw new AppError(409,'REPLACEMENT_ITEMS_EMPTY','No accepted replacement items are available');const claimed=await r.claimReplacement(returnId);if(!claimed)throw new AppError(409,'REPLACEMENT_ALREADY_PROCESSING','Replacement shipment is already processing, exhausted, or completed');prepared={x,items,s};});
    if(prepared.existing)return prepared.existing;
    const {x,items,s}=prepared;
    try{const input=this.shipmentInput(x,items,s,`${x.order_number}-RPL-${returnId.slice(0,8)}`);input.paymentMethod='prepaid';input.items=input.items.map(i=>({...i,sellingPrice:Math.max(0.01,i.sellingPrice)}));input.subtotal=input.items.reduce((sum,i)=>sum+(i.sellingPrice*i.units),0);input.total=input.subtotal;const {out,pickup}=await this.send(input);await this.db.withTransaction(async q=>{const r=new ShippingRepository(q);await r.replacementSuccess(returnId,out,pickup);await r.operationEvent('replacement',returnId,'replacement_shipment_created',{providerShipmentId:out.providerShipmentId,awb:out.awbCode,pickup});await q.query(`INSERT INTO return_events(return_id,event_key,status,payload) VALUES($1,$2,'replacement_shipped',$3::jsonb) ON CONFLICT(event_key) DO NOTHING`,[returnId,`replacement-shipment:${out.providerShipmentId}`,JSON.stringify({awb:out.awbCode,courier:out.courierName})]);});return out;}catch(e:any){await repo.replacementFail(returnId,e?.message||'Replacement shipment failure',this.env.FULFILLMENT_RETRY_MINUTES).catch(()=>{});throw new AppError(502,'REPLACEMENT_SHIPMENT_FAILED','Unable to create replacement shipment');}
  }
  async processReplacementQueue(limit=this.env.FULFILLMENT_WORKER_BATCH){const r=new ShippingRepository(this.db);await r.enqueueAuthorizedReplacements(limit,this.env.FULFILLMENT_MAX_ATTEMPTS);const ids=await r.readyReplacementIds(limit);let succeeded=0,failed=0;for(const id of ids){try{await this.createReplacement(id);succeeded++;}catch{failed++;}}return{checked:ids.length,succeeded,failed};}
  async retryReplacement(returnId:string){const r=new ShippingRepository(this.db),job=await r.retryReplacement(returnId);if(!job)throw new AppError(409,'REPLACEMENT_NOT_RETRYABLE','Replacement shipment is not retryable');await r.operationEvent('replacement',returnId,'manual_retry',{});return job;}

  async documents(orderId:string){const r=new ShippingRepository(this.db),o=await r.lockOrder(orderId);if(!o?.shiprocket_shipment_id)throw new AppError(409,'SHIPMENT_NOT_CREATED','Shipment is not available');const labelUrl=await this.provider.generateLabel([String(o.shiprocket_shipment_id)]);const manifestUrl=await this.provider.generateManifest([String(o.shiprocket_shipment_id)]);return r.saveDocuments(orderId,{labelUrl,manifestUrl});}
  async replacementDocuments(returnId:string){const r=new ShippingRepository(this.db);const x=await r.lockReplacement(returnId);if(!x?.provider_shipment_id)throw new AppError(409,'REPLACEMENT_SHIPMENT_NOT_CREATED','Replacement shipment is not available');const labelUrl=await this.provider.generateLabel([String(x.provider_shipment_id)]);const manifestUrl=await this.provider.generateManifest([String(x.provider_shipment_id)]);return r.saveReplacementDocuments(returnId,{labelUrl,manifestUrl});}

  async cancel(orderId:string){return this.db.withTransaction(async q=>{const r=new ShippingRepository(q),o=await r.lockOrder(orderId);if(!o)throw new AppError(404,'ORDER_NOT_FOUND','Order not found');if(!o.shiprocket_order_id)throw new AppError(409,'SHIPMENT_NOT_CREATED','Shipment does not exist');if(['delivered','out_for_delivery'].includes(o.fulfillment_status))throw new AppError(409,'SHIPMENT_CANNOT_CANCEL','Shipment can no longer be cancelled');await this.provider.cancelShipment({providerOrderId:o.shiprocket_order_id,providerShipmentId:o.shiprocket_shipment_id});await q.query(`UPDATE orders SET fulfillment_status='provider_cancelled',updated_at=now() WHERE id=$1`,[o.id]);await q.query(`UPDATE fulfillment_jobs SET status='cancelled',cancelled_at=now(),locked_at=NULL,updated_at=now() WHERE order_id=$1`,[o.id]);await r.event(o.id,`cancel:${o.shiprocket_order_id}`,'provider_cancelled',{});return{cancelled:true};});}
  async sync(orderId:string){const o=await new ShippingRepository(this.db).lockOrder(orderId);if(!o||!o.tracking_number)throw new AppError(409,'TRACKING_NOT_AVAILABLE','AWB is not available');const t=await this.provider.trackAwb(o.tracking_number);await this.applyStatus(o,t.status,{awb_code:t.awbCode||o.tracking_number,courier_name:t.courierName,tracking_details:t.history,estimated_delivery_date:t.estimatedDeliveryDate,event_id:`poll:${o.tracking_number}:${createHash('sha256').update(JSON.stringify(t)).digest('hex').slice(0,24)}`});return t;}
  private normalize(s:string){const x=s.toLowerCase().replace(/[_-]+/g,' ');if(x.includes('rto')&&(x.includes('delivered')||x.includes('received')))return'rto_received';if(x.includes('rto'))return'rto_in_transit';if(x.includes('delivered'))return'delivered';if(x.includes('out for delivery'))return'out_for_delivery';if(x.includes('cancel'))return'provider_cancelled';if(x.includes('pickup')||x.includes('shipped')||x.includes('transit')||x.includes('manifest'))return'in_transit';return'in_transit';}
  async applyStatus(order:any,status:string,p:any){return this.db.withTransaction(async q=>{const r=new ShippingRepository(q),state=this.normalize(status),key=String(p.event_id||p.id||`${p.order_id||''}:${p.awb_code||''}:${status}:${p.updated_at||p.current_timestamp||''}`);if(!await r.event(order.id,key,status,p))return{duplicate:true};await q.query(`UPDATE orders SET tracking_number=COALESCE($2,tracking_number),courier_name=COALESCE($3,courier_name),tracking_history=CASE WHEN $4::jsonb IS NULL THEN tracking_history ELSE $4::jsonb END,estimated_delivery_date=COALESCE($5::timestamptz,estimated_delivery_date),fulfillment_status=$6,status=CASE WHEN $6='delivered' THEN 'delivered' WHEN $6='in_transit' AND status NOT IN('cancelled','delivered') THEN 'shipped' ELSE status END,shipped_at=CASE WHEN $6='in_transit' THEN COALESCE(shipped_at,now()) ELSE shipped_at END,delivered_at=CASE WHEN $6='delivered' THEN COALESCE(delivered_at,now()) ELSE delivered_at END,updated_at=now() WHERE id=$1`,[order.id,p.awb_code||p.awb||null,p.courier_name||null,(p.tracking_details||p.scans)?JSON.stringify(p.tracking_details||p.scans):null,p.estimated_delivery_date||p.etd||null,state]);await q.query(`UPDATE fulfillment_jobs SET awb_code=COALESCE($2,awb_code),updated_at=now() WHERE order_id=$1`,[order.id,p.awb_code||null]);if(state==='rto_in_transit'||state==='rto_received'){const existing=(await q.query<any>(`SELECT id FROM order_returns WHERE order_id=$1 AND return_type='rto' ORDER BY created_at DESC LIMIT 1`,[order.id])).rows[0];let rid=existing?.id;if(!rid){rid=(await q.query<any>(`INSERT INTO order_returns(order_id,user_id,request_key,return_type,status,reason,provider_status,received_at) VALUES($1,$2,$3,'rto',$4,'Shiprocket RTO',$5,CASE WHEN $4='rto_received' THEN now() ELSE NULL END) RETURNING id`,[order.id,order.user_id,randomUUID(),state,status])).rows[0].id;}else await q.query(`UPDATE order_returns SET status=$2,provider_status=$3,received_at=CASE WHEN $2='rto_received' THEN COALESCE(received_at,now()) ELSE received_at END,updated_at=now() WHERE id=$1`,[rid,state,status]);await q.query(`INSERT INTO return_events(return_id,event_key,status,payload) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(event_key) DO NOTHING`,[rid,`${key}:rto`,status,JSON.stringify(p)]);}return{state};});}
  async webhook(raw:Buffer,headers:any){const expected=this.env.SHIPROCKET_WEBHOOK_TOKEN,provided=String(headers['x-api-key']||headers['x-shiprocket-webhook-token']||'');if(!expected||!provided||!safeEq(expected,provided))throw new AppError(401,'INVALID_SHIPPING_WEBHOOK','Invalid fulfillment webhook token');let p:any;try{p=JSON.parse(raw.toString('utf8'));}catch{throw new AppError(400,'INVALID_JSON','Invalid webhook payload');}const r=new ShippingRepository(this.db),o=await r.findOrder({awb:String(p.awb_code||p.awb||''),providerOrderId:String(p.sr_order_id||p.order_id||''),providerShipmentId:String(p.shipment_id||'')});if(!o)return{ignored:true};return this.applyStatus(o,String(p.current_status||p.shipment_status||p.status||'unknown'),p);}
}
