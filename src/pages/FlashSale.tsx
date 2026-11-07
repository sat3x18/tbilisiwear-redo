import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { useActiveFlashSale } from "@/hooks/useFlashSale";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";
import { useState, useEffect } from "react";

const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const fmt = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      {[
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Seconds" },
      ].map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          {i > 0 && <span className="text-foreground text-2xl font-medium">:</span>}
          <div className="text-center">
            <div className="bg-foreground text-background px-3 py-2 font-mono text-2xl font-medium min-w-[60px]">
              {fmt(item.value)}
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const FlashSale = () => {
  const { data: flashSale, isLoading } = useActiveFlashSale();
  const { settings } = useStoreSettings();

  const getProductImage = (product: any) => {
    const primary = product.product_images?.find((img: any) => img.is_primary);
    return primary?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const getFlashPrice = (product: any) => {
    const base = product.sale_price || product.base_price;
    return base * (1 - (flashSale?.discount_percentage || 0) / 100);
  };

  return (
    <Layout>
      <section className="pt-36 pb-16 bg-destructive/5 border-b border-destructive/20">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium ">Limited Time Offer</span>
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="font-display text-display-lg text-foreground mb-4">
              {flashSale?.title || "Flash Sale"}
            </h1>
            {flashSale?.description && (
              <p className="text-muted-foreground font-body text-lg mb-6 max-w-xl mx-auto">
                {flashSale.description}
              </p>
            )}
            {flashSale && (
              <div className="flex justify-center">
                <CountdownTimer endTime={flashSale.end_time} />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="luxury-container">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !flashSale || !flashSale.products?.length ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body text-lg mb-4">
                No active flash sale right now
              </p>
              <p className="text-sm text-muted-foreground">Nothing running right now</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {flashSale.products.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link to={`/product/${product.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-secondary mb-3">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 "
                      />
                      <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-medium">
                        -{flashSale.discount_percentage}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground ">
                        {product.brands?.name}
                      </p>
                      <h3 className="font-body text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-destructive font-medium">
                          {formatPrice(getFlashPrice(product), settings.currency)}
                        </span>
                        <span className="text-muted-foreground text-sm line-through">
                          {formatPrice(product.sale_price || product.base_price, settings.currency)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FlashSale;
