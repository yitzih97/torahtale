import { format } from "date-fns";
import { CalendarDays, Sparkles, CheckCircle2, Clock } from "lucide-react";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";
import { getUpcomingParsha, getPortionDisplay } from "@/components/wizard/TorahPortions";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  subscriptions: SubscriptionRecord[];
  /** How many upcoming Mondays to project per subscription. */
  weeksAhead?: number;
}

/** Next Monday strictly after `from`. */
function nextMonday(from: Date): Date {
  const d = new Date(from);
  let add = (1 - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Shows each active subscription's upcoming weekly books — the Monday they drop
 * into production and which parsha they'll cover — so users see what's coming.
 * Books already paid for (books_remaining) are marked "Scheduled"; the rest are
 * "After next billing".
 */
export function UpcomingDeliveries({ subscriptions, weeksAhead = 6 }: Props) {
  const { lang } = useLanguage();
  const active = subscriptions.filter((s) => s.status === "active");
  if (active.length === 0) return null;

  return (
    <div className="space-y-5 mb-6">
      {active.map((sub) => {
        const start = sub.next_release_date
          ? new Date(`${sub.next_release_date}T00:00:00`)
          : nextMonday(new Date());
        const paidCount = Math.max(0, sub.books_remaining ?? 0);

        const weeks = Array.from({ length: weeksAhead }, (_, i) => {
          const monday = new Date(start);
          monday.setDate(start.getDate() + i * 7);
          const portion = getUpcomingParsha(monday);
          return {
            monday,
            portion: getPortionDisplay(portion, lang),
            paid: i < paidCount,
          };
        });

        return (
          <div
            key={sub.id}
            className="rounded-3xl p-5 bg-white/70 backdrop-blur-xl border border-white/70 ring-1 ring-black/5
              shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-accent" />
              <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                Upcoming books{sub.child_name ? ` · ${sub.child_name}` : ""}
              </h3>
              <span className="text-[10px] text-muted-foreground capitalize">{sub.frequency} · ships Mondays 9am ET</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              {paidCount > 0
                ? `${paidCount} book${paidCount > 1 ? "s" : ""} paid & scheduled. New books are added each time your subscription bills.`
                : "Books are added each time your subscription bills, then drop one per Monday."}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-[150px] rounded-2xl p-3 border ring-1 ring-black/5
                    ${w.paid ? "bg-amber-50/80 border-amber-200/70" : "bg-white/55 border-white/70"}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70 font-medium">
                    <Sparkles className="w-3 h-3" />
                    {format(w.monday, "EEE, MMM d")}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-foreground leading-tight">{w.portion}</div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                      ${w.paid ? "text-green-700 bg-green-100/70" : "text-muted-foreground bg-muted"}`}
                  >
                    {w.paid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {w.paid ? "Scheduled" : "After next billing"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
