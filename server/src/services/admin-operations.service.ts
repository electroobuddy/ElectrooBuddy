import { AppError } from '../errors/app-error.js';import type { AdminOperationsRepository } from '../repositories/admin-operations.repository.js';
export class AdminOperationsService{constructor(private readonly r:AdminOperationsRepository){}
 submitContact(i:any){return this.r.submitContact(i)} submitTestimonial(i:any){return this.r.submitTestimonial(i)} subscribe(email:string){return this.r.subscribe(email.trim().toLowerCase())}
 listSiteSettings(){return this.r.listSiteSettings()} saveSiteSettings(settings:Record<string,string>){return this.r.saveSiteSettings(settings)}
 listMessages(){return this.r.listMessages()} async markMessageRead(id:string){const x=await this.r.markMessageRead(id);if(!x)throw new AppError(404,'MESSAGE_NOT_FOUND','Message not found');return x}
 listSubscribers(){return this.r.listSubscribers()} async deleteSubscriber(id:string){const x=await this.r.deleteSubscriber(id);if(!x)throw new AppError(404,'SUBSCRIBER_NOT_FOUND','Subscriber not found');return x}
 listUsers(){return this.r.listUsers()} userBookings(id:string){return this.r.userBookings(id)} publicStats(){return this.r.publicStats()}
 async dashboard(){const [counts,database,technicians,push]=await Promise.all([this.r.dashboardCounts(),this.r.databaseStats(),this.r.technicianStats(),this.r.pushStats()]);return{counts,database,technicians,push}}
}
