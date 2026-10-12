import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { listNativeAdminUsers, listNativeAdminUserBookings } from "@/lib/nativeAdminOperations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Shield, User, Phone, MapPin, X,
  Calendar, Loader2, Grid, List, RefreshCw, Mail,
  ChevronRight, Package, Clock, CheckCircle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";


interface UserProfile {
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  created_at: string;
  email?: string;
  role?: string;
  booking_name?: string;
}

interface Booking {
  id: string;
  created_at: string;
  service: string;
  status: string;
  phone: string;
  address: string;
  preferred_date: string;
  preferred_time: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  "in-progress": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [roleFilter, setRoleFilter] = useState("all");
  const refetch = async () => { try { setUsers(await listNativeAdminUsers()); } catch (error) { logger.error("Failed to load users:", error); toast.error("Failed to load users"); } finally { setLoading(false); } };

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => { void refetch(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (u.full_name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q) ||
      ((u as any).booking_name || "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.filter(u => u.role !== "admin").length;

  const displayName = (u: UserProfile) => u.full_name || (u as any).booking_name || "Unnamed User";

  const avatarColors = [
    "from-blue-400 to-blue-600",
    "from-violet-400 to-violet-600",
    "from-emerald-400 to-emerald-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];
  const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];

  const openUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    setBookingsLoading(true);
    try {
      setUserBookings(await listNativeAdminUserBookings(user.user_id));
    } catch (err) {
      logger.error("Failed to load bookings:", err);
      setUserBookings([]);
    }
    setBookingsLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users size={22} className="text-blue-500" /> Users
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{users.length} registered users</p>
        </div>
        <button onClick={async () => {
          setRefreshing(true);
          await refetch();
          setRefreshing(false);
        }} disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-60">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: <Users size={18} />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800" },
          { label: "Admins",      value: adminCount,   icon: <Shield size={18} />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800" },
          { label: "Customers",   value: userCount,    icon: <User size={18} />,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm ${stat.border}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or user ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
          {(["list", "grid"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`p-2.5 transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
              {mode === "list" ? <List size={16} /> : <Grid size={16} />}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-zinc-400">
          <Users size={44} strokeWidth={1.5} />
          <p className="font-medium text-zinc-600 dark:text-zinc-300">No users found</p>
          <p className="text-sm">Try a different search or filter</p>
        </div>
      ) : viewMode === "list" ? (
        /* ── List table ── */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((u: any) => (
                  <tr key={u.user_id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.user_id)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-white font-bold text-sm">{displayName(u)[0]?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{displayName(u)}</p>
                          <p className="text-xs text-zinc-400 font-mono truncate max-w-[160px]">{u.user_id.slice(0, 12)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5 truncate max-w-[200px]">
                        {u.email ? <><Mail size={12} className="text-zinc-400 flex-shrink-0" />{u.email}</> : <span className="text-zinc-300">—</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                        {u.phone ? <><Phone size={12} className="text-zinc-400" />{u.phone}</> : <span className="text-zinc-300">—</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800">
                          <Shield size={10} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                          <User size={10} /> User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => openUserDetail(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                        View <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Grid cards ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((u: any) => (
            <motion.div key={u.user_id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
              onClick={() => openUserDetail(u)}>

              {/* Top gradient strip + avatar */}
              <div className={`h-14 bg-gradient-to-br ${getAvatarColor(u.user_id)} relative`}>
                <div className="absolute -bottom-6 left-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(u.user_id)} flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-md`}>
                    <span className="text-white font-bold">{displayName(u)[0]?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      <Shield size={9} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      <User size={9} /> User
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-8 px-4 pb-4">
                <p className="font-bold text-zinc-900 dark:text-white truncate">{displayName(u)}</p>
                {u.email && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1 truncate">
                    <Mail size={11} className="text-zinc-400 flex-shrink-0" />{u.email}
                  </p>
                )}

                <div className="space-y-2 mt-3">
                  {u.phone && (
                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                      <Phone size={11} className="text-zinc-400 flex-shrink-0" />{u.phone}
                    </p>
                  )}
                  {u.address && (
                    <p className="text-xs text-zinc-500 flex items-start gap-2 line-clamp-2">
                      <MapPin size={11} className="text-zinc-400 flex-shrink-0 mt-0.5" />{u.address}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 flex items-center gap-2">
                    <Calendar size={11} className="flex-shrink-0" />
                    Joined {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── User Detail Drawer ── */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className={`h-24 bg-gradient-to-br ${getAvatarColor(selectedUser.user_id)} relative`}>
                <button onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X size={16} />
                </button>
                <div className="absolute -bottom-8 left-6">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(selectedUser.user_id)} flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-lg`}>
                    <span className="text-white font-bold text-xl">{displayName(selectedUser)[0]?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-12 px-6 pb-6">
                {/* User info */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{displayName(selectedUser)}</h2>
                  {selectedUser.role === "admin" && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800">
                      <Shield size={10} /> Admin
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="space-y-4 mb-6">
                  {selectedUser.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center flex-shrink-0">
                        <Phone size={14} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Phone</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Address</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Joined</p>
                      <p className="text-sm text-zinc-900 dark:text-white">
                        {new Date(selectedUser.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">User ID</p>
                      <p className="text-xs text-zinc-500 font-mono break-all">{selectedUser.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* Bookings */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                    <Package size={15} className="text-blue-500" />
                    Bookings ({userBookings.length})
                  </h3>

                  {bookingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  ) : userBookings.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No bookings found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userBookings.map((booking) => (
                        <div key={booking.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm text-zinc-900 dark:text-white">{booking.service}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[booking.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-zinc-500">
                            <p className="flex items-center gap-1.5">
                              <Calendar size={11} className="text-zinc-400" />
                              {booking.preferred_date} at {booking.preferred_time}
                            </p>
                            {booking.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone size={11} className="text-zinc-400" />
                                {booking.phone}
                              </p>
                            )}
                            {booking.address && (
                              <p className="flex items-center gap-1.5 line-clamp-1">
                                <MapPin size={11} className="text-zinc-400 flex-shrink-0" />
                                {booking.address}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
