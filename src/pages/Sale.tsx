import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, SlidersHorizontal, Grid3X3, LayoutGrid, Grid2X2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";

const Sale = () => {
  const [gridView, setGridView] = useState<2 | 3 | 4>(4);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { products, loading } = useProducts({ onSale: true });
  const { brands } = useBrands();
  const { categories } = useCategories();

  // Filter products
  const filteredProducts = products.filter(product => {
    if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.slug)) {
      return false;
    }
    if (selectedCategories.length > 0 && product.category && !selectedCategories.includes(product.category.slug)) {
      return false;
    }
    return true;
  });

  const toggleBrand = (slug: string) => {
    setSelectedBrands(prev => 
      prev.includes(slug) ? prev.filter(b => b !== slug) : [...prev, slug]
    );
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev => 
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    );
  };

  // Calculate max discount
  const maxDiscount = products.length > 0 
    ? Math.max(...products.map(p => {
        if (p.sale_price) {
          return Math.round(((p.base_price - p.sale_price) / p.base_price) * 100);
        }
        return 0;
      }))
    : 0;

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-36 pb-16 bg-destructive/5 border-b border-destructive/20">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-block px-6 py-2 bg-destructive text-destructive-foreground text-sm font-body mb-6">
              Limited Time
            </span>
            <h1 className="font-display text-display-lg text-foreground mb-4">
              Sale
            </h1>
            <p className="text-muted-foreground font-body text-lg">
              {loading 
                ? 'Loading...' 
                : `Up to ${maxDiscount}% off on ${filteredProducts.length} pieces`
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="py-4 bg-background sticky top-[116px] z-30 border-b border-border">
        <div className="luxury-container">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-sm font-body transition-colors ${
                showFilters ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setGridView(2)}
                className={`p-1 ${gridView === 2 ? "text-foreground" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridView(3)}
                className={`p-1 ${gridView === 3 ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridView(4)}
                className={`p-1 ${gridView === 4 ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Grid2X2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="luxury-container">
          <div className="flex gap-12">
            {/* Filters Sidebar */}
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-64 flex-shrink-0 hidden lg:block"
              >
                <div className="sticky top-[180px] space-y-8">
                  {/* Brands */}
                  <div>
                    <h4 className="font-display text-sm text-foreground mb-4">
                      Brands
                    </h4>
                    <ul className="space-y-2">
                      {brands.map((brand) => (
                        <li key={brand.id}>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand.slug)}
                              onChange={() => toggleBrand(brand.slug)}
                              className="w-4 h-4 border border-border bg-transparent checked:bg-primary checked:border-primary accent-primary"
                            />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-body">
                              {brand.name}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="font-display text-sm text-foreground mb-4">
                      Category
                    </h4>
                    <ul className="space-y-2">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat.slug)}
                              onChange={() => toggleCategory(cat.slug)}
                              className="w-4 h-4 border border-border bg-transparent checked:bg-primary checked:border-primary accent-primary"
                            />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-body">
                              {cat.name}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.aside>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground font-body text-lg mb-4">
                    No sale items found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for new markdowns
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-6 md:gap-8 ${
                    gridView === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : gridView === 3
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={{
                          id: product.id,
                          slug: product.slug,
                          name: product.name,
                          brand: product.brand?.name || '',
                          price: product.sale_price || product.base_price,
                          originalPrice: product.sale_price ? product.base_price : undefined,
                          image: product.images[0]?.image_url || '/placeholder.svg',
                          isNew: product.is_new_arrival,
                          isSale: true,
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Sale;
