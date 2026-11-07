import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from './useProducts';

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_type: 'fixed' | 'percentage';
  discount_value: number;
  fixed_price: number | null;
  is_active: boolean;
  show_on_homepage: boolean;
  show_on_bundles_page: boolean;
  show_on_product_pages: boolean;
  created_at: string;
  updated_at: string;
  products: BundleProduct[];
}

export interface BundleProduct {
  id: string;
  product_id: string;
  display_order: number;
  product: Product | null;
}

interface UseBundlesOptions {
  showOnHomepage?: boolean;
  showOnBundlesPage?: boolean;
  showOnProductPages?: boolean;
  productId?: string;
  limit?: number;
}

export function useBundles(options: UseBundlesOptions = {}) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('bundles')
        .select(`
          id, name, slug, description, pricing_type, discount_value, fixed_price,
          is_active, show_on_homepage, show_on_bundles_page, show_on_product_pages,
          created_at, updated_at,
          bundle_products (
            id, product_id, display_order
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options.showOnHomepage) {
        query = query.eq('show_on_homepage', true);
      }

      if (options.showOnBundlesPage) {
        query = query.eq('show_on_bundles_page', true);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: bundlesData, error: bundlesError } = await query;

      if (bundlesError) throw bundlesError;

      if (!bundlesData || bundlesData.length === 0) {
        setBundles([]);
        return;
      }

      // Get all unique product IDs from bundles
      const productIds = new Set<string>();
      bundlesData.forEach((bundle: any) => {
        bundle.bundle_products?.forEach((bp: any) => {
          productIds.add(bp.product_id);
        });
      });

      // Fetch all products at once
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, slug, description, materials, care_instructions,
          base_price, sale_price, is_featured, is_new_arrival, gender,
          brands!left (id, name, slug),
          categories!left (id, name, slug),
          product_images (id, image_url, alt_text, is_primary, display_order),
          product_variants (id, size, color, color_hex, sku, stock_quantity)
        `)
        .in('id', Array.from(productIds))
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Create a map of products by ID
      const productsMap = new Map<string, Product>();
      (productsData || []).forEach((p: any) => {
        productsMap.set(p.id, {
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
          gender: p.gender as 'men' | 'women' | 'both',
          brand: p.brands,
          category: p.categories,
          images: (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
          variants: p.product_variants || [],
        });
      });

      // Format bundles with products
      let formattedBundles: Bundle[] = bundlesData.map((bundle: any) => ({
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        pricing_type: bundle.pricing_type,
        discount_value: bundle.discount_value,
        fixed_price: bundle.fixed_price,
        is_active: bundle.is_active,
        show_on_homepage: bundle.show_on_homepage,
        show_on_bundles_page: bundle.show_on_bundles_page,
        show_on_product_pages: bundle.show_on_product_pages,
        created_at: bundle.created_at,
        updated_at: bundle.updated_at,
        products: (bundle.bundle_products || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((bp: any) => ({
            id: bp.id,
            product_id: bp.product_id,
            display_order: bp.display_order,
            product: productsMap.get(bp.product_id) || null,
          })),
      }));

      // Filter by product ID if specified (for product pages)
      if (options.productId) {
        formattedBundles = formattedBundles.filter(bundle =>
          bundle.products.some(bp => bp.product_id === options.productId)
        );
      }

      // Filter to only show product page bundles if the option is set
      if (options.showOnProductPages) {
        formattedBundles = formattedBundles.filter(bundle => bundle.show_on_product_pages);
      }

      setBundles(formattedBundles);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError('Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  }, [options.showOnHomepage, options.showOnBundlesPage, options.showOnProductPages, options.productId, options.limit]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  return { bundles, loading, error, refetch: fetchBundles };
}

export function useBundle(slug: string) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBundle() {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const { data: bundleData, error: bundleError } = await supabase
          .from('bundles')
          .select(`
            id, name, slug, description, pricing_type, discount_value, fixed_price,
            is_active, show_on_homepage, show_on_bundles_page, show_on_product_pages,
            created_at, updated_at,
            bundle_products (
              id, product_id, display_order
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (bundleError) throw bundleError;

        if (!bundleData) {
          setBundle(null);
          return;
        }

        // Get product IDs
        const productIds = bundleData.bundle_products?.map((bp: any) => bp.product_id) || [];

        if (productIds.length === 0) {
          setBundle({
            ...bundleData,
            pricing_type: bundleData.pricing_type as 'fixed' | 'percentage',
            products: [],
          });
          return;
        }

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, materials, care_instructions,
            base_price, sale_price, is_featured, is_new_arrival, gender,
            brands!left (id, name, slug),
            categories!left (id, name, slug),
            product_images (id, image_url, alt_text, is_primary, display_order),
            product_variants (id, size, color, color_hex, sku, stock_quantity)
          `)
          .in('id', productIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        const productsMap = new Map<string, Product>();
        (productsData || []).forEach((p: any) => {
          productsMap.set(p.id, {
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
            gender: p.gender as 'men' | 'women' | 'both',
            brand: p.brands,
            category: p.categories,
            images: (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
            variants: p.product_variants || [],
          });
        });

        setBundle({
          id: bundleData.id,
          name: bundleData.name,
          slug: bundleData.slug,
          description: bundleData.description,
          pricing_type: bundleData.pricing_type as 'fixed' | 'percentage',
          discount_value: bundleData.discount_value,
          fixed_price: bundleData.fixed_price,
          is_active: bundleData.is_active,
          show_on_homepage: bundleData.show_on_homepage,
          show_on_bundles_page: bundleData.show_on_bundles_page,
          show_on_product_pages: bundleData.show_on_product_pages,
          created_at: bundleData.created_at,
          updated_at: bundleData.updated_at,
          products: (bundleData.bundle_products || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((bp: any) => ({
              id: bp.id,
              product_id: bp.product_id,
              display_order: bp.display_order,
              product: productsMap.get(bp.product_id) || null,
            })),
        });
      } catch (err) {
        console.error('Error fetching bundle:', err);
        setError('Failed to fetch bundle');
      } finally {
        setLoading(false);
      }
    }

    fetchBundle();
  }, [slug]);

  return { bundle, loading, error };
}

// Admin hooks for managing bundles
export function useAdminBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('bundles')
        .select(`
          id, name, slug, description, pricing_type, discount_value, fixed_price,
          is_active, show_on_homepage, show_on_bundles_page, show_on_product_pages,
          created_at, updated_at,
          bundle_products (
            id, product_id, display_order
          )
        `)
        .order('created_at', { ascending: false });

      if (bundlesError) throw bundlesError;

      const formattedBundles: Bundle[] = (bundlesData || []).map((bundle: any) => ({
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        pricing_type: bundle.pricing_type,
        discount_value: bundle.discount_value,
        fixed_price: bundle.fixed_price,
        is_active: bundle.is_active,
        show_on_homepage: bundle.show_on_homepage,
        show_on_bundles_page: bundle.show_on_bundles_page,
        show_on_product_pages: bundle.show_on_product_pages,
        created_at: bundle.created_at,
        updated_at: bundle.updated_at,
        products: (bundle.bundle_products || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((bp: any) => ({
            id: bp.id,
            product_id: bp.product_id,
            display_order: bp.display_order,
            product: null,
          })),
      }));

      setBundles(formattedBundles);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError('Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const deleteBundle = async (id: string) => {
    const { error } = await supabase.from('bundles').delete().eq('id', id);
    if (error) throw error;
    await fetchBundles();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('bundles')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) throw error;
    await fetchBundles();
  };

  return { bundles, loading, error, refetch: fetchBundles, deleteBundle, toggleActive };
}

// Calculate bundle pricing
export function calculateBundlePrice(bundle: Bundle): { originalTotal: number; bundlePrice: number; savings: number } {
  const originalTotal = bundle.products.reduce((sum, bp) => {
    if (!bp.product) return sum;
    const price = bp.product.sale_price ?? bp.product.base_price;
    return sum + price;
  }, 0);

  let bundlePrice: number;
  if (bundle.pricing_type === 'fixed' && bundle.fixed_price !== null) {
    bundlePrice = bundle.fixed_price;
  } else {
    bundlePrice = originalTotal * (1 - bundle.discount_value / 100);
  }

  const savings = originalTotal - bundlePrice;

  return { originalTotal, bundlePrice, savings };
}
