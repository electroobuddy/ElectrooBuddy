import { AppError } from '../errors/app-error.js';
import { hashPassword } from '../auth/crypto.js';
import type { TechnicianRepository, TechnicianInput } from '../repositories/technician.repository.js';

export class TechnicianService {
  constructor(private readonly repo:TechnicianRepository){}
  listAdmin(date:string,approval?:string|undefined,status?:string){return this.repo.listAdmin(date,approval,status)}
  async getAdmin(id:string){const t=await this.repo.getAdmin(id);if(!t)throw new AppError(404,'TECHNICIAN_NOT_FOUND','Technician not found');return t}
  async listAdminBookings(id:string,limit:number){await this.getAdmin(id);return this.repo.listAdminBookings(id,limit)}
  async getApplication(userId:string){const t=await this.repo.getForUser(userId);if(!t)throw new AppError(404,'TECHNICIAN_APPLICATION_NOT_FOUND','Technician application not found');return t}
  async getSelf(userId:string){const t=await this.repo.getForUser(userId);if(!t)throw new AppError(404,'TECHNICIAN_PROFILE_NOT_FOUND','Technician profile not found');return t}
  async dashboard(userId:string){const d=await this.repo.dashboard(userId);if(!d)throw new AppError(404,'TECHNICIAN_PROFILE_NOT_FOUND','Technician profile not found');return d}
  async createByAdmin(adminId:string,input:TechnicianInput&{password:string}){try{return await this.repo.createByAdmin(input,await hashPassword(input.password),adminId)}catch(e:any){if(e?.code==='23505')throw new AppError(409,'TECHNICIAN_EMAIL_EXISTS','An account already exists for this email');throw e}}
  async updateAdmin(id:string,input:Partial<TechnicianInput>){const t=await this.repo.updateAdmin(id,input);if(!t)throw new AppError(404,'TECHNICIAN_NOT_FOUND','Technician not found');return t}
  async review(adminId:string,id:string,decision:'approved'|'rejected'){const t=await this.repo.review(id,decision,adminId);if(!t)throw new AppError(404,'TECHNICIAN_NOT_FOUND','Technician not found');return t}
  async disable(adminId:string,id:string){const r:any=await this.repo.disable(id,adminId);if(!r)throw new AppError(404,'TECHNICIAN_NOT_FOUND','Technician not found');if(r.blocked)throw new AppError(409,'TECHNICIAN_HAS_ACTIVE_BOOKINGS',`Technician has ${r.activeCount} active booking(s); reassign them before disabling`);return {disabled:true}}
  async updateSelf(userId:string,input:{name?:string|undefined;phone?:string|undefined;address?:string|undefined;skills?:string[]|undefined;experience?:number|undefined;dailyLimit?:number|undefined;status?:'active'|'busy'|'offline';profileUrl?:string|null|undefined}){const t=await this.repo.updateSelf(userId,input);if(!t)throw new AppError(404,'TECHNICIAN_PROFILE_NOT_FOUND','Approved technician profile not found');return t}
  async submitApplication(userId:string,input:any){try{return await this.repo.submitApplication(userId,input)}catch(e:any){if(e?.code==='23505')throw new AppError(409,'TECHNICIAN_EMAIL_EXISTS','A technician application already exists for this email');throw e}}

}
