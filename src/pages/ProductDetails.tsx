import { safeJsonLd } from "@/lib/security";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPublicProduct, listPublicProducts } from "@/lib/publicApi";
import { nativeWishlist } from "@/lib/cartApi";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Zap,
  Star,
  ChevronRight,
  Package,
  Truck,
  Shield,
  Plus,
  Minus,
  Heart,
  Share2,
  Copy,
  ZoomIn,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  main_image_url?: string;
  gallery_images?: string[];
  category?: string;
  subcategory?: string;
  brand?: string;
  tags?: string[];
  specifications?: Json;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  inventory_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  installation_available: boolean;
  installation_charge: number;
  installation_description?: string;
  weight?: number;
  weight_unit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimension_unit?: string;
  sku?: string;
  meta_title?: string;
  meta_description?: string;
}

/* ─── skeleton ──────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-${i === 1 ? 10 : 4} bg-muted rounded animate-pulse w-${i % 2 === 0 ? "3/4" : "full"}`} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── lightbox ──────────────────────────────────────────────── */
const Lightbox = ({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState(index);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Image lightbox"
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        ✕
      </button>
      <img
        src={images[current]}
        alt={`Image ${current + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition ${i === current ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ─── main component ─────────────────────────────────────────── */
const ProductDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMutating, setWishlistMutating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  /* ── fetch ── */
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setProduct(null);

    getPublicProduct(slug)
      .then((data) => {
        if (!data) throw new Error("Product not found");
        setProduct(data);
        setLoading(false);

        /* SEO */
        document.title = data.meta_title || `${data.name} | Electrobuddy`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", data.meta_description || data.short_description || "");
      })
      .catch(() => {
        toast.error("Product not found");
        navigate("/products");
      });
  }, [slug, navigate]);

  useEffect(() => {
    if (!product) return;

    const loadRelated = async () => {
      const sameCategory = product.category
        ? await listPublicProducts({ category: product.category, limit: 5, sort: 'featured' })
        : [];
      let related = sameCategory.filter((p: Product) => p.id !== product.id).slice(0, 4);
      if (related.length < 4 && product.brand) {
        const sameBrand = await listPublicProducts({ brand: product.brand, limit: 5, sort: 'featured' });
        const seen = new Set([product.id, ...related.map((p: Product) => p.id)]);
        related = [...related, ...sameBrand.filter((p: Product) => !seen.has(p.id))].slice(0, 4);
      }
      setRelatedProducts(related as Product[]);
    };
    loadRelated().catch(() => setRelatedProducts([]));
  }, [product]);

  useEffect(() => {
    let active = true;
    if (!product || !user) {
      setWishlisted(false);
      setWishlistLoading(false);
      return () => { active = false; };
    }
    setWishlistLoading(true);
    nativeWishlist.list()
      .then((rows) => { if (active) setWishlisted(rows.some((row) => row.product_id === product.id)); })
      .catch(() => { if (active) setWishlisted(false); })
      .finally(() => { if (active) setWishlistLoading(false); });
    return () => { active = false; };
  }, [product?.id, user?.id]);

  const handleWishlist = async () => {
    if (!product || wishlistMutating) return;
    if (!user) { toast.error("Please sign in to use your wishlist"); return; }
    const wasWishlisted = wishlisted;
    setWishlistMutating(true);
    setWishlisted(!wasWishlisted);
    try {
      const rows = wasWishlisted ? await nativeWishlist.remove(product.id) : await nativeWishlist.add(product.id);
      setWishlisted(rows.some((row) => row.product_id === product.id));
      toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      setWishlisted(wasWishlisted);
      toast.error("Could not update wishlist");
    } finally {
      setWishlistMutating(false);
    }
  };

  /* ── actions ── */
  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(product, quantity, false);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, false);
    setTimeout(() => navigate("/checkout"), 300);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maxQty = product?.track_inventory ? product.inventory_quantity : 999;
  const canAddToCart =
    !product?.track_inventory ||
    product.inventory_quantity > 0 ||
    product.allow_backorder;

  const discount =
    product?.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;

  if (loading) return <Skeleton />;
  if (!product) return null;

  const allImages = [product.main_image_url, ...(product.gallery_images ?? [])].filter(
    Boolean
  ) as string[];

  /* ── structured data ── */
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: allImages,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: canAddToCart
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      {/* structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={allImages} index={selectedImage} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>

      <div className="product-details-page bg-gray-50 dark:bg-gray-900 min-h-screen">
        <style>{`

          .product-details-page {
            font-family: 'Poppins', sans-serif;
          }

          .product-details-page h1,
          .product-details-page h2,
          .product-details-page h3,
          .product-details-page h4,
          .product-details-page h5,
          .product-details-page h6 {
            font-weight: 700;
          }
        `}</style>
        <div className=" px-4 py-8">
          {/* breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/products" className="hover:text-foreground transition">Products</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  to={`/products?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-foreground transition"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
            {/* ── Images ── */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div
                className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative group cursor-zoom-in"
                onClick={() => allImages.length > 0 && setLightboxOpen(true)}
              >
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Zap className="w-24 h-24 text-muted-foreground opacity-10" />
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        selectedImage === i
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Info ── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              {/* badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.category && (
                  <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
                {product.brand && (
                  <span className="text-xs font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full">
                    {product.brand}
                  </span>
                )}
                {product.is_featured && (
                  <span className="text-xs font-medium bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Featured
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="text-xs font-medium bg-red-500/10 text-red-600 px-3 py-1 rounded-full">
                    🔥 Bestseller
                  </span>
                )}
              </div>

              {/* title + actions */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-heading font-bold leading-tight">{product.name}</h1>
                <div className="flex gap-2 flex-shrink-0 mt-1">
                  <button
                    onClick={() => void handleWishlist()}
                    className={`p-2 rounded-lg border transition ${
                      wishlisted
                        ? "border-red-300 bg-red-50 text-red-500"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={wishlisted}
                    disabled={wishlistLoading || wishlistMutating}
                  >
                    <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition"
                    aria-label="Share product"
                  >
                    {copied ? <Copy className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {product.short_description && (
                <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
              )}

              {product.sku && (
                <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</p>
              )}

              {/* price card */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.compare_at_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                {discount && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    You save ₹{(product.compare_at_price! - product.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({discount}% off)
                  </p>
                )}
              </div>

              {/* stock */}
              <div className="flex items-center gap-2 text-sm">
                {product.track_inventory ? (
                  product.inventory_quantity > 0 ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <Package className="w-4 h-4" />
                      {product.inventory_quantity <= 5
                        ? `Only ${product.inventory_quantity} left in stock!`
                        : `In Stock (${product.inventory_quantity} available)`}
                    </span>
                  ) : product.allow_backorder ? (
                    <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <Package className="w-4 h-4" />
                      Available for Backorder
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Out of Stock
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <Package className="w-4 h-4" />
                    Available to Order
                  </span>
                )}
              </div>

              {/* qty */}
              {canAddToCart && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg border border-border hover:bg-muted transition flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-semibold" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="w-10 h-10 rounded-lg border border-border hover:bg-muted transition flex items-center justify-center disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {product.track_inventory && (
                      <span className="text-xs text-muted-foreground">
                        {product.allow_backorder ? "Backorders allowed" : `Max ${maxQty}`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !canAddToCart}
                  className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!canAddToCart}
                  className="flex-1 bg-secondary text-secondary-foreground py-4 rounded-xl font-semibold hover:bg-secondary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>

              {/* trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                  <p className="text-xs font-medium">Free Shipping</p>
                  <p className="text-[10px] text-muted-foreground">Orders above ₹500</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                  <p className="text-xs font-medium">Secure Payment</p>
                  <p className="text-[10px] text-muted-foreground">100% protected</p>
                </div>
                <div className="text-center">
                  <Package className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                  <p className="text-xs font-medium">Easy Returns</p>
                  <p className="text-[10px] text-muted-foreground">7-day policy</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Tabs ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl overflow-hidden mb-14"
          >
            <div className="border-b border-border overflow-x-auto">
              <div className="flex">
                {["description", product.installation_available ? "installation" : null, product.specifications && Object.keys(product.specifications).length > 0 ? "specifications" : null]
                  .filter(Boolean)
                  .map((tab) => (
                    <button
                      key={tab!}
                      onClick={() => setActiveTab(tab!)}
                      className={`px-6 py-4 font-medium whitespace-nowrap transition text-sm ${
                        activeTab === tab
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab === "description" ? "Description" : tab === "installation" ? "Installation" : "Specifications"}
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-3">Product Details</h3>
                  <p className="text-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {product.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specifications" && product.specifications && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(product.specifications as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
                        <span className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {/* physical specs */}
                  {(product.weight || (product.length && product.width && product.height)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {product.weight && (
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
                          <span className="font-medium text-muted-foreground">Weight</span>
                          <span>{product.weight} {product.weight_unit || "kg"}</span>
                        </div>
                      )}
                      {product.length && product.width && product.height && (
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
                          <span className="font-medium text-muted-foreground">Dimensions (L×W×H)</span>
                          <span>{product.length}×{product.width}×{product.height} {product.dimension_unit || "cm"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "installation" && product.installation_available && (
                <div className="flex flex-col sm:flex-row items-start gap-6 p-5 bg-primary/5 rounded-xl">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Professional Installation Service</h3>
                    <p className="text-muted-foreground text-sm">{product.installation_description}</p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">₹{product.installation_charge.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">One-time charge</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Related Products ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-heading font-bold">Related Products</h2>
              {product.category && (
                <Link
                  to={`/products?category=${encodeURIComponent(product.category)}`}
                  className="text-sm text-primary hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>

            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/products/${rp.slug}`}
                    className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {rp.main_image_url ? (
                        <img
                          src={rp.main_image_url}
                          alt={rp.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-12 h-12 text-muted-foreground opacity-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1.5 leading-snug">{rp.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-primary">
                          ₹{rp.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {rp.compare_at_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{rp.compare_at_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      {rp.track_inventory && (
                        <p className={`text-[10px] mt-1 font-medium ${rp.inventory_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                          {rp.inventory_quantity > 0 ? `${rp.inventory_quantity} in stock` : "Out of stock"}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground text-sm">No related products found</p>
                <Link to="/products" className="text-primary hover:underline text-sm mt-2 inline-block">
                  Browse all products →
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;