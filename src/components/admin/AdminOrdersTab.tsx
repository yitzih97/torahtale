import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAdminRevenue } from "@/hooks/useAdminRevenue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Package, Truck, Loader2, CheckCircle2, Play, Eye, Download,
  DollarSign, Maximize2, MoreHorizontal, Table2, LayoutGrid, Columns3, X,
  ArrowUp, ArrowDown, ChevronsUpDown, SlidersHorizontal, User, Pencil,
  ExternalLink, Copy, MapPin, BookOpen, Shield, Baby, Palette,
} from "lucide-react";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductType, getCogs } from "@/lib/bookCosts";
import { PAGES_BY_TYPE } from "@/components/wizard/BookOptionsStep";
import { formatAddressLine, shippingSpeedLabel } from "@/lib/orderShipping";
import {
  ORDER_STATUSES, STATUS_LABEL, orderStatusColor, orderStatusIcon, orderNeedsAction,
} from "@/lib/orderStatus";
import { toast } from "sonner";

/** Board-view lanes - a workflow grouping, not one column per raw status. */
const BOARD_LANES: { key: string; label: string; statuses: string[] }[] = [
  { key: "new", label: "New / unpaid", statuses: ["draft", "awaiting_payment"] },
  { key: "queue", label: "Paid - to generate", statuses: ["paid", "ordered"] },
  { key: "generating", label: "Generating", statuses: ["generating"] },
  { key: "review", label: "Review & approve", statuses: ["pending_review", "approved"] },
  { key: "printing", label: "Printing", statuses: ["printing"] },
  { key: "done", label: "Shipped", statuses: ["shipped", "delivered"] },
];

const PRODUCT_LABEL: Record<string, string> = {
  softcover: "Softcover 8×8",
  hardcover: "Hardcover 8×8",
  board: "Board 6×6",
  coloring: "Coloring 8.5×11",
};

const PRODUCT_SHORT: Record<string, string> = {
  softcover: "Softcover", hardcover: "Hardcover", board: "Board", coloring: "Coloring",
};

const PRODUCT_ICON: Record<string, any> = {
  softcover: BookOpen, hardcover: Shield, board: Baby, coloring: Palette,
};

const LANG_LABEL: Record<string, string> = { en: "English", he: "Hebrew", yi: "Yiddish" };
const langLabel = (l?: string | null) => {
  if (!l) return "English";
  const k = String(l).toLowerCase();
  return LANG_LABEL[k] || LANG_LABEL[k.slice(0, 2)] || l;
};

const money = (n: number | null | undefined, currency = "USD") =>
  n == null ? "-" : new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

/* ────────────────────────────── sorting ────────────────────────────── */

type SortKey = "placed" | "order" | "customer" | "child" | "portion" | "type" | "paid" | "status";
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  placed: "Date placed",
  order: "Order #",
  customer: "Customer",
  child: "Child",
  portion: "Portion",
  type: "Book type",
  paid: "Amount paid",
  status: "Status",
};

interface Props {
  books: any[];
  booksLoading: boolean;
  profiles: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  updateBookStatus: any;
  markBookPaid: any;
  downloadingZip: string | null;
  openingBookId: string | null;
  canGenerate: (book: any) => boolean;
  onOpenDetail: (book: any) => void;
  onOpenBookEditor: (book: any) => void;
  onGenerate: (book: any) => void;
  onDownloadZip: (book: any) => void;
  onApprove: (book: any) => void;
  onEditOrder: (book: any) => void;
  onSelectUser: (userId: string) => void;
}

