import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useBundles, calculateBundlePrice } from "@/hooks/useBundles";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const BundleDealsSection = () => {
  const { bundles, loading } = useBundles({ showOnHomepage: true, limit: 3 });
  const { settings } = useStoreSettings();

  if (loading || bundles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 relative">
          <span className="text-xs text-muted-foreground font-medium">
            Curated for you
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground mt-2">
            Bundle Deals
          </h2>
          <div className="w-12 h-px bg-foreground/30 mx-auto mt-6" />
          <Link
            to="/bundles"
            className="hidden md:flex absolute right-0 bottom-2 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bundles */}
        <div
          className={`grid gap-8 mx-auto ${
            bundles.length === 1
              ? "max-w-md grid-cols-1"
              : bundles.length === 2
              ? "max-w-3xl grid-cols-1 sm:grid-cols-2"
              : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {bundles.map((bundle, index) => {
            const { originalTotal, bundlePrice, savings } = calculateBundlePrice(bundle);
            const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={`/bundle/${bundle.slug}`} className="block">
                  {/* Image mosaic */}
                  <div className="relative overflow-hidden bg-secondary mb-4">
                    <div className="grid grid-cols-2 gap-[2px]">
                      {bundle.products.slice(0, 3).map((bp, idx) => {
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

                    {savingsPercent > 0 && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium">
                        Save {savingsPercent}%
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                    {bundle.name}
                  </h3>

                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-display font-medium text-foreground">
                      {formatPrice(bundlePrice, settings.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(originalTotal, settings.currency)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/bundles">
              View All Bundles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BundleDealsSection;
