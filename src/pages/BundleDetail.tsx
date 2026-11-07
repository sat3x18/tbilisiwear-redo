import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useBundle, calculateBundlePrice } from "@/hooks/useBundles";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const BundleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { bundle, loading, error } = useBundle(slug || "");
  const { addBundleToCart } = useCart();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [addingToCart, setAddingToCart] = useState(false);

  // Track selected color per product: { [productId]: colorName }
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  // Track selected variant (size+color) per product: { [productId]: variantId }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Auto-select color if only one available
  useEffect(() => {
    if (!bundle) return;
    bundle.products.forEach((bp) => {
      if (bp.product && bp.product.variants) {
        const uniqueColors = [...new Set(bp.product.variants.map(v => v.color))];
        if (uniqueColors.length === 1) {
          setSelectedColors(prev => {
            if (prev[bp.product!.id]) return prev;
            return { ...prev, [bp.product!.id]: uniqueColors[0] };
          });
        }
      }
    });
  }, [bundle]);

  // Auto-select variant when only one size for the selected color
  useEffect(() => {
    if (!bundle) return;
    bundle.products.forEach((bp) => {
      if (!bp.product || !bp.product.variants) return;
      const color = selectedColors[bp.product.id];
      if (!color) return;
      const colorVariants = bp.product.variants.filter(v => v.color === color);
      const uniqueSizes = [...new Set(colorVariants.map(v => v.size))];
      if (uniqueSizes.length === 1 && colorVariants.length === 1) {
        setSelectedVariants(prev => {
          if (prev[bp.product!.id] === colorVariants[0].id) return prev;
          return { ...prev, [bp.product!.id]: colorVariants[0].id };
        });
      }
    });
  }, [bundle, selectedColors]);

  // Check if all products have a variant selected (size+color)
  const allSizesSelected = useMemo(() => {
    if (!bundle) return false;
    return bundle.products.every((bp) => {
      if (!bp.product || !bp.product.variants || bp.product.variants.length === 0) return true;
      if (bp.product.variants.length === 1) return true;
      return !!selectedVariants[bp.product.id];
    });
  }, [bundle, selectedVariants]);

  // Build effective variants map (with auto-selected single variants)
  const effectiveVariants = useMemo(() => {
    if (!bundle) return selectedVariants;
    const result = { ...selectedVariants };
    bundle.products.forEach((bp) => {
      if (bp.product && bp.product.variants && bp.product.variants.length > 0) {
        if (bp.product.variants.length === 1 && !result[bp.product.id]) {
          result[bp.product.id] = bp.product.variants[0].id;
        }
      }
    });
    return result;
  }, [bundle, selectedVariants]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !bundle) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-display font-medium text-foreground mb-2">
            Bundle Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This bundle is no longer available.
          </p>
          <Button asChild variant="outline">
            <Link to="/bundles">Browse Bundles</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const { originalTotal, bundlePrice, savings } = calculateBundlePrice(bundle);
  const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

  const handleAddToCart = async () => {
    if (!allSizesSelected) {
      toast({
        title: "Select sizes",
        description: "Please choose a size for each item before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    try {
      const success = await addBundleToCart(bundle, effectiveVariants);
      if (success) {
        toast({
          title: "Bundle added to cart",
          description: `${bundle.name} — all items added with bundle pricing.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to add bundle to cart.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const selectColor = (productId: string, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: color }));
    // Clear selected variant when color changes
    setSelectedVariants((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const selectVariant = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-10 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16">
          {/* Left — Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className={`grid gap-3 ${bundle.products.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {bundle.products.map((bp, index) => {
                  const primaryImage =
                    bp.product?.images?.find((img) => img.is_primary) ||
                    bp.product?.images?.[0];

                  return (
                    <motion.div
                      key={bp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                      className={`relative group ${
                        bundle.products.length === 3 && index === 2 ? 'col-span-2' : ''
                      }`}
                    >
                      <Link
                        to={bp.product ? `/product/${bp.product.slug}` : "#"}
                        className="block"
                      >
                        <div className={`overflow-hidden bg-secondary ${
                          bundle.products.length === 3 && index === 2
                            ? 'aspect-[2/1]'
                            : 'aspect-[3/4]'
                        }`}>
                          {primaryImage ? (
                            <img
                              src={primaryImage.image_url}
                              alt={bp.product?.name || "Product"}
                              className="w-full h-full object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-sm text-white/90 font-medium truncate">
                            {bp.product?.name}
                          </p>
                          {bp.product?.brand && (
                            <p className="text-xs text-white/60 ">
                              {bp.product.brand.name}
                            </p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {savingsPercent > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center shadow-lg"
                >
                  <span className="text-lg font-medium leading-none">-{savingsPercent}%</span>
                  <span className="text-xs mt-0.5">Save</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right — Bundle Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <span className="text-xs text-muted-foreground font-medium mb-4">
              Bundle
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-foreground leading-tight mb-4">
              {bundle.name}
            </h1>

            {bundle.description && (
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {bundle.description}
              </p>
            )}

            {/* Pricing */}
            <div className="border-t border-b border-border py-6 mb-8 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  Items total
                </span>
                <span className="text-muted-foreground line-through">
                  {formatPrice(originalTotal, settings.currency)}
                </span>
              </div>
              
              {savings > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">
                    You save
                  </span>
                  <span className="text-primary font-medium">
                    {formatPrice(savings, settings.currency)}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-3 border-t border-border">
                <span className="text-xs text-foreground font-medium">
                  Bundle price
                </span>
                <span className="text-3xl font-display font-medium text-foreground">
                  {formatPrice(bundlePrice, settings.currency)}
                </span>
              </div>
            </div>

            {/* What's Included — with color & size selection */}
            <div className="mb-8">
              <h3 className="text-xs text-muted-foreground mb-4">
                Choose your options — {bundle.products.length} items
              </h3>
              <div className="space-y-5">
                {bundle.products.map((bp) => {
                  const itemPrice = bp.product?.sale_price ?? bp.product?.base_price ?? 0;
                  const variants = bp.product?.variants || [];
                  const uniqueColors = [...new Set(variants.map(v => v.color))];
                  const selectedColor = bp.product ? selectedColors[bp.product.id] : undefined;
                  
                  // Filter sizes by selected color
                  const filteredVariants = selectedColor
                    ? variants.filter(v => v.color === selectedColor)
                    : variants;
                  const uniqueSizes = [...new Set(filteredVariants.map(v => v.size))];
                  
                  const selectedVarId = bp.product ? selectedVariants[bp.product.id] : undefined;
                  const selectedVariant = variants.find(v => v.id === selectedVarId);

                  // Get color hex map
                  const colorHexMap: Record<string, string | null> = {};
                  variants.forEach(v => {
                    if (!colorHexMap[v.color]) colorHexMap[v.color] = v.color_hex;
                  });

                  return (
                    <div key={bp.id} className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary overflow-hidden flex-shrink-0">
                          {bp.product?.images?.[0] ? (
                            <img
                              src={(bp.product.images.find(i => i.is_primary) || bp.product.images[0]).image_url}
                              alt={bp.product?.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={bp.product ? `/product/${bp.product.slug}` : "#"}
                            className="text-sm text-foreground hover:text-primary transition-colors truncate block"
                          >
                            {bp.product?.name}
                          </Link>
                          {bp.product?.brand && (
                            <p className="text-xs text-muted-foreground">
                              {bp.product.brand.name}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(itemPrice, settings.currency)}
                        </span>
                      </div>

                      {/* Color selector */}
                      {uniqueColors.length > 1 && bp.product && (
                        <div className="pl-16 space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            Color{selectedColor ? `: ${selectedColor}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {uniqueColors.map((color) => {
                              const hex = colorHexMap[color];
                              const isSelected = selectedColor === color;

                              return (
                                <button
                                  key={color}
                                  onClick={() => selectColor(bp.product!.id, color)}
                                  title={color}
                                  className={`
                                    w-7 h-7 rounded-full border-2 transition-colors flex-shrink-0
                                    ${isSelected
                                      ? 'border-foreground scale-110 ring-2 ring-foreground/20'
                                      : 'border-border hover:border-foreground/50'
                                    }
                                  `}
                                  style={{
                                    backgroundColor: hex || undefined,
                                  }}
                                >
                                  {!hex && (
                                    <span className="text-[8px] leading-none text-foreground">
                                      {color.slice(0, 2)}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Size selector — shown after color is selected (or if only 1 color) */}
                      {(uniqueColors.length <= 1 || selectedColor) && uniqueSizes.length > 1 && bp.product && (
                        <div className="pl-16 space-y-1.5">
                          <p className="text-xs text-muted-foreground">Size</p>
                          <div className="flex flex-wrap gap-2">
                            {uniqueSizes.map((size) => {
                              const variant = filteredVariants.find(v => v.size === size);
                              if (!variant) return null;
                              const isSelected = selectedVarId === variant.id;
                              const outOfStock = variant.stock_quantity < 1;

                              return (
                                <button
                                  key={size}
                                  disabled={outOfStock}
                                  onClick={() => selectVariant(bp.product!.id, variant.id)}
                                  className={`
                                    px-3 py-1.5 text-xs border transition-colors
                                    ${isSelected
                                      ? 'border-foreground bg-foreground text-background'
                                      : 'border-border text-foreground hover:border-foreground'
                                    }
                                    ${outOfStock ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer'}
                                  `}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Auto-select if only 1 size for the selected color */}
                      {/* Show selected info */}
                      {selectedVariant && (
                        <p className="pl-16 text-xs text-muted-foreground">
                          {selectedVariant.color} · Size {selectedVariant.size} · {selectedVariant.stock_quantity} in stock
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={addingToCart || !allSizesSelected}
              className="w-full text-sm py-6"
            >
              <ShoppingBag className="w-4 h-4 mr-3" />
              {addingToCart ? "Adding..." : !allSizesSelected ? "Select all options" : "Add Bundle to Cart"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {allSizesSelected
                ? `All ${bundle.products.length} items added with bundle discount applied`
                : "Choose color and size for each item to continue"
              }
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default BundleDetail;