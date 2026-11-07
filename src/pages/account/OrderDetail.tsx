import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";
import ReviewForm from "@/components/reviews/ReviewForm";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

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
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount_amount: number | null;
  total: number;
  created_at: string;
  shipping_address: Json;
  tracking_number: string | null;
  notes: string | null;
}

interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());
  const [reviewingItem, setReviewingItem] = useState<OrderItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
      checkReviewedProducts();
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    setLoading(true);

    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      setLoading(false);
      return;
    }

    setOrder(orderData);

    // Fetch order items
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsData) {
      setItems(itemsData);
    }

    // Fetch status history
    const { data: historyData } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (historyData) {
      setStatusHistory(historyData);
    }

    setLoading(false);
  };

  const checkReviewedProducts = async () => {
    if (!user || !orderId) return;

    // Get all reviews by this user for products in this order
    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("order_id", orderId);

    if (reviews) {
      setReviewedProducts(new Set(reviews.map((r) => r.product_id)));
    }
  };

  const handleSubmitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (!reviewingItem || !user || !orderId) throw new Error("Missing data");

    const { error } = await supabase.from("product_reviews").insert({
      product_id: reviewingItem.product_id,
      user_id: user.id,
      order_id: orderId,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment,
      is_verified_purchase: true,
      is_approved: true,
    });

    if (error) throw error;

    toast({
      title: "Review submitted",
      description: "Your feedback helps other customers make better decisions.",
    });

    setReviewingItem(null);
    checkReviewedProducts();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "processing":
        return <Package className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPriceWithCurrency = (amount: number) => {
    return formatPrice(amount, settings.currency);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">Order not found</h3>
        <Link to="/account/orders" className="text-primary hover:text-foreground transition-colors">
          Back to Orders
        </Link>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as unknown as ShippingAddress;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/account/orders"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="font-display text-2xl text-foreground">Order {order.order_number}</h2>
            <p className="text-sm text-muted-foreground font-body">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Order Timeline */}
      {statusHistory.length > 0 && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-6">Order Timeline</h3>
          <div className="space-y-4">
            {statusHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStatusIcon(entry.status)}
                  {index < statusHistory.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-foreground font-body capitalize">{entry.status}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    {formatDate(entry.created_at)}
                  </p>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground font-body mt-1">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Number */}
      {order.tracking_number && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-2">Tracking</h3>
          <p className="text-muted-foreground font-body text-sm mb-2">Tracking Number:</p>
          <p className="text-foreground font-mono">{order.tracking_number}</p>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-card border border-border p-6">
        <h3 className="font-display text-lg text-foreground mb-6">Items</h3>
        <div className="space-y-4">
          {items.map((item) => {
            const isReviewed = reviewedProducts.has(item.product_id);
            const canReview = order?.status === "delivered" && !isReviewed;
            
            return (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="w-20 h-24 bg-secondary flex-shrink-0">
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
                  <h4 className="font-display text-foreground">{item.product_name}</h4>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground font-body">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground font-body">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-foreground font-body">{formatPriceWithCurrency(item.total_price)}</span>
                  </div>
                  
                  {/* Review Button */}
                  {canReview && (
                    <button
                      onClick={() => setReviewingItem(item)}
                      className="mt-3 flex items-center gap-2 text-xs text-primary hover:text-foreground transition-colors font-body"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Write a Review
                    </button>
                  )}
                  {isReviewed && (
                    <span className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-body">
                      <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                      Reviewed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-4">Shipping Address</h3>
          <div className="text-muted-foreground font-body space-y-1 text-sm">
            <p className="text-foreground">{shippingAddress.full_name}</p>
            <p>{shippingAddress.street_address}</p>
            {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
            <p>
              {shippingAddress.city}
              {shippingAddress.state && `, ${shippingAddress.state}`} {shippingAddress.postal_code}
            </p>
            <p>{shippingAddress.country}</p>
            {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-4">Order Summary</h3>
          <div className="space-y-3 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatPriceWithCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">
                {order.shipping_cost === 0 ? "Free" : formatPriceWithCurrency(order.shipping_cost)}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{formatPriceWithCurrency(order.tax)}</span>
              </div>
            )}
            {order.discount_amount && order.discount_amount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Discount</span>
                <span>-{formatPriceWithCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="text-foreground font-display">Total</span>
              <span className="text-foreground font-display text-lg">{formatPriceWithCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display text-lg text-foreground mb-2">Order Notes</h3>
          <p className="text-muted-foreground font-body text-sm">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link to="/contact" className="btn-luxury">
          Contact Support
        </Link>
        <Link
          to="/shop"
          className="px-6 py-3 border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Review Form Modal */}
      {reviewingItem && (
        <ReviewForm
          isOpen={true}
          onClose={() => setReviewingItem(null)}
          onSubmit={handleSubmitReview}
          productName={reviewingItem.product_name}
        />
      )}
    </div>
  );
};

export default OrderDetail;
