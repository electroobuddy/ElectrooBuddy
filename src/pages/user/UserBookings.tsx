import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listNativeBookings, cancelNativeBooking } from "@/lib/nativeBooking";
import { toast } from "sonner";
import type { BookingStatus, NativeBooking } from "@/lib/apiContracts";
import { Loader2, Calendar, Clock, MapPin, Plus, CheckCircle, AlertCircle, FileText, Phone, Tag, ShieldCheck, Percent, Ticket } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Pending" },
  assigned: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "Assigned" },
  confirmed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Confirmed" },
  in_progress: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "In Progress" },
  completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Completed" },
  cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Cancelled" },
};

const UserBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<NativeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | BookingStatus>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const loadBookings = useCallback(async () => {
    if (!user) { setBookings([]); setLoading(false); return; }
    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listNativeBookings(filter || undefined);
      if (requestId === requestRef.current) setBookings(data);
    } catch(error:any) {
      if (requestId === requestRef.current) {
        const message = error?.message || "Failed to load bookings";
        setLoadError(message);
        setBookings([]);
      }
    } finally { if (requestId === requestRef.current) setLoading(false); }
  }, [filter, user]);

  useEffect(() => { void loadBookings(); return () => { requestRef.current += 1; }; }, [loadBookings]);

  const cancelBooking = async (id: string) => {
    if (!window.confirm("Cancel this service booking?")) return;
    try {
      await cancelNativeBooking(id);
      await loadBookings();
      toast.success("Booking cancelled");
    } catch (error: any) {
      toast.error(error?.message || "This booking can no longer be cancelled online.");
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground">View and track all your service bookings</p>
        </div>
        <button
          onClick={() => navigate("/booking")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition self-start"
        >
          <Plus className="w-4 h-4" /> Book Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { num: stats.total, label: "Total" },
          { num: stats.pending, label: "Pending" },
          { num: stats.completed, label: "Completed" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-primary">{s.num}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "pending", "confirmed", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as "" | BookingStatus)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground mb-1">Could not load bookings</p>
          <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
          <button onClick={() => void loadBookings()} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Retry</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground mb-1">No Bookings Found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {filter ? "No bookings match this filter." : "Book your first service to get started."}
          </p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Book Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = statusColors[b.status] || statusColors.pending;
            return (
              <div key={b.id} role="button" tabIndex={0} onClick={() => navigate(`/dashboard/bookings/${b.id}`)} onKeyDown={e => e.key === "Enter" && navigate(`/dashboard/bookings/${b.id}`)} className="w-full text-left bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/20 transition cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <h3 className="font-heading font-bold text-foreground">{b.service_type}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text} self-start`}>
                    {b.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {new Date(b.preferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {b.preferred_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{b.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {b.phone}
                  </div>
                </div>
                {b.description && (
                  <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground/70">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{b.description}</p>
                  </div>
                )}
                {/* Subscription Benefit Used */}
                {b.subscription_benefit_used && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        Subscription Benefit Used
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {b.subscription_benefit_used === "service_call" ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
                          <Ticket className="w-3 h-3" /> Free Service Call
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
                          <Percent className="w-3 h-3" /> Parts Discount
                        </span>
                      )}
                      {b.subscription_discount > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          -₹{b.subscription_discount}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Offer/Coupon Details */}
                {b.offer_applied && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">{b.coupon_code || 'Offer Applied'}</span>
                    </div>
                    {(b.original_amount || b.final_amount) && (
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500 line-through">₹{b.original_amount}</span>
                        <span className="text-green-600 font-semibold">-₹{b.discount_amount}</span>
                        <span className="text-green-700 font-bold">₹{b.final_amount}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Combined Price Summary */}
                {b.subscription_benefit_used && (b.original_amount || b.final_amount) && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Service Charge</span>
                      <span className="text-zinc-500 line-through">₹{b.original_amount}</span>
                    </div>
                    {b.subscription_discount > 0 && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-blue-600">Subscription Discount</span>
                        <span className="text-blue-600 font-semibold">-₹{b.subscription_discount}</span>
                      </div>
                    )}
                    {b.discount_amount > 0 && b.discount_amount !== b.subscription_discount && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-green-600">Coupon Discount</span>
                        <span className="text-green-600 font-semibold">-₹{b.discount_amount}</span>
                      </div>
                    )}
                    <div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">Final Amount</span>
                      <span className="text-sm font-bold text-green-600">₹{b.final_amount}</span>
                    </div>
                  </div>
                )}
                {["pending","assigned","confirmed"].includes(b.status) && (
                  <button onClick={(e) => { e.stopPropagation(); cancelBooking(b.id); }}
                    className="mt-3 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">
                    Cancel Booking
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
