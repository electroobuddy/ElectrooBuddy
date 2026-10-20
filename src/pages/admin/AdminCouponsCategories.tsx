import { useState, useEffect } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, Tag, Percent, Truck, Calendar, Users,
  DollarSign, CheckCircle, XCircle, AlertCircle, Copy, Save,
  ArrowLeft, Gift, ShoppingBag, TrendingUp, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminCacheInvalidation } from "@/hooks/useOptimizedData";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_value: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  usage_limit_per_user: number | null;
  valid_from: string;
  valid_until: string | null;
  applicable_categories: string[] | null;
  applicable_products: string[] | null;
  excluded_products: string[] | null;
  applicable_to_all: boolean;
  applicable_to_new_users_only: boolean;
  minimum_cart_items: number;
  is_active: boolean;
  auto_apply: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  icon_name: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

const AdminCouponsCategories = () => {
  const [activeTab, setActiveTab] = useState<"coupons" | "categories">("coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { invalidateProducts } = useAdminCacheInvalidation();

  const emptyCoupon: Coupon = {
    id: "", code: "", description: "", discount_type: "percentage",
    discount_value: 0, min_order_value: null, max_discount_amount: null,
    usage_limit: null, used_count: 0, usage_limit_per_user: null,
    valid_from: new Date().toISOString(), valid_until: null,
    applicable_categories: null, applicable_products: null,
    excluded_products: null, applicable_to_all: true,
    applicable_to_new_users_only: false, minimum_cart_items: 1,
    is_active: true, auto_apply: false, created_by: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };

  const emptyCategory: Category = {
    id: "", name: "", slug: "", description: null, parent_id: null,
    image_url: null, banner_image_url: null, icon_name: "Package",
    sort_order: 0, is_featured: false, is_active: true,
    meta_title: null, meta_description: null, commission_rate: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };

  const [formData, setFormData] = useState<any>(emptyCoupon);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "coupons") {
        const data = await listAdminCatalog<any>('coupons');
        
        // Transform function result to match Coupon interface
        const transformedCoupons: Coupon[] = (data || []).map((item: any) => ({
          id: item.id,
          code: item.code,
          description: item.description ?? '',
          discount_type: item.discount_type as any,
          discount_value: Number(item.discount_value),
          min_order_value: item.min_order_value ? Number(item.min_order_value) : null,
          max_discount_amount: item.max_discount_amount ? Number(item.max_discount_amount) : null,
          usage_limit: item.usage_limit,
          used_count: item.used_count,
          usage_limit_per_user: item.usage_limit_per_user ?? null,
          valid_from: item.valid_from,
          valid_until: item.valid_until ?? null,
          applicable_categories: item.applicable_categories ?? null,
          applicable_products: item.applicable_products ?? null,
          excluded_products: item.excluded_products ?? null,
          applicable_to_all: item.applicable_to_all ?? true,
          applicable_to_new_users_only: item.applicable_to_new_users_only ?? false,
          minimum_cart_items: item.minimum_cart_items ?? 1,
          is_active: item.is_active,
          auto_apply: item.auto_apply ?? false,
          created_by: item.created_by ?? null,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setCoupons(transformedCoupons);
      } else {
        const data = await listAdminCatalog<any>("categories");
        
        // Transform to match Category interface with defaults
        const transformedCategories: Category[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description ?? null,
          parent_id: item.parent_id,
          image_url: item.image_url ?? null,
          banner_image_url: item.banner_image_url ?? null,
          icon_name: item.icon_name ?? 'Package',
          sort_order: item.sort_order ?? 0,
          is_featured: item.is_featured ?? false,
          is_active: item.is_active ?? true,
          meta_title: item.meta_title ?? null,
          meta_description: item.meta_description ?? null,
          commission_rate: item.commission_rate ?? null,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setCategories(transformedCategories);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData = { ...formData, updated_at: new Date().toISOString() };
      
      // Generate slug for categories
      if (activeTab === "categories" && !submitData.slug) {
        submitData.slug = submitData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      
      if (editingItem) await updateAdminCatalog(activeTab, editingItem, submitData);
      else await createAdminCatalog(activeTab, submitData);
      toast({ title: `${activeTab === "coupons" ? "Coupon" : "Category"} ${editingItem ? "updated" : "created"}` });
      
      setShowForm(false);
      setEditingItem(null);
      setFormData(activeTab === "coupons" ? emptyCoupon : emptyCategory);
      invalidateProducts();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${activeTab === "coupons" ? "coupon" : "category"}?`)) return;
    
    try {
      await deleteAdminCatalog(activeTab, id);
      toast({ title: `${activeTab === "coupons" ? "Coupon" : "Category"} deleted` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === "fixed") {
      return `₹${coupon.discount_value} OFF`;
    } else {
      return "FREE Shipping";
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

  const toLocalInput = (v: string | null | undefined) => {
    const d = new Date(v ?? "");
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingItem(null); }}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {editingItem ? `Edit ${activeTab === "coupons" ? "Coupon" : "Category"}` : `New ${activeTab === "coupons" ? "Coupon" : "Category"}`}
              </span>
            </div>
            <button
              form="form"
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><Save size={14} />Save</>
              )}
            </button>
          </div>
        </div>

        <form id="form" onSubmit={handleSubmit}>
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {activeTab === "coupons" ? (
              <>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Gift className="text-blue-500" />
                    Coupon Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Coupon Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={inputClass}
                        placeholder="SAVE20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <input
                        type="text"
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={inputClass}
                        placeholder="Get 20% off on your order"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Discount Type *</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                        className={inputClass}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                    </div>
                    {formData.discount_type !== "free_shipping" && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Discount Value *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                          className={inputClass}
                          placeholder={formData.discount_type === "percentage" ? "20" : "100"}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Minimum Order Value (₹)</label>
                      <input
                        type="number"
                        value={formData.min_order_value || ""}
                        onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || null as any })}
                        className={inputClass}
                        placeholder="500"
                      />
                    </div>
                    {formData.discount_type === "percentage" && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Maximum Discount Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.max_discount_amount || ""}
                          onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || null as any })}
                          className={inputClass}
                          placeholder="200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="text-green-500" />
                    Validity & Usage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Valid From</label>
                      <input
                        type="datetime-local"
                        value={toLocalInput(formData.valid_from)}
                        onChange={(e) => { if (e.target.value) setFormData({ ...formData, valid_from: new Date(e.target.value).toISOString() }); }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Valid Until</label>
                      <input
                        type="datetime-local"
                        value={formData.valid_until ? toLocalInput(formData.valid_until) : ""}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Usage Limit</label>
                      <input
                        type="number"
                        value={formData.usage_limit || ""}
                        onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null as any })}
                        className={inputClass}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Limit Per User</label>
                      <input
                        type="number"
                        value={formData.usage_limit_per_user || ""}
                        onChange={(e) => setFormData({ ...formData, usage_limit_per_user: parseInt(e.target.value) || null as any })}
                        className={inputClass}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Minimum Cart Items</label>
                      <input
                        type="number"
                        value={formData.minimum_cart_items}
                        onChange={(e) => setFormData({ ...formData, minimum_cart_items: parseInt(e.target.value) || 1 })}
                        className={inputClass}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="text-purple-500" />
                    Restrictions
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.applicable_to_new_users_only}
                        onChange={(e) => setFormData({ ...formData, applicable_to_new_users_only: e.target.checked })}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium">For New Users Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.auto_apply}
                        onChange={(e) => setFormData({ ...formData, auto_apply: e.target.checked })}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium">Auto-apply at Checkout</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Tag className="text-blue-500" />
                    Category Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Category Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputClass}
                        placeholder="Electronics"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Slug (URL)</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className={inputClass + " font-mono"}
                        placeholder="electronics"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={inputClass + " resize-none"}
                        rows={3}
                        placeholder="Browse our wide range of electronic products..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Icon Name</label>
                      <input
                        type="text"
                        value={formData.icon_name}
                        onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                        className={inputClass}
                        placeholder="Package"
                      />
                      <p className="text-xs text-zinc-400 mt-1">Lucide icon name (e.g., Package, Zap, Smartphone)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag className="text-green-500" />
                    SEO Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                      <input
                        type="text"
                        value={formData.meta_title || ""}
                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                        className={inputClass}
                        placeholder="Best Electronics Online | Electroobuddy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                      <textarea
                        value={formData.meta_description || ""}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        className={inputClass + " resize-none"}
                        rows={3}
                        placeholder="Shop the best electronics at great prices..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-purple-500" />
                    Display Settings
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium">Featured Category</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            {activeTab === "coupons" ? <Gift size={24} className="text-blue-500" /> : <Tag size={24} className="text-green-500" />}
            {activeTab === "coupons" ? "Coupons" : "Categories"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {activeTab === "coupons" 
              ? `${coupons.length} coupons in your system`
              : `${categories.length} categories in your catalog`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
            {(["coupons", "categories"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setFormData(activeTab === "coupons" ? emptyCoupon : emptyCategory);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} />
            Add {activeTab === "coupons" ? "Coupon" : "Category"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500">Loading...</p>
          </div>
        ) : activeTab === "coupons" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Coupon</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Min Order</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Validity</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Usage</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold text-blue-600">{coupon.code}</code>
                          <button onClick={() => copyToClipboard(coupon.code)} className="text-zinc-400 hover:text-blue-600">
                            <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{coupon.description || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        coupon.discount_type === "percentage" ? "bg-green-100 text-green-700" :
                        coupon.discount_type === "fixed" ? "bg-blue-100 text-blue-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {getDiscountDisplay(coupon)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {coupon.min_order_value ? `₹${coupon.min_order_value}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-zinc-500">
                        {coupon.valid_until ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(coupon.valid_until).toLocaleDateString()}
                          </div>
                        ) : (
                          "No expiry"
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {coupon.is_active ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Inactive
                          </span>
                        )}
                        {coupon.auto_apply && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Auto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(coupon)} className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Icon</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categories.map((category) => (
                  <tr key={category.id} className="group hover:bg-green-50/30 dark:hover:bg-green-950/10 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white text-sm">{category.name}</p>
                        {category.description && <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-md">{category.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs text-zinc-500 font-mono">{category.slug}</code>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        {category.icon_name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{category.sort_order}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {category.is_active ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Hidden
                          </span>
                        )}
                        {category.is_featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Featured</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(category)} className="p-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/30 text-zinc-400 hover:text-green-600 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors">
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

        {!loading && (activeTab === "coupons" ? coupons : categories).length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              {activeTab === "coupons" ? <Gift size={32} className="text-zinc-300" /> : <Tag size={32} className="text-zinc-300" />}
            </div>
            <p className="font-semibold text-zinc-600 dark:text-zinc-300">No {activeTab} found</p>
            <p className="text-sm text-zinc-400 mt-1">Add your first {activeTab === "coupons" ? "coupon" : "category"} to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsCategories;
