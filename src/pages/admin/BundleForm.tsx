import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, Product } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/formatPrice";

interface BundleFormData {
  name: string;
  slug: string;
  description: string;
  pricing_type: 'fixed' | 'percentage';
  discount_value: number;
  fixed_price: number | null;
  is_active: boolean;
  show_on_homepage: boolean;
  show_on_bundles_page: boolean;
  show_on_product_pages: boolean;
}

const BundleForm = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products } = useProducts();
  const isEditing = Boolean(bundleId);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<BundleFormData>({
    name: "",
    slug: "",
    description: "",
    pricing_type: "percentage",
    discount_value: 10,
    fixed_price: null,
    is_active: true,
    show_on_homepage: false,
    show_on_bundles_page: true,
    show_on_product_pages: true,
  });

  useEffect(() => {
    if (isEditing && bundleId) {
      fetchBundle();
    }
  }, [bundleId, isEditing]);

  const fetchBundle = async () => {
    try {
      const { data: bundle, error } = await supabase
        .from('bundles')
        .select(`
          *,
          bundle_products (product_id, display_order)
        `)
        .eq('id', bundleId)
        .single();

      if (error) throw error;

      setFormData({
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description || "",
        pricing_type: bundle.pricing_type as 'fixed' | 'percentage',
        discount_value: bundle.discount_value,
        fixed_price: bundle.fixed_price,
        is_active: bundle.is_active,
        show_on_homepage: bundle.show_on_homepage,
        show_on_bundles_page: bundle.show_on_bundles_page,
        show_on_product_pages: bundle.show_on_product_pages,
      });

      // Fetch products for this bundle
      if (bundle.bundle_products && bundle.bundle_products.length > 0) {
        const productIds = bundle.bundle_products
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((bp: any) => bp.product_id);

        const { data: bundleProducts, error: productsError } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, base_price, sale_price, gender,
            product_images (id, image_url, alt_text, is_primary, display_order)
          `)
          .in('id', productIds);

        if (!productsError && bundleProducts) {
          // Sort products by their display order
          const sortedProducts = productIds
            .map((id: string) => bundleProducts.find((p: any) => p.id === id))
            .filter(Boolean)
            .map((p: any) => ({
              ...p,
              images: (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
              variants: [],
              brand: null,
              category: null,
              materials: null,
              care_instructions: null,
              is_featured: false,
              is_new_arrival: false,
            })) as Product[];
          setSelectedProducts(sortedProducts);
        }
      }
    } catch (error) {
      console.error('Error fetching bundle:', error);
      toast({
        title: "Error",
        description: "Failed to load bundle data.",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const addProduct = (productId: string) => {
    if (selectedProducts.length >= 3) {
      toast({
        title: "Maximum products reached",
        description: "A bundle can contain up to 3 products.",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && !selectedProducts.find((p) => p.id === productId)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const calculateTotals = () => {
    const originalTotal = selectedProducts.reduce((sum, p) => {
      return sum + (p.sale_price ?? p.base_price);
    }, 0);

    let bundlePrice: number;
    if (formData.pricing_type === 'fixed' && formData.fixed_price !== null) {
      bundlePrice = formData.fixed_price;
    } else {
      bundlePrice = originalTotal * (1 - formData.discount_value / 100);
    }

    const savings = originalTotal - bundlePrice;
    return { originalTotal, bundlePrice, savings };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length < 2) {
      toast({
        title: "Not enough products",
        description: "A bundle must contain at least 2 products.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing && bundleId) {
        // Update bundle
        const { error: updateError } = await supabase
          .from('bundles')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            pricing_type: formData.pricing_type,
            discount_value: formData.discount_value,
            fixed_price: formData.pricing_type === 'fixed' ? formData.fixed_price : null,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
            show_on_bundles_page: formData.show_on_bundles_page,
            show_on_product_pages: formData.show_on_product_pages,
          })
          .eq('id', bundleId);

        if (updateError) throw updateError;

        // Delete existing products and re-add
        await supabase.from('bundle_products').delete().eq('bundle_id', bundleId);

        const bundleProducts = selectedProducts.map((p, index) => ({
          bundle_id: bundleId,
          product_id: p.id,
          display_order: index,
        }));

        const { error: productsError } = await supabase
          .from('bundle_products')
          .insert(bundleProducts);

        if (productsError) throw productsError;

        toast({
          title: "Bundle updated",
          description: "Your bundle has been updated successfully.",
        });
      } else {
        // Create new bundle
        const { data: newBundle, error: createError } = await supabase
          .from('bundles')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            pricing_type: formData.pricing_type,
            discount_value: formData.discount_value,
            fixed_price: formData.pricing_type === 'fixed' ? formData.fixed_price : null,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
            show_on_bundles_page: formData.show_on_bundles_page,
            show_on_product_pages: formData.show_on_product_pages,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add products to bundle
        const bundleProducts = selectedProducts.map((p, index) => ({
          bundle_id: newBundle.id,
          product_id: p.id,
          display_order: index,
        }));

        const { error: productsError } = await supabase
          .from('bundle_products')
          .insert(bundleProducts);

        if (productsError) throw productsError;

        toast({
          title: "Bundle created",
          description: "Your bundle has been created successfully.",
        });
      }

      navigate("/admin/bundles");
    } catch (error: any) {
      console.error('Error saving bundle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bundle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { originalTotal, bundlePrice, savings } = calculateTotals();
  const availableProducts = products.filter(
    (p) => !selectedProducts.find((sp) => sp.id === p.id)
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bundles")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-medium text-foreground">
            {isEditing ? "Edit Bundle" : "Create Bundle"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update bundle details and products" : "Create a new bundle deal"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Bundle Details</CardTitle>
              <CardDescription>Basic information about your bundle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Bundle Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Summer Essentials Pack"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="summer-essentials-pack"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Get ready for summer with this amazing bundle..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Bundle Products</CardTitle>
              <CardDescription>
                Select 2-3 products for this bundle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProducts.length < 3 && (
                <Select onValueChange={addProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a product to this bundle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.sale_price ?? product.base_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No products added yet</p>
                  <p className="text-sm text-muted-foreground">Select products to include in this bundle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product, index) => {
                    const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground font-medium w-6">
                          {index + 1}.
                        </span>
                        {primaryImage && (
                          <img
                            src={primaryImage.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(product.sale_price ?? product.base_price)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set how customers save with this bundle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pricing Type</Label>
                <Select
                  value={formData.pricing_type}
                  onValueChange={(value: 'fixed' | 'percentage') =>
                    setFormData((prev) => ({ ...prev, pricing_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.pricing_type === 'percentage' ? (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="discount_value"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_value: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24"
                    />
                    <span className="text-muted-foreground">% off when buying together</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fixed_price">Fixed Bundle Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id="fixed_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fixed_price ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fixed_price: parseFloat(e.target.value) || null,
                        }))
                      }
                      className="w-32"
                      placeholder="99.99"
                    />
                  </div>
                </div>
              )}

              {selectedProducts.length >= 2 && (
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original total:</span>
                    <span className="line-through">{formatPrice(originalTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Bundle price:</span>
                    <span className="text-green-600">{formatPrice(bundlePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Customer saves:</span>
                    <span>{formatPrice(savings)} ({((savings / originalTotal) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control where this bundle appears</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Bundle is visible to customers</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Homepage</Label>
                  <p className="text-sm text-muted-foreground">Show on the main page</p>
                </div>
                <Switch
                  checked={formData.show_on_homepage}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_on_homepage: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Bundles Page</Label>
                  <p className="text-sm text-muted-foreground">Show on /bundles</p>
                </div>
                <Switch
                  checked={formData.show_on_bundles_page}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_on_bundles_page: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Product Pages</Label>
                  <p className="text-sm text-muted-foreground">Show as "Frequently bought together"</p>
                </div>
                <Switch
                  checked={formData.show_on_product_pages}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_on_product_pages: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button type="submit" className="w-full" disabled={loading || selectedProducts.length < 2}>
                {loading ? "Saving..." : isEditing ? "Update Bundle" : "Create Bundle"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/admin/bundles")}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default BundleForm;
