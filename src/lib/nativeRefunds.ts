import {nativeApiFetch} from './apiClient';
import type { NativeRefund, RefundRequestResult } from './apiContracts';
export const requestNativeRefund=(input:{orderId:string;requestKey:string;amount?:number;reason?:string},admin=false)=>nativeApiFetch<RefundRequestResult>(admin?`/admin/orders/${input.orderId}/refunds`:`/orders/${input.orderId}/refunds`,{method:'POST',body:JSON.stringify({requestKey:input.requestKey,amount:input.amount,reason:input.reason})});
export const listNativeRefunds=()=>nativeApiFetch<NativeRefund[]>('/refunds');
export const reconcileNativeRefunds=()=>nativeApiFetch<{checked:number;updated:number;unchanged:number;errors:number}>('/admin/refunds/reconcile',{method:'POST'});
