import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  parent_id: string | null;
}

const AdminCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, image_url, is_active, parent_id")
      .order("name");
    
    setCategories(data || []);
  };

  const fetchCategory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Category not found",
        variant: "destructive",
      });
      navigate("/admin/categories");
      return;
    }

    setName(data.name);
    setSlug(data.slug);
    setImageUrl(data.image_url);
    setIsActive(data.is_active);
    setParentId(data.parent_id);
    setLoading(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `category-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setImageUrl(publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const categoryData = {
      name: name.trim(),
      slug: slug.trim(),
      image_url: imageUrl,
      is_active: isActive,
      parent_id: parentId,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        });
      } else {
        toast({ title: "Category updated" });
        navigate("/admin/categories");
      }
    } else {
      const { error } = await supabase.from("categories").insert(categoryData);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate")
            ? "A category with this slug already exists"
            : "Failed to create category",
          variant: "destructive",
        });
      } else {
        toast({ title: "Category created" });
        navigate("/admin/categories");
      }
    }

    setSaving(false);
  };

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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/categories")}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {isEdit ? "Edit Category" : "New Category"}
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            {isEdit ? "Update category details" : "Add a new product category"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Category Image */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-lg text-foreground mb-4">Category Image</h2>
          
          <div className="flex items-start gap-6">
            <div className="w-40 h-28 bg-secondary flex-shrink-0 relative overflow-hidden">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Category"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-background/80 text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2 font-body">
                Recommended: 800x600px, max 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg text-foreground mb-4">Category Details</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              placeholder="e.g., Men's Clothing"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              placeholder="e.g., mens-clothing"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Parent Category
            </label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter((c) => c.id !== id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 border-border"
            />
            <span className="font-body text-foreground">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Update Category" : "Create Category"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="px-6 py-3 border border-border text-foreground font-body hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCategoryForm;
