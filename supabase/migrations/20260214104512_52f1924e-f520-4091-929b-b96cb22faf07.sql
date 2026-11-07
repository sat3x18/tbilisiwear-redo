
-- Allow team members to view all orders (they need this for order management)
CREATE POLICY "Team members can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_team_members
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
    AND (permissions->>'orders' = 'true' OR permissions->>'full_access' = 'true')
  )
);

-- Allow team members to update orders (status changes)
CREATE POLICY "Team members can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_team_members
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
    AND (permissions->>'orders' = 'true' OR permissions->>'full_access' = 'true')
  )
);

-- Allow team members to view order items
CREATE POLICY "Team members can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_team_members
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
    AND (permissions->>'orders' = 'true' OR permissions->>'full_access' = 'true')
  )
);

-- Allow team members to view order status history
CREATE POLICY "Team members can view all order status history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_team_members
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
    AND (permissions->>'orders' = 'true' OR permissions->>'full_access' = 'true')
  )
);

-- Allow team members to insert order status history
CREATE POLICY "Team members can insert order status history"
ON public.order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_team_members
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
    AND (permissions->>'orders' = 'true' OR permissions->>'full_access' = 'true')
  )
);
