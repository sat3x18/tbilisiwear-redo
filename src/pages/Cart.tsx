import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { formatPrice, getCurrencySymbol } from '@/lib/formatPrice';

export default function Cart() {
  const { items, itemCount, subtotal, removeFromCart, updateQuantity, loading } = useCart();
  const { settings } = useStoreSettings();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold) || 500;
  const standardShippingCost = parseFloat(settings.standard_shipping_cost) || 15;
  const shipping = subtotal >= freeShippingThreshold ? 0 : standardShippingCost;
  const total = subtotal + shipping;

  const formatPriceWithCurrency = (price: number) => {
    return formatPrice(price, settings.currency);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-32 sm:pt-36 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-normal mb-8 text-center">Shopping Bag</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-medium mb-4">Your bag is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Add something from the shop
              </p>
              <Button asChild size="lg">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-muted-foreground">{itemCount} items</span>
                  <Link to="/shop" className="text-sm underline hover:no-underline">
                    Continue Shopping
                  </Link>
                </div>

                {items.map((item, index) => {
                  const price = item.product.sale_price ?? item.product.base_price;
                  const hasDiscount = item.product.sale_price !== null;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-6 py-6 border-b border-border"
                    >
                      <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">
                        <div className="w-32 h-40 bg-muted rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between">
                          <div>
                            {item.product.brand && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {item.product.brand.name}
                              </p>
                            )}
                            <Link
                              to={`/product/${item.product.slug}`}
                              className="text-lg font-medium hover:underline"
                            >
                              {item.product.name}
                            </Link>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span>Size: {item.variant.size}</span>
                              <span className="mx-3">·</span>
                              <span className="inline-flex items-center gap-1">
                                Color:
                                {item.variant.color_hex && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-border ml-1"
                                    style={{ backgroundColor: item.variant.color_hex }}
                                  />
                                )}
                                {item.variant.color}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-medium">{formatPriceWithCurrency(price * item.quantity)}</p>
                            {hasDiscount && (
                              <p className="text-sm text-muted-foreground line-through">
                                {formatPriceWithCurrency(item.product.base_price * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-4">
                          <div className="flex items-center gap-3 border border-border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.variant.stock_quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-muted/30 rounded-xl p-6 sticky top-24">
                  <h2 className="text-2xl mb-6">Order Summary</h2>

                  {/* Coupon Code */}
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="pl-10"
                        />
                      </div>
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPriceWithCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatPriceWithCurrency(shipping)}</span>
                    </div>
                    {subtotal < freeShippingThreshold && (
                      <p className="text-xs text-muted-foreground">
                        Add {formatPriceWithCurrency(freeShippingThreshold - subtotal)} more for free shipping
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-medium">
                    <span>Total</span>
                    <span>{formatPriceWithCurrency(total)}</span>
                  </div>

                  {settings.payments_enabled ? (
                    <Button asChild size="lg" className="w-full mt-6">
                      <Link to="/checkout">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm text-muted-foreground text-center font-body">
                        To purchase, contact us on:
                      </p>
                      <div className="flex flex-col gap-2">
                        {settings.social_instagram && (
                          <Button asChild variant="outline" size="lg" className="w-full">
                            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer">
                              Instagram
                            </a>
                          </Button>
                        )}
                        {settings.social_facebook && (
                          <Button asChild variant="outline" size="lg" className="w-full">
                            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer">
                              Facebook
                            </a>
                          </Button>
                        )}
                        {settings.social_messenger && (
                          <Button asChild variant="outline" size="lg" className="w-full">
                            <a href={settings.social_messenger} target="_blank" rel="noopener noreferrer">
                              Messenger
                            </a>
                          </Button>
                        )}
                        {settings.social_tiktok && (
                          <Button asChild variant="outline" size="lg" className="w-full">
                            <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer">
                              TikTok
                            </a>
                          </Button>
                        )}
                        {!settings.social_instagram && !settings.social_facebook && !settings.social_messenger && !settings.social_tiktok && (
                          <p className="text-sm text-muted-foreground text-center">
                            Contact details coming soon
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Secure checkout
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Free returns within 14 days
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Authenticity guaranteed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
