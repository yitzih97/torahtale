import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  child_id: string | null;
  child_name: string | null;
  art_style: string | null;
  language: string | null;
  status: string;
  frequency: string;
  price_per_week: number;
  shipping_data: any;
  next_delivery_date: string | null;
  next_release_date?: string | null;
  books_remaining?: number | null;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subsQuery = useQuery({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as SubscriptionRecord[];
    },
    enabled: !!user,
  });

  const createSubscription = useMutation({
    mutationFn: async (sub: Partial<SubscriptionRecord>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({ ...sub, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const cancelSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  return {
    subscriptions: subsQuery.data || [],
    isLoading: subsQuery.isLoading,
    createSubscription,
    updateSubscription,
    cancelSubscription,
  };
}
