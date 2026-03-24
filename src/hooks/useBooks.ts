import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BookRecord {
  id: string;
  user_id: string;
  child_id: string | null;
  child_name: string | null;
  torah_portion: string | null;
  art_style: string | null;
  language: string | null;
  status: string;
  cover_image_url: string | null;
  pages_data: any;
  story_data: any;
  questions: any;
  shipping_data: any;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useBooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const booksQuery = useQuery({
    queryKey: ["books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BookRecord[];
    },
    enabled: !!user,
  });

  const saveBook = useMutation({
    mutationFn: async (book: Partial<BookRecord>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("books")
        .insert({ ...book, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BookRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("books")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  return { books: booksQuery.data || [], isLoading: booksQuery.isLoading, saveBook, updateBook };
}
