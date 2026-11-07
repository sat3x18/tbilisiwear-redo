import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FlashSale {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  start_time: string;
  end_time: string;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

interface FlashSaleProduct {
  id: string;
  flash_sale_id: string;
  product_id: string;
  created_at: string;
}

interface ProductWithDetails {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  brands: { name: string } | null;
  product_images: { image_url: string; is_primary: boolean }[];
}

export function useActiveFlashSale() {
  return useQuery({
    queryKey: ["flash-sale-active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // First get active flash sale
      const { data: flashSale, error: saleError } = await supabase
        .from("flash_sales")
        .select("*")
        .eq("is_active", true)
        .lte("start_time", now)
        .gt("end_time", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (saleError) throw saleError;
      if (!flashSale) return null;

      // Then get the products for this flash sale
      const { data: flashProducts, error: productsError } = await supabase
        .from("flash_sale_products")
        .select("product_id")
        .eq("flash_sale_id", flashSale.id);

      if (productsError) throw productsError;

      const productIds = flashProducts?.map(fp => fp.product_id) || [];
      
      if (productIds.length === 0) return { ...flashSale, products: [] };

      // Get full product details
      const { data: products, error: detailsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          base_price,
          sale_price,
          brands(name),
          product_images(image_url, is_primary)
        `)
        .in("id", productIds)
        .eq("is_active", true);

      if (detailsError) throw detailsError;

      return {
        ...flashSale,
        products: products || [],
      };
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refetch every minute to check if still active
  });
}

export function useAdminFlashSales() {
  const queryClient = useQueryClient();

  const flashSalesQuery = useQuery({
    queryKey: ["admin-flash-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FlashSale[];
    },
  });

  const createFlashSale = useMutation({
    mutationFn: async (sale: Omit<FlashSale, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("flash_sales")
        .insert(sale)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      queryClient.invalidateQueries({ queryKey: ["flash-sale-active"] });
    },
  });

  const updateFlashSale = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSale> & { id: string }) => {
      const { data, error } = await supabase
        .from("flash_sales")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      queryClient.invalidateQueries({ queryKey: ["flash-sale-active"] });
    },
  });

  const deleteFlashSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flash_sales")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-sales"] });
      queryClient.invalidateQueries({ queryKey: ["flash-sale-active"] });
    },
  });

  return {
    flashSales: flashSalesQuery.data || [],
    isLoading: flashSalesQuery.isLoading,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
  };
}

export function useFlashSaleProducts(flashSaleId: string | null) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["flash-sale-products", flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      
      const { data, error } = await supabase
        .from("flash_sale_products")
        .select("product_id")
        .eq("flash_sale_id", flashSaleId);

      if (error) throw error;
      return data.map(p => p.product_id);
    },
    enabled: !!flashSaleId,
  });

  const updateProducts = useMutation({
    mutationFn: async ({ flashSaleId, productIds }: { flashSaleId: string; productIds: string[] }) => {
      // Delete existing products
      const { error: deleteError } = await supabase
        .from("flash_sale_products")
        .delete()
        .eq("flash_sale_id", flashSaleId);

      if (deleteError) throw deleteError;

      // Insert new products
      if (productIds.length > 0) {
        const { error: insertError } = await supabase
          .from("flash_sale_products")
          .insert(productIds.map(productId => ({
            flash_sale_id: flashSaleId,
            product_id: productId,
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-sale-products"] });
      queryClient.invalidateQueries({ queryKey: ["flash-sale-active"] });
    },
  });

  return {
    productIds: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    updateProducts,
  };
}
