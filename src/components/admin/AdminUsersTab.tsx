import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users, BookOpen, CalendarHeart, Mail, MapPin, Clock, Eye, Download,
  Search, LayoutGrid, List as ListIcon, RefreshCw, Copy, Star, ExternalLink,
  CreditCard, ChevronLeft, ChevronRight, X, Columns3, ArrowUp, ArrowDown,
  ChevronsUpDown, SlidersHorizontal, MoreHorizontal, Maximize2, Loader2,
  Package, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { fetchUserOrdersSummary, formatMoney, type UserOrdersSummary } from "@/lib/shopifyAdmin";
import { getCogs, getProfit, getProductType } from "@/lib/bookCosts";
import { useAdminRevenue } from "@/hooks/useAdminRevenue";
import {
  ORDER_STATUSES, STATUS_LABEL, orderStatusColor, orderStatusIcon, orderNeedsAction,
} from "@/lib/orderStatus";
import { formatAddressLine, readOrderAddress } from "@/lib/orderShipping";

type Props = {
  profiles: any[];
  books: any[];
  children: any[];
  subscriptions: any[];
  profilesLoading: boolean;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  /** Opens the book generation/editing modal. Admin passes the full-row fetcher. */
  setGeneratingBook: (b: any) => void;
  handleDownloadZip: (b: any) => void;
  updateBookStatus: { mutate: (v: { id: string; status: string }) => void };
  updateSubscriptionStatus: { mutate: (v: { id: string; status: string }) => void };
  refetchAll?: () => void;
  /** Which book's ZIP is currently rendering, for the spinner. */
  downloadingZip?: string | null;
  /** Opens the read-only order dialog for one of the customer's books. */
  onOpenOrderDetail?: (b: any) => void;
};

const VIP_KEY = "admin_vip_user_ids";
const loadVip = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(VIP_KEY) || "[]")); } catch { return new Set(); }
};
const saveVip = (s: Set<string>) => localStorage.setItem(VIP_KEY, JSON.stringify([...s]));

const subStatusColor = (s: string) => {
  if (s === "active") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "paused") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  return "text-muted-foreground bg-muted";
};

/**
 * Fallback per-book total from the local row. Real revenue comes from Shopify
 * (see useAdminRevenue) — this only covers rows that were priced locally, and
 * returns 0 for everything else rather than pretending to know.
 */
const bookTotal = (b: any): number => {
  const sd = b.shipping_data || {};
  return Number(sd.total ?? sd.amount ?? sd.price ?? 0) || 0;
};

const usd = (n: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

/** Lifecycle lanes for the segments board — first match wins. */
const SEGMENTS: { key: string; label: string; hint: string; match: (e: any) => boolean }[] = [
  { key: "subscribers", label: "Subscribers", hint: "active Parsha Club", match: (e) => e.hasActiveSub },
  { key: "repeat", label: "Repeat buyers", hint: "2+ paid orders", match: (e) => e.paidCount >= 2 },
  { key: "one", label: "One-time buyers", hint: "exactly 1 paid order", match: (e) => e.paidCount === 1 },
  { key: "unpaid", label: "Started, never paid", hint: "has books, none paid", match: (e) => e.books.length > 0 },
  { key: "signups", label: "Signed up only", hint: "no books at all", match: () => true },
];
const segmentOf = (e: any) => SEGMENTS.find((s) => s.match(e))!.key;

type SortKey = "joined" | "name" | "children" | "books" | "subs" | "spend" | "last";
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  joined: "Joined", name: "Name", children: "Children", books: "Books",
  subs: "Subs", spend: "Spend", last: "Last order",
};

