import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ThemeColors } from "@/lib/themes";

export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  hero: Record<string, string>;
  hero_image_url: string | null;
  created_at: string;
  user_id: string;
}

async function fetchCustomThemes(): Promise<CustomTheme[]> {
  const { data, error } = await supabase
    .from("custom_themes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    colors: row.colors as ThemeColors,
    hero: (row.hero || {}) as Record<string, string>,
    hero_image_url: row.hero_image_url,
    created_at: row.created_at,
    user_id: row.user_id,
  }));
}

export function useCustomThemes() {
  const queryClient = useQueryClient();

  const { data: customThemes = [], isLoading } = useQuery({
    queryKey: ["custom-themes"],
    queryFn: fetchCustomThemes,
    staleTime: 1000 * 60 * 5,
  });

  const createTheme = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      colors: ThemeColors;
      hero: Record<string, string>;
      heroFile?: File | null;
    }) => {
      let hero_image_url: string | null = null;

      if (params.heroFile) {
        const ext = params.heroFile.name.split(".").pop();
        const path = `hero-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("theme-assets")
          .upload(path, params.heroFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("theme-assets")
          .getPublicUrl(path);
        hero_image_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("custom_themes")
        .insert({
          name: params.name,
          description: params.description || "",
          colors: params.colors as any,
          hero: params.hero as any,
          hero_image_url,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-themes"] });
    },
  });

  const deleteTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_themes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-themes"] });
    },
  });

  return {
    customThemes,
    isLoading,
    createTheme,
    deleteTheme,
  };
}
