import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listNativeAdminReturns, inspectNativeReturn, resolveNativeReturn, approveNativeReturn, setNativeReturnStatus } from "@/lib/nativeReturns";
import type { NativeReturn, NativeReturnItem } from "@/lib/apiContracts";

export default function AdminReturns() {
  const [rows, setRows] = useState<NativeReturn[]>([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setLoading(true); setRows(await listNativeAdminReturns()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load returns"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const act = async (row: NativeReturn, fn: () => Promise<NativeReturn>, ok: string) => {
    setBusy(row.id);
    try { await fn(); toast.success(ok); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Operation failed"); }
    finally { setBusy(""); }
  };

  const inspect = async (row: NativeReturn) => {
    const items = row.items ?? [];
    const raw = window.prompt("Accepted quantities, comma-separated in displayed item order", items.map(item => item.quantity).join(","));
    if (raw == null) return;
    const quantities = raw.split(",").map(Number);
    if (quantities.some(value => !Number.isFinite(value) || value < 0)) { toast.error("Enter valid non-negative quantities"); return; }
    const accept = items.map((item: NativeReturnItem, index) => ({
      returnItemId: item.id,
      acceptedQuantity: Math.max(0, Math.min(item.quantity, quantities[index] ?? 0)),
    }));
    await act(row, () => inspectNativeReturn(row.id, accept), "Inspection recorded; accepted quantities were restocked.");
  };

  const resolve = (row: NativeReturn) => act(row, () => resolveNativeReturn(row.id), row.status === "refund_pending" ? "Refund handed to native refund authority" : "Replacement authorized");

  if (loading) return <div className="p-6">Loading returns…</div>;
  return <div className="p-6 max-w-7xl mx-auto">
    <div className="flex items-center justify-between gap-3 mb-6"><div><h1 className="text-2xl font-bold">Returns / RTO Worklist</h1><p className="text-muted-foreground mt-1">Physical receipt and inspection control inventory and post-shipment financial authority.</p></div><button className="btn-secondary" onClick={() => void load()}>Refresh</button></div>
    <div className="space-y-3">{rows.map(row => <div key={row.id} className="border rounded-xl p-4 bg-card">
      <div className="flex justify-between gap-4"><div><b>{String(row.return_type).toUpperCase()}</b><p className="text-sm text-muted-foreground">{row.order_number ? `#${row.order_number} · ` : ""}{row.reason || "No reason"} · {row.requested_at ? new Date(row.requested_at).toLocaleString() : "—"}</p></div><span className="text-sm font-semibold">{row.status}</span></div>
      <div className="mt-3 text-sm">{row.items?.map(item => <div key={item.id}>Qty {item.quantity} · {item.resolution} · accepted {item.accepted_quantity ?? 0} · restocked {item.restocked_quantity ?? 0}</div>)}</div>
      <div className="flex flex-wrap gap-2 mt-4">
        {row.status === "requested" && <button disabled={busy === row.id} onClick={() => void act(row, () => approveNativeReturn(row.id), "Return approved")} className="px-3 py-2 border rounded-lg text-sm">Approve</button>}
        {row.status === "approved" && <button disabled={busy === row.id} onClick={() => void act(row, () => setNativeReturnStatus(row.id, row.return_type === "rto" ? "rto_in_transit" : "pickup_pending"), "Logistics status updated")} className="px-3 py-2 border rounded-lg text-sm">Start Pickup/RTO</button>}
        {["pickup_pending","in_transit","rto_in_transit"].includes(row.status) && <button disabled={busy === row.id} onClick={() => void act(row, () => setNativeReturnStatus(row.id, row.return_type === "rto" ? "rto_received" : "received"), "Physical receipt recorded")} className="px-3 py-2 border rounded-lg text-sm">Mark Received</button>}
        {["received","rto_received"].includes(row.status) && <button disabled={busy === row.id} onClick={() => void inspect(row)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Inspect</button>}
        {["refund_pending","replacement_pending"].includes(row.status) && <button disabled={busy === row.id} onClick={() => void resolve(row)} className="px-3 py-2 border rounded-lg text-sm">Process Resolution</button>}
      </div>
    </div>)}{!rows.length && <div className="border rounded-xl p-8 text-center text-muted-foreground">No return/RTO records.</div>}</div>
  </div>;
}
