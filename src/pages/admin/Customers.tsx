import { useState, useEffect } from "react";
import { Search, Loader2, Users, Mail, Phone, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface Customer {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
}

const AdminCustomers = () => {
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get order stats for each user
    const { data: orderStats } = await supabase
      .from("orders")
      .select("user_id, total");

    const statsMap = new Map<string, { count: number; total: number }>();
    orderStats?.forEach((order) => {
      const current = statsMap.get(order.user_id) || { count: 0, total: 0 };
      statsMap.set(order.user_id, {
        count: current.count + 1,
        total: current.total + order.total,
      });
    });

    const customersData: Customer[] = (profiles || []).map((profile) => ({
      id: profile.id,
      email: "",
      display_name: profile.display_name,
      phone: profile.phone,
      created_at: profile.created_at,
      order_count: statsMap.get(profile.id)?.count || 0,
      total_spent: statsMap.get(profile.id)?.total || 0,
    }));

    // Fetch emails via edge function
    const userIds = customersData.map((c) => c.id);
    if (userIds.length > 0) {
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "get-customer-emails",
          { body: { userIds } }
        );
        if (!emailError && emailData?.emails) {
          const emailMap = emailData.emails as Record<string, string>;
          customersData.forEach((c) => {
            if (emailMap[c.id]) {
              c.email = emailMap[c.id];
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch customer emails:", err);
      }
    }

    setCustomers(customersData);
    setLoading(false);
  };

  const formatPriceWithCurrency = (amount: number) => {
    return formatPrice(amount, settings.currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
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
      <div>
        <h1 className="font-display text-3xl text-foreground">Customers</h1>
        <p className="text-muted-foreground font-body mt-1">
          View and manage your customers ({customers.length} total)
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, email, or phone..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Customer
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Contact
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Orders
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Total Spent
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-display text-foreground">
                            {customer.display_name || "Guest"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-body">{customer.order_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground font-body">
                        {formatPriceWithCurrency(customer.total_spent)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-body">
                        {formatDate(customer.created_at)}
                      </span>
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

export default AdminCustomers;
