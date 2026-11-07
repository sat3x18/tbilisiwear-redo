import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  materials: string | null;
  care_instructions: string | null;
  base_price: number;
  sale_price: number | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  gender: 'men' | 'women' | 'both';
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    display_order: number;
  }[];
  variants: {
    id: string;
    size: string;
    color: string;
    color_hex: string | null;
    sku: string | null;
    stock_quantity: number;
  }[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface UseProductsOptions {
  brandSlug?: string;
  categorySlug?: string;
  featured?: boolean;
  newArrivals?: boolean;
  onSale?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name';
  limit?: number;
  gender?: 'men' | 'women';
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, description, materials, care_instructions,
          base_price, sale_price, is_featured, is_new_arrival, gender,
          brands!left (id, name, slug),
          categories!left (id, name, slug),
          product_images (id, image_url, alt_text, is_primary, display_order),
          product_variants (id, size, color, color_hex, sku, stock_quantity)
        `)
        .eq('is_active', true);

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.newArrivals) {
        query = query.eq('is_new_arrival', true);
      }

      if (options.onSale) {
        query = query.not('sale_price', 'is', null);
      }

      if (options.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      // Sort
      switch (options.sortBy) {
        case 'price-asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform the data
      let formattedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        materials: p.materials,
        care_instructions: p.care_instructions,
        base_price: p.base_price,
        sale_price: p.sale_price,
        is_featured: p.is_featured,
        is_new_arrival: p.is_new_arrival,
        gender: p.gender,
        brand: p.brands,
        category: p.categories,
        images: (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
        variants: p.product_variants || [],
      }));

      // Filter by brand or category after fetch (since we're using left join)
      if (options.brandSlug) {
        formattedProducts = formattedProducts.filter(p => p.brand?.slug === options.brandSlug);
      }

      if (options.categorySlug) {
        formattedProducts = formattedProducts.filter(p => p.category?.slug === options.categorySlug);
      }

      // Filter by gender (men/women pages)
      if (options.gender) {
        formattedProducts = formattedProducts.filter(p => 
          p.gender === options.gender || p.gender === 'both'
        );
      }

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [options.brandSlug, options.categorySlug, options.featured, options.newArrivals, options.onSale, options.search, options.sortBy, options.limit, options.gender]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, materials, care_instructions,
            base_price, sale_price, is_featured, is_new_arrival, gender,
            brands!left (id, name, slug),
            categories!left (id, name, slug),
            product_images (id, image_url, alt_text, is_primary, display_order),
            product_variants (id, size, color, color_hex, sku, stock_quantity)
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setProduct({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            materials: data.materials,
            care_instructions: data.care_instructions,
            base_price: data.base_price,
            sale_price: data.sale_price,
            is_featured: data.is_featured,
            is_new_arrival: data.is_new_arrival,
            gender: data.gender as 'men' | 'women' | 'both',
            brand: data.brands,
            category: data.categories,
            images: (data.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
            variants: data.product_variants || [],
          });
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to fetch product');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  return { product, loading, error };
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, description')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setBrands(data);
      }
      setLoading(false);
    }

    fetchBrands();
  }, []);

  return { brands, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return { categories, loading };
}
