import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Baby, BookOpen, CalendarHeart,
  Eye, Package, Factory, Sparkles, CreditCard, Percent,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { getCogs, getProductType } from "@/lib/bookCosts";
import { PAGES_BY_TYPE } from "@/components/wizard/BookOptionsStep";

/* ── Fixed monthly vendor costs — editable, stored in site_settings ('finance'). ── */
const FIXED_VENDORS: { key: string; label: string; hint: string }[] = [
  { key: "monthly-supabase", label: "Supabase", hint: "database, auth & functions" },
  { key: "monthly-shopify", label: "Shopify", hint: "store plan" },
  { key: "monthly-google-ai", label: "Google AI", hint: "Gemini image credits" },
  { key: "monthly-anthropic", label: "Anthropic", hint: "Claude story credits" },
  { key: "monthly-openai", label: "OpenAI", hint: "image credits (fallback)" },
  { key: "monthly-resend", label: "Resend", hint: "auth & transactional email" },
  { key: "monthly-higgsfield", label: "Higgsfield", hint: "marketing images" },
  { key: "monthly-domains", label: "GoDaddy", hint: "domains & DNS" },
  { key: "monthly-other", label: "Other", hint: "anything else" },
];

const AI_COST_PER_PAGE_USD = 0.04;
const SHOPIFY_FEE_PCT = 0.029;
const SHOPIFY_FEE_FIXED = 0.30;

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt0 = (n: number) => n.toLocaleString();

const weekKey = (d: Date) => {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - day.getDay()); // week starts Sunday
  return day.toISOString().slice(0, 10);
};
const weekLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const lastNWeeks = (n: number) => {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    out.push(weekKey(d));
  }
  return [...new Set(out)];
};

interface Props {
  books: any[];
  profiles: any[];
  children: any[];
  subscriptions: any[];
}

const StatTile = ({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: "good" | "bad" }) => (
  <div className="rounded-2xl border border-border/50 bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={`w-4 h-4 ${tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-500" : "text-accent"}`} />
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p className={`mt-1.5 text-xl font-bold ${tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-500" : "text-foreground"}`}>{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const ChartCard = ({ title, children: body }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/50 bg-card p-4">
    <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
    <div className="h-44">{body}</div>
  </div>
);

