import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { listNativeAdminTechnicians, listNativeAdminTechnicianBookings, createNativeTechnician, updateNativeTechnician, reviewNativeTechnician, disableNativeTechnician } from "@/lib/nativeTechnician";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Pencil, Trash2, X, Eye, User, Mail, Phone,
  MapPin, Wrench, Briefcase, Search, Filter, CheckCircle,
  AlertCircle, Save, Shield, TrendingUp, Calendar, Star, Copy
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  active: { 
    label: "Active", 
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", 
    dot: "bg-emerald-500" 
  },
  busy: { 
    label: "Busy", 
    pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800", 
    dot: "bg-orange-500" 
  },
  offline: { 
    label: "Offline", 
    pill: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:border-zinc-800", 
    dot: "bg-zinc-500" 
  },
};

const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
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

const PREDEFINED_SKILLS = [
  "AC Repair", "Electrical Wiring", "Appliance Repair", "Plumbing",
  "Fan Installation", "Light Installation", "Switch Repair", "Circuit Breaker",
  "Socket Installation", "Ceiling Fan", "Wall Fan", "Exhaust Fan"
];

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  skills: string[];
  experience: number;
  daily_limit: number;
  status: string;
  priority: number;
  profile_url: string | null;
  created_at: string;
  user_id?: string;
  todayCount?: number;
  approval_status?: string;
}

const AdminTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "approved", "pending"
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Technician | null>(null);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    skills: [] as string[],
    experience: 0,
    daily_limit: 5,
    priority: 1,
    status: "active",
    profile_url: ""
  });

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      let all: any[] = await listNativeAdminTechnicians(today);
      setPendingApplications(all.filter(t => t.approval_status === "pending"));
      setTechnicians(all.filter(t => t.approval_status !== "pending").map(t => ({ ...t, todayCount: Number(t.today_count || 0) })));
    } catch (error) {
      logger.error(error);
      toast.error("Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleAddTechnician = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }

    setSaving(true);
    try {
      // Generate random password if not provided
      const password = form.password || (() => {
        const set = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let out = "";
        while (out.length < 12) {
          for (const b of crypto.getRandomValues(new Uint8Array(16))) {
            if (b < 224 && out.length < 12) out += set[b % set.length];
          }
        }
        return out;
      })();
      if (form.password && form.password.length < 8) { toast.error('Enter a password of at least 8 characters.'); setSaving(false); return; }

      let result: any;
      result = await createNativeTechnician({
        name: form.name, email: form.email, password,
        phone: form.phone || null, address: form.address || null, skills: form.skills,
        experience: form.experience, dailyLimit: form.daily_limit, priority: form.priority,
        status: form.status, profileUrl: form.profile_url || null,
      });

      toast.success("Technician created successfully");
      
      // Show credentials with copy button (use returned password from edge function)
      const finalPassword = password;
      toast.custom(
        (t) => (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg max-w-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Login Credentials</p>
                <p className="text-xs text-zinc-500 mt-0.5">Save these securely</p>
              </div>
              <button
                onClick={() => copyCredentials(form.email, finalPassword)}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                title="Copy credentials"
              >
                <Copy size={16} className="text-blue-600" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300">{form.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">🔑</span>
                <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  {finalPassword}
                </code>
              </div>
            </div>
          </div>
        ),
        { duration: 20000 }
      );
      
      setAdding(false);
      resetForm();
      fetchTechnicians();
    } catch (error: any) {
      logger.error("Error creating technician:", error);
      toast.error(error.message || "Failed to create technician");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTechnician = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      await updateNativeTechnician(editing.id, { name: form.name, phone: form.phone || null, address: form.address || null,
          skills: form.skills, experience: form.experience, dailyLimit: form.daily_limit, priority: form.priority,
          status: form.status, profileUrl: form.profile_url || null });

      toast.success("Technician updated successfully");
      setEditing(null);
      resetForm();
      fetchTechnicians();
    } catch (error: any) {
      logger.error(error);
      toast.error(error.message || "Failed to update technician");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveApplication = async (techId: string) => {
    try {
      await reviewNativeTechnician(techId, "approved");

      toast.success("Technician approved successfully!");
      fetchTechnicians();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve application");
    }
  };

  const handleRejectApplication = async (techId: string) => {
    if (!confirm("Reject this application? The user will not be able to login.")) return;
    
    try {
      await reviewNativeTechnician(techId, "rejected");

      toast.success("Application rejected");
      fetchTechnicians();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject application");
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    if (!confirm("Delete this technician? This will also delete their auth account.")) return;

    try {
      await disableNativeTechnician(id);

      toast.success("Technician disabled successfully");
      fetchTechnicians();
    } catch (error: any) {
      logger.error(error);
      toast.error(error.message || "Failed to delete technician");
    }
  };

  const openEditModal = (tech: Technician) => {
    setEditing(tech);
    setForm({
      name: tech.name,
      email: tech.email,
      password: "",
      phone: tech.phone || "",
      address: tech.address || "",
      skills: tech.skills || [],
      experience: tech.experience || 0,
      daily_limit: tech.daily_limit || 5,
      priority: tech.priority || 1,
      status: tech.status,
      profile_url: tech.profile_url || "",
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      skills: [],
      experience: 0,
      daily_limit: 5,
      priority: 1,
      status: "active",
      profile_url: "",
    });
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast.success("Credentials copied to clipboard!");
  };

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const filtered = technicians.filter(t => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
                         (t.phone && t.phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: technicians.length,
    active: technicians.filter(t => t.status === "active").length,
    busy: technicians.filter(t => t.status === "busy").length,
    offline: technicians.filter(t => t.status === "offline").length,
    pending: pendingApplications.length,
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
            <Wrench size={22} className="text-blue-500" /> Technicians
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stats.total} total technicians</p>
        </div>
        <button onClick={() => { resetForm(); setAdding(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={15} /> Add Technician
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "blue" },
          { label: "Active", value: stats.active, color: "emerald" },
          { label: "Busy", value: stats.busy, color: "orange" },
          { label: "Offline", value: stats.offline, color: "zinc" },
          { label: "Pending", value: stats.pending, color: "purple" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 ${
            stat.color === "blue" ? "border-blue-100 dark:border-blue-900/40" :
            stat.color === "emerald" ? "border-emerald-100 dark:border-emerald-900/40" :
            stat.color === "orange" ? "border-orange-100 dark:border-orange-900/40" :
            stat.color === "purple" ? "border-purple-100 dark:border-purple-900/40" :
            "border-zinc-100 dark:border-zinc-900/40"
          }`}>
            <p className={`text-2xl font-bold ${
              stat.color === "blue" ? "text-blue-600" :
              stat.color === "emerald" ? "text-emerald-600" :
              stat.color === "orange" ? "text-orange-600" :
              stat.color === "purple" ? "text-purple-600" :
              "text-zinc-600"
            }`}>{stat.value}</p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === "all"
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-b-2 border-blue-600"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          All Technicians ({technicians.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative ${
            activeTab === "pending"
              ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-b-2 border-purple-600"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          Pending Applications ({pendingApplications.length})
          {pendingApplications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
              {pendingApplications.length}
            </span>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Pending Applications */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
              📋 {pendingApplications.length} Application{pendingApplications.length !== 1 ? 's' : ''} Awaiting Review
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApplications.map(tech => (
              <motion.div
                key={tech.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">{tech.name}</h3>
                      <p className="text-xs text-zinc-500">{tech.email}</p>
                      <p className="text-xs text-purple-600 font-semibold mt-1">⏳ Pending Approval</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {tech.phone && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone size={14} /> {tech.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Briefcase size={14} /> {tech.experience} years experience
                  </div>
                  {(tech.skills?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(tech.skills ?? []).slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg">
                          {skill}
                        </span>
                      ))}
                      {tech.skills.length > 5 && (
                        <span className="px-2 py-1 text-zinc-500 text-xs">+{tech.skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveApplication(tech.id)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleRejectApplication(tech.id)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    ❌ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Technicians Grid */}
      {activeTab === "all" && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tech => (
          <motion.div
            key={tech.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{tech.name}</p>
                  <StatusPill status={tech.status} />
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <button onClick={() => openEditModal(tech)}
                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setViewing(tech)}
                  className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors">
                  <Eye size={14} />
                </button>
                <button onClick={() => handleDeleteTechnician(tech.id)}
                  className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Mail size={12} />
                <span className="truncate">{tech.email}</span>
              </div>
              {tech.phone && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Phone size={12} />
                  <span>{tech.phone}</span>
                </div>
              )}
              {tech.skills && tech.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tech.skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs">
                      {skill}
                    </span>
                  ))}
                  {tech.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs">
                      +{tech.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{tech.experience}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Years Exp.</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{tech.todayCount}/{tech.daily_limit}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Today</p>
              </div>
              <div>
                <p className="text-lg font-bold text-violet-600">{tech.priority}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Priority</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {filtered.length === 0 && activeTab === "all" && (
        <div className="text-center py-24">
          <Wrench size={48} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
          <p className="font-semibold text-zinc-500 dark:text-zinc-400">No technicians found</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {adding && (
          <AddEditModal
            isOpen={adding}
            onClose={() => { setAdding(false); resetForm(); }}
            onSubmit={handleAddTechnician}
            form={form}
            setForm={setForm}
            toggleSkill={toggleSkill}
            saving={saving}
            isEdit={false}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <AddEditModal
            isOpen={!!editing}
            onClose={() => { setEditing(null); resetForm(); }}
            onSubmit={handleEditTechnician}
            form={form}
            setForm={setForm}
            toggleSkill={toggleSkill}
            saving={saving}
            isEdit={true}
          />
        )}
      </AnimatePresence>

      {/* View Drawer */}
      <AnimatePresence>
        {viewing && (
          <ViewDrawer
            technician={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => { openEditModal(viewing); setViewing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Add/Edit Modal Component
interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  form: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    skills: string[];
    experience: number;
    daily_limit: number;
    priority: number;
    status: string;
    profile_url: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    skills: string[];
    experience: number;
    daily_limit: number;
    priority: number;
    status: string;
    profile_url: string;
  }>>;
  toggleSkill: (skill: string) => void;
  saving: boolean;
  isEdit: boolean;
}

const AddEditModal = ({ isOpen, onClose, onSubmit, form, setForm, toggleSkill, saving, isEdit }: AddEditModalProps) => {
  const patchForm = (updates: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...updates }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">{isEdit ? "Edit Technician" : "Add Technician"}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{isEdit ? "Update technician details" : "Create a new technician account"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <SectionCard title="Basic Information" icon={<User size={13} />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={e => patchForm({ name: e.target.value })} className={inputCls} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e => patchForm({ email: e.target.value })} className={inputCls} placeholder="john@example.com" disabled={isEdit} />
              </div>
              {!isEdit && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Password (optional, auto-generated if empty)</label>
                  <input type="password" value={form.password} onChange={e => patchForm({ password: e.target.value })} className={inputCls} placeholder="Leave empty for auto-generated" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={e => patchForm({ phone: e.target.value })} className={inputCls} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Status</label>
                <select value={form.status} onChange={e => patchForm({ status: e.target.value })} className={inputCls}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Address</label>
                <textarea value={form.address} onChange={e => patchForm({ address: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Full address" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Skills & Expertise" icon={<Wrench size={13} />}>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block">Select Skills</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border-2 ${
                        form.skills.includes(skill)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Experience (years)</label>
                  <input type="number" value={form.experience} onChange={e => patchForm({ experience: parseInt(e.target.value) || 0 })} className={inputCls} min={0} max={50} />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Daily Limit</label>
                  <input type="number" value={form.daily_limit} onChange={e => patchForm({ daily_limit: parseInt(e.target.value) || 5 })} className={inputCls} min={1} max={20} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Assignment Settings" icon={<TrendingUp size={13} />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Priority</label>
                <input type="number" value={form.priority} onChange={e => patchForm({ priority: parseInt(e.target.value) || 1 })} className={inputCls} min={1} max={10} />
                <p className="text-[10px] text-zinc-400 mt-1">Higher = more priority in assignment</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Profile Photo URL</label>
                <input value={form.profile_url} onChange={e => patchForm({ profile_url: e.target.value })} className={inputCls} placeholder="https://..." />
              </div>
            </div>
          </SectionCard>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60">
              Cancel
            </button>
            <button onClick={onSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : <><Save size={14} />{isEdit ? "Update" : "Create"}</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// View Drawer Component
const ViewDrawer = ({ technician, onClose, onEdit }: { technician: Technician; onClose: () => void; onEdit: () => void }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setBookings(await listNativeAdminTechnicianBookings(technician.id, 10));
      } catch (error) {
        logger.error(error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [technician.id]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending" || b.status === "assigned").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="h-full w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">Technician Profile</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{technician.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
              {technician.profile_url ? (
                <img src={technician.profile_url} alt={technician.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <User size={28} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{technician.name}</h3>
              <StatusPill status={technician.status} />
            </div>
          </div>

          {/* Stats */}
          <SectionCard title="Statistics" icon={<TrendingUp size={13} />}>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{technician.experience}</p>
                <p className="text-xs text-zinc-500 mt-1">Years Exp.</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{technician.todayCount}/{technician.daily_limit}</p>
                <p className="text-xs text-zinc-500 mt-1">Today</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-violet-600">{technician.priority}</p>
                <p className="text-xs text-zinc-500 mt-1">Priority</p>
              </div>
            </div>
          </SectionCard>

          {/* Contact Info */}
          <SectionCard title="Contact Information" icon={<Mail size={13} />}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <Mail size={14} className="text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-400">Email</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{technician.email}</p>
                </div>
              </div>
              {technician.phone && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <Phone size={14} className="text-zinc-400" />
                  <div>
                    <p className="text-xs text-zinc-400">Phone</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{technician.phone}</p>
                  </div>
                </div>
              )}
              {technician.address && (
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <MapPin size={14} className="text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400">Address</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{technician.address}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Skills */}
          {technician.skills && technician.skills.length > 0 && (
            <SectionCard title="Skills" icon={<Wrench size={13} />}>
              <div className="flex flex-wrap gap-2">
                {technician.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Recent Bookings */}
          <SectionCard title="Recent Bookings" icon={<Calendar size={13} />}>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bookings.map(booking => (
                  <div key={booking.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-white">{booking.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{booking.service_type}</p>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                          <Calendar size={10} />{booking.preferred_date} • {booking.preferred_time}
                        </p>
                      </div>
                      <StatusPill status={booking.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminTechnicians;
