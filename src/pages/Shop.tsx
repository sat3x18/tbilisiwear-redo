import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Layout from "@/components/layout/Layout";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

type SortOption = "newest" | "price-asc" | "price-desc" | "name";

type ShopProps = {
  /** When set, the page is restricted to this category (e.g. /men, /women). */
  lockedCategorySlug?: string;
  /** Optional title override for the locked category pages. */
  lockedCategoryLabel?: string;
  /** When set, filters products by gender (men/women). */
  lockedGender?: "men" | "women";
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Date, new to old" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Alphabetically, A-Z" },
];

const Shop = ({ lockedCategorySlug, lockedCategoryLabel, lockedGender }: ShopProps) => {
  const [searchParams] = useSearchParams();
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const lockedCategory = (lockedCategorySlug ?? "").trim();

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const brandFilter = searchParams.get("brand") || "";
  const filterType = searchParams.get("filter") || "";
  const sortParam = (searchParams.get("sort") as SortOption) || "newest";

  const [sortBy, setSortBy] = useState<SortOption>(sortParam);

  const effectiveCategorySlug = lockedCategory || categoryFilter;

  const { products, loading } = useProducts({
    search: searchQuery,
    brandSlug: brandFilter || undefined,
    categorySlug: effectiveCategorySlug || undefined,
    newArrivals: filterType === "new",
    onSale: filterType === "sale",
    sortBy,
    gender: lockedGender,
  });

  const { brands } = useBrands();
  const { categories } = useCategories();
  const { settings } = useStoreSettings();

  const pageTitle = useMemo(() => {
    if (lockedCategory) return lockedCategoryLabel || "Shop";
    if (searchQuery) return `Search: ${searchQuery}`;
    if (filterType === "new") return "New Arrivals";
    if (filterType === "sale") return "Sale";
    if (categoryFilter) return categories.find((c) => c.slug === categoryFilter)?.name || "Shop";
    if (brandFilter) return brands.find((b) => b.slug === brandFilter)?.name || "Shop";
    return "All Products";
  }, [
    lockedCategory,
    lockedCategoryLabel,
    searchQuery,
    filterType,
    categoryFilter,
    brandFilter,
    categories,
    brands,
  ]);

  return (
    <Layout homepage>
      <section className="bg-background px-4 pb-16 pt-24 text-foreground sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        {/* Title + sort row */}
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
          <ScrollReveal>
            <h1 className="font-body text-3xl font-medium leading-none tracking-tight md:text-4xl">
              {pageTitle}
            </h1>
          </ScrollReveal>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowSortDropdown((v) => !v)}
              className="flex items-center gap-1.5 font-body text-xs md:text-sm"
              aria-haspopup="listbox"
              aria-expanded={showSortDropdown}
            >
              Sort
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                <ul
                  role="listbox"
                  className="absolute right-0 top-full z-20 mt-2 w-56 border border-border bg-card py-1 shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
                >
                  {sortOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        role="option"
                        aria-selected={sortBy === option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left font-body text-sm transition-colors hover:bg-muted ${
                          sortBy === option.value ? "font-medium" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-body text-sm text-muted-foreground">
              No products found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-7 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8">
            {products.map((product, index) => {
              const price = product.sale_price ?? product.base_price;
              const isSale = !!product.sale_price;
              const image = product.images?.[0]?.image_url || "/placeholder.svg";

              return (
                <ScrollReveal key={product.id} delay={(index % 4) * 0.06}>
                  <Link to={`/product/${product.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={product.images?.[0]?.alt_text || product.name}
                        loading={index < 4 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out "
                      />
                      {isSale && (
                        <span className="absolute bottom-3 left-3 bg-destructive px-2 py-1 font-body text-xs text-destructive-foreground">
                          Sale
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 font-body text-xs leading-snug md:text-sm">
                      {product.name}
                    </h2>
                    <p className="mt-1 font-body text-xs md:text-sm">
                      {formatPrice(price, settings.currency)}
                      {isSale && (
                        <span className="ml-2 text-muted-foreground line-through">
                          {formatPrice(product.base_price, settings.currency)}
                        </span>
                      )}
                    </p>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Shop;
