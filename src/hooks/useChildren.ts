import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChildRecord {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  photo_url: string | null;
  art_style: string | null;
  created_at: string;
}

export function useChildren() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const childrenQuery = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChildRecord[];
    },
    enabled: !!user,
  });

  const addChild = useMutation({
    mutationFn: async (child: Omit<ChildRecord, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("children")
        .insert({ ...child, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children"] }),
  });

  const deleteChild = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("children").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children"] }),
  });

  return { children: childrenQuery.data || [], isLoading: childrenQuery.isLoading, addChild, deleteChild };
}
