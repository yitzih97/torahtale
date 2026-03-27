import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export function useSiteSettings(category?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site-settings", category],
    queryFn: async () => {
      let q = supabase.from("site_settings" as any).select("*");
      if (category) q = q.eq("category", category);
      const { data, error } = await q.order("key");
      if (error) throw error;
      return (data || []) as SiteSetting[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getSetting = (cat: string, key: string, fallback: string): string => {
    const found = query.data?.find(
      (s) => s.category === cat && s.key === key
    );
    return found?.value ?? fallback;
  };

  const upsertSetting = useMutation({
    mutationFn: async ({ category, key, value }: { category: string; key: string; value: string }) => {
      const { data: existing } = await supabase
        .from("site_settings" as any)
        .select("id")
        .eq("category", category)
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings" as any)
          .update({ value, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings" as any)
          .insert({ category, key, value } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  return { settings: query.data || [], isLoading: query.isLoading, getSetting, upsertSetting };
}
