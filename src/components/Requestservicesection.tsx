import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Check, Phone, CheckCircle, Loader2, CalendarDays,
  Tag, Award, Smile, Wrench, ChevronDown, AlertCircle, X,
  ShieldCheck, Percent, Ticket,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { BUSINESS, YEARS_OF_EXPERIENCE } from "@/data/business";
import { useServicesStore } from "@/stores/servicesStore";
import { getPublicStats } from "@/lib/nativeAdminOperations";
import { getSiteSettingsCached } from "@/lib/siteSettings";
import { sendAdminNotificationAsync } from "@/utils/notificationUtils";
import { createAuthoritativeServiceBooking } from "@/lib/serviceBooking";
import { quoteNativeBooking } from "@/lib/nativeBooking";
import type { BookingQuote } from "@/lib/apiContracts";
import {
  type BookingFormData, type FormErrors, BLANK_FORM,
  todayISOStr, maxDateISOStr, validateBookingForm,
  makeBookingHash, withTimeout, SESSION_LIMIT,
} from "@/utils/bookingUtils";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  preselectedService?: string;
  preselectedOffer?: string;
}

type FieldKey = keyof BookingFormData;

// ─── Constants ──────────────────────────────────────────────────────────────────
// Using shared constants from bookingUtils.ts

