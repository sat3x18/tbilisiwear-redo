-- Create bundles table
CREATE TABLE public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'percentage' CHECK (pricing_type IN ('fixed', 'percentage')),
  discount_value NUMERIC NOT NULL DEFAULT 10,
  fixed_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_on_homepage BOOLEAN NOT NULL DEFAULT false,
  show_on_bundles_page BOOLEAN NOT NULL DEFAULT true,
  show_on_product_pages BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_products junction table
CREATE TABLE public.bundle_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, product_id)
);

-- Enable RLS on bundles
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- RLS policies for bundles
CREATE POLICY "Anyone can view active bundles"
ON public.bundles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage bundles"
ON public.bundles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on bundle_products
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for bundle_products
CREATE POLICY "Anyone can view bundle products"
ON public.bundle_products
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bundles b
  WHERE b.id = bundle_products.bundle_id
  AND b.is_active = true
));

CREATE POLICY "Admins can manage bundle products"
ON public.bundle_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for bundles
CREATE TRIGGER update_bundles_updated_at
BEFORE UPDATE ON public.bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();