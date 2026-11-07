import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface ShippingAddress {
  full_name: string;
  street_address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number | null;
  tax: number;
  total: number;
  notes: string | null;
  tracking_number: string | null;
  shipping_address: ShippingAddress;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];
const paymentStatusOptions = ["pending", "paid", "failed", "refunded"];

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useStoreSettings();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);

    const [orderRes, itemsRes, historyRes] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
      supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
    ]);

    if (orderRes.error || !orderRes.data) {
      toast({ title: "Error", description: "Order not found", variant: "destructive" });
      navigate("/admin/orders");
      return;
    }

    setOrder({
      ...orderRes.data,
      shipping_address: orderRes.data.shipping_address as unknown as ShippingAddress,
    } as Order);
    setItems(itemsRes.data || []);
    setStatusHistory(historyRes.data || []);
    setTrackingNumber(orderRes.data.tracking_number || "");
    setNotes(orderRes.data.notes || "");
    setLoading(false);
  };

  const sendStatusEmail = async (newStatus: string) => {
    if (!order) return;
    
    const shippingAddr = order.shipping_address as unknown as ShippingAddress;

    try {
      const { data, error } = await supabase.functions.invoke("send-order-status-email", {
        body: {
          userId: order.user_id,
          customerName: shippingAddr?.full_name || "Customer",
          orderNumber: order.order_number,
          newStatus,
          trackingNumber: trackingNumber || order.tracking_number,
          orderTotal: order.total,
          currency: settings.currency,
        },
      });

      if (error) {
        console.error("Failed to send status email:", error);
      } else {
        console.log("Status email sent successfully to:", data?.sentTo);
      }
    } catch (error) {
      console.error("Error sending status email:", error);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      return;
    }

    // Add to history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: newStatus,
    });

    // Send email notification
    await sendStatusEmail(newStatus);

    setOrder({ ...order, status: newStatus });
    fetchOrder(); // Refresh history
    toast({ title: "Status updated and customer notified" });
  };

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", order.id);

    if (!error) {
      setOrder({ ...order, payment_status: newStatus });
      toast({ title: "Payment status updated" });
    }
  };

  const saveDetails = async () => {
    if (!order) return;
    setSaving(true);

    const { error } = await supabase
      .from("orders")
      .update({
        tracking_number: trackingNumber || null,
        notes: notes || null,
      })
      .eq("id", order.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Details saved" });
    }
    setSaving(false);
  };

  const formatPriceWithCurrency = (amount: number) => {
    return formatPrice(amount, settings.currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!order) return null;

  const shippingAddr = order.shipping_address;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 hover:bg-secondary rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              Order {order.order_number}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground hover:bg-secondary transition-colors font-body"
        >
          <Printer className="w-4 h-4" />
          Print Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <section className="bg-card border border-border p-6">
            <h2 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({items.length})
            </h2>

            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="w-20 h-20 bg-secondary flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-foreground">{item.product_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mt-1">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <p className="text-foreground font-body mt-2">
                      {formatPriceWithCurrency(item.unit_price)} × {item.quantity} ={" "}
                      <span className="font-medium">{formatPriceWithCurrency(item.total_price)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-border space-y-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPriceWithCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">{formatPriceWithCurrency(order.shipping_cost)}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-500">-{formatPriceWithCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{formatPriceWithCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-display pt-4 border-t border-border">
                <span>Total</span>
                <span>{formatPriceWithCurrency(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Shipping & Tracking */}
          <section className="bg-card border border-border p-6">
            <h2 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-muted-foreground font-body mb-2">Shipping Address</h3>
                <div className="font-body text-foreground space-y-1">
                  <p className="font-medium">{shippingAddr.full_name}</p>
                  <p>{shippingAddr.street_address}</p>
                  {shippingAddr.apartment && <p>{shippingAddr.apartment}</p>}
                  <p>
                    {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}
                  </p>
                  <p>{shippingAddr.country}</p>
                  {shippingAddr.phone && <p>Phone: {shippingAddr.phone}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body text-muted-foreground mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
                    placeholder="Enter tracking number"
                  />
                </div>

                <button
                  onClick={saveDetails}
                  disabled={saving}
                  className="btn-gold w-full"
                >
                  {saving ? "Saving..." : "Save Tracking"}
                </button>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="bg-card border border-border p-6">
            <h2 className="font-display text-xl text-foreground mb-4">Order Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body resize-none"
              placeholder="Add internal notes about this order..."
            />
            <button
              onClick={saveDetails}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-body"
            >
              Save Notes
            </button>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <section className="bg-card border border-border p-6 space-y-6">
            <h2 className="font-display text-xl text-foreground">Order Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body text-muted-foreground mb-2">
                  Order Status
                </label>
                <Select value={order.status} onValueChange={updateOrderStatus}>
                  <SelectTrigger className={`w-full ${getStatusColor(order.status)}`}>
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
              </div>

              <div>
                <label className="block text-sm font-body text-muted-foreground mb-2">
                  Payment Status
                </label>
                <Select value={order.payment_status} onValueChange={updatePaymentStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {paymentStatusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {order.payment_method && (
                <div>
                  <span className="text-sm text-muted-foreground font-body">Payment Method:</span>
                  <p className="text-foreground font-body capitalize">{order.payment_method}</p>
                </div>
              )}
            </div>
          </section>

          {/* Status History */}
          <section className="bg-card border border-border p-6">
            <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Status History
            </h2>

            {statusHistory.length === 0 ? (
              <p className="text-muted-foreground font-body text-sm">No status updates yet</p>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? "bg-foreground" : "bg-border"
                        }`}
                      />
                      {index < statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-body text-foreground capitalize">{item.status}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {formatDate(item.created_at)}
                      </p>
                      {item.note && (
                        <p className="text-sm text-muted-foreground font-body mt-1">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;