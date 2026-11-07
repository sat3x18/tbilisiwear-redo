import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AdminCouponForm = () => {
  const { couponId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(couponId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVipOnly, setIsVipOnly] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchCoupon();
    }
  }, [couponId]);

  const fetchCoupon = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Coupon not found", variant: "destructive" });
      navigate("/admin/coupons");
      return;
    }

    setCode(data.code);
    setType(data.type);
    setValue(data.value.toString());
    setDescription(data.description || "");
    setMinOrderAmount(data.min_order_amount?.toString() || "");
    setMaxDiscount(data.max_discount?.toString() || "");
    setUsageLimit(data.usage_limit?.toString() || "");
    setPerUserLimit(data.per_user_limit?.toString() || "1");
    setValidFrom(data.valid_from.split("T")[0]);
    setValidUntil(data.valid_until?.split("T")[0] || "");
    setIsActive(data.is_active);
    setIsVipOnly(data.is_vip_only);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !value) {
      toast({ title: "Error", description: "Code and value are required", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const couponData = {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        description: description || null,
        min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        per_user_limit: perUserLimit ? parseInt(perUserLimit) : 1,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive,
        is_vip_only: isVipOnly,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", couponId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);

        if (error) throw error;
      }

      toast({ title: isEditing ? "Coupon updated" : "Coupon created" });
      navigate("/admin/coupons");
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/coupons")}
            className="p-2 hover:bg-secondary rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {isEditing ? "Edit Coupon" : "Create Coupon"}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              {isEditing ? "Update coupon details" : "Create a new discount code"}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-gold inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Coupon"}
        </button>
      </div>

      {/* Code */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Coupon Code</h2>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-body text-foreground mb-2">
              Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono uppercase"
              placeholder="SUMMER20"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={generateCode}
              className="px-4 py-3 border border-border text-foreground hover:bg-secondary transition-colors font-body"
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-body text-foreground mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
            placeholder="Summer sale 20% off"
          />
        </div>
      </section>

      {/* Discount */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Discount Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Discount Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₾)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Value *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
                placeholder={type === "percentage" ? "20" : "50.00"}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {type === "percentage" ? "%" : "₾"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Minimum Order Amount (₾)
            </label>
            <input
              type="number"
              step="0.01"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="100.00"
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Maximum Discount (₾)
            </label>
            <input
              type="number"
              step="0.01"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="50.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For percentage discounts, cap the max discount amount
            </p>
          </div>
        </div>
      </section>

      {/* Usage Limits */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Usage Limits</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Total Usage Limit
            </label>
            <input
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="Unlimited"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for unlimited uses
            </p>
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Per User Limit
            </label>
            <input
              type="number"
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              placeholder="1"
            />
          </div>
        </div>
      </section>

      {/* Validity */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Validity Period</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Valid From *
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-foreground mb-2">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-display text-xl text-foreground">Status & Access</h2>

        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
            <Label htmlFor="is-active" className="font-body">Active</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isVipOnly} onCheckedChange={setIsVipOnly} id="is-vip-only" />
            <Label htmlFor="is-vip-only" className="font-body">VIP Only</Label>
          </div>
        </div>
      </section>
    </form>
  );
};

export default AdminCouponForm;