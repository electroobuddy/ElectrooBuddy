import { useEffect, useState } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Loader2, Star, MessageSquare,
  ArrowLeft, ChevronRight, Save, Quote, User, Wrench, X
} from "lucide-react";
import { toast } from "sonner";

const emptyTest = { name: "", text: "", rating: 5, service: "" };

// ─── Shared primitives ────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = "slate" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const borders: Record<string, string> = {
    slate: "border-zinc-200 dark:border-zinc-700",
    blue:  "border-blue-100 dark:border-blue-900/40",
    amber: "border-amber-100 dark:border-amber-900/40",
  };
  const dots: Record<string, string> = {
    slate: "bg-zinc-400", blue: "bg-blue-500", amber: "bg-amber-400",
  };
  return (
    <div className={`rounded-2xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm ${borders[accent]}`}>
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

const StarRating = ({ value, onChange }: { value: number; onChange?: (r: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(r => (
      <button key={r} type="button" onClick={() => onChange?.(r)}
        className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}>
        <Star size={onChange ? 20 : 14}
          className={r <= value ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-700"} />
      </button>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AdminTestimonials = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyTest);
  const patch = (u: any) => setForm(prev => ({ ...prev, ...u }));

  const fetchData = async () => {
    const data = await listAdminCatalog<any>("testimonials");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.text) return toast.error("Name and testimonial text required");
    setSaving(true);
    if (editing?.id) {
      await updateAdminCatalog("testimonials", editing.id, form);
      toast.success("Testimonial updated");
    } else {
      await createAdminCatalog("testimonials", form);
      toast.success("Testimonial added");
    }
    setEditing(null); setForm(emptyTest); fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await deleteAdminCatalog("testimonials", id);
    toast.success("Deleted");
    fetchData();
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
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyTest); }}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} /> Testimonials
            </button>
            <ChevronRight size={14} className="text-zinc-300" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {editing?.id ? `Edit: ${editing.name}` : "New Testimonial"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyTest); }}
              className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all font-medium">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2">
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save size={14} />{editing?.id ? "Update" : "Save"}</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: preview */}
          <div className="space-y-5">
            <SectionCard title="Preview" icon={<Quote size={14} />} accent="amber">
              <div className="space-y-3">
                <StarRating value={form.rating} />
                <div className="relative p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                  <Quote size={20} className="text-zinc-200 dark:text-zinc-700 absolute top-3 right-3" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 italic leading-relaxed min-h-[60px]">
                    {form.text || "Testimonial text will appear here…"}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {(form.name || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{form.name || "Customer Name"}</p>
                    {form.service && <p className="text-xs text-zinc-400">{form.service}</p>}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right: fields */}
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Customer Details" icon={<User size={14} />} accent="blue">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer Name</label>
                  <input placeholder="e.g. Rahul Sharma" value={form.name}
                    onChange={e => patch({ name: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Service Used</label>
                  <input placeholder="e.g. Home Wiring, Switch Installation" value={form.service}
                    onChange={e => patch({ service: e.target.value })} className={inputCls} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Review" icon={<MessageSquare size={14} />} accent="slate">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rating</label>
                  <div className="flex items-center gap-3">
                    <StarRating value={form.rating} onChange={r => patch({ rating: r })} />
                    <span className="text-sm font-semibold text-amber-500">{form.rating}/5</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Testimonial Text</label>
                  <textarea placeholder="What did the customer say about your service?"
                    rows={5} value={form.text} onChange={e => patch({ text: e.target.value })}
                    className={`${inputCls} resize-none`} />
                  <p className="text-xs text-zinc-400">{form.text.length} characters</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── GRID VIEW ──
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare size={22} className="text-blue-500" /> Testimonials
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{items.length} customer reviews</p>
        </div>
        <button onClick={() => { setEditing({}); setForm(emptyTest); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {/* Stats bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(items.reduce((s, t) => s + t.rating, 0) / items.length)} />
            <span className="font-bold text-zinc-900 dark:text-white">
              {(items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1)}
            </span>
          </div>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          <p className="text-sm text-zinc-500">Average from {items.length} reviews</p>
          <div className="ml-auto flex gap-4">
            {[5, 4, 3, 2, 1].map(r => {
              const count = items.filter(t => t.rating === r).length;
              return count > 0 ? (
                <div key={r} className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
                  <Star size={11} className="fill-amber-400 text-amber-400" />{r}: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{count}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Cards grid */}
      {items.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-zinc-400">
          <MessageSquare size={44} strokeWidth={1.5} />
          <p className="font-medium text-zinc-600 dark:text-zinc-300">No testimonials yet</p>
          <p className="text-sm">Click "Add Testimonial" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group p-5 flex flex-col">

              {/* Top: rating + actions */}
              <div className="flex items-start justify-between mb-3">
                <StarRating value={t.rating} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(t); setForm({ name: t.name, text: t.text, rating: t.rating, service: t.service || "" }); }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Quote text */}
              <div className="relative flex-1 mb-4">
                <Quote size={20} className="text-zinc-100 dark:text-zinc-800 absolute -top-1 -left-1" />
                <p className="text-sm text-zinc-600 dark:text-zinc-300 italic leading-relaxed line-clamp-4 pl-3">
                  {t.text}
                </p>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{t.name[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{t.name}</p>
                  {t.service && <p className="text-xs text-zinc-400">{t.service}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
