import { escapeHtml } from "@/lib/security";
import { logger } from "@/lib/logger";
// import { useEffect } from "react";
// import { useLocation, Link, useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { CheckCircle, Package, Mail, ArrowRight, Home, ShoppingCart } from "lucide-react";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import WhatsAppFloat from "@/components/WhatsAppFloat";

// const OrderSuccess = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { orderId, amount, paymentMethod } = location.state || {};

//   useEffect(() => {
//     // Redirect to home if no order data
//     if (!orderId) {
//       navigate("/");
//     }
//   }, [orderId, navigate]);

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
//         <div className="container mx-auto px-4 py-16">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             className="max-w-2xl mx-auto"
//           >
//             {/* Success Icon */}
//             <div className="text-center mb-8">
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
//                 className="w-32 h-32 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
//               >
//                 <CheckCircle className="w-20 h-20 text-green-600" />
//               </motion.div>
//               <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
//                 Order Placed Successfully!
//               </h1>
//               <p className="text-lg text-muted-foreground">
//                 Thank you for your purchase
//               </p>
//             </div>

//             {/* Order Confirmation Card */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="bg-card border border-border rounded-xl p-8 mb-6 shadow-sm"
//             >
//               <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
//                 <div>
//                   <h2 className="text-xl font-heading font-semibold mb-2">Order Confirmation</h2>
//                   <p className="text-muted-foreground">Your order has been confirmed</p>
//                 </div>
//                 <Package className="w-8 h-8 text-primary" />
//               </div>

//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Order Number:</span>
//                   <span className="font-semibold font-mono">{orderId}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Payment Method:</span>
//                   <span className="font-medium">
//                     {paymentMethod === "razorpay" ? "Online Payment" : "Cash on Delivery"}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Total Amount:</span>
//                   <span className="font-bold text-primary text-lg">₹{amount?.toFixed(2) || "0.00"}</span>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Next Steps */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4 }}
//               className="bg-card border border-border rounded-xl p-6 mb-6"
//             >
//               <h3 className="font-heading font-semibold text-lg mb-4">What's Next?</h3>
//               <div className="space-y-3">
//                 <div className="flex items-start gap-3">
//                   <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <span className="text-primary text-xs font-bold">1</span>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     A confirmation email has been sent to your registered email address
//                   </p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <span className="text-primary text-xs font-bold">2</span>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     We'll send you a tracking number once your order is shipped
//                   </p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <span className="text-primary text-xs font-bold">3</span>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Estimated delivery time is 5-7 business days
//                   </p>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Action Buttons */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.5 }}
//               className="grid grid-cols-1 sm:grid-cols-2 gap-4"
//             >
//               <Link
//                 to="/dashboard/orders"
//                 className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition"
//               >
//                 <Package className="w-5 h-5" />
//                 Track Your Order
//               </Link>
//               <Link
//                 to="/products"
//                 className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3.5 rounded-xl font-semibold hover:bg-secondary/90 transition"
//               >
//                 <ShoppingCart className="w-5 h-5" />
//                 Continue Shopping
//               </Link>
//             </motion.div>

//             {/* Additional Info */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.6 }}
//               className="mt-8 text-center"
//             >
//               <p className="text-sm text-muted-foreground mb-4">
//                 Need help? We're here for you!
//               </p>
//               <div className="flex items-center justify-center gap-4 text-sm">
//                 <a
//                   href="mailto:support@electroobuddy.com"
//                   className="flex items-center gap-2 text-primary hover:underline"
//                 >
//                   <Mail className="w-4 h-4" />
//                   support@electroobuddy.com
//                 </a>
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>

//         <Footer />
//         <WhatsAppFloat />
//       </div>
//     </>
//   );
// };

// export default OrderSuccess;


import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  Mail,
  ShoppingCart,
  Share2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { getNativeOrderByNumber } from "@/lib/nativeOrders";
import type { NativeOrder, NativeOrderItem } from "@/lib/apiContracts";
import { nativeApiErrorMessage } from "@/lib/apiClient";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/* ─── mini confetti canvas ────────────────────────────────────── */
const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 6 + 3,
      d: Math.random() * 2 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.07 + 0.05,
    }));

    let frame: number;
    let elapsed = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += p.d + 1;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });
      elapsed++;
      if (elapsed < 220) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};

