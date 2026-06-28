import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Search, Loader2, CheckCircle2, RotateCcw, Reply, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContactTicket {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "General",
  order: "Order",
  technical: "Technical",
  feedback: "Feedback",
  partnership: "Partnership",
};

const statusColor = (s: string) =>
  s === "resolved"
    ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
    : "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";

export function AdminMessagesTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contact-tickets"] }),
    onError: () => toast.error("Couldn't update message status"),
  });

  const openCount = tickets.filter((t) => t.status !== "resolved").length;

  const filtered = tickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages by name, email, subject, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {openCount} open · {tickets.length} total
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {tickets.length === 0 ? "No messages yet." : "No messages match your search."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => {
            const resolved = t.status === "resolved";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-soft-sm"
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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusColor(t.status)}`}>
                        {t.status || "open"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(t.created_at), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2.5"
                      onClick={() =>
                        window.open(
                          `mailto:${t.email}?subject=${encodeURIComponent(`Re: ${SUBJECT_LABELS[t.subject] || t.subject} — Torah Tale`)}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <Reply className="w-3 h-3 mr-1" /> Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[11px] px-2.5 ${resolved ? "" : "text-green-600"}`}
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: t.id, status: resolved ? "open" : "resolved" })}
                    >
                      {resolved ? (
                        <><RotateCcw className="w-3 h-3 mr-1" /> Reopen</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Resolve</>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap break-words border-t border-border pt-3">
                  {t.message}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
