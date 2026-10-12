import { useState, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useOptimizedData";

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

const UserProducts = () => {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

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

  const showInitialSkeleton = loading && products.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900 dark:text-white mb-1 sm:mb-2">Browse Products</h1>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">Explore our wide range of high-quality electrical products</p>
      </div>

      {/* ── Mobile: Search bar only ── */}
      <div className="sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-20 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition text-sm text-zinc-900 dark:text-white"
            aria-label="Search products"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-600"
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
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs whitespace-nowrap"
              >
                "{searchInput}" <X className="w-3 h-3" />
              </button>
            )}
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs whitespace-nowrap"
              >
                {selectedCategory} <X className="w-3 h-3" />
              </button>
            )}
            {selectedBrand !== "all" && (
              <button
                onClick={() => setSelectedBrand("all")}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs whitespace-nowrap"
              >
                {selectedBrand} <X className="w-3 h-3" />
              </button>
            )}
            {(priceMin > 0 || priceMax < 100000) && (
              <button
                onClick={() => { setPriceMin(0); setPriceMax(100000); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs whitespace-nowrap"
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
      <div className="hidden sm:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">

        {/* Row 1: Search + Sort + Filter + Clear */}
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition text-sm text-zinc-900 dark:text-white"
              aria-label="Search products"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none sm:w-52 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-sm text-zinc-900 dark:text-white"
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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
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
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition whitespace-nowrap"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-4 border-t border-zinc-200 dark:border-zinc-800">

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">
                    Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">
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
                      className="w-1/2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      aria-label="Minimum price"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Max ₹"
                      value={priceMax >= 100000 ? "" : priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value) || 100000)}
                      className="w-1/2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
        <div className="sm:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer handle */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Category */}
              <div>
                <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">
                  Price Range: ₹{priceMin.toLocaleString()} – {priceMax >= 100000 ? "Any" : `₹${priceMax.toLocaleString()}`}
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min ₹"
                    value={priceMin || ""}
                    onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                    className="flex-1 px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    aria-label="Minimum price"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max ₹"
                    value={priceMax >= 100000 ? "" : priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value) || 100000)}
                    className="flex-1 px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-semibold mb-2 block text-zinc-700 dark:text-zinc-300">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
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
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-1">
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
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Search className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">No products found</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Try adjusting your filters or search term
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
            {visible.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8 sm:mt-10 pb-4 sm:pb-0">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs sm:text-sm shadow-md shadow-blue-500/25"
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
  );
};

export default UserProducts;
