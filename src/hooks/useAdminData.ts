import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdminQuery = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  const allBooksQuery = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  const allProfilesQuery = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const allChildrenQuery = useQuery({
    queryKey: ["admin-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const allSubscriptionsQuery = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const updateBookStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("books")
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-books"] }),
  });

  const updateSubscriptionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "canceled") updates.canceled_at = new Date().toISOString();
      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
  });

  return {
    isAdmin: isAdminQuery.data === true,
    isCheckingAdmin: isAdminQuery.isLoading,
    books: allBooksQuery.data || [],
    booksLoading: allBooksQuery.isLoading,
    profiles: allProfilesQuery.data || [],
    profilesLoading: allProfilesQuery.isLoading,
    children: allChildrenQuery.data || [],
    childrenLoading: allChildrenQuery.isLoading,
    subscriptions: allSubscriptionsQuery.data || [],
    subscriptionsLoading: allSubscriptionsQuery.isLoading,
    updateBookStatus,
    updateSubscriptionStatus,
  };
}
