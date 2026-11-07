-- Create flash_sales table for managing flash sale campaigns
CREATE TABLE public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Flash Sale',
  description text,
  is_active boolean NOT NULL DEFAULT false,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone NOT NULL,
  discount_percentage integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create flash_sale_products junction table
CREATE TABLE public.flash_sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id uuid NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(flash_sale_id, product_id)
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for flash_sales
CREATE POLICY "Anyone can view active flash sales"
ON public.flash_sales FOR SELECT
USING (is_active = true AND start_time <= now() AND end_time > now());

CREATE POLICY "Admins can manage flash sales"
ON public.flash_sales FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for flash_sale_products
CREATE POLICY "Anyone can view flash sale products"
ON public.flash_sale_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.flash_sales fs 
    WHERE fs.id = flash_sale_id 
    AND fs.is_active = true 
    AND fs.start_time <= now() 
    AND fs.end_time > now()
  )
);

CREATE POLICY "Admins can manage flash sale products"
ON public.flash_sale_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_flash_sales_updated_at
BEFORE UPDATE ON public.flash_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();