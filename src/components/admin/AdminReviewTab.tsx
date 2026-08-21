import { useMemo, useState } from "react";
import {
  BookOpen, CheckCircle2, Download, Eye, Loader2, Play, Search, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABEL, orderStatusColor, orderStatusIcon } from "@/lib/orderStatus";
import { getPortionLabel } from "@/components/wizard/TorahPortions";

/**
 * The review queue - the whole of what a staff reviewer sees.
 *
 * It is a SEPARATE screen from the admin orders table on purpose. That table is
 * built around the order: what was paid, what Shopify says, which customer, what
 * it cost us. Threading a permission flag through it would leave the money one
 * missed column away from an employee who is not supposed to see it. This shows
 * a book, its format, its state, and the four things a reviewer does to it.
 */

const PRODUCT_LABEL: Record<string, string> = {
  softcover: "Softcover 8″×8″",
  hardcover: "Hardcover 8″×8″",
  board: "Board book 6″×6″",
  coloring: "Coloring book 8.5″×11″",
};

const productOf = (b: any): string => {
  // `product_type` is the JSON-path projection a staff session gets instead of
  // the whole shipping_data (which carries the customer's address).
  const t = b?.product_type || b?.shipping_data?.bookOptions?.productType
    || b?.story_options?.productType || "softcover";
  return PRODUCT_LABEL[t] || PRODUCT_LABEL.softcover;
};

/** The states a reviewer is actually meant to act on, newest first. */
const REVIEWABLE = new Set([
  "paid", "generating", "pending_review", "ordered", "approved", "printing", "shipped", "delivered",
]);

interface Props {
  books: any[];
  booksLoading: boolean;
  openingBookId: string | null;
  downloadingZip: string | null;
  canGenerate: (book: any) => boolean;
  onOpenBookEditor: (book: any) => void;
  onGenerate: (book: any) => void;
  onDownloadZip: (book: any) => void;
  onApprove: (book: any) => void;
}

export const AdminReviewTab = ({
  books, booksLoading, openingBookId, downloadingZip,
  canGenerate, onOpenBookEditor, onGenerate, onDownloadZip, onApprove,
}: Props) => {
  const [query, setQuery] = useState("");
  const [waitingOnly, setWaitingOnly] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books
      .filter((b: any) => REVIEWABLE.has(b.status))
      // "Waiting on me" is the default view: a book with pages that nobody has
      // sent to print yet, or one that is paid and not built.
      .filter((b: any) => !waitingOnly || ["paid", "pending_review", "ordered", "approved"].includes(b.status))
      .filter((b: any) => {
        if (!q) return true;
        return [b.child_name, b.torah_portion, b.order_number, b.status]
          .some((v: any) => String(v || "").toLowerCase().includes(q));
      })
      .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
  }, [books, query, waitingOnly]);

  if (booksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by child, parsha or order number"
            className="ps-9 rounded-xl"
          />
        </div>
        <Button
          variant={waitingOnly ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setWaitingOnly((v) => !v)}
        >
          {waitingOnly ? "Waiting on me" : "All books"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {waitingOnly ? "Nothing is waiting for review right now." : "No books match that search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((book: any) => {
            const canApprove = book.has_pages
              && ["pending_review", "ordered", "approved"].includes(book.status);
            return (
              <div
                key={book.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft-sm"
              >
                <div className="min-w-[10rem] flex-1">
                  <p className="font-display text-base font-bold text-primary leading-tight">
                    {book.child_name || "Untitled book"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getPortionLabel(book.torah_portion) || book.torah_portion} · {productOf(book)}
                    {book.order_number ? ` · ${book.order_number}` : ""}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${orderStatusColor(book.status)}`}>
                  {orderStatusIcon(book.status)}
                  {STATUS_LABEL[book.status] || book.status}
                </span>

                {book.printify_order_id && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Package className="w-3.5 h-3.5" /> at the printer
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline" size="sm" className="rounded-xl gap-1.5"
                    disabled={openingBookId === book.id}
                    onClick={() => onOpenBookEditor(book)}
                  >
                    {openingBookId === book.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Eye className="w-3.5 h-3.5" />}
                    Review
                  </Button>

                  {canGenerate(book) && (
                    <Button
                      variant="outline" size="sm" className="rounded-xl gap-1.5"
                      onClick={() => onGenerate(book)}
                    >
                      <Play className="w-3.5 h-3.5" /> Generate
                    </Button>
                  )}

                  {book.has_pages && (
                    <Button
                      variant="ghost" size="sm" className="rounded-xl gap-1.5"
                      disabled={downloadingZip === book.id}
                      onClick={() => onDownloadZip(book)}
                    >
                      {downloadingZip === book.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                      ZIP
                    </Button>
                  )}

                  {canApprove && (
                    <Button
                      size="sm"
                      className="rounded-xl gap-1.5 bg-green-600 text-white hover:bg-green-700"
                      onClick={() => onApprove(book)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {book.status === "approved" ? "Retry print" : "Approve & print"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
