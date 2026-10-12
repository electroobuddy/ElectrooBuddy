import { nativeApiFetch } from './apiClient';
import type { NativeCheckoutResult } from './apiContracts';
export type NativeCheckoutInput={requestId:string;items:{productId:string;quantity:number;installationService:boolean}[];address:{fullName:string;email:string;phone:string;addressLine1:string;addressLine2?:string|null;city:string;state:string;postalCode:string;landmark?:string|null;country?:string};paymentMethod:'cod'|'razorpay';couponCode?:string|null};
export async function createNativeCheckout(input:NativeCheckoutInput){return nativeApiFetch<NativeCheckoutResult>('/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':input.requestId},body:JSON.stringify(input)});}
