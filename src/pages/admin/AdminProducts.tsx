import { validateImageUpload } from "@/lib/security";
import { useState, useEffect, useRef } from "react";
import { listAdminCatalog, createAdminCatalog, updateAdminCatalog, deleteAdminCatalog } from "@/lib/nativeCatalogAdmin";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, Upload, X, Save, Package, DollarSign,
  Image as ImageIcon, Tag, BarChart2, ChevronRight, Star,
  Flame, Eye, EyeOff, ArrowLeft, Check, Layers, Settings,
  AlertCircle, Grid, List, Search, Filter, SlidersHorizontal,
  ImagePlus, Zap, ShoppingBag
} from "lucide-react";
import { uploadAdminImage } from "@/lib/storageApi";
import { useToast } from "@/hooks/use-toast";
import { useAdminProducts, useAdminCacheInvalidation } from "@/hooks/useOptimizedData";

type Product = any;

const formatProductPrice = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "—";
};



// ─── Minimal reusable primitives ─────────────────────────────────────────────

const Badge = ({ color, icon, label }: { color: string; icon: string; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
    {icon} {label}
  </span>
);

const SectionCard = ({ title, icon, children, accent = "blue" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) => {
  const accents: Record<string, string> = {
    blue:   "border-blue-100 dark:border-blue-900/40",
    green:  "border-emerald-100 dark:border-emerald-900/40",
    violet: "border-violet-100 dark:border-violet-900/40",
    orange: "border-orange-100 dark:border-orange-900/40",
    slate:  "border-slate-200 dark:border-slate-700",
  };
  const dotColors: Record<string, string> = {
    blue: "bg-blue-500", green: "bg-emerald-500",
    violet: "bg-violet-500", orange: "bg-orange-500", slate: "bg-slate-400",
  };
  return (
    <div className={`rounded-2xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm ${accents[accent]}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-inherit bg-zinc-50/60 dark:bg-zinc-800/40">
        <span className={`w-2 h-2 rounded-full ${dotColors[accent]}`} />
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <h3 className="font-semibold text-sm tracking-wide text-zinc-700 dark:text-zinc-200 uppercase">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

const FormField = ({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {required && <span className="text-red-500 text-xs">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

const Toggle = ({ id, checked, onChange, label, sub }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string;
}) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
    <div className="relative mt-0.5">
      <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-10 h-5.5 bg-zinc-200 dark:bg-zinc-700 rounded-full peer-checked:bg-blue-500 transition-colors duration-200 relative" style={{height:'22px'}}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
      </div>
    </div>
    <div>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  </label>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AdminProducts = () => {
  const { products: initialProducts, loading: initialLoading, error } = useAdminProducts();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialLoading);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "media" | "pricing" | "settings">("details");
  const [dragOver, setDragOver] = useState<"main" | "gallery" | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { invalidateProducts, invalidateDashboardStats } = useAdminCacheInvalidation();

  const emptyProduct: Product = {
    id: "", name: "", slug: "", description: "", short_description: null,
    sku: null, price: 0, compare_at_price: null, cost_per_item: null,
    inventory_quantity: 0, track_inventory: false, allow_backorder: false,
    installation_available: false, installation_charge: 0,
    installation_description: null, main_image_url: null, gallery_images: null,
    category: null, subcategory: null, brand: null, tags: null,
    specifications: {}, weight: null, weight_unit: null,
    length: null, width: null, height: null, dimension_unit: null,
    meta_title: null, meta_description: null, is_active: true,
    is_featured: false, is_bestseller: false, sort_order: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Product>(emptyProduct);
  const patch = (updates: Partial<Product>) => setFormData(prev => ({ ...prev, ...updates }));

  useEffect(() => {
    if (!initialLoading) {
      setLoading(false);
      if (initialProducts.length > 0) {
        setProducts(initialProducts);
      }
    }
  }, [initialLoading, initialProducts]);

  const fetchProducts = async () => {
    try {
      const data = await listAdminCatalog<Product>("products");
      setProducts(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const productData = { ...formData, slug, updated_at: new Date().toISOString() };
      if (editingProduct) {
        await updateAdminCatalog("products", editingProduct.id, productData);
        toast({ title: "Product updated" });
      } else {
        await createAdminCatalog("products", productData);
        toast({ title: "Product created" });
      }
      setShowForm(false); setEditingProduct(null); setFormData(emptyProduct);
      invalidateProducts(); invalidateDashboardStats(); fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product); setFormData(product);
    setShowForm(true); setActiveTab("details");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteAdminCatalog("products", id);
      toast({ title: "Product deleted" });
      invalidateProducts(); invalidateDashboardStats(); fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleImageUpload = async (files: FileList | null, field: "main" | "gallery") => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return;
    }
    try {
      const uploaded = await uploadAdminImage(file, "products");
      if (field === "main") patch({ main_image_url: uploaded.url });
      else patch({ gallery_images: [...(formData.gallery_images || []), uploaded.url] });
      toast({ title: "Image uploaded" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent, field: "main" | "gallery") => {
    e.preventDefault(); setDragOver(null);
    handleImageUpload(e.dataTransfer.files, field);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "details", label: "Details", icon: <Package size={14} /> },
    { id: "media", label: "Media", icon: <ImageIcon size={14} /> },
    { id: "pricing", label: "Pricing", icon: <DollarSign size={14} /> },
    { id: "settings", label: "Settings", icon: <Settings size={14} /> },
  ] as const;

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingProduct(null); setFormData(emptyProduct); }}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Products
              </button>
              <ChevronRight size={14} className="text-zinc-300" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {editingProduct ? `Edit: ${editingProduct.name}` : "New Product"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingProduct(null); setFormData(emptyProduct); }}
                className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all font-medium"
              >
                Discard
              </button>
              <button
                form="product-form"
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><Save size={14} />{editingProduct ? "Update Product" : "Save Product"}</>
                )}
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form id="product-form" onSubmit={handleSubmit}>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait">

              {/* ── DETAILS TAB ── */}
              {activeTab === "details" && (
                <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  <div className="lg:col-span-2 space-y-5">
                    <SectionCard title="Basic Information" icon={<Package size={14} />} accent="blue">
                      <div className="space-y-4">
                        <FormField label="Product Name" required>
                          <input type="text" required value={formData.name}
                            onChange={e => patch({ name: e.target.value })}
                            className={inputCls} placeholder="e.g. Anchor Modular 6A Switch" />
                        </FormField>
                        <FormField label="Short Description" hint="Shown in product listings (1–2 sentences)">
                          <textarea value={formData.short_description ?? ""}
                            onChange={e => patch({ short_description: e.target.value })}
                            className={inputCls + " resize-none"} rows={2}
                            placeholder="A brief summary of the product…" />
                        </FormField>
                        <FormField label="Full Description" required>
                          <textarea required value={formData.description ?? ""}
                            onChange={e => patch({ description: e.target.value })}
                            className={inputCls + " resize-none"} rows={6}
                            placeholder="Describe features, benefits, use cases, specifications…" />
                        </FormField>
                      </div>
                    </SectionCard>

                    <SectionCard title="Organization" icon={<Tag size={14} />} accent="violet">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Category">
                          <input type="text" value={formData.category ?? ""}
                            onChange={e => patch({ category: e.target.value })}
                            className={inputCls} placeholder="e.g. Switches" />
                        </FormField>
                        <FormField label="Subcategory">
                          <input type="text" value={formData.subcategory ?? ""}
                            onChange={e => patch({ subcategory: e.target.value })}
                            className={inputCls} placeholder="e.g. Modular" />
                        </FormField>
                        <FormField label="Brand">
                          <input type="text" value={formData.brand ?? ""}
                            onChange={e => patch({ brand: e.target.value })}
                            className={inputCls} placeholder="e.g. Anchor" />
                        </FormField>
                        <FormField label="SKU">
                          <input type="text" value={formData.sku ?? ""}
                            onChange={e => patch({ sku: e.target.value })}
                            className={`${inputCls} font-mono tracking-wide`} placeholder="ANK-MOD-6A-001" />
                        </FormField>
                        <FormField label="URL Slug" hint="Auto-generated if blank">
                          <input type="text" value={formData.slug ?? ""}
                            onChange={e => patch({ slug: e.target.value })}
                            className={`${inputCls} font-mono text-xs`} placeholder="anchor-modular-6a-switch" />
                        </FormField>
                        <FormField label="Tags" hint="Comma-separated">
                          <input type="text" value={(formData.tags as string[] ?? []).join(", ")}
                            onChange={e => patch({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) as any })}
                            className={inputCls} placeholder="electrical, modular, wiring" />
                        </FormField>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="space-y-5">
                    {/* Quick status panel */}
                    <SectionCard title="Visibility" icon={<Eye size={14} />} accent="slate">
                      <div className="space-y-4">
                        <Toggle id="is_active" checked={formData.is_active} onChange={v => patch({ is_active: v })}
                          label="Active" sub="Visible to customers on the storefront" />
                        <Toggle id="is_featured" checked={formData.is_featured} onChange={v => patch({ is_featured: v })}
                          label="Featured" sub="Show on homepage featured section" />
                        <Toggle id="is_bestseller" checked={formData.is_bestseller} onChange={v => patch({ is_bestseller: v })}
                          label="Bestseller" sub="Display bestseller badge on listing" />
                      </div>
                    </SectionCard>

                    <SectionCard title="Sort Order" icon={<Layers size={14} />} accent="slate">
                      <FormField label="Display Order" hint="Lower = appears first">
                        <input type="number" value={formData.sort_order ?? 0}
                          onChange={e => patch({ sort_order: parseInt(e.target.value) || 0 })}
                          className={inputCls} placeholder="0" />
                      </FormField>
                    </SectionCard>
                  </div>
                </motion.div>
              )}

              {/* ── MEDIA TAB ── */}
              {activeTab === "media" && (
                <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="space-y-6">

                  {/* Main image */}
                  <SectionCard title="Main Product Image" icon={<ImageIcon size={14} />} accent="violet">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                      {/* Drop zone */}
                      <div
                        className={`md:col-span-3 relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
                          ${dragOver === "main" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"}
                        `}
                        onDragOver={e => { e.preventDefault(); setDragOver("main"); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => handleDrop(e, "main")}
                      >
                        {formData.main_image_url ? (
                          <div className="relative group">
                            <img src={formData.main_image_url} alt="Main" className="w-full aspect-square object-contain p-4 rounded-2xl" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                              <button type="button" onClick={() => setPreviewImage(formData.main_image_url!)}
                                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/30 transition-colors flex items-center gap-1.5 border border-white/30">
                                <Eye size={14} /> Preview
                              </button>
                              <button type="button" onClick={() => mainImageInputRef.current?.click()}
                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5">
                                <Upload size={14} /> Replace
                              </button>
                              <button type="button" onClick={() => patch({ main_image_url: null })}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-1.5">
                                <X size={14} /> Remove
                              </button>
                            </div>
                            <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Check size={10} /> Main
                            </span>
                          </div>
                        ) : (
                          <button type="button" onClick={() => mainImageInputRef.current?.click()}
                            className="w-full aspect-square flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                              <ImagePlus size={28} className="text-zinc-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Drop image here or click to upload</p>
                              <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WebP — max 5MB</p>
                              <p className="text-xs text-zinc-400">Recommended: 1200×1200px</p>
                            </div>
                          </button>
                        )}
                        <input ref={mainImageInputRef} type="file" accept="image/*"
                          onChange={e => handleImageUpload(e.target.files, "main")} className="hidden" />
                      </div>

                      {/* Tips panel */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Image tips</h4>
                        {[
                          { icon: "🎯", tip: "Use a white or light grey background" },
                          { icon: "📐", tip: "Square aspect ratio (1:1) works best" },
                          { icon: "🔍", tip: "High resolution for zoom quality" },
                          { icon: "💡", tip: "Good lighting reveals product detail" },
                          { icon: "🚫", tip: "Avoid watermarks and text overlays" },
                        ].map(({ icon, tip }, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                            <span className="text-base leading-none mt-0.5">{icon}</span>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  {/* Gallery */}
                  <SectionCard title={`Gallery Images (${formData.gallery_images?.length || 0})`} icon={<Grid size={14} />} accent="violet">
                    <div
                      className={`rounded-2xl border-2 border-dashed p-6 transition-all duration-200 ${
                        dragOver === "gallery" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-zinc-200 dark:border-zinc-700"
                      }`}
                      onDragOver={e => { e.preventDefault(); setDragOver("gallery"); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, "gallery")}
                    >
                      {/* Existing gallery grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                        {(formData.gallery_images || []).map((img, index) => (
                          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                            <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button type="button" onClick={() => setPreviewImage(img)}
                                className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors">
                                <Eye size={14} />
                              </button>
                              <button type="button"
                                onClick={() => patch({ gallery_images: formData.gallery_images?.filter((_, i) => i !== index) })}
                                className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 w-5 h-5 bg-black/60 text-white text-[10px] font-bold rounded-md flex items-center justify-center">
                              {index + 1}
                            </span>
                          </div>
                        ))}

                        {/* Add more tile */}
                        <button type="button" onClick={() => galleryInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500 transition-all bg-zinc-50 dark:bg-zinc-800/50">
                          <Plus size={22} />
                          <span className="text-xs font-medium">Add</span>
                        </button>
                      </div>

                      <div className="text-center">
                        <button type="button" onClick={() => galleryInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-medium transition-all border border-zinc-200 dark:border-zinc-700">
                          <Upload size={14} />
                          Upload more images
                        </button>
                        <p className="text-xs text-zinc-400 mt-2">or drag & drop files anywhere in this area</p>
                      </div>
                    </div>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple
                      onChange={e => { Array.from(e.target.files || []).forEach(f => handleImageUpload([f] as any, "gallery")); }}
                      className="hidden" />
                  </SectionCard>
                </motion.div>
              )}

              {/* ── PRICING TAB ── */}
              {activeTab === "pricing" && (
                <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  <div className="lg:col-span-2 space-y-5">
                    <SectionCard title="Pricing" icon={<DollarSign size={14} />} accent="green">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label="Selling Price (₹)" required>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₹</span>
                            <input type="number" step="0.01" required value={formData.price}
                              onChange={e => patch({ price: parseFloat(e.target.value) || 0 })}
                              className={`${inputCls} pl-7 font-semibold text-base`} placeholder="0.00" />
                          </div>
                        </FormField>
                        <FormField label="Compare At (₹)" hint="Strike-through price">
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₹</span>
                            <input type="number" step="0.01" value={formData.compare_at_price ?? ""}
                              onChange={e => patch({ compare_at_price: parseFloat(e.target.value) || null as any })}
                              className={`${inputCls} pl-7 line-through decoration-red-400`} placeholder="0.00" />
                          </div>
                        </FormField>
                        <FormField label="Cost per Item (₹)" hint="Not shown to customers">
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₹</span>
                            <input type="number" step="0.01" value={formData.cost_per_item ?? ""}
                              onChange={e => patch({ cost_per_item: parseFloat(e.target.value) || null as any })}
                              className={`${inputCls} pl-7`} placeholder="0.00" />
                          </div>
                        </FormField>
                      </div>

                      {/* Margin calculator */}
                      {formData.price > 0 && formData.cost_per_item && formData.cost_per_item > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Profit margin</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-300 text-base">
                              {(((formData.price - formData.cost_per_item) / formData.price) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-emerald-200 dark:bg-emerald-900">
                            <div className="h-2 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, ((formData.price - formData.cost_per_item) / formData.price) * 100)}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Discount badge preview */}
                      {formData.compare_at_price && formData.compare_at_price > formData.price && (
                        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Showing {Math.round(((formData.compare_at_price - formData.price) / formData.compare_at_price) * 100)}% off badge
                          </span>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard title="Inventory" icon={<BarChart2 size={14} />} accent="green">
                      <div className="space-y-4">
                        <Toggle id="track_inventory" checked={formData.track_inventory} onChange={v => patch({ track_inventory: v })}
                          label="Track inventory" sub="Manage stock count for this product" />
                        {formData.track_inventory && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormField label="Quantity in Stock">
                              <input type="number" value={formData.inventory_quantity ?? 0}
                                onChange={e => patch({ inventory_quantity: parseInt(e.target.value) || 0 })}
                                className={inputCls} placeholder="0" />
                            </FormField>
                            <div className="flex flex-col justify-end pb-1">
                              <Toggle id="allow_backorder" checked={formData.allow_backorder} onChange={v => patch({ allow_backorder: v })}
                                label="Allow backorders" sub="Accept orders when out of stock" />
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="space-y-5">
                    <SectionCard title="Installation Service" icon={<Zap size={14} />} accent="orange">
                      <div className="space-y-4">
                        <Toggle id="installation_available" checked={formData.installation_available} onChange={v => patch({ installation_available: v })}
                          label="Offer installation" sub="Professional installation by technicians" />
                        {formData.installation_available && (
                          <div className="space-y-3 pt-1">
                            <FormField label="Installation Charge (₹)">
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                                <input type="number" step="0.01" value={formData.installation_charge ?? 0}
                                  onChange={e => patch({ installation_charge: parseFloat(e.target.value) || 0 })}
                                  className={`${inputCls} pl-7`} placeholder="0.00" />
                              </div>
                            </FormField>
                            <FormField label="What's included">
                              <textarea value={formData.installation_description ?? ""}
                                onChange={e => patch({ installation_description: e.target.value })}
                                className={`${inputCls} resize-none`} rows={4}
                                placeholder="Describe what the installation service includes…" />
                            </FormField>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>
                </motion.div>
              )}

              {/* ── SETTINGS TAB ── */}
              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard title="SEO" icon={<Search size={14} />} accent="blue">
                    <div className="space-y-4">
                      <FormField label="Meta Title" hint="Defaults to product name if blank">
                        <input type="text" value={formData.meta_title ?? ""}
                          onChange={e => patch({ meta_title: e.target.value })}
                          className={inputCls} placeholder="SEO optimized title" />
                        <p className="text-xs text-zinc-400 mt-1">{(formData.meta_title || formData.name || "").length}/70 characters</p>
                      </FormField>
                      <FormField label="Meta Description">
                        <textarea value={formData.meta_description ?? ""}
                          onChange={e => patch({ meta_description: e.target.value })}
                          className={`${inputCls} resize-none`} rows={3}
                          placeholder="Describe the page for search engines…" />
                        <p className="text-xs text-zinc-400 mt-1">{(formData.meta_description || "").length}/160 characters</p>
                      </FormField>
                    </div>
                  </SectionCard>

                  <SectionCard title="Dimensions & Weight" icon={<Package size={14} />} accent="slate">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <FormField label="Length">
                          <input type="number" value={formData.length ?? ""}
                            onChange={e => patch({ length: parseFloat(e.target.value) || null as any })}
                            className={inputCls} placeholder="0" />
                        </FormField>
                        <FormField label="Width">
                          <input type="number" value={formData.width ?? ""}
                            onChange={e => patch({ width: parseFloat(e.target.value) || null as any })}
                            className={inputCls} placeholder="0" />
                        </FormField>
                        <FormField label="Height">
                          <input type="number" value={formData.height ?? ""}
                            onChange={e => patch({ height: parseFloat(e.target.value) || null as any })}
                            className={inputCls} placeholder="0" />
                        </FormField>
                      </div>
                      <FormField label="Dimension Unit">
                        <select value={formData.dimension_unit ?? "cm"}
                          onChange={e => patch({ dimension_unit: e.target.value })}
                          className={inputCls}>
                          <option value="cm">cm</option><option value="mm">mm</option><option value="in">in</option>
                        </select>
                      </FormField>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Weight">
                          <input type="number" value={formData.weight ?? ""}
                            onChange={e => patch({ weight: parseFloat(e.target.value) || null as any })}
                            className={inputCls} placeholder="0" />
                        </FormField>
                        <FormField label="Weight Unit">
                          <select value={formData.weight_unit ?? "kg"}
                            onChange={e => patch({ weight_unit: e.target.value })}
                            className={inputCls}>
                            <option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option>
                          </select>
                        </FormField>
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* Image preview lightbox */}
        <AnimatePresence>
          {previewImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
              onClick={() => setPreviewImage(null)}>
              <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                src={previewImage} alt="Preview" className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()} />
              <button onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors">
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag size={24} className="text-blue-500" />
            Products
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{products.length} products in your catalog</p>
        </div>
        <button onClick={() => { setShowForm(true); setActiveTab("details"); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            placeholder="Search by name or category…" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
            {(["list", "grid"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-2.5 transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
                {mode === "list" ? <List size={16} /> : <Grid size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid view */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 relative overflow-hidden">
                {product.main_image_url
                  ? <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><Package size={40} className="text-zinc-300" /></div>
                }
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  {product.is_featured && <Badge color="bg-yellow-100 text-yellow-700 border-yellow-200" icon="⭐" label="Featured" />}
                  {product.is_bestseller && <Badge color="bg-red-100 text-red-700 border-red-200" icon="🔥" label="Bestseller" />}
                </div>
                {!product.is_active && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zinc-500 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200">Hidden</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(product)}
                    className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl shadow-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-zinc-200 dark:border-zinc-700">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl shadow-md hover:bg-red-50 hover:text-red-600 transition-colors border border-zinc-200 dark:border-zinc-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-400 font-medium mb-1">{product.category || "Uncategorized"}</p>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-base font-bold text-blue-600">₹{formatProductPrice(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-xs text-zinc-400 line-through">₹{formatProductPrice(product.compare_at_price)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${product.inventory_quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {product.track_inventory ? `${product.inventory_quantity} left` : "In stock"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center gap-4 text-zinc-400">
              <Package size={48} strokeWidth={1.5} />
              <p className="font-medium text-zinc-600 dark:text-zinc-300">No products found</p>
              <p className="text-sm">Try a different search or add your first product</p>
            </div>
          )}
        </div>
      ) : (
        /* Products list view */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Install</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-700">
                          {product.main_image_url
                            ? <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-zinc-300" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate max-w-[200px]">{product.name}</p>
                          {product.sku && <p className="text-xs text-zinc-400 font-mono mt-0.5">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        {product.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">₹{formatProductPrice(product.price)}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-zinc-400 line-through decoration-red-400">₹{formatProductPrice(product.compare_at_price)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${product.inventory_quantity > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
                        <span className={`text-xs font-semibold ${product.inventory_quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {product.track_inventory ? `${product.inventory_quantity}` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {product.installation_available
                        ? <span className="text-xs font-semibold text-orange-600">₹{product.installation_charge}</span>
                        : <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.is_active
                          ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full"><Check size={10} />Active</span>
                          : <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full"><EyeOff size={10} />Hidden</span>}
                        {product.is_featured && <span className="text-xs text-yellow-600">⭐</span>}
                        {product.is_bestseller && <span className="text-xs text-red-500">🔥</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(product)}
                          className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <Package size={44} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
                      <p className="font-semibold text-zinc-600 dark:text-zinc-300">No products found</p>
                      <p className="text-sm text-zinc-400 mt-1">Try a different search or add your first product</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
