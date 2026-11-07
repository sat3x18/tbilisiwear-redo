import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { formatPrice } from '@/lib/formatPrice';

interface CartDrawerProps {
  trigger?: React.ReactNode;
}

export function CartDrawer({ trigger }: CartDrawerProps) {
  const { items, itemCount, subtotal, removeFromCart, updateQuantity, loading, isOpen, setIsOpen } = useCart();
  const { settings } = useStoreSettings();

  const formatPriceWithCurrency = (price: number) => {
    return formatPrice(price, settings.currency);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl">
            Shopping Bag ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Your bag is empty</p>
            <p className="text-muted-foreground mb-6">
              Add something from the shop
            </p>
            <SheetTrigger asChild>
              <Button asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </SheetTrigger>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <AnimatePresence>
                {items.map((item) => {
                  // Use bundle discount price if available, then sale price, then base price
                  const price = item.product.bundle_discount_price ?? item.product.sale_price ?? item.product.base_price;
                  const hasDiscount = item.product.bundle_discount_price != null || item.product.sale_price !== null;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 pb-4 border-b border-border"
                    >
                      <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">
                        <div className="w-24 h-32 bg-muted rounded overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            {item.product.brand && (
                              <p className="text-xs text-muted-foreground ">
                                {item.product.brand.name}
                              </p>
                            )}
                            <Link
                              to={`/product/${item.product.slug}`}
                              className="font-medium hover:underline line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1 -mr-2"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-1 text-sm text-muted-foreground">
                          <span>{item.variant.size}</span>
                          <span className="mx-2">·</span>
                          <span className="inline-flex items-center gap-1">
                            {item.variant.color_hex && (
                              <span
                                className="w-3 h-3 rounded-full border border-border"
                                style={{ backgroundColor: item.variant.color_hex }}
                              />
                            )}
                            {item.variant.color}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 border border-border rounded">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.variant.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-medium">{formatPriceWithCurrency(price * item.quantity)}</p>
                            {hasDiscount && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPriceWithCurrency(item.product.base_price * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-medium">{formatPriceWithCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              <div className="grid gap-2">
                <SheetTrigger asChild>
                  <Button asChild className="w-full" size="lg">
                    <Link to="/checkout">Proceed to Checkout</Link>
                  </Button>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/cart">View Cart</Link>
                  </Button>
                </SheetTrigger>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
