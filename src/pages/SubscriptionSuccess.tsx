import { useLocation, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const SubscriptionSuccess = () => {
  const { state } = useLocation() as {
    state?: {
      planName?: string;
      paymentId?: string;
      amount?: number;
      currency?: string;
      endDate?: string;
    };
  };

  const amountText =
    typeof state?.amount === "number"
      ? `${state.currency || "INR"} ${state.amount.toLocaleString("en-IN")}`
      : null;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Subscription Activated</h1>
        <p className="text-muted-foreground mb-6">
          Your maintenance plan payment has been verified successfully.
        </p>

        <div className="text-left rounded-xl border border-border p-4 space-y-2 text-sm">
          <p><span className="font-medium">Plan:</span> {state?.planName || "Annual Maintenance"}</p>
          {amountText && <p><span className="font-medium">Amount:</span> {amountText}</p>}
          {state?.paymentId && <p><span className="font-medium">Payment ID:</span> {state.paymentId}</p>}
          {state?.endDate && (
            <p>
              <span className="font-medium">Valid Until:</span>{" "}
              {new Date(state.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/dashboard/subscriptions"
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium"
          >
            My Subscriptions
          </Link>
          <Link
            to="/subscriptions"
            className="flex-1 py-2.5 rounded-lg border border-border font-medium"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
