import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Zap, LayoutDashboard, CalendarDays, User, Settings, LogOut, Loader2, Menu, X, Wrench } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { getNotificationPermission, subscribeToPush } from "@/utils/firebaseNotifications";
import { getNativeTechnicianProfile } from "@/lib/nativeTechnician";
import type { NativeTechnician } from "@/lib/apiContracts";

const navItems = [
  { label: "Dashboard",    to: "/technician/dashboard",    icon: LayoutDashboard },
  { label: "My Bookings",  to: "/technician/bookings",     icon: CalendarDays },
  { label: "Profile",      to: "/technician/profile",      icon: User },
  { label: "Settings",     to: "/technician/settings",     icon: Settings },
];

const TechnicianLayout = () => {
  const { user, loading, signOut, isTechnician } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [technician, setTechnician] = useState<NativeTechnician | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Fetch technician profile
  useEffect(() => {
    if (!user) return;
    
    const fetchTechnician = async () => {
      try { const data=await getNativeTechnicianProfile(); setHasProfile(true); setTechnician(data); }
      catch (error:any) { logger.error("Error fetching technician profile:", error); setHasProfile(false); }
    };

    fetchTechnician();
  }, [user]);

  // FCM push subscription setup
  useEffect(() => {
    if (!user?.id) return;

    const setupFCM = async () => {
      if (getNotificationPermission() !== 'granted') return;
      try {
        const fcmSuccess = await subscribeToPush(user.id);
        if (fcmSuccess) {
        } else {
          logger.warn('[TechnicianLayout] FCM subscription failed');
        }
      } catch (err) {
        logger.warn('[TechnicianLayout] FCM setup error:', err);
      }
    };

    setupFCM();
  }, [user?.id]);

  const currentPage = navItems.find(n => n.to === location.pathname)?.label || "Technician";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    </div>
  );

  if (!user) return <Navigate to="/technician/login" replace />;
  if (!isTechnician) return <Navigate to="/technician/login" replace />;

  // A role is necessary but approval is also required.
  if (hasProfile === false || (technician && technician.approval_status !== "approved")) {
    return <Navigate to="/technician/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0 bg-zinc-900 dark:bg-zinc-950 border-r border-zinc-800 h-screen overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Technician Panel</p>
            <p className="text-xs text-zinc-500 mt-0.5">{technician?.name || "Incomplete Profile"}</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex-shrink-0 px-3 py-2 border-b border-zinc-800">
          <NotificationBell userId={user?.id || null} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 min-h-0
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}>
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status & Sign out */}
        <div className="flex-shrink-0 px-2 py-3 border-t border-zinc-800">
          {hasProfile && technician && (
            <>
              <div className="mb-2 px-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    technician.status === 'active' ? 'bg-emerald-500' :
                    technician.status === 'busy' ? 'bg-orange-500' : 'bg-zinc-500'
                  }`} />
                  <span className="text-xs font-medium text-zinc-400 capitalize">{technician.status}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </>
          )}
          {!hasProfile && (
            <div className="mb-2 px-3">
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              <p className="text-xs text-orange-400 mt-1">Profile Incomplete</p>
            </div>
          )}
          <button onClick={async () => { await signOut(); navigate("/technician/login"); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all w-full group">
            <LogOut className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">{currentPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell userId={user?.id || null} />
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Menu */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-14 left-0 bottom-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
            <nav className="flex-1 overflow-y-auto py-3 min-h-0">
              {navItems.map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    }`}>
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-zinc-500"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-shrink-0 px-2 py-3 border-t border-zinc-800">
              {hasProfile && technician && (
                <p className="text-xs text-zinc-500 truncate px-3 mb-2">{technician.name}</p>
              )}
              {!hasProfile && (
                <>
                  <p className="text-xs text-zinc-500 truncate px-3 mb-2">{user.email}</p>
                  <p className="text-xs text-orange-400 px-3">Profile Incomplete</p>
                </>
              )}
              <button onClick={async () => { await signOut(); setMobileOpen(false); navigate("/technician/login"); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all w-full">
                <LogOut className="w-4 h-4 flex-shrink-0 text-zinc-500" /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0
        pt-14 pb-0 md:pt-0 md:pb-0
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-200
        dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-thumb]:rounded-full">
        <Outlet />
      </main>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt userId={user?.id || null} />
    </div>
  );
};

export default TechnicianLayout;
