import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users, BookOpen, CalendarHeart, Mail, MapPin, Clock, Eye, Download,
  Search, LayoutGrid, List as ListIcon, RefreshCw, Copy, Star, ExternalLink,
  CreditCard, Trash2, ChevronLeft, ChevronRight, X,
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

type Props = {
  profiles: any[];
  books: any[];
  children: any[];
  subscriptions: any[];
  profilesLoading: boolean;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  setGeneratingBook: (b: any) => void;
  handleDownloadZip: (b: any) => void;
  updateBookStatus: { mutate: (v: { id: string; status: string }) => void };
  updateSubscriptionStatus: { mutate: (v: { id: string; status: string }) => void };
  refetchAll?: () => void;
};

const VIP_KEY = "admin_vip_user_ids";
const loadVip = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(VIP_KEY) || "[]")); } catch { return new Set(); }
};
const saveVip = (s: Set<string>) => localStorage.setItem(VIP_KEY, JSON.stringify([...s]));

const orderStatusColor = (s: string) => {
  if (s === "draft") return "text-muted-foreground bg-muted";
  if (s === "generating") return "text-amber-600 bg-amber-50";
  if (s === "ordered" || s === "printing") return "text-blue-600 bg-blue-50";
  if (s === "approved") return "text-purple-600 bg-purple-50";
  if (s === "shipped" || s === "delivered") return "text-green-600 bg-green-50";
  return "text-accent bg-accent/10";
};
const subStatusColor = (s: string) => {
  if (s === "active") return "text-green-600 bg-green-50";
  if (s === "paused") return "text-amber-600 bg-amber-50";
  return "text-muted-foreground bg-muted";
};

const bookTotal = (b: any): number => {
  const sd = b.shipping_data || {};
  return Number(sd.total ?? sd.amount ?? sd.price ?? 0) || 0;
};

