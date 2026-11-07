import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useBrands, useProducts } from "@/hooks/useProducts";
import ScrollReveal from "@/components/ScrollReveal";

const Brands = () => {
  const { brands, loading } = useBrands();
  const { products } = useProducts({});

  const getProductCount = (brandSlug: string) => {
    return products.filter(p => p.brand?.slug === brandSlug).length;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-36 pb-16 bg-background">
        <div className="luxury-container">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <p className="text-foreground text-xs mb-4 font-body">Curated Luxury</p>
            <h1 className="font-display text-display-lg text-foreground mb-6">Our Designers</h1>
            <p className="text-muted-foreground font-body leading-relaxed">
              We partner with the world's most prestigious fashion houses to bring you 
              an unparalleled collection of luxury fashion. Each brand is carefully selected 
              for their commitment to exceptional craftsmanship and timeless design.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="line-elegant" />

      {/* Brands Grid */}
      <section className="py-20 bg-background">
        <div className="luxury-container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {brands.map((brand, index) => (
                <ScrollReveal key={brand.id} delay={index * 0.08} scale>
                  <Link to={`/shop?brand=${brand.slug}`} className="block group">
                    <div className="bg-card border border-border p-8 h-full hover:border-primary/30 transition-colors duration-500 group-hover:bg-charcoal">
                      <div className="h-20 flex items-center justify-center mb-6">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <h2 className="font-display text-2xl text-foreground text-center">{brand.name}</h2>
                        )}
                      </div>
                      {brand.description && (
                        <p className="text-sm text-muted-foreground font-body text-center mb-4 line-clamp-2">{brand.description}</p>
                      )}
                      <p className="text-xs text-foreground text-center font-body">{getProductCount(brand.slug)} Products</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Brands Text */}
      <section className="py-20 bg-charcoal">
        <div className="luxury-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">A Commitment to Excellence</h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                Every brand in our collection represents the pinnacle of fashion excellence. 
                From the ateliers of Paris to the workshops of Milan, our designers share a 
                common dedication to quality, innovation, and timeless style.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed">
                We believe in building lasting relationships with our brand partners, ensuring 
                that every piece we carry meets our exacting standards and your exceptional taste.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.2}>
              <div className="grid grid-cols-2 gap-4">
                {['Authenticity', 'Quality', 'Exclusivity', 'Heritage'].map((value, index) => (
                  <ScrollReveal key={value} delay={0.3 + index * 0.1} scale>
                    <div className="bg-background/50 border border-border p-6 text-center">
                      <span className="font-display text-lg text-foreground">{value}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Brands;
