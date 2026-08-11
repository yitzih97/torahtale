import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChildRecord {
  id: string;
  user_id: string;
  name: string;
  /** Optional Hebrew / Yiddish spellings of the name; fall back to `name`. */
  name_he?: string | null;
  name_yi?: string | null;
  age: number | null;
  gender: string | null;
  photo_url: string | null;
  art_style: string | null;
  description: string | null;
  created_at: string;
}

/** The child's name in the given UI/book language, falling back to the base
 *  `name` when that language has no override set. */
export function childDisplayName(
  child: Pick<ChildRecord, "name" | "name_he" | "name_yi">,
  lang: "en" | "he" | "yi",
): string {
  if (lang === "he") return child.name_he?.trim() || child.name;
  if (lang === "yi") return child.name_yi?.trim() || child.name;
  return child.name;
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
        .eq("user_id", user!.id)
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

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, ...child }: { id: string } & Partial<Omit<ChildRecord, "id" | "user_id" | "created_at">>) => {
      const { data, error } = await supabase
        .from("children")
        .update(child as any)
        .eq("id", id)
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

  return { children: childrenQuery.data || [], isLoading: childrenQuery.isLoading, addChild, updateChild: updateChildMutation, deleteChild };
}
