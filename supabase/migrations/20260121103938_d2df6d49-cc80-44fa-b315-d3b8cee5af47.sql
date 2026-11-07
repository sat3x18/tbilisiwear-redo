-- Fix 1: Create server-side coupon validation function
-- This function validates coupons atomically and returns the calculated discount
CREATE OR REPLACE FUNCTION public.validate_and_apply_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_order_amount NUMERIC
)
RETURNS TABLE(
  discount_amount NUMERIC,
  coupon_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage_count INTEGER;
  v_discount NUMERIC;
  v_is_vip BOOLEAN;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true;

  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;

  -- Check if coupon has expired
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'This coupon has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if coupon is valid yet
  IF v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'This coupon is not yet valid'::TEXT;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 
      format('Minimum order of %s required', v_coupon.min_order_amount)::TEXT;
    RETURN;
  END IF;

  -- Check global usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'This coupon has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- Check per-user limit
  IF v_coupon.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM coupon_usage
    WHERE coupon_id = v_coupon.id
      AND user_id = p_user_id;

    IF v_user_usage_count >= v_coupon.per_user_limit THEN
      RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'You have already used this coupon the maximum number of times'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check VIP-only restriction
  IF v_coupon.is_vip_only THEN
    -- Check if user has admin role (VIP)
    SELECT has_role(p_user_id, 'admin') INTO v_is_vip;
    IF NOT v_is_vip THEN
      RETURN QUERY SELECT NULL::NUMERIC, NULL::UUID, 'This coupon is only available for VIP members'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Calculate discount amount
  IF v_coupon.type = 'percentage' THEN
    v_discount := (p_order_amount * v_coupon.value) / 100;
    -- Apply max discount cap if set
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  ELSE
    -- Fixed amount discount
    v_discount := v_coupon.value;
    -- Don't allow discount to exceed order amount
    IF v_discount > p_order_amount THEN
      v_discount := p_order_amount;
    END IF;
  END IF;

  -- Return the validated discount
  RETURN QUERY SELECT v_discount, v_coupon.id, NULL::TEXT;
END;
$$;

-- Fix 2: Fix newsletter_subscribers RLS policy to not expose emails
-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can view their own subscription" ON newsletter_subscribers;

-- Create a secure policy that only allows users to see their own subscriptions
CREATE POLICY "Users can view their own subscription" ON newsletter_subscribers
  FOR SELECT USING (auth.uid() = user_id);

-- Fix 3: Fix the permissive INSERT policy on newsletter_subscribers
-- The "Anyone can subscribe to newsletter" policy uses WITH CHECK (true) which is overly permissive
-- We should validate that the email format is reasonable and prevent abuse
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

-- Create a more restrictive policy - still allows anonymous but with some validation
-- The actual email validation should happen in application code
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (
    -- Allow insert only if email is provided (non-empty)
    email IS NOT NULL AND LENGTH(TRIM(email)) > 0
  );