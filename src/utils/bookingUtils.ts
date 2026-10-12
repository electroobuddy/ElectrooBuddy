// ─── Shared Booking Utilities ──────────────────────────────────────────────────
// Used by both RequestServiceSection and BookingForm for consistency.

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  exact_location: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  description: string;
  custom_service_demand: string;
  is_switch_working: string;
  has_old_fan: string;
  is_electricity_supply_on: string;
}

export type FormErrors = Partial<Record<keyof BookingFormData, string>>;

// ─── Constants ─────────────────────────────────────────────────────────────────
export const SESSION_LIMIT = 3;
export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BLANK_FORM: BookingFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  exact_location: "",
  service_type: "",
  preferred_date: "",
  preferred_time: "",
  description: "",
  custom_service_demand: "",
  is_switch_working: "",
  has_old_fan: "",
  is_electricity_supply_on: "",
};

// ─── IST Date Helpers ──────────────────────────────────────────────────────────
/** Returns today midnight in IST as a Date */
export function todayIST(): Date {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** YYYY-MM-DD string for today in IST */
export function todayISOStr(): string {
  const d = todayIST();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** YYYY-MM-DD string for today + 3 months */
export function maxDateISOStr(): string {
  const d = todayIST();
  d.setMonth(d.getMonth() + 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** True when selected slot is not in the past */
export function isSlotNotInPast(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return true;
  
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayDate = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, "0")}-${String(nowIST.getDate()).padStart(2, "0")}`;
  
  // If booking for today, check time is in the future
  if (dateStr === todayDate) {
    const [h, min] = timeStr.split(":").map(Number);
    const currentHour = nowIST.getHours();
    const currentMin = nowIST.getMinutes();
    
    // Time must be in the future
    if (h < currentHour || (h === currentHour && min <= currentMin)) {
      return false;
    }
  }
  
  return true;
}

// ─── Validation ────────────────────────────────────────────────────────────────
export function validateBookingForm(
  form: BookingFormData,
  options?: { requireEmail?: boolean; requireTime?: boolean; requireDate?: boolean }
): FormErrors {
  const err: FormErrors = {};
  const { requireEmail = false, requireTime = true, requireDate = false } = options || {};

  // Name
  const name = form.name.trim();
  if (!name) err.name = "Full name is required";
  else if (name.length < 2) err.name = "At least 2 characters required";
  else if (name.length > 80) err.name = "Name is too long";
  else if (!/^[a-zA-Z\s'.]+$/.test(name)) err.name = "Only letters, spaces, apostrophes and dots";

  // Phone
  const phone = form.phone.trim();
  if (!phone) err.phone = "Phone number is required";
  else if (!PHONE_RE.test(phone)) err.phone = "Enter a valid 10-digit Indian mobile number";

  // Email
  if (requireEmail && !form.email.trim()) {
    err.email = "Email is required";
  } else if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
    err.email = "Enter a valid email address";
  }

  // Service
  if (!form.service_type) err.service_type = "Please select a service";

  // Address
  const addr = form.address.trim();
  if (!addr) err.address = "Service address is required";
  else if (addr.length < 10) err.address = "Please provide a complete address (min. 10 chars)";
  else if (addr.length > 300) err.address = "Address is too long";

  // Date — required by the native booking API and block past dates
  if (requireDate && !form.preferred_date) {
    err.preferred_date = "Please select a preferred date";
  }
  if (form.preferred_date) {
    const [y, m, d] = form.preferred_date.split("-").map(Number);
    const selected = new Date(y, m - 1, d);
    const today = todayIST();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      err.preferred_date = "Preferred date cannot be in the past";
    }
  }

  // Time — required by the native booking API; if booking for today, ensure it is in the future
  if (requireTime && !form.preferred_time) {
    err.preferred_time = "Please select a time";
  } else if (form.preferred_date && form.preferred_time) {
    if (!isSlotNotInPast(form.preferred_date, form.preferred_time)) {
      err.preferred_time = "Please select a future time";
    }
  }

  // Custom Service — required & min length
  if (form.service_type === "Custom Service") {
    const customDemand = form.custom_service_demand.trim();
    if (!customDemand) err.custom_service_demand = "Please describe your custom requirement";
    else if (customDemand.length < 20) err.custom_service_demand = "Please provide more detail (min. 20 characters)";
  }

  // Fan Installation — required questions
  if (form.service_type === "Fan Installation") {
    if (!form.is_switch_working) err.is_switch_working = "Please answer this question";
    if (!form.has_old_fan) err.has_old_fan = "Please answer this question";
    if (!form.is_electricity_supply_on) err.is_electricity_supply_on = "Please answer this question";
  }

  return err;
}

// ─── Payload Builder ───────────────────────────────────────────────────────────
export function buildBookingPayload(
  form: BookingFormData,
  options?: {
    userId?: string;
    couponCode?: string;
    applied?: any;
    base?: number;
    discount?: number;
    final?: number;
    userSubscriptionId?: string;
    subscriptionDiscount?: number;
    subscriptionBenefitUsed?: string;
  }
) {
  const { userId, couponCode, applied, base = 0, discount = 0, final = 0, userSubscriptionId, subscriptionDiscount = 0, subscriptionBenefitUsed } = options || {};

  const totalDiscount = discount + subscriptionDiscount;
  const finalAmount = Math.max(0, base - totalDiscount);

  const payload: any = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    address: form.address.trim(),
    service_type:
      form.service_type === "Custom Service"
        ? `Custom: ${form.custom_service_demand.trim()}`
        : form.service_type,
    preferred_date: form.preferred_date || null,
    preferred_time: form.preferred_time || null,
    description:
      form.service_type === "Custom Service"
        ? form.custom_service_demand.trim()
        : form.description.trim() || null,
    exact_location: form.exact_location.trim() || null,
    custom_service_demand:
      form.service_type === "Custom Service" ? form.custom_service_demand.trim() : null,
    is_switch_working: form.is_switch_working || null,
    has_old_fan: form.has_old_fan || null,
    is_electricity_supply_on: form.is_electricity_supply_on || null,
    coupon_code: couponCode?.trim()?.toUpperCase() || null,
    offer_id: null,
    discount_amount: totalDiscount > 0 ? totalDiscount : null,
    original_amount: base > 0 ? base : null,
    final_amount: finalAmount > 0 ? finalAmount : null,
    offer_applied: applied?.success || false,
    user_subscription_id: userSubscriptionId || null,
    subscription_discount: subscriptionDiscount > 0 ? subscriptionDiscount : null,
    subscription_benefit_used: subscriptionBenefitUsed || null,
  };

  if (userId) payload.user_id = userId;

  return payload;
}

// ─── Duplicate Guard ───────────────────────────────────────────────────────────
export function makeBookingHash(phone: string, service: string, date: string): string {
  return `${phone}|${service}|${date}`;
}

// ─── Timeout Helper ────────────────────────────────────────────────────────────
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${label}`)), ms)
    ),
  ]);
}
