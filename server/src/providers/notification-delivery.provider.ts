import nodemailer from 'nodemailer';
import { importPKCS8, SignJWT } from 'jose';
import type { AppEnv } from '../config/env.js';

export interface NotificationDeliveryProvider {
  sendEmail(input:{to:string;subject:string;text:string}):Promise<{messageId:string}>;
  sendPush(input:{token:string;title:string;body:string;data?:Record<string,string>}):Promise<{messageId:string}>;
}

export class NativeNotificationDeliveryProvider implements NotificationDeliveryProvider {
  private readonly mailer;
  private accessToken?: { value:string; expiresAt:number };
  constructor(private readonly env:AppEnv){
    this.mailer=nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_SECURE,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined});
  }
  async sendEmail(input:{to:string;subject:string;text:string}){
    if(!this.env.SMTP_HOST) throw new Error('SMTP_NOT_CONFIGURED');
    const r=await this.mailer.sendMail({from:this.env.SMTP_FROM,to:input.to,subject:input.subject,text:input.text});
    return {messageId:String(r.messageId??'smtp')};
  }
  private async firebaseToken(){
    if(this.accessToken && this.accessToken.expiresAt>Date.now()+60_000)return this.accessToken.value;
    const project=this.env.FIREBASE_PROJECT_ID, email=this.env.FIREBASE_CLIENT_EMAIL, pem=this.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n');
    if(!project||!email||!pem)throw new Error('FIREBASE_PUSH_NOT_CONFIGURED');
    const key=await importPKCS8(pem,'RS256');
    const now=Math.floor(Date.now()/1000);
    const assertion=await new SignJWT({scope:'https://www.googleapis.com/auth/firebase.messaging'})
      .setProtectedHeader({alg:'RS256',typ:'JWT'}).setIssuer(email).setSubject(email)
      .setAudience('https://oauth2.googleapis.com/token').setIssuedAt(now).setExpirationTime(now+3600).sign(key);
    const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(10_000)});
    if(!response.ok)throw new Error(`FIREBASE_TOKEN_HTTP_${response.status}`);
    const body=await response.json() as {access_token?:string;expires_in?:number};
    if(!body.access_token)throw new Error('FIREBASE_TOKEN_MISSING');
    this.accessToken={value:body.access_token,expiresAt:Date.now()+(body.expires_in??3600)*1000};
    return body.access_token;
  }
  async sendPush(input:{token:string;title:string;body:string;data?:Record<string,string>}){
    const access=await this.firebaseToken();
    const response=await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(this.env.FIREBASE_PROJECT_ID)}/messages:send`,{method:'POST',headers:{authorization:`Bearer ${access}`,'content-type':'application/json'},body:JSON.stringify({message:{token:input.token,notification:{title:input.title,body:input.body},data:input.data??{}}}),signal:AbortSignal.timeout(10_000)});
    const body=await response.json().catch(()=>({})) as {name?:string;error?:unknown};
    if(!response.ok)throw new Error(`FCM_HTTP_${response.status}:${JSON.stringify(body.error??{})}`);
    return {messageId:String(body.name??'fcm')};
  }
}
