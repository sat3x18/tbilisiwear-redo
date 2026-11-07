import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applyTheme, applyCustomThemeColors, themes } from "@/lib/themes";

export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  currency: string;
  free_shipping_threshold: string;
  standard_shipping_cost: string;
  express_shipping_cost: string;
  order_notifications: boolean;
  low_stock_notifications: boolean;
  low_stock_threshold: string;
  customer_notifications: boolean;
  guest_checkout: boolean;
  require_phone: boolean;
  theme: string;
  payments_enabled: boolean;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  social_messenger: string;
}

const defaultSettings: StoreSettings = {
  store_name: "TBILISI WEAR",
  store_email: "info@tbilisiwear.com",
  store_phone: "+995 555 123 456",
  store_address: "12 Rustaveli Avenue, Tbilisi, Georgia",
  currency: "GEL",
  free_shipping_threshold: "150",
  standard_shipping_cost: "10",
  express_shipping_cost: "25",
  order_notifications: true,
  low_stock_notifications: true,
  low_stock_threshold: "5",
  customer_notifications: true,
  guest_checkout: true,
  require_phone: true,
  theme: "studio",
  payments_enabled: true,
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  social_messenger: "",
};

interface StoreSettingsContextValue {
  settings: StoreSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  isUpdating: boolean;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null);

async function fetchSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value");

  if (error) throw error;

  const settings = { ...defaultSettings };
  
  data?.forEach((row: { key: string; value: string | null }) => {
    const key = row.key as keyof StoreSettings;
    const value = row.value;
    
    if (key in defaultSettings) {
      const defaultValue = defaultSettings[key];
      if (typeof defaultValue === "boolean") {
        (settings[key] as boolean) = value === "true";
      } else {
        (settings[key] as string) = value || (defaultValue as string);
      }
    }
  });

  if (settings.theme === "dark-gold") settings.theme = "studio";

  return settings;
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Apply theme whenever settings change
  useEffect(() => {
    if (settings.theme) {
      const isPreset = themes.some(t => t.id === settings.theme);
      if (isPreset) {
        applyTheme(settings.theme);
      } else {
        // Custom theme — fetch from DB and apply
        supabase
          .from("custom_themes")
          .select("colors")
          .eq("id", settings.theme)
          .single()
          .then(({ data }) => {
            if (data?.colors) {
              applyCustomThemeColors(data.colors as any);
            } else {
              applyTheme("studio");
            }
          });
      }
    }
  }, [settings.theme]);

  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<StoreSettings>) => {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: typeof value === "boolean" ? String(value) : String(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("store_settings")
          .update({ value: update.value })
          .eq("key", update.key);

        if (error) throw error;
      }
    },
    onMutate: async (newSettings: Partial<StoreSettings>) => {
      await queryClient.cancelQueries({ queryKey: ["store-settings"] });
      const previous = queryClient.getQueryData<StoreSettings>(["store-settings"]);
      queryClient.setQueryData<StoreSettings>(["store-settings"], (old) => ({
        ...(old || defaultSettings),
        ...newSettings,
      }));
      return { previous };
    },
    onError: (_err, _newSettings, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["store-settings"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
  });

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    await mutation.mutateAsync(newSettings);
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        isUpdating: mutation.isPending,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return context;
}
