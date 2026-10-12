import { logger } from "@/lib/logger";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Zap, LayoutDashboard, Calendar, User, LogOut, Loader2, Menu, X, Package, ShoppingBag, Wrench, ShieldCheck, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { getNotificationPermission, subscribeToPush } from "@/utils/firebaseNotifications";
import { useCart } from "@/contexts/CartContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", to: "/dashboard/bookings", icon: Calendar },
  { label: "My Orders", to: "/dashboard/orders", icon: Package },
  { label: "Subscriptions", to: "/dashboard/subscriptions", icon: ShieldCheck },
  { label: "Products", to: "/dashboard/products", icon: ShoppingBag },
  { label: "Services", to: "/dashboard/services", icon: Wrench },
  { label: "Profile", to: "/dashboard/profile", icon: User },
];

const UserLayout = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    if (!user?.id) return;

    const setupFCM = async () => {
      if (getNotificationPermission() !== 'granted') return;
      try {
        const fcmSuccess = await subscribeToPush(user.id);
        if (fcmSuccess) {
        } else {
          logger.warn('[UserLayout] FCM subscription failed');
        }
      } catch (err) {
        logger.warn('[UserLayout] FCM setup error:', err);
      }
    };

    setupFCM();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-foreground">My Panel</span>
        </div>
        
        {/* Notifications */}
        <div className="px-5 py-3 border-b border-border">
          <NotificationBell userId={user?.id || null} />
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          
          {/* Cart Link */}
          <Link
            to="/cart"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/cart"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            Cart
            {itemCount > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground truncate px-3 mb-2">{user.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-foreground text-sm">My Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell userId={user?.id || null} />
          {/* Mobile Cart Icon */}
          <Link to="/cart" className="relative p-1.5 text-foreground hover:bg-muted rounded-lg transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-card border-b border-border shadow-lg p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {/* Mobile Menu Cart Link */}
            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/cart" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              Cart
            </Link>
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground w-full"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-1.5 px-1">
        {[
          ...navItems.slice(0, 4),
          { label: "Cart", to: "/cart", icon: ShoppingCart, isCart: true },
          ...navItems.slice(4),
        ].map((item: any) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 relative ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.isCart && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight truncate w-full text-center font-medium">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8 overflow-auto">
        <Outlet />
      </main>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt userId={user?.id || null} />
    </div>
  );
};

export default UserLayout;