export const AdminDashboardTab = ({ books, profiles, children, subscriptions }: Props) => {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  /* ── Revenue (exact, from Shopify) ── */
  const revenueQuery = useQuery({
    queryKey: ["admin-revenue-summary"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("shopify-admin-data", {
        body: { action: "revenue-summary" },
      });
      if (error) throw error;
      return data as { orders: any[]; totalRevenue: number; currency: string | null };
    },
  });

  /* ── Site views (first-party page_views table, last 30 days) ── */
  const viewsQuery = useQuery({
    queryKey: ["admin-page-views"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data, error } = await supabase
        .from("page_views" as never)
        .select("path, session_id, created_at")
        .gte("created_at", since)
        .limit(20000);
      if (error) throw error;
      return (data || []) as unknown as { path: string; session_id: string | null; created_at: string }[];
    },
  });

  /* ── Editable fixed monthly costs ── */
  const financeQuery = useQuery({
    queryKey: ["admin-finance-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").eq("category", "finance");
      const map: Record<string, string> = {};
      for (const r of data || []) map[(r as any).key] = (r as any).value;
      return map;
    },
  });
  const saveFixedCost = async (key: string, value: string) => {
    setSavingKey(key);
    await supabase.from("site_settings").upsert(
      { category: "finance", key, value: value || "0" } as never,
      { onConflict: "category,key" } as never,
    );
    setSavingKey(null);
    queryClient.invalidateQueries({ queryKey: ["admin-finance-settings"] });
  };

  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const orders = revenueQuery.data?.orders || [];
  const paidOrders = orders.filter((o) => o.paid);
  const revenue = revenueQuery.data?.totalRevenue ?? 0;

  /* ── Variable (per-order / per-book) vendor costs — estimates ── */
  const costs = useMemo(() => {
    let printify = 0;
    let shopifyFees = 0;
    for (const o of paidOrders) {
      const book = booksById.get(o.bookId);
      if (book) {
        const pt = getProductType(book);
        const ai = AI_COST_PER_PAGE_USD * ((PAGES_BY_TYPE as any)[pt] + 1);
        printify += Math.max(0, getCogs(book) - ai); // production only — AI counted per generated book below
      }
      if (o.totalUsd) shopifyFees += o.totalUsd * SHOPIFY_FEE_PCT + SHOPIFY_FEE_FIXED;
    }
    // AI spend happens per GENERATED book, paid or not.
    let ai = 0;
    let generated = 0;
    for (const b of books) {
      if (b.status === "draft" || b.status === "awaiting_payment") continue;
      generated += 1;
      const pt = getProductType(b);
      ai += AI_COST_PER_PAGE_USD * ((PAGES_BY_TYPE as any)[pt] + 1);
    }
    return { printify, shopifyFees, ai, generatedBooks: generated };
  }, [paidOrders, books, booksById]);

  const fixedMonthly = useMemo(() => {
    const m = financeQuery.data || {};
    return FIXED_VENDORS.reduce((sum, v) => sum + (parseFloat(m[v.key] || "0") || 0), 0);
  }, [financeQuery.data]);

  const monthsActive = useMemo(() => {
    const first = paidOrders.map((o) => +new Date(o.placedAt)).sort((a, b) => a - b)[0];
    if (!first) return 1;
    return Math.max(1, Math.ceil((Date.now() - first) / (30.44 * 864e5)));
  }, [paidOrders]);

  const variableCosts = costs.printify + costs.shopifyFees + costs.ai;
  const totalExpenses = variableCosts + fixedMonthly * monthsActive;
  const profit = revenue - totalExpenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  /* ── Chart data ── */
  const weeks = lastNWeeks(8);
  const revenueByWeek = useMemo(() => {
    const m = new Map(weeks.map((w) => [w, 0]));
    for (const o of paidOrders) {
      const k = weekKey(new Date(o.placedAt));
      if (m.has(k)) m.set(k, (m.get(k) || 0) + (o.netUsd || 0));
    }
    return weeks.map((w) => ({ week: weekLabel(w), revenue: Math.round((m.get(w) || 0) * 100) / 100 }));
  }, [paidOrders, weeks]);

  const booksByWeek = useMemo(() => {
    const m = new Map(weeks.map((w) => [w, 0]));
    for (const b of books) {
      const k = weekKey(new Date(b.created_at));
      if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
    }
    return weeks.map((w) => ({ week: weekLabel(w), books: m.get(w) || 0 }));
  }, [books, weeks]);

  const usersByWeek = useMemo(() => {
    const m = new Map(weeks.map((w) => [w, 0]));
    for (const p of profiles) {
      const k = weekKey(new Date(p.created_at));
      if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
    }
    return weeks.map((w) => ({ week: weekLabel(w), users: m.get(w) || 0 }));
  }, [profiles, weeks]);

  const viewsByDay = useMemo(() => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.push(d.toISOString().slice(0, 10));
    }
    const m = new Map(days.map((d) => [d, 0]));
    for (const v of viewsQuery.data || []) {
      const k = v.created_at.slice(0, 10);
      if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
    }
    return days.map((d) => ({ day: `${+d.slice(5, 7)}/${+d.slice(8, 10)}`, views: m.get(d) || 0 }));
  }, [viewsQuery.data]);

  const uniqueVisitors30d = useMemo(
    () => new Set((viewsQuery.data || []).map((v) => v.session_id || Math.random())).size,
    [viewsQuery.data],
  );

  /* ── Books / kids / subs stats ── */
  const bookStatusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.status, (m.get(b.status) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [books]);

  const kidStats = useMemo(() => {
    const boys = children.filter((c) => c.gender === "boy").length;
    const girls = children.filter((c) => c.gender === "girl").length;
    const brackets: [string, (a: number) => boolean][] = [
      ["0–1", (a) => a <= 1], ["2–3", (a) => a >= 2 && a <= 3], ["4–5", (a) => a >= 4 && a <= 5],
      ["6–8", (a) => a >= 6 && a <= 8], ["9–12", (a) => a >= 9 && a <= 12], ["13+", (a) => a >= 13],
    ];
    const byAge = brackets.map(([label, test]) => ({
      label,
      count: children.filter((c) => c.age != null && test(Number(c.age))).length,
    }));
    return { boys, girls, byAge, unknownAge: children.filter((c) => c.age == null).length };
  }, [children]);

  const subStats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const weekly = active.reduce((sum, s) => sum + (parseFloat(s.price_per_week) || 0), 0);
    return {
      active: active.length,
      paused: subscriptions.filter((s) => s.status === "paused").length,
      other: subscriptions.length - active.length - subscriptions.filter((s) => s.status === "paused").length,
      estMonthly: weekly * 4.33,
    };
  }, [subscriptions]);

  const loadingRevenue = revenueQuery.isLoading;
  const gold = "hsl(42 88% 55%)";
  const ink = "hsl(222 18% 28%)";

  return (
    <div className="space-y-6">
      {/* ═══ Money row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {loadingRevenue ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatTile icon={DollarSign} label="Revenue" value={fmt(revenue)} sub={`${paidOrders.length} paid orders`} />
            <StatTile icon={TrendingDown} label="Expenses (est.)" value={fmt(totalExpenses)} sub={`incl. ${fmt(fixedMonthly)}/mo fixed × ${monthsActive}mo`} tone="bad" />
            <StatTile icon={TrendingUp} label="Profit (est.)" value={fmt(profit)} tone={profit >= 0 ? "good" : "bad"} />
            <StatTile icon={Percent} label="Margin (est.)" value={`${margin.toFixed(1)}%`} tone={margin >= 0 ? "good" : "bad"} />
            <StatTile icon={CalendarHeart} label="Sub revenue (est.)" value={`${fmt(subStats.estMonthly)}/mo`} sub={`${subStats.active} active subs`} />
          </>
        )}
      </div>

      {/* ═══ Counters row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile icon={Users} label="Users" value={fmt0(profiles.length)} />
        <StatTile icon={Baby} label="Kids" value={fmt0(children.length)} sub={`${kidStats.boys} boys · ${kidStats.girls} girls`} />
        <StatTile icon={BookOpen} label="Books" value={fmt0(books.length)} sub={`${costs.generatedBooks} generated`} />
        <StatTile icon={Package} label="Orders" value={fmt0(paidOrders.length)} />
        <StatTile
          icon={Eye}
          label="Site views (30d)"
          value={viewsQuery.isLoading ? "…" : fmt0((viewsQuery.data || []).length)}
          sub={viewsQuery.isLoading ? undefined : `${fmt0(uniqueVisitors30d)} unique visitors`}
        />
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid lg:grid-cols-2 gap-3">
        <ChartCard title="Revenue by week">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByWeek} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="revenue" stroke={gold} fill={gold} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Site views by day (14d)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsByDay} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke={ink} fill={ink} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Books created by week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={booksByWeek} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="books" fill={gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="New users by week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usersByWeek} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 90%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" fill={ink} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ═══ Vendors / expenses ═══ */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Per-order vendor costs (computed)</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Estimates from live Printify production pricing, ~${AI_COST_PER_PAGE_USD.toFixed(2)}/AI page, and Shopify's 2.9% + 30¢.</p>
          <div className="space-y-2.5">
            {[
              { icon: Factory, label: "Printify", hint: "book production (paid orders)", value: costs.printify },
              { icon: Sparkles, label: "Google AI / OpenAI", hint: `AI images & stories (${costs.generatedBooks} generated books)`, value: costs.ai },
              { icon: CreditCard, label: "Shopify payments", hint: "processing fees on paid orders", value: costs.shopifyFees },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <r.icon className="w-4 h-4 text-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.hint}</p>
                </div>
                <span className="text-sm font-semibold">{fmt(r.value)}</span>
              </div>
            ))}
            <div className="border-t border-border/40 pt-2 flex justify-between text-sm font-bold">
              <span>Total variable</span><span>{fmt(variableCosts)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Fixed monthly vendors (editable)</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Set what you actually pay each vendor per month — saved to site settings and counted into expenses.</p>
          <div className="space-y-2">
            {FIXED_VENDORS.map((v) => (
              <div key={v.key} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{v.label}</p>
                  <p className="text-[11px] text-muted-foreground">{v.hint}</p>
                </div>
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    key={`${v.key}:${financeQuery.data?.[v.key] ?? ""}`}
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={financeQuery.data?.[v.key] ?? ""}
                    placeholder="0"
                    disabled={savingKey === v.key}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== (financeQuery.data?.[v.key] ?? "")) void saveFixedCost(v.key, val);
                    }}
                    className="h-8 pl-6 pr-2 text-right text-sm rounded-lg"
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-border/40 pt-2 flex justify-between text-sm font-bold">
              <span>Total fixed / month</span><span>{fmt(fixedMonthly)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Books / kids / subs breakdowns ═══ */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Books by status</h3>
          <div className="space-y-2">
            {bookStatusCounts.map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28 truncate capitalize">{status.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${(count / Math.max(1, books.length)) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{count}</span>
              </div>
            ))}
            {books.length === 0 && <p className="text-xs text-muted-foreground">No books yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Kids by age</h3>
          <div className="space-y-2">
            {kidStats.byAge.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10">{r.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${(r.count / Math.max(1, children.length)) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{r.count}</span>
              </div>
            ))}
            {kidStats.unknownAge > 0 && (
              <p className="text-[11px] text-muted-foreground">+{kidStats.unknownAge} without an age set</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Subscriptions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="font-semibold text-green-600">{subStats.active}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paused</span><span className="font-semibold text-amber-600">{subStats.paused}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cancelled / other</span><span className="font-semibold">{subStats.other}</span></div>
            <div className="border-t border-border/40 pt-2 flex justify-between font-bold">
              <span>Est. monthly sub revenue</span><span>{fmt(subStats.estMonthly)}</span>
            </div>
          </div>
        </div>
      </div>

      {revenueQuery.isError && (
        <p className="text-xs text-red-500">Couldn't load Shopify revenue — money tiles show $0 until it loads. Try refreshing.</p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Revenue is exact (Shopify). Expenses and profit are estimates: computed per-order/per-book costs plus your fixed monthly vendor amounts × {monthsActive} active month{monthsActive > 1 ? "s" : ""}. Site views are first-party (tracked since this dashboard shipped) — no cookies, one count per page per visit.
      </p>
    </div>
  );
};
