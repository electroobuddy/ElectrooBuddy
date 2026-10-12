import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listNativeBookings } from "@/lib/nativeBooking";
import { accountApi } from "@/lib/accountApi";
import { toast } from "sonner";
import { Loader2, Calendar, Plus, CheckCircle, AlertCircle, Clock, MapPin, ArrowRight } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Pending" },
  assigned: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "Assigned" },
  confirmed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Confirmed" },
  in_progress: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "In Progress" },
  completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Completed" },
  cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Cancelled" },
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [nativeBookings,p]=await Promise.all([listNativeBookings(),accountApi.profile()]);
        setBookings((nativeBookings||[]).slice(0,5));
        setProfile({full_name:p.fullName,phone:p.phone,address:p.address});
      } catch (err) {
        logger.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return null;

  const allBookings = bookings;
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === "pending").length,
    completed: allBookings.filter(b => b.status === "completed").length,
  };

  return (
    <div>
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}!
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Link
          to="/booking"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition self-start"
        >
          <Plus className="w-4 h-4" /> Book Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { num: stats.total, label: "Total Bookings" },
          { num: stats.pending, label: "Pending" },
          { num: stats.completed, label: "Completed" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-primary">{s.num}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Recent Bookings</h2>
        <Link to="/dashboard/bookings" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : allBookings.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground mb-1">No Bookings Yet</p>
          <p className="text-sm text-muted-foreground mb-4">Book your first electrical service to get started.</p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Book Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allBookings.map((b) => {
            const status = statusColors[b.status] || statusColors.pending;
            return (
              <div key={b.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="font-heading font-bold text-foreground text-sm">{b.service_type}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text} self-start`}>
                    {b.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.preferred_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.preferred_time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.address}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
