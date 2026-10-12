import { AppError } from '../errors/app-error.js';
import type { NotificationRepository } from '../repositories/notification.repository.js';
import type { NotificationDeliveryProvider } from '../providers/notification-delivery.provider.js';

function categoryEnabled(eventType:string,p:any){
  if(eventType.startsWith('order.'))return p.order_updates!==false;
  if(eventType.startsWith('payment.'))return p.payment_updates!==false;
  if(eventType.startsWith('shipping.'))return p.shipping_updates!==false;
  if(eventType.startsWith('refund.'))return p.refund_updates!==false;
  if(eventType.startsWith('return.'))return p.return_updates!==false;
  if(eventType.startsWith('booking.'))return p.booking_updates!==false;
  return true;
}
export class NotificationService{
  constructor(private readonly repo:NotificationRepository,private readonly delivery:NotificationDeliveryProvider){}
  list(userId:string){return this.repo.listUser(userId)}
  preferences(userId:string){return this.repo.preferences(userId)}
  updatePreferences(userId:string,p:Record<string,boolean>){return this.repo.updatePreferences(userId,p)}
  async markRead(userId:string,id:string){if(!await this.repo.markRead(userId,id))throw new AppError(404,'NOTIFICATION_NOT_FOUND','Notification not found');return {id}}
  async markAll(userId:string){return {count:await this.repo.markAll(userId)}}
  async remove(userId:string,id:string){if(!await this.repo.remove(userId,id))throw new AppError(404,'NOTIFICATION_NOT_FOUND','Notification not found');return {id}}
  subscribe(userId:string,token:string,userAgent:string){return this.repo.upsertFcm(userId,token,userAgent)}
  hasActiveFcm(userId:string){return this.repo.hasActiveFcm(userId)}
  async unsubscribe(userId:string,token:string){await this.repo.disableFcm(userId,token);return {success:true}}
  adminOutbox(){return this.repo.adminOutbox()}
  enqueueSelf(userId:string,input:{eventType:string;title:string;message:string;channels:string[];metadata?:any}){return this.repo.enqueue(userId,input.eventType,input.title,input.message,input.channels,input.metadata??{})}
  enqueueAdmin(input:{userId:string;eventType:string;title:string;message:string;channels:string[];metadata?:any}){return this.repo.enqueue(input.userId,input.eventType,input.title,input.message,input.channels,input.metadata??{})}
  async requeue(id:string){const r=await this.repo.requeue(id);if(!r)throw new AppError(409,'OUTBOX_NOT_REQUEUEABLE','Outbox item is not requeueable');return r}
  async process(limit=25,worker=`worker-${process.pid}`){
    const rows=await this.repo.claim(limit,worker);let processed=0;
    for(const row of rows){
      const logged=await this.repo.deliveredChannels(row.event_key);const delivered:string[]=[...new Set([...(row.delivered_channels??[]),...logged])];const suppressed:string[]=[...(row.suppressed_channels??[])];const errors:string[]=[];
      try{
        const ctx=await this.repo.deliveryContext(row.user_id);
        const enabled=categoryEnabled(row.event_type,ctx.preferences);
        if(!enabled){suppressed.push(...row.requested_channels);await this.repo.finish(row,delivered,suppressed);processed++;continue;}
        let notificationId:string|null=null;
        if(row.requested_channels.includes('in_app')&&!delivered.includes('in_app')&&!suppressed.includes('in_app')){
          if(ctx.preferences?.in_app_notifications===false)suppressed.push('in_app');
          else {notificationId=await this.repo.transaction(tx=>this.repo.createInApp(tx,row));delivered.push('in_app');await this.repo.log(row.user_id,notificationId,'delivered','in_app',null,{event_key:row.event_key});}
        }
        if(row.requested_channels.includes('email')&&!delivered.includes('email')&&!suppressed.includes('email')){
          if(ctx.preferences?.email_notifications===false||!ctx.email)suppressed.push('email');
          else try{const r=await this.delivery.sendEmail({to:ctx.email,subject:row.title,text:row.message});delivered.push('email');await this.repo.log(row.user_id,notificationId,'delivered','email',null,{message_id:r.messageId,event_key:row.event_key});}catch(e:any){errors.push(`email:${e.message}`);await this.repo.log(row.user_id,notificationId,'failed','email',e.message,{event_key:row.event_key});}
        }
        if(row.requested_channels.includes('push')&&!delivered.includes('push')&&!suppressed.includes('push')){
          if(ctx.preferences?.push_notifications===false||!ctx.subscriptions.length)suppressed.push('push');
          else {let sent=false;for(const sub of ctx.subscriptions){try{const r=await this.delivery.sendPush({token:sub.fcm_token,title:row.title,body:row.message,data:{eventType:row.event_type,orderId:String(row.order_id??''),returnId:String(row.return_id??'')}});sent=true;await this.repo.log(row.user_id,notificationId,'delivered','push',null,{message_id:r.messageId,subscription_id:sub.id,event_key:row.event_key});}catch(e:any){errors.push(`push:${e.message}`);await this.repo.log(row.user_id,notificationId,'failed','push',e.message,{subscription_id:sub.id,event_key:row.event_key});}}if(sent)delivered.push('push');}
        }
        await this.repo.finish(row,delivered,suppressed,errors.length?errors.join('; '):undefined);processed++;
      }catch(e:any){await this.repo.finish(row,delivered,suppressed,e?.message??String(e));}
    }
    return {claimed:rows.length,processed};
  }
}
