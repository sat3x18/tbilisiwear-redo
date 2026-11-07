import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  file?: File;
  preview?: string;
}

const AdminProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(productId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [materials, setMaterials] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [gender, setGender] = useState<'men' | 'women' | 'both'>('both');

  const [variants, setVariants] = useState<ProductVariant[]>([
    { size: "", color: "", color_hex: "#000000", stock_quantity: 0, sku: "", is_active: true },
  ]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchBrandsAndCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [productId]);

  const fetchBrandsAndCategories = async () => {
    const [brandsRes, categoriesRes] = await Promise.all([
      supabase.from("brands").select("id, name").eq("is_active", true),
      supabase.from("categories").select("id, name").eq("is_active", true),
    ]);
    setBrands(brandsRes.data || []);
    setCategories(categoriesRes.data || []);
  };

  const fetchProduct = async () => {
    setLoading(true);
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) {
      toast({ title: "Error", description: "Product not found", variant: "destructive" });
      navigate("/admin/products");
      return;
    }

    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || "");
    setBasePrice(product.base_price.toString());
    setSalePrice(product.sale_price?.toString() || "");
    setBrandId(product.brand_id || "");
    setCategoryId(product.category_id || "");
    setMaterials(product.materials || "");
    setCareInstructions(product.care_instructions || "");
    setSeoTitle(product.seo_title || "");
    setSeoDescription(product.seo_description || "");
    setIsActive(product.is_active);
    setIsFeatured(product.is_featured);
    setIsNewArrival(product.is_new_arrival);
    setGender((product as any).gender || 'both');
    setVariants(
      product.variants?.length > 0
        ? product.variants.map((v: ProductVariant) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            color_hex: v.color_hex || "#000000",
            stock_quantity: v.stock_quantity,
            sku: v.sku || "",
            is_active: v.is_active,
          }))
        : [{ size: "", color: "", color_hex: "#000000", stock_quantity: 0, sku: "", is_active: true }]
    );
    setImages(
      product.images?.map((img: ProductImage) => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || "",
        is_primary: img.is_primary,
        display_order: img.display_order,
      })) || []
    );
    setLoading(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: "", color: "", color_hex: "#000000", stock_quantity: 0, sku: "", is_active: true },
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newImages.push({
        image_url: "",
        alt_text: name || "Product image",
        is_primary: images.length === 0 && i === 0,
        display_order: images.length + i,
        file,
        preview,
      });
    }
    setImages([...images, ...newImages]);
  };

  const setPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const removeImage = (index: number) => {
    const wasPrimary = images[index].is_primary;
    const newImages = images.filter((_, i) => i !== index);
    if (wasPrimary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    setImages(newImages);
  };

  const uploadImages = async (productId: string): Promise<ProductImage[]> => {
    const uploadedImages: ProductImage[] = [];

    for (const img of images) {
      if (img.file) {
        const fileName = `${productId}/${Date.now()}-${img.file.name}`;
        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(fileName, img.file);

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        uploadedImages.push({
          ...img,
          image_url: urlData.publicUrl,
          file: undefined,
          preview: undefined,
        });
      } else if (img.image_url) {
        uploadedImages.push(img);
      }
    }

    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !basePrice) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name,
        slug,
        description: description || null,
        base_price: parseFloat(basePrice),
        sale_price: salePrice ? parseFloat(salePrice) : null,
        brand_id: brandId || null,
        category_id: categoryId || null,
        materials: materials || null,
        care_instructions: careInstructions || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        is_active: isActive,
        is_featured: isFeatured,
        is_new_arrival: isNewArrival,
        gender,
      };

      let savedProductId = productId;

      if (isEditing) {
        if (!productId) throw new Error("Missing product id");

        // IMPORTANT: request the updated row back. If RLS blocks the update,
        // PostgREST can return 204 with 0 updated rows (no error), so we validate.
        const { data: updated, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId)
          .select("id, gender")
          .maybeSingle();

        if (error) throw error;
        if (!updated) {
          throw new Error("Update failed (no rows updated). Please try again.");
        }
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        savedProductId = data.id;
      }

      // Upload new images
      if (savedProductId) {
        const uploadedImages = await uploadImages(savedProductId);

        // Delete existing images if editing
        if (isEditing) {
          await supabase.from("product_images").delete().eq("product_id", savedProductId);
        }

        // Insert all images
        if (uploadedImages.length > 0) {
          const imagesToInsert = uploadedImages.map((img) => ({
            product_id: savedProductId,
            image_url: img.image_url,
            alt_text: img.alt_text,
            is_primary: img.is_primary,
            display_order: img.display_order,
          }));
          await supabase.from("product_images").insert(imagesToInsert);
        }

        // Handle variants
        if (isEditing) {
          await supabase.from("product_variants").delete().eq("product_id", savedProductId);
        }

        const validVariants = variants.filter((v) => v.size && v.color);
        if (validVariants.length > 0) {
          const variantsToInsert = validVariants.map((v) => ({
            product_id: savedProductId,
            size: v.size,
            color: v.color,
            color_hex: v.color_hex,
            stock_quantity: v.stock_quantity,
            sku: v.sku || null,
            is_active: v.is_active,
          }));
          await supabase.from("product_variants").insert(variantsToInsert);
        }
      }

      toast({ title: isEditing ? "Product updated" : "Product created" });
      navigate("/admin/products");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="p-2 hover:bg-secondary rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              {isEditing ? "Update product details" : "Create a new product"}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-gold inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      {/* Basic Info */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="Enter product name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="product-url-slug"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-body text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body resize-none"
            placeholder="Product description..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Brand
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'men' | 'women' | 'both')}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            >
              <option value="both">Both (Men & Women)</option>
              <option value="men">Men Only</option>
              <option value="women">Women Only</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Base Price (₾) *
            </label>
            <input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Sale Price (₾)
            </label>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="0.00"
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Product Images</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={`relative aspect-square border-2 ${
                img.is_primary ? "border-foreground" : "border-border"
              } group`}
            >
              <img
                src={img.preview || img.image_url}
                alt={img.alt_text}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(index)}
                    className="p-2 bg-foreground text-primary-foreground text-xs"
                  >
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {img.is_primary && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-foreground text-xs text-primary-foreground">
                  Primary
                </span>
              )}
            </div>
          ))}

          <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-body">Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* Variants */}
      <section className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Variants</h2>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-foreground transition-colors font-body"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-secondary/30">
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">Size</label>
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary font-body"
                  placeholder="S, M, L..."
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">Color</label>
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, "color", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary font-body"
                  placeholder="Black, White..."
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">Color Hex</label>
                <input
                  type="color"
                  value={variant.color_hex}
                  onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                  className="w-full h-[38px] bg-background border border-border cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">Stock</label>
                <input
                  type="number"
                  value={variant.stock_quantity}
                  onChange={(e) => updateVariant(index, "stock_quantity", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary font-body"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, "sku", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary font-body"
                  placeholder="SKU-001"
                />
              </div>

              <div className="flex items-end">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Info */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Additional Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">Materials</label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="100% Cotton, Leather..."
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">Care Instructions</label>
            <input
              type="text"
              value={careInstructions}
              onChange={(e) => setCareInstructions(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="Hand wash cold, dry flat..."
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">SEO</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="Page title for search engines"
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body resize-none"
              placeholder="Meta description for search engines"
            />
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Status & Visibility</h2>

        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
            <Label htmlFor="is-active" className="font-body">Active</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} id="is-featured" />
            <Label htmlFor="is-featured" className="font-body">Featured</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} id="is-new-arrival" />
            <Label htmlFor="is-new-arrival" className="font-body">New Arrival</Label>
          </div>
        </div>
      </section>
    </form>
  );
};

export default AdminProductForm;