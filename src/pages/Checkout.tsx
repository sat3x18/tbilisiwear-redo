import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Truck, MapPin, ChevronRight, ChevronLeft, Lock, ShoppingBag, Landmark, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import type { Json } from '@/integrations/supabase/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { formatPrice, getCurrencySymbol } from '@/lib/formatPrice';

type Step = 'information' | 'shipping' | 'payment' | 'confirmation';
type CheckoutStep = 'information' | 'shipping' | 'payment';

interface Address {
  id: string;
  full_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Shipping', description: '8-12 business days', price: 0, minOrder: 500 },
  
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading } = useStoreSettings();
  const [step, setStep] = useState<Step>('information');
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  // Form state for new address
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    email: user?.email || '',
    phone: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Georgia',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment method - bank transfer only for now
  const paymentMethod = 'bank_transfer';
  const [selectedBank, setSelectedBank] = useState<'tbc' | 'bog'>('tbc');

  // Bank transfer details
  const BANK_DETAILS = {
    tbc: {
      name: 'TBC Bank',
      iban: 'GE30TB7843045061100097',
    },
    bog: {
      name: 'Bank of Georgia',
      iban: 'GE33BG0000000183812500',
    },
  };

  useEffect(() => {
    // Wait for settings to load before making guest checkout decision
    if (settingsLoading) return;

    if (items.length === 0 && step !== 'confirmation') {
      navigate('/cart');
      return;
    }

    // Fetch saved addresses only for logged-in users
    async function fetchAddresses() {
      if (!user) return;
      
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (data) {
        setSavedAddresses(data);
        const defaultAddress = data.find(a => a.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    }

    fetchAddresses();
  }, [user, navigate, items.length, step, settingsLoading]);

  const selectedShipping = SHIPPING_OPTIONS.find(o => o.id === shippingMethod) || SHIPPING_OPTIONS[0];
  const shippingCost = subtotal >= selectedShipping.minOrder ? 0 : selectedShipping.price;
  const total = subtotal - discount + shippingCost;

  const formatPriceWithCurrency = (price: number) => {
    return formatPrice(price, settings.currency);
  };

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'information', label: 'Information', icon: <MapPin className="h-4 w-4" /> },
    { id: 'shipping', label: 'Shipping', icon: <Truck className="h-4 w-4" /> },
    { id: 'payment', label: 'Payment', icon: <Landmark className="h-4 w-4" /> },
  ];

  // State to track validated coupon for order submission
  const [validatedCouponId, setValidatedCouponId] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in to use coupon codes.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use server-side validation function for security
      const { data, error } = await supabase
        .rpc('validate_and_apply_coupon', {
          p_code: couponCode,
          p_user_id: user.id,
          p_order_amount: subtotal,
        });

      if (error) {
        console.error('Error validating coupon:', error);
        toast({
          title: "Error",
          description: "Failed to validate coupon. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // The function returns an array with one row
      const result = data?.[0];
      
      if (result?.error_message) {
        toast({
          title: "Coupon invalid",
          description: result.error_message,
          variant: "destructive",
        });
        setDiscount(0);
        setValidatedCouponId(null);
        return;
      }

      if (result?.discount_amount) {
        setDiscount(Number(result.discount_amount));
        setValidatedCouponId(result.coupon_id);
        toast({
          title: "Coupon applied",
          description: `You saved ${formatPrice(Number(result.discount_amount))}!`,
        });
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitOrder = async () => {
    // For guest checkout, user might be null
    if (!user && !settings.guest_checkout) return;

    setLoading(true);

    try {
      // Get selected address
      const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress && !addressForm.street_address) {
        toast({
          title: "Address required",
          description: "Please provide a shipping address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate phone is always required
      const checkPhone = addressForm.phone || selectedAddress?.phone;
      if (!checkPhone) {
        toast({
          title: "Phone required",
          description: "Please provide a phone number.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const shippingAddress = selectedAddress || {
        full_name: addressForm.full_name,
        street_address: addressForm.street_address,
        apartment: addressForm.apartment,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        phone: addressForm.phone,
        email: addressForm.email,
      };

      // Generate order number
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const generatedOrderNumber = `TW-${dateStr}-${randomSuffix}`;

      // Create order with server-validated coupon_id
      // Bank transfer only - order starts as pending
      const orderPaymentStatus = 'pending';
      const orderPaymentMethod = `bank_transfer_${selectedBank}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: generatedOrderNumber,
          status: 'pending',
          payment_status: orderPaymentStatus,
          payment_method: orderPaymentMethod,
          shipping_address: shippingAddress as Json,
          subtotal,
          shipping_cost: shippingCost,
          discount_amount: discount,
          coupon_id: validatedCouponId, // Use server-validated coupon ID
          tax: 0,
          total,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.image_url,
        size: item.variant.size,
        color: item.variant.color,
        quantity: item.quantity,
        unit_price: item.product.sale_price ?? item.product.base_price,
        total_price: (item.product.sale_price ?? item.product.base_price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Record coupon usage if a coupon was applied
      if (validatedCouponId && discount > 0) {
        await supabase
          .from('coupon_usage')
          .insert({
            coupon_id: validatedCouponId,
            user_id: user.id,
            order_id: order.id,
            discount_amount: discount,
          });

        // Increment coupon usage count
        await supabase.rpc('increment_coupon_usage', { p_coupon_id: validatedCouponId });
      }

      // Add initial status to history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          note: 'Order placed - awaiting bank transfer payment',
        });

      // Store order total before clearing cart
      setOrderTotal(total);

      // Save phone to user profile if provided
      const orderPhone = (shippingAddress as any).phone;
      if (orderPhone && user) {
        supabase
          .from('profiles')
          .update({ phone: orderPhone })
          .eq('id', user.id)
          .then(() => {});
      }

      // Send order notification email to admin (fire and forget)
      supabase.functions.invoke("send-new-order-email", {
        body: {
          orderNumber: generatedOrderNumber,
          orderTotal: total,
          currency: settings.currency || "GEL",
          customerName: (shippingAddress as any).full_name || "Customer",
          shippingAddress,
          itemCount: items.length,
        },
      }).catch(err => console.error("Order notification email failed:", err));
      
      // Clear cart
      await clearCart();

      setOrderId(order.id);
      setOrderNumber(generatedOrderNumber);
      setStep('confirmation');

      toast({
        title: "Order placed",
        description: `Order ${generatedOrderNumber} has been confirmed.`,
      });
    } catch (err) {
      console.error('Error creating order:', err);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // If user is not logged in, show login prompt
    if (!user) {
      return (
        <div className="text-center py-12 space-y-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-medium mb-2">Sign in to Complete Your Order</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please sign in or create an account to complete your purchase. Your cart items will be saved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth?redirect=/checkout">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth?redirect=/checkout&mode=signup">Create Account</Link>
            </Button>
          </div>
        </div>
      );
    }

    switch (step) {
      case 'information':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">Contact Information</h2>
              <div className="space-y-1">
                <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={addressForm.email}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  className={formErrors.email ? 'border-destructive' : ''}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <div>
                <h2 className="text-xl font-medium mb-4">Saved Addresses</h2>
                <RadioGroup value={selectedAddressId || ''} onValueChange={(val) => {
                  setSelectedAddressId(val);
                  // Clear form errors when selecting a saved address
                  setFormErrors({});
                }}>
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                        selectedAddressId === address.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setFormErrors({});
                      }}
                    >
                      <RadioGroupItem value={address.id} id={address.id} />
                      <div className="flex-1">
                        <p className="font-medium">{address.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.street_address}
                          {address.apartment && `, ${address.apartment}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.postal_code}
                        </p>
                        {address.is_default && (
                          <span className="text-xs text-primary">Default</span>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div>
              <h2 className="text-xl font-medium mb-4">
                {savedAddresses.length > 0 ? 'Or Add New Address' : 'Shipping Address'}
              </h2>
              <div className="grid gap-4">
                <div>
                  <Input
                    placeholder="Full name *"
                    value={addressForm.full_name}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, full_name: e.target.value });
                      if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: '' });
                    }}
                    className={formErrors.full_name ? 'border-destructive' : ''}
                  />
                  {formErrors.full_name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Phone number (9 digits) *"
                    value={addressForm.phone}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    className={formErrors.phone ? 'border-destructive' : ''}
                    required
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Street address *"
                    value={addressForm.street_address}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, street_address: e.target.value });
                      if (formErrors.street_address) setFormErrors({ ...formErrors, street_address: '' });
                    }}
                    className={formErrors.street_address ? 'border-destructive' : ''}
                  />
                  {formErrors.street_address && (
                    <p className="text-sm text-destructive mt-1">{formErrors.street_address}</p>
                  )}
                </div>
                <Input
                  placeholder="Apartment, suite, etc. (optional)"
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="City *"
                      value={addressForm.city}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, city: e.target.value });
                        if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                      }}
                      className={formErrors.city ? 'border-destructive' : ''}
                    />
                    {formErrors.city && (
                      <p className="text-sm text-destructive mt-1">{formErrors.city}</p>
                    )}
                  </div>
                  <Input
                    placeholder="Postal code (optional)"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Country *"
                    value={addressForm.country}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, country: e.target.value });
                      if (formErrors.country) setFormErrors({ ...formErrors, country: '' });
                    }}
                    className={formErrors.country ? 'border-destructive' : ''}
                  />
                  {formErrors.country && (
                    <p className="text-sm text-destructive mt-1">{formErrors.country}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Shipping Method</h2>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
              {SHIPPING_OPTIONS.map((option) => {
                const isFree = subtotal >= option.minOrder;
                return (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${
                      shippingMethod === option.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setShippingMethod(option.id)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {option.price === 0 || isFree ? (
                        <span className="text-primary font-medium">Free</span>
                      ) : (
                        <span>{formatPriceWithCurrency(option.price)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Payment Method</h2>
            
            <div className="p-4 border border-primary bg-primary/5 rounded-lg">
              <p className="font-medium">Bank Transfer (IBAN)</p>
              <p className="text-sm text-muted-foreground">Pay via TBC Bank or Bank of Georgia</p>
            </div>

            {/* Bank Transfer Details */}
            <div className="space-y-4 mt-6">
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">
                  <TriangleAlert aria-hidden="true" className="inline-block h-4 w-4 mr-2 align-text-bottom" />
                  Important: Include Order Number in Payment Purpose
                </p>
                <p className="text-sm text-muted-foreground">
                  When making the transfer, please include your order number in the "დანიშნულება" (payment purpose) field so we can identify your payment.
                </p>
              </div>

              <div>
                <Label className="mb-3 block">Select Your Bank</Label>
                <RadioGroup 
                  value={selectedBank} 
                  onValueChange={(val) => setSelectedBank(val as 'tbc' | 'bog')}
                  className="space-y-3"
                >
                  <div
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedBank === 'tbc' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedBank('tbc')}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <RadioGroupItem value="tbc" id="bank-tbc" />
                      <span className="font-medium">{BANK_DETAILS.tbc.name}</span>
                    </div>
                    <div className="ml-7 bg-muted/50 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">IBAN</p>
                        <p className="font-mono text-sm select-all">{BANK_DETAILS.tbc.iban}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedBank === 'bog' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedBank('bog')}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <RadioGroupItem value="bog" id="bank-bog" />
                      <span className="font-medium">{BANK_DETAILS.bog.name}</span>
                    </div>
                    <div className="ml-7 bg-muted/50 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">IBAN</p>
                        <p className="font-mono text-sm select-all">{BANK_DETAILS.bog.iban}</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <h2 className="text-3xl font-medium mb-2">Order confirmed</h2>
            <p className="text-base text-muted-foreground mb-6">Your order number is below</p>
            <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto mb-8">
              <p className="text-sm text-muted-foreground mb-2">Order Number</p>
              <p className="text-2xl font-mono font-medium">{orderNumber}</p>
            </div>
            
            {/* Bank Transfer Instructions */}
            {paymentMethod === 'bank_transfer' && (
              <div className="bg-muted border border-border rounded-lg p-6 max-w-lg mx-auto mb-8 text-left">
                <h3 className="font-medium mb-4 text-center">Complete Your Payment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please transfer <strong className="text-foreground">{formatPriceWithCurrency(orderTotal)}</strong> to the following account:
                </p>
                <div className="bg-background rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">{BANK_DETAILS[selectedBank].name}</p>
                  <p className="font-mono text-sm select-all">{BANK_DETAILS[selectedBank].iban}</p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive mb-1">
                    <TriangleAlert aria-hidden="true" className="inline-block h-4 w-4 mr-2 align-text-bottom" />
                    Important: Include Order Number in Payment Purpose
                  </p>
                  <p className="text-sm text-muted-foreground">
                    In the "დანიშნულება" (payment purpose) field, write: <strong className="font-mono text-foreground">{orderNumber}</strong>
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground mb-8">
              {paymentMethod === 'bank_transfer' 
                ? "Your order will be processed once we receive your payment."
                : "We've sent a confirmation email with your order details."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/account/orders')}>View Order</Button>
              <Button variant="outline" onClick={() => navigate('/shop')}>Continue Shopping</Button>
            </div>
          </div>
        );
    }
  };

  if (step === 'confirmation') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {renderStepContent()}
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
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm ${
                    step === s.id
                      ? 'bg-primary text-primary-foreground'
                      : steps.findIndex(st => st.id === step) > index
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 mx-1 sm:mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (step === 'information') navigate('/cart');
                    else if (step === 'shipping') setStep('information');
                    else if (step === 'payment') setStep('shipping');
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {step === 'payment' ? (
                  <Button onClick={handleSubmitOrder} disabled={loading}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (step === 'information') {
                        const errors: Record<string, string> = {};
                        
                        // Validate email
                        if (!addressForm.email) {
                          errors.email = 'Email is required';
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email)) {
                          errors.email = 'Please enter a valid email address';
                        }
                        
                        // Check if using saved address or new address
                        const usingSavedAddress = selectedAddressId && savedAddresses.find(a => a.id === selectedAddressId);
                        
                        if (!usingSavedAddress) {
                          // Validate new address fields
                          if (!addressForm.full_name.trim()) {
                            errors.full_name = 'Full name is required';
                          }
                          
                          if (!addressForm.street_address.trim()) {
                            errors.street_address = 'Street address is required';
                          }
                          
                          if (!addressForm.city.trim()) {
                            errors.city = 'City is required';
                          }
                          
                          if (!addressForm.country.trim()) {
                            errors.country = 'Country is required';
                          }
                          
                          // Validate phone (9 digits) - always required
                          const phoneDigits = addressForm.phone.replace(/\D/g, '');
                          if (!phoneDigits) {
                            errors.phone = 'Phone number is required';
                          } else if (phoneDigits.length !== 9) {
                            errors.phone = 'Phone number must be 9 digits';
                          }
                        } else {
                          // Always validate phone even on saved address
                          const savedAddr = savedAddresses.find(a => a.id === selectedAddressId);
                          if (!savedAddr?.phone) {
                            errors.phone = 'Selected address is missing a phone number. Please add a new address with phone.';
                          } else {
                            const savedPhoneDigits = savedAddr.phone.replace(/\D/g, '');
                            if (savedPhoneDigits.length !== 9) {
                              errors.phone = 'Saved address phone must be 9 digits. Please add a new address.';
                            }
                          }
                        }
                        
                        setFormErrors(errors);
                        
                        if (Object.keys(errors).length > 0) {
                          const firstError = Object.values(errors)[0];
                          toast({
                            title: "Please fix the errors",
                            description: firstError,
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        setStep('shipping');
                      } else if (step === 'shipping') {
                        setStep('payment');
                      }
                    }}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-muted/30 rounded-xl p-6 sticky top-24">
                <h2 className="text-2xl mb-6">Order Summary</h2>

                <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.variant.size} / {item.variant.color}
                        </p>
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">
                        {formatPriceWithCurrency((item.product.sale_price ?? item.product.base_price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                {step !== ('confirmation' as Step) && (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPriceWithCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-{formatPriceWithCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : formatPriceWithCurrency(shippingCost)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{formatPriceWithCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
