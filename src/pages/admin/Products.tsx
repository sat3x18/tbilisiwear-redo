import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  Package,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  created_at: string;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { image_url: string }[];
}

const AdminProducts = () => {
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brand:brands(name),
        category:categories(name),
        images:product_images(image_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } else {
      setProducts(products.filter((p) => p.id !== id));
      toast({ title: "Product deleted" });
    }
    setDeletingId(null);
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (!error) {
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, is_active: !currentState } : p
        )
      );
      toast({ title: `Product ${!currentState ? "activated" : "deactivated"}` });
    }
  };

  const toggleFeatured = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_featured: !currentState })
      .eq("id", id);

    if (!error) {
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, is_featured: !currentState } : p
        )
      );
      toast({ title: `Product ${!currentState ? "featured" : "unfeatured"}` });
    }
  };

  const formatPriceWithCurrency = (amount: number) => {
    return formatPrice(amount, settings.currency);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Products</h1>
          <p className="text-muted-foreground font-body mt-1">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-gold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 border border-border text-foreground hover:bg-secondary transition-colors font-body">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Product
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Brand
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Category
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Price
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-6 py-4 font-body text-sm text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary flex-shrink-0">
                          {product.images?.[0]?.image_url ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-display text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-body">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-body">
                        {product.brand?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-body">
                        {product.category?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-body">
                          {formatPriceWithCurrency(product.sale_price || product.base_price)}
                        </span>
                        {product.sale_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPriceWithCurrency(product.base_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs ${
                            product.is_active
                              ? "text-green-500 bg-green-500/10"
                              : "text-red-500 bg-red-500/10"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                        {product.is_featured && (
                          <span className="px-2 py-1 text-xs text-foreground bg-muted">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => toggleActive(product.id, product.is_active)}
                            >
                              {product.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleFeatured(product.id, product.is_featured)}
                            >
                              {product.is_featured ? "Unfeature" : "Feature"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
