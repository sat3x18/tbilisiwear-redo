import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminBrandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [navbarImageUrl, setNavbarImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [uploadingNavbar, setUploadingNavbar] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchBrand();
    }
  }, [id]);

  const fetchBrand = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Brand not found",
        variant: "destructive",
      });
      navigate("/admin/brands");
      return;
    }

    setName(data.name);
    setSlug(data.slug);
    setDescription(data.description || "");
    setLogoUrl(data.logo_url);
    setNavbarImageUrl(data.navbar_image_url);
    setIsActive(data.is_active);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const fileName = `brand-logo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setLogoUrl(publicUrl);
    setUploading(false);
  };

  const handleNavbarImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingNavbar(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `brand-navbar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload navbar image",
        variant: "destructive",
      });
      setUploadingNavbar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setNavbarImageUrl(publicUrl);
    setUploadingNavbar(false);
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

    const brandData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      logo_url: logoUrl,
      navbar_image_url: navbarImageUrl,
      is_active: isActive,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("brands")
        .update(brandData)
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update brand",
          variant: "destructive",
        });
      } else {
        toast({ title: "Brand updated" });
        navigate("/admin/brands");
      }
    } else {
      const { error } = await supabase.from("brands").insert(brandData);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate")
            ? "A brand with this slug already exists"
            : "Failed to create brand",
          variant: "destructive",
        });
      } else {
        toast({ title: "Brand created" });
        navigate("/admin/brands");
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
          onClick={() => navigate("/admin/brands")}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {isEdit ? "Edit Brand" : "New Brand"}
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            {isEdit ? "Update brand details" : "Add a new product brand"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Brand Logo */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-lg text-foreground mb-4">Brand Logo</h2>
          
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-secondary flex-shrink-0 relative overflow-hidden flex items-center justify-center p-4">
              {logoUrl ? (
                <>
                  <img
                    src={logoUrl}
                    alt="Brand Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-background/80 text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2 font-body">
                Recommended: PNG with transparent background, max 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Navbar Image */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-lg text-foreground mb-2">Navbar Image</h2>
          <p className="text-sm text-muted-foreground mb-4 font-body">
            High-quality campaign or lifestyle photo displayed when hovering over this brand in the navigation menu.
          </p>
          
          <div className="flex items-start gap-6">
            <div className="w-40 h-52 bg-secondary flex-shrink-0 relative overflow-hidden flex items-center justify-center">
              {navbarImageUrl ? (
                <>
                  <img
                    src={navbarImageUrl}
                    alt="Navbar Image"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setNavbarImageUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-background/80 text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors cursor-pointer">
                {uploadingNavbar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Navbar Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNavbarImageUpload}
                  className="hidden"
                  disabled={uploadingNavbar}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2 font-body">
                Recommended: 800×1000px or higher, max 5MB
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Use high-quality fashion campaign photos for best results
              </p>
            </div>
          </div>
        </div>

        {/* Brand Details */}
        <div className="bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg text-foreground mb-4">Brand Details</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary"
              placeholder="e.g., Gucci"
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
              placeholder="e.g., gucci"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-body">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary resize-none"
              placeholder="Brief description of the brand..."
            />
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
            {isEdit ? "Update Brand" : "Create Brand"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/brands")}
            className="px-6 py-3 border border-border text-foreground font-body hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminBrandForm;
