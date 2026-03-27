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
        .from("site_assets")
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

  const uploadImage = useMutation({
    mutationFn: async ({ assetKey, file }: { assetKey: string; file: File }) => {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${assetKey}.${ext}`;

      // Upload to site-images bucket
      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(filePath, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(filePath);
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Upsert site_assets record
      const { data: existing } = await supabase
        .from("site_assets")
        .select("id")
        .eq("asset_key", assetKey)
        .maybeSingle();

      if (existing) {
        await supabase.from("site_assets").update({
          image_url: imageUrl,
          status: "ready",
          prompt_used: "Uploaded manually",
          updated_at: new Date().toISOString(),
        } as any).eq("id", existing.id);
      } else {
        await supabase.from("site_assets").insert({
          asset_key: assetKey,
          image_url: imageUrl,
          status: "ready",
          prompt_used: "Uploaded manually",
        } as any);
      }

      return { imageUrl, assetKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-assets"] });
    },
  });

  return { assets: query.data || [], isLoading: query.isLoading, getAssetUrl, regenerateImage, uploadImage };
}
