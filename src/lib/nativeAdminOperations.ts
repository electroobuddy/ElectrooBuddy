import { nativeApiFetch } from '@/lib/apiClient';
import type { AdminDashboard, AdminMessage, AdminUser, ContactSubmissionInput, NativeBooking, NewsletterSubscriber, SiteSetting, TestimonialSubmissionInput, OpsStatusSnapshot } from './apiContracts';
export const submitNativeContact=(body:ContactSubmissionInput)=>nativeApiFetch<{created:true}>('/public/contact',{method:'POST',body:JSON.stringify(body)},false);
export const subscribeNativeNewsletter=(email:string)=>nativeApiFetch<{subscribed:boolean}>('/public/newsletter',{method:'POST',body:JSON.stringify({email})},false);
export const listNativeAdminMessages=(signal?:AbortSignal)=>nativeApiFetch<AdminMessage[]>('/admin/messages',{signal});
export const markNativeAdminMessageRead=(id:string)=>nativeApiFetch<AdminMessage>(`/admin/messages/${id}/read`,{method:'PATCH'});
export const listNativeSubscribers=()=>nativeApiFetch<NewsletterSubscriber[]>('/admin/subscribers');
export const deleteNativeSubscriber=(id:string)=>nativeApiFetch<{deleted:boolean}>(`/admin/subscribers/${id}`,{method:'DELETE'});
export const listNativeAdminUsers=(signal?:AbortSignal)=>nativeApiFetch<AdminUser[]>('/admin/users',{signal});
export const listNativeAdminUserBookings=(id:string)=>nativeApiFetch<NativeBooking[]>(`/admin/users/${id}/bookings`);
export const getNativeAdminDashboard=(signal?:AbortSignal)=>nativeApiFetch<AdminDashboard>('/admin/system/dashboard',{signal});
export const submitNativeTestimonial=(body:TestimonialSubmissionInput)=>nativeApiFetch<{created:true}>('/public/testimonials',{method:'POST',body:JSON.stringify(body)},false);
export const listNativeSiteSettings=()=>nativeApiFetch<SiteSetting[]>('/admin/site-settings');
export const saveNativeSiteSettings=(settings:Record<string,string>)=>nativeApiFetch<SiteSetting[]>('/admin/site-settings',{method:'PUT',body:JSON.stringify(settings)});
export const getPublicStats=()=>nativeApiFetch<{clients:number;projects:number}>('/public/stats',{},false);

export const getNativeOpsStatus=()=>nativeApiFetch<OpsStatusSnapshot>('/admin/ops/status');
