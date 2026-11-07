import { useState, useEffect } from "react";
import { Heart, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/formatPrice";

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string | null;
  added_at: string;
}

const Wishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .order('added_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const removeFromWishlist = async (id: string) => {
    setRemovingId(id);
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', id);

    if (!error) {
      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
    setRemovingId(null);
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
        <h2 className="font-display text-2xl text-foreground">My Wishlist</h2>
        {items.length > 0 && (
          <span className="text-muted-foreground font-body text-sm">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground font-body mb-6">
            Save items you love to your wishlist and find them here anytime.
          </p>
          <Link to="/shop" className="btn-gold inline-block">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border group hover:border-primary/30 transition-colors"
            >
              <div className="flex">
                {/* Image */}
                <Link 
                  to={`/product/${item.product_id}`}
                  className="w-32 h-40 bg-secondary flex-shrink-0"
                >
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-display text-lg text-foreground hover:text-primary transition-colors"
                    >
                      {item.product_name}
                    </Link>
                    <p className="font-body text-muted-foreground mt-1">
                      {formatPrice(item.product_price, settings.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-body hover:bg-primary/90 transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={removingId === item.id}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
