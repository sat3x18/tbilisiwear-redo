import { useState, useEffect } from "react";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentTrends: {
    revenue: { current: number; previous: number };
    orders: { current: number; previous: number };
    customers: { current: number; previous: number };
  };
}

const COLORS = ["#D4AF37", "#1a1a1a", "#404040", "#666666", "#888888"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo * 2);

    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDate.toISOString());

    const { data: previousOrders } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", previousStartDate.toISOString())
      .lt("created_at", startDate.toISOString());

    // Fetch all orders for monthly breakdown
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });

    // Fetch order items for top products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, unit_price, quantity, total_price");

    // Fetch products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Fetch unique customers
    const { data: customerData } = await supabase
      .from("orders")
      .select("user_id")
      .gte("created_at", startDate.toISOString());

    const { data: previousCustomerData } = await supabase
      .from("orders")
      .select("user_id")
      .gte("created_at", previousStartDate.toISOString())
      .lt("created_at", startDate.toISOString());

    // Calculate metrics
    const currentRevenue = orders?.reduce((sum, o) => sum + (o.payment_status === "paid" ? o.total : 0), 0) || 0;
    const previousRevenue = previousOrders?.reduce((sum, o) => sum + (o.payment_status === "paid" ? o.total : 0), 0) || 0;

    const currentCustomers = new Set(customerData?.map((o) => o.user_id)).size;
    const previousCustomers = new Set(previousCustomerData?.map((o) => o.user_id)).size;

    // Revenue by month
    const revenueByMonth: { [key: string]: { revenue: number; orders: number } } = {};
    allOrders?.forEach((order) => {
      const month = new Date(order.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = { revenue: 0, orders: 0 };
      }
      if (order.payment_status === "paid") {
        revenueByMonth[month].revenue += order.total;
      }
      revenueByMonth[month].orders += 1;
    });

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .slice(-6)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
      }));

    // Top products
    const productRevenue: { [key: string]: { revenue: number; quantity: number } } = {};
    orderItems?.forEach((item) => {
      if (!productRevenue[item.product_name]) {
        productRevenue[item.product_name] = { revenue: 0, quantity: 0 };
      }
      productRevenue[item.product_name].revenue += item.total_price;
      productRevenue[item.product_name].quantity += item.quantity;
    });

    const topProducts = Object.entries(productRevenue)
      .map(([name, data]) => ({ name, revenue: data.revenue, quantity: data.quantity }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by status
    const statusCount: { [key: string]: number } = {};
    allOrders?.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
    }));

    setData({
      totalRevenue: currentRevenue,
      totalOrders: orders?.length || 0,
      totalCustomers: currentCustomers,
      totalProducts: productsCount || 0,
      averageOrderValue: orders?.length ? currentRevenue / orders.length : 0,
      revenueByMonth: revenueByMonthArray,
      topProducts,
      ordersByStatus,
      recentTrends: {
        revenue: { current: currentRevenue, previous: previousRevenue },
        orders: { current: orders?.length || 0, previous: previousOrders?.length || 0 },
        customers: { current: currentCustomers, previous: previousCustomers },
      },
    });

    setLoading(false);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const revenueChange = calculateChange(
    data.recentTrends.revenue.current,
    data.recentTrends.revenue.previous
  );
  const ordersChange = calculateChange(
    data.recentTrends.orders.current,
    data.recentTrends.orders.previous
  );
  const customersChange = calculateChange(
    data.recentTrends.customers.current,
    data.recentTrends.customers.previous
  );

  const statCards = [
    {
      title: "Revenue",
      value: formatPrice(data.totalRevenue),
      change: revenueChange,
      icon: DollarSign,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "Orders",
      value: data.totalOrders,
      change: ordersChange,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Customers",
      value: data.totalCustomers,
      change: customersChange,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Avg. Order Value",
      value: formatPrice(data.averageOrderValue),
      change: null,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Analytics</h1>
          <p className="text-muted-foreground font-body mt-1">
            Track your store performance
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-card border border-border text-foreground focus:outline-none focus:border-primary transition-colors font-body"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-sm">{stat.title}</p>
                <p className="font-display text-2xl text-foreground mt-2">{stat.value}</p>
                {stat.change !== null && (
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="font-body">{Math.abs(stat.change)}%</span>
                    <span className="text-muted-foreground font-body">vs prev period</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-xl text-foreground mb-6">Revenue Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `€${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "0",
                  }}
                  formatter={(value: number) => [formatPrice(value), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-xl text-foreground mb-6">Orders Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "0",
                  }}
                />
                <Bar dataKey="orders" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-xl text-foreground mb-6">Top Products</h2>
          {data.topProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-muted text-foreground text-sm font-display">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-foreground truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground font-body">
                      {product.quantity} sold
                    </p>
                  </div>
                  <span className="font-body text-foreground">{formatPrice(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-display text-xl text-foreground mb-6">Order Status</h2>
          {data.ordersByStatus.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No orders yet</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "0",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-foreground font-body capitalize">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;