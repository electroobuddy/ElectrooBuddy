import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listNativeTechnicianBookings, transitionNativeTechnicianBooking } from "@/lib/nativeBooking";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Phone, Mail, Clock, CheckCircle, X, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import ApiState from "@/components/ApiState";
import MutationButton from "@/components/MutationButton";
import { nativeApiErrorMessage } from "@/lib/apiClient";
import type { NativeBooking } from "@/lib/apiContracts";

const TechnicianBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<NativeBooking[]>([]);
  const [filtered, setFiltered] = useState<NativeBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try { const bookingsData = await listNativeTechnicianBookings(); setBookings(bookingsData); setFiltered(bookingsData); setLoadError(null); }
      catch(error: unknown){ logger.error(error); setBookings([]); setFiltered([]); setLoadError(nativeApiErrorMessage(error, "Failed to load assigned bookings")); }
      setLoading(false);
    };

    fetchData();
  }, [user, refreshNonce]);

  useEffect(() => {
    let result = [...bookings];

    if (filterStatus !== "all") {
      result = result.filter(b => b.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.customer_name?.toLowerCase().includes(term) ||
        b.address?.toLowerCase().includes(term) ||
        b.phone?.toLowerCase().includes(term)
      );
    }

    setFiltered(result);
  }, [bookings, filterStatus, searchTerm]);

  const handleUpdateStatus = async (bookingId: string, newStatus: 'in_progress' | 'completed') => {
    setMutatingId(bookingId);
    try {
      const updated = await transitionNativeTechnicianBooking(bookingId, newStatus);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
      toast.success(`Booking marked as ${newStatus.replace('_', ' ')}`);
    } catch(error: unknown){ logger.error(error); toast.error(nativeApiErrorMessage(error, "Failed to update status")); }
    finally { setMutatingId(null); }
  };

  if (loading) return <div className="p-6"><ApiState loading loadingLabel="Loading assigned bookings…" /></div>;
  if (loadError) return <div className="p-6"><ApiState error={new Error(loadError)} errorTitle="Could not load assigned bookings" onRetry={() => { setLoading(true); setRefreshNonce(n => n + 1); }} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">{filtered.length} bookings found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, address, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Grid */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500">No bookings found</p>
          </div>
        ) : (
          filtered.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left: Booking Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                      booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      booking.status === 'assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                      booking.status === 'in_progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.assignment_date && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Scheduled: {new Date(booking.assignment_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-3">
                    {booking.service_type || "Service Request"}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{booking.address}</span>
                    </div>
                    {booking.phone && (
                      <a href={`tel:${booking.phone}`} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-600">
                        <Phone className="w-4 h-4" />
                        {booking.phone}
                      </a>
                    )}
                    {booking.email && (
                      <a href={`mailto:${booking.email}`} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-600">
                        <Mail className="w-4 h-4" />
                        {booking.email}
                      </a>
                    )}
                    {booking.preferred_time && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-4 h-4" />
                        Preferred: {booking.preferred_time}
                      </div>
                    )}
                  </div>

                  {booking.description && (
                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{booking.description}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 lg:w-48">
                  <button
                    onClick={() => navigate(`/technician/bookings/${booking.id}`)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold rounded-xl transition-colors"
                  >
                    View Details
                  </button>
                  {booking.status === "assigned" || booking.status === "confirmed" ? (
                    <MutationButton
                      pending={mutatingId === booking.id}
                      pendingLabel="Starting…"
                      onClick={() => handleUpdateStatus(booking.id, "in_progress")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >Start Work</MutationButton>
                  ) : booking.status === "in_progress" ? (
                    <MutationButton
                      pending={mutatingId === booking.id}
                      pendingLabel="Completing…"
                      onClick={() => handleUpdateStatus(booking.id, "completed")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >Mark Complete</MutationButton>
                  ) : (
                    <div className="text-sm text-zinc-500 text-center py-2">
                      {booking.status === "completed" ? "✓ Completed" : "Cancelled"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TechnicianBookings;
