import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// The admin order list must NOT pull the heavy columns: pages_data, story_data,
// and cover_image_url each hold base64 images (~15 MB per book combined). The
// table view only renders text metadata plus a "has pages" flag, so we select
// metadata only and fetch the full row on demand (opening/downloading a book).
// Pulling `select("*")` here was re-downloading ~118 MB every refetch, which is
// what made the admin page crawl and pounded the database.
//
// `story_options` is a JSON-path select of story_data->bookOptions only - the
// product type of older books lives there rather than in shipping_data, and the
// path select costs a few bytes instead of the whole (image-laden) story_data.
// The payment/fulfilment correlation columns are needed by the orders table to
// tell a paid order from an unpaid one and to know when a book has already been
// handed to Printify (after which the address can no longer be changed).
const BOOK_LIST_COLS =
  "id,user_id,child_id,child_name,torah_portion,art_style,language,status,order_number,questions,shipping_data,created_at,updated_at," +
  "paid_at,shopify_order_id,shopify_order_name,printify_order_id,printify_product_id,story_options:story_data->bookOptions," +
  // Books minted by the Monday release job stamp their subscription id into
  // story_data - projecting just that key is what lets the subs tab count and
  // open the books a subscription has actually produced.
  "subscription_id:story_data->>subscriptionId," +
  // The month's books share one shipmentBatchId and are sold as a single
  // delivery, so approving any one of them has to be able to find its siblings
  // and send the set as ONE Printify order - see approveBatchAndSubmit.
  "shipment_batch_id:story_data->>shipmentBatchId";

// Fetch the complete book row (including the heavy image columns) for one book -
// used when opening the generation modal or exporting a ZIP.
export async function fetchBookFull(id: string) {
  const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

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
        .select(BOOK_LIST_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  // Which books already have generated pages - a tiny id-only query (PostgREST
  // filters server-side, so no image bytes cross the wire). Drives the
  // download / approve / "has pages" UI without pulling pages_data into the list.
  const bookPageIdsQuery = useQuery({
    queryKey: ["admin-books-haspages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id")
        .not("pages_data", "is", null);
      if (error) throw error;
      return (data || []).map((r: any) => r.id as string);
    },
    enabled: isAdminQuery.data === true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const hasPagesSet = useMemo(
    () => new Set(bookPageIdsQuery.data || []),
    [bookPageIdsQuery.data],
  );

  // Merge the "has pages" flag onto each metadata row so the UI can read
  // book.has_pages instead of the (now absent) book.pages_data.
  const booksWithFlag = useMemo(
    () => (allBooksQuery.data || []).map((b: any) => ({ ...b, has_pages: hasPagesSet.has(b.id) })),
    [allBooksQuery.data, hasPagesSet],
  );

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

  // Admin override: stamp a book as paid so it can be sent to Printify without
  // a Shopify order (test/comp/manual prints). printify-submit refuses books
  // that have neither a shopify_order_id nor paid_at, so this is the deliberate
  // way to clear that guard.
  const markBookPaid = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("books")
        .update({ paid_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-books"] }),
  });

  // Admin edit of an order's fulfilment details (book format, quantity,
  // shipping address, shipping speed). Everything lives inside shipping_data,
  // which is what printify-submit reads when it places the print order - so
  // this is the one write that can still change what actually gets printed and
  // where it goes, right up until the book is handed to Printify.
  const updateBookOrderDetails = useMutation({
    mutationFn: async ({ id, shipping_data }: { id: string; shipping_data: any }) => {
      const { error } = await supabase
        .from("books")
        .update({ shipping_data, updated_at: new Date().toISOString() } as any)
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
    books: booksWithFlag,
    booksLoading: allBooksQuery.isLoading,
    profiles: allProfilesQuery.data || [],
    profilesLoading: allProfilesQuery.isLoading,
    children: allChildrenQuery.data || [],
    childrenLoading: allChildrenQuery.isLoading,
    subscriptions: allSubscriptionsQuery.data || [],
    subscriptionsLoading: allSubscriptionsQuery.isLoading,
    updateBookStatus,
    markBookPaid,
    updateBookOrderDetails,
    updateSubscriptionStatus,
  };
}
