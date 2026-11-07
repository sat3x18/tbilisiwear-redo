import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useActiveFlashSale } from "@/hooks/useFlashSale";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className="bg-foreground text-background px-3 py-2 font-mono text-2xl font-medium min-w-[60px]">
          {formatNumber(timeLeft.hours)}
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">Hours</span>
      </div>
      <span className="text-foreground text-2xl font-medium">:</span>
      <div className="text-center">
        <div className="bg-foreground text-background px-3 py-2 font-mono text-2xl font-medium min-w-[60px]">
          {formatNumber(timeLeft.minutes)}
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">Minutes</span>
      </div>
      <span className="text-foreground text-2xl font-medium">:</span>
      <div className="text-center">
        <div className="bg-foreground text-background px-3 py-2 font-mono text-2xl font-medium min-w-[60px]">
          {formatNumber(timeLeft.seconds)}
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">Seconds</span>
      </div>
    </div>
  );
};

const FlashSaleSection = () => {
  const { data: flashSale, isLoading } = useActiveFlashSale();
  const { settings } = useStoreSettings();

  if (isLoading || !flashSale || !flashSale.products?.length) {
    return null;
  }

  const getProductImage = (product: any) => {
    const primaryImage = product.product_images?.find((img: any) => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const getFlashPrice = (product: any) => {
    const basePrice = product.sale_price || product.base_price;
    return basePrice * (1 - flashSale.discount_percentage / 100);
  };

  return (
    <section className="py-16 bg-destructive/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-10 left-10 w-32 h-32 bg-destructive/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="luxury-container relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium ">Limited Time Offer</span>
            <Zap className="w-4 h-4" />
          </div>
          
          <h2 className="font-display text-display-lg text-foreground mb-2">
            {flashSale.title}
          </h2>
          
          {flashSale.description && (
            <p className="text-muted-foreground font-body mb-6 max-w-xl mx-auto">
              {flashSale.description}
            </p>
          )}

          {/* Countdown Timer */}
          <div className="flex justify-center">
            <CountdownTimer endTime={flashSale.end_time} />
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {flashSale.products.slice(0, 4).map((product: any, index: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/product/${product.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary mb-3">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 "
                  />
                  
                  {/* Discount badge */}
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

        {/* View All Link */}
        {flashSale.products.length > 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link to="/flash-sale" className="btn-luxury-outline">
              View All Flash Sale Items
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FlashSaleSection;
