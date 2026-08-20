import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, X, SlidersHorizontal, Table2, LayoutGrid, Columns3, ArrowUp, ArrowDown,
  ChevronsUpDown, MoreHorizontal, Eye, User, Copy, ExternalLink, CalendarHeart,
  Gift, AlertCircle, BookOpen, Clock, MapPin,
  CreditCard, Package, ArrowRightLeft, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatAddressLine } from "@/lib/orderShipping";
import { orderStatusColor, STATUS_LABEL } from "@/lib/orderStatus";
import { supabase } from "@/integrations/supabase/client";
import { SHOPIFY_SELLING_PLAN_IDS } from "@/lib/shopify";
import { SUB_STATUSES, SUB_LABEL, subStatusColor, subStatusIcon } from "@/lib/subStatus";

const LANG_LABEL: Record<string, string> = { en: "English", he: "Hebrew", yi: "Yiddish" };
const langLabel = (l?: string | null) => {
  if (!l) return "English";
  const k = String(l).toLowerCase();
  return LANG_LABEL[k] || LANG_LABEL[k.slice(0, 2)] || l;
};

const usd = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

/** Monthly run-rate, so weekly and monthly plans can be compared and summed. */
const monthlyValue = (sub: any) => {
  const price = Number(sub.price_per_week) || 0;
  return /week/i.test(sub.frequency || "") ? price * 4.33 : price;
};