// ─── Component ──────────────────────────────────────────────────────────────────
export default function RequestServiceSection({ preselectedService, preselectedOffer }: Props) {
  const { user } = useAuth();
  const { bookingServices, fetchBookingServices } = useServicesStore();
  const { activeSubscription, benefits } = useSubscription();

  const [done, setDone]                 = useState(false);
  const [trackingToken, setTrackingToken] = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [form, setForm]                 = useState<BookingFormData>({ ...BLANK_FORM, service_type: preselectedService || "" });
  const [touched, setTouched]           = useState<Partial<Record<FieldKey, boolean>>>({});
  const [errors, setErrors]             = useState<FormErrors>({});
  const [couponCode, setCouponCode]     = useState(preselectedOffer || "");
  const [applying, setApplying]         = useState(false);
  const [applied, setApplied]           = useState<{success:boolean;discount_amount:number;message:string}|null>(null);
  const [bookingQuote, setBookingQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteRequestRef = useRef(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [dbStats, setDbStats] = useState({ clients: 0, projects: 0 });
  const [statsAvailable, setStatsAvailable] = useState(false);
  const [supportPhone, setSupportPhone] = useState("");
  const [useFreeServiceCall, setUseFreeServiceCall] = useState(false);
  const lastHashRef                     = useRef<string | null>(null);
  const controllerRef                   = useRef<AbortController | null>(null);
  const requestIdRef                    = useRef<string>(crypto.randomUUID());

  const counters = useMemo(() => ({
    experience: YEARS_OF_EXPERIENCE,
    clients: dbStats.clients,
    projects: dbStats.projects,
  }), [dbStats]);

  const todayStr  = useMemo(todayISOStr,   []);
  const maxDate   = useMemo(maxDateISOStr, []);

  useEffect(() => { fetchBookingServices(); }, [fetchBookingServices]);

  useEffect(() => {
    if (preselectedService) {
      // Try to find an exact match first, then a partial match
      const services = [...bookingServices, { title: "Custom Service" }];
      const exactMatch = services.find(s => s.title === preselectedService);
      const partialMatch = services.find(s => 
        s.title.toLowerCase().includes(preselectedService.toLowerCase()) ||
        preselectedService.toLowerCase().includes(s.title.toLowerCase())
      );
      
      // Use the matched service title, or fall back to the original value
      const matchedService = exactMatch || partialMatch;
      setForm(p => ({ ...p, service_type: matchedService?.title || preselectedService }));
    }
  }, [preselectedService, bookingServices]);

  // Re-validate whenever form changes
  useEffect(() => { setErrors(validateBookingForm(form, { requireEmail: true, requireTime: true, requireDate: true })); }, [form]);

  // Cleanup on unmount
  useEffect(() => () => { controllerRef.current?.abort(); }, []);

  // Fetch dynamic stats from bookings table
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try { const stats=await getPublicStats(); if(!mounted)return; setDbStats({clients:Number(stats.clients||0),projects:Number(stats.projects||0)}); setStatsAvailable(true); }
      catch(err){ logger.error("Failed to load stats:",err); if(mounted) setStatsAvailable(false); }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getSiteSettingsCached().then((settings) => {
      if (mounted) setSupportPhone(settings.phone_number || "");
    }).catch((err) => {
      logger.error("Failed to load public contact settings:", err);
      if (mounted) setSupportPhone("");
    });
    return () => { mounted = false; };
  }, []);

  const services = [...bookingServices, { title: "Custom Service" }];

  const quoteInputForCurrentSelection = useCallback((coupon?: string | null) => {
    const selectedService = bookingServices.find((svc) => svc.title === form.service_type);
    if (!user || (!selectedService?.id && form.service_type !== "Custom Service")) return null;
    if (form.service_type === "Custom Service" && form.custom_service_demand.trim().length < 20) return null;
    return {
      serviceId: selectedService?.id || null,
      isCustomService: form.service_type === "Custom Service",
      customServiceDemand: form.service_type === "Custom Service" ? form.custom_service_demand.trim() : null,
      couponCode: coupon?.trim().toUpperCase() || null,
      useSubscription: Boolean(activeSubscription),
      useFreeServiceCall: Boolean(useFreeServiceCall),
    };
  }, [activeSubscription, bookingServices, form.custom_service_demand, form.service_type, useFreeServiceCall, user]);

  const refreshBookingQuote = useCallback(async (coupon?: string | null, showError = false) => {
    const input = quoteInputForCurrentSelection(coupon);
    if (!input) { setBookingQuote(null); setQuoteError(null); return null; }
    const requestId = ++quoteRequestRef.current;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const quote = await withTimeout(quoteNativeBooking(input), 8_000, "booking-quote");
      if (requestId === quoteRequestRef.current) setBookingQuote(quote);
      return quote;
    } catch (error: any) {
      if (requestId === quoteRequestRef.current) {
        const message = error?.message?.startsWith("TIMEOUT") ? "Price quote timed out. Please retry." : (error?.message || "Unable to calculate the current price.");
        setBookingQuote(null);
        setQuoteError(message);
        if (showError) toast.error(message);
      }
      return null;
    } finally {
      if (requestId === quoteRequestRef.current) setQuoteLoading(false);
    }
  }, [quoteInputForCurrentSelection]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshBookingQuote(applied?.success ? couponCode : null); }, 180);
    return () => window.clearTimeout(timer);
  }, [applied?.success, couponCode, refreshBookingQuote]);

  const base = Number(bookingQuote?.original_amount || 0);
  const couponDiscount = Number(bookingQuote?.discount_amount || 0);
  const subscriptionDiscount = Number(bookingQuote?.subscription_discount || 0);
  const subscriptionBenefitUsed = bookingQuote?.subscription_benefit_used || null;
  const final = Number(bookingQuote?.final_amount || 0);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const touch = (f: FieldKey) => setTouched(t => ({ ...t, [f]: true }));

  const visibleError = (f: FieldKey) => (touched[f] ? errors[f] : undefined);

  /** Generic onChange for most fields */
  const set = (f: FieldKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }));

  // ── Coupon ──────────────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error("Enter a coupon code"); return; }
    if (!user) { toast.error("Please login to apply a coupon"); return; }
    const selectedService = bookingServices.find((svc) => svc.title === form.service_type);
    if (!selectedService?.id) { toast.error("Select a service first"); return; }
    setApplying(true);
    const tid = toast.loading("Validating coupon…");
    try {
      const q = await refreshBookingQuote(couponCode.toUpperCase().trim(), true);
      if (q?.selected_benefit === "coupon" && Number(q.discount_amount || 0) > 0) {
        const r = { success:true, discount_amount:Number(q.discount_amount), message:"Coupon applied" };
        setApplied(r); toast.success(`Coupon applied! ₹${r.discount_amount.toFixed(2)} off`, { id: tid });
      } else if (q?.selected_benefit === "subscription") {
        setApplied(null); toast.info("Your subscription benefit gives the better price, so this coupon was not applied.", { id: tid });
      } else { toast.error("Invalid coupon code", { id: tid }); setApplied(null); }
    } catch (e: any) {
      toast.error(e?.message?.startsWith("TIMEOUT") ? "Coupon validation timed out" : (e?.message||"Failed to apply coupon"), { id: tid }); setApplied(null);
    } finally { setApplying(false); }
  };

  const removeCoupon = () => { setCouponCode(""); setApplied(null); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!user) { toast.error("Please sign in before booking a service."); return; }

    // Touch all → reveal every error
    setTouched(Object.fromEntries(Object.keys(BLANK_FORM).map(k => [k, true])) as any);
    const errs = validateBookingForm(form, { requireEmail: true, requireTime: true, requireDate: true });

    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the errors highlighted below.");
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Session rate limit
    if (sessionCount >= SESSION_LIMIT) {
      toast.error(`Max ${SESSION_LIMIT} submissions per session. Please call us directly.`);
      return;
    }

    // Duplicate guard — same phone + service + date
    const hash = makeBookingHash(form.phone.trim(), form.service_type, form.preferred_date);
    if (lastHashRef.current === hash) {
      toast.warning("This request looks like a duplicate. Check your previous submission.");
      return;
    }

    const latestQuote = await refreshBookingQuote(applied?.success ? couponCode : null, true);
    if (!latestQuote) return;

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    setSubmitting(true);
    const tid = toast.loading("Submitting your request…");

    try {
      const selectedService = bookingServices.find((svc) => svc.title === form.service_type);
      if (!selectedService?.id && form.service_type !== "Custom Service") throw new Error("Please select a valid service");
      const booking = await withTimeout(
        createAuthoritativeServiceBooking(form, {
          serviceId: selectedService?.id || "",
          couponCode: applied?.success ? couponCode : undefined,
          useSubscription: Boolean(activeSubscription),
          useFreeServiceCall: Boolean(useFreeServiceCall),
          requestId: requestIdRef.current,
        }),
        12000,
        "booking-create"
      );

      lastHashRef.current = hash;
      setSessionCount(c => c + 1);

      // ── Background tasks — never block user ───────────────────────────────
      Promise.allSettled([

        withTimeout(
          sendAdminNotificationAsync(
            {
              title:        "🔔 New Service Request",
              message:      `New booking from ${form.name.trim()} for ${form.service_type}` +
                            (form.preferred_date ? ` on ${form.preferred_date}` : ""),
              type:         "new_booking",
              bookingId:    booking.id,
              customerName: form.name.trim(),
              service:      form.service_type,
              metadata: {
                customer_name:  form.name.trim(),
                customer_phone: form.phone.trim(),
                customer_email: form.email.trim(),
                service_type:   form.service_type,
                preferred_date: form.preferred_date,
                preferred_time: form.preferred_time,
                address:        form.address.trim(),
                exact_location: form.exact_location.trim(),
                is_guest:       !user,
              },
            },
            user
          ),
          8_000, "admin-notify"
        ).catch(() => {}),
      ]);

      // ── Immediate success ─────────────────────────────────────────────────
      toast.success("Request submitted! We'll contact you soon.", { id: tid, duration: 5000 });
      setTrackingToken(booking.tracking_token || "");
      setDone(true);
      requestIdRef.current = crypto.randomUUID();
      setForm({ ...BLANK_FORM, service_type: preselectedService || "" });
      setTouched({});
      setCouponCode("");
      setApplied(null);

    } catch (err: any) {
      const isTimeout = err?.message?.includes("TIMEOUT");
      const isDupe    = err?.code === "23505"; // Postgres unique_violation
      const isNetwork = err?.message?.includes("fetch") || err?.message?.includes("network");
      toast.error(
        isDupe    ? "This booking already exists. Please check your submissions." :
        isTimeout ? "Request timed out. Your booking may have been saved - please check before retrying." :
        isNetwork ? "Connection issue. Please check your internet and try again." :
                    err?.message || "Failed to submit. Please try again.",
        { id: tid, duration: 7000 }
      );
    } finally {
      setSubmitting(false);
    }
  }, [form, submitting, couponCode, applied, user, sessionCount, activeSubscription, useFreeServiceCall, bookingServices, refreshBookingQuote, preselectedService]);

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sideStats = [
    { label: "Years Exp.",    value: `${counters.experience}+`, icon: Award },
    { label: "Happy Clients", value: statsAvailable ? counters.clients.toLocaleString() : "—", icon: Smile },
    { label: "Jobs Done",     value: statsAvailable ? counters.projects.toLocaleString() : "—", icon: Wrench },
  ];

  return (
    <section
      id="request-service"
      className="py-16 md:py-20 bg-white dark:bg-gray-800"
      style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Request a Service
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mb-6" />
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Fill out the form below and we'll contact you shortly to schedule your appointment.
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-3">

            {/* ── Sidebar ── */}
            <div className="bg-blue-600 dark:bg-blue-700 p-8 lg:p-10 flex flex-col justify-between gap-8">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-snug">
                  Why Choose<br />ElectrooBuddy?
                </h3>
                <ul className="space-y-4">
                  {[
                    `${YEARS_OF_EXPERIENCE}+ years of trusted service`,
                    "Certified & experienced technicians",
                    `Quick response — avg. 45 minutes`,
                    "Affordable pricing, no hidden charges",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-white/90 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {sideStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center border border-white/15">
                    <div className="text-xl font-bold text-white">{value}</div>
                    <Icon size={14} className="mx-auto mt-1 text-white/70" />
                    <div className="text-[10px] text-white/70 mt-1 leading-tight">{label}</div>
                  </div>
                ))}
              </div>

              {/* Business hours notice */}
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs text-white/80 space-y-1">
                <div className="font-semibold text-white text-sm mb-1">🕐 24/7 Available</div>
                <div>We're always ready to help</div>
                <div className="text-white/60">Select a future time for same-day bookings</div>
              </div>

              {/* Emergency call */}
              {supportPhone && (
                <a
                  href={`tel:${supportPhone}`}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition border border-white/25 rounded-xl px-4 py-3 group"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition">
                    <Phone size={16} color="#fff" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Emergency Line</div>
                    <div className="text-sm font-semibold text-white">{supportPhone}</div>
                  </div>
                </a>
              )}
            </div>

            {/* ── Form panel ── */}
            <div className="lg:col-span-2 p-6 sm:p-8 lg:p-10 bg-white dark:bg-gray-900">

              {/* Rate-limit warning */}
              {sessionCount === SESSION_LIMIT - 1 && (
                <div className="mb-5 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  You have 1 submission remaining this session.
                </div>
              )}

              {done ? (
                /* ── Success state ── */
                <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-5">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted!</h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                      We'll contact you shortly to confirm your appointment.
                      {supportPhone ? (<>Need faster help? Call us at{" "}<a href={`tel:${supportPhone}`} className="text-blue-600 dark:text-blue-400 font-semibold underline">{supportPhone}</a></>) : "We will contact you using the details you submitted."}.
                    </p>
                  </div>
                  {trackingToken && <div className="mb-4 p-3 rounded-lg bg-muted text-left"><p className="text-xs font-semibold text-muted-foreground mb-1">Secure tracking code</p><code className="text-xs break-all select-all">{trackingToken}</code><p className="text-xs text-muted-foreground mt-1">Save this code to track the booking without signing in.</p></div>}
                  {sessionCount < SESSION_LIMIT && (
                    <button
                      onClick={() => setDone(false)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Submit Another Request
                    </button>
                  )}
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                  {/* Row 1 — Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="field-name" label="Full Name" required error={visibleError("name")}>
                      <input
                        id="inp-name"
                        className={inp(visibleError("name"))}
                        type="text"
                        autoComplete="name"
                        placeholder="Rahul Sharma"
                        maxLength={80}
                        value={form.name}
                        onChange={set("name")}
                        onBlur={() => touch("name")}
                      />
                    </Field>

                    <Field id="field-phone" label="Phone Number" required error={visibleError("phone")}>
                      <input
                        id="inp-phone"
                        className={inp(visibleError("phone"))}
                        type="tel"
                        autoComplete="tel"
                        placeholder="9876543210"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        onBlur={() => touch("phone")}
                      />
                    </Field>
                  </div>

                  {/* Row 2 — Email + Service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="field-email" label="Email Address" error={visibleError("email")} hint="Optional">
                      <input
                        id="inp-email"
                        className={inp(visibleError("email"))}
                        type="email"
                        autoComplete="email"
                        placeholder="rahul@email.com"
                        value={form.email}
                        onChange={set("email")}
                        onBlur={() => touch("email")}
                      />
                    </Field>

                    <Field id="field-service_type" label="Service Needed" required error={visibleError("service_type")}>
                      <div className="relative">
                        <select
                          id="inp-service_type"
                          className={inp(visibleError("service_type")) + " appearance-none pr-9"}
                          value={form.service_type}
                          onChange={set("service_type")}
                          onBlur={() => touch("service_type")}
                        >
                          <option value="">Select a service</option>
                          {services.map(s => (
                            <option key={s.title} value={s.title}>{s.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </Field>
                  </div>

                  {/* Custom Service — Additional Details */}
                  {form.service_type === "Custom Service" && (
                    <div className="mt-4">
                      <Field
                        id="field-custom_service_demand"
                        label="Describe Your Custom Requirement"
                        required
                        error={visibleError("custom_service_demand")}
                        hint="Min. 20 characters"
                      >
                        <div className="relative">
                          <textarea
                            id="inp-custom_service_demand"
                            className={inp(visibleError("custom_service_demand"))}
                            rows={4}
                            style={{ resize: "vertical" }}
                            maxLength={1000}
                            placeholder="Please describe the specific electrical work you need done..."
                            value={form.custom_service_demand}
                            onChange={(e) => setForm(p => ({ ...p, custom_service_demand: e.target.value }))}
                            onBlur={() => touch("custom_service_demand")}
                          />
                          <span className="absolute bottom-2 right-3 text-[10px] text-gray-400 pointer-events-none">
                            {form.custom_service_demand.length}/1000
                          </span>
                        </div>
                      </Field>
                    </div>
                  )}

                  {/* Fan Installation — Conditional Questions */}
                  {form.service_type === "Fan Installation" && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                        <Wrench size={16} />
                        Fan Installation Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field
                          id="field-is_switch_working"
                          label="Is switch working?"
                          required
                          error={visibleError("is_switch_working")}
                        >
                          <select
                            id="inp-is_switch_working"
                            className={inp(visibleError("is_switch_working")) + " appearance-none"}
                            value={form.is_switch_working}
                            onChange={(e) => setForm(p => ({ ...p, is_switch_working: e.target.value }))}
                            onBlur={() => touch("is_switch_working")}
                          >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not_sure">Not Sure</option>
                          </select>
                        </Field>

                        <Field
                          id="field-has_old_fan"
                          label="Has old fan?"
                          required
                          error={visibleError("has_old_fan")}
                        >
                          <select
                            id="inp-has_old_fan"
                            className={inp(visibleError("has_old_fan")) + " appearance-none"}
                            value={form.has_old_fan}
                            onChange={(e) => setForm(p => ({ ...p, has_old_fan: e.target.value }))}
                            onBlur={() => touch("has_old_fan")}
                          >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </Field>

                        <Field
                          id="field-is_electricity_supply_on"
                          label="Electricity supply on?"
                          required
                          error={visibleError("is_electricity_supply_on")}
                        >
                          <select
                            id="inp-is_electricity_supply_on"
                            className={inp(visibleError("is_electricity_supply_on")) + " appearance-none"}
                            value={form.is_electricity_supply_on}
                            onChange={(e) => setForm(p => ({ ...p, is_electricity_supply_on: e.target.value }))}
                            onBlur={() => touch("is_electricity_supply_on")}
                          >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* Subscription Benefits */}
                  {activeSubscription && benefits && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Subscription Benefits Active
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        Plan: {activeSubscription.subscription_plans?.name}
                      </p>

                      {benefits.serviceCallsRemaining > 0 && (
                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-blue-900/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mb-3">
                          <input
                            type="checkbox"
                            checked={useFreeServiceCall}
                            onChange={(e) => setUseFreeServiceCall(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Use Free Service Call
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {benefits.serviceCallsRemaining} of {benefits.serviceCallsTotal} remaining
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                            -₹{base.toFixed(2)}
                          </span>
                        </label>
                      )}

                      {benefits.partsDiscountPercent > 0 && (
                        <div className={`p-3 bg-white dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-blue-900/30 ${useFreeServiceCall ? "opacity-50" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {benefits.partsDiscountPercent}% discount on parts
                            </span>
                            {!useFreeServiceCall && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                                AUTO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {useFreeServiceCall
                              ? "Disabled — free service call is active"
                              : "Applied automatically to parts charges"
                            }
                          </p>
                        </div>
                      )}

                      {benefits.serviceCallsRemaining === 0 && benefits.partsDiscountPercent === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No benefits available for this booking.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Row 3 — Coupon + Discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Coupon Code">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            className={inp() + " pl-8 pr-7"}
                            type="text"
                            placeholder="OFFER CODE"
                            value={couponCode}
                            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setApplied(null); }}
                          />
                          {couponCode && (
                            <button type="button" onClick={removeCoupon}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                              title="Clear coupon"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={applying || !couponCode.trim() || !!applied?.success}
                          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition"
                        >
                          {applying ? <Loader2 size={13} className="animate-spin" /> : applied?.success ? <Check size={13} /> : null}
                          {applied?.success ? "Applied" : "Apply"}
                        </button>
                      </div>
                      {applied?.success && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <Check size={12} /> ₹{applied.discount_amount?.toFixed(2)} off applied
                        </p>
                      )}
                    </Field>

                    <Field label="">
                      {bookingQuote && (couponDiscount + subscriptionDiscount) > 0 ? (
                        <div className="h-full flex flex-col justify-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Original</span><span className="line-through">₹{base.toFixed(2)}</span>
                          </div>
                          {couponDiscount > 0 && (
                            <div className="flex justify-between text-xs font-semibold text-green-600 dark:text-green-400">
                              <span>Coupon Discount</span><span>−₹{couponDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {subscriptionDiscount > 0 && (
                            <div className="flex justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                              <span>Subscription ({subscriptionBenefitUsed === "service_call" ? "Free Service Call" : `${benefits?.parts_discount_percent || benefits?.partsDiscountPercent}% Parts Discount`})</span>
                              <span>−₹{subscriptionDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-green-200 dark:border-green-700 pt-1.5 flex justify-between text-sm font-bold text-green-700 dark:text-green-300">
                            <span>Final Amount</span><span>₹{final.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-600 italic">
                          {quoteLoading ? "Calculating server price…" : quoteError ? <button type="button" onClick={() => void refreshBookingQuote(applied?.success ? couponCode : null, true)} className="text-red-500 underline">Retry price quote</button> : bookingQuote ? `Current amount: ₹${bookingQuote.final_amount.toFixed(2)}` : "Select a service to see pricing"}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Row 4 — Address + Landmark */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="field-address" label="Service Address" required error={visibleError("address")}>
                      <input
                        id="inp-address"
                        className={inp(visibleError("address"))}
                        type="text"
                        autoComplete="street-address"
                        placeholder="123 Main St, City"
                        maxLength={300}
                        value={form.address}
                        onChange={set("address")}
                        onBlur={() => touch("address")}
                      />
                    </Field>
                    <Field label="Landmark / Location" hint="Optional">
                      <input
                        className={inp()}
                        type="text"
                        placeholder="Near temple, behind mall…"
                        maxLength={200}
                        value={form.exact_location}
                        onChange={set("exact_location")}
                      />
                    </Field>
                  </div>

                  {/* Row 5 — Date + Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      id="field-preferred_date"
                      label="Preferred Date"
                      error={visibleError("preferred_date")}
                      hint="Optional · No past dates"
                    >
                      <input
                        id="inp-preferred_date"
                        className={inp(visibleError("preferred_date"))}
                        type="date"
                        min={todayStr}
                        max={maxDate}
                        value={form.preferred_date}
                        onChange={set("preferred_date")}
                        onBlur={() => touch("preferred_date")}
                      />
                    </Field>
                    <Field
                      id="field-preferred_time"
                      label="Preferred Time"
                      error={visibleError("preferred_time")}
                      hint="24/7 Available"
                    >
                      <input
                        id="inp-preferred_time"
                        className={inp(visibleError("preferred_time"))}
                        type="time"
                        value={form.preferred_time}
                        onChange={set("preferred_time")}
                        onBlur={() => touch("preferred_time")}
                      />
                    </Field>
                  </div>

                  {/* Description — Additional Details (Optional) */}
                  <Field
                    id="field-description"
                    label="Additional Details"
                    error={visibleError("description")}
                    hint="Optional"
                  >
                    <div className="relative">
                      <textarea
                        id="inp-description"
                        className={inp(visibleError("description"))}
                        rows={3}
                        style={{ resize: "vertical" }}
                        maxLength={500}
                        placeholder="Any additional information about your service request..."
                        value={form.description}
                        onChange={set("description")}
                        onBlur={() => touch("description")}
                      />
                    </div>
                  </Field>

                  {/* Submit */}
                  <div className="pt-1 space-y-3">
                    <button
                      type="submit"
                      disabled={submitting || sessionCount >= SESSION_LIMIT}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {submitting
                        ? <><Loader2 size={17} className="animate-spin" /> Submitting…</>
                        : <><CalendarDays size={17} /> Request Service</>}
                    </button>

                    {sessionCount >= SESSION_LIMIT ? (
                      <p className="text-center text-xs text-red-500 dark:text-red-400">
                        {supportPhone ? (<>Session limit reached. Please call <a href={`tel:${supportPhone}`} className="underline font-semibold">{supportPhone}</a>.</>) : "Session limit reached. Please try again later."}
                      </p>
                    ) : (
                      <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
                        By submitting, you agree to be contacted regarding your service request.
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Trust strip ── */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { emoji: "⚡", label: "Fast Response",     sub: "Avg. 45 minutes" },
            { emoji: "🛡️", label: "Certified Techs",   sub: "Trained & verified" },
            { emoji: "💰", label: "No Hidden Charges", sub: "Transparent pricing" },
            { emoji: "📞", label: "Emergency",          sub: supportPhone || "Contact via form" },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="bg-blue-50 dark:bg-gray-700 rounded-xl p-4 border border-blue-100 dark:border-gray-600">
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Input class — error-aware ────────────────────────────────────────────────
const inp = (error?: string) =>
  "w-full border rounded-md shadow-sm py-2.5 px-3 text-sm " +
  "text-gray-900 dark:text-white bg-white dark:bg-gray-800 " +
  "focus:outline-none focus:ring-2 transition duration-150 " +
  "placeholder-gray-400 dark:placeholder-gray-500 font-[Poppins,sans-serif] " +
  (error
    ? "border-red-400 dark:border-red-500 focus:ring-red-300 focus:border-red-400 bg-red-50/50 dark:bg-red-900/10"
    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500");

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id?: string;
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5" id={id}>
      {label !== "" && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id ? id.replace("field-", "inp-") : undefined}
            className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {hint && !error && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">{hint}</span>
          )}
        </div>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-medium mt-0.5 leading-snug">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}