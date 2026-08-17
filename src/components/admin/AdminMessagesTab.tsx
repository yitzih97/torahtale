import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Mail, Search, Loader2, CheckCircle2, RotateCcw, Reply, Inbox, X, Table2,
  LayoutGrid, Columns3, SlidersHorizontal, ArrowUp, ArrowDown, ChevronsUpDown,
  MoreHorizontal, Copy, User, Send, AlertTriangle, MessageSquare, Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ContactTicket {
  id: string;
  created_at: string;
  updated_at?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  user_id?: string | null;
  last_reply_at?: string | null;
  reply_count?: number | null;
  ack_sent_at?: string | null;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  body: string;
  email_status: string;
  email_error: string | null;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "General",
  order: "Order",
  technical: "Technical",
  feedback: "Feedback",
  partnership: "Partnership",
  collection: "Collection Request",
};

/**
 * `new` (nobody has looked), `open` (reopened by an admin), `replied` (an email
 * actually reached the customer) and `resolved`. Only contact-reply sets
 * `replied`, and only after Resend accepted the send.
 */
const TICKET_STATUSES = ["new", "open", "replied", "resolved"] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "New", open: "Open", replied: "Replied", resolved: "Resolved",
};

const statusColor = (s: string) => {
  if (s === "resolved") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "replied") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  if (s === "open") return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950";
  return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
};

const BOARD_LANES: { key: string; label: string; hint: string; statuses: string[] }[] = [
  { key: "new", label: "Needs a reply", hint: "nobody has answered yet", statuses: ["new", "open"] },
  { key: "replied", label: "Replied", hint: "waiting on the customer", statuses: ["replied"] },
  { key: "resolved", label: "Resolved", hint: "closed", statuses: ["resolved"] },
];

type SortKey = "received" | "activity" | "name" | "subject" | "status";
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  received: "Received",
  activity: "Last activity",
  name: "Sender",
  subject: "Topic",
  status: "Status",
};

/** Hours a ticket has gone unanswered — the number that matters in a support inbox. */
const waitingHours = (t: ContactTicket) =>
  (t.status === "resolved" || t.status === "replied")
    ? 0
    : (Date.now() - new Date(t.created_at).getTime()) / 36e5;

interface Props {
  /** Opens a customer's card when the sender matches an account. */
  onSelectUser?: (userId: string) => void;
}

export function AdminMessagesTab({ onSelectUser }: Props) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"table" | "cards" | "board">("table");
  const [statusFilter, setStatusFilter] = useState("all"); // all | unanswered | <status>
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("received");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-contact-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ContactTicket[];
    },
  });

  // The whole reply thread, in one query — a support inbox is small, and per-row
  // fetching would make expanding a ticket feel slow.
  const { data: replies = [] } = useQuery({
    queryKey: ["admin-contact-replies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_ticket_replies" as never)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TicketReply[];
    },
  });

  const repliesByTicket = useMemo(() => {
    const m = new Map<string, TicketReply[]>();
    for (const r of replies) {
      const list = m.get(r.ticket_id) || [];
      list.push(r);
      m.set(r.ticket_id, list);
    }
    return m;
  }, [replies]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contact-tickets"] }),
    onError: () => toast.error("Couldn't update message status"),
  });

  /** Send the reply as a real email from help@torahtale.com and record it. */
  const sendReply = async (ticket: ContactTicket, resolve: boolean) => {
    const body = draft.trim();
    if (!body) { toast.error("Write a reply first"); return; }
    setSending(true);
    const toastId = toast.loading(`Emailing ${ticket.email}…`);
    try {
      const { data, error } = await supabase.functions.invoke("contact-reply", {
        body: { ticketId: ticket.id, body, resolve },
      });
      // A non-2xx from the function arrives as `error`; surface the real reason
      // rather than a generic failure, because "did the customer get it?" is
      // the only question that matters here.
      if (error) throw new Error((data as any)?.error || error.message);
      if (data && (data as any).sent === false) throw new Error((data as any).error || "The email was not sent");
      toast.success(`Reply sent to ${ticket.email}`, { id: toastId });
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["admin-contact-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-contact-replies"] });
    } catch (e: any) {
      toast.error(e?.message || "Could not send the reply", { id: toastId, duration: 10000 });
      queryClient.invalidateQueries({ queryKey: ["admin-contact-replies"] });
    } finally {
      setSending(false);
    }
  };

  /* ── filter ── */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cutoff = dateFilter === "all" ? 0 : Date.now() - parseInt(dateFilter) * 864e5;
    return tickets.filter((t) => {
      if (q) {
        const hay = [t.name, t.email, t.subject, t.message, t.status].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "unanswered") { if (t.status === "resolved" || t.status === "replied") return false; }
      else if (statusFilter !== "all" && (t.status || "new") !== statusFilter) return false;
      if (subjectFilter !== "all" && t.subject !== subjectFilter) return false;
      if (cutoff && new Date(t.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [tickets, searchQuery, statusFilter, subjectFilter, dateFilter]);

  /* ── sort ── */
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (t: ContactTicket) => {
      switch (sortKey) {
        case "activity": return new Date(t.last_reply_at || t.updated_at || t.created_at).getTime();
        case "name": return (t.name || "").toLowerCase();
        case "subject": return (t.subject || "").toLowerCase();
        case "status": {
          const i = (TICKET_STATUSES as readonly string[]).indexOf(t.status || "new");
          return i === -1 ? 9 : i;
        }
        default: return new Date(t.created_at).getTime();
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av === bv) return +new Date(b.created_at) - +new Date(a.created_at);
      return av > bv ? dir : -dir;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" || key === "subject" ? "asc" : "desc"); }
  };

  const filtersActive = !!searchQuery || statusFilter !== "all" || subjectFilter !== "all" || dateFilter !== "all";
  const clearFilters = () => {
    setSearchQuery(""); setStatusFilter("all"); setSubjectFilter("all"); setDateFilter("all");
  };

  const unanswered = tickets.filter((t) => t.status !== "resolved" && t.status !== "replied");
  const oldestWait = unanswered.reduce((m, t) => Math.max(m, waitingHours(t)), 0);

  const chips = useMemo(() => {
    const count = (f: (t: ContactTicket) => boolean) => tickets.filter(f).length;
    return [
      { value: "all", label: "All", count: tickets.length },
      { value: "unanswered", label: "Needs a reply", count: unanswered.length },
      ...TICKET_STATUSES
        .filter((s) => count((t) => (t.status || "new") === s))
        .map((s) => ({ value: s as string, label: STATUS_LABEL[s], count: count((t) => (t.status || "new") === s) })),
    ];
  }, [tickets, unanswered.length]);

  const subjects = useMemo(
    () => [...new Set(tickets.map((t) => t.subject).filter(Boolean))],
    [tickets],
  );

  /* ────────────────────────── shared bits ────────────────────────── */

  const openThread = (t: ContactTicket) => {
    setOpenTicket((cur) => (cur === t.id ? null : t.id));
    setDraft("");
  };

  const StatusSelect = ({ t }: { t: ContactTicket }) => (
    <Select
      value={t.status || "new"}
      onValueChange={(v) => {
        updateStatus.mutate({ id: t.id, status: v });
        toast.success(`Marked ${STATUS_LABEL[v] || v}`);
      }}
    >
      <SelectTrigger
        className="h-7 w-auto gap-1 justify-start text-[11px] border-0 bg-transparent shadow-none px-0 focus:ring-0 focus:ring-offset-0 [&>span]:!inline-flex [&>span]:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap ${statusColor(t.status || "new")}`}>
          <span className="font-medium">{STATUS_LABEL[t.status] || t.status || "New"}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const QuickActions = ({ t, compact = false }: { t: ContactTicket; compact?: boolean }) => {
    const resolved = t.status === "resolved";
    return (
      <>
        <Button
          variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent"
          onClick={(e) => { e.stopPropagation(); openThread(t); }}
          title="Reply in app"
        >
          <Reply className="w-3.5 h-3.5" />
        </Button>
        {!compact && (
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `mailto:${t.email}?subject=${encodeURIComponent(`Re: ${SUBJECT_LABELS[t.subject] || t.subject} — Torah Tale`)}`,
                "_blank", "noopener,noreferrer",
              );
            }}
            title="Reply from your own mail client"
          >
            <Mail className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost" size="sm"
          className={`h-7 w-7 p-0 ${resolved ? "" : "text-green-600"}`}
          disabled={updateStatus.isPending}
          onClick={(e) => {
            e.stopPropagation();
            updateStatus.mutate({ id: t.id, status: resolved ? "open" : "resolved" });
          }}
          title={resolved ? "Reopen" : "Resolve"}
        >
          {resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        </Button>
      </>
    );
  };

  const RowActions = ({ t }: { t: ContactTicket }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()} title="Actions">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11px]">{t.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openThread(t)}>
          <Reply className="w-3.5 h-3.5" /> Reply in app
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(
            `mailto:${t.email}?subject=${encodeURIComponent(`Re: ${SUBJECT_LABELS[t.subject] || t.subject} — Torah Tale`)}`,
            "_blank", "noopener,noreferrer",
          )}
        >
          <Mail className="w-3.5 h-3.5" /> Reply from mail client
        </DropdownMenuItem>
        {t.user_id && onSelectUser && (
          <DropdownMenuItem onClick={() => onSelectUser(t.user_id!)}>
            <User className="w-3.5 h-3.5" /> View customer
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => updateStatus.mutate({ id: t.id, status: t.status === "resolved" ? "open" : "resolved" })}
        >
          {t.status === "resolved" ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {t.status === "resolved" ? "Reopen" : "Mark resolved"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(t.email); toast.success("Email copied"); }}>
          <Copy className="w-3.5 h-3.5" /> Copy email address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(t.message); toast.success("Message copied"); }}>
          <Copy className="w-3.5 h-3.5" /> Copy message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-left">
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

  const WaitBadge = ({ t }: { t: ContactTicket }) => {
    const h = waitingHours(t);
    if (h < 24) return null;
    return (
      <span
        className={`text-[9px] px-1.5 py-0.5 rounded ${h >= 48 ? "text-destructive bg-destructive/10" : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950"}`}
        title="Unanswered since it arrived"
      >
        waiting {Math.floor(h / 24)}d
      </span>
    );
  };

  /** The customer's message, every admin reply, and the composer. */
  const Thread = ({ t, narrow = false }: { t: ContactTicket; narrow?: boolean }) => {
    const list = repliesByTicket.get(t.id) || [];
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            {t.name} · {format(new Date(t.created_at), "MMM d, yyyy · h:mm a")}
          </p>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{t.message}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            {t.ack_sent_at
              ? `Auto-acknowledgement emailed ${format(new Date(t.ack_sent_at), "MMM d, h:mm a")}`
              : "No acknowledgement email recorded for this message"}
          </p>
        </div>

        {list.map((r) => (
          <div key={r.id} className={`rounded-xl border border-accent/30 bg-accent/5 p-3 ${narrow ? "" : "ml-6"}`}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
              Torah Tale · {format(new Date(r.created_at), "MMM d, yyyy · h:mm a")}
              {r.email_status !== "sent" && (
                <span className="inline-flex items-center gap-1 text-destructive normal-case tracking-normal">
                  <AlertTriangle className="w-3 h-3" /> not delivered
                </span>
              )}
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{r.body}</p>
            {r.email_status !== "sent" && (
              <p className="text-[10px] text-destructive mt-1.5">{r.email_error || "The email could not be sent."}</p>
            )}
          </div>
        ))}

        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Write a reply to ${t.name}… it's emailed from help@torahtale.com, and their reply comes back to that inbox.`}
            className="min-h-[110px] text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              Sends to <span className="font-medium text-foreground">{t.email}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setOpenTicket(null); setDraft(""); }}>
                Cancel
              </Button>
              <Button
                variant="outline" size="sm" className="h-8 text-xs"
                disabled={sending || !draft.trim()}
                onClick={() => sendReply(t, true)}
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Send &amp; resolve
              </Button>
              <Button size="sm" className="h-8 text-xs" disabled={sending || !draft.trim()} onClick={() => sendReply(t, false)}>
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ────────────────────────── render ────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card shadow-soft-sm p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, topic, or message text…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl h-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
              onClick={() => setStatusFilter(c.value)}
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

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs rounded-xl"><SelectValue placeholder="Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{SUBJECT_LABELS[s] || s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl"><SelectValue placeholder="Received" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(v) => { const [k, d] = v.split(":") as [SortKey, SortDir]; setSortKey(k); setSortDir(d); }}
          >
            <SelectTrigger className="h-8 w-[165px] text-xs rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
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
            <span><span className="font-semibold text-foreground">{filtered.length}</span> of {tickets.length} messages</span>
            {oldestWait >= 24 && (
              <span className="inline-flex items-center gap-1 text-destructive">
                <Clock className="w-3 h-3" /> oldest waiting {Math.floor(oldestWait / 24)}d
              </span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <Inbox className="w-10 h-10 mx-auto opacity-50" />
          <p>{tickets.length === 0 ? "No messages yet." : "No messages match these filters."}</p>
          {filtersActive && <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>
      ) : view === "table" ? (
        <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-secondary/70 backdrop-blur">
                  <SortHeader label="Sender" k="name" />
                  <SortHeader label="Topic" k="subject" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-left">Message</th>
                  <SortHeader label="Received" k="received" />
                  <SortHeader label="Last activity" k="activity" />
                  <SortHeader label="Status" k="status" />
                  <th className="p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => {
                  const count = repliesByTicket.get(t.id)?.length || 0;
                  return [
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                      onClick={() => openThread(t)}
                      title="Open the conversation"
                      className="border-b border-border last:border-0 hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <p className="text-xs font-medium text-foreground">{t.name}</p>
                        <a
                          href={`mailto:${t.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-accent hover:underline"
                        >
                          {t.email}
                        </a>
                        <div className="mt-0.5"><WaitBadge t={t} /></div>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">
                          {SUBJECT_LABELS[t.subject] || t.subject}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[280px]">
                        <span className="line-clamp-2">{t.message}</span>
                        {count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-accent mt-0.5">
                            <MessageSquare className="w-2.5 h-2.5" /> {count} repl{count > 1 ? "ies" : "y"}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(t.created_at), "MMM d, yy")}
                        <span className="block text-[10px] opacity-70">{format(new Date(t.created_at), "h:mm a")}</span>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(t.last_reply_at || t.updated_at || t.created_at))} ago
                      </td>
                      <td className="p-3"><StatusSelect t={t} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <QuickActions t={t} />
                          <RowActions t={t} />
                        </div>
                      </td>
                    </motion.tr>,
                    openTicket === t.id
                      ? (
                        <tr key={`${t.id}-thread`} className="border-b border-border bg-secondary/20">
                          <td colSpan={7} className="p-3"><Thread t={t} /></td>
                        </tr>
                      )
                      : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === "cards" ? (
        <div className="space-y-3">
          {sorted.map((t, i) => {
            const count = repliesByTicket.get(t.id)?.length || 0;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-soft-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{t.name}</span>
                      <a href={`mailto:${t.email}`} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />{t.email}
                      </a>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {SUBJECT_LABELS[t.subject] || t.subject}
                      </span>
                      <WaitBadge t={t} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(t.created_at), "MMM d, yyyy · h:mm a")}
                      {count > 0 && <span className="text-accent"> · {count} repl{count > 1 ? "ies" : "y"}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusSelect t={t} />
                    <QuickActions t={t} />
                    <RowActions t={t} />
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words border-t border-border pt-3">
                  {t.message}
                </p>
                {openTicket === t.id && <Thread t={t} />}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {BOARD_LANES.map((lane) => {
              const laneRows = sorted.filter((t) => lane.statuses.includes(t.status || "new"));
              return (
                <div key={lane.key} className="w-[300px] shrink-0 rounded-2xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{lane.label}</h3>
                    <span className="text-[10px] rounded-full bg-card border border-border px-1.5 py-0.5 text-muted-foreground">{laneRows.length}</span>
                  </div>
                  <p className="px-1 pb-2 text-[10px] text-muted-foreground">{lane.hint}</p>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {laneRows.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground px-1 py-4 text-center">Empty</p>
                    ) : laneRows.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openThread(t)}
                        className="rounded-xl border border-border bg-card p-2.5 shadow-soft-sm hover:border-accent/50 cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <QuickActions t={t} compact />
                            <RowActions t={t} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{t.email}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-3">{t.message}</p>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(t.created_at), "MMM d")}
                          </span>
                          <WaitBadge t={t} />
                        </div>
                        {openTicket === t.id && <Thread t={t} narrow />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