export function AdminOrdersTab({
  books, booksLoading, profiles, searchQuery, setSearchQuery,
  updateBookStatus, markBookPaid, downloadingZip, openingBookId, canGenerate,
  onOpenDetail, onOpenBookEditor, onGenerate, onDownloadZip, onApprove,
  onEditOrder, onSelectUser,
}: Props) {
  const { lang } = useLanguage();
  const [view, setView] = useState<"table" | "cards" | "board">("table");
  const [statusFilter, setStatusFilter] = useState("all"); // all | needs_action | <status>
  const [typeFilter, setTypeFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all"); // all | paid | unpaid
  const [dateFilter, setDateFilter] = useState("all"); // all | 7 | 30 | 90
  const [sortKey, setSortKey] = useState<SortKey>("placed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* Real per-order money, straight from Shopify - cache-shared with the
     dashboard and users tabs, so opening Orders costs no extra call. */
  const revenueQuery = useAdminRevenue();

  const payByBook = useMemo(() => {
    const m = new Map<string, any>();
    for (const o of revenueQuery.data?.orders || []) m.set(o.bookId, o);
    return m;
  }, [revenueQuery.data]);

  const currency = revenueQuery.data?.currency || "USD";

  /* ── enrich: everything the rows, filters and sorts read ── */
  const rows = useMemo(() => books.map((b: any) => {
    const profile = profiles.find((p: any) => p.id === b.user_id);
    const pay = payByBook.get(b.id);
    const productType = getProductType(b);
    return {
      book: b,
      profile,
      customer: profile?.full_name || profile?.email || (b.user_id || "").slice(0, 8),
      orderRef: b.shopify_order_name || b.order_number || "",
      productType,
      quantity: Math.max(1, parseInt(b.shipping_data?.quantity) || 1),
      placed: new Date(b.paid_at || b.created_at).getTime(),
      amount: pay?.paid ? (pay.netUsd ?? pay.totalUsd ?? null) : (pay?.totalUsd ?? null),
      isPaid: !!pay?.paid || !!b.paid_at,
      financialStatus: pay?.financialStatus || null,
      cogs: getCogs(b),
    };
  }), [books, profiles, payByBook]);

  /* ── filter ── */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cutoff = dateFilter === "all" ? 0 : Date.now() - parseInt(dateFilter) * 864e5;
    return rows.filter((r) => {
      const b = r.book;
      if (q) {
        const hay = [
          b.child_name, b.torah_portion, b.order_number, b.shopify_order_name, b.status,
          r.customer, r.profile?.email, r.productType, b.id,
          formatAddressLine(b.shipping_data),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "needs_action") { if (!orderNeedsAction(b)) return false; }
      else if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.productType !== typeFilter) return false;
      if (langFilter !== "all" && String(b.language || "en").toLowerCase().slice(0, 2) !== langFilter) return false;
      if (payFilter === "paid" && !r.isPaid) return false;
      if (payFilter === "unpaid" && r.isPaid) return false;
      if (cutoff && r.placed < cutoff) return false;
      return true;
    });
  }, [rows, searchQuery, statusFilter, typeFilter, langFilter, payFilter, dateFilter]);

  /* ── sort ── */
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r: any) => {
      switch (sortKey) {
        case "order": return r.orderRef.toLowerCase();
        case "customer": return r.customer.toLowerCase();
        case "child": return (r.book.child_name || "").toLowerCase();
        case "portion": return (r.book.torah_portion || "").toLowerCase();
        case "type": return r.productType;
        case "paid": return r.amount ?? -1;
        // Sort by workflow position, not alphabetically - "approved" before
        // "printing" is the order an admin actually thinks in.
        case "status": {
          const idx = (ORDER_STATUSES as readonly string[]).indexOf(r.book.status);
          return idx === -1 ? 99 : idx;
        }
        default: return r.placed;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av === bv) return b.placed - a.placed;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(
    () => (view === "board" ? sorted : sorted.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize)),
    [sorted, page, pageSize, totalPages, view],
  );

  const filtersActive =
    statusFilter !== "all" || typeFilter !== "all" || langFilter !== "all" ||
    payFilter !== "all" || dateFilter !== "all" || !!searchQuery;

  const clearFilters = () => {
    setStatusFilter("all"); setTypeFilter("all"); setLangFilter("all");
    setPayFilter("all"); setDateFilter("all"); setSearchQuery(""); setPage(1);
  };

  const revenueShown = filtered.reduce((sum, r) => sum + (r.isPaid ? (r.amount || 0) : 0), 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "placed" || key === "paid" ? "desc" : "asc"); }
    setPage(1);
  };

  const statusChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.book.status, (counts.get(r.book.status) || 0) + 1);
    return [
      { value: "all", label: "All", count: rows.length },
      { value: "needs_action", label: "Needs action", count: rows.filter((r) => orderNeedsAction(r.book)).length },
      ...ORDER_STATUSES.filter((s) => counts.get(s)).map((s) => ({
        value: s as string, label: STATUS_LABEL[s] || s, count: counts.get(s) || 0,
      })),
    ];
  }, [rows]);

  /* ────────────────────────── shared bits ────────────────────────── */

  const StatusSelect = ({ book, className = "" }: { book: any; className?: string }) => (
    <Select
      value={book.status}
      onValueChange={(v) => {
        updateBookStatus.mutate({ id: book.id, status: v });
        toast.success(`Status updated to ${STATUS_LABEL[v] || v}`);
      }}
    >
      {/* The base trigger is full-width with a line-clamped span (which forces
          display:-webkit-box and breaks the pill's flex row) - undo both so the
          status reads as a single compact chip. */}
      <SelectTrigger
        className={`h-7 w-auto gap-1 justify-start text-[11px] border-0 bg-transparent shadow-none px-0 focus:ring-0 focus:ring-offset-0 [&>span]:!inline-flex [&>span]:overflow-visible ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap ${orderStatusColor(book.status)}`}>
          {orderStatusIcon(book.status)}
          <span className="font-medium">{STATUS_LABEL[book.status] || book.status}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  /** Every per-order action, labelled. Nothing here is exclusive to a view. */
  const RowActions = ({ book }: { book: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()} title="Actions">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11px]">
          {book.shopify_order_name || book.order_number || book.id.slice(0, 8)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onOpenBookEditor(book)}>
          <Eye className="w-3.5 h-3.5" /> View &amp; edit book
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpenDetail(book)}>
          <Maximize2 className="w-3.5 h-3.5" /> Order details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditOrder(book)}>
          <Pencil className="w-3.5 h-3.5" /> Edit type / address / speed
        </DropdownMenuItem>
        {canGenerate(book) && (
          <DropdownMenuItem onClick={() => onGenerate(book)}>
            <Play className="w-3.5 h-3.5" /> Generate book
          </DropdownMenuItem>
        )}
        {book.has_pages && (
          <DropdownMenuItem disabled={downloadingZip === book.id} onClick={() => onDownloadZip(book)}>
            {downloadingZip === book.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download images (ZIP)
          </DropdownMenuItem>
        )}
        {book.has_pages && (book.status === "pending_review" || book.status === "ordered" || book.status === "approved") && (
          <DropdownMenuItem
            className="text-green-600 focus:text-green-600"
            onClick={() => onApprove(book)}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {book.status === "approved" ? "Retry → Printify" : "Approve → Printify"}
          </DropdownMenuItem>
        )}
        {!book.paid_at && !book.shopify_order_id && (
          <DropdownMenuItem
            className="text-amber-600 focus:text-amber-600"
            disabled={markBookPaid.isPending}
            onClick={() => {
              if (!window.confirm("Mark this book as PAID? This lets it be sent to Printify without a Shopify payment - use only for test/comp/manual orders.")) return;
              markBookPaid.mutate({ id: book.id }, {
                onSuccess: () => toast.success("Book marked as paid"),
                onError: (e: any) => toast.error(e?.message || "Could not mark paid"),
              });
            }}
          >
            <DollarSign className="w-3.5 h-3.5" /> Mark paid (override)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelectUser(book.user_id)}>
          <User className="w-3.5 h-3.5" /> View customer
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard?.writeText(book.shopify_order_name || book.order_number || book.id);
            toast.success("Order reference copied");
          }}
        >
          <Copy className="w-3.5 h-3.5" /> Copy order reference
        </DropdownMenuItem>
        {book.shopify_order_id && (
          <DropdownMenuItem
            onClick={() => window.open(
              `https://admin.shopify.com/store/cnhtj8-x9/orders/${String(book.shopify_order_id).replace(/^gid:\/\/shopify\/Order\//, "")}`,
              "_blank", "noopener,noreferrer",
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in Shopify
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /**
   * The per-order icon buttons, one tap each - details, generate, view/edit,
   * ZIP, mark paid, approve. `compact` drops to just the two that drive the
   * workflow, for the card and board layouts where there's no room for six.
   * Everything here is also in the labelled menu, so nothing is icon-only.
   */
  const QuickActions = ({ book, compact = false }: { book: any; compact?: boolean }) => {
    const canApprove = book.has_pages &&
      (book.status === "pending_review" || book.status === "ordered" || book.status === "approved");
    return (
      <>
        {!compact && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent"
            onClick={(e) => { e.stopPropagation(); onOpenDetail(book); }}
            title="Order details"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        )}
        {canGenerate(book) && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent"
            onClick={(e) => { e.stopPropagation(); onGenerate(book); }}
            title="Generate book content"
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
        )}
        {!compact && book.has_pages && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onOpenBookEditor(book); }}
            title="View & edit book"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        )}
        {!compact && book.has_pages && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            disabled={downloadingZip === book.id}
            onClick={(e) => { e.stopPropagation(); onDownloadZip(book); }}
            title="Download images (ZIP)"
          >
            {downloadingZip === book.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </Button>
        )}
        {!compact && !book.paid_at && !book.shopify_order_id && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600"
            disabled={markBookPaid.isPending}
            onClick={(e) => {
              e.stopPropagation();
              if (!window.confirm("Mark this book as PAID? This lets it be sent to Printify without a Shopify payment - use only for test/comp/manual orders.")) return;
              markBookPaid.mutate({ id: book.id }, {
                onSuccess: () => toast.success("Book marked as paid"),
                onError: (err: any) => toast.error(err?.message || "Could not mark paid"),
              });
            }}
            title="Mark paid (admin override for test/manual orders)"
          >
            <DollarSign className="w-3.5 h-3.5" />
          </Button>
        )}
        {canApprove && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600"
            onClick={(e) => { e.stopPropagation(); onApprove(book); }}
            title={book.status === "approved" ? "Retry sending to Printify" : "Approve for printing"}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </>
    );
  };

  const TypeBadge = ({ type, qty }: { type: string; qty: number }) => {
    const Icon = PRODUCT_ICON[type] || BookOpen;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-foreground whitespace-nowrap">
        <Icon className="w-3 h-3 text-muted-foreground" />
        {PRODUCT_SHORT[type] || type}
        {qty > 1 && <span className="text-muted-foreground">×{qty}</span>}
      </span>
    );
  };

  const PaidCell = ({ r }: { r: any }) => {
    if (revenueQuery.isLoading) return <Skeleton className="h-3.5 w-12" />;
    if (r.amount == null) {
      return <span className="text-[11px] text-muted-foreground">{r.isPaid ? "Paid (manual)" : "-"}</span>;
    }
    const refunded = /refund/i.test(r.financialStatus || "");
    return (
      <span className="inline-flex flex-col items-end">
        <span className={`text-xs font-medium tabular-nums ${r.isPaid ? "text-foreground" : "text-muted-foreground line-through"}`}>
          {money(r.amount, currency)}
        </span>
        {(refunded || !r.isPaid) && (
          <span className={`text-[10px] ${refunded ? "text-destructive" : "text-muted-foreground"}`}>
            {refunded ? "refunded" : (r.financialStatus || "unpaid").toLowerCase().replace(/_/g, " ")}
          </span>
        )}
      </span>
    );
  };

  const SortHeader = ({ label, k, align = "left" }: { label: string; k: SortKey; align?: "left" | "right" }) => (
    <th className={`p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${sortKey === k ? "text-foreground" : ""}`}
      >
        {label}
        {sortKey === k
          ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
      </button>
    </th>
  );

  /* ────────────────────────── render ────────────────────────── */

  if (booksLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-border bg-card shadow-soft-sm p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search child, customer, portion, order #, address, status…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10 rounded-xl h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View switcher */}
          <div className="flex rounded-xl border border-border bg-secondary/40 p-0.5 self-start">
            {[
              { key: "table" as const, icon: Table2, label: "Table" },
              { key: "cards" as const, icon: LayoutGrid, label: "Cards" },
              { key: "board" as const, icon: Columns3, label: "Board" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                title={`${v.label} view`}
                className={`flex items-center gap-1.5 rounded-[10px] px-3 h-8 text-xs transition-colors ${
                  view === v.key ? "bg-card shadow-soft-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          {statusChips.map((c) => (
            <button
              key={c.value}
              onClick={() => { setStatusFilter(c.value); setPage(1); }}
              className={`rounded-full px-2.5 py-1 text-[11px] border transition-colors ${
                statusFilter === c.value
                  ? "border-accent bg-accent/10 text-accent font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {c.label} <span className="opacity-60">{c.count}</span>
            </button>
          ))}
        </div>

        {/* Filters + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All book types</SelectItem>
              {Object.keys(PRODUCT_LABEL).map((k) => (
                <SelectItem key={k} value={k}>{PRODUCT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={langFilter} onValueChange={(v) => { setLangFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="he">Hebrew</SelectItem>
              <SelectItem value="yi">Yiddish</SelectItem>
            </SelectContent>
          </Select>

          <Select value={payFilter} onValueChange={(v) => { setPayFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-xl"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl"><SelectValue placeholder="Placed" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(v) => {
              const [k, d] = v.split(":") as [SortKey, SortDir];
              setSortKey(k); setSortDir(d); setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).flatMap((k) => [
                <SelectItem key={`${k}:desc`} value={`${k}:desc`}>{SORT_LABEL[k]} ↓</SelectItem>,
                <SelectItem key={`${k}:asc`} value={`${k}:asc`}>{SORT_LABEL[k]} ↑</SelectItem>,
              ])}
            </SelectContent>
          </Select>

          {filtersActive && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            {revenueQuery.isError && (
              <span className="text-destructive">Shopify totals unavailable</span>
            )}
            <span><span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length} orders</span>
            <span className="hidden sm:inline">
              paid <span className="font-semibold text-foreground tabular-nums">{money(revenueShown, currency)}</span>
            </span>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <Package className="w-8 h-8 mx-auto opacity-40" />
          <p>No orders match these filters.</p>
          {filtersActive && <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>
      ) : view === "table" ? (
        /* ── TABLE ── */
        <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-secondary/70 backdrop-blur">
                  <SortHeader label="Order" k="order" />
                  <SortHeader label="Customer" k="customer" />
                  <SortHeader label="Child" k="child" />
                  <SortHeader label="Portion" k="portion" />
                  <SortHeader label="Book" k="type" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-left">Ship to</th>
                  <SortHeader label="Paid" k="paid" align="right" />
                  <SortHeader label="Placed" k="placed" />
                  <SortHeader label="Status" k="status" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
                  const book = r.book;
                  return (
                    <motion.tr
                      key={book.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                      onClick={() => onOpenBookEditor(book)}
                      title="Open the book editor"
                      className="border-b border-border last:border-0 hover:bg-accent/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {openingBookId === book.id && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                          <span className="font-mono text-xs text-primary">{r.orderRef || "-"}</span>
                        </div>
                        {book.has_pages && (
                          <span className="text-[10px] text-muted-foreground">{PAGES_BY_TYPE[r.productType]} pages ready</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectUser(book.user_id); }}
                          className="text-xs text-accent hover:underline text-left"
                        >
                          {r.customer}
                        </button>
                        {r.profile?.email && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{r.profile.email}</p>
                        )}
                      </td>
                      <td className="p-3 text-xs font-medium text-foreground whitespace-nowrap">{book.child_name || "-"}</td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {book.torah_portion ? getPortionDisplay(book.torah_portion, lang) : "-"}
                        <span className="block text-[10px] opacity-70">{langLabel(book.language)}</span>
                      </td>
                      <td className="p-3">
                        <TypeBadge type={r.productType} qty={r.quantity} />
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {shippingSpeedLabel(book.shipping_data)}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[180px]">
                        <span className="line-clamp-2">{formatAddressLine(book.shipping_data) || "-"}</span>
                      </td>
                      <td className="p-3 text-right"><PaidCell r={r} /></td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.placed), "MMM d, yy")}
                        <span className="block text-[10px] opacity-70">{format(new Date(r.placed), "h:mm a")}</span>
                      </td>
                      <td className="p-3"><StatusSelect book={book} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <QuickActions book={book} />
                          <RowActions book={book} />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === "cards" ? (
        /* ── CARDS ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pageRows.map((r, i) => {
            const book = r.book;
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                onClick={() => onOpenBookEditor(book)}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft-sm hover:border-accent/50 hover:shadow-soft transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary flex items-center gap-1.5">
                      {openingBookId === book.id && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                      {r.orderRef || book.id.slice(0, 8)}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">{book.child_name || "-"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {book.torah_portion ? getPortionDisplay(book.torah_portion, lang) : "-"} · {langLabel(book.language)}
                    </p>
                  </div>
                  <StatusSelect book={book} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={r.productType} qty={r.quantity} />
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Truck className="w-3 h-3" /> {shippingSpeedLabel(book.shipping_data)}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{formatAddressLine(book.shipping_data) || "No address on file"}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectUser(book.user_id); }}
                      className="text-[11px] text-accent hover:underline"
                    >
                      {r.customer}
                    </button>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(r.placed), "MMM d, yyyy · h:mm a")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      <PaidCell r={r} />
                      {r.isPaid && r.amount != null && (
                        <p className="text-[10px] text-muted-foreground">
                          est. profit {money(Math.round((r.amount - r.cogs) * 100) / 100, currency)}
                        </p>
                      )}
                    </div>
                    <QuickActions book={book} compact />
                    <RowActions book={book} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── BOARD ── */
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {BOARD_LANES.map((lane) => {
              const laneRows = sorted.filter((r) => lane.statuses.includes(r.book.status));
              const laneRevenue = laneRows.reduce((s, r) => s + (r.isPaid ? (r.amount || 0) : 0), 0);
              return (
                <div key={lane.key} className="w-[290px] shrink-0 rounded-2xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {lane.label}
                    </h3>
                    <span className="text-[10px] rounded-full bg-card border border-border px-1.5 py-0.5 text-muted-foreground">
                      {laneRows.length}
                    </span>
                  </div>
                  {laneRevenue > 0 && (
                    <p className="px-1 pb-2 text-[10px] text-muted-foreground tabular-nums">{money(laneRevenue, currency)}</p>
                  )}
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {laneRows.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground px-1 py-4 text-center">Empty</p>
                    ) : laneRows.map((r) => {
                      const book = r.book;
                      return (
                        <div
                          key={book.id}
                          onClick={() => onOpenBookEditor(book)}
                          className="rounded-xl border border-border bg-card p-2.5 shadow-soft-sm hover:border-accent/50 cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-semibold text-foreground truncate">{book.child_name || "-"}</p>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <QuickActions book={book} compact />
                              <RowActions book={book} />
                            </div>
                          </div>
                          <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                            {openingBookId === book.id && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                            {r.orderRef || book.id.slice(0, 8)}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {book.torah_portion ? getPortionDisplay(book.torah_portion, lang) : "-"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <TypeBadge type={r.productType} qty={r.quantity} />
                            <span className="text-[11px] font-medium tabular-nums text-foreground">
                              {r.amount != null ? money(r.amount, currency) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">{format(new Date(r.placed), "MMM d")}</span>
                            <StatusSelect book={book} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pagination (table + cards) ── */}
      {view !== "board" && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 250].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
