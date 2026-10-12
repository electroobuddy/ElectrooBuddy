import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { listNativePaymentOperations } from "@/lib/nativeOrders";
import type { NativeOrder, NativeRefund } from "@/lib/apiContracts";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, DollarSign, CheckCircle, Clock, XCircle,
  Search, Eye, RefreshCw, X, TrendingUp, TrendingDown,
  Copy, Loader2, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { requestNativeRefund, reconcileNativeRefunds } from '@/lib/nativeRefunds';

type Order = NativeOrder;

// ─── Config ───────────────────────────────────────────────────────────────────

const PAYMENT_CONFIG: Record<string, { label: string; pill: string; dot: string; icon: React.ReactNode }> = {
  paid:    { label: "Paid",    dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", icon: <CheckCircle size={13} /> },
  pending: { label: "Pending", dot: "bg-yellow-400",  pill: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",       icon: <Clock size={13} /> },
  failed:  { label: "Failed",  dot: "bg-red-400",     pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",                         icon: <XCircle size={13} /> },
  partially_refunded: { label: "Partially Refunded", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200", icon: <TrendingDown size={13} /> },
  refunded: { label: "Refunded", dot: "bg-zinc-400", pill: "bg-zinc-100 text-zinc-700 border-zinc-200", icon: <TrendingDown size={13} /> },
};

const ORDER_STATUS_PILLS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  processing: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800",
  delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
};

const PaymentPill = ({ status }: { status: string }) => {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const SectionCard = ({ title, icon, children, accent = "slate" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const borders: Record<string, string> = {
    slate: "border-zinc-200 dark:border-zinc-700",
    green: "border-emerald-100 dark:border-emerald-900/40",
    blue:  "border-blue-100 dark:border-blue-900/40",
  };
  const dots: Record<string, string> = {
    slate: "bg-zinc-400", green: "bg-emerald-500", blue: "bg-blue-500",
  };
  return (
    <div className={`rounded-2xl border-2 bg-white dark:bg-zinc-900 overflow-hidden ${borders[accent]}`}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-inherit bg-zinc-50/60 dark:bg-zinc-800/40">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dots[accent]}`} />
        <span className="text-zinc-400">{icon}</span>
        <h3 className="font-semibold text-xs tracking-wide text-zinc-600 dark:text-zinc-300 uppercase">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AdminPayments = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refunds, setRefunds] = useState<NativeRefund[]>([]);
  const refundKeys = useState<Map<string,string>>(() => new Map())[0];
  const [refundBusy, setRefundBusy] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await listNativePaymentOperations();
      setOrders(data.orders || []);
      setRefunds(data.refunds || []);
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.razorpay_payment_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "refund_failed" ? refunds.some(r => r.order_id === o.id && r.status === "failed") : o.status === filterStatus);
    const matchesPayment = filterPayment === "all" || o.payment_status === filterPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const processedRefundTotal = refunds.filter(r => r.status === "processed").reduce((n,r) => n + Number(r.amount), 0);
  const grossCaptured = orders.filter(o => ["paid","partially_refunded","refunded"].includes(o.payment_status)).reduce((n,o) => n + Number(o.total_amount), 0);
  const totalRevenue = Math.max(0, grossCaptured - processedRefundTotal);
  const pendingAmount = orders.filter(o => o.payment_status === "pending").reduce((s, o) => s + o.total_amount, 0);
  const failedCount = orders.filter(o => o.payment_status === "failed").length;
  const paidCount = orders.filter(o => o.payment_status === "paid").length;

  const requestRefund = async (order: Order, partial = false) => {
    const remaining = Number(order.total_amount) - refunds.filter(r => r.order_id === order.id && r.status === "processed").reduce((n,r) => n + Number(r.amount), 0);
    const raw = partial ? window.prompt(`Refund amount (max ₹${remaining.toFixed(2)})`, remaining.toFixed(2)) : remaining.toFixed(2);
    if (raw == null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) { toast.error("Invalid refund amount"); return; }
    const reason = window.prompt("Refund reason", partial ? "Partial refund approved by admin" : "Full order refund") || "Admin refund";
    if (!window.confirm(`Initiate ₹${amount.toFixed(2)} Razorpay refund?`)) return;
    setRefundBusy(true);
    try {
      const keyId = `${order.id}:${amount}:${reason}`;
      const requestKey = refundKeys.get(keyId) || crypto.randomUUID();
      refundKeys.set(keyId, requestKey);
      const data = await requestNativeRefund({orderId:order.id,requestKey,amount,reason},true);
      const refund = data.refund;
      refundKeys.delete(keyId);
      toast.success(refund?.status === "processed" ? "Refund processed" : "Refund initiated; awaiting provider confirmation");
      await fetchOrders(true);
    } catch (e:any) { toast.error(e?.message || "Refund failed"); } finally { setRefundBusy(false); }
  };

  const reconcileRefunds = async () => {
    setRefundBusy(true);
    try {
      const data = await reconcileNativeRefunds();
      toast.success(`Reconciled ${data.updated || 0} refund(s)`);
      await fetchOrders(true);
    } catch(e:any) { toast.error(e?.message || "Reconciliation failed"); }
    finally { setRefundBusy(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard size={22} className="text-blue-500" /> Payments
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{orders.length} total transactions</p>
        </div>
        <div className="flex gap-2">
        <button onClick={reconcileRefunds} disabled={refundBusy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium disabled:opacity-60">Reconcile Refunds</button>
        <button onClick={() => fetchOrders(true)} disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-60">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${paidCount} paid orders`, icon: <TrendingUp size={18} />,
            color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800",
          },
          {
            label: "Pending Amount", value: `₹${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${orders.filter(o => o.payment_status === "pending").length} awaiting payment`,
            icon: <Clock size={18} />, color: "text-yellow-600",
            bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-800",
          },
          {
            label: "Failed Payments", value: String(failedCount),
            sub: "Requires attention", icon: <TrendingDown size={18} />,
            color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800",
          },
          {
            label: "Total Orders", value: String(orders.length),
            sub: "All time", icon: <CreditCard size={18} />,
            color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800",
          },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm ${stat.border}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search order #, email, or payment ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
        </div>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
          <option value="all">All Order Status</option>
          {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                {["Order", "Customer", "Amount", "Method", "Payment", "Order Status", "Date", ""].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <CreditCard size={40} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
                    <p className="font-semibold text-zinc-500">No transactions found</p>
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-zinc-900 dark:text-white text-sm font-mono">#{order.order_number}</p>
                    {order.razorpay_payment_id && (
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate max-w-[120px]">{order.razorpay_payment_id}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 truncate max-w-[160px]">{order.customer_email || "Guest"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-zinc-900 dark:text-white">₹{order.total_amount.toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg capitalize">
                      {order.payment_method || "N/A"}
                    </span>
                  </td>
                  <td className="px-5 py-4"><PaymentPill status={order.payment_status} /></td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ORDER_STATUS_PILLS[order.status] || ORDER_STATUS_PILLS.pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {new Date(order.ordered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.ordered_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors opacity-0 group-hover:opacity-100">
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="h-full w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-white font-mono">#{selectedOrder.order_number}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{new Date(selectedOrder.ordered_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PaymentPill status={selectedOrder.payment_status} />
                  <button onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Order summary */}
                <SectionCard title="Order Summary" icon={<CreditCard size={13} />} accent="green">
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Subtotal", value: selectedOrder.subtotal },
                      { label: "Shipping", value: selectedOrder.shipping_charge },
                      { label: "Installation", value: selectedOrder.installation_total },
                      { label: "Tax", value: selectedOrder.tax_amount },
                    ].filter(r => r.value !== undefined && r.value !== null && (r.value as number) > 0).map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-zinc-500">{row.label}</span>
                        <span className="text-zinc-700 dark:text-zinc-300">₹{(row.value as number).toFixed(2)}</span>
                      </div>
                    ))}
                    {selectedOrder.discount_amount ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Discount</span>
                        <span className="text-emerald-600">−₹{selectedOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white">Total</span>
                      <span className="font-bold text-emerald-600 text-base">₹{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Payment details */}
                <SectionCard title="Payment Details" icon={<ShieldCheck size={13} />} accent="blue">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Method</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100 capitalize">{selectedOrder.payment_method || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Status</span>
                      <PaymentPill status={selectedOrder.payment_status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Order Status</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ORDER_STATUS_PILLS[selectedOrder.status] || ORDER_STATUS_PILLS.pending}`}>
                        {selectedOrder.status}
                      </span>
                    </div>

                    {selectedOrder.razorpay_payment_id && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                        {[
                          { label: "Payment ID", value: selectedOrder.razorpay_payment_id },
                          { label: "Order ID",   value: selectedOrder.razorpay_order_id },
                        ].filter(r => r.value).map(row => (
                          <div key={row.label}>
                            <p className="text-xs text-zinc-400 mb-1">{row.label}</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-2 rounded-xl flex-1 break-all">{row.value}</p>
                              <button onClick={() => { navigator.clipboard.writeText(row.value!); toast.success("Copied!"); }}
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors flex-shrink-0">
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {selectedOrder.razorpay_signature && (
                          <div>
                            <p className="text-xs text-zinc-400 mb-1">Signature</p>
                            <p className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-2 rounded-xl break-all">{selectedOrder.razorpay_signature}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SectionCard>

                {selectedOrder.payment_method === "razorpay" && ["paid","partially_refunded"].includes(selectedOrder.payment_status) && (
                  <SectionCard title="Refund Authority" icon={<TrendingDown size={13} />} accent="slate">
                    <div className="space-y-3">
                      <div className="flex gap-2"><button disabled={refundBusy} onClick={() => requestRefund(selectedOrder,false)} className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">Full Refund</button><button disabled={refundBusy} onClick={() => requestRefund(selectedOrder,true)} className="flex-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50">Partial Refund</button></div>
                      {refunds.filter(r=>r.order_id===selectedOrder.id).map(r=><div key={r.id} className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs"><div className="flex justify-between"><b>₹{Number(r.amount).toFixed(2)} · {r.refund_type}</b><span className={r.status==="failed"?"text-red-600":r.status==="processed"?"text-emerald-600":"text-amber-600"}>{r.status}</span></div>{r.razorpay_refund_id&&<p className="font-mono mt-1 break-all">{r.razorpay_refund_id}</p>}{r.last_error&&<p className="text-red-600 mt-1">{r.last_error}</p>}</div>)}
                    </div>
                  </SectionCard>
                )}

                {/* Timeline */}
                <SectionCard title="Status Timeline" icon={<Clock size={13} />} accent="slate">
                  <div className="relative">
                    <div className="absolute left-3.5 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div className="space-y-4">
                      {[
                        { label: "Order Placed", time: selectedOrder.ordered_at, always: true },
                        { label: "Confirmed",    time: selectedOrder.confirmed_at, always: false },
                        { label: "Shipped",      time: selectedOrder.shipped_at, always: false },
                        { label: "Delivered",    time: selectedOrder.delivered_at, always: false },
                        { label: "Cancelled",    time: selectedOrder.cancelled_at, always: false },
                      ].filter(s => s.always || s.time).map((step, i) => (
                        <div key={step.label} className="flex items-start gap-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white dark:border-zinc-950 ${
                            i === 0 ? "bg-blue-500" : step.label === "Cancelled" ? "bg-red-400" : "bg-emerald-500"
                          }`}>
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          <div className="pt-0.5">
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{step.label}</p>
                            {step.time && <p className="text-xs text-zinc-400 mt-0.5">{new Date(step.time).toLocaleString("en-IN")}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
