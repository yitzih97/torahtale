import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** One book's order, priced by Shopify. `netUsd` is the total minus refunds. */
export interface RevenueOrder {
  bookId: string;
  userId: string;
  orderName: string | null;
  placedAt: string | null;
  totalUsd: number | null;
  netUsd: number;
  paid: boolean;
  financialStatus: string | null;
}

export interface RevenueSummary {
  orders: RevenueOrder[];
  totalRevenue: number;
  currency: string | null;
}

/**
 * Every order on the store, priced by Shopify — the only source of what a
 * customer ACTUALLY paid (the local `books` row never stores a price).
 *
 * One query key shared by the dashboard, orders and users tabs, so moving
 * between them costs nothing: the first tab to mount pays for the round trip
 * and the rest read the cache.
 */
export function useAdminRevenue() {
  return useQuery<RevenueSummary>({
    queryKey: ["admin-revenue-summary"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("shopify-admin-data", {
        body: { action: "revenue-summary" },
      });
      if (error) throw error;
      return data as RevenueSummary;
    },
  });
}
