import type { BookingFormData } from "@/utils/bookingUtils";
import { createNativeBooking } from './nativeBooking';

export async function createAuthoritativeServiceBooking(form: BookingFormData, opts: { serviceId: string; couponCode?: string; useSubscription?: boolean; useFreeServiceCall?: boolean; requestId: string }) {
  return createNativeBooking({requestId:opts.requestId,serviceId:opts.serviceId||null,isCustomService:form.service_type==='Custom Service',name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim(),address:form.address.trim(),exactLocation:form.exact_location.trim()||null,preferredDate:form.preferred_date,preferredTime:form.preferred_time,description:form.service_type==='Custom Service'?form.custom_service_demand.trim():form.description.trim(),customServiceDemand:form.custom_service_demand.trim()||null,isSwitchWorking:form.is_switch_working||null,hasOldFan:form.has_old_fan||null,isElectricitySupplyOn:form.is_electricity_supply_on||null,couponCode:opts.couponCode?.trim().toUpperCase()||null,useSubscription:Boolean(opts.useSubscription),useFreeServiceCall:Boolean(opts.useFreeServiceCall)});
}