export function AdminUsersTab({
  profiles, books, children, subscriptions, profilesLoading,
  selectedUserId, setSelectedUserId, setGeneratingBook, handleDownloadZip,
  updateBookStatus, updateSubscriptionStatus, refetchAll,
  downloadingZip, onOpenOrderDetail,
}: Props) {
  const [vip, setVip] = useState<Set<string>>(() => loadVip());
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [segFilter, setSegFilter] = useState("all"); // all | vip | needs_action | <segment key>
  const [subFilter, setSubFilter] = useState("all"); // all|active|canceled|none
  const [orderFilter, setOrderFilter] = useState("all"); // all|has|none
  const [joinedFilter, setJoinedFilter] = useState("all"); // all|7|30|90
  const [view, setView] = useState<"table" | "grid" | "segments">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Real Shopify order totals for the currently-open user card (live, on demand).
  const [orderSummary, setOrderSummary] = useState<UserOrdersSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  /* Store-wide Shopify revenue — how the list knows what each customer really
     paid. The local books row has no price, so the old shipping_data.total
     lookup reported $0 for every customer and made "most spend" sort by nothing. */
  const revenueQuery = useAdminRevenue();
  const currency = revenueQuery.data?.currency || "USD";

  const spendByUser = useMemo(() => {
    const m = new Map<string, { spend: number; paidCount: number; lastPaidAt: number }>();
    for (const o of revenueQuery.data?.orders || []) {
      if (!o.paid) continue;
      const cur = m.get(o.userId) || { spend: 0, paidCount: 0, lastPaidAt: 0 };
      cur.spend += o.netUsd || 0;
      cur.paidCount += 1;
      const ts = o.placedAt ? new Date(o.placedAt).getTime() : 0;
      if (ts > cur.lastPaidAt) cur.lastPaidAt = ts;
      m.set(o.userId, cur);
    }
    return m;
  }, [revenueQuery.data]);

  useEffect(() => { setPage(1); }, [query, sortKey, sortDir, segFilter, subFilter, orderFilter, joinedFilter, pageSize]);

  useEffect(() => {
    if (!selectedUserId) { setOrderSummary(null); return; }
    let cancelled = false;
    setSummaryLoading(true); setOrderSummary(null);
    fetchUserOrdersSummary(selectedUserId)
      .then((s) => { if (!cancelled) setOrderSummary(s); })
      .catch(() => { if (!cancelled) setOrderSummary(null); })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; };
  }, [selectedUserId]);

  const toggleVip = (id: string) => {
    setVip((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveVip(next);
      return next;
    });
  };

  // Precompute per-user aggregates
  const enriched = useMemo(() => {
    const booksByUser: Record<string, any[]> = {};
    const subsByUser: Record<string, any[]> = {};
    const kidsByUser: Record<string, any[]> = {};
    for (const b of books) (booksByUser[b.user_id] ||= []).push(b);
    for (const s of subscriptions) (subsByUser[s.user_id] ||= []).push(s);
    for (const c of children) (kidsByUser[c.user_id] ||= []).push(c);

    return profiles.map((p: any) => {
      const ub = booksByUser[p.id] || [];
      const us = subsByUser[p.id] || [];
      const uk = kidsByUser[p.id] || [];
      const lastOrder = ub.length ? ub.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)) : null;
      const shop = spendByUser.get(p.id);
      // Shopify is authoritative; the local sum only stands in when the store
      // has no order for this customer at all.
      const spend = shop?.spend ?? ub.reduce((sum, b) => sum + bookTotal(b), 0);
      const paidCount = shop?.paidCount ?? 0;
      const hasActiveSub = us.some((s) => s.status === "active");
      const hasCanceledSub = us.some((s) => s.status === "canceled");
      const needsAction = ub.filter(orderNeedsAction).length;
      const entry = {
        profile: p, books: ub, subs: us, kids: uk, lastOrder, spend, paidCount,
        hasActiveSub, hasCanceledSub, needsAction,
        aov: paidCount ? spend / paidCount : 0,
        joined: new Date(p.created_at).getTime(),
        lastActivity: Math.max(
          shop?.lastPaidAt || 0,
          lastOrder ? new Date(lastOrder.created_at).getTime() : 0,
        ),
        name: p.full_name || p.email || "",
        segment: "",
      };
      entry.segment = segmentOf(entry);
      return entry;
    });
  }, [profiles, books, subscriptions, children, spendByUser]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff = joinedFilter === "all" ? 0 : now - Number(joinedFilter) * 86400000;
    return enriched.filter((e) => {
      const { profile, books: ub, subs, hasActiveSub, hasCanceledSub, kids } = e;
      if (q) {
        const hay = [
          profile.full_name, profile.email, profile.id,
          ...kids.map((k: any) => k.name),
          ...ub.map((b: any) => b.child_name),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (segFilter === "vip") { if (!vip.has(profile.id)) return false; }
      else if (segFilter === "needs_action") { if (!e.needsAction) return false; }
      else if (segFilter !== "all" && e.segment !== segFilter) return false;
      if (subFilter === "active" && !hasActiveSub) return false;
      if (subFilter === "canceled" && !hasCanceledSub) return false;
      if (subFilter === "none" && subs.length > 0) return false;
      if (orderFilter === "has" && ub.length === 0) return false;
      if (orderFilter === "none" && ub.length > 0) return false;
      if (cutoff && e.joined < cutoff) return false;
      return true;
    });
  }, [enriched, query, segFilter, subFilter, orderFilter, joinedFilter, vip]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (e: any) => {
      switch (sortKey) {
        case "name": return e.name.toLowerCase();
        case "children": return e.kids.length;
        case "books": return e.books.length;
        case "subs": return e.subs.length;
        case "spend": return e.spend;
        case "last": return e.lastActivity;
        default: return e.joined;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av === bv) return b.joined - a.joined;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = view === "segments" ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.profile.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.profile.id));
      else pageRows.forEach((r) => next.add(r.profile.id));
      return next;
    });
  };

  const filtersActive =
    !!query || segFilter !== "all" || subFilter !== "all" ||
    orderFilter !== "all" || joinedFilter !== "all";
  const clearFilters = () => {
    setQuery(""); setSegFilter("all"); setSubFilter("all");
    setOrderFilter("all"); setJoinedFilter("all"); setPage(1);
  };

  const shownSpend = filtered.reduce((s, e) => s + e.spend, 0);

  const chips = useMemo(() => ([
    { value: "all", label: "All", count: enriched.length },
    { value: "vip", label: "VIP", count: enriched.filter((e) => vip.has(e.profile.id)).length },
    { value: "needs_action", label: "Needs action", count: enriched.filter((e) => e.needsAction).length },
    ...SEGMENTS.map((s) => ({
      value: s.key, label: s.label, count: enriched.filter((e) => e.segment === s.key).length,
    })),
  ]), [enriched, vip]);

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const exportCsv = () => {
    const rows = (selected.size ? enriched.filter((e) => selected.has(e.profile.id)) : sorted);
    const header = ["id", "name", "email", "joined", "segment", "books", "paid_orders", "subs", "children", "spend", "vip"];
    const csv = [header.join(",")].concat(
      rows.map((r) => [
        r.profile.id,
        JSON.stringify(r.profile.full_name || ""),
        JSON.stringify(r.profile.email || ""),
        r.profile.created_at,
        r.segment,
        r.books.length,
        r.paidCount,
        r.subs.length,
        r.kids.length,
        r.spend.toFixed(2),
        vip.has(r.profile.id) ? "yes" : "no",
      ].join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} users`);
  };

  const copyEmails = () => {
    const rows = (selected.size ? enriched.filter((e) => selected.has(e.profile.id)) : sorted);
    const emails = rows.map((r) => r.profile.email).filter(Boolean).join(", ");
    if (!emails) { toast.error("No emails"); return; }
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${rows.length} emails`);
  };

  const bulkVip = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setVip((prev) => { const n = new Set(prev); ids.forEach((i) => n.add(i)); saveVip(n); return n; });
    toast.success(`Tagged ${ids.length} as VIP`);
  };

  // ── Detail view ─────────────────────────────────────────────
  if (selectedUserId) {
    const entry = enriched.find((e) => e.profile.id === selectedUserId);
    if (!entry) return null;
    const { profile, books: ub, subs: us, kids: uk, spend, lastOrder } = entry;
    const isVip = vip.has(profile.id);
    const firstKidPhoto = uk.find((k: any) => k.photo_url)?.photo_url;
    // Dedupe on the normalized address, so a wizard-shaped row (street/state)
    // and a Shopify-shaped one (address1/province) for the same place collapse
    // into one entry instead of showing twice — or, worse, all collapsing into
    // a single blank row because they all had an undefined `street`.
    const addresses = ub
      .filter((b: any) => b.shipping_data)
      .map((b: any) => ({ raw: b.shipping_data, line: formatAddressLine(b.shipping_data) }))
      .filter((a, i, arr) => a.line && i === arr.findIndex((x) => x.line === a.line));
    const payments = ub.filter((b: any) => b.order_number || bookTotal(b) > 0);
    const bookById = new Map<string, any>(ub.map((b: any) => [b.id, b]));
    const realOrders = orderSummary?.orders || [];
    const activity = [
      ...ub.map((b: any) => ({ ts: b.created_at, type: "order", label: `Order ${b.order_number || b.id.slice(0, 6)} · ${STATUS_LABEL[b.status] || b.status}`, icon: BookOpen })),
      ...us.map((s: any) => ({ ts: s.created_at, type: "sub", label: `Subscription ${s.status} · ${s.child_name || ""}`, icon: CalendarHeart })),
    ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 10);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="text-xs gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to all users
        </Button>

        {/* Header */}
        <div className="glass rounded-2xl border border-border p-6 shadow-soft-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center shrink-0 ring-2 ring-accent/20">
              {firstKidPhoto ? (
                <img src={firstKidPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-accent">
                  {(profile.full_name || profile.email || "U").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl font-bold text-primary">{profile.full_name || "No Name"}</h3>
                {isVip && (
                  <span className="text-[10px] gold-gradient text-primary-foreground font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> VIP
                  </span>
                )}
                <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {SEGMENTS.find((s) => s.key === entry.segment)?.label}
                </span>
                {entry.needsAction > 0 && (
                  <span className="text-[10px] rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {entry.needsAction} order{entry.needsAction > 1 ? "s" : ""} need attention
                  </span>
                )}
              </div>
              <button onClick={() => copy(profile.email || "")} className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {profile.email || "No email"}
              </button>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" /> Joined {format(new Date(profile.created_at), "MMM d, yyyy")} ({formatDistanceToNow(new Date(profile.created_at))} ago)
              </p>
              <button onClick={() => copy(profile.id, "User ID copied")} className="text-[10px] font-mono text-muted-foreground/70 hover:text-accent flex items-center gap-1 mt-1">
                <Copy className="w-2.5 h-2.5" /> {profile.id}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${profile.email}`}>
                <Mail className="w-3.5 h-3.5 mr-1" /> Email
              </Button>
              <Button size="sm" variant={isVip ? "gold" : "outline"} onClick={() => toggleVip(profile.id)}>
                <Star className="w-3.5 h-3.5 mr-1" /> {isVip ? "Remove VIP" : "Tag VIP"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(profile.id, "User ID copied")}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy ID
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-6">
            {[
              { label: "Books", value: ub.length, icon: BookOpen },
              { label: "Paid orders", value: entry.paidCount, icon: Package },
              { label: "Subs", value: us.length, icon: CalendarHeart },
              { label: "Children", value: uk.length, icon: Users },
              { label: "Spend", value: summaryLoading ? "…" : (orderSummary ? formatMoney({ amount: orderSummary.totalSpent, currency: orderSummary.currency || "USD" }) : usd(spend, currency)), icon: CreditCard },
              { label: "Last Order", value: lastOrder ? formatDistanceToNow(new Date(lastOrder.created_at)) : "—", icon: Clock },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/30 border border-border p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground"><s.icon className="w-3 h-3" />{s.label}</div>
                <div className="font-display text-lg font-bold text-primary mt-1 truncate">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="children">Children ({uk.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({ub.length})</TabsTrigger>
            <TabsTrigger value="subs">Subs ({us.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({orderSummary ? realOrders.length : payments.length})</TabsTrigger>
            <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="glass rounded-2xl border border-border p-5">
            <h4 className="font-display font-semibold text-sm text-primary mb-3">Recent activity</h4>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-muted/30 rounded-lg p-2.5">
                    <a.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="flex-1 text-primary">{a.label}</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(a.ts))} ago</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="children" className="glass rounded-2xl border border-border p-5">
            {uk.length === 0 ? <p className="text-xs text-muted-foreground">No children added.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uk.map((kid: any) => (
                  <div key={kid.id} className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                    {kid.photo_url ? (
                      <img src={kid.photo_url} alt={kid.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                        {kid.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{kid.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {kid.age ? `${kid.age}yo` : ""}{kid.gender ? ` · ${kid.gender}` : ""}{kid.art_style ? ` · ${kid.art_style}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="glass rounded-2xl border border-border p-5">
            {ub.length === 0 ? <p className="text-xs text-muted-foreground">No orders yet.</p> : (
              <div className="space-y-2">
                {ub.map((book: any) => (
                  <div key={book.id} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-accent" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">
                          {book.torah_portion || "Torah Tale"}{" "}
                          {book.order_number && <span className="text-muted-foreground font-mono">#{book.order_number}</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          For {book.child_name || "—"} · {getProductType(book)} · {format(new Date(book.paid_at || book.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select value={book.status} onValueChange={(s) => updateBookStatus.mutate({ id: book.id, status: s })}>
                        <SelectTrigger className={`h-7 text-[10px] px-2 w-[140px] ${orderStatusColor(book.status)} border-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {onOpenOrderDetail && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Order details" onClick={() => onOpenOrderDetail(book)}>
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      )}
                      {/* has_pages is the list-safe flag — pages_data is deliberately
                          not selected for the admin list, so testing it here hid
                          these buttons on every book. */}
                      {book.has_pages && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View & edit book" onClick={() => setGeneratingBook(book)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download images (ZIP)"
                            disabled={downloadingZip === book.id}
                            onClick={() => handleDownloadZip(book)}
                          >
                            {downloadingZip === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subs" className="glass rounded-2xl border border-border p-5">
            {us.length === 0 ? <p className="text-xs text-muted-foreground">No subscriptions.</p> : (
              <div className="space-y-2">
                {us.map((sub: any) => (
                  <div key={sub.id} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">Parsha Club — {sub.child_name || "Child"}</p>
                      <p className="text-[10px] text-muted-foreground">${sub.price_per_week}/{sub.frequency} · {sub.art_style} · next {sub.next_delivery_date}</p>
                    </div>
                    <Select value={sub.status} onValueChange={(s) => updateSubscriptionStatus.mutate({ id: sub.id, status: s })}>
                      <SelectTrigger className={`h-7 text-[10px] px-2 w-[110px] ${subStatusColor(sub.status)} border-0`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "paused", "canceled"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="glass rounded-2xl border border-border p-5">
            {summaryLoading ? (
              <p className="text-xs text-muted-foreground flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading live Shopify orders…</p>
            ) : !orderSummary ? (
              <p className="text-xs text-muted-foreground">Couldn't load live Shopify data right now.</p>
            ) : realOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No paid Shopify orders for this customer yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left p-2">Placed</th><th className="text-left p-2">Order</th><th className="text-left p-2">Paid</th>
                      <th className="text-left p-2">Est. COGS</th><th className="text-left p-2">Est. profit</th>
                      <th className="text-left p-2">Method</th><th className="text-left p-2">Payment</th><th className="text-left p-2">Fulfillment</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {realOrders.map((o) => {
                      const bk = bookById.get(o.bookId);
                      const cogs = bk ? getCogs(bk) : null;
                      const profit = (bk && o.subtotal) ? getProfit(o.subtotal.amount, bk) : null;
                      return (
                        <tr key={o.bookId} className="border-b border-border last:border-0">
                          <td className="p-2 text-muted-foreground whitespace-nowrap">{o.placedAt ? format(new Date(o.placedAt), "MMM d, yyyy") : "—"}</td>
                          <td className="p-2 font-mono">{o.orderName || "—"}</td>
                          <td className="p-2 font-semibold text-primary">{formatMoney(o.total)}{o.refunded && o.refunded.amount > 0 ? <span className="text-destructive font-normal"> (−{formatMoney(o.refunded)})</span> : null}</td>
                          <td className="p-2 text-muted-foreground">{cogs != null ? `$${cogs.toFixed(2)}` : "—"}</td>
                          <td className={`p-2 font-medium ${profit != null && profit < 0 ? "text-destructive" : "text-emerald-600"}`}>{profit != null ? `$${profit.toFixed(2)}` : "—"}</td>
                          <td className="p-2 text-muted-foreground capitalize">{o.payment || "Shopify"}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full text-[10px] capitalize bg-muted text-muted-foreground">{(o.financialStatus || "—").toLowerCase().replace(/_/g, " ")}</span></td>
                          <td className="p-2 text-muted-foreground capitalize">{(o.fulfillmentStatus || "—").toLowerCase().replace(/_/g, " ")}</td>
                          <td className="p-2">
                            {o.orderName && (
                              <a href={`https://admin.shopify.com/orders?query=${encodeURIComponent(o.orderName)}`} target="_blank" rel="noopener" className="text-accent hover:underline inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-2">Paid totals, payment method &amp; status are live from Shopify. COGS/profit are estimates from production + AI costs.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="glass rounded-2xl border border-border p-5">
            {addresses.length === 0 ? <p className="text-xs text-muted-foreground">No shipping addresses on file.</p> : (
              <div className="space-y-2">
                {addresses.map((addr, i: number) => {
                  const a = readOrderAddress(addr.raw);
                  const name = [a.firstName, a.lastName].filter(Boolean).join(" ");
                  return (
                    <div key={i} className="bg-muted/30 rounded-xl p-3 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-accent mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary">{name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{addr.line}</p>
                        {a.phone && <p className="text-[10px] text-muted-foreground">{a.phone}</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(`${name}\n${addr.line}`, "Address copied")}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  }

  /* ────────────────────────── list-view pieces ────────────────────────── */

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

  // Sizes are spelled out rather than interpolated — Tailwind only ships the
  // classes it can see in the source, so `w-${n}` would compile to nothing.
  const Avatar = ({ e, size = "sm" }: { e: any; size?: "sm" | "lg" }) => {
    const photo = e.kids.find((k: any) => k.photo_url)?.photo_url;
    const box = size === "lg" ? "w-12 h-12" : "w-8 h-8";
    return (
      <div className={`${box} rounded-full overflow-hidden bg-accent/10 flex items-center justify-center shrink-0 ring-2 ring-accent/10`}>
        {photo
          ? <img src={photo} alt="" className="w-full h-full object-cover" />
          : <span className={`font-bold text-accent ${size === "lg" ? "text-sm" : "text-[10px]"}`}>
              {(e.profile.full_name || e.profile.email || "U").slice(0, 2).toUpperCase()}
            </span>}
      </div>
    );
  };

  const UserActions = ({ e }: { e: any }) => {
    const isVip = vip.has(e.profile.id);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(ev) => ev.stopPropagation()} title="Actions">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs" onClick={(ev) => ev.stopPropagation()}>
          <DropdownMenuItem onClick={() => setSelectedUserId(e.profile.id)}><Eye className="w-3 h-3 mr-2" />Open customer card</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = `mailto:${e.profile.email}`}><Mail className="w-3 h-3 mr-2" />Email</DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(e.profile.email || "", "Email copied")}><Copy className="w-3 h-3 mr-2" />Copy email</DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(e.profile.id, "ID copied")}><Copy className="w-3 h-3 mr-2" />Copy ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toggleVip(e.profile.id)}><Star className="w-3 h-3 mr-2" />{isVip ? "Remove VIP" : "Tag VIP"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const LastOrderCell = ({ e }: { e: any }) => {
    if (!e.lastOrder) return <span className="text-[11px] text-muted-foreground">—</span>;
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] w-fit ${orderStatusColor(e.lastOrder.status)}`}>
          {orderStatusIcon(e.lastOrder.status)}
          {STATUS_LABEL[e.lastOrder.status] || e.lastOrder.status}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(e.lastOrder.created_at))} ago
        </span>
      </span>
    );
  };

  // ── List view ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card shadow-soft-sm p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, child, id…"
              className="pl-10 h-9 rounded-xl"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex rounded-xl border border-border bg-secondary/40 p-0.5 self-start">
            {[
              { key: "table" as const, icon: ListIcon, label: "Table" },
              { key: "grid" as const, icon: LayoutGrid, label: "Cards" },
              { key: "segments" as const, icon: Columns3, label: "Segments" },
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

          {refetchAll && (
            <Button variant="ghost" size="sm" onClick={refetchAll} className="h-9 w-9 p-0 self-start" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Segment chips */}
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.value}
              onClick={() => { setSegFilter(c.value); setPage(1); }}
              className={`rounded-full px-2.5 py-1 text-[11px] border transition-colors ${
                segFilter === c.value
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

          <Select value={subFilter} onValueChange={setSubFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All subs</SelectItem>
              <SelectItem value="active" className="text-xs">Active sub</SelectItem>
              <SelectItem value="canceled" className="text-xs">Canceled</SelectItem>
              <SelectItem value="none" className="text-xs">No sub</SelectItem>
            </SelectContent>
          </Select>

          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All orders</SelectItem>
              <SelectItem value="has" className="text-xs">Has orders</SelectItem>
              <SelectItem value="none" className="text-xs">No orders</SelectItem>
            </SelectContent>
          </Select>

          <Select value={joinedFilter} onValueChange={setJoinedFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Any time</SelectItem>
              <SelectItem value="7" className="text-xs">Last 7d</SelectItem>
              <SelectItem value="30" className="text-xs">Last 30d</SelectItem>
              <SelectItem value="90" className="text-xs">Last 90d</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(v) => { const [k, d] = v.split(":") as [SortKey, SortDir]; setSortKey(k); setSortDir(d); }}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).flatMap((k) => [
                <SelectItem key={`${k}:desc`} value={`${k}:desc`} className="text-xs">{SORT_LABEL[k]} ↓</SelectItem>,
                <SelectItem key={`${k}:asc`} value={`${k}:asc`} className="text-xs">{SORT_LABEL[k]} ↑</SelectItem>,
              ])}
            </SelectContent>
          </Select>

          {filtersActive && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            {revenueQuery.isError && <span className="text-destructive">Shopify spend unavailable</span>}
            <span><span className="font-semibold text-foreground">{filtered.length}</span> of {enriched.length} users</span>
            <span className="hidden sm:inline">
              spend <span className="font-semibold text-foreground tabular-nums">{usd(shownSpend, currency)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="glass rounded-2xl border border-accent/30 p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-3 h-3 mr-1" />Export CSV</Button>
          <Button size="sm" variant="outline" onClick={copyEmails}><Mail className="w-3 h-3 mr-1" />Copy emails</Button>
          <Button size="sm" variant="gold" onClick={bulkVip}><Star className="w-3 h-3 mr-1" />Tag VIP</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Content */}
      {profilesLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <Users className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm">No users match these filters.</p>
          {filtersActive && <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>
      ) : view === "table" ? (
        <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-secondary/70 backdrop-blur">
                  <th className="p-3 w-8"><Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} /></th>
                  <SortHeader label="User" k="name" />
                  <SortHeader label="Joined" k="joined" />
                  <SortHeader label="Children" k="children" />
                  <SortHeader label="Books" k="books" />
                  <SortHeader label="Subs" k="subs" />
                  <SortHeader label="Spend" k="spend" align="right" />
                  <SortHeader label="Last order" k="last" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e) => {
                  const { profile, books: ub, subs, kids, spend, hasActiveSub } = e;
                  const isVip = vip.has(profile.id);
                  return (
                    <tr
                      key={profile.id}
                      onClick={() => setSelectedUserId(profile.id)}
                      title="Open customer card"
                      className="border-b border-border last:border-0 hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3" onClick={(ev) => ev.stopPropagation()}>
                        <Checkbox checked={selected.has(profile.id)} onCheckedChange={() => {
                          setSelected((prev) => { const n = new Set(prev); n.has(profile.id) ? n.delete(profile.id) : n.add(profile.id); return n; });
                        }} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar e={e} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-primary truncate">{profile.full_name || "—"}</p>
                              {isVip && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                              {hasActiveSub && <span className="text-[9px] text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950 px-1.5 rounded">sub</span>}
                              {e.needsAction > 0 && (
                                <span className="text-[9px] text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-1.5 rounded" title="Orders waiting on you">
                                  {e.needsAction}!
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(profile.created_at), "MMM d, yyyy")}
                        <span className="block text-[10px] opacity-70">{SEGMENTS.find((s) => s.key === e.segment)?.label}</span>
                      </td>
                      <td className="p-3 text-xs text-foreground font-semibold">{kids.length}</td>
                      <td className="p-3 text-xs text-foreground font-semibold">
                        {ub.length}
                        {e.paidCount > 0 && <span className="block text-[10px] font-normal text-muted-foreground">{e.paidCount} paid</span>}
                      </td>
                      <td className="p-3 text-xs text-foreground font-semibold">{subs.length}</td>
                      <td className="p-3 text-right">
                        {revenueQuery.isLoading ? <Skeleton className="h-3.5 w-10 ml-auto" /> : (
                          <>
                            <span className="text-xs font-semibold text-foreground tabular-nums">{usd(spend, currency)}</span>
                            {e.aov > 0 && <span className="block text-[10px] text-muted-foreground tabular-nums">{usd(e.aov, currency)} avg</span>}
                          </>
                        )}
                      </td>
                      <td className="p-3"><LastOrderCell e={e} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm" className="text-[11px] h-7"
                            onClick={(ev) => { ev.stopPropagation(); setSelectedUserId(profile.id); }}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <UserActions e={e} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageRows.map((e) => {
            const { profile, books: ub, subs, kids, spend, hasActiveSub } = e;
            const isVip = vip.has(profile.id);
            return (
              <div key={profile.id} className="glass rounded-2xl border border-border p-4 hover-lift cursor-pointer group" onClick={() => setSelectedUserId(profile.id)}>
                <div className="flex items-start gap-3">
                  <Avatar e={e} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-primary truncate">{profile.full_name || "—"}</p>
                      {isVip && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(profile.created_at), "MMM d, yyyy")} · {SEGMENTS.find((s) => s.key === e.segment)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <UserActions e={e} />
                    <Checkbox checked={selected.has(profile.id)} onCheckedChange={() => {
                      setSelected((prev) => { const n = new Set(prev); n.has(profile.id) ? n.delete(profile.id) : n.add(profile.id); return n; });
                    }} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-4 text-center">
                  {[
                    { l: "Kids", v: kids.length },
                    { l: "Books", v: ub.length },
                    { l: "Subs", v: subs.length },
                    { l: "Spend", v: usd(spend, currency) },
                  ].map((x) => (
                    <div key={x.l} className="bg-muted/30 rounded-lg py-1.5">
                      <div className="text-xs font-bold text-primary">{x.v}</div>
                      <div className="text-[9px] uppercase text-muted-foreground">{x.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {hasActiveSub && <span className="text-[9px] text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950 px-2 py-0.5 rounded">Active subscription</span>}
                  {e.needsAction > 0 && <span className="text-[9px] text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-2 py-0.5 rounded">{e.needsAction} order{e.needsAction > 1 ? "s" : ""} need attention</span>}
                  {e.lastOrder && (
                    <span className={`text-[9px] px-2 py-0.5 rounded ${orderStatusColor(e.lastOrder.status)}`}>
                      last: {STATUS_LABEL[e.lastOrder.status] || e.lastOrder.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── SEGMENTS BOARD ── */
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {SEGMENTS.map((seg) => {
              const laneRows = sorted.filter((e) => e.segment === seg.key);
              const laneSpend = laneRows.reduce((s, e) => s + e.spend, 0);
              return (
                <div key={seg.key} className="w-[280px] shrink-0 rounded-2xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{seg.label}</h3>
                    <span className="text-[10px] rounded-full bg-card border border-border px-1.5 py-0.5 text-muted-foreground">{laneRows.length}</span>
                  </div>
                  <p className="px-1 pb-2 text-[10px] text-muted-foreground">
                    {seg.hint}{laneSpend > 0 ? ` · ${usd(laneSpend, currency)}` : ""}
                  </p>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {laneRows.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground px-1 py-4 text-center">Empty</p>
                    ) : laneRows.map((e) => (
                      <div
                        key={e.profile.id}
                        onClick={() => setSelectedUserId(e.profile.id)}
                        className="rounded-xl border border-border bg-card p-2.5 shadow-soft-sm hover:border-accent/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar e={e} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-primary truncate">{e.profile.full_name || "—"}</p>
                              {vip.has(e.profile.id) && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{e.profile.email}</p>
                          </div>
                          <UserActions e={e} />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                          <span>{e.books.length} books · {e.kids.length} kids</span>
                          <span className="font-semibold text-foreground tabular-nums">{usd(e.spend, currency)}</span>
                        </div>
                        {e.needsAction > 0 && (
                          <span className="mt-1.5 inline-block text-[9px] text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                            {e.needsAction} need attention
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {view !== "segments" && sorted.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 250].map((n) => <SelectItem key={n} value={String(n)} className="text-xs">{n} / page</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-3 h-3" /></Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-3 h-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
