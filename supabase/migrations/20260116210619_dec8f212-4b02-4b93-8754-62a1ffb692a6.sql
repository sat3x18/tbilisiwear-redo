-- =============================================
-- PHASE 1: PRODUCT CATALOG SYSTEM
-- =============================================

-- Create brands table
CREATE TABLE public.brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.categories(id),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    materials TEXT,
    care_instructions TEXT,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    base_price NUMERIC NOT NULL,
    sale_price NUMERIC,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product variants table (size/color combinations)
CREATE TABLE public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    color_hex TEXT,
    sku TEXT UNIQUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, size, color)
);

-- Create product images table
CREATE TABLE public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart items table
CREATE TABLE public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_variant_id)
);

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_vip_only BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    discount_amount NUMERIC NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add tracking number and coupon fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Create order status history table
CREATE TABLE public.order_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PUBLIC READ ACCESS
-- =============================================

-- Brands: Public read, admin write
CREATE POLICY "Anyone can view active brands" ON public.brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage brands" ON public.brands
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories: Public read, admin write
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products: Public read active, admin write
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Product Variants: Public read, admin write
CREATE POLICY "Anyone can view active variants" ON public.product_variants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Product Images: Public read, admin write
CREATE POLICY "Anyone can view product images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product images" ON public.product_images
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cart Items: User can manage their own cart
CREATE POLICY "Users can view their own cart" ON public.cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own cart" ON public.cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON public.cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own cart" ON public.cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Coupons: Public read active, admin write
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupon Usage: User can view their own, admin can view all
CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage coupon usage" ON public.coupon_usage
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Order Status History: User can view their order history, admin can manage
CREATE POLICY "Users can view their order status history" ON public.order_status_history
    FOR SELECT USING (public.is_order_owner(order_id));

CREATE POLICY "Admins can manage order status history" ON public.order_status_history
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy to orders for full management
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);

-- =============================================
-- SEED DATA: BRANDS
-- =============================================

INSERT INTO public.brands (name, slug, description, logo_url) VALUES
('Moncler', 'moncler', 'Italian luxury fashion house, founded in 1952, specializing in outerwear and sportswear.', '/placeholder.svg'),
('Maison Margiela', 'maison-margiela', 'French luxury fashion house founded in Paris in 1988 by Belgian designer Martin Margiela.', '/placeholder.svg'),
('Isabel Marant', 'isabel-marant', 'French fashion designer known for her bohemian-chic style and Parisian elegance.', '/placeholder.svg'),
('Bottega Veneta', 'bottega-veneta', 'Italian luxury fashion house known for leather goods and signature intrecciato weave.', '/placeholder.svg'),
('Acne Studios', 'acne-studios', 'Swedish luxury fashion house known for minimalist Scandinavian design.', '/placeholder.svg');

-- =============================================
-- SEED DATA: CATEGORIES
-- =============================================

INSERT INTO public.categories (name, slug, image_url) VALUES
('Outerwear', 'outerwear', '/placeholder.svg'),
('Knitwear', 'knitwear', '/placeholder.svg'),
('Footwear', 'footwear', '/placeholder.svg'),
('Pants', 'pants', '/placeholder.svg'),
('Dresses', 'dresses', '/placeholder.svg'),
('Accessories', 'accessories', '/placeholder.svg'),
('Tops', 'tops', '/placeholder.svg'),
('Bags', 'bags', '/placeholder.svg');

-- =============================================
-- SEED DATA: PRODUCTS
-- =============================================

-- Get brand and category IDs
DO $$
DECLARE
    moncler_id UUID;
    margiela_id UUID;
    isabel_id UUID;
    bottega_id UUID;
    acne_id UUID;
    outerwear_id UUID;
    knitwear_id UUID;
    footwear_id UUID;
    pants_id UUID;
    accessories_id UUID;
    tops_id UUID;
    bags_id UUID;
    product_id UUID;
