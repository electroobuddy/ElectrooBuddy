import { nativeApiFetch } from './apiClient';
import type { NativeBooking, NativeTechnician, TechnicianApplicationInput, TechnicianApprovalStatus, TechnicianCreateInput, TechnicianDashboard, TechnicianApplicationStatus, TechnicianSelfUpdateInput, TechnicianStatus, TechnicianUpdateInput } from './apiContracts';
export async function listNativeAdminTechnicians(date:string,approval?:TechnicianApprovalStatus,status?:TechnicianStatus){const q=new URLSearchParams({date});if(approval)q.set('approval',approval);if(status)q.set('status',status);return nativeApiFetch<NativeTechnician[]>(`/admin/technicians?${q.toString()}`)}
export async function getNativeAdminTechnician(id:string){return nativeApiFetch<NativeTechnician>(`/admin/technicians/${id}`)}
export async function listNativeAdminTechnicianBookings(id:string,limit=10){return nativeApiFetch<NativeBooking[]>(`/admin/technicians/${id}/bookings?limit=${Math.max(1,Math.min(50,limit))}`)}
export async function createNativeTechnician(input:TechnicianCreateInput){return nativeApiFetch<NativeTechnician>('/admin/technicians',{method:'POST',body:JSON.stringify(input)})}
export async function updateNativeTechnician(id:string,input:TechnicianUpdateInput){return nativeApiFetch<NativeTechnician>(`/admin/technicians/${id}`,{method:'PATCH',body:JSON.stringify(input)})}
export async function reviewNativeTechnician(id:string,decision:'approved'|'rejected'){return nativeApiFetch<NativeTechnician>(`/admin/technicians/${id}/review`,{method:'POST',body:JSON.stringify({decision})})}
export async function disableNativeTechnician(id:string){return nativeApiFetch<{disabled:true}>(`/admin/technicians/${id}/disable`,{method:'POST'})}
export async function getNativeTechnicianApplication(){return nativeApiFetch<TechnicianApplicationStatus>('/technician/application')}
export async function getNativeTechnicianProfile(){return nativeApiFetch<NativeTechnician>('/technician/profile')}
export async function updateNativeTechnicianProfile(input:TechnicianSelfUpdateInput){return nativeApiFetch<NativeTechnician>('/technician/profile',{method:'PATCH',body:JSON.stringify(input)})}
export async function getNativeTechnicianDashboard(){return nativeApiFetch<TechnicianDashboard>('/technician/dashboard')}
export async function submitNativeTechnicianApplication(input:TechnicianApplicationInput){return nativeApiFetch<NativeTechnician>('/technician/application',{method:'POST',body:JSON.stringify(input)})}