/* ─── main ───────────────────────────────────────────────────── */
const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = (location.state || {}) as { orderId?: string };
  const { data: siteSettings = {} } = useSiteSettings();
  const PHONE_NUMBER = siteSettings.phone_number || "";
  const EMAIL = siteSettings.email || "";

  const [order, setOrder] = useState<NativeOrder | null>(null);
  const [items, setItems] = useState<NativeOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrder = async (number: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const o = await getNativeOrderByNumber(number);
      setOrder(o);
      setItems(o.items || []);
    } catch (error) {
      logger.error("Failed to fetch order:", error);
      setLoadError(nativeApiErrorMessage(error, "Unable to load the confirmed order."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }
    document.title = `Order Confirmed – ${escapeHtml(orderId)} | Electrobuddy`;
    void loadOrder(orderId);
  }, [orderId, navigate]);
  const handleShare = async () => {
    const text = `Just placed an order on Electrobuddy! Order #${escapeHtml(orderId)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Electrobuddy Order", text, url: window.location.origin });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Order details copied to clipboard");
    }
  };

  const handlePrintReceipt = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const shipAddr = order?.shipping_address_data as Record<string, unknown> | null;
    const isPaid = order?.payment_status === "paid";
    const refunded = Number(order?.refunded_amount || 0);
    const created = new Date(order?.created_at || Date.now());
    const dateStr = created.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const itemsRows = (items || []).map(
      (it: NativeOrderItem, i: number) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${i + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(it.product_name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${Number(it.unit_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${Number(it.total_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`
    ).join("");

    const finalAmount = Number(order?.total_amount || 0);
    const discount = Number(order?.discount_amount || 0);
    const subTotal = Number(order?.subtotal || 0);
    const tax = Number(order?.tax_amount || 0);
    const shipping = Number(order?.shipping_charge || 0);
    const instTotal = Number(order?.installation_total || 0);

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt – ${escapeHtml(orderId)}</title>
        <style>
          400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Poppins', sans-serif;
            background: #f3f4f6;
            padding: 40px 20px;
            color: #1f2937;
          }
          .receipt {
            max-width: 720px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            padding: 32px 40px;
            color: #fff;
            text-align: center;
          }
          .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
          .header p { opacity: 0.9; font-size: 14px; }
          .header .badge {
            display: inline-block;
            margin-top: 10px;
            padding: 4px 16px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
          }
          .body { padding: 32px 40px; }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
          }
          .info-grid .field label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .info-grid .field p {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          thead th {
            background: #f9fafb;
            padding: 10px 12px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
            text-align: left;
          }
          thead th.right { text-align: right; }
          thead th.center { text-align: center; }
          tbody td { font-size: 14px; }
          .totals {
            border-top: 2px solid #e5e7eb;
            padding-top: 16px;
            margin-top: 8px;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 14px;
          }
          .totals .row.total {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            border-top: 2px solid #e5e7eb;
            margin-top: 8px;
            padding-top: 12px;
          }
          .footer {
            text-align: center;
            padding: 24px 40px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          .footer strong { color: #1f2937; }
          @media print {
            body { background: #fff; padding: 0; }
            .receipt { box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Electrobuddy</h1>
            <p>05 Nagziri Dewas Road, Ujjain (456010)</p>
            <p>${PHONE_NUMBER} &nbsp;|&nbsp; ${EMAIL}</p>
            <div class="badge">${escapeHtml(String(order?.payment_status || "pending").toUpperCase())}</div>
          </div>
          <div class="body">
            <div class="info-grid">
              <div class="field">
                <label>Order Number</label>
                <p>${escapeHtml(orderId)}</p>
              </div>
              <div class="field">
                <label>Date</label>
                <p>${escapeHtml(dateStr)} at ${escapeHtml(timeStr)}</p>
              </div>
              <div class="field">
                <label>Payment Method</label>
                <p>${order?.payment_method === "razorpay" ? "Online Payment" : "Cash on Delivery"}</p>
              </div>
              <div class="field">
                <label>Payment Status</label>
                <p>${escapeHtml(String(order?.payment_status || "pending"))}</p>
              </div>
            </div>

            ${shipAddr ? `
            <div style="margin-bottom:20px;">
              <label style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;margin-bottom:4px;">Shipping Address</label>
              <p style="font-size:14px;font-weight:500;">${escapeHtml(shipAddr.name || "")}<br>${escapeHtml(shipAddr.address || "")}, ${escapeHtml(shipAddr.city || "")}, ${escapeHtml(shipAddr.state || "")} – ${escapeHtml(shipAddr.pincode || "")}<br>Phone: ${escapeHtml(shipAddr.phone || "")}</p>
            </div>
            ` : ""}

            <table>
              <thead>
                <tr>
                  <th class="center" style="width:40px;">#</th>
                  <th>Item</th>
                  <th class="center" style="width:60px;">Qty</th>
                  <th class="right" style="width:100px;">Unit Price</th>
                  <th class="right" style="width:100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af;">No items</td></tr>'}
              </tbody>
            </table>

            <div class="totals">
              <div class="row"><span>Subtotal</span><span>₹${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              ${instTotal > 0 ? `<div class="row"><span>Installation Charges</span><span>₹${instTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ""}
              <div class="row"><span>Shipping</span><span>${shipping === 0 ? "FREE" : `₹${shipping.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</span></div>
              <div class="row"><span>Tax</span><span>₹${tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              ${discount > 0 ? `<div class="row" style="color:#16a34a;"><span>Discount</span><span>−₹${discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ""}
              <div class="row total"><span>Order Total</span><span>₹${finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              ${refunded > 0 ? `<div class="row" style="color:#b45309;"><span>Refunded</span><span>−₹${refunded.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ""}
            </div>
          </div>
          <div class="footer">
            <p><strong>Electrobuddy</strong> — 05 Nagziri Dewas Road, Ujjain (456010)</p>
            <p>GST: 23ABCDE1234F1Z5 | Email: ${EMAIL} | Phone: ${PHONE_NUMBER}</p>
            <p style="margin-top:8px;">Thank you for your purchase!</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (!orderId) return null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading order" /></div>;
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Unable to load order</h1>
          <p className="text-sm text-muted-foreground">{loadError || 'The order could not be loaded.'}</p>
          {orderId && <button type="button" onClick={() => void loadOrder(orderId)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">Retry</button>}
          <div><Link to="/user/orders" className="text-sm text-primary underline">View my orders</Link></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Confetti />

      <div className="order-success-page bg-gray-50 dark:bg-gray-900 min-h-screen">
        <style>{`
          400;500;600;700&display=swap');

          .order-success-page {
            font-family: 'Poppins', sans-serif;
          }

          .order-success-page h1,
          .order-success-page h2,
          .order-success-page h3,
          .order-success-page h4,
          .order-success-page h5,
          .order-success-page h6 {
            font-weight: 700;
          }
        `}</style>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          {/* ── success icon ── */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-28 h-28 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-heading font-bold mb-2"
            >
              Order Placed!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              Thank you for shopping with Electrobuddy
            </motion.p>
          </div>

          {/* ── confirmation card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-xl p-7 mb-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-5 pb-5 border-b border-border">
              <div>
                <h2 className="font-semibold text-lg mb-0.5">Order Confirmed</h2>
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your inbox
                </p>
              </div>
              <Package className="w-7 h-7 text-primary flex-shrink-0" />
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order Number</dt>
                <dd className="font-semibold font-mono">{orderId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-medium">
                  {order?.payment_method === "razorpay" ? (
                    <span className="text-green-600">✓ Paid Online</span>
                  ) : (
                    "Cash on Delivery"
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Amount</dt>
                <dd className="font-bold text-primary text-base">
                  ₹{Number(order?.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estimated Delivery</dt>
                <dd className="font-medium">5–7 business days</dd>
              </div>
            </dl>
          </motion.div>

          {/* ── next steps ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-xl p-6 mb-5"
          >
            <h3 className="font-semibold mb-4">What happens next?</h3>
            <ol className="space-y-3">
              {[
                { n: 1, text: "A confirmation email will be sent to your registered address." },
                { n: 2, text: "Our team will verify and process your order." },
                { n: 3, text: "You'll receive a tracking number once it's shipped." },
                {
                  n: 4,
                  text:
                    order?.payment_method === "cod"
                      ? "Our delivery partner will collect payment on arrival."
                      : "Your payment is secured and confirmed.",
                },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* ── actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
          >
            <Link
              to="/dashboard/orders"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition text-sm"
            >
              <Package className="w-4 h-4" />
              Track Your Order
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3.5 rounded-xl font-semibold hover:bg-secondary/90 transition text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Continue Shopping
            </Link>
          </motion.div>

          {/* ── share + print ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              aria-label="Share order"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <span className="w-px h-4 bg-border" />
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              aria-label="Print receipt"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </motion.div>

          {/* ── support ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">Questions about your order?</p>
            <a
              href="mailto:support@electrobuddy.com"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              support@electrobuddy.com
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;