import { useState, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  AlertCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Fan,
  Tv,
  Snowflake,
  Wrench,
  SatelliteDish,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useProducts } from "@/hooks/useOptimizedData";
import ProductCard from "@/components/ProductCard";
import OfferBannerSlider from "@/components/OfferBannerSlider";

/* ─── debounce hook ─────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── skeleton card ─────────────────────────────────────────── */
const SkeletonCard = memo(() => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-square bg-zinc-200 dark:bg-zinc-800" />
    <div className="p-3 sm:p-4 space-y-3">
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl flex-1" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl flex-1" />
      </div>
    </div>
  </div>
));

/* ─── main component ─────────────────────────────────────────── */
const Products = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0);

  const searchTerm = useDebounce(searchInput, 400);
  const filters = useMemo(() => ({ 
    category: selectedCategory, 
    brand: selectedBrand, 
    searchTerm, 
    sortBy 
  }), [selectedCategory, selectedBrand, searchTerm, sortBy]);
  
  const { products, loading, error, hasMore, loadMore, refetch } = useProducts(filters);

  const categories = useMemo(() => 
    ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  );
  
  const brands = useMemo(() => 
    ["all", ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))],
    [products]
  );

  const visible = useMemo(() => 
    products.filter(
      (p) => p.price >= priceMin && (priceMax >= 100000 || p.price <= priceMax)
    ),
    [products, priceMin, priceMax]
  );

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedBrand !== "all" ||
    searchInput !== "" ||
    priceMin > 0 ||
    priceMax < 100000;

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPriceMin(0);
    setPriceMax(100000);
    setSortBy("featured");
  };

  // Service slides
  const serviceSlides = [
    {
      id: "fan",
      icon: Fan,
      title: "Fan Repair & Installation",
      description: "Ceiling, table & exhaust fans",
      price: "Starting ₹199",
      bg: "from-green-500 to-green-700",
      service: "Fan Installation & Repair"
    },
    {
      id: "lcd-led",
      icon: Tv,
      title: "LCD/LED TV Services",
      description: "Mounting, repair & setup",
      price: "Starting ₹299",
      bg: "from-purple-500 to-purple-700",
      service: "TV Mounting & Repair"
    },
    {
      id: "ac",
      icon: Snowflake,
      title: "AC Repair & Service",
      description: "All brands & models",
      price: "Starting ₹499",
      bg: "from-blue-500 to-blue-700",
      service: "AC Repair & Service"
    },
    {
      id: "electrical",
      icon: Wrench,
      title: "Electrical Services",
      description: "Wiring, short circuit & more",
      price: "Starting ₹399",
      bg: "from-yellow-500 to-orange-600",
      service: "Electrical Services"
    },
    {
      id: "dth",
      icon: SatelliteDish,
      title: "DTH Setup & Service",
      description: "Installation & realignment",
      price: "Starting ₹249",
      bg: "from-indigo-500 to-indigo-700",
      service: "DTH Setup & Service"
    },
    {
      id: "lighting",
      icon: Lightbulb,
      title: "Lighting Solutions",
      description: "Installation & repair",
      price: "Starting ₹149",
      bg: "from-amber-500 to-amber-700",
      service: "Lighting Installation"
    }
  ];

  // Auto-rotate service slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceSlide((prev) => (prev + 1) % serviceSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleServiceClick = (serviceTitle: string) => {
    navigate(`/?service=${encodeURIComponent(serviceTitle)}#request-service`);
  };

  useEffect(() => {
    document.title = "Products | Electrobuddy – Electrical Components & Accessories";
  }, []);

  // Determine if we should show skeleton (only on initial load, not filter changes)
  const showInitialSkeleton = loading && products.length === 0;

  return (
    <div className="products-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <style>{`
        400;500;600;700&display=swap');
        .products-page { font-family: 'Poppins', sans-serif; }
        .products-page h1,.products-page h2,.products-page h3,
        .products-page h4,.products-page h5,.products-page h6 { font-weight: 700; }
        .products-hero {
          position: relative;
          padding: 100px 0 80px;
          overflow: hidden;
          text-align: center;
        }
        @media (max-width: 640px) {
          .products-hero { padding: 80px 0 56px; }
        }
      `}</style>

      <SEO
        title="Electrical Products Online | Switches, Lighting & Accessories in Ujjain"
        description="Shop quality electrical products online - switches, sockets, lighting, wiring accessories and more. Best prices in Ujjain with fast delivery and warranty."
        keywords="electrical products, buy switches online, electrical accessories, lighting products, wiring materials, electrical supplies, MCB, distribution boards, electrical tools"
        canonical="/products"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "Electroo Buddy Products",
          "description": "Quality electrical products and accessories at competitive prices",
          "url": "https://electroobuddy.com/products",
          "telephone": "+91-81093-08287",
          "priceRange": "₹",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Ujjain",
            "addressRegion": "Madhya Pradesh",
            "addressCountry": "IN"
          }
        }}
      />

      {/* ── Dynamic Advertisement Slider ── */}
      <OfferBannerSlider visibility="products_page" />
      
      {/* ── Hero ── */}
      <section className="hero-gradient text-white products-hero slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-full mb-6 sm:mb-8"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-xs sm:text-sm uppercase tracking-wide">
                Quality Electrical Products
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
            >
              Our Products
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base sm:text-xl max-w-3xl mx-auto opacity-90 px-2"
            >
              Discover our wide range of high-quality electrical products and accessories
            </motion.p>
          </motion.div>
        </div>
      </section>


      {/* ── Services Quick Access Slider ── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Our Services
            </h2>
            <button
              onClick={() => navigate("/#services")}
              className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Service Cards Slider */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <motion.div
                className="flex gap-4 sm:gap-6"
                animate={{ x: `-${currentServiceSlide * (100 / 3)}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {serviceSlides.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service.service)}
                      className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 cursor-pointer group"
                    >
                      <div className={`bg-gradient-to-br ${service.bg} text-white p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                            {service.price}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">{service.title}</h3>
                        <p className="text-xs sm:text-sm opacity-90 mb-4">{service.description}</p>
                        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold group-hover:gap-3 transition-all">
                          Book Now <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Service Slider Navigation */}
            <button
              onClick={() => setCurrentServiceSlide((prev) => Math.max(0, prev - 1))}
              disabled={currentServiceSlide === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-4 bg-white dark:bg-gray-800 shadow-lg p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous services"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setCurrentServiceSlide((prev) => Math.min(serviceSlides.length - 3, prev + 1))}
              disabled={currentServiceSlide >= serviceSlides.length - 3}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-4 bg-white dark:bg-gray-800 shadow-lg p-2 sm:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next services"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Content: full-width max-w container ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* ── Mobile: Search bar only ── */}
        <div className="sm:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-20 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition text-sm"
              aria-label="Search products"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                showFilters
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active filters indicator - mobile */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap"
                >
                  "{searchInput}" <X className="w-3 h-3" />
                </button>
              )}
              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap"
                >
                  {selectedCategory} <X className="w-3 h-3" />
                </button>
              )}
              {selectedBrand !== "all" && (
                <button
                  onClick={() => setSelectedBrand("all")}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap"
                >
                  {selectedBrand} <X className="w-3 h-3" />
                </button>
              )}
              {(priceMin > 0 || priceMax < 100000) && (
                <button
                  onClick={() => { setPriceMin(0); setPriceMax(100000); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap"
                >
                  ₹{priceMin}-₹{priceMax >= 100000 ? "Any" : priceMax} <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="px-2.5 py-1 text-xs text-red-500 font-medium whitespace-nowrap"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── Desktop: Filter card ── */}
        <div className="hidden sm:block bg-card border border-border rounded-2xl p-6 mb-6 sm:mb-8 shadow-sm w-full">

          {/* Row 1: Search + Sort + Filter + Clear */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Search — flex-1 takes remaining space */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition text-sm"
                aria-label="Search products"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right controls: sort + filter toggle + clear */}
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none sm:w-52 px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
                aria-label="Sort by"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="name">Name: A–Z</option>
              </select>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition whitespace-nowrap ${
                  showFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background hover:bg-muted"
                }`}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                )}
              </button>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Advanced filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                key="adv"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-4 border-t border-border">

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c === "all" ? "All Categories" : c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                    >
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b === "all" ? "All Brands" : b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price range */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Price: ₹{priceMin.toLocaleString()} –{" "}
                      {priceMax >= 100000 ? "Any" : `₹${priceMax.toLocaleString()}`}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="Min ₹"
                        value={priceMin || ""}
                        onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                        aria-label="Minimum price"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Max ₹"
                        value={priceMax >= 100000 ? "" : priceMax}
                        onChange={(e) => setPriceMax(Number(e.target.value) || 100000)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile: Filter drawer (overlay) ── */}
        {showFilters && (
          <div className="sm:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer handle */}
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h3 className="font-semibold text-base">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-muted rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Category */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === "all" ? "All Categories" : c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b === "all" ? "All Brands" : b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Price Range: ₹{priceMin.toLocaleString()} – {priceMax >= 100000 ? "Any" : `₹${priceMax.toLocaleString()}`}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={0}
                      placeholder="Min ₹"
                      value={priceMin || ""}
                      onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                      className="flex-1 px-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                      aria-label="Minimum price"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Max ₹"
                      value={priceMax >= 100000 ? "" : priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value) || 100000)}
                      className="flex-1 px-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 pb-4">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-muted transition"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-1">
            {visible.length === 0
              ? "No products found"
              : `Showing ${visible.length} product${visible.length !== 1 ? "s" : ""}`}
            {hasActiveFilters && " (filtered)"}
          </p>
        )}

        {/* ── Grid ── */}
        {showInitialSkeleton ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-red-500 text-lg font-semibold">Failed to load products</p>
            <button
              onClick={() => void refetch()}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <p className="text-lg font-semibold">No products found</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or search term
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 2-col mobile → 3-col tablet → 4-col desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
              {visible.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8 sm:mt-12 pb-4 sm:pb-0">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs sm:text-sm shadow-sm"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      Load More Products
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
