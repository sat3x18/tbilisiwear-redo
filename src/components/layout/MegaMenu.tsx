import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  navbar_image_url: string | null;
}

interface MegaMenuProps {
  type: "men" | "women" | "brands" | "new";
  isOpen: boolean;
  onClose: () => void;
}

const MegaMenu = ({ type, isOpen, onClose }: MegaMenuProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredTitle, setFeaturedTitle] = useState<string>("");

  useEffect(() => {
    if (type === "brands") {
      fetchBrands();
    } else {
      fetchCategories();
    }
  }, [type]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, image_url, parent_id")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
      // Set featured image from first category with image
      const withImage = data.find((c) => c.image_url);
      if (withImage) {
        setFeaturedImage(withImage.image_url);
        setFeaturedTitle(withImage.name);
      }
    }
  };

  const fetchBrands = async () => {
    const { data } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, navbar_image_url")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setBrands(data);
      // Prioritize navbar_image_url for featured display
      const withImage = data.find((b) => b.navbar_image_url || b.logo_url);
      if (withImage) {
        setFeaturedImage(withImage.navbar_image_url || withImage.logo_url);
        setFeaturedTitle(withImage.name);
      }
    }
  };

  // Group categories by parent
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubCategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  // Get destination path based on type
  const getBasePath = () => {
    switch (type) {
      case "men":
        return "/men";
      case "women":
        return "/women";
      case "brands":
        return "/brands";
      case "new":
        return "/shop?filter=new";
      default:
        return "/shop";
    }
  };

  // Render content based on type
  const renderMenuContent = () => {
    if (type === "brands") {
      // Split brands into columns
      const columnCount = Math.min(4, Math.ceil(brands.length / 6));
      const brandsPerColumn = Math.ceil(brands.length / columnCount);
      const columns: Brand[][] = [];
      
      for (let i = 0; i < columnCount; i++) {
        columns.push(brands.slice(i * brandsPerColumn, (i + 1) * brandsPerColumn));
      }

      return (
        <div className="flex gap-12">
          {columns.map((column, idx) => (
            <div key={idx} className="min-w-[160px]">
              {idx === 0 && (
                <h3 className="font-display text-sm text-foreground mb-4 ">
                  Our Brands
                </h3>
              )}
              {idx !== 0 && <div className="h-[28px]" />}
              <ul className="space-y-2.5">
                {column.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      to={`/shop?brand=${brand.slug}`}
                      onClick={onClose}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body block"
                      onMouseEnter={() => {
                        const imageToShow = brand.navbar_image_url || brand.logo_url;
                        if (imageToShow) {
                          setFeaturedImage(imageToShow);
                          setFeaturedTitle(brand.name);
                        }
                      }}
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (type === "new") {
      return (
        <div className="flex gap-12">
          <div className="min-w-[160px]">
            <h3 className="font-display text-sm text-foreground mb-4 ">
              New Arrivals
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/men?filter=new"
                  onClick={onClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  to="/women?filter=new"
                  onClick={onClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  Women
                </Link>
              </li>
            </ul>
          </div>
          <div className="min-w-[160px]">
            <h3 className="font-display text-sm text-foreground mb-4 ">
              Featured
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/shop?filter=new"
                  onClick={onClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  View All New Arrivals
                </Link>
              </li>
            </ul>
          </div>
        </div>
      );
    }

    // Men/Women menu with categories
    return (
      <div className="flex gap-12">
        {/* All products link */}
        <div className="min-w-[160px]">
          <h3 className="font-display text-sm text-foreground mb-4 ">
            Shop All
          </h3>
          <ul className="space-y-2.5">
            <li>
              <Link
                to={getBasePath()}
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                View All {type === "men" ? "Men's" : "Women's"}
              </Link>
            </li>
            <li>
              <Link
                to={`${getBasePath()}?filter=new`}
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                New Arrivals
              </Link>
            </li>
            <li>
              <Link
                to={`${getBasePath()}?filter=sale`}
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Sale
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        {parentCategories.slice(0, 4).map((category) => {
          const subCategories = getSubCategories(category.id);
          return (
            <div key={category.id} className="min-w-[160px]">
              <h3 className="font-display text-sm text-foreground mb-4 ">
                {category.name}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to={`${getBasePath()}?category=${category.slug}`}
                    onClick={onClose}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                    onMouseEnter={() => {
                      if (category.image_url) {
                        setFeaturedImage(category.image_url);
                        setFeaturedTitle(category.name);
                      }
                    }}
                  >
                    View All {category.name}
                  </Link>
                </li>
                {subCategories.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      to={`${getBasePath()}?category=${sub.slug}`}
                      onClick={onClose}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                      onMouseEnter={() => {
                        if (sub.image_url) {
                          setFeaturedImage(sub.image_url);
                          setFeaturedTitle(sub.name);
                        }
                      }}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  // Calculate if we have a featured image to show
  const showFeaturedImage = featuredImage && (type === "men" || type === "women" || type === "brands");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}


          {/* Menu Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full bg-background border-b border-border z-50 shadow-lg"
            onMouseLeave={onClose}
          >
            <div className="max-w-7xl mx-auto px-8 py-10">
              <div className="flex justify-between gap-12">
                {/* Menu Links */}
                <div className="flex-1">
                  {renderMenuContent()}
                </div>

                {/* Featured Image */}
                {showFeaturedImage && (
                  <div className="flex-shrink-0">
                    <div className="w-[280px] relative overflow-hidden">
                      <div 
                        className="aspect-[3/4] bg-secondary transition-colors duration-300"
                        style={{
                          backgroundImage: `url(${featuredImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                      {featuredTitle && (
                        <p className="text-center text-sm text-foreground mt-3 font-body">
                          {type === "brands" ? featuredTitle : `${featuredTitle} for ${type === "men" ? "Him" : "Her"}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MegaMenu;
