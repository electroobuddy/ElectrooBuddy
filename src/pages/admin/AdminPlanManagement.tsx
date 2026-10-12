import { useState, useEffect } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import {
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Crown,
  Sparkles,
  Ticket,
  Percent,
  Headphones,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  duration_days: number;
  max_service_calls: number;
  parts_discount_percent: number;
  has_priority_support: boolean;
  is_active: boolean;
  created_at: string;
}

const AdminPlanManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    currency: "INR",
    description: "",
    duration_days: 365,
    max_service_calls: 0,
    parts_discount_percent: 0,
    has_priority_support: false,
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await listAdminCatalog<Plan>("plans");
      setPlans(data || []);
    } catch (error: any) {
      toast.error("Failed to load plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (plan: Plan) => {
    setSaving(plan.id);
    try {
      await updateAdminCatalog("plans", plan.id, {
          name: plan.name,
          price: plan.price,
          description: plan.description,
          duration_days: plan.duration_days,
          max_service_calls: plan.max_service_calls,
          parts_discount_percent: plan.parts_discount_percent,
          has_priority_support: plan.has_priority_support,
          is_active: plan.is_active,
          features: plan.features,
          updated_at: new Date().toISOString(),
        });
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      await fetchPlans();
    } catch (error: any) {
      toast.error("Failed to save plan: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    setSaving(plan.id);
    try {
      await updateAdminCatalog("plans", plan.id, { is_active: !plan.is_active, updated_at: new Date().toISOString() });
      toast.success(`Plan ${plan.is_active ? "deactivated" : "activated"}`);
      await fetchPlans();
    } catch (error: any) {
      toast.error("Failed to toggle plan: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || newPlan.price <= 0) {
      toast.error("Name and price are required");
      return;
    }

    setSaving("new");
    try {
      await createAdminCatalog("plans", {
        name: newPlan.name,
        price: newPlan.price,
        currency: newPlan.currency,
        description: newPlan.description,
        duration_days: newPlan.duration_days,
        max_service_calls: newPlan.max_service_calls,
        parts_discount_percent: newPlan.parts_discount_percent,
        has_priority_support: newPlan.has_priority_support,
        features: newPlan.features,
        is_active: true,
      });
      toast.success("Plan created successfully");
      setShowNewPlanForm(false);
      setNewPlan({
        name: "",
        price: 0,
        currency: "INR",
        description: "",
        duration_days: 365,
        max_service_calls: 0,
        parts_discount_percent: 0,
        has_priority_support: false,
        features: [],
      });
      await fetchPlans();
    } catch (error: any) {
      toast.error("Failed to create plan: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan? This cannot be undone.")) return;

    setSaving(planId);
    try {
      await deleteAdminCatalog("plans", planId);
      toast.success("Plan deleted");
      await fetchPlans();
    } catch (error: any) {
      toast.error("Failed to delete plan: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const addFeature = (target: "edit" | "new") => {
    if (!newFeature.trim()) return;
    if (target === "edit" && editingPlan) {
      setEditingPlan({ ...editingPlan, features: [...editingPlan.features, newFeature.trim()] });
    } else {
      setNewPlan({ ...newPlan, features: [...newPlan.features, newFeature.trim()] });
    }
    setNewFeature("");
  };

  const removeFeature = (index: number, target: "edit" | "new") => {
    if (target === "edit" && editingPlan) {
      setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, i) => i !== index) });
    } else {
      setNewPlan({ ...newPlan, features: newPlan.features.filter((_, i) => i !== index) });
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  const labelCls = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings size={22} className="text-blue-500" />
            Plan Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage subscription plans, features, pricing, and benefits
          </p>
        </div>
        <button
          onClick={() => setShowNewPlanForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Create New Plan
        </button>
      </div>

      {/* New Plan Form */}
      {showNewPlanForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Create New Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Plan Name *</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="e.g., Premium Annual"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="Plan description"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Duration (days)</label>
              <input
                type="number"
                value={newPlan.duration_days}
                onChange={(e) => setNewPlan({ ...newPlan, duration_days: Number(e.target.value) })}
                min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Free Service Calls</label>
              <input
                type="number"
                value={newPlan.max_service_calls}
                onChange={(e) => setNewPlan({ ...newPlan, max_service_calls: Number(e.target.value) })}
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Parts Discount (%)</label>
              <input
                type="number"
                value={newPlan.parts_discount_percent}
                onChange={(e) => setNewPlan({ ...newPlan, parts_discount_percent: Number(e.target.value) })}
                min="0"
                max="100"
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlan.has_priority_support}
                  onChange={(e) => setNewPlan({ ...newPlan, has_priority_support: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Priority Support</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4">
            <label className={labelCls}>Features</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature("new"))}
                placeholder="Add a feature..."
                className={inputCls + " flex-1"}
              />
              <button
                type="button"
                onClick={() => addFeature("new")}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newPlan.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  {f}
                  <button onClick={() => removeFeature(i, "new")} className="hover:text-red-500">
                    <XCircle size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreatePlan}
              disabled={saving === "new" || !newPlan.name || newPlan.price <= 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving === "new" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Create Plan
            </button>
            <button
              onClick={() => setShowNewPlanForm(false)}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No plans found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                plan.is_active
                  ? "border-blue-500 shadow-blue-500/10"
                  : "border-zinc-200 dark:border-zinc-800 opacity-75"
              }`}
            >
              {/* Plan Header */}
              <div className={`p-6 ${plan.price > 1000 ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.price > 1000 ? (
                      <Crown className="text-yellow-300" size={20} />
                    ) : (
                      <Sparkles className="text-white/80" size={20} />
                    )}
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleActive(plan)}
                    disabled={saving === plan.id}
                    className="text-white/80 hover:text-white transition-colors"
                    title={plan.is_active ? "Deactivate" : "Activate"}
                  >
                    {plan.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
                <p className="text-white/80 text-sm mt-1">{plan.description}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹{plan.price}</span>
                  <span className="text-white/70 text-sm">/year</span>
                </div>
              </div>

              {/* Plan Body */}
              <div className="p-6 space-y-4">
                {/* Benefits Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <Ticket className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{plan.max_service_calls}</p>
                    <p className="text-xs text-zinc-500">Free Calls</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <Percent className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{plan.parts_discount_percent}%</p>
                    <p className="text-xs text-zinc-500">Parts Discount</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <Headphones className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{plan.has_priority_support ? "Yes" : "No"}</p>
                    <p className="text-xs text-zinc-500">Priority</p>
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                        <CheckCircle size={10} className="text-green-500" /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status & Duration */}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className={`flex items-center gap-1 ${plan.is_active ? "text-green-600" : "text-zinc-400"}`}>
                    {plan.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                  <span>{plan.duration_days} days</span>
                </div>

                {/* Edit Form (Inline) */}
                {editingPlan?.id === plan.id ? (
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Name</label>
                        <input
                          type="text"
                          value={editingPlan.name}
                          onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Price (₹)</label>
                        <input
                          type="number"
                          value={editingPlan.price}
                          onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Free Service Calls</label>
                        <input
                          type="number"
                          value={editingPlan.max_service_calls}
                          onChange={(e) => setEditingPlan({ ...editingPlan, max_service_calls: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Parts Discount (%)</label>
                        <input
                          type="number"
                          value={editingPlan.parts_discount_percent}
                          onChange={(e) => setEditingPlan({ ...editingPlan, parts_discount_percent: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Duration (days)</label>
                        <input
                          type="number"
                          value={editingPlan.duration_days}
                          onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                          <input
                            type="checkbox"
                            checked={editingPlan.has_priority_support}
                            onChange={(e) => setEditingPlan({ ...editingPlan, has_priority_support: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">Priority Support</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <input
                        type="text"
                        value={editingPlan.description}
                        onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Features</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature("edit"))}
                          placeholder="Add feature..."
                          className={inputCls + " flex-1"}
                        />
                        <button onClick={() => addFeature("edit")} className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-sm">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {editingPlan.features.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs">
                            {f}
                            <button onClick={() => removeFeature(i, "edit")} className="hover:text-red-500"><XCircle size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePlan(editingPlan)}
                        disabled={saving === plan.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                      </button>
                      <button
                        onClick={() => { setEditingPlan(null); setNewFeature(""); }}
                        className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons */
                  <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => { setEditingPlan(plan); setNewFeature(""); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={saving === plan.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                    >
                      {saving === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPlanManagement;
