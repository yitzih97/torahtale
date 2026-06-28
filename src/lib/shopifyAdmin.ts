import { supabase } from "@/integrations/supabase/client";

/** A normalized money value from Shopify. */
export interface ShopMoney {
  amount: number;
  currency: string;
}

/** Full financial detail for a single order (admin or the order's owner). */
export interface OrderDetails {
  id: string;
  name: string | null;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  paymentGateways: string[];
  total: ShopMoney | null;
  subtotal: ShopMoney | null;
  tax: ShopMoney | null;
  shipping: ShopMoney | null;
  refunded: ShopMoney | null;
  lineItems: { title: string; quantity: number; sku: string | null; unitPrice: ShopMoney | null }[];
  shippingAddress: Record<string, string | null> | null;
  payment: { gateway: string; kind: string; status: string; cardCompany: string | null; cardLast4: string | null; wallet?: string | null; methodName?: string | null } | null;
  fulfillments: { status: string; tracking: { company: string | null; number: string | null; url: string | null }[] }[];
}

/** One row in a user's order summary. */
export interface OrderSummaryRow {
  bookId: string;
  orderName: string | null;
  placedAt: string | null;
  total: ShopMoney | null;
  subtotal: ShopMoney | null;
  refunded: ShopMoney | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  payment: string | null;
}

export interface UserOrdersSummary {
  orders: OrderSummaryRow[];
  totalSpent: number;
  currency: string | null;
}

/** Fetch full Shopify financials for one book's order. Returns null if the book has no Shopify order yet. */
export async function fetchOrderDetails(bookId: string): Promise<OrderDetails | null> {
  const { data, error } = await supabase.functions.invoke("shopify-admin-data", {
    body: { action: "order", bookId },
  });
  if (error) throw error;
  if (!data?.hasOrder) return null;
  return data.order as OrderDetails;
}

/**
 * Fetch real per-order totals for a user. Admins may pass a userId; customers
 * omit it and get their own orders (the edge function enforces scoping).
 */
export async function fetchUserOrdersSummary(userId?: string): Promise<UserOrdersSummary> {
  const { data, error } = await supabase.functions.invoke("shopify-admin-data", {
    body: { action: "user-orders-summary", ...(userId ? { userId } : {}) },
  });
  if (error) throw error;
  return data as UserOrdersSummary;
}

/** Format a ShopMoney for display, e.g. "$24.99". Falls back to "—". */
export function formatMoney(m: ShopMoney | null | undefined): string {
  if (!m) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: m.currency || "USD" }).format(m.amount);
  } catch {
    return `${m.amount.toFixed(2)} ${m.currency || ""}`.trim();
  }
}
