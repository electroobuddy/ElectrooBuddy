import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, CalendarClock, ShieldCheck, Loader2, RefreshCw, Phone, Percent, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const UserSubscriptions = () => {
  const { user } = useAuth();
  const { allSubscriptions, loading, fetchAllSubscriptions, isExpired, getDaysRemaining } = useSubscription();

  useEffect(() => {
    if (user) fetchAllSubscriptions();
  }, [user, fetchAllSubscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          My Subscriptions
        </h1>
        <p className="text-muted-foreground">Track your maintenance plans, benefits, and validity.</p>
      </div>

      {allSubscriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">You do not have any subscription yet.</p>
          <Link to="/subscriptions" className="inline-flex px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            Explore Plans
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {allSubscriptions.map((sub) => {
            const expired = isExpired(sub);
            const daysLeft = getDaysRemaining(sub);
            const plan = sub.subscription_plans as any;
            const isActive = sub.status === "active" && !expired;

            return (
              <div key={sub.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{plan?.name || "Maintenance Plan"}</h2>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-green-100 text-green-700"
                        : expired
                          ? "bg-zinc-100 text-zinc-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {expired && sub.status === "active" ? "expired" : sub.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan?.description}</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <p className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    {sub.currency} {Number(sub.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    Start: {new Date(sub.start_date).toLocaleDateString("en-IN")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    End: {new Date(sub.end_date).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Benefits Section */}
                {isActive && plan && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">Your Plan Benefits</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">
                          {plan.max_service_calls} free service call{plan.max_service_calls !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">
                          {plan.parts_discount_percent}% discount on parts
                        </span>
                      </div>
                      {plan.has_priority_support && (
                        <div className="flex items-center gap-2 text-sm">
                          <Headphones className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700 dark:text-blue-300">Priority support</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Use these benefits when booking a service. They will be automatically applied at checkout.
                    </p>
                  </div>
                )}

                {expired && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      This plan has expired. Subscribe again to continue maintenance coverage.
                    </p>
                    <Link
                      to="/subscriptions"
                      className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Subscribe Again
                    </Link>
                  </div>
                )}

                {sub.payment_id && (
                  <p className="text-xs text-muted-foreground mt-3 font-mono">Payment ID: {sub.payment_id}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSubscriptions;
