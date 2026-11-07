import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

const AdminDashboard = () => {
  const { settings } = useStoreSettings();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // Fetch products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Fetch orders
    const { data: ordersData, count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5);

    // Calculate total revenue
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid");

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Fetch unique customers
    const { data: customersData } = await supabase
      .from("orders")
      .select("user_id");

    const uniqueCustomers = new Set(customersData?.map((o) => o.user_id)).size;

    setStats({
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalCustomers: uniqueCustomers,
      totalRevenue,
      recentOrders: ordersData || [],
    });

    setLoading(false);
  };

  const formatPriceWithCurrency = (amount: number) => {
    return formatPrice(amount, settings.currency);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-500 bg-green-500/10";
      case "shipped":
        return "text-blue-500 bg-blue-500/10";
      case "processing":
        return "text-amber-500 bg-amber-500/10";
      case "cancelled":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/admin/products",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/admin/orders",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/admin/customers",
    },
    {
      title: "Revenue",
      value: formatPriceWithCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-foreground",
      bgColor: "bg-muted",
      link: "/admin/analytics",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground font-body mt-1">
          Orders, products and store activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-card border border-border p-6 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-sm">{stat.title}</p>
                <p className="font-display text-2xl text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <span className="font-body">View details</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-primary hover:text-foreground transition-colors font-body flex items-center gap-2"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {stats.recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No orders yet</p>
            </div>
          ) : (
            stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="font-body text-foreground">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="font-body text-foreground">{formatPriceWithCurrency(order.total)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/products/new"
          className="bg-card border border-border p-6 hover:border-primary/30 transition-colors group"
        >
          <Package className="w-8 h-8 text-primary mb-4" />
          <h3 className="font-display text-lg text-foreground mb-2">Add Product</h3>
          <p className="text-sm text-muted-foreground font-body">
            Add new products to your catalog
          </p>
        </Link>
        <Link
          to="/admin/coupons/new"
          className="bg-card border border-border p-6 hover:border-primary/30 transition-colors group"
        >
          <TrendingUp className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="font-display text-lg text-foreground mb-2">Create Coupon</h3>
          <p className="text-sm text-muted-foreground font-body">
            Create promotional discount codes
          </p>
        </Link>
        <Link
          to="/admin/analytics"
          className="bg-card border border-border p-6 hover:border-primary/30 transition-colors group"
        >
          <TrendingDown className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="font-display text-lg text-foreground mb-2">View Reports</h3>
          <p className="text-sm text-muted-foreground font-body">
            Analyze sales and performance
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