BEGIN
    SELECT id INTO moncler_id FROM public.brands WHERE slug = 'moncler';
    SELECT id INTO margiela_id FROM public.brands WHERE slug = 'maison-margiela';
    SELECT id INTO isabel_id FROM public.brands WHERE slug = 'isabel-marant';
    SELECT id INTO bottega_id FROM public.brands WHERE slug = 'bottega-veneta';
    SELECT id INTO acne_id FROM public.brands WHERE slug = 'acne-studios';
    
    SELECT id INTO outerwear_id FROM public.categories WHERE slug = 'outerwear';
    SELECT id INTO knitwear_id FROM public.categories WHERE slug = 'knitwear';
    SELECT id INTO footwear_id FROM public.categories WHERE slug = 'footwear';
    SELECT id INTO pants_id FROM public.categories WHERE slug = 'pants';
    SELECT id INTO accessories_id FROM public.categories WHERE slug = 'accessories';
    SELECT id INTO tops_id FROM public.categories WHERE slug = 'tops';
    SELECT id INTO bags_id FROM public.categories WHERE slug = 'bags';

    -- Product 1: Moncler Maya Down Jacket
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, sale_price, is_featured, is_new_arrival)
    VALUES ('Maya Down Jacket', 'moncler-maya-down-jacket', 'Iconic Moncler down jacket with signature lacquered nylon laqué and down-filled construction. Features stand collar, two-way zip closure, and signature logo patch.', '100% Polyamide, 90% Down 10% Feather filling', 'Professional dry clean only', moncler_id, outerwear_id, 1495, NULL, true, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-1.jpg', 'Moncler Maya Down Jacket Front', 0, true),
    (product_id, '/src/assets/product-1.jpg', 'Moncler Maya Down Jacket Back', 1, false);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'S', 'Black', '#000000', 'MON-MAYA-BLK-S', 5),
    (product_id, 'M', 'Black', '#000000', 'MON-MAYA-BLK-M', 8),
    (product_id, 'L', 'Black', '#000000', 'MON-MAYA-BLK-L', 6),
    (product_id, 'XL', 'Black', '#000000', 'MON-MAYA-BLK-XL', 3),
    (product_id, 'S', 'Navy', '#1a1a2e', 'MON-MAYA-NVY-S', 4),
    (product_id, 'M', 'Navy', '#1a1a2e', 'MON-MAYA-NVY-M', 7),
    (product_id, 'L', 'Navy', '#1a1a2e', 'MON-MAYA-NVY-L', 5);

    -- Product 2: Maison Margiela Tabi Boots
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, sale_price, is_featured)
    VALUES ('Tabi Ankle Boots', 'margiela-tabi-ankle-boots', 'Iconic split-toe Tabi boots in smooth calfskin leather. Features the signature cleft toe design, block heel, and side zip closure.', '100% Calfskin Leather, Leather sole', 'Use leather conditioner, store with shoe trees', margiela_id, footwear_id, 1190, 952, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-2.jpg', 'Margiela Tabi Boots', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, '39', 'Black', '#000000', 'MMM-TABI-BLK-39', 3),
    (product_id, '40', 'Black', '#000000', 'MMM-TABI-BLK-40', 5),
    (product_id, '41', 'Black', '#000000', 'MMM-TABI-BLK-41', 4),
    (product_id, '42', 'Black', '#000000', 'MMM-TABI-BLK-42', 6),
    (product_id, '43', 'Black', '#000000', 'MMM-TABI-BLK-43', 2);

    -- Product 3: Isabel Marant Étoile Sweater
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, is_new_arrival)
    VALUES ('Étoile Mohair Sweater', 'isabel-marant-etoile-mohair-sweater', 'Luxurious oversized mohair-blend sweater with dropped shoulders and ribbed trims. Perfect for effortless Parisian style.', '67% Mohair, 28% Polyamide, 5% Wool', 'Hand wash cold, lay flat to dry', isabel_id, knitwear_id, 590, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-3.jpg', 'Isabel Marant Mohair Sweater', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'XS', 'Cream', '#FFFDD0', 'IM-MOH-CRM-XS', 4),
    (product_id, 'S', 'Cream', '#FFFDD0', 'IM-MOH-CRM-S', 6),
    (product_id, 'M', 'Cream', '#FFFDD0', 'IM-MOH-CRM-M', 5),
    (product_id, 'L', 'Cream', '#FFFDD0', 'IM-MOH-CRM-L', 3),
    (product_id, 'S', 'Burgundy', '#722F37', 'IM-MOH-BRG-S', 4),
    (product_id, 'M', 'Burgundy', '#722F37', 'IM-MOH-BRG-M', 5);

    -- Product 4: Bottega Veneta Cassette Bag
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, is_featured)
    VALUES ('Cassette Crossbody Bag', 'bottega-veneta-cassette-bag', 'Signature Intrecciato woven leather crossbody bag with padded construction. Features adjustable strap and magnetic closure.', '100% Lambskin Leather', 'Store in dust bag, avoid water exposure', bottega_id, bags_id, 2950, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-4.jpg', 'Bottega Veneta Cassette Bag', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'One Size', 'Black', '#000000', 'BV-CASS-BLK-OS', 3),
    (product_id, 'One Size', 'Parakeet', '#59981A', 'BV-CASS-GRN-OS', 2),
    (product_id, 'One Size', 'Thunder', '#4A4A4A', 'BV-CASS-GRY-OS', 4);

    -- Product 5: Acne Studios Oversized Coat
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, sale_price, is_featured)
    VALUES ('Oversized Wool Coat', 'acne-studios-oversized-wool-coat', 'Minimalist oversized double-breasted wool coat. Features notched lapels, side pockets, and back vent.', '70% Wool, 20% Polyamide, 10% Cashmere', 'Professional dry clean only', acne_id, outerwear_id, 1350, 945, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-1.jpg', 'Acne Studios Wool Coat', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'S', 'Camel', '#C19A6B', 'ACNE-COAT-CML-S', 3),
    (product_id, 'M', 'Camel', '#C19A6B', 'ACNE-COAT-CML-M', 5),
    (product_id, 'L', 'Camel', '#C19A6B', 'ACNE-COAT-CML-L', 4),
    (product_id, 'S', 'Black', '#000000', 'ACNE-COAT-BLK-S', 4),
    (product_id, 'M', 'Black', '#000000', 'ACNE-COAT-BLK-M', 6),
    (product_id, 'L', 'Black', '#000000', 'ACNE-COAT-BLK-L', 3);

    -- Product 6: Moncler Polo Shirt
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price)
    VALUES ('Logo Patch Polo Shirt', 'moncler-logo-polo-shirt', 'Classic cotton piqué polo shirt with signature tricolor trim and rooster logo patch. Ribbed collar and cuffs.', '100% Cotton', 'Machine wash cold, tumble dry low', moncler_id, tops_id, 295)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-2.jpg', 'Moncler Polo Shirt', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'S', 'White', '#FFFFFF', 'MON-POLO-WHT-S', 8),
    (product_id, 'M', 'White', '#FFFFFF', 'MON-POLO-WHT-M', 10),
    (product_id, 'L', 'White', '#FFFFFF', 'MON-POLO-WHT-L', 7),
    (product_id, 'S', 'Navy', '#1a1a2e', 'MON-POLO-NVY-S', 6),
    (product_id, 'M', 'Navy', '#1a1a2e', 'MON-POLO-NVY-M', 9),
    (product_id, 'L', 'Navy', '#1a1a2e', 'MON-POLO-NVY-L', 5);

    -- Product 7: Margiela Replica Sneakers
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, is_new_arrival)
    VALUES ('Replica Low-Top Sneakers', 'margiela-replica-sneakers', 'Iconic Replica sneakers inspired by 1970s German army trainers. Features premium leather upper and signature paint splatter sole.', 'Leather upper, Rubber sole', 'Wipe clean with damp cloth', margiela_id, footwear_id, 595, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-3.jpg', 'Margiela Replica Sneakers', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, '40', 'White', '#FFFFFF', 'MMM-REP-WHT-40', 5),
    (product_id, '41', 'White', '#FFFFFF', 'MMM-REP-WHT-41', 7),
    (product_id, '42', 'White', '#FFFFFF', 'MMM-REP-WHT-42', 6),
    (product_id, '43', 'White', '#FFFFFF', 'MMM-REP-WHT-43', 4),
    (product_id, '44', 'White', '#FFFFFF', 'MMM-REP-WHT-44', 3);

    -- Product 8: Isabel Marant Pants
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price)
    VALUES ('Nilma High-Rise Pants', 'isabel-marant-nilma-pants', 'High-waisted tailored pants with a relaxed straight leg. Features front pleats and side pockets.', '53% Polyester, 43% Virgin Wool, 4% Elastane', 'Dry clean only', isabel_id, pants_id, 450)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-4.jpg', 'Isabel Marant Nilma Pants', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, '34', 'Black', '#000000', 'IM-NILMA-BLK-34', 4),
    (product_id, '36', 'Black', '#000000', 'IM-NILMA-BLK-36', 6),
    (product_id, '38', 'Black', '#000000', 'IM-NILMA-BLK-38', 5),
    (product_id, '40', 'Black', '#000000', 'IM-NILMA-BLK-40', 4),
    (product_id, '36', 'Anthracite', '#383838', 'IM-NILMA-ANT-36', 3),
    (product_id, '38', 'Anthracite', '#383838', 'IM-NILMA-ANT-38', 4);

    -- Product 9: Bottega Veneta Sunglasses
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, sale_price)
    VALUES ('Square Acetate Sunglasses', 'bottega-veneta-square-sunglasses', 'Bold square-frame sunglasses in polished acetate. Features tonal gradient lenses and subtle BV temple engraving.', 'Acetate frame, CR-39 lenses', 'Store in protective case, clean with microfiber cloth', bottega_id, accessories_id, 420, 336)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-1.jpg', 'Bottega Veneta Sunglasses', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'One Size', 'Black', '#000000', 'BV-SUN-BLK-OS', 8),
    (product_id, 'One Size', 'Havana', '#8B4513', 'BV-SUN-HAV-OS', 5);

    -- Product 10: Acne Studios Scarf
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, is_new_arrival)
    VALUES ('Oversized Wool Scarf', 'acne-studios-oversized-wool-scarf', 'Luxuriously soft oversized wool scarf with signature face logo patch. Fringe trim at ends.', '100% Wool', 'Dry clean only', acne_id, accessories_id, 280, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-2.jpg', 'Acne Studios Wool Scarf', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'One Size', 'Grey Melange', '#9E9E9E', 'ACNE-SCRF-GRY-OS', 10),
    (product_id, 'One Size', 'Camel', '#C19A6B', 'ACNE-SCRF-CML-OS', 8),
    (product_id, 'One Size', 'Black', '#000000', 'ACNE-SCRF-BLK-OS', 12);

    -- Product 11: Moncler Down Vest
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price, sale_price, is_featured)
    VALUES ('Gui Down Vest', 'moncler-gui-down-vest', 'Lightweight down vest with matte finish. Features snap button closure, stand collar, and zip pockets.', '100% Polyamide, 90% Down 10% Feather filling', 'Professional dry clean only', moncler_id, outerwear_id, 895, 716, true)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-3.jpg', 'Moncler Down Vest', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'S', 'Black', '#000000', 'MON-GUI-BLK-S', 4),
    (product_id, 'M', 'Black', '#000000', 'MON-GUI-BLK-M', 6),
    (product_id, 'L', 'Black', '#000000', 'MON-GUI-BLK-L', 5),
    (product_id, 'M', 'Olive', '#556B2F', 'MON-GUI-OLV-M', 3),
    (product_id, 'L', 'Olive', '#556B2F', 'MON-GUI-OLV-L', 4);

    -- Product 12: Margiela Numbers Tee
    INSERT INTO public.products (name, slug, description, materials, care_instructions, brand_id, category_id, base_price)
    VALUES ('Numbers Logo T-Shirt', 'margiela-numbers-tshirt', 'Classic cotton t-shirt with iconic four-stitch numbers logo at back. Relaxed fit with ribbed crew neck.', '100% Cotton', 'Machine wash cold', margiela_id, tops_id, 295)
    RETURNING id INTO product_id;
    
    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (product_id, '/src/assets/product-4.jpg', 'Margiela Numbers T-Shirt', 0, true);
    
    INSERT INTO public.product_variants (product_id, size, color, color_hex, sku, stock_quantity) VALUES
    (product_id, 'XS', 'White', '#FFFFFF', 'MMM-NUM-WHT-XS', 5),
    (product_id, 'S', 'White', '#FFFFFF', 'MMM-NUM-WHT-S', 8),
    (product_id, 'M', 'White', '#FFFFFF', 'MMM-NUM-WHT-M', 10),
    (product_id, 'L', 'White', '#FFFFFF', 'MMM-NUM-WHT-L', 7),
    (product_id, 'S', 'Black', '#000000', 'MMM-NUM-BLK-S', 6),
    (product_id, 'M', 'Black', '#000000', 'MMM-NUM-BLK-M', 9);

END $$;

-- =============================================
-- SEED DATA: COUPONS
-- =============================================

INSERT INTO public.coupons (code, type, value, min_order_amount, max_discount, usage_limit, per_user_limit, valid_until, description, is_vip_only) VALUES
('WELCOME10', 'percentage', 10, 100, 100, 1000, 1, '2027-12-31 23:59:59+00', 'Welcome discount - 10% off your first order', false),
('LUXURY20', 'percentage', 20, 500, 200, 500, 2, '2027-06-30 23:59:59+00', '20% off orders over $500', false),
('SUMMER50', 'fixed', 50, 300, NULL, 200, 1, '2026-08-31 23:59:59+00', '$50 off summer collection', false),
('VIP25', 'percentage', 25, 0, 500, NULL, NULL, NULL, 'VIP exclusive - 25% off everything', true);

-- =============================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));