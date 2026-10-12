import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useRef } from "react";
import { nativeNotifications } from "@/lib/nativeNotifications";
import type { NativeNotification } from "@/lib/apiContracts";

const POLL_MS = 30_000;
export const useNotifications=(userId:string|null)=>{
 const [notifications,setNotifications]=useState<NativeNotification[]>([]),[unreadCount,setUnreadCount]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const requestSeq=useRef(0);
 const fetchNotifications=useCallback(async()=>{const seq=++requestSeq.current;if(!userId){setNotifications([]);setUnreadCount(0);setLoading(false);setError(null);return;}setLoading(true);try{const data=await nativeNotifications.list();if(seq!==requestSeq.current)return;setNotifications(data??[]);setUnreadCount((data??[]).filter(n=>!n.is_read).length);setError(null);}catch(e:any){if(seq!==requestSeq.current)return;logger.error('[useNotifications] fetch error:',e);setError(e?.message||'Failed to load notifications');}finally{if(seq===requestSeq.current)setLoading(false)}},[userId]);
 const markAsRead=useCallback(async(id:string)=>{if(!userId)return;const target=notifications.find(n=>n.id===id);if(!target||target.is_read)return;setNotifications(v=>v.map(n=>n.id===id?{...n,is_read:true,read_at:new Date().toISOString()}:n));setUnreadCount(v=>Math.max(0,v-1));try{await nativeNotifications.markRead(id)}catch(e){logger.error('[useNotifications] mark read error:',e);void fetchNotifications()}},[userId,notifications,fetchNotifications]);
 const markAllAsRead=useCallback(async()=>{if(!userId||unreadCount===0)return;setNotifications(v=>v.map(n=>({...n,is_read:true,read_at:n.read_at??new Date().toISOString()})));setUnreadCount(0);try{await nativeNotifications.markAll()}catch(e){logger.error('[useNotifications] mark all error:',e);void fetchNotifications()}},[userId,unreadCount,fetchNotifications]);
 const deleteNotification=useCallback(async(id:string)=>{if(!userId)return;const target=notifications.find(n=>n.id===id);if(!target)return;setNotifications(v=>v.filter(n=>n.id!==id));if(!target.is_read)setUnreadCount(v=>Math.max(0,v-1));try{await nativeNotifications.remove(id)}catch(e){logger.error('[useNotifications] delete error:',e);void fetchNotifications()}},[userId,notifications,fetchNotifications]);
 useEffect(()=>{requestSeq.current++;void fetchNotifications();const timer=userId?window.setInterval(()=>void fetchNotifications(),POLL_MS):undefined;return()=>{requestSeq.current++;if(timer)window.clearInterval(timer)}},[userId,fetchNotifications]);
 return{notifications,unreadCount,loading,error,markAsRead,markAllAsRead,deleteNotification,refreshNotifications:fetchNotifications};
};