const dateOnly = (d?: string | null) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`) : null);

type SortKey = "next" | "created" | "customer" | "child" | "price" | "credit" | "status" | "books";
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  next: "Next release",
  created: "Started",
  customer: "Customer",
  child: "Child",
  price: "Plan value",
  credit: "Book credit",
  books: "Books released",
  status: "Status",
};

const BOARD_LANES: { key: string; label: string; hint: string; statuses: string[] }[] = [
  { key: "active", label: "Active", hint: "billing and releasing", statuses: ["active"] },
  { key: "paused", label: "Paused", hint: "no billing, no release", statuses: ["paused"] },
  { key: "canceled", label: "Canceled", hint: "ended", statuses: ["canceled"] },
];

interface Props {
  subscriptions: any[];
  subscriptionsLoading: boolean;
  profiles: any[];
  books: any[];
  children: any[];
  updateSubscriptionStatus: any;
  onSelectUser: (userId: string) => void;
  /** Opens the read-only order dialog for a book this subscription produced. */
  onOpenOrderDetail: (book: any) => void;
  /** Opens the book generation/editing modal (fetches the full row first). */
  onOpenBookEditor: (book: any) => void;
}

export function AdminSubsTab({
  subscriptions, subscriptionsLoading, profiles, books, children,
  updateSubscriptionStatus, onSelectUser, onOpenOrderDetail, onOpenBookEditor,
}: Props) {
  const [view, setView] = useState<"table" | "cards" | "board">("table");

  /* Move a retired weekly contract onto the Parsha Series. This changes what a
     real customer is billed, so it confirms first, and it is SHOPIFY that sets
     the new price — the edge function commits a subscription draft against the
     monthly selling plan and only mirrors `frequency` locally once that lands. */
  const [migrating, setMigrating] = useState<string | null>(null);
  const migrateToParshaSeries = async (sub: any) => {
    const planId = SHOPIFY_SELLING_PLAN_IDS.monthly;
    if (!planId) { toast.error("No monthly selling plan id is configured."); return; }
    const who = sub.child_name ? `${sub.child_name}'s` : "this";
    if (!window.confirm(
      `Move ${who} subscription from weekly to the Parsha Series?\n\n` +
      `Shopify will re-price the contract to the monthly plan and bill it monthly ` +
      `from the next billing date. Tell the customer before you do this.`
    )) return;
    setMigrating(sub.id);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-admin-data", {
        body: { action: "subscription-migrate", subscriptionId: sub.id, sellingPlanId: planId },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Migration failed");
        return;
      }
      toast.success(`Moved to the Parsha Series — billing ${String((data as any)?.billingPolicy?.interval || "monthly").toLowerCase()}.`);
    } finally {
      setMigrating(null);
    }
  };
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | needs_action | due | <status>
  const [freqFilter, setFreqFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("next");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  /* ── enrich ── */
  const rows = useMemo(() => subscriptions.map((sub: any) => {
    const profile = profiles.find((p: any) => p.id === sub.user_id);
    const kid = children.find((c: any) => c.id === sub.child_id);
    // Books the Monday release job minted for this subscription — matched on the
    // subscription id it stamps into story_data.
    const subBooks = books
      .filter((b: any) => b.subscription_id === sub.id)
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));
    const credit = Number(sub.books_remaining) || 0;
    const nextRelease = dateOnly(sub.next_release_date);
    const nextBilling = sub.next_billing_at ? new Date(sub.next_billing_at) : null;
    const overdue = sub.status === "active" && credit > 0 &&
      (!nextRelease || nextRelease.getTime() < today.getTime());
    // An active plan with no Shopify contract will never bill again — it looks
    // healthy in the table but silently stops earning.
    const noContract = sub.status === "active" && !sub.shopify_contract_id;
    return {
      sub, profile, kid, subBooks, credit, nextRelease, nextBilling, overdue, noContract,
      needsAction: overdue || noContract,
      customer: profile?.full_name || profile?.email || (sub.user_id || "").slice(0, 8),
      created: new Date(sub.created_at).getTime(),
      nextTs: nextRelease ? nextRelease.getTime() : Number.MAX_SAFE_INTEGER,
      mrr: sub.status === "active" ? monthlyValue(sub) : 0,
    };
  }), [subscriptions, profiles, children, books, today]);

  /* ── filter ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const s = r.sub;
      if (q) {
        const hay = [
          s.child_name, s.art_style, s.frequency, s.status, s.id,
          r.customer, r.profile?.email, r.kid?.name, s.shopify_contract_id,
          formatAddressLine(s.shipping_data),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "needs_action") { if (!r.needsAction) return false; }
      else if (statusFilter === "due") {
        if (!(r.nextRelease && differenceInCalendarDays(r.nextRelease, today) <= 7 && s.status === "active")) return false;
      }
      else if (statusFilter === "credit") { if (r.credit <= 0) return false; }
      else if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (freqFilter !== "all" && String(s.frequency || "").toLowerCase() !== freqFilter) return false;
      if (langFilter !== "all" && String(s.language || "en").toLowerCase().slice(0, 2) !== langFilter) return false;
      return true;
    });
  }, [rows, query, statusFilter, freqFilter, langFilter, today]);

  /* ── sort ── */
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r: any) => {
      switch (sortKey) {
        case "created": return r.created;
        case "customer": return r.customer.toLowerCase();
        case "child": return (r.sub.child_name || "").toLowerCase();
        case "price": return monthlyValue(r.sub);
        case "credit": return r.credit;
        case "books": return r.subBooks.length;
        case "status": return SUB_STATUSES.indexOf(r.sub.status) === -1 ? 9 : SUB_STATUSES.indexOf(r.sub.status);
        default: return r.nextTs;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av === bv) return b.created - a.created;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = view === "board"
    ? sorted
    : sorted.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "customer" || key === "child" || key === "next" ? "asc" : "desc"); }
    setPage(1);
  };

  const filtersActive = !!query || statusFilter !== "all" || freqFilter !== "all" || langFilter !== "all";
  const clearFilters = () => {
    setQuery(""); setStatusFilter("all"); setFreqFilter("all"); setLangFilter("all"); setPage(1);
  };

  const shownMrr = filtered.reduce((s, r) => s + r.mrr, 0);
  const frequencies = useMemo(
    () => [...new Set(subscriptions.map((s: any) => String(s.frequency || "").toLowerCase()).filter(Boolean))],
    [subscriptions],
  );

  const chips = useMemo(() => {
    const count = (f: (r: any) => boolean) => rows.filter(f).length;
    return [
      { value: "all", label: "All", count: rows.length },
      { value: "needs_action", label: "Needs action", count: count((r) => r.needsAction) },
      { value: "due", label: "Due within 7d", count: count((r) => r.sub.status === "active" && r.nextRelease && differenceInCalendarDays(r.nextRelease, today) <= 7) },
      { value: "credit", label: "Has credit", count: count((r) => r.credit > 0) },
      ...SUB_STATUSES.map((s) => ({ value: s as string, label: SUB_LABEL[s], count: count((r) => r.sub.status === s) })),
    ];
  }, [rows, today]);

  /* ────────────────────────── shared bits ────────────────────────── */

  const StatusSelect = ({ sub }: { sub: any }) => (
    <Select
      value={sub.status}
      onValueChange={(v) => {
        updateSubscriptionStatus.mutate({ id: sub.id, status: v });
        toast.success(`Subscription ${SUB_LABEL[v] || v}`);
      }}
    >
      {/* Same trigger overrides as the orders table: the base component is
          full-width and line-clamps its span, which breaks the pill's flex row. */}
      <SelectTrigger
        className="h-7 w-auto gap-1 justify-start text-[11px] border-0 bg-transparent shadow-none px-0 focus:ring-0 focus:ring-offset-0 [&>span]:!inline-flex [&>span]:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap ${subStatusColor(sub.status)}`}>
          {subStatusIcon(sub.status)}
          <span className="font-medium">{SUB_LABEL[sub.status] || sub.status}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {SUB_STATUSES.map((s) => <SelectItem key={s} value={s}>{SUB_LABEL[s]}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const QuickActions = ({ r, compact = false }: { r: any; compact?: boolean }) => (
    <>
      <Button
        variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent"
        onClick={(e) => { e.stopPropagation(); onSelectUser(r.sub.user_id); }}
        title="View customer"
      >
        <Eye className="w-3.5 h-3.5" />
      </Button>
      {!compact && r.subBooks.length > 0 && (
        <Button
          variant="ghost" size="sm" className="h-7 w-7 p-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(expanded === r.sub.id ? null : r.sub.id); }}
          title={`${r.subBooks.length} book${r.subBooks.length > 1 ? "s" : ""} released`}
        >
          <BookOpen className="w-3.5 h-3.5" />
        </Button>
      )}
      {!compact && r.sub.shopify_customer_id && (
        <Button
          variant="ghost" size="sm" className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `https://admin.shopify.com/store/cnhtj8-x9/customers/${String(r.sub.shopify_customer_id).replace(/^gid:\/\/shopify\/Customer\//, "")}`,
              "_blank", "noopener,noreferrer",
            );
          }}
          title="Open the customer in Shopify"
        >
          <CreditCard className="w-3.5 h-3.5" />
        </Button>
      )}
    </>
  );

  const RowActions = ({ r }: { r: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()} title="Actions">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11px]">
          {r.sub.child_name || "Subscription"} · {SUB_LABEL[r.sub.status]}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelectUser(r.sub.user_id)}>
          <User className="w-3.5 h-3.5" /> View customer
        </DropdownMenuItem>
        {r.subBooks.length > 0 && (
          <DropdownMenuItem onClick={() => setExpanded(expanded === r.sub.id ? null : r.sub.id)}>
            <BookOpen className="w-3.5 h-3.5" /> {expanded === r.sub.id ? "Hide" : "Show"} released books ({r.subBooks.length})
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {SUB_STATUSES.filter((s) => s !== r.sub.status).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => {
              updateSubscriptionStatus.mutate({ id: r.sub.id, status: s });
              toast.success(`Subscription ${SUB_LABEL[s]}`);
            }}
          >
            {subStatusIcon(s)} Set {SUB_LABEL[s].toLowerCase()}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(r.sub.id); toast.success("Subscription id copied"); }}>
          <Copy className="w-3.5 h-3.5" /> Copy subscription id
        </DropdownMenuItem>
        {r.sub.shopify_customer_id && (
          <DropdownMenuItem
            onClick={() => window.open(
              `https://admin.shopify.com/store/cnhtj8-x9/customers/${String(r.sub.shopify_customer_id).replace(/^gid:\/\/shopify\/Customer\//, "")}`,
              "_blank", "noopener,noreferrer",
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in Shopify
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

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

  const NextRelease = ({ r }: { r: any }) => {
    if (r.sub.status !== "active") return <span className="text-[11px] text-muted-foreground">—</span>;
    if (!r.nextRelease) {
      return (
        <span className="text-[11px] text-muted-foreground">
          {r.credit > 0 ? <span className="text-amber-600">not scheduled</span> : "—"}
        </span>
      );
    }
    const days = differenceInCalendarDays(r.nextRelease, today);
    return (
      <span className="inline-flex flex-col">
        <span className="text-xs text-foreground whitespace-nowrap">{format(r.nextRelease, "MMM d, yyyy")}</span>
        <span className={`text-[10px] ${days < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {days < 0 ? `${-days}d overdue` : days === 0 ? "today" : `in ${days}d`}
        </span>
      </span>
    );
  };

  /** The books this subscription has already produced. */
  const ReleasedBooks = ({ r, cols }: { r: any; cols: number }) => (
    <tr className="bg-secondary/30 border-b border-border">
      <td colSpan={cols} className="p-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Books released by this subscription
        </p>
        <div className="space-y-1.5">
          {r.subBooks.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {b.torah_portion || "—"}{" "}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {b.shopify_order_name || b.order_number || b.id.slice(0, 8)}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(b.paid_at || b.created_at), "MMM d, yyyy")} · {b.child_name || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${orderStatusColor(b.status)}`}>
                  {STATUS_LABEL[b.status] || b.status}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Order details" onClick={() => onOpenOrderDetail(b)}>
                  <Package className="w-3.5 h-3.5" />
                </Button>
                {b.has_pages && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View & edit book" onClick={() => onOpenBookEditor(b)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );

  const Flags = ({ r }: { r: any }) => (
    <>
      {r.overdue && (
        <span className="inline-flex items-center gap-1 text-[9px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded" title="Paid book credit is past its release date">
          <AlertCircle className="w-2.5 h-2.5" /> release overdue
        </span>
      )}
      {r.noContract && (
        <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-1.5 py-0.5 rounded" title="Active but not linked to a Shopify contract — it will never bill again">
          <AlertCircle className="w-2.5 h-2.5" /> no contract
        </span>
      )}
    </>
  );

  /* ────────────────────────── render ────────────────────────── */

  if (subscriptionsLoading) {
    return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card shadow-soft-sm p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customer, child, style, address, contract…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-10 rounded-xl h-9"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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

        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
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

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />

          <Select value={freqFilter} onValueChange={(v) => { setFreqFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs rounded-xl"><SelectValue placeholder="Frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any frequency</SelectItem>
              {frequencies.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
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

          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(v) => { const [k, d] = v.split(":") as [SortKey, SortDir]; setSortKey(k); setSortDir(d); setPage(1); }}
          >
            <SelectTrigger className="h-8 w-[175px] text-xs rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).flatMap((k) => [
                <SelectItem key={`${k}:asc`} value={`${k}:asc`}>{SORT_LABEL[k]} ↑</SelectItem>,
                <SelectItem key={`${k}:desc`} value={`${k}:desc`}>{SORT_LABEL[k]} ↓</SelectItem>,
              ])}
            </SelectContent>
          </Select>

          {filtersActive && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            <span><span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length} subs</span>
            <span className="hidden sm:inline">
              active MRR <span className="font-semibold text-foreground tabular-nums">{usd(shownMrr)}</span>
            </span>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <CalendarHeart className="w-8 h-8 mx-auto opacity-40" />
          <p>{rows.length === 0 ? "No subscriptions yet." : "No subscriptions match these filters."}</p>
          {filtersActive && <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>
      ) : view === "table" ? (
        <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-secondary/70 backdrop-blur">
                  <SortHeader label="Customer" k="customer" />
                  <SortHeader label="Child" k="child" />
                  <SortHeader label="Plan" k="price" align="right" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-left">Ship to</th>
                  <SortHeader label="Credit" k="credit" align="right" />
                  <SortHeader label="Released" k="books" align="right" />
                  <SortHeader label="Next release" k="next" />
                  <SortHeader label="Started" k="created" />
                  <SortHeader label="Status" k="status" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
                  const sub = r.sub;
                  return [
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                      onClick={() => onSelectUser(sub.user_id)}
                      title="Open the customer card"
                      className="border-b border-border last:border-0 hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectUser(sub.user_id); }}
                          className="text-xs text-accent hover:underline text-left"
                        >
                          {r.customer}
                        </button>
                        {r.profile?.email && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{r.profile.email}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-0.5"><Flags r={r} /></div>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-medium text-foreground whitespace-nowrap">{sub.child_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {langLabel(sub.language)}{sub.art_style ? ` · ${sub.art_style}` : ""}
                        </p>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground tabular-nums">{usd(sub.price_per_week)}</span>
                        <span className="block text-[10px] text-muted-foreground capitalize">{sub.frequency || "—"}</span>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[170px]">
                        <span className="line-clamp-2">{formatAddressLine(sub.shipping_data) || "—"}</span>
                      </td>
                      <td className="p-3 text-right">
                        {r.credit > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            <Gift className="w-3 h-3 text-accent" />{r.credit}
                          </span>
                        ) : <span className="text-[11px] text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-right text-xs text-foreground tabular-nums">
                        {r.subBooks.length || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3"><NextRelease r={r} /></td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(sub.created_at), "MMM d, yy")}
                        <span className="block text-[10px] opacity-70">{formatDistanceToNow(new Date(sub.created_at))} ago</span>
                      </td>
                      <td className="p-3"><StatusSelect sub={sub} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <QuickActions r={r} />
                          <RowActions r={r} />
                        </div>
                      </td>
                    </motion.tr>,
                    expanded === sub.id && r.subBooks.length > 0
                      ? <ReleasedBooks key={`${sub.id}-books`} r={r} cols={10} />
                      : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pageRows.map((r, i) => {
            const sub = r.sub;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                onClick={() => onSelectUser(sub.user_id)}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft-sm hover:border-accent/50 hover:shadow-soft transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      Parsha Club — {sub.child_name || "Child"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {usd(sub.price_per_week)} / <span className="capitalize">{sub.frequency}</span> · {langLabel(sub.language)}
                      {sub.art_style ? ` · ${sub.art_style}` : ""}
                    </p>
                  </div>
                  <StatusSelect sub={sub} />
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { l: "Credit", v: r.credit || "—" },
                    { l: "Released", v: r.subBooks.length || "—" },
                    { l: "Monthly", v: usd(monthlyValue(sub)) },
                  ].map((x) => (
                    <div key={x.l} className="rounded-xl bg-secondary/50 py-1.5">
                      <div className="text-xs font-bold text-foreground">{x.v}</div>
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{x.l}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    Next release: {r.nextRelease ? format(r.nextRelease, "MMM d, yyyy") : "—"}
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{formatAddressLine(sub.shipping_data) || "No address on file"}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-1"><Flags r={r} /></div>

                {/* Weekly is retired — offer the move to the Parsha Series right
                    where the remaining ones are visible. */}
                {/week/i.test(String(sub.frequency || "")) && sub.status !== "canceled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={migrating === sub.id}
                    onClick={() => { void migrateToParshaSeries(sub); }}
                    className="w-full gap-1.5 rounded-xl text-[11px] h-8"
                  >
                    {migrating === sub.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    Move to Parsha Series
                  </Button>
                )}

                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <div className="min-w-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectUser(sub.user_id); }}
                      className="text-[11px] text-accent hover:underline truncate"
                    >
                      {r.customer}
                    </button>
                    <p className="text-[10px] text-muted-foreground">Started {format(new Date(sub.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <QuickActions r={r} compact />
                    <RowActions r={r} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {BOARD_LANES.map((lane) => {
              const laneRows = sorted.filter((r) => lane.statuses.includes(r.sub.status));
              const laneMrr = laneRows.reduce((s, r) => s + monthlyValue(r.sub), 0);
              return (
                <div key={lane.key} className="w-[290px] shrink-0 rounded-2xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{lane.label}</h3>
                    <span className="text-[10px] rounded-full bg-card border border-border px-1.5 py-0.5 text-muted-foreground">{laneRows.length}</span>
                  </div>
                  <p className="px-1 pb-2 text-[10px] text-muted-foreground">
                    {lane.hint}{laneMrr > 0 ? ` · ${usd(laneMrr)}/mo` : ""}
                  </p>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {laneRows.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground px-1 py-4 text-center">Empty</p>
                    ) : laneRows.map((r) => (
                      <div
                        key={r.sub.id}
                        onClick={() => onSelectUser(r.sub.user_id)}
                        className="rounded-xl border border-border bg-card p-2.5 shadow-soft-sm hover:border-accent/50 cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{r.sub.child_name || "—"}</p>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <QuickActions r={r} compact />
                            <RowActions r={r} />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{r.customer}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="capitalize">{usd(r.sub.price_per_week)} / {r.sub.frequency}</span>
                          <span>{r.subBooks.length} released</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {r.nextRelease ? format(r.nextRelease, "MMM d") : "—"}
                          </span>
                          {r.credit > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-accent">
                              <Gift className="w-2.5 h-2.5" />{r.credit}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1"><Flags r={r} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
