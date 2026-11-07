import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useProducts } from "@/hooks/useProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface CollectionGridProps {
  title?: string;
  limit?: number;
}

const CollectionGrid = ({ title = "Outwear", limit = 6 }: CollectionGridProps) => {
  const { products, loading } = useProducts({ featured: true, limit });
  const { settings } = useStoreSettings();

  if (loading) {
    return (
      <section className="bg-background px-6 py-12 text-foreground md:px-10 md:py-16">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-background px-6 py-12 text-foreground md:px-10 md:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <ScrollReveal>
          <h2 className="mb-8 font-body text-3xl font-medium leading-tight tracking-[-0.02em] md:mb-12 md:text-4xl">
            {title}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-4 md:gap-y-10 lg:grid-cols-3">
          {products.map((product, index) => {
            const price = product.sale_price ?? product.base_price;
            const isSale = !!product.sale_price;
            const image = product.images?.[0]?.image_url || "/placeholder.svg";

            return (
              <ScrollReveal key={product.id} delay={(index % 3) * 0.05}>
                <Link to={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={product.images?.[0]?.alt_text || product.name}
                      loading={index < 3 ? "eager" : "lazy"}
                      className="h-full w-full object-cover"
                    />
                    {isSale && (
                      <span className="absolute bottom-3 left-3 bg-destructive px-2 py-1 font-body text-xs text-destructive-foreground">
                        Sale
                      </span>
                    )}
                  </div>
                  {/* Garment label: hairline, name left, price right in mono */}
                  <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-border pt-3">
                    <h3 className="font-body text-sm font-medium leading-snug transition-colors duration-150 group-hover:text-muted-foreground">
                      {product.name}
                    </h3>
                    <p className="price-label shrink-0 text-right">
                      {formatPrice(price, settings.currency)}
                      {isSale && (
                        <span className="ml-2 text-muted-foreground line-through">
                          {formatPrice(product.base_price, settings.currency)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
