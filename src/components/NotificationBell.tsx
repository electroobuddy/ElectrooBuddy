import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, RefreshCw } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBellProps {
  userId: string | null;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications(userId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setRefreshing(false), 500);
  };
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Calculate dropdown position when opened
  useEffect(() => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = window.innerWidth < 640 ? Math.min(320, window.innerWidth - 32) : 384;
      const right = window.innerWidth - rect.right;
      // Ensure dropdown doesn't overflow viewport edges
      const maxRight = window.innerWidth - dropdownWidth - 16;
      const adjustedRight = Math.min(Math.max(16, right), Math.max(16, maxRight));
      const top = rect.bottom + 8;

      setPosition({ top, right: adjustedRight });
    }
  }, [isOpen]);

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
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("created") || type.includes("new")) return "📋";
    if (type.includes("confirmed")) return "✅";
    if (type.includes("assigned")) return "👨‍🔧";
    if (type.includes("completed")) return "✨";
    if (type.includes("cancelled")) return "❌";
    return "🔔";
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group hover:bg-zinc-800 dark:hover:bg-zinc-800"
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-zinc-400 group-hover:text-zinc-100 transition-colors truncate">Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto text-xs text-zinc-500">{unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                top: position.top,
                right: position.right,
                width: window.innerWidth < 640 ? Math.min(320, window.innerWidth - 32) : 384,
              }}
              className="fixed z-[100] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="min-w-0">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-zinc-500 mt-0.5">{unreadCount} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh notifications"
                  >
                    <RefreshCw className={`w-4 h-4 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <Bell className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {notifications.slice(0, 20).map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        }}
                        className={`p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                          !notification.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-sm font-semibold line-clamp-1 ${
                                !notification.is_read ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 text-center">
                    Showing {Math.min(notifications.length, 20)} of {notifications.length} notifications
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
