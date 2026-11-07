import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";

const FeaturedProducts = () => {
  const { products, loading } = useProducts({ featured: true, limit: 8 });

  if (loading) {
    return (
      <section className="py-section-lg bg-background">
        <div className="luxury-container">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-section-lg bg-background">
      <div className="luxury-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-foreground text-xs mb-4 font-body">
            Curated Selection
          </p>
          <h2 className="font-display text-display-md text-foreground">
            Featured This Week
          </h2>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id}
                index={index}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  brand: product.brand?.name || "",
                  price: product.sale_price || product.base_price,
                  originalPrice: product.sale_price ? product.base_price : undefined,
                  image: product.images?.[0]?.image_url || "/placeholder.svg",
                  isNew: product.is_new_arrival,
                  isSale: !!product.sale_price,
                }}
              />
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-14"
        >
          <Link to="/shop" className="btn-luxury">
            <span>View All Products</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
