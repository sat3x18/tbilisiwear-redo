import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useBundles, calculateBundlePrice, Bundle } from "@/hooks/useBundles";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface BundleSuggestionProps {
  productId: string;
}

const BundleSuggestion = ({ productId }: BundleSuggestionProps) => {
  const { bundles, loading } = useBundles({ 
    productId, 
    showOnProductPages: true, 
    limit: 1 
  });
  const { addBundleToCart } = useCart();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [addingBundle, setAddingBundle] = useState<string | null>(null);

  if (loading || bundles.length === 0) {
    return null;
  }

  const bundle = bundles[0];
  const { originalTotal, bundlePrice, savings } = calculateBundlePrice(bundle);
  const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

  const handleAddBundleToCart = async () => {
    setAddingBundle(bundle.id);
    
    try {
      const success = await addBundleToCart(bundle);

      if (success) {
        toast({
          title: "Bundle added to cart",
          description: `${bundle.name} has been added to your cart with bundle discount.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bundle to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingBundle(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 p-6 bg-secondary/50 rounded-xl border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-display font-medium text-foreground">
          Frequently Bought Together
        </h3>
        {savingsPercent > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Save {savingsPercent}%
          </Badge>
        )}
      </div>

      {/* Products Row */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {bundle.products.map((bp, index) => {
          const primaryImage =
            bp.product?.images?.find((img) => img.is_primary) ||
            bp.product?.images?.[0];
          const isCurrentProduct = bp.product_id === productId;

          return (
            <div key={bp.id} className="flex items-center">
              {index > 0 && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-2">
                  <Plus className="w-4 h-4" />
                </div>
              )}
              <Link
                to={bp.product ? `/product/${bp.product.slug}` : "#"}
                className={`block relative ${isCurrentProduct ? "ring-2 ring-primary rounded-lg" : ""}`}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-background">
                  {primaryImage ? (
                    <img
                      src={primaryImage.image_url}
                      alt={bp.product?.name || "Product"}
                      className="w-full h-full object-cover transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {isCurrentProduct && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Product Names */}
      <div className="space-y-1 mb-4">
        {bundle.products.map((bp) => (
          <div key={bp.id} className="flex items-center justify-between text-sm">
            <Link
              to={bp.product ? `/product/${bp.product.slug}` : "#"}
              className="text-foreground hover:text-primary transition-colors truncate max-w-[60%]"
            >
              {bp.product?.name || "Product"}
            </Link>
            <span className="text-muted-foreground">
              {formatPrice(bp.product?.sale_price ?? bp.product?.base_price ?? 0, settings.currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing & CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            Total price:{" "}
            <span className="line-through">{formatPrice(originalTotal, settings.currency)}</span>
          </p>
          <p className="text-xl font-medium text-foreground">
            Bundle price:{" "}
            <span className="text-primary">{formatPrice(bundlePrice, settings.currency)}</span>
          </p>
          {savings > 0 && (
            <p className="text-sm text-green-600">You save {formatPrice(savings, settings.currency)}</p>
          )}
        </div>
        <Button
          size="lg"
          onClick={handleAddBundleToCart}
          disabled={addingBundle === bundle.id}
          className="w-full sm:w-auto"
        >
          {addingBundle === bundle.id ? "Adding..." : "Add Bundle to Cart"}
        </Button>
      </div>
    </motion.div>
  );
};

export default BundleSuggestion;
