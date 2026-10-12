import { useEffect, useState } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, ChevronRight, Save, Users, User, Briefcase, AlignLeft, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { motion, AnimatePresence } from "framer-motion";

const emptyMember = { name: "", role: "", bio: "", sort_order: 0, photo_url: "" };

// ─── Shared primitives ────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = "blue" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const accents: Record<string, string> = {
    blue:   "border-blue-100 dark:border-blue-900/40",
    violet: "border-violet-100 dark:border-violet-900/40",
    slate:  "border-slate-200 dark:border-slate-700",
  };
  const dots: Record<string, string> = {
    blue: "bg-blue-500", violet: "bg-violet-500", slate: "bg-slate-400",
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

// ─── Main component ───────────────────────────────────────────────────────────

const AdminTeam = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyMember);
  const patch = (u: any) => setForm(prev => ({ ...prev, ...u }));

  const fetchData = async () => {
    const data = await listAdminCatalog<any>("team");
    setMembers((data || []).map((x:any)=>({...x,image_url:x.photo_url??null,is_active:true,social_links:null})));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.role) return toast.error("Name and role required");
    setSaving(true);
    const payload = { ...form, photo_url: form.photo_url || null };
    if (editing?.id) {
      await updateAdminCatalog("team", editing.id, payload);
      toast.success("Member updated");
    } else {
      await createAdminCatalog("team", payload);
      toast.success("Member added");
    }
    setEditing(null); setForm(emptyMember); fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    await deleteAdminCatalog("team", id);
    toast.success("Member deleted");
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
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyMember); }}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} /> Team
            </button>
            <ChevronRight size={14} className="text-zinc-300" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {editing?.id ? `Edit: ${editing.name}` : "New Team Member"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyMember); }}
              className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all font-medium">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2">
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save size={14} />{editing?.id ? "Update Member" : "Save Member"}</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Photo */}
          <div className="lg:col-span-1 space-y-5">
            <SectionCard title="Photo" icon={<User size={14} />} accent="violet">
              <div className="space-y-4">
                <ImageUpload
                  folder="team"
                  currentUrl={form.photo_url || null}
                  onUpload={(url) => patch({ photo_url: url })}
                  onRemove={() => patch({ photo_url: "" })}
                />
                {/* Avatar preview */}
                {form.photo_url && (
                  <div className="flex justify-center pt-2">
                    <div className="relative">
                      <img src={form.photo_url} alt="Preview"
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/40 shadow-md" />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                        <User size={12} className="text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Settings" icon={<ArrowUpDown size={14} />} accent="slate">
              <FormField label="Sort Order" hint="Lower = appears first">
                <input type="number" value={form.sort_order}
                  onChange={e => patch({ sort_order: parseInt(e.target.value) || 0 })}
                  className={inputCls} placeholder="0" />
              </FormField>
            </SectionCard>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Member Information" icon={<Users size={14} />} accent="blue">
              <div className="space-y-4">
                <FormField label="Full Name">
                  <input placeholder="e.g. Rahul Sharma" value={form.name}
                    onChange={e => patch({ name: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="Role / Designation">
                  <input placeholder="e.g. Senior Electrician" value={form.role}
                    onChange={e => patch({ role: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="Bio" hint="A short introduction about this team member">
                  <textarea placeholder="Briefly describe their background and expertise…"
                    rows={5} value={form.bio}
                    onChange={e => patch({ bio: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </FormField>
              </div>
            </SectionCard>

            {/* Preview card */}
            {(form.name || form.role) && (
              <SectionCard title="Preview" icon={<User size={14} />} accent="slate">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                    {form.photo_url
                      ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><User size={22} className="text-zinc-400" /></div>}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{form.name || "Name"}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{form.role || "Role"}</p>
                    {form.bio && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{form.bio}</p>}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── GRID VIEW ──
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users size={22} className="text-blue-500" /> Team Members
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{members.length} members on your team</p>
        </div>
        <button onClick={() => { setEditing({}); setForm(emptyMember); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.length === 0 ? (
          <div className="col-span-4 py-20 flex flex-col items-center gap-4 text-zinc-400">
            <Users size={44} strokeWidth={1.5} />
            <p className="font-medium text-zinc-600 dark:text-zinc-300">No team members yet</p>
            <p className="text-sm">Click "Add Member" to build your team</p>
          </div>
        ) : members.map((m) => (
          <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden group">

            {/* Top color strip + avatar */}
            <div className="h-16 bg-gradient-to-br from-blue-500 to-violet-600 relative">
              <div className="absolute -bottom-7 left-5">
                <div className="w-14 h-14 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-md">
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User size={22} className="text-zinc-400" /></div>}
                </div>
              </div>
              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(m); setForm({ name: m.name, role: m.role, bio: m.bio || "", sort_order: m.sort_order, photo_url: m.photo_url || "" }); }}
                  className="p-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(m.id)}
                  className="p-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-red-500/80 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="pt-9 px-5 pb-5">
              <h3 className="font-bold text-zinc-900 dark:text-white">{m.name}</h3>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{m.role}</p>
              {m.bio && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed line-clamp-3">{m.bio}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminTeam;
