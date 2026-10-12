import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Plus, Check } from "lucide-react";
import { useState, memo } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  main_image_url?: string;
  is_featured?: boolean;
  track_inventory?: boolean;
  inventory_quantity?: number;
  category?: string;
  short_description?: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = memo(({ product, index = 0 }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;

  const outOfStock = product.track_inventory && product.inventory_quantity === 0;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    try {
      addToCart(product, 1, false);
      toast.success(`${product.name} added to cart`);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="h-full w-full">
      <Link to={`/products/${product.slug}`} className="block group h-full">
        <div className="h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">

          {/* ── Image ── */}
          <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative flex-shrink-0">
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            )}
            
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                <ShoppingCart size={40} className="text-zinc-300 dark:text-zinc-600" />
              </div>
            )}

            {/* Top badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {product.is_featured && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  <Star size={10} className="fill-current" />
                  Featured
                </span>
              )}
              {discount && (
                <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Out of stock overlay */}
            {outOfStock && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* ── Info ── */}
          <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">

            {/* Category */}
            {product.category && (
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md inline-block w-fit uppercase tracking-wide">
                {product.category}
              </span>
            )}

            {/* Name */}
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-snug flex-1 text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-zinc-400 line-through">
                  ₹{product.compare_at_price.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* ── Buttons ── */}
            {!outOfStock ? (
              <div className="flex gap-2 mt-auto pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    added
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  }`}
                  title="Add to Cart"
                >
                  {added ? (
                    <>
                      <Check size={14} /> Added
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <ShoppingCart size={14} />
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-2">
                <div className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-xl text-xs font-semibold text-center border border-zinc-200 dark:border-zinc-700">
                  Out of Stock
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
