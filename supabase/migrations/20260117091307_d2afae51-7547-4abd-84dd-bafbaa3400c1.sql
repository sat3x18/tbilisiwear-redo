-- Create store_settings table for persistent configuration
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for store name display)
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage store settings"
  ON public.store_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'TBILISI WEAR'),
  ('store_email', 'info@tbilisiwear.com'),
  ('store_phone', '+995 555 123 456'),
  ('store_address', '12 Rustaveli Avenue, Tbilisi, Georgia'),
  ('currency', 'EUR'),
  ('tax_rate', '20'),
  ('free_shipping_threshold', '150'),
  ('standard_shipping_cost', '10'),
  ('express_shipping_cost', '25'),
  ('order_notifications', 'true'),
  ('low_stock_notifications', 'true'),
  ('low_stock_threshold', '5'),
  ('customer_notifications', 'true'),
  ('guest_checkout', 'true'),
  ('require_phone', 'false');