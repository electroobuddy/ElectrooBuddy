import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getNativeTechnicianDashboard, getNativeTechnicianProfile } from "@/lib/nativeTechnician";
import { listNativeTechnicianBookings } from "@/lib/nativeBooking";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle, Clock, MapPin, Phone, Mail, Wrench, TrendingUp, Star, User } from "lucide-react";
import { toast } from "sonner";
import type { NativeBooking, NativeTechnician } from "@/lib/apiContracts";

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, today: 0 });
  const [recentBookings, setRecentBookings] = useState<NativeBooking[]>([]);
  const [technician, setTechnician] = useState<NativeTechnician | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        let tech:NativeTechnician;
        try { tech = await getNativeTechnicianProfile(); } catch { setHasProfile(false); return; }
        setHasProfile(true); setTechnician(tech);
        const dashboard = await getNativeTechnicianDashboard();
        setStats({ total:Number(dashboard.total_count||0), pending:Number(dashboard.pending_count||0), completed:Number(dashboard.completed_count||0), today:Number(dashboard.today_count||0) });
        const bookings = await listNativeTechnicianBookings();
        setRecentBookings((bookings||[]).slice(0,5));
      } catch (error) {
        logger.error(error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  // Show incomplete profile banner
  if (!hasProfile) {
    return (
      <div className="p-6 space-y-6">
        {/* Incomplete Profile Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">⚠️ Profile Incomplete</h2>
              <p className="text-orange-100 mb-4">
                You haven't completed your technician profile yet. Please add your skills, experience, and service details to start receiving bookings.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/technician/profile"
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Complete Profile Now
                </Link>
                <Link
                  to="/technician/signup"
                  className="inline-flex items-center gap-2 bg-orange-700/50 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Use Signup Form
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Limited Dashboard Preview */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Why Complete Your Profile?</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Receive booking assignments from customers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Showcase your skills and expertise</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Set your availability and daily limits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Build trust with potential customers</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-3">Need Help?</h3>
            <p className="text-blue-100 mb-4">
              Our support team is here to help you get started.
            </p>
            <a href="mailto:support@electroobuddy.com" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-semibold transition-colors">
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Welcome back, {technician?.name}!</p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
          technician?.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
          technician?.status === 'busy' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
          'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            technician?.status === 'active' ? 'bg-emerald-500' :
            technician?.status === 'busy' ? 'bg-orange-500' : 'bg-zinc-500'
          }`} />
          <span className="text-sm font-semibold capitalize">{technician?.status}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: CalendarDays, color: "blue" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "orange" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "emerald" },
          { label: "Today", value: stats.today, icon: TrendingUp, color: "purple" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-950/30 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Recent Bookings</h2>
          <Link to="/technician/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No bookings yet</div>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                        booking.status === 'assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.assignment_date && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(booking.assignment_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">{booking.service_type || "Service Request"}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.address}
                      </span>
                      {booking.phone && (
                        <a href={`tel:${booking.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Phone className="w-3.5 h-3.5" />
                          {booking.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5" />
            <h3 className="font-bold">Contact Support</h3>
          </div>
          <p className="text-sm text-blue-100 mb-4">Need help? Reach out to admin support.</p>
          <a href="mailto:support@electroobuddy.com" className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
            Email Support
          </a>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5" />
            <h3 className="font-bold">Your Skills</h3>
          </div>
          <p className="text-sm text-emerald-100 mb-4">
            {technician?.skills?.length > 0 ? technician.skills.join(", ") : "No skills listed"}
          </p>
          <Link to="/technician/profile" className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
