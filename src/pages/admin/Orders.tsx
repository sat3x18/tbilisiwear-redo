import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Loader2,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  Mail,
  Printer,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  user_id: string;
  shipping_address: any;
  tracking_number?: string;
}

const statusOptions = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const AdminOrders = () => {
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const sendStatusEmail = async (order: Order, newStatus: string) => {
    try {
      const shippingAddress = order.shipping_address;
      const customerName = shippingAddress?.full_name || 'Customer';

      const { data, error } = await supabase.functions.invoke('send-order-status-email', {
        body: {
          userId: order.user_id,
          customerName,
          orderNumber: order.order_number,
          newStatus,
          trackingNumber: order.tracking_number,
          orderTotal: order.total,
          currency: settings.currency,
        },
      });

      if (error) {
        console.error("Error sending status email:", error);
        return { success: false, reason: error.message };
      }

      console.log("Status email sent to:", data?.sentTo);
      return { success: true, email: data?.sentTo };
    } catch (err: any) {
      console.error("Error invoking email function:", err);
      return { success: false, reason: err.message };
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } else {
      // Add to status history
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        status: newStatus,
      });

      // Send email notification
      const emailResult = await sendStatusEmail({ ...order, status: newStatus }, newStatus);

      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      
      if (emailResult.success) {
        toast({ title: "Order status updated", description: `Customer notified at ${emailResult.email}` });
      } else {
        toast({ title: "Order status updated", description: "Email notification failed." });
      }
    }
  };

  const handleSendEmail = async (order: Order) => {
    toast({ title: "Sending email..." });
    const result = await sendStatusEmail(order, order.status);
    if (result.success) {
      toast({ title: "Email sent", description: "Customer has been notified." });
    } else {
      toast({ 
        title: "Failed to send email", 
        description: result.reason === "No email" ? "No customer email on this order." : result.reason,
        variant: "destructive" 
      });
    }
  };

  const handlePrintInvoice = (orderId: string) => {
    // Navigate to order detail and print
    window.open(`/admin/orders/${orderId}?print=true`, '_blank');
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-500";
      case "pending":
        return "text-amber-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="font-display text-3xl text-foreground">Orders</h1>
        <p className="text-muted-foreground font-body mt-1">
          Manage customer orders ({orders.length} total)
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Order
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Payment
                </th>
                <th className="text-left px-6 py-4 font-body text-sm text-muted-foreground">
                  Total
                </th>
                <th className="text-right px-6 py-4 font-body text-sm text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-display text-foreground hover:text-primary transition-colors"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-body">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateStatus(order.id, value)}
                      >
                        <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(order.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-body capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground font-body">{formatPriceWithCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/orders/${order.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(order.id)}>
                              <Printer className="w-4 h-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(order)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
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

export default AdminOrders;