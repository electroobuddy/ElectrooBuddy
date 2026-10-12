import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  subscribeToPush, 
  unsubscribeFromPush, 
  getNotificationPermission,
  isPushSupported,
  hasActiveSubscription
} from "@/utils/firebaseNotifications";
import { toast } from "sonner";

interface PushNotificationPromptProps {
  userId: string | null;
}

const PushNotificationPrompt = ({ userId }: PushNotificationPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    // Check permission status
    const perm = getNotificationPermission();
    setPermission(perm);
    
    // Check if already subscribed
    checkSubscription();
    
    // Show prompt if permission is default and push is supported
    if (perm === 'default' && isPushSupported()) {
      const hasSeenPrompt = localStorage.getItem('push_prompt_seen');
      if (!hasSeenPrompt) {
        // Delay showing prompt for better UX
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [userId]);

  const checkSubscription = async () => {
    if (!userId) return;
    const hasSub = await hasActiveSubscription(userId);
    setIsSubscribed(hasSub);
  };

  const handleSubscribe = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const success = await subscribeToPush(userId);
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        toast.success('🔔 Push notifications enabled!', {
          description: 'You will receive notifications even when the app is closed.',
        });
      } else {
        toast.error('Failed to enable push notifications', {
          description: 'Please check your browser settings and try again.',
        });
      }
    } catch (error) {
      logger.error('Subscription error:', error);
      toast.error('Failed to subscribe to notifications');
    } finally {
      setLoading(false);
      setShowPrompt(false);
      localStorage.setItem('push_prompt_seen', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_seen', 'true');
  };

  const handleUnsubscribe = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const success = await unsubscribeFromPush(userId);
      if (success) {
        setIsSubscribed(false);
        toast.info('Push notifications disabled');
      }
    } catch (error) {
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if not supported or no user
  if (!userId || !isPushSupported()) return null;

  // If permission denied, show a small banner to inform user
  if (permission === 'denied') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Notifications Blocked
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Push notifications are blocked in your browser settings. 
                Enable them to receive updates even when the app is closed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If already subscribed, don't show prompt
  if (isSubscribed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Never Miss an Update
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Get instant notifications about your bookings, even when the app is closed.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Booking status updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Technician assignments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Works in background</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Desktop & mobile support</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Not Now
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3 text-center">
              You can change this anytime in settings
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationPrompt;
