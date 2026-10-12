import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart } from "lucide-react";
import Section from "@/components/Section";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useOptimizedData";

const ProductsSection = () => {
  // Get first 4 products (featured or regular)
  const { products, loading } = useProducts({ sortBy: 'featured' });
  const displayProducts = products.slice(0, 4);

  return (
    <Section>
      <div className="text-center mb-10 sm:mb-14">
        <div className="sec-badge"><ShoppingCart size={11} /> Shop Online</div>
        <h2 className="sec-title">Quality <span>Products</span></h2>
        <p className="sec-desc">Premium electrical components and accessories for all your needs. Fast delivery and warranty included.</p>
      </div>

      {loading ? (
        /* skeleton */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayProducts.length === 0 ? null : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link to="/products" className="view-all-btn">
          See All Products <ArrowRight size={15} />
        </Link>
      </div>
    </Section>
  );
};

export default ProductsSection;