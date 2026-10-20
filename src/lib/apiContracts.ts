export type ApiRecord = Record<string, unknown>;
export type Id = string;
export type IsoDateString = string;

export interface AppUser extends ApiRecord {
  id: Id;
  email?: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface NativeAuthSession {
  accessToken: string;
  user: AppUser;
}

export interface AuthRegisterResult { userId: Id; emailVerificationRequired: boolean; }
export interface AuthAcceptedResult { accepted: boolean; }
export interface PasswordResetResult { passwordReset: boolean; }
export interface EmailVerificationResult { emailVerified: boolean; }
export interface LogoutResult { loggedOut: boolean; }
export interface LogoutAllResult { loggedOutAll: boolean; }

export type OrderStatus = 'pending'|'confirmed'|'processing'|'cancelled'|'delivered'|string;
export type PaymentStatus = 'pending'|'paid'|'failed'|'partially_refunded'|'refunded'|string;
export type FulfillmentStatus = 'pending'|'processing'|'in_transit'|'out_for_delivery'|'delivered'|'cancelled'|string;

export interface NativeOrderItem extends ApiRecord {
  id: Id;
  product_id?: Id | null;
  product_name?: string | null;
  product_sku?: string | null;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  installation_service?: boolean;
  installation_charge?: number;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  return_eligible_quantity?: number;
  created_at?: IsoDateString;
}

export interface OrderPostPurchaseCapabilities {
  can_cancel: boolean;
  can_refund_to_cancel: boolean;
  can_return: boolean;
  can_replace: boolean;
  return_window_ends_at: string | null;
  refundable_amount?: number;
  has_active_return?: boolean;
}

export interface ShippingAddressData extends ApiRecord {
  full_name?: string | null; name?: string | null; email?: string | null; phone?: string | null;
  address_line1?: string | null; address_line2?: string | null; address?: string | null;
  city?: string | null; state?: string | null; postal_code?: string | null; pincode?: string | null; country?: string | null;
}

export interface NativeOrder extends ApiRecord {
  id: Id;
  order_number: string;
  user_id?: Id;
  status: OrderStatus;
  payment_method?: 'cod'|'razorpay'|string;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  fulfillment_status: FulfillmentStatus;
  subtotal?: number;
  shipping_charge?: number;
  installation_total?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  refunded_amount?: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  tracking_number?: string | null;
  courier_name?: string | null;
  estimated_delivery_date?: string | null;
  refund_status?: string | null;
  coupon_code?: string | null;
  confirmed_at?: IsoDateString | null;
  shipped_at?: IsoDateString | null;
  delivered_at?: IsoDateString | null;
  cancelled_at?: IsoDateString | null;
  shipping_address_data?: ShippingAddressData | null;
  items?: NativeOrderItem[];
  fulfillment_job?: ApiRecord | null;
  ordered_at: IsoDateString;
  created_at?: IsoDateString;
  updated_at?: IsoDateString;
  post_purchase?: OrderPostPurchaseCapabilities;
}


export interface NativeOrderTracking extends ApiRecord {
  order_number: string;
  status: string;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  courier_name?: string | null;
  estimated_delivery_date?: string | null;
}

export interface NativeRefund extends ApiRecord {
  id: Id;
  order_id: Id;
  refund_type?: string;
  amount: number;
  reason?: string | null;
  status: string;
  razorpay_refund_id?: string | null;
  provider_status?: string | null;
  last_error?: string | null;
  requested_at?: IsoDateString;
  processed_at?: IsoDateString | null;
}

export interface RefundRequestResult { refund: NativeRefund; idempotent: boolean; }
export interface PaymentOperationsResult { orders: NativeOrder[]; refunds: NativeRefund[]; }

export type BookingStatus='pending'|'assigned'|'confirmed'|'in_progress'|'completed'|'cancelled';
export interface NativeBooking extends ApiRecord {
  id: Id;
  user_id?: Id;
  service_id?: Id | null;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  status: BookingStatus;
  assigned_technician_id?: Id | null;
  technician_name?: string | null;
  technician_phone?: string | null;
  description?: string | null;
  exact_location?: string | null;
  custom_service_demand?: string | null;
  assignment_date?: IsoDateString | null;
  assigned_at?: IsoDateString | null;
  offer_applied?: boolean;
  subscription_benefit_used?: string | null;
  is_switch_working?: string | null;
  has_old_fan?: string | null;
  is_electricity_supply_on?: string | null;
  original_amount?: number | null;
  discount_amount?: number;
  subscription_discount?: number;
  final_amount?: number | null;
  coupon_code?: string | null;
  tracking_token?: string | null;
  idempotent?: boolean;
  created_at?: IsoDateString;
  updated_at?: IsoDateString;
}

export interface BookingQuoteInput {
  serviceId?: Id | null;
  isCustomService?: boolean;
  customServiceDemand?: string | null;
  couponCode?: string | null;
  useSubscription?: boolean;
  useFreeServiceCall?: boolean;
}
export interface BookingQuote extends ApiRecord {
  success: true;
  service_id: Id;
  service_type: string;
  original_amount: number;
  discount_amount: number;
  subscription_discount: number;
  final_amount: number;
  selected_benefit: 'coupon'|'subscription'|'none';
  coupon_code?: string | null;
  subscription_benefit_used?: string | null;
}
export interface CreateBookingInput extends BookingQuoteInput {
  requestId: Id;
  name: string; phone: string; email: string; address: string;
  exactLocation?: string | null; preferredDate: string; preferredTime: string;
  description?: string | null;
  isSwitchWorking?: string | null;
  hasOldFan?: string | null;
  isElectricitySupplyOn?: string | null;
}
export interface GuestCreateBookingInput {
  requestId: Id;
  serviceId?: Id | null;
  isCustomService?: boolean;
  name: string; phone: string; email?: string | null; address: string;
  exactLocation?: string | null; preferredDate: string; preferredTime: string;
  description?: string | null;
  customServiceDemand?: string | null;
  isSwitchWorking?: string | null;
  hasOldFan?: string | null;
  isElectricitySupplyOn?: string | null;
  website?: string;
  formTs?: number;
  captchaToken?: string | null;
}
export interface BookingOperationalUpdate {
  name?: string; phone?: string; email?: string; address?: string;
  preferredDate?: string; preferredTime?: string; description?: string | null;
  exactLocation?: string | null; customServiceDemand?: string | null;
  isSwitchWorking?: string | null; hasOldFan?: string | null; isElectricitySupplyOn?: string | null;
}

export type TechnicianStatus='active'|'busy'|'offline';
export type TechnicianApprovalStatus='pending'|'approved'|'rejected';
export interface NativeTechnician extends ApiRecord {
  id: Id;
  user_id?: Id | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  skills?: string[];
  experience?: number;
  daily_limit?: number;
  priority?: number;
  status?: TechnicianStatus;
  approval_status?: TechnicianApprovalStatus;
  profile_url?: string | null;
  today_count?: number;
}
export interface TechnicianCreateInput {
  name:string; email:string; password:string; phone?:string|null; address?:string|null;
  skills?:string[]; experience?:number; dailyLimit?:number; priority?:number;
  status?:TechnicianStatus; profileUrl?:string|null;
}
export type TechnicianUpdateInput = Partial<Omit<TechnicianCreateInput,'email'|'password'>>;
export interface TechnicianSelfUpdateInput {
  name?:string; phone?:string; address?:string; skills?:string[]; experience?:number; dailyLimit?:number; status?:TechnicianStatus; profileUrl?:string|null;
}
export interface TechnicianApplicationInput {
  name:string; email:string; phone?:string|null; address?:string|null; skills?:string[]; experience?:number; profileUrl?:string|null;
}
export interface TechnicianDashboard extends ApiRecord {
  id: Id; name: string; status: TechnicianStatus; approval_status: TechnicianApprovalStatus; daily_limit: number;
  total_count: number; pending_count: number; completed_count: number; today_count: number;
}
export interface TechnicianApplicationStatus extends NativeTechnician {}

export interface NativeReturnItem extends ApiRecord {
  id: Id; return_id?: Id; order_item_id: Id; product_id?: Id | null; quantity: number;
  accepted_quantity?: number; restocked_quantity?: number; resolution?: 'refund'|'replacement'|string;
  unit_refund_amount?: number;
}
export interface NativeReturn extends ApiRecord {
  id: Id; order_id: Id; order_number?: string; status: string; return_type?: 'return'|'replacement'|'rto'|string; resolution?: 'refund'|'replacement'|string;
  reason?: string | null; requested_at?: IsoDateString; approved_at?: IsoDateString|null; received_at?: IsoDateString|null;
  inspected_at?: IsoDateString|null; completed_at?: IsoDateString|null; items?: NativeReturnItem[]; created_at?: IsoDateString; updated_at?: IsoDateString;
}
export interface NativeOrderLifecycle {
  order: NativeOrder; refunds: NativeRefund[]; returns: NativeReturn[]; capabilities: OrderPostPurchaseCapabilities;
}

export interface NativeNotification extends ApiRecord {
  id: Id; user_id: Id; type: string; title: string; message: string;
  is_read: boolean; read_at: IsoDateString|null; booking_id: Id|null; order_id: Id|null; return_id?: Id|null;
  metadata: ApiRecord; email_sent?: boolean; email_sent_at?: IsoDateString|null; is_pushed?: boolean; pushed_at?: IsoDateString|null;
  created_at: IsoDateString; updated_at?: IsoDateString;
}
export interface NotificationPreferences extends ApiRecord {
  id?: Id; user_id?: Id;
  in_app_notifications: boolean; push_notifications: boolean; email_notifications: boolean;
  order_updates: boolean; payment_updates: boolean; shipping_updates: boolean;
  refund_updates: boolean; return_updates: boolean; booking_updates: boolean;
  created_at?: IsoDateString; updated_at?: IsoDateString;
}
export interface NotificationCreateInput { eventType:string; title:string; message:string; channels?:Array<'in_app'|'push'|'email'>; metadata?:ApiRecord; }
export interface AdminNotificationInput extends NotificationCreateInput { userId:Id; }
export interface NotificationOutboxItem extends ApiRecord {
  id:Id; user_id:Id; email?:string|null; event_key:string; event_type:string; title:string; message:string;
  status:'pending'|'processing'|'retry'|'sent'|'suppressed'|'failed'|'partial'|string;
  attempt_count:number; max_attempts:number; requested_channels:string[]; delivered_channels:string[]; suppressed_channels:string[];
  last_error:string|null; next_attempt_at?:IsoDateString; completed_at?:IsoDateString|null; created_at:IsoDateString; updated_at?:IsoDateString;
}

export interface NativeCheckoutResult {
  success: true;
  idempotent: boolean;
  trackingToken: string | null;
  orderId: Id;
  orderNumber: string;
  amount: number;
  paymentMethod: 'cod'|'razorpay';
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
  quoteExpiresAt?: string | null;
  totals: { subtotal:number; installationTotal:number; shipping:number; tax:number; discount:number; total:number; };
}

export interface NativeSubscriptionPlan extends ApiRecord { id:Id; name?:string; price?:number; is_active?:boolean; }
export interface NativeSubscription extends ApiRecord { id:Id; status:string; plan_id?:Id; start_date?:string; end_date?:string; subscription_plans?:NativeSubscriptionPlan; }
export interface NativeSubscriptionBenefit extends ApiRecord { id?:Id; benefit_type?:string; amount?:number; }
export interface SubscriptionCheckoutResult extends ApiRecord { orderId?:Id; razorpayOrderId?:string; razorpayKeyId?:string; amount?:number; }
export interface SubscriptionVerifyInput { razorpay_payment_id:string; razorpay_order_id:string; razorpay_signature:string; user_subscription_id?:Id; }
export interface SubscriptionVerifyResult extends ApiRecord { verified?:boolean; subscription?:NativeSubscription; }

export interface AdminMessage extends ApiRecord { id:Id; name?:string; email?:string; phone?:string; subject?:string; message?:string; read?:boolean; created_at?:IsoDateString; }
export interface NewsletterSubscriber extends ApiRecord { id:Id; email:string; created_at?:IsoDateString; }
export interface AdminUser extends AppUser { created_at?:IsoDateString; }
export interface SiteSetting extends ApiRecord { key:string; value:string; }
export interface AdminDashboard extends ApiRecord { users?:number; orders?:number; bookings?:number; revenue?:number; }
export interface ContactSubmissionInput { name:string; email:string; phone?:string; subject?:string; message:string; }
export interface TestimonialSubmissionInput { name:string; email?:string; rating?:number; message:string; }


export interface FulfillmentJob extends ApiRecord {
  id?: Id; order_id: Id; order_number?: string; status: string; attempt_count?: number; max_attempts?: number;
  awb_code?: string | null; provider_shipment_id?: string | null; last_error?: string | null; dead_lettered_at?: IsoDateString | null;
}
export interface ReplacementShipmentJob extends ApiRecord {
  id?: Id; return_id: Id; order_id?: Id; order_number?: string; status: string; attempt_count?: number; max_attempts?: number;
  awb_code?: string | null; provider_shipment_id?: string | null; last_error?: string | null; dead_lettered_at?: IsoDateString | null;
}

export interface ShippingSettings extends ApiRecord { enabled?:boolean; provider?:string; pickup_location?:string; }
export interface ShippingOperationResult extends ApiRecord { success?:boolean; message?:string; }
export interface FulfillmentOperationsResult extends ApiRecord { orders?:FulfillmentJob[]; replacements?:ReplacementShipmentJob[]; }

export interface OpsWorkerRun extends ApiRecord {
  worker_name: string;
  status: 'running'|'succeeded'|'failed'|string;
  started_at: IsoDateString;
  finished_at?: IsoDateString | null;
  duration_ms?: number | null;
  processed_count?: number | null;
  error_message?: string | null;
}
export interface OpsWorkerLease extends ApiRecord {
  worker_name: string;
  lease_owner: string;
  lease_until: IsoDateString;
}
export interface OpsStatusSnapshot extends ApiRecord {
  workers: OpsWorkerRun[];
  failures24h: OpsWorkerRun[];
  activeLeases: OpsWorkerLease[];
  staleWorkers: string[];
}