export function AdminUsersTab({
  profiles, books, children, subscriptions, profilesLoading,
  selectedUserId, setSelectedUserId, setGeneratingBook, handleDownloadZip,
  updateBookStatus, updateSubscriptionStatus, refetchAll,
}: Props) {
  const [vip, setVip] = useState<Set<string>>(() => loadVip());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [subFilter, setSubFilter] = useState("all"); // all|active|canceled|none
  const [orderFilter, setOrderFilter] = useState("all"); // all|has|none
  const [joinedFilter, setJoinedFilter] = useState("all"); // all|7|30|90
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { setPage(1); }, [query, sort, subFilter, orderFilter, joinedFilter, pageSize]);

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
      const spend = ub.reduce((sum, b) => sum + bookTotal(b), 0);
      const hasActiveSub = us.some((s) => s.status === "active");
      const hasCanceledSub = us.some((s) => s.status === "canceled");
      return { profile: p, books: ub, subs: us, kids: uk, lastOrder, spend, hasActiveSub, hasCanceledSub };
    });
  }, [profiles, books, subscriptions, children]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff = joinedFilter === "all" ? 0 : now - Number(joinedFilter) * 86400000;
    return enriched.filter(({ profile, books: ub, subs, hasActiveSub, hasCanceledSub }) => {
      if (q) {
        const hay = `${profile.full_name || ""} ${profile.email || ""} ${profile.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (subFilter === "active" && !hasActiveSub) return false;
      if (subFilter === "canceled" && !hasCanceledSub) return false;
      if (subFilter === "none" && subs.length > 0) return false;
      if (orderFilter === "has" && ub.length === 0) return false;
      if (orderFilter === "none" && ub.length > 0) return false;
      if (cutoff && new Date(profile.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [enriched, query, subFilter, orderFilter, joinedFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort) {
        case "oldest": return +new Date(a.profile.created_at) - +new Date(b.profile.created_at);
        case "name": return (a.profile.full_name || a.profile.email || "").localeCompare(b.profile.full_name || b.profile.email || "");
        case "books": return b.books.length - a.books.length;
        case "subs": return b.subs.length - a.subs.length;
        case "spend": return b.spend - a.spend;
        default: return +new Date(b.profile.created_at) - +new Date(a.profile.created_at);
      }
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.profile.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.profile.id));
      else pageRows.forEach((r) => next.add(r.profile.id));
      return next;
    });
  };

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const exportCsv = () => {
    const rows = (selected.size ? enriched.filter((e) => selected.has(e.profile.id)) : sorted);
    const header = ["id", "name", "email", "joined", "books", "subs", "children", "spend", "vip"];
    const csv = [header.join(",")].concat(
      rows.map((r) => [
        r.profile.id,
        JSON.stringify(r.profile.full_name || ""),
        JSON.stringify(r.profile.email || ""),
        r.profile.created_at,
        r.books.length,
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
    const addresses = ub
      .filter((b: any) => b.shipping_data)
      .map((b: any) => b.shipping_data)
      .filter((a: any, i: number, arr: any[]) => i === arr.findIndex((x: any) => x.street === a.street && x.city === a.city));
    const payments = ub.filter((b: any) => b.order_number || bookTotal(b) > 0);
    const activity = [
      ...ub.map((b: any) => ({ ts: b.created_at, type: "order", label: `Order ${b.order_number || b.id.slice(0, 6)} · ${b.status}`, icon: BookOpen })),
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            {[
              { label: "Books", value: ub.length, icon: BookOpen },
              { label: "Subs", value: us.length, icon: CalendarHeart },
              { label: "Children", value: uk.length, icon: Users },
              { label: "Spend", value: `$${spend.toFixed(2)}`, icon: CreditCard },
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
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
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
                        <p className="text-xs font-semibold text-primary truncate">{book.torah_portion || "Torah Tale"} {book.order_number && <span className="text-muted-foreground font-mono">#{book.order_number}</span>}</p>
                        <p className="text-[10px] text-muted-foreground">For {book.child_name || "—"} · {format(new Date(book.created_at), "MMM d, yyyy")}{bookTotal(book) ? ` · $${bookTotal(book).toFixed(2)}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={book.status} onValueChange={(s) => updateBookStatus.mutate({ id: book.id, status: s })}>
                        <SelectTrigger className={`h-7 text-[10px] px-2 w-[110px] ${orderStatusColor(book.status)} border-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["draft", "generating", "approved", "ordered", "printing", "shipped", "delivered"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {book.pages_data && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setGeneratingBook(book)}><Eye className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownloadZip(book)}><Download className="w-3 h-3" /></Button>
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
                      <p className="text-xs font-semibold text-primary truncate">Parashah Club — {sub.child_name || "Child"}</p>
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
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payment records. Charges are processed by Shopify — totals shown when stored on the order.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left p-2">Date</th><th className="text-left p-2">Order</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Method</th><th className="text-left p-2">Status</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="p-2 text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                        <td className="p-2 font-mono">{p.order_number || "—"}</td>
                        <td className="p-2 font-semibold text-primary">${bookTotal(p).toFixed(2)}</td>
                        <td className="p-2 text-muted-foreground">Shopify</td>
                        <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${orderStatusColor(p.status)}`}>{p.status}</span></td>
                        <td className="p-2">
                          {p.order_number && (
                            <a href={`https://admin.shopify.com/orders?query=${encodeURIComponent(p.order_number)}`} target="_blank" rel="noopener" className="text-accent hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="glass rounded-2xl border border-border p-5">
            {addresses.length === 0 ? <p className="text-xs text-muted-foreground">No shipping addresses on file.</p> : (
              <div className="space-y-2">
                {addresses.map((addr: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-xl p-3 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-accent mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary">{addr.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{addr.street}{addr.apt ? `, ${addr.apt}` : ""}, {addr.city}, {addr.state} {addr.zip} {addr.country || ""}</p>
                      {addr.phone && <p className="text-[10px] text-muted-foreground">{addr.phone}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(`${addr.fullName}\n${addr.street}${addr.apt ? ", " + addr.apt : ""}\n${addr.city}, ${addr.state} ${addr.zip}`, "Address copied")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  }

  // ── List view ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="glass rounded-2xl border border-border p-3 flex flex-wrap gap-2 items-center sticky top-20 z-10 backdrop-blur">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, id..." className="pl-9 h-9 text-xs" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="text-xs">Newest</SelectItem>
            <SelectItem value="oldest" className="text-xs">Oldest</SelectItem>
            <SelectItem value="name" className="text-xs">Name A–Z</SelectItem>
            <SelectItem value="books" className="text-xs">Most books</SelectItem>
            <SelectItem value="subs" className="text-xs">Most subs</SelectItem>
            <SelectItem value="spend" className="text-xs">Most spend</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subFilter} onValueChange={setSubFilter}>
          <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All subs</SelectItem>
            <SelectItem value="active" className="text-xs">Active sub</SelectItem>
            <SelectItem value="canceled" className="text-xs">Canceled</SelectItem>
            <SelectItem value="none" className="text-xs">No sub</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderFilter} onValueChange={setOrderFilter}>
          <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All orders</SelectItem>
            <SelectItem value="has" className="text-xs">Has orders</SelectItem>
            <SelectItem value="none" className="text-xs">No orders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={joinedFilter} onValueChange={setJoinedFilter}>
          <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Any time</SelectItem>
            <SelectItem value="7" className="text-xs">Last 7d</SelectItem>
            <SelectItem value="30" className="text-xs">Last 30d</SelectItem>
            <SelectItem value="90" className="text-xs">Last 90d</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}><ListIcon className="w-3.5 h-3.5" /></button>
          <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
        </div>
        {refetchAll && (
          <Button variant="ghost" size="sm" onClick={refetchAll} className="h-9 w-9 p-0"><RefreshCw className="w-3.5 h-3.5" /></Button>
        )}
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
        <div className="text-center py-12 text-muted-foreground text-sm">No users match these filters.</div>
      ) : view === "table" ? (
        <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-3 w-8"><Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} /></th>
                  {["User", "Joined", "Children", "Books", "Subs", "Spend", "Last order", ""].map((h) => (
                    <th key={h} className="text-left p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ profile, books: ub, subs, kids, spend, lastOrder, hasActiveSub }) => {
                  const isVip = vip.has(profile.id);
                  const kidPhoto = kids.find((k: any) => k.photo_url)?.photo_url;
                  return (
                    <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="p-3"><Checkbox checked={selected.has(profile.id)} onCheckedChange={() => {
                        setSelected((prev) => { const n = new Set(prev); n.has(profile.id) ? n.delete(profile.id) : n.add(profile.id); return n; });
                      }} /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center shrink-0">
                            {kidPhoto ? <img src={kidPhoto} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-accent">{(profile.full_name || profile.email || "U").slice(0, 2).toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-primary truncate">{profile.full_name || "—"}</p>
                              {isVip && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                              {hasActiveSub && <span className="text-[9px] text-green-700 bg-green-50 px-1.5 rounded">sub</span>}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(profile.created_at), "MMM d, yyyy")}</td>
                      <td className="p-3 text-xs text-foreground font-semibold">{kids.length}</td>
                      <td className="p-3 text-xs text-foreground font-semibold">{ub.length}</td>
                      <td className="p-3 text-xs text-foreground font-semibold">{subs.length}</td>
                      <td className="p-3 text-xs text-foreground font-semibold">${spend.toFixed(0)}</td>
                      <td className="p-3 text-[10px] text-muted-foreground whitespace-nowrap">{lastOrder ? formatDistanceToNow(new Date(lastOrder.created_at)) + " ago" : "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => setSelectedUserId(profile.id)}>
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">⋯</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => window.location.href = `mailto:${profile.email}`}><Mail className="w-3 h-3 mr-2" />Email</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copy(profile.email || "", "Email copied")}><Copy className="w-3 h-3 mr-2" />Copy email</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copy(profile.id, "ID copied")}><Copy className="w-3 h-3 mr-2" />Copy ID</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleVip(profile.id)}><Star className="w-3 h-3 mr-2" />{isVip ? "Remove VIP" : "Tag VIP"}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageRows.map(({ profile, books: ub, subs, kids, spend, hasActiveSub }) => {
            const isVip = vip.has(profile.id);
            const kidPhoto = kids.find((k: any) => k.photo_url)?.photo_url;
            return (
              <div key={profile.id} className="glass rounded-2xl border border-border p-4 hover-lift cursor-pointer group" onClick={() => setSelectedUserId(profile.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center ring-2 ring-accent/10">
                    {kidPhoto ? <img src={kidPhoto} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-accent">{(profile.full_name || profile.email || "U").slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-primary truncate">{profile.full_name || "—"}</p>
                      {isVip && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(profile.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <Checkbox checked={selected.has(profile.id)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => {
                    setSelected((prev) => { const n = new Set(prev); n.has(profile.id) ? n.delete(profile.id) : n.add(profile.id); return n; });
                  }} />
                </div>
                <div className="grid grid-cols-4 gap-1 mt-4 text-center">
                  {[
                    { l: "Kids", v: kids.length },
                    { l: "Books", v: ub.length },
                    { l: "Subs", v: subs.length },
                    { l: "Spend", v: `$${spend.toFixed(0)}` },
                  ].map((x) => (
                    <div key={x.l} className="bg-muted/30 rounded-lg py-1.5">
                      <div className="text-xs font-bold text-primary">{x.v}</div>
                      <div className="text-[9px] uppercase text-muted-foreground">{x.l}</div>
                    </div>
                  ))}
                </div>
                {hasActiveSub && <div className="mt-3 text-[9px] text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block">Active subscription</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[80px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100].map((n) => <SelectItem key={n} value={String(n)} className="text-xs">{n} / page</SelectItem>)}
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
