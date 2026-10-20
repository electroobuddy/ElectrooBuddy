import { nativeApiFetch } from './apiClient';
import type { BookingOperationalUpdate, BookingQuote, BookingQuoteInput, BookingStatus, CreateBookingInput, NativeBooking, NativeTechnician } from './apiContracts';
export async function quoteNativeBooking(input:BookingQuoteInput){return nativeApiFetch<BookingQuote>('/bookings/quote',{method:'POST',body:JSON.stringify(input)});}
export async function createNativeBooking(input:CreateBookingInput){return nativeApiFetch<NativeBooking>('/bookings',{method:'POST',body:JSON.stringify(input)});}
export async function listNativeBookings(status?:BookingStatus){return nativeApiFetch<NativeBooking[]>(`/bookings${status?`?status=${encodeURIComponent(status)}`:''}`);}
export async function getNativeBooking(id:string){return nativeApiFetch<NativeBooking>(`/bookings/${id}`);}
export async function cancelNativeBooking(id:string){return nativeApiFetch<{cancelled:true}>(`/bookings/${id}/cancel`,{method:'POST'});}
export async function lookupNativeBooking(token:string){return nativeApiFetch<NativeBooking|null>('/booking-tracking/lookup',{method:'POST',body:JSON.stringify({token})},false);}
export async function listNativeTechnicianBookings(){return nativeApiFetch<NativeBooking[]>('/technician/bookings');}
export async function transitionNativeTechnicianBooking(id:string,target:'in_progress'|'completed'){return nativeApiFetch<NativeBooking>(`/technician/bookings/${id}/transition`,{method:'POST',body:JSON.stringify({target})});}
export async function listNativeAdminBookings(status?:BookingStatus,signal?:AbortSignal){return nativeApiFetch<NativeBooking[]>(`/admin/bookings${status?`?status=${encodeURIComponent(status)}`:''}`,{signal});}
export async function getNativeAdminBooking(id:string){return nativeApiFetch<NativeBooking>(`/admin/bookings/${id}`);}
export async function listNativeAvailableTechnicians(date:string){return nativeApiFetch<NativeTechnician[]>(`/admin/technicians/available?date=${encodeURIComponent(date)}`);}
export async function assignNativeBooking(id:string,technicianId:string){return nativeApiFetch<{kind:string;technician:NativeTechnician}>(`/admin/bookings/${id}/assign`,{method:'POST',body:JSON.stringify({technicianId})});}
export async function unassignNativeBooking(id:string){return nativeApiFetch<{unassigned:true}>(`/admin/bookings/${id}/unassign`,{method:'POST'});}
export async function transitionNativeAdminBooking(id:string,target:BookingStatus){return nativeApiFetch<NativeBooking>(`/admin/bookings/${id}/transition`,{method:'POST',body:JSON.stringify({target})});}
export async function updateNativeAdminBookingOperational(id:string,input:BookingOperationalUpdate){return nativeApiFetch<NativeBooking>(`/admin/bookings/${id}/operational`,{method:'PATCH',body:JSON.stringify(input)});}
export async function archiveNativeAdminBooking(id:string){return nativeApiFetch<{archived:true}>(`/admin/bookings/${id}/archive`,{method:'POST'});}
