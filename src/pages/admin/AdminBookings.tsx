import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listNativeAdminBookings, getNativeAdminBooking, listNativeAvailableTechnicians, assignNativeBooking, unassignNativeBooking, transitionNativeAdminBooking, updateNativeAdminBookingOperational, archiveNativeAdminBooking } from "@/lib/nativeBooking";
import type { NativeBooking, NativeTechnician, BookingStatus } from "@/lib/apiContracts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Pencil, Trash2, X, Eye, Calendar, Clock, Phone,
  MapPin, Search, Download, User, Wrench, AlignLeft, Check,
  CalendarDays, Filter, ChevronRight, Save, CheckCircle, UserCheck, Tag, MessageCircle, PhoneCall,
  ShieldCheck, Percent, Ticket, CheckSquare, Square, XSquare
} from "lucide-react";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  pending:   { label: "Pending",   pill: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",  dot: "bg-yellow-400" },
  assigned:  { label: "Assigned",  pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800", dot: "bg-indigo-500" },
  confirmed: { label: "Confirmed", pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",              dot: "bg-blue-500" },
  completed: { label: "Completed", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",                    dot: "bg-red-400" },
};

const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
    </span>
  );
};

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40">
      <span className="w-2 h-2 rounded-full bg-zinc-400 flex-shrink-0" />
      <span className="text-zinc-400">{icon}</span>
      <h3 className="font-semibold text-xs tracking-wide text-zinc-600 dark:text-zinc-300 uppercase">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

// ─── Main component ───────────────────────────────────────────────────────────

const AdminBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<NativeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<NativeBooking | null>(null);
  const [editing, setEditing] = useState<NativeBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigningTechnician, setAssigningTechnician] = useState<string | null>(null);
  const [availableTechnicians, setAvailableTechnicians] = useState<Array<NativeTechnician & { todayCount:number }>>([]);
  const [editForm, setEditForm] = useState({
    name: "", phone: "", email: "", address: "", service_type: "",
    preferred_date: "", preferred_time: "", description: "", status: "pending",
    exact_location: "", custom_service_demand: "", is_switch_working: "",
    has_old_fan: "", is_electricity_supply_on: "", assigned_technician_id: "",
    // Coupon fields
    coupon_code: "", offer_applied: false, discount_amount: "", 
    original_amount: "", final_amount: ""
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const patchEdit = (u: any) => setEditForm(prev => ({ ...prev, ...u }));

  const fetchData = async () => {
    try {
      const data = await listNativeAdminBookings(filter && filter !== "all" ? filter : undefined);
      setBookings(data || []);
    } catch (error:any) { logger.error(error); toast.error(error?.message || "Failed to load bookings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  // Fetch available technicians when viewing a booking
  useEffect(() => {
    if (viewing) {
      fetchAvailableTechnicians();
    }
  }, [viewing]);

  const updateStatus = async (id: string, newStatus: BookingStatus) => {
    try { await transitionNativeAdminBooking(id, newStatus); }
    catch (error:any) { return toast.error(error.message || "Status update failed"); }
    toast.success("Status updated"); await fetchData();
    if (viewing?.id === id) setViewing(await getNativeAdminBooking(id));
  };

  const handleEdit = (b: NativeBooking) => {
    setEditing(b);
    setEditForm(prev => ({ 
      ...prev,
      name: b.name, 
      phone: b.phone, 
      email: b.email || "", 
      address: b.address, 
      service_type: b.service_type,
      preferred_date: b.preferred_date, 
      preferred_time: b.preferred_time,
      description: b.description || "", 
      status: b.status,
      exact_location: b.exact_location || "",
      custom_service_demand: b.custom_service_demand || "",
      is_switch_working: b.is_switch_working || "",
      has_old_fan: b.has_old_fan || "",
      is_electricity_supply_on: b.is_electricity_supply_on || "",
      assigned_technician_id: b.assigned_technician_id || "",
      // Coupon fields
      coupon_code: b.coupon_code || "",
      offer_applied: b.offer_applied || false,
      discount_amount: b.discount_amount?.toString() || "",
      original_amount: b.original_amount?.toString() || "",
      final_amount: b.final_amount?.toString() || ""
    }));
  };

  const handleSaveEdit = async () => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      await updateNativeAdminBookingOperational(editing.id, {
        name: editForm.name, phone: editForm.phone, email: editForm.email, address: editForm.address,
        preferredDate: editForm.preferred_date, preferredTime: editForm.preferred_time,
        description: editForm.description || null, exactLocation: editForm.exact_location || null,
        customServiceDemand: editForm.custom_service_demand || null,
        isSwitchWorking: editForm.is_switch_working || null, hasOldFan: editForm.has_old_fan || null,
        isElectricitySupplyOn: editForm.is_electricity_supply_on || null,
      });
      if (editForm.status !== editing.status) await transitionNativeAdminBooking(editing.id, editForm.status);
      const nextTech = editForm.assigned_technician_id || null;
      if (nextTech !== (editing.assigned_technician_id || null)) {
        if (nextTech) await assignNativeBooking(editing.id, nextTech); else await unassignNativeBooking(editing.id);
      }
      toast.success("Booking updated"); setEditing(null); await fetchData();
    } catch(error:any) { toast.error(error.message || "Booking update failed"); }
    finally { setSaving(false); }
  };

  const fetchAvailableTechnicians = async () => {
    try { const today = new Date().toISOString().split("T")[0]; const data = await listNativeAvailableTechnicians(today); setAvailableTechnicians((data || []).map((tech:any)=>({...tech,todayCount:Number(tech.today_count||0)}))); }
    catch (error) { logger.error("Failed to fetch technicians:", error); setAvailableTechnicians([]); }
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string) => {
    if (!technicianId) return; setAssigningTechnician(bookingId);
    try { await assignNativeBooking(bookingId, technicianId); toast.success("Technician assigned successfully"); await fetchData(); if(viewing?.id===bookingId)setViewing(await getNativeAdminBooking(bookingId)); }
    catch(error:any){logger.error(error);toast.error(error.message||"Failed to assign technician");} finally{setAssigningTechnician(null);}
  };

  const handleUnassignTechnician = async (bookingId: string) => {
    if (!confirm("Unassign technician from this booking?")) return;
    try { await unassignNativeBooking(bookingId); toast.success("Technician unassigned"); await fetchData(); if(viewing?.id===bookingId)setViewing(await getNativeAdminBooking(bookingId)); }
    catch(error:any){logger.error(error);toast.error(error.message||"Failed to unassign technician");}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this completed/cancelled booking?")) return;
    try { await archiveNativeAdminBooking(id); toast.success("Booking archived"); setViewing(null); await fetchData(); }
    catch(error:any){toast.error(error.message||"Only completed or cancelled bookings can be archived");}
  };

  const handleBulkDelete = async () => {
    const ids=Array.from(selectedIds); if(!ids.length||!confirm(`Archive ${ids.length} completed/cancelled booking(s)?`))return;
    let ok=0,failed=0; for(const id of ids){try{await archiveNativeAdminBooking(id);ok++;}catch{failed++;}}
    setSelectedIds(new Set()); await fetchData(); if(ok)toast.success(`${ok} booking(s) archived`); if(failed)toast.error(`${failed} booking(s) could not be archived`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(b => b.id)));
    }
  };

  const exportCSV = () => {
    if (!bookings.length) return;
    const headers = ["Name", "Phone", "Address", "Service", "Date", "Time", "Description", "Status", "Original Amount", "Discount Amount", "Final Amount", "Coupon Code", "Subscription Benefit", "Subscription Discount"];
    const rows = bookings.map(b => [b.name, b.phone, b.address, b.service_type, b.preferred_date, b.preferred_time, b.description || "", b.status, b.original_amount || "", b.discount_amount || "", b.final_amount || "", b.coupon_code || "", b.subscription_benefit_used || "", b.subscription_discount || ""]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "bookings.csv"; a.click();
  };

  const filtered = bookings.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.service_type.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search) ||
    (b.email && b.email.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {} as Record<string, number>);

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
            <CalendarDays size={22} className="text-blue-500" /> Bookings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{bookings.length} total bookings</p>
        </div>
        <button onClick={exportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-sm rounded-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm ${
            filter === "all" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300"
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">All</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{bookings.length}</p>
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key}
            onClick={() => setFilter(filter === key ? "all" : key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm ${
              filter === key ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300"
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{cfg.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{counts[key] || 0}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, service, phone, or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Bookings table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedIds(new Set())}
                className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors">
                <XSquare size={16} />
              </button>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {selectedIds.size} selected
              </span>
            </div>
            <button onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                <th className="px-4 py-3.5 text-left w-10">
                  <button onClick={toggleSelectAll}
                    className="flex items-center justify-center w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 hover:border-blue-400 transition-colors">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={14} className="text-blue-600" />
                    ) : selectedIds.size > 0 ? (
                      <div className="w-2.5 h-0.5 bg-blue-600 rounded" />
                    ) : (
                      <Square size={14} className="text-zinc-400" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Service</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Date & Time</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Amount</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <CalendarDays size={40} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
                    <p className="font-semibold text-zinc-500">No bookings found</p>
                  </td>
                </tr>
              ) : filtered.map(b => (
                <tr key={b.id} className={`group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors ${
                  selectedIds.has(b.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(b.id)}
                      className="flex items-center justify-center w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 hover:border-blue-400 transition-colors">
                      {selectedIds.has(b.id) ? (
                        <CheckSquare size={14} className="text-blue-600" />
                      ) : (
                        <Square size={14} className="text-zinc-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{b.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1"><Phone size={10} />{b.phone}</p>
                    {b.email && (
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1 truncate max-w-[180px]"><MapPin size={10} style={{transform: "rotate(90deg)"}} />{b.email}</p>
                    )}
                    {b.technician_name && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1"><UserCheck size={10} />{b.technician_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                      {b.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar size={12} className="text-zinc-400" />{b.preferred_date}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <Clock size={10} />{b.preferred_time}
                    </p>
                  </td>
                  <td className="px-4 py-4"><StatusPill status={b.status} /></td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="text-xs">
                      {b.subscription_benefit_used && (
                        <div className="mb-1 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
                          <ShieldCheck size={10} />
                          {b.subscription_benefit_used === "service_call" ? "Free Call" : "Parts %"}
                          {b.subscription_discount > 0 && <span className="font-semibold"> -₹{b.subscription_discount}</span>}
                        </div>
                      )}
                      {b.offer_applied ? (
                        <div className="space-y-0.5">
                          <span className="text-zinc-400 line-through">₹{b.original_amount}</span>
                          <span className="text-green-600 font-medium ml-1">-₹{b.discount_amount}</span>
                          <div className="font-bold text-zinc-900 dark:text-white">₹{b.final_amount}</div>
                        </div>
                      ) : b.final_amount > 0 ? (
                        <span className="font-bold text-zinc-900 dark:text-white">₹{b.final_amount}</span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-zinc-400 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-200">
                        <MessageCircle size={14} />
                      </a>
                      <a href={`tel:${b.phone}`}
                        className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200">
                        <PhoneCall size={14} />
                      </a>
                      <button onClick={() => navigate(`/admin/bookings/${b.id}`)}
                        className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleEdit(b)}
                        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors border border-transparent hover:border-zinc-200">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(b.id)}
                        className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Detail Drawer ── */}
      <AnimatePresence>
        {viewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
            onClick={() => setViewing(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="h-full w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-white">Booking Details</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{new Date(viewing.created_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={viewing.status} />
                  <button onClick={() => setViewing(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Status update */}
                <SectionCard title="Update Status" icon={<Check size={13} />}>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button key={key}
                        onClick={() => updateStatus(viewing.id, key)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          viewing.status === key
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />{cfg.label}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {/* Technician Assignment */}
                <SectionCard title="Technician Assignment" icon={<UserCheck size={13} />}>
                  <div className="space-y-3">
                    {viewing.assigned_technician_id ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                              <UserCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">
                                {viewing.technician_name || "Assigned to Technician"}
                              </p>
                              {viewing.technician_phone && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                                  <Phone size={10} />{viewing.technician_phone}
                                </p>
                              )}
                              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {viewing.assigned_at ? new Date(viewing.assigned_at).toLocaleString("en-IN") : "Assigned"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {viewing.technician_phone && (
                              <>
                                <a href={`https://wa.me/${viewing.technician_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                                  className="p-2 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                                  <MessageCircle size={14} />
                                </a>
                                <a href={`tel:${viewing.technician_phone}`}
                                  className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-emerald-500 hover:text-blue-600 transition-colors">
                                  <PhoneCall size={14} />
                                </a>
                              </>
                            )}
                            <button onClick={() => handleUnassignTechnician(viewing.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                              Unassign
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-zinc-500 block">Assign Technician</label>
                        {availableTechnicians.length === 0 ? (
                          <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm text-zinc-500">No technicians available with capacity</p>
                            <p className="text-[10px] text-zinc-400 mt-1">All active technicians have reached their daily limit</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {availableTechnicians.map((tech: any) => (
                              <button key={tech.id}
                                onClick={() => handleAssignTechnician(viewing.id, tech.id)}
                                disabled={assigningTechnician === viewing.id}
                                className="w-full p-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all text-left group">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                                      {tech.profile_url ? (
                                        <img src={tech.profile_url} alt={tech.name} className="w-full h-full object-cover rounded-full" />
                                      ) : (
                                        <User size={16} className="text-blue-600 dark:text-blue-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{tech.name}</p>
                                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        {tech.phone && <span className="flex items-center gap-0.5"><Phone size={9} />{tech.phone}</span>}
                                      </div>
                                      {tech.skills && tech.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          {tech.skills.slice(0, 3).map((s: string, i: number) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] rounded">
                                              {s}
                                            </span>
                                          ))}
                                          {tech.skills.length > 3 && (
                                            <span className="px-1.5 py-0.5 text-zinc-400 text-[10px]">+{tech.skills.length - 3}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                      <p className={`text-sm font-bold ${tech.todayCount >= tech.daily_limit ? "text-red-500" : "text-emerald-600"}`}>
                                        {tech.todayCount}/{tech.daily_limit}
                                      </p>
                                      <p className="text-[10px] text-zinc-400 uppercase">Today</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-violet-600">{tech.priority}</p>
                                      <p className="text-[10px] text-zinc-400 uppercase">Priority</p>
                                    </div>
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <UserCheck size={14} className="text-blue-600" />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-400">Shows active & approved technicians with available daily capacity</p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Customer info */}
                <SectionCard title="Customer" icon={<User size={13} />}>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{viewing.name}</p>
                        <p className="text-zinc-500 flex items-center gap-1"><Phone size={11} />{viewing.phone}</p>
                        {viewing.email && (
                          <p className="text-zinc-500 flex items-center gap-1 mt-0.5"><MapPin size={11} style={{transform: "rotate(90deg)"}} />{viewing.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1"><MapPin size={11} />Address</p>
                      <p className="text-zinc-700 dark:text-zinc-200">{viewing.address}</p>
                    </div>
                    {viewing.exact_location && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1"><MapPin size={11} />Exact Location</p>
                        <p className="text-zinc-700 dark:text-zinc-200">{viewing.exact_location}</p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Booking details */}
                <SectionCard title="Booking Details" icon={<Wrench size={13} />}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1">Service</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{viewing.service_type}</p>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1">Date</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{viewing.preferred_date}</p>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1">Time</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{viewing.preferred_time}</p>
                    </div>
                  </div>
                  {viewing.description && (
                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1"><AlignLeft size={11} />Description</p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{viewing.description}</p>
                    </div>
                  )}
                  {viewing.custom_service_demand && (
                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1"><Wrench size={11} />Custom Service Demand</p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{viewing.custom_service_demand}</p>
                    </div>
                  )}
                  {/* Fan Installation Details */}
                  {(viewing.is_switch_working || viewing.has_old_fan || viewing.is_electricity_supply_on) && (
                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Fan Installation Details</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {viewing.is_switch_working && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-blue-500" />
                            <span className="text-zinc-600 dark:text-zinc-300">Switch Working: <strong>{viewing.is_switch_working === 'yes' ? 'Yes' : 'No'}</strong></span>
                          </div>
                        )}
                        {viewing.has_old_fan && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-blue-500" />
                            <span className="text-zinc-600 dark:text-zinc-300">Old Fan Present: <strong>{viewing.has_old_fan === 'yes' ? 'Yes' : 'No'}</strong></span>
                          </div>
                        )}
                        {viewing.is_electricity_supply_on && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-blue-500" />
                            <span className="text-zinc-600 dark:text-zinc-300">Electricity On: <strong>{viewing.is_electricity_supply_on === 'yes' ? 'Yes' : 'No'}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Coupon/Offer Details */}
                {viewing.offer_applied && (
                  <SectionCard title="Offer Applied" icon={<Tag size={13} />}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                          <Tag size={18} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 dark:text-green-300">{viewing.coupon_code || 'Offer Applied'}</p>
                          {viewing.discount_amount > 0 && (
                            <p className="text-xs text-green-700 dark:text-green-400">
                              Saved ₹{viewing.discount_amount}
                            </p>
                          )}
                        </div>
                      </div>
                      {(viewing.original_amount || viewing.final_amount) && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center">
                            <p className="text-xs text-zinc-400">Original</p>
                            <p className="font-semibold text-zinc-600 line-through">₹{viewing.original_amount}</p>
                          </div>
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center">
                            <p className="text-xs text-zinc-400">Discount</p>
                            <p className="font-semibold text-green-600">-₹{viewing.discount_amount}</p>
                          </div>
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center">
                            <p className="text-xs text-zinc-400">Final</p>
                            <p className="font-semibold text-green-700">₹{viewing.final_amount}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* Subscription Benefit */}
                {viewing.subscription_benefit_used && (
                  <SectionCard title="Subscription Benefit" icon={<ShieldCheck size={13} />}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                          <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 dark:text-blue-300">
                            {viewing.subscription_benefit_used === "service_call" ? "Free Service Call" : "Parts Discount"}
                          </p>
                          {viewing.subscription_discount > 0 && (
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              Discount: ₹{viewing.subscription_discount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={() => { setViewing(null); handleEdit(viewing); }}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit Booking
                  </button>
                  <button onClick={() => { if (confirm("Delete this booking?")) { handleDelete(viewing.id); setViewing(null); } }}
                    className="px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-sm transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Drawer ── */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
            onClick={() => setEditing(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="h-full w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-white">Edit Booking</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{editing.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(null)}
                    className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-50 transition-all font-medium">
                    Discard
                  </button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-60">
                    {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : <><Save size={13} />Save</>}
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <SectionCard title="Customer Details" icon={<User size={13} />}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Name</label>
                      <input placeholder="Full name" value={editForm.name} onChange={e => patchEdit({ name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Email</label>
                      <input placeholder="email@example.com" type="email" value={editForm.email} onChange={e => patchEdit({ email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Phone</label>
                      <input placeholder="Phone number" value={editForm.phone} onChange={e => patchEdit({ phone: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Address</label>
                      <input placeholder="Full address" value={editForm.address} onChange={e => patchEdit({ address: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Booking Details" icon={<Wrench size={13} />}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Service Type</label>
                      <input placeholder="e.g. Electrical Installation" value={editForm.service_type} onChange={e => patchEdit({ service_type: e.target.value })} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Date</label>
                        <input type="date" value={editForm.preferred_date} onChange={e => patchEdit({ preferred_date: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Time</label>
                        <input type="time" value={editForm.preferred_time} onChange={e => patchEdit({ preferred_time: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Description</label>
                      <textarea placeholder="Notes or details…" rows={3} value={editForm.description}
                        onChange={e => patchEdit({ description: e.target.value })}
                        className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Status" icon={<Check size={13} />}>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button"
                        onClick={() => patchEdit({ status: key })}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          editForm.status === key
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />{cfg.label}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Coupon/Offer Details" icon={<Tag size={13} />}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="offer_applied"
                        checked={editForm.offer_applied}
                        onChange={e => patchEdit({ offer_applied: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="offer_applied" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Offer/Coupon Applied
                      </label>
                    </div>
                    
                    {editForm.offer_applied && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Coupon Code</label>
                          <input
                            placeholder="e.g. SUMMER20"
                            value={editForm.coupon_code}
                            onChange={e => patchEdit({ coupon_code: e.target.value })} disabled title="Financial fields are server-authoritative and read-only"
                            className={inputCls}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Original Amount</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.original_amount}
                              onChange={e => patchEdit({ original_amount: e.target.value })} disabled title="Financial fields are server-authoritative and read-only"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Discount Amount</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.discount_amount}
                              onChange={e => patchEdit({ discount_amount: e.target.value })} disabled title="Financial fields are server-authoritative and read-only"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Final Amount</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={editForm.final_amount}
                              onChange={e => patchEdit({ final_amount: e.target.value })} disabled title="Financial fields are server-authoritative and read-only"
                              className={inputCls}
                            />
                          </div>
                        </div>
                      </>
                    )}
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

export default AdminBookings;