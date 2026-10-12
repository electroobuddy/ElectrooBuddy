import { useEffect, useState } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, ChevronRight, Save, FolderKanban, Image as ImageIcon, Tag, AlignLeft, Search, Grid, List, Eye } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { useAdminCacheInvalidation } from "@/hooks/useOptimizedData";
import { motion, AnimatePresence } from "framer-motion";

const emptyProject = { title: "", description: "", category: "", image_url: "" };

const CATEGORY_COLORS: Record<string, string> = {
  residential:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  commercial:   "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
  industrial:   "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  default:      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const getCategoryColor = (cat: string) =>
  CATEGORY_COLORS[cat?.toLowerCase()] || CATEGORY_COLORS.default;

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

// ─── Main component ───────────────────────────────────────────────────────────

const AdminProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { invalidateProjects, invalidateDashboardStats } = useAdminCacheInvalidation();
  const patch = (u: any) => setForm(prev => ({ ...prev, ...u }));

  const fetchData = async () => {
    const data = await listAdminCatalog<any>("projects");
    setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.description || !form.category) return toast.error("All fields required");
    setSaving(true);
    const payload = { ...form, image_url: form.image_url || null };
    if (editing?.id) {
      await updateAdminCatalog("projects", editing.id, payload);
      toast.success("Project updated");
    } else {
      await createAdminCatalog("projects", payload);
      toast.success("Project added");
    }
    setEditing(null); setForm(emptyProject);
    invalidateProjects(); invalidateDashboardStats(); fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await deleteAdminCatalog("projects", id);
    toast.success("Project deleted");
    invalidateProjects(); invalidateDashboardStats(); fetchData();
  };

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Unique categories for filter pills
  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

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
            <button type="button" onClick={() => { setEditing(null); setForm(emptyProject); }}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={16} /> Projects
            </button>
            <ChevronRight size={14} className="text-zinc-300" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {editing?.id ? `Edit: ${editing.title}` : "New Project"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setForm(emptyProject); }}
              className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all font-medium">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2">
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save size={14} />{editing?.id ? "Update Project" : "Save Project"}</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Image */}
          <div className="space-y-5">
            <SectionCard title="Project Image" icon={<ImageIcon size={14} />} accent="violet">
              <ImageUpload
                folder="projects"
                currentUrl={form.image_url || null}
                onUpload={(url) => patch({ image_url: url })}
                onRemove={() => patch({ image_url: "" })}
              />
            </SectionCard>

            {/* Live card preview */}
            <SectionCard title="Card Preview" icon={<Eye size={14} />} accent="slate">
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                  {form.image_url
                    ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><FolderKanban size={28} className="text-zinc-300" /></div>}
                </div>
                <div className="p-3">
                  {form.category && (
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1.5 ${getCategoryColor(form.category)}`}>
                      {form.category}
                    </span>
                  )}
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{form.title || "Project Title"}</p>
                  {form.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{form.description}</p>}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Project Details" icon={<FolderKanban size={14} />} accent="blue">
              <div className="space-y-4">
                <FormField label="Project Title">
                  <input placeholder="e.g. Vijay Nagar Residential Wiring" value={form.title}
                    onChange={e => patch({ title: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="Category">
                  <div className="space-y-2">
                    <input placeholder="e.g. Residential, Commercial, Industrial" value={form.category}
                      onChange={e => patch({ category: e.target.value })} className={inputCls} />
                    {/* Quick category chips */}
                    {["Residential", "Commercial", "Industrial", "Government"].map(c => (
                      <button key={c} type="button"
                        onClick={() => patch({ category: c })}
                        className={`mr-1.5 mb-1 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                          form.category === c
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-400 hover:text-blue-600"
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Description">
                  <textarea placeholder="Describe the project scope, work done, and outcome…"
                    rows={6} value={form.description}
                    onChange={e => patch({ description: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </FormField>
              </div>
            </SectionCard>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── GRID/LIST VIEW ──
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban size={22} className="text-blue-500" /> Projects
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{projects.length} projects in portfolio</p>
        </div>
        <button onClick={() => { setEditing({}); setForm(emptyProject); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            placeholder="Search by title or category…" />
        </div>
        <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
          {(["grid", "list"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`p-2.5 transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
              {mode === "grid" ? <Grid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSearch("")}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
              !search ? "bg-blue-600 text-white border-blue-600" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-400 hover:text-blue-600"
            }`}>
            All ({projects.length})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSearch(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                search === cat ? "bg-blue-600 text-white border-blue-600" : `${getCategoryColor(cat)} hover:opacity-80`
              }`}>
              {cat} ({projects.filter(p => p.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-20 flex flex-col items-center gap-4 text-zinc-400">
              <FolderKanban size={44} strokeWidth={1.5} />
              <p className="font-medium text-zinc-600 dark:text-zinc-300">No projects found</p>
              <p className="text-sm">Try a different search or add your first project</p>
            </div>
          ) : filtered.map(p => (
            <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                {p.image_url
                  ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><FolderKanban size={32} className="text-zinc-300" /></div>}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(p); setForm({ title: p.title, description: p.description, category: p.category, image_url: p.image_url || "" }); }}
                    className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 rounded-xl shadow-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-zinc-200">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 rounded-xl shadow-md hover:bg-red-50 hover:text-red-600 transition-colors border border-zinc-200">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${getCategoryColor(p.category)}`}>
                  {p.category}
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm leading-snug">{p.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-zinc-400 text-sm">No projects found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-700">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><FolderKanban size={18} className="text-zinc-300" /></div>}
                      </div>
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">{p.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(p.category)}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{p.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(p); setForm({ title: p.title, description: p.description, category: p.category, image_url: p.image_url || "" }); }}
                        className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
