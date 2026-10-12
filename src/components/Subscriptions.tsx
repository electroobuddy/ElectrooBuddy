import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Crown, Sparkles } from "lucide-react";
import Section from "@/components/Section";
import { createNativeSubscriptionOrder, verifyNativeSubscriptionPayment } from "@/lib/nativeSubscriptions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plans, loading, activeSubscription } = useSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const loadRazorpay = async () => {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      toast.info("Please log in to subscribe.");
      navigate("/login", { state: { from: "/subscriptions" } });
      return;
    }
    if (activeSubscription?.plan_id === plan.id && activeSubscription?.status === "active") {
      toast.info("You are already subscribed to this active plan.");
      return;
    }
    setSelectedPlanId(plan.id);
    const loadingToast = toast.loading(`Preparing secure checkout for ${plan.name}...`);
    try {
      if (!(await loadRazorpay())) throw new Error("Failed to load Razorpay");
      const requestId = crypto.randomUUID();
      const order = await createNativeSubscriptionOrder(plan.id, requestId);
      toast.dismiss(loadingToast);
      const options = {
        key: order.key_id,
        order_id: order.razorpay_order_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: "Electroobuddy",
        description: `${plan.name} Subscription`,
        handler: async (response: any) => {
          const verifyToast = toast.loading("Verifying payment securely...");
          try {
            const verified = await verifyNativeSubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.dismiss(verifyToast);
            toast.success(`Successfully subscribed to ${plan.name}!`);
            navigate("/subscription-success", {
              state: {
                planName: plan.name,
                paymentId: response.razorpay_payment_id,
                amount: order.amount,
                currency: order.currency,
                endDate: verified.end_date,
              },
            });
          } catch (error: any) {
            toast.dismiss(verifyToast);
            toast.error(`Payment received but verification is pending: ${error.message}. Please contact support with your payment ID.`);
          } finally { setSelectedPlanId(null); }
        },
        prefill: { email: user.email },
        theme: { color: "#3b82f6" },
        modal: { ondismiss: () => { toast.error("Payment cancelled by user."); setSelectedPlanId(null); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failure: any) => {
        toast.error(failure?.error?.description || "Payment failed. Please try again.");
        setSelectedPlanId(null);
      });
      rzp.open();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Subscription failed: ${error.message}`);
      setSelectedPlanId(null);
    }
  };

  const renderPlanCta = (plan: any) => {
    if (activeSubscription?.plan_id === plan.id && activeSubscription?.status === "active") {
      return (
        <Button className="w-full" size="lg" variant="secondary" disabled>
          Active Plan
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        size="lg"
        variant={plan.price > 1000 ? "default" : "outline"}
        onClick={() => handleSubscribe(plan)}
        disabled={selectedPlanId === plan.id}
      >
        {selectedPlanId === plan.id ? "Processing..." : "Subscribe Now"}
      </Button>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
      <SEO
        title="Annual Maintenance Plans"
        description="Protect your home with our annual electrical maintenance plans starting from ₹999."
      />
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-white mb-4">
            Annual Maintenance Plans
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Safe and reliable electricity for your home, all year round.
          </p>
          {activeSubscription?.subscription_plans?.name && (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">
              Active Plan: {activeSubscription.subscription_plans.name}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <motion.div key={plan.id} whileHover={{ y: -5 }}>
              <Card className={`flex flex-col h-full border-2 ${plan.price > 1000 ? 'border-blue-500 shadow-xl' : 'border-transparent'}`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    {plan.price > 1000 ? <Crown className="text-yellow-500" /> : <Sparkles className="text-blue-500" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>{renderPlanCta(plan)}</CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default Subscriptions;
