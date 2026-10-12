import { validateImageUpload } from "@/lib/security";
import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo, useCallback } from "react";
import { listAdminCatalog, listAdminOffers, createAdminOffer, updateAdminOffer, deleteAdminOffer } from "@/lib/nativeCatalogAdmin";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, Tag, Calendar, 
  CheckCircle, XCircle, Save, ArrowLeft, 
  Image as ImageIcon, Layout, Target, 
  ChevronRight, ExternalLink, Globe,
  Package, Wrench, TicketPercent
} from "lucide-react";
import { uploadAdminImage } from "@/lib/storageApi";
import { useToast } from "@/hooks/use-toast";
import { useAdminCacheInvalidation } from "@/hooks/useOptimizedData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  banner_url: string | null;
  type: string;
  value: number | null;
  min_purchase: number | null;
  max_discount: number | null;
  start_date: string;
  end_date: string | null;
  priority: number;
  visibility: string[];
  cta_text: string | null;
  cta_link: string | null;
  bg_gradient: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();
  const { invalidateProducts, invalidateServices } = useAdminCacheInvalidation();

  const emptyOffer: Partial<Offer> = {
    title: "",
    subtitle: "",
    description: "",
    banner_url: null,
    type: "percentage",
    value: 0,
    min_purchase: 0,
    max_discount: null,
    start_date: new Date().toISOString(),
    end_date: null,
    priority: 0,
    visibility: ["home_hero"],
    cta_text: "Grab Offer",
    cta_link: "/#request-service",
    bg_gradient: "from-blue-600 to-blue-800",
    status: "active",
    is_active: true
  };

  const [formData, setFormData] = useState<any>(emptyOffer);

  // Memoized Lists for Form (Moved here to follow Rules of Hooks)
  const renderedServices = useMemo(() => services.map(s => (
    <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
      <Checkbox 
        checked={selectedServices.includes(s.id)}
        onCheckedChange={(checked) => {
          if (checked) setSelectedServices(prev => [...prev, s.id]);
          else setSelectedServices(prev => prev.filter(id => id !== s.id));
        }}
      />
      <span className="text-sm">{s.title}</span>
    </label>
  )), [services, selectedServices]);

  const renderedProducts = useMemo(() => products.map(p => (
    <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
      <Checkbox 
        checked={selectedProducts.includes(p.id)}
        onCheckedChange={(checked) => {
          if (checked) setSelectedProducts(prev => [...prev, p.id]);
          else setSelectedProducts(prev => prev.filter(id => id !== p.id));
        }}
      />
      <span className="text-sm truncate">{p.name}</span>
    </label>
  )), [products, selectedProducts]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offerRows, serviceRows, productRows] = await Promise.all([
        listAdminOffers<any>(), listAdminCatalog<any>("services"), listAdminCatalog<any>("products")
      ]);
      setOffers((offerRows||[]).map((o:any)=>({...o,image_url:o.banner_url??null,link_url:o.cta_link??null,sort_order:o.priority??0})));
      setServices(serviceRows || []); setProducts(productRows || []);
    } catch (error: any) { toast({title:"Error fetching data",description:error.message,variant:"destructive"}); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 2MB Limit to fix "taking too much time" issue
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB. Unoptimized photos from phones are often too large.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const validationError = validateImageUpload(file);
      if (validationError) { toast.error(validationError); return; }
      const uploaded = await uploadAdminImage(file, "offers");
      setFormData({ ...formData, banner_url: uploaded.url });
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      logger.error("[AdminOffers] Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Check the configured object-storage provider and upload permissions.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, banner_url: null });
    toast({ title: "Image removed from offer" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit validation
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    
    if (uploading) {
      toast({ title: "Please wait for images to finish uploading", variant: "destructive" });
      return;
    }

    setSaving(true);
    
    try {
      // Clean data for database (only include valid columns)
      const submitData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        banner_url: formData.banner_url,
        type: formData.type || "percentage",
        value: formData.value ?? 0,
        min_purchase: formData.min_purchase ?? 0,
        max_discount: formData.max_discount || null,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || null,
        priority: formData.priority ?? 0,
        visibility: formData.visibility || ["home_hero"],
        cta_text: formData.cta_text || null,
        cta_link: formData.cta_link || null,
        bg_gradient: formData.bg_gradient || null,
        status: formData.status || "active",
        is_active: formData.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      
      const payload = { ...submitData, service_ids: selectedServices, product_ids: selectedProducts };
      if (editingItem) { await updateAdminOffer(editingItem, payload); toast({ title: "Offer updated successfully" }); }
      else { await createAdminOffer(payload); toast({ title: "Offer created successfully" }); }
      
      // Reset after success
      setShowForm(false);
      setEditingItem(null);
      setFormData(emptyOffer);
      setSelectedServices([]);
      setSelectedProducts([]);
      
      // Trigger refreshes
      invalidateProducts();
      invalidateServices();
      await fetchData(); // Force re-fetch list
    } catch (error: any) {
      logger.error("[AdminOffers] Save error:", error);
      toast({
        title: "Error saving offer",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (offer: any) => {
    setEditingItem(offer.id); setFormData(offer);
    setSelectedServices(offer.service_ids || []); setSelectedProducts(offer.product_ids || []); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer? This cannot be undone.")) return;
    
    try {
      await deleteAdminOffer(id);
      toast({ title: "Offer deleted" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const inputClass = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-sm focus:ring-2 focus:ring-blue-500/30 transition-all";

  if (showForm) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingItem(null); }}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Offers
              </button>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {editingItem ? "Edit Offer" : "Create New Offer"}
              </span>
            </div>
            <button
              form="offer-form"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><Save size={16} />Save Changes</>
              )}
            </button>
          </div>
        </div>

        <form id="offer-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Layout className="text-blue-500 w-5 h-5" />
                Banner Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Main Title *</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 🎉 Summer Special: 20% OFF"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Subtitle</Label>
                    <Input
                      value={formData.subtitle || ""}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Short catchy line"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">CTA Text</Label>
                    <Input
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="Grab Offer"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Description</Label>
                  <textarea
                    className="w-full min-h-[100px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Full details of the offer..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <ImageIcon className="text-green-500 w-5 h-5" />
                Visuals & Media
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block text-zinc-500">Banner Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative group w-48 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                      {formData.banner_url ? (
                        <>
                          <img src={formData.banner_url} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-zinc-300" />
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex-1 text-xs text-zinc-400">
                      <p className="font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        {formData.banner_url ? "Image selected" : "Upload banner image"}
                      </p>
                      <p>Recommended: 1200x400px</p>
                      <p className={formData.banner_url ? "" : "text-blue-500 font-bold"}>Optional (Gradient will be used if blank)</p>
                      <p>Max size: 2MB</p>
                      {uploading && <p className="text-blue-500 mt-2 font-bold animate-pulse">Uploading...</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Background Gradient / Color</Label>
                  <Input
                    value={formData.bg_gradient || ""}
                    onChange={(e) => setFormData({ ...formData, bg_gradient: e.target.value })}
                    placeholder="e.g. from-blue-600 to-blue-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Target className="text-purple-500 w-5 h-5" />
                Targeting & Applicability
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="mb-3 block font-bold flex items-center gap-2 text-blue-600">
                    <Wrench className="w-4 h-4" />
                    Applicable Services
                  </Label>
                  <div className="max-h-60 overflow-y-auto border rounded-xl divide-y dark:divide-zinc-800">
                    {renderedServices}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block font-bold flex items-center gap-2 text-green-600">
                    <Package className="w-4 h-4" />
                    Applicable Products
                  </Label>
                  <div className="max-h-60 overflow-y-auto border rounded-xl divide-y dark:divide-zinc-800">
                    {renderedProducts}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Scheduling</h4>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={new Date(formData.start_date).toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Offer Settings</h4>
              
              <div className="space-y-6">
                <div>
                  <Label className="mb-1.5 block text-xs">Discount Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      <SelectItem value="bogo">Buy X Get Y (BOGO)</SelectItem>
                      <SelectItem value="shipping">Free Shipping</SelectItem>
                      <SelectItem value="custom">Custom Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs">Discount Value / Amount</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Priority (Rank)</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-3 pt-2 border-t dark:border-zinc-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox 
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                    />
                    <span className="text-sm font-medium">Is Active</span>
                  </label>
                  
                  <div className="pt-2">
                    <Label className="mb-2 block text-xs">Visibility Locations</Label>
                    <div className="space-y-2">
                      {['home_hero', 'products_page', 'popup'].map(loc => (
                        <label key={loc} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={formData.visibility.includes(loc)}
                            onCheckedChange={(checked) => {
                              if (checked) setFormData({ ...formData, visibility: [...formData.visibility, loc] });
                              else setFormData({ ...formData, visibility: formData.visibility.filter((v: string) => v !== loc) });
                            }}
                          />
                          <span className="text-xs capitalize">{loc.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <Tag size={32} className="text-blue-500" />
            Offer Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Manage your marketing banners, seasonal promotions and service-specific deals.
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData(emptyOffer);
            setShowForm(true);
          }}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 px-6 text-base font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="mr-2" />
          Create New Offer
        </Button>
      </div>

      {/* Grid of Offers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-20 text-center border border-zinc-200 dark:border-zinc-800">
          <ImageIcon className="w-16 h-16 text-zinc-200 dark:text-zinc-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No offers found</h3>
          <p className="text-zinc-500 mb-8">Get started by creating your first promotional banner.</p>
          <Button variant="outline" onClick={() => setShowForm(true)} className="rounded-xl">Create Offer</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <motion.div
              layoutId={offer.id}
              key={offer.id}
              className="group bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[16/8] overflow-hidden">
                {offer.banner_url ? (
                  <img 
                    src={offer.banner_url} 
                    alt={offer.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${offer.bg_gradient || 'from-blue-600 to-indigo-900'} flex items-center justify-center`}>
                    <Tag className="w-12 h-12 text-white/20 -rotate-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    offer.is_active ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'
                  }`}>
                    {offer.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {offer.priority > 0 && (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                      P{offer.priority ?? 0}
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-white font-bold text-lg leading-tight">{offer.title}</h3>
                  <p className="text-white/70 text-xs mt-1">{offer.subtitle ?? ""}</p>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(offer.start_date).toLocaleDateString()}
                      {offer.end_date && ` - ${new Date(offer.end_date).toLocaleDateString()}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={14} className="text-zinc-400" />
                      {offer.visibility.length} locations
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                      {offer.type.toUpperCase()}
                    </span>
                    {(offer.value ?? 0) > 0 && (
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-[10px] font-bold text-blue-600">
                        {offer.type === 'percentage' ? `${offer.value ?? 0}%` : `₹${offer.value ?? 0}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(offer)}
                      className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(offer.id)}
                      className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <Button variant="ghost" className="rounded-xl text-blue-600 font-bold hover:text-blue-700 hover:bg-transparent px-2" asChild>
                    <a href={sanitizeExternalUrl(offer.cta_link) || "/#request-service"} target="_blank" rel="noreferrer">
                      Preview <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
