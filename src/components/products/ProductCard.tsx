import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface Product {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productUrl = `/product/${product.slug || product.id}`;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to save items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isWishlisted) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      setIsWishlisted(false);
      toast({ title: "Removed from wishlist" });
    } else {
      await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
        });
      setIsWishlisted(true);
      toast({ title: "Added to wishlist" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="product-card group"
    >
      <Link to={productUrl}>
        {/* Image Container */}
        <div className="product-card-image relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          
          {/* Badges */}
          {product.isSale && discount > 0 && (
            <span className="absolute top-3 left-3 px-2 py-1 text-xs bg-destructive text-destructive-foreground">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-3 px-2 py-1 text-xs bg-primary text-primary-foreground">
              New
            </span>
          )}
        </div>
      </Link>

      {/* Info: garment label, hairline above, price in mono */}
      <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate font-body text-xs text-muted-foreground">
            {product.brand}
          </p>
          <Link to={productUrl}>
            <h3 className="line-clamp-2 font-body text-sm font-medium leading-snug text-foreground transition-colors duration-150 hover:text-muted-foreground">
              {product.name}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="price-label text-foreground">
              {formatPrice(product.price, settings.currency)}
            </span>
            {product.originalPrice && (
              <span className="price-label text-muted-foreground line-through">
                {formatPrice(product.originalPrice, settings.currency)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleWishlist}
          className="-m-2 flex-shrink-0 p-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-foreground text-foreground" : ""}`}
          />
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
