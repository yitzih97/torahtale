import { Package, Truck, Wand2, Loader2, CheckCircle2 } from "lucide-react";

/**
 * The order lifecycle, in workflow order. Shared by the admin orders table
 * (chips, status picker, status sort) so every surface offers the same set —
 * a status that only exists in one dropdown is a status that gets stranded.
 */
export const ORDER_STATUSES = [
  "draft", "awaiting_payment", "paid", "generating",
  "pending_review", "ordered", "approved", "printing", "shipped", "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  generating: "Generating",
  pending_review: "Pending review",
  ordered: "Ordered",
  approved: "Approved",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export const orderStatusColor = (s: string) => {
  if (s === "draft") return "text-muted-foreground bg-muted";
  if (s === "awaiting_payment") return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950";
  if (s === "generating") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  if (s === "ordered" || s === "printing") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  if (s === "approved") return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950";
  if (s === "shipped" || s === "delivered") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  return "text-accent bg-accent/10";
};

export const orderStatusIcon = (s: string) => {
  if (s === "draft") return <Wand2 className="w-3.5 h-3.5" />;
  if (s === "generating") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  if (s === "ordered" || s === "printing") return <Package className="w-3.5 h-3.5" />;
  if (s === "approved") return <CheckCircle2 className="w-3.5 h-3.5" />;
  return <Truck className="w-3.5 h-3.5" />;
};

/** Orders that are waiting on the admin for something. */
export const orderNeedsAction = (b: any) =>
  b.status === "paid" ||
  b.status === "pending_review" ||
  b.status === "approved" ||
  (b.status === "ordered" && !b.has_pages);
