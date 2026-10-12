import { useEffect, useState } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, ChevronRight, Save, Zap, MessageCircle, Phone, Calendar, Settings, Image as ImageIcon, X, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { useAdminCacheInvalidation } from "@/hooks/useOptimizedData";
import { motion, AnimatePresence } from "framer-motion";

const emptyService = {
  title: "", description: "", icon_name: "Zap",
  whatsapp_enabled: true, call_enabled: true, book_now_enabled: true,
  sort_order: 0, image_url: "", service_charge: "", show_visit_charge: false, visit_charge_label: "Visit Charge"
};

// ─── Shared primitives ────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = "blue" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const accents: Record<string, string> = {
    blue:   "border-blue-100 dark:border-blue-900/40",
    violet: "border-violet-100 dark:border-violet-900/40",
    slate:  "border-slate-200 dark:border-slate-700",
    green:  "border-emerald-100 dark:border-emerald-900/40",
  };
  const dots: Record<string, string> = {
    blue: "bg-blue-500", violet: "bg-violet-500", slate: "bg-slate-400", green: "bg-emerald-500",
  };
  return (
    <div className={`rounded-2xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm ${accents[accent]}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-inherit bg-zinc-50/60 dark:bg-zinc-800/40">
        <span className={`w-2 h-2 rounded-full ${dots[accent]}`} />
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <h3 className="font-semibold text-sm tracking-wide text-zinc-700 dark:text-zinc-200 uppercase">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

const FormField = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
    {children}
    {hint && <p className="text-xs text-zinc-400">{hint}</p>}
  </div>
);

const Toggle = ({ id, checked, onChange, label, sub, icon }: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  label: string; sub?: string; icon?: React.ReactNode;
}) => (
  <label htmlFor={id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
    checked ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/20" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
  }`}>
    <div className="relative flex-shrink-0">
      <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className={`w-10 rounded-full transition-colors duration-200 ${checked ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"}`} style={{ height: 22 }}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
      </div>
    </div>
    {icon && <span className={`${checked ? "text-blue-500" : "text-zinc-400"} transition-colors`}>{icon}</span>}
    <div>
      <p className={`text-sm font-semibold transition-colors ${checked ? "text-blue-700 dark:text-blue-300" : "text-zinc-600 dark:text-zinc-300"}`}>{label}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
    {checked && <Check size={14} className="ml-auto text-blue-500 flex-shrink-0" />}
  </label>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AdminServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyService);
  const { invalidateServices, invalidateDashboardStats } = useAdminCacheInvalidation();
  const patch = (u: any) => setForm(prev => ({ ...prev, ...u }));

  const fetchData = async () => {
    const data = await listAdminCatalog<any>("services");
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.description) return toast.error("Title and description required");
    setSaving(true);
    const payload = { ...form, image_url: form.image_url || null };
    if (editing?.id) {
      await updateAdminCatalog("services", editing.id, payload);
      toast.success("Service updated");
    } else {
      await createAdminCatalog("services", payload);
      toast.success("Service added");
    }
    setEditing(null); setForm(emptyService);
    invalidateServices(); invalidateDashboardStats(); fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await deleteAdminCatalog("services", id);
    
    toast.success("Service deleted");
    invalidateServices(); invalidateDashboardStats(); fetchData();
  };

  const startEdit = (s: any) => {
    setEditing(s);
    setForm({ title: s.title, description: s.description, icon_name: s.icon_name,
      whatsapp_enabled: s.whatsapp_enabled, call_enabled: s.call_enabled,
      book_now_enabled: s.book_now_enabled, sort_order: s.sort_order, image_url: s.image_url || "",
      service_charge: s.service_charge || "", show_visit_charge: s.show_visit_charge || false,
      visit_charge_label: s.visit_charge_label || "Visit Charge" });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  // ── FORM VIEW ──
  if (editing !== null) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyService); }}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} /> Services
            </button>
            <ChevronRight size={14} className="text-zinc-300" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {editing?.id ? `Edit: ${editing.title}` : "New Service"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyService); }}
              className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all font-medium">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2">
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : <><Save size={14} />{editing?.id ? "Update Service" : "Save Service"}</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Service Image" icon={<ImageIcon size={14} />} accent="violet">
              <ImageUpload
                folder="services"
                currentUrl={form.image_url || null}
                onUpload={(url) => patch({ image_url: url })}
                onRemove={() => patch({ image_url: "" })}
              />
            </SectionCard>

            <SectionCard title="Service Details" icon={<Zap size={14} />} accent="blue">
              <div className="space-y-4">
                <FormField label="Title">
                  <input placeholder="e.g. Electrical Installation" value={form.title}
                    onChange={e => patch({ title: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="Description">
                  <textarea placeholder="Describe what this service includes…" rows={4}
                    value={form.description} onChange={e => patch({ description: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Icon Name" hint="Lucide icon name e.g. Zap, Plug, Wrench">
                    <input placeholder="Zap" value={form.icon_name}
                      onChange={e => patch({ icon_name: e.target.value })} className={inputCls} />
                  </FormField>
                  <FormField label="Sort Order" hint="Lower = appears first">
                    <input type="number" value={form.sort_order}
                      onChange={e => patch({ sort_order: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </FormField>
                </div>
                <FormField label="Service/Visit Charge (₹)" hint="Leave empty if no charge. This is the visit/service fee.">
                  <input type="number" placeholder="e.g. 400" value={form.service_charge}
                    onChange={e => patch({ service_charge: e.target.value })} className={inputCls} />
                </FormField>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title="Contact Options" icon={<Phone size={14} />} accent="green">
              <div className="space-y-3">
                <Toggle id="whatsapp_enabled" checked={form.whatsapp_enabled} onChange={v => patch({ whatsapp_enabled: v })}
                  label="WhatsApp" sub="Allow WhatsApp enquiries" icon={<MessageCircle size={16} />} />
                <Toggle id="call_enabled" checked={form.call_enabled} onChange={v => patch({ call_enabled: v })}
                  label="Call" sub="Allow phone call enquiries" icon={<Phone size={16} />} />
                <Toggle id="book_now_enabled" checked={form.book_now_enabled} onChange={v => patch({ book_now_enabled: v })}
                  label="Book Now" sub="Show booking button" icon={<Calendar size={16} />} />
              </div>
            </SectionCard>

            <SectionCard title="Charge Display" icon={<Settings size={14} />} accent="violet">
              <div className="space-y-3">
                <Toggle id="show_visit_charge" checked={form.show_visit_charge} onChange={v => patch({ show_visit_charge: v })}
                  label="Show Visit Charge" sub="Display charge on service card" icon={<Eye size={16} />} />
                {form.show_visit_charge && (
                  <FormField label="Charge Label" hint="e.g., Visit Charge, Service Charge, Diagnostic Fee">
                    <input placeholder="Visit Charge" value={form.visit_charge_label}
                      onChange={e => patch({ visit_charge_label: e.target.value })} className={inputCls} />
                  </FormField>
                )}
              </div>
            </SectionCard>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Zap size={22} className="text-blue-500" /> Services
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{services.length} services configured</p>
        </div>
        <button onClick={() => { setEditing({}); setForm(emptyService); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.length === 0 ? (
          <div className="col-span-3 py-20 flex flex-col items-center gap-4 text-zinc-400">
            <Zap size={44} strokeWidth={1.5} />
            <p className="font-medium text-zinc-600 dark:text-zinc-300">No services yet</p>
            <p className="text-sm">Click "Add Service" to get started</p>
          </div>
        ) : services.map((s) => (
          <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            {/* Image */}
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
              {s.image_url
                ? <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full flex items-center justify-center"><Zap size={32} className="text-zinc-300" /></div>}
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(s)}
                  className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 rounded-xl shadow-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-zinc-200">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 rounded-xl shadow-md hover:bg-red-50 hover:text-red-600 transition-colors border border-zinc-200">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{s.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{s.description}</p>

              {/* Enabled buttons */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {s.whatsapp_enabled && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full">
                    <MessageCircle size={10} /> WhatsApp
                  </span>
                )}
                {s.call_enabled && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full">
                    <Phone size={10} /> Call
                  </span>
                )}
                {s.book_now_enabled && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-full">
                    <Calendar size={10} /> Book Now
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminServices;
