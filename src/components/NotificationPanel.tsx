import { useState } from "react";
import { Bell, CheckCheck, Filter, X, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { NativeNotification } from "@/lib/apiContracts";

interface NotificationPanelProps {
  userId: string | null;
  onClose?: () => void;
}

const NotificationPanel = ({ userId, onClose }: NotificationPanelProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications(userId);
  const [filter, setFilter] = useState<"all" | "unread" | "bookings" | "orders">("all");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("created") || type.includes("new")) return "📋";
    if (type.includes("confirmed")) return "✅";
    if (type.includes("assigned")) return "👨‍🔧";
    if (type.includes("completed")) return "✨";
    if (type.includes("cancelled")) return "❌";
    if (type.includes("in_progress")) return "🔧";
    return "🔔";
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("created") || type.includes("new")) return "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
    if (type.includes("confirmed")) return "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
    if (type.includes("assigned")) return "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20";
    if (type.includes("completed")) return "border-green-500 bg-green-50/50 dark:bg-green-950/20";
    if (type.includes("cancelled")) return "border-red-500 bg-red-50/50 dark:bg-red-950/20";
    return "border-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/20";
  };

  const handleNotificationClick = (notification: NativeNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to related booking or order
    if (notification.booking_id) {
      // Determine user role and navigate accordingly
      if (notification.type.includes("technician") || notification.type.includes("assigned")) {
        navigate(`/technician/bookings`);
      } else {
        navigate(`/dashboard/bookings`);
      }
    } else if (notification.order_id) {
      navigate(`/dashboard/orders`);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "bookings") return n.booking_id !== null;
    if (filter === "orders") return n.order_id !== null;
    return true;
  });

  const groupNotificationsByDate = (notifications: NativeNotification[]) => {
    const groups: Record<string, NativeNotification[]> = {};
    const now = new Date();

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

      let groupKey: string;
      if (diffDays === 0) groupKey = "Today";
      else if (diffDays === 1) groupKey = "Yesterday";
      else if (diffDays < 7) groupKey = "This Week";
      else if (diffDays < 30) groupKey = "This Month";
      else groupKey = "Older";

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notification);
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-zinc-500">{unreadCount} unread notifications</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount },
            { key: "bookings", label: "Bookings", count: notifications.filter(n => n.booking_id).length },
            { key: "orders", label: "Orders", count: notifications.filter(n => n.order_id).length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "unread" | "bookings" | "orders")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === key ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-700"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-500">Loading notifications...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500"><p className="text-sm text-red-600">{error}</p><button onClick={() => void refreshNotifications()} className="mt-3 px-4 py-2 rounded-xl border">Retry</button></div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Bell className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-1">No notifications</p>
            <p className="text-sm">
              {filter === "all" 
                ? "You're all caught up!" 
                : `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {Object.entries(groupedNotifications).map(([group, notifications]) => (
                <motion.div
                  key={group}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                    {group}
                  </h3>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                          !notification.is_read
                            ? `${getNotificationColor(notification.type)} border-l-4`
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className={`font-semibold text-base ${
                                !notification.is_read 
                                  ? "text-zinc-900 dark:text-white" 
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.is_read && (
                                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-600" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span>{formatDate(notification.created_at)}</span>
                              {notification.email_sent && (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  ✓ Email sent
                                </span>
                              )}
                              {(notification.booking_id || notification.order_id) && (
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <ExternalLink className="w-3 h-3" />
                                  Click to view
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {notifications.length > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>{filteredNotifications.length} of {notifications.length} notifications</span>
            <span>{unreadCount} unread</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
