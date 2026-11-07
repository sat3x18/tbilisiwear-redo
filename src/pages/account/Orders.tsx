import { useState, useEffect } from "react";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

const Orders = () => {
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-500 bg-green-500/10';
      case 'shipped':
        return 'text-blue-500 bg-blue-500/10';
      case 'processing':
        return 'text-amber-500 bg-amber-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Order History</h2>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground font-body mb-6">
            When you make a purchase, your orders will appear here.
          </p>
          <Link to="/shop" className="btn-gold inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-body text-sm text-muted-foreground">Order Number</p>
                  <p className="font-display text-lg text-foreground">{order.order_number}</p>
                </div>
                <span className={`px-3 py-1 text-xs ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Date</p>
                    <p className="font-body text-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="font-body text-sm text-muted-foreground">Total</p>
                    <p className="font-body text-foreground">{formatPrice(order.total, settings.currency)}</p>
                  </div>
                </div>
                <Link 
                  to={`/account/orders/${order.id}`}
                  className="flex items-center gap-1 text-primary hover:text-foreground transition-colors text-sm"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
