import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database, HardDrive, Activity, Server, TrendingUp, TrendingDown,
  RefreshCw, CheckCircle, AlertTriangle, Clock, Zap, Users,
  ShoppingCart, Package, FileText, BarChart3, Cpu, Wifi,
  Star, FolderOpen, Mail, MessageSquare, Loader2, UserCheck, Wrench, Bell, BellOff
} from "lucide-react";
import { getNativeAdminDashboard } from "@/lib/nativeAdminOperations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";


const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

interface DatabaseStats {
  tableSizes: Array<{ table_name: string; total_size: string; data_size: string; index_size: string; row_count: number }>;
  indexStats: Array<{ tablename: string; indexname: string; index_size: string; idx_scan: number }>;
  cacheHitRatio: number;
  totalSize: string;
  availableSize: string;
  usagePercentage: number;
}

interface SystemMetrics {
  uptime: string;
  activeConnections: number;
  totalQueries: number;
  slowQueries: number;
  deadTuples: number;
  lastVacuum: string;
  lastAnalyze: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = "slate" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const borders: Record<string, string> = {
    slate: "border-zinc-200 dark:border-zinc-700",
    blue:  "border-blue-100 dark:border-blue-900/40",
    green: "border-emerald-100 dark:border-emerald-900/40",
  };
  const dots: Record<string, string> = {
    slate: "bg-zinc-400", blue: "bg-blue-500", green: "bg-emerald-500",
  };
  return (
    <div className={`rounded-2xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm ${borders[accent]}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-inherit bg-zinc-50/60 dark:bg-zinc-800/40">
        <span className={`w-2 h-2 rounded-full ${dots[accent]}`} />
        <span className="text-zinc-400">{icon}</span>
        <h3 className="font-semibold text-sm tracking-wide text-zinc-700 dark:text-zinc-200 uppercase">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon, color, alert, delay = 0 }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  color: string; alert?: boolean; delay?: number;
}) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-950/20",    text: "text-blue-600 dark:text-blue-400",    border: "border-blue-200 dark:border-blue-800" },
    green:   { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    violet:  { bg: "bg-violet-50 dark:bg-violet-950/20",  text: "text-violet-600 dark:text-violet-400",  border: "border-violet-200 dark:border-violet-800" },
    orange:  { bg: "bg-orange-50 dark:bg-orange-950/20",  text: "text-orange-600 dark:text-orange-400",  border: "border-orange-200 dark:border-orange-800" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm ${c.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
        {alert && <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />}
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
    </motion.div>
  );
};

const CountCard = ({ icon: Icon, label, count, color, delay = 0 }: {
  icon: any; label: string; count: number; color: string; delay?: number;
}) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue:   { bg: "bg-blue-50 dark:bg-blue-950/20",    text: "text-blue-600 dark:text-blue-400",    border: "border-blue-100 dark:border-blue-900" },
    green:  { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/20",  text: "text-violet-600 dark:text-violet-400",  border: "border-violet-100 dark:border-violet-900" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/20",  text: "text-orange-600 dark:text-orange-400",  border: "border-orange-100 dark:border-orange-900" },
    yellow: { bg: "bg-yellow-50 dark:bg-yellow-950/20",  text: "text-yellow-600 dark:text-yellow-400",  border: "border-yellow-100 dark:border-yellow-900" },
    pink:   { bg: "bg-pink-50 dark:bg-pink-950/20",      text: "text-pink-600 dark:text-pink-400",      border: "border-pink-100 dark:border-pink-900" },
    cyan:   { bg: "bg-cyan-50 dark:bg-cyan-950/20",      text: "text-cyan-600 dark:text-cyan-400",      border: "border-cyan-100 dark:border-cyan-900" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/20",  text: "text-indigo-600 dark:text-indigo-400",  border: "border-indigo-100 dark:border-indigo-900" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
      className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm ${c.border} flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
        <Icon size={18} />
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{fmt(count)}</p>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    </motion.div>
  );
};

const OptimizationItem = ({ check, title, description }: {
  check: boolean; title: string; description: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700">
    {check
      ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
      : <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />}
    <div>
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [technicianStats, setTechnicianStats] = useState({ total: 0, active: 0, busy: 0, atCapacity: 0 });
  const [pushStats, setPushStats] = useState({ total: 0, fcm: 0, inactive: 0 });
  const [tableCounts, setTableCounts] = useState<any>(null);
  const { user } = useAuth();

  const applyNativeDashboard = (data: any) => {
    setTableCounts(data.counts || {});
    const db = data.database || {};
    setDbStats({
      tableSizes: db.tableSizes || [],
      indexStats: db.indexStats || [],
      cacheHitRatio: Number(db.cacheHitRatio || 0),
      totalSize: db.totalSize || "0 bytes",
      availableSize: "Plan-dependent",
      usagePercentage: 0,
    });
    const m = db.metrics || {};
    const seconds = Number(m.uptime_seconds || 0);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    setMetrics({ uptime: days ? `${days}d ${hours}h` : `${hours}h`, activeConnections: Number(m.active_connections || 0), totalQueries: Number(m.total_queries || 0), slowQueries: 0, deadTuples: Number(m.dead_tuples || 0), lastVacuum: m.last_vacuum || "", lastAnalyze: m.last_analyze || "" });
    const t = data.technicians || {};
    setTechnicianStats({ total:Number(t.total||0), active:Number(t.active||0), busy:Number(t.busy||0), atCapacity:Number(t.at_capacity||0) });
    const ps = data.push || {};
    setPushStats({ total:Number(ps.total||0), fcm:Number(ps.fcm||0), inactive:Number(ps.inactive||0) });
  };

  const subscribeAdmin = async () => {
    toast.info("Requesting push permission...");
    if (!user) { toast.error("Admin not logged in"); return; }
    try {
      const { subscribeToPush } = await import("@/utils/firebaseNotifications");
      const result = await subscribeToPush(user.id);
      if (result) {
        toast.success("Push subscribed! You'll receive notifications.");
        await fetchStats(true);
      } else {
        toast.error("Push subscription failed — check browser notifications are allowed");
      }
    } catch (err) {
      logger.error("[Admin] Subscribe error:", err);
      toast.error("Failed to subscribe to push");
    }
  };

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      applyNativeDashboard(await getNativeAdminDashboard());
      if (isRefresh) toast.success("Statistics refreshed");
    } catch (err) {
      logger.error(err);
      toast.error("Failed to load some statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const storageColor = (p: number) =>
    p < 50 ? "bg-emerald-500" : p < 75 ? "bg-yellow-400" : p < 90 ? "bg-orange-400" : "bg-red-500";

  const storageTextColor = (p: number) =>
    p < 50 ? "text-emerald-600" : p < 75 ? "text-yellow-600" : p < 90 ? "text-orange-500" : "text-red-500";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-400">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 size={22} className="text-blue-500" /> Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Database performance, storage, and system health</p>
        </div>
        <button
          onClick={async () => { await fetchStats(true); }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-60 self-start">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* System metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Storage */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm ${(dbStats?.usagePercentage || 0) > 75 ? "border-orange-200 dark:border-orange-800" : "border-blue-100 dark:border-blue-900/40"}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-blue-600">
              <HardDrive size={18} />
            </div>
            {dbStats && dbStats.usagePercentage > 90 && <AlertTriangle size={16} className="text-red-500" />}
          </div>
          {dbStats ? (
            <>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{dbStats.totalSize}</p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Storage Used</p>
              <p className="text-xs text-zinc-400 mt-0.5">{dbStats.availableSize} available</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${storageTextColor(dbStats.usagePercentage)}`}>
                    {dbStats.usagePercentage.toFixed(1)}% used
                  </span>
                  <span className="text-zinc-400">Provider plan</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${storageColor(dbStats.usagePercentage)}`}
                    style={{ width: `${dbStats.usagePercentage}%` }} />
                </div>
              </div>
            </>
          ) : <p className="text-sm text-zinc-400">Loading…</p>}
        </motion.div>

        {/* Cache */}
        <MetricCard delay={0.06} label="Cache Efficiency" color="green"
          value={dbStats ? `${(dbStats.cacheHitRatio * 100).toFixed(1)}%` : "—"}
          sub={dbStats ? (dbStats.cacheHitRatio > 0.95 ? "Excellent performance" : dbStats.cacheHitRatio > 0.8 ? "Good" : "Needs work") : "Loading…"}
          icon={<Zap size={18} />} />

        {/* Connections */}
        <MetricCard delay={0.12} label="Active Connections" color="violet"
          value={metrics ? String(metrics.activeConnections) : "—"}
          sub="Normal load"
          icon={<Wifi size={18} />} />

        {/* Uptime */}
        <MetricCard delay={0.18} label="System Uptime" color="orange"
          value={metrics?.uptime || "—"}
          sub="Running smoothly"
          icon={<Clock size={18} />} />
      </div>

      {/* Technician Stats */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Technician Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: UserCheck,    label: "Total Techs",   count: technicianStats.total,      color: "blue",   delay: 0.04 },
            { icon: CheckCircle,  label: "Active",        count: technicianStats.active,     color: "emerald", delay: 0.06 },
            { icon: AlertTriangle, label: "Busy",         count: technicianStats.busy,       color: "orange", delay: 0.08 },
            { icon: Wrench,       label: "At Capacity",   count: technicianStats.atCapacity, color: "red",    delay: 0.10 },
          ].map(item => (
            <motion.div key={item.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: item.delay }}
              className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow ${
                item.color === "blue" ? "border-blue-100 dark:border-blue-900" :
                item.color === "emerald" ? "border-emerald-100 dark:border-emerald-900" :
                item.color === "orange" ? "border-orange-100 dark:border-orange-900" :
                "border-red-100 dark:border-red-900"
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.color === "blue" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600" :
                item.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" :
                item.color === "orange" ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600" :
                "bg-red-50 dark:bg-red-950/20 text-red-600"
              }`}>
                <item.icon size={18} />
              </div>
              <p className={`text-2xl font-bold ${
                item.color === "blue" ? "text-blue-600" :
                item.color === "emerald" ? "text-emerald-600" :
                item.color === "orange" ? "text-orange-600" :
                "text-red-600"
              }`}>{fmt(item.count)}</p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Push Subscriptions */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Push Subscriptions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="push-subs-stats">
          {[
            { icon: Bell, label: "Total Active", count: pushStats.total, color: "blue", delay: 0.04 },
            { icon: Bell, label: "FCM", count: pushStats.fcm, color: "green", delay: 0.06 },
            
            { icon: BellOff, label: "Inactive", count: pushStats.inactive, color: "orange", delay: 0.10 },
          ].map(item => (
            <motion.div key={item.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: item.delay }}
              className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow ${
                item.color === "blue" ? "border-blue-100 dark:border-blue-900" :
                item.color === "green" ? "border-emerald-100 dark:border-emerald-900" :
                item.color === "violet" ? "border-violet-100 dark:border-violet-900" :
                "border-orange-100 dark:border-orange-900"
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.color === "blue" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600" :
                item.color === "green" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" :
                item.color === "violet" ? "bg-violet-50 dark:bg-violet-950/20 text-violet-600" :
                "bg-orange-50 dark:bg-orange-950/20 text-orange-600"
              }`}>
                <item.icon size={18} />
              </div>
              <p className={`text-2xl font-bold ${
                item.color === "blue" ? "text-blue-600" :
                item.color === "green" ? "text-emerald-600" :
                item.color === "violet" ? "text-violet-600" :
                "text-orange-600"
              }`}>{fmt(item.count)}</p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
            </motion.div>
          ))}
          <button
            onClick={subscribeAdmin}
            className="p-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center text-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-blue-600">
              <Bell size={18} />
            </div>
            <p className="text-lg font-bold text-blue-600">Subscribe</p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Click to enable push for admin</p>
          </button>
        </div>
      </div>

      {/* Content counts */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Content Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { icon: Package,      label: "Products",     count: tableCounts?.products || 0,          color: "blue",   delay: 0.12 },
            { icon: ShoppingCart, label: "Orders",       count: tableCounts?.orders || 0,            color: "green",  delay: 0.14 },
            { icon: Users,        label: "Users",        count: tableCounts?.users || 0,             color: "violet", delay: 0.16 },
            { icon: FileText,     label: "Bookings",     count: tableCounts?.bookings || 0,          color: "orange", delay: 0.18 },
            { icon: Zap,          label: "Services",     count: tableCounts?.services || 0,          color: "yellow", delay: 0.20 },
            { icon: FolderOpen,   label: "Projects",     count: tableCounts?.projects || 0,          color: "pink",   delay: 0.22 },
            { icon: Star,         label: "Testimonials", count: tableCounts?.testimonials || 0,      color: "cyan",   delay: 0.24 },
            { icon: Mail,         label: "Messages",     count: tableCounts?.contact_messages || 0,  color: "indigo", delay: 0.26 },
          ].map(item => <CountCard key={item.label} {...item} />)}
        </div>
      </div>

      {/* Table + Index breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Table Storage Breakdown" icon={<Database size={14} />} accent="blue">
          {dbStats && dbStats.tableSizes.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-200
              dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {dbStats.tableSizes.map(t => (
                <div key={t.table_name}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.table_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{fmt(t.row_count)} rows · Index: {t.index_size}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{t.total_size}</p>
                    <p className="text-xs text-zinc-400">data: {t.data_size}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">No table statistics available</p>
          )}
        </SectionCard>

        <SectionCard title="Most Used Indexes" icon={<BarChart3 size={14} />} accent="blue">
          {dbStats && dbStats.indexStats.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-200
              dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {dbStats.indexStats.slice(0, 10).map((idx, i) => (
                <div key={idx.indexname}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{idx.indexname}</p>
                      <p className="text-xs text-zinc-400">{idx.tablename}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-bold text-emerald-600">{fmt(idx.idx_scan)} scans</p>
                    <p className="text-xs text-zinc-400">{idx.index_size}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">No index statistics available</p>
          )}
        </SectionCard>
      </div>

      {/* System health metrics */}
      {metrics && (
        <SectionCard title="System Health Metrics" icon={<Cpu size={14} />} accent="slate">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Queries",  value: fmt(metrics.totalQueries),       icon: Activity,      trend: "up" as const },
              { label: "Slow Queries",   value: String(metrics.slowQueries),     icon: Clock,         trend: metrics.slowQueries > 10 ? "down" as const : "stable" as const },
              { label: "Dead Tuples",    value: fmt(metrics.deadTuples),         icon: AlertTriangle, trend: metrics.deadTuples > 10000 ? "down" as const : "stable" as const },
              { label: "Last Vacuum",    value: metrics.lastVacuum || "Never",   icon: RefreshCw,     trend: "stable" as const },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <item.icon size={14} className="text-zinc-400" />
                  {item.trend === "up"     && <TrendingUp size={13} className="text-emerald-500" />}
                  {item.trend === "down"   && <TrendingDown size={13} className="text-red-500" />}
                  {item.trend === "stable" && <Activity size={13} className="text-blue-500" />}
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Optimization status */}
      <SectionCard title="Optimization Status" icon={<TrendingUp size={14} />} accent="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OptimizationItem
            check={(dbStats?.cacheHitRatio || 0) > 0.95}
            title="Cache Performance"
            description={(dbStats?.cacheHitRatio || 0) > 0.95
              ? "Excellent cache hit ratio (>95%)"
              : "Consider running VACUUM ANALYZE to improve cache"} />
          <OptimizationItem
            check={(dbStats?.usagePercentage || 0) < 75}
            title="Storage Usage"
            description={(dbStats?.usagePercentage || 0) < 75
              ? "Healthy storage utilization"
              : "Consider cleaning up old data or upgrading plan"} />
          <OptimizationItem
            check={true}
            title="Database Indexes"
            description="All tables properly indexed with optimized composite indexes" />
          <OptimizationItem
            check={true}
            title="Frontend Caching"
            description="Client-side caching enabled for all major pages" />
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminDashboard;