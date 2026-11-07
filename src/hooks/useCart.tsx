import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Bundle, calculateBundlePrice } from './useBundles';

interface CartItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price: number | null;
    brand: { name: string } | null;
    bundle_discount_price?: number; // Discounted price when part of a bundle
  };
  variant: {
    id: string;
    size: string;
    color: string;
    color_hex: string | null;
    stock_quantity: number;
  };
  image_url: string | null;
}

interface GuestCartItem {
  variantId: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  addBundleToCart: (bundle: Bundle, selectedVariants?: Record<string, string>) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'guest_cart';

function getGuestCart(): GuestCartItem[] {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch full cart item details from variant IDs (for guest cart)
  const fetchCartItemDetails = async (guestItems: GuestCartItem[]): Promise<CartItem[]> => {
    if (guestItems.length === 0) return [];

    const variantIds = guestItems.map(item => item.variantId);
    
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        size,
        color,
        color_hex,
        stock_quantity,
        products!inner (
          id,
          name,
          slug,
          base_price,
          sale_price,
          brands (name)
        )
      `)
      .in('id', variantIds);

    if (error || !variants) return [];

    // Get product images
    const productIds = [...new Set(variants.map((v: any) => v.products.id))];
    let imageMap: Record<string, string> = {};
    
    if (productIds.length > 0) {
      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, image_url')
        .in('product_id', productIds)
        .eq('is_primary', true);
      
      if (images) {
        imageMap = images.reduce((acc: Record<string, string>, img: any) => {
          acc[img.product_id] = img.image_url;
          return acc;
        }, {});
      }
    }

    return guestItems.map((guestItem, index) => {
      const variant = variants.find((v: any) => v.id === guestItem.variantId) as any;
      if (!variant) return null;
      
      return {
        id: `guest-${guestItem.variantId}`, // Use a guest prefix for IDs
        product_variant_id: guestItem.variantId,
        quantity: guestItem.quantity,
        product: {
          id: variant.products.id,
          name: variant.products.name,
          slug: variant.products.slug,
          base_price: variant.products.base_price,
          sale_price: variant.products.sale_price,
          brand: variant.products.brands,
        },
        variant: {
          id: variant.id,
          size: variant.size,
          color: variant.color,
          color_hex: variant.color_hex,
          stock_quantity: variant.stock_quantity,
        },
        image_url: imageMap[variant.products.id] || null,
      };
    }).filter(Boolean) as CartItem[];
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Logged-in user: fetch from database
        const { data: cartItems, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_variant_id,
            quantity,
            product_variants!inner (
              id,
              size,
              color,
              color_hex,
              stock_quantity,
              products!inner (
                id,
                name,
                slug,
                base_price,
                sale_price,
                brands (name)
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Also get primary images for each product
        const productIds = [...new Set(cartItems?.map((item: any) => item.product_variants.products.id) || [])];
        
        let imageMap: Record<string, string> = {};
        if (productIds.length > 0) {
          const { data: images } = await supabase
            .from('product_images')
            .select('product_id, image_url')
            .in('product_id', productIds)
            .eq('is_primary', true);
          
          if (images) {
            imageMap = images.reduce((acc: Record<string, string>, img: any) => {
              acc[img.product_id] = img.image_url;
              return acc;
            }, {});
          }
        }

        const formattedItems: CartItem[] = (cartItems || []).map((item: any) => ({
          id: item.id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          product: {
            id: item.product_variants.products.id,
            name: item.product_variants.products.name,
            slug: item.product_variants.products.slug,
            base_price: item.product_variants.products.base_price,
            sale_price: item.product_variants.products.sale_price,
            brand: item.product_variants.products.brands,
          },
          variant: {
            id: item.product_variants.id,
            size: item.product_variants.size,
            color: item.product_variants.color,
            color_hex: item.product_variants.color_hex,
            stock_quantity: item.product_variants.stock_quantity,
          },
          image_url: imageMap[item.product_variants.products.id] || null,
        }));

        setItems(formattedItems);
      } else {
        // Guest user: fetch from localStorage
        const guestCart = getGuestCart();
        const guestItems = await fetchCartItemDetails(guestCart);
        setItems(guestItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Merge guest cart into user cart when user logs in
  useEffect(() => {
    const mergeGuestCart = async () => {
      if (user) {
        const guestCart = getGuestCart();
        if (guestCart.length > 0) {
          // Merge guest cart items into user's cart
          for (const guestItem of guestCart) {
            try {
              // Check if already in user's cart
              const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', user.id)
                .eq('product_variant_id', guestItem.variantId)
                .maybeSingle();

              if (existing) {
                // Update quantity
                await supabase
                  .from('cart_items')
                  .update({ quantity: existing.quantity + guestItem.quantity })
                  .eq('id', existing.id);
              } else {
                // Insert new
                await supabase
                  .from('cart_items')
                  .insert({
                    user_id: user.id,
                    product_variant_id: guestItem.variantId,
                    quantity: guestItem.quantity,
                  });
              }
            } catch (err) {
              console.error('Error merging guest cart item:', err);
            }
          }
          // Clear guest cart after merge
          clearGuestCart();
        }
      }
    };

    mergeGuestCart().then(() => fetchCart());
  }, [user, fetchCart]);

  const addToCart = async (variantId: string, quantity: number = 1): Promise<boolean> => {
    try {
      // Check stock before adding
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single();
      
      if (variantError) throw variantError;
      
      if (user) {
        // Logged-in user: use database
        const existingItem = items.find(item => item.product_variant_id === variantId);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > variant.stock_quantity) {
            toast({
              title: "Insufficient stock",
              description: `Only ${variant.stock_quantity} items available.`,
              variant: "destructive",
            });
            return false;
          }
          
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existingItem.id);
          
          if (error) throw error;
        } else {
          if (quantity > variant.stock_quantity) {
            toast({
              title: "Insufficient stock",
              description: `Only ${variant.stock_quantity} items available.`,
              variant: "destructive",
            });
            return false;
          }
          
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_variant_id: variantId,
              quantity,
            });
          
          if (error) throw error;
        }
      } else {
        // Guest user: use localStorage
        const guestCart = getGuestCart();
        const existingIndex = guestCart.findIndex(item => item.variantId === variantId);
        
        if (existingIndex >= 0) {
          const newQuantity = guestCart[existingIndex].quantity + quantity;
          if (newQuantity > variant.stock_quantity) {
            toast({
              title: "Insufficient stock",
              description: `Only ${variant.stock_quantity} items available.`,
              variant: "destructive",
            });
            return false;
          }
          guestCart[existingIndex].quantity = newQuantity;
        } else {
          if (quantity > variant.stock_quantity) {
            toast({
              title: "Insufficient stock",
              description: `Only ${variant.stock_quantity} items available.`,
              variant: "destructive",
            });
            return false;
          }
          guestCart.push({ variantId, quantity });
        }
        
        setGuestCart(guestCart);
      }

      await fetchCart();
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart.",
      });
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add entire bundle to cart with discounted prices
  // selectedVariants: map of product_id -> variant_id (user-chosen sizes)
  const addBundleToCart = async (bundle: Bundle, selectedVariants?: Record<string, string>): Promise<boolean> => {
    try {
      const { bundlePrice, originalTotal } = calculateBundlePrice(bundle);
      const discountRatio = originalTotal > 0 ? bundlePrice / originalTotal : 1;
      
      // Track which variants get which discounted price
      const bundleDiscountMap: Record<string, number> = {};
      
      // Add each product in the bundle with proportionally discounted price
      for (const bp of bundle.products) {
        if (bp.product && bp.product.variants && bp.product.variants.length > 0) {
          // Use user-selected variant if provided, otherwise fall back to first
          const chosenVariantId = selectedVariants?.[bp.product.id];
          const defaultVariant = chosenVariantId
            ? bp.product.variants.find(v => v.id === chosenVariantId) || bp.product.variants[0]
            : bp.product.variants[0];
          const originalPrice = bp.product.sale_price ?? bp.product.base_price;
          const discountedPrice = Math.round(originalPrice * discountRatio * 100) / 100;
          
          bundleDiscountMap[defaultVariant.id] = discountedPrice;
          
          // Check stock
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', defaultVariant.id)
            .single();
          
          if (variantError) throw variantError;
          
          if (variant.stock_quantity < 1) {
            toast({
              title: "Insufficient stock",
              description: `${bp.product.name} is out of stock.`,
              variant: "destructive",
            });
            return false;
          }
          
          if (user) {
            // Check if already in cart
            const existingItem = items.find(item => item.product_variant_id === defaultVariant.id);
            
            if (existingItem) {
              const newQuantity = existingItem.quantity + 1;
              if (newQuantity > variant.stock_quantity) {
                toast({
                  title: "Insufficient stock",
                  description: `Only ${variant.stock_quantity} of ${bp.product.name} available.`,
                  variant: "destructive",
                });
                return false;
              }
              
              const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id);
              
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('cart_items')
                .insert({
                  user_id: user.id,
                  product_variant_id: defaultVariant.id,
                  quantity: 1,
                });
              
              if (error) throw error;
            }
          } else {
            // Guest cart
            const guestCart = getGuestCart();
            const existingIndex = guestCart.findIndex(item => item.variantId === defaultVariant.id);
            
            if (existingIndex >= 0) {
              const newQuantity = guestCart[existingIndex].quantity + 1;
              if (newQuantity > variant.stock_quantity) {
                toast({
                  title: "Insufficient stock",
                  description: `Only ${variant.stock_quantity} of ${bp.product.name} available.`,
                  variant: "destructive",
                });
                return false;
              }
              guestCart[existingIndex].quantity = newQuantity;
            } else {
              guestCart.push({ variantId: defaultVariant.id, quantity: 1 });
            }
            
            setGuestCart(guestCart);
          }
        }
      }

      await fetchCart();
      
      // After fetching, apply bundle discount prices to the items we just added
      setItems(prev => prev.map(item => {
        if (bundleDiscountMap[item.product_variant_id] !== undefined) {
          return {
            ...item,
            product: {
              ...item.product,
              bundle_discount_price: bundleDiscountMap[item.product_variant_id],
            },
          };
        }
        return item;
      }));
      
      setIsOpen(true);
      return true;
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add bundle to cart.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        // Logged-in user: delete from database
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        // Guest user: remove from localStorage
        const variantId = itemId.replace('guest-', '');
        const guestCart = getGuestCart().filter(item => item.variantId !== variantId);
        setGuestCart(guestCart);
      }
      
      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    if (quantity > item.variant.stock_quantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${item.variant.stock_quantity} items available.`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (user && !itemId.startsWith('guest-')) {
        // Logged-in user: update in database
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        // Guest user: update in localStorage
        const variantId = itemId.replace('guest-', '');
        const guestCart = getGuestCart();
        const index = guestCart.findIndex(item => item.variantId === variantId);
        if (index >= 0) {
          guestCart[index].quantity = quantity;
          setGuestCart(guestCart);
        }
      }
      
      setItems(items.map(i => i.id === itemId ? { ...i, quantity } : i));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      // Always clear guest cart too
      clearGuestCart();
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
    // Use bundle discount price if available, otherwise use sale/base price
    const price = item.product.bundle_discount_price ?? item.product.sale_price ?? item.product.base_price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        isOpen,
        setIsOpen,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
