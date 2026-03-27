import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteAsset {
  id: string;
  asset_key: string;
  image_url: string | null;
  prompt_used: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSiteAssets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_assets" as any)
        .select("*")
        .order("asset_key");
      if (error) throw error;
      return (data || []) as unknown as SiteAsset[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getAssetUrl = (assetKey: string, fallback: string): string => {
    const asset = query.data?.find((a) => a.asset_key === assetKey && a.status === "ready" && a.image_url);
    return asset?.image_url || fallback;
  };

  const regenerateImage = useMutation({
    mutationFn: async ({ assetKey, prompt }: { assetKey: string; prompt: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-generate-image", {
        body: { assetKey, prompt },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-assets"] });
    },
  });

  return { assets: query.data || [], isLoading: query.isLoading, getAssetUrl, regenerateImage };
}
