import { logger } from "@/lib/logger";
import { nativeNotifications } from '@/lib/nativeNotifications';
import { initFirebase, requestFirebasePermission, onFirebaseMessage } from '@/integrations/firebase/config';
let isInitialized=false; const TOKEN_KEY='electroobuddy_fcm_token'; const OWNER_KEY='electroobuddy_fcm_owner';
export async function initPushNotifications(){if(isInitialized)return true;const ok=initFirebase();if(ok){isInitialized=true;listenForForegroundMessages()}return ok}
function listenForForegroundMessages(){onFirebaseMessage((payload)=>{if(payload.notification){const n=new Notification(payload.notification.title||'ElectroBuddy',{body:payload.notification.body,icon:payload.notification.icon||'/favicon.png',badge:'/favicon.png',data:payload.data||{}});n.onclick=()=>{window.focus();n.close()}}})}
export async function subscribeToPush(userId:string){try{if(!await initPushNotifications())return false;const token=await requestFirebasePermission(userId);if(!token)return false;await nativeNotifications.subscribeFcm(token);localStorage.setItem(TOKEN_KEY,token);localStorage.setItem(OWNER_KEY,userId);return true}catch(e){logger.error('[Firebase] subscribeToPush error:',e);return false}}
export async function unsubscribeFromPush(userId:string){const token=localStorage.getItem(TOKEN_KEY);const owner=localStorage.getItem(OWNER_KEY);try{if(token&&owner===userId)await nativeNotifications.unsubscribeFcm(token);return true}catch(e){logger.error('[Firebase] unsubscribeFromPush error:',e);return false}finally{if(owner===userId){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(OWNER_KEY)}}}
export async function releaseOwnedPushSubscription(userId:string){return unsubscribeFromPush(userId)}
export function getNotificationPermission():NotificationPermission{return 'Notification'in window?Notification.permission:'denied'}
export async function requestNotificationPermission(){if(!('Notification'in window))return false;try{return await Notification.requestPermission()==='granted'}catch{return false}}
export function isPushSupported(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
export async function hasActiveSubscription(userId:string){try{const owner=localStorage.getItem(OWNER_KEY);if(owner!==userId)return false;return (await nativeNotifications.hasActiveFcm()).active}catch{return false}}
export function sendMessageToServiceWorker(message:unknown){if('serviceWorker'in navigator&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage(message)}
