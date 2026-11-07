import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Tag, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string | null;
}

const AdminCoupons = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCoupons(data || []);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
    toast({ title: `Coupon ${!current ? "activated" : "deactivated"}` });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Coupons</h1>
          <p className="text-muted-foreground font-body mt-1">Manage discount codes</p>
        </div>
        <Link to="/admin/coupons/new" className="btn-gold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </Link>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">Code</th>
              <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">Discount</th>
              <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">Usage</th>
              <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">Status</th>
              <th className="text-right px-6 py-4 font-body text-sm text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-body">No coupons yet</p>
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-secondary/30">
                  <td className="px-6 py-4 font-mono text-foreground">{coupon.code}</td>
                  <td className="px-6 py-4 text-foreground">
                    {coupon.type === "percentage" ? `${coupon.value}%` : `₾${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {coupon.usage_count}/{coupon.usage_limit || "∞"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      className={`px-2 py-1 text-xs ${
                        coupon.is_active ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                      }`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/admin/coupons/${coupon.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCoupons;
