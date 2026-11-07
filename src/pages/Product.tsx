import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import BundleSuggestion from "@/components/products/BundleSuggestion";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice, getCurrencySymbol } from "@/lib/formatPrice";

const Product = () => {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error } = useProduct(slug || "");
  const { products: relatedProducts } = useProducts({ limit: 4 });
  const { addToCart, setIsOpen: openCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useStoreSettings();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sizes = [...new Set(product?.variants.map((v) => v.size) || [])];
  const colors = [...new Set(product?.variants.map((v) => v.color) || [])];
  const colorOptions =
    product?.variants
      .filter((v, i, arr) => arr.findIndex((x) => x.color === v.color) === i)
      .map((v) => ({ name: v.color, hex: v.color_hex })) || [];

  const selectedVariant = product?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  useEffect(() => {
    if (product && product.variants.length > 0) {
      if (!selectedSize && sizes.length > 0) setSelectedSize(sizes[0]);
      if (!selectedColor && colors.length > 0) setSelectedColor(colors[0]);
    }
  }, [product, sizes, colors, selectedSize, selectedColor]);

  useEffect(() => {
    if (user && product) checkWishlist();
  }, [user, product]);

  useEffect(() => {
    if (!product) return;
    const storeName = settings.store_name || "TBILISI WEAR";
    const title = `${product.name} | ${storeName}`;
    const rawDesc = (product as any).description || (product as any).short_description || "";
    const desc = (rawDesc ? String(rawDesc).replace(/\s+/g, " ").trim() : `Shop ${product.name} at ${storeName}. Premium luxury fashion, crafted to last.`).slice(0, 158);
    const image = (product.images?.[0] as any)?.image_url || (typeof product.images?.[0] === "string" ? product.images[0] : undefined);

    document.title = title;
    const setMeta = (sel: string, attr: string, key: string, value: string, content: string) => {
      let el = document.head.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(`meta[name="description"]`, "name", "description", "content", desc);
    setMeta(`meta[property="og:title"]`, "property", "og:title", "content", title);
    setMeta(`meta[property="og:description"]`, "property", "og:description", "content", desc);
    setMeta(`meta[property="og:type"]`, "property", "og:type", "content", "product");
    setMeta(`meta[name="twitter:title"]`, "name", "twitter:title", "content", title);
    setMeta(`meta[name="twitter:description"]`, "name", "twitter:description", "content", desc);
    if (image) {
      setMeta(`meta[property="og:image"]`, "property", "og:image", "content", image);
      setMeta(`meta[name="twitter:image"]`, "name", "twitter:image", "content", image);
    }
  }, [product, settings.store_name]);


  const checkWishlist = async () => {
    if (!user || !product) return;
    const { data } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    setIsWishlisted(!!data);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items.",
        variant: "destructive",
      });
      return;
    }
    if (!product) return;

    if (isWishlisted) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      setIsWishlisted(false);
      toast({ title: "Removed from saved items" });
    } else {
      await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
        product_price: product.sale_price || product.base_price,
        product_image: product.images[0]?.image_url || null,
      });
      setIsWishlisted(true);
      toast({ title: "Saved for later" });
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast({
        title: "Select your size",
        description: "Choose a size before adding to bag.",
        variant: "destructive",
      });
      return;
    }

    if (selectedVariant.stock_quantity < quantity) {
      toast({
        title: "Limited availability",
        description: `Only ${selectedVariant.stock_quantity} remaining.`,
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    const success = await addToCart(selectedVariant.id, quantity);
    setAddingToCart(false);

    if (success) openCart(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <p className="text-xs text-primary mb-6 font-body">
            Item not found
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 text-center">
            This piece has moved on
          </h1>
          <p className="text-muted-foreground font-body text-center mb-10 max-w-sm leading-relaxed">
            It may have found a new home, or been archived. These things happen.
          </p>
          <Link
            to="/shop"
            className="text-xs font-body text-primary hover:text-foreground transition-colors"
          >
            Continue browsing
          </Link>
        </div>
      </Layout>
    );
  }

  const price = product.sale_price || product.base_price;
  const originalPrice = product.sale_price ? product.base_price : null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Layout>
      <article className="pt-24 md:pt-28 pb-20 md:pb-32">
        <div className="luxury-container">
          {/* Breadcrumb — understated */}
          <nav className="mb-8 md:mb-12">
            <ol className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <li>
                <Link to="/shop" className="hover:text-foreground transition-colors duration-200">
                  Shop
                </Link>
              </li>
              {product.brand && (
                <>
                  <li aria-hidden="true" className="text-border">/</li>
                  <li>
                    <Link
                      to={`/shop?brand=${product.brand.slug}`}
                      className="hover:text-foreground transition-colors duration-200"
                    >
                      {product.brand.name}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                {/* Main Image */}
                <motion.figure
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="aspect-[4/5] bg-secondary overflow-hidden max-w-lg mx-auto lg:mx-0"
                >
                  {product.images.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        src={product.images[selectedImage]?.image_url}
                        alt={product.images[selectedImage]?.alt_text || product.name}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground text-sm font-body">No image</span>
                    </div>
                  )}
                </motion.figure>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 max-w-lg mx-auto lg:mx-0">
                    {product.images.map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-14 lg:w-16 aspect-[4/5] bg-secondary overflow-hidden transition-opacity duration-200 ${
                          selectedImage === index ? "opacity-100 ring-1 ring-primary ring-offset-1 ring-offset-background" : "opacity-50 hover:opacity-80"
                        }`}
                      >
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 lg:py-4"
            >
              {/* Brand */}
              {product.brand && (
                <Link
                  to={`/shop?brand=${product.brand.slug}`}
                  className="inline-block text-xs font-body text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4"
                >
                  {product.brand.name}
                </Link>
              )}

              {/* Name */}
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground leading-[1.15] mb-6">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-lg md:text-xl font-medium text-foreground font-body">
                  {formatPrice(price, settings.currency)}
                </span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through font-body">
                    {formatPrice(originalPrice, settings.currency)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground font-body text-[15px] leading-[1.7] mb-10 max-w-md">
                  {product.description}
                </p>
              )}

              {/* Color */}
              {colorOptions.length > 1 && (
                <div className="mb-8">
                  <p className="text-xs font-body text-muted-foreground mb-4">
                    {selectedColor}
                  </p>
                  <div className="flex gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        aria-label={color.name}
                        className={`w-7 h-7 rounded-full transition-transform duration-200 ${
                          selectedColor === color.name
                            ? "ring-1 ring-offset-2 ring-offset-background ring-foreground scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: color.hex || "#888" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              {sizes.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="text-xs font-body text-muted-foreground">
                      Size
                    </p>
                    <button className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors duration-200 underline underline-offset-2">
                      Size guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variant = product.variants.find(
                        (v) => v.size === size && v.color === selectedColor
                      );
                      const available = variant && variant.stock_quantity > 0;
                      return (
                        <button
                          key={size}
                          onClick={() => available && setSelectedSize(size)}
                          disabled={!available}
                          className={`min-w-[48px] h-11 px-4 text-[13px] font-body transition-colors duration-200 ${
                            selectedSize === size
                              ? "bg-foreground text-background"
                              : available
                              ? "border border-border text-foreground hover:border-foreground"
                              : "border border-border/40 text-muted-foreground/30 cursor-not-allowed"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stock hint */}
                  {selectedVariant && selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 && (
                    <p className="mt-4 text-[12px] font-body text-primary">
                      Only {selectedVariant.stock_quantity} left
                    </p>
                  )}
                </div>
              )}

              {/* Quantity & Add to Bag */}
              <div className="flex gap-3 mb-6">
                {/* Quantity */}
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-[13px] font-body text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Bag */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !selectedVariant || selectedVariant.stock_quantity === 0}
                  className="flex-1 h-12 bg-foreground text-background text-[12px] font-body hover:bg-foreground/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingToCart && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedVariant?.stock_quantity === 0 ? "Sold out" : "Add to bag"}
                </button>

                {/* Wishlist */}
                <button
                  onClick={toggleWishlist}
                  aria-label={isWishlisted ? "Remove from saved" : "Save for later"}
                  className={`w-12 h-12 border flex items-center justify-center transition-colors duration-200 ${
                    isWishlisted ? "border-primary bg-primary/5" : "border-border hover:border-foreground"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isWishlisted ? "fill-primary text-primary" : "text-foreground"
                    }`}
                  />
                </button>
              </div>

              {/* Shipping note */}
              <p className="text-[12px] text-muted-foreground font-body mb-12">
                Free shipping on orders over {getCurrencySymbol(settings.currency)}
                {settings.free_shipping_threshold}
              </p>

              {/* Details Sections */}
              <div className="border-t border-border">
                {/* Materials */}
                {product.materials && (
                  <div className="border-b border-border">
                    <button
                      onClick={() => toggleSection("materials")}
                      className="w-full flex items-center justify-between py-5 text-left"
                    >
                      <span className="text-[12px] font-body text-foreground">
                        Materials
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {expandedSection === "materials" ? "−" : "+"}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedSection === "materials" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="pb-6 text-[14px] text-muted-foreground font-body leading-relaxed">
                            {product.materials}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Care */}
                {product.care_instructions && (
                  <div className="border-b border-border">
                    <button
                      onClick={() => toggleSection("care")}
                      className="w-full flex items-center justify-between py-5 text-left"
                    >
                      <span className="text-[12px] font-body text-foreground">
                        Care
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {expandedSection === "care" ? "−" : "+"}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedSection === "care" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="pb-6 text-[14px] text-muted-foreground font-body leading-relaxed">
                            {product.care_instructions}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Shipping */}
                <div className="border-b border-border">
                  <button
                    onClick={() => toggleSection("shipping")}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <span className="text-[12px] font-body text-foreground">
                      Shipping & Returns
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {expandedSection === "shipping" ? "−" : "+"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSection === "shipping" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 text-[14px] text-muted-foreground font-body leading-relaxed space-y-3">
                          <p>
                            Standard delivery takes 3–5 business days. Express shipping available at checkout.
                          </p>
                          <p>
                            Returns accepted within 14 days. Items must be unworn, with all tags attached.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bundle Suggestion - Frequently Bought Together */}
          <BundleSuggestion productId={product.id} />

          {/* Reviews */}
          <ReviewSection productId={product.id} productName={product.name} />

          {/* More from the collection */}
          {relatedProducts.filter((p) => p.id !== product.id).length > 0 && (
            <section className="mt-24 md:mt-32">
              <div className="flex items-baseline justify-between mb-10">
                <h2 className="font-display text-xl md:text-2xl text-foreground">
                  You may also like
                </h2>
                <Link
                  to="/shop"
                  className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts
                  .filter((p) => p.id !== product.id)
                  .slice(0, 4)
                  .map((p, index) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={{
                          id: p.id,
                          slug: p.slug,
                          name: p.name,
                          brand: p.brand?.name || "",
                          price: p.sale_price || p.base_price,
                          originalPrice: p.sale_price ? p.base_price : undefined,
                          image: p.images[0]?.image_url || "/placeholder.svg",
                          isNew: p.is_new_arrival,
                          isSale: !!p.sale_price,
                        }}
                      />
                    </motion.div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </Layout>
  );
};

export default Product;
