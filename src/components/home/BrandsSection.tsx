import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { useBrands } from "@/hooks/useProducts";

const BrandsSection = () => {
  const { brands, loading } = useBrands();

  if (loading) {
    return (
      <section className="py-section-lg bg-background border-y border-border">
        <div className="luxury-container">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  const displayBrands = brands.slice(0, 6);

  return (
    <section className="py-section-lg bg-background border-y border-border">
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
            Curated Luxury
          </p>
          <h2 className="font-display text-display-md text-foreground">
            Our Designers
          </h2>
        </motion.div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          {displayBrands.map((brand, index) => (
            <motion.div
              key={brand.slug}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/shop?brand=${brand.slug}`}
                className="block bg-background py-10 px-6 text-center group transition-colors hover:bg-charcoal"
              >
                <span className="font-display text-lg md:text-xl text-muted-foreground group-hover:text-foreground transition-colors">
                  {brand.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            to="/brands"
            className="text-sm font-body text-primary hover:text-foreground transition-colors"
          >
            View All Brands <ArrowRight aria-hidden="true" className="inline-block w-4 h-4 ml-1 align-text-bottom" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsSection;
