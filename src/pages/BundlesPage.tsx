import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useBundles, calculateBundlePrice } from "@/hooks/useBundles";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const BundlesPage = () => {
  const { bundles, loading } = useBundles({ showOnBundlesPage: true });
  const { settings } = useStoreSettings();

  return (
    <Layout>
      {/* Hero */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-medium text-foreground mb-4">
              Bundle Deals
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Pieces sold together at a bundle price
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-display font-medium text-foreground mb-2">
              No Bundles Available
            </h2>
            <p className="text-muted-foreground mb-6">
              Nothing running right now
            </p>
            <Button asChild variant="outline">
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle, index) => {
              const { originalTotal, bundlePrice, savings } = calculateBundlePrice(bundle);
              const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

              return (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link to={`/bundle/${bundle.slug}`} className="block">
                    {/* Image grid */}
                    <div className="relative overflow-hidden bg-secondary mb-5">
                      <div className={`grid gap-[2px] ${bundle.products.length >= 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {bundle.products.slice(0, 4).map((bp, idx) => {
                          const primaryImage =
                            bp.product?.images?.find((img) => img.is_primary) ||
                            bp.product?.images?.[0];
                          return (
                            <div
                              key={bp.id}
                              className={`overflow-hidden ${
                                bundle.products.length === 3 && idx === 2 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                              }`}
                            >
                              {primaryImage ? (
                                <img
                                  src={primaryImage.image_url}
                                  alt={bp.product?.name || "Product"}
                                  className="w-full h-full object-cover transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Savings overlay */}
                      {savingsPercent > 0 && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium">
                          Save {savingsPercent}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="text-lg font-display font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {bundle.name}
                    </h3>
                    {bundle.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {bundle.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-display font-medium text-foreground">
                        {formatPrice(bundlePrice, settings.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(originalTotal, settings.currency)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {bundle.products.length} items included
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BundlesPage;
