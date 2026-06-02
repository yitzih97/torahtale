import { format, addDays, addWeeks, isSameDay } from "date-fns";
import { Truck, Sparkles, CalendarDays } from "lucide-react";
import type { BookRecord } from "@/hooks/useBooks";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  books: BookRecord[];
  subscriptions: SubscriptionRecord[];
  weeksAhead?: number;
}

type Slot = {
  date: Date;
  kind: "past-delivery" | "past-order" | "upcoming" | "today";
  label: string;
  sub?: string;
};

export function BookTimeline({ books, subscriptions, weeksAhead = 2 }: Props) {
  const today = new Date();
  const slots: Slot[] = [];

  // Past — delivered / shipped books in last ~30 days
  books
    .filter((b) => ["delivered", "shipped", "printing", "ordered"].includes(b.status))
    .forEach((b) => {
      const d = new Date(b.updated_at || b.created_at);
      const daysAgo = (today.getTime() - d.getTime()) / 86400000;
      if (daysAgo > 30 || daysAgo < 0) return;
      slots.push({
        date: d,
        kind: b.status === "delivered" ? "past-delivery" : "past-order",
        label: `${b.torah_portion || "Tale"} · ${b.status}`,
        sub: b.child_name || undefined,
      });
    });

  // Upcoming — next deliveries from active subs (project next N weeks)
  subscriptions
    .filter((s) => s.status === "active" && s.next_delivery_date)
    .forEach((s) => {
      const first = new Date(s.next_delivery_date!);
      for (let w = 0; w < weeksAhead; w++) {
        const d = w === 0 ? first : addWeeks(first, w);
        const daysFromNow = (d.getTime() - today.getTime()) / 86400000;
        if (daysFromNow > weeksAhead * 7 + 1) break;
        slots.push({
          date: d,
          kind: isSameDay(d, today) ? "today" : "upcoming",
          label: `Next book ships`,
          sub: s.child_name || undefined,
        });
      }
    });

  slots.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (slots.length === 0) return null;

  return (
    <div className="wizard-glass relative rounded-3xl overflow-hidden mb-5
      bg-white/70 backdrop-blur-xl backdrop-saturate-150
      border border-white/70 ring-1 ring-black/5
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]
      p-5">
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br from-amber-200/60 to-orange-200/40" />
      <div className="relative flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Timeline</h3>
        <span className="text-[10px] text-muted-foreground">past 30 days · next {weeksAhead} weeks</span>
      </div>
      <div className="relative flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {slots.map((s, i) => {
          const isPast = s.kind === "past-delivery" || s.kind === "past-order";
          const isToday = s.kind === "today";
          const Icon = isPast ? Truck : Sparkles;
          return (
            <div
              key={i}
              className={`flex-shrink-0 w-[180px] rounded-2xl p-3 border ring-1 ring-black/5 backdrop-blur-md
                ${isToday ? "bg-foreground text-background border-transparent" :
                  isPast ? "bg-white/55 border-white/70" :
                  "bg-amber-50/70 border-amber-200/60"}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70 font-medium">
                <Icon className="w-3 h-3" />
                {format(s.date, "EEE, MMM d")}
              </div>
              <p className="text-xs font-semibold mt-1 truncate capitalize">{s.label}</p>
              {s.sub && <p className="text-[11px] opacity-80 truncate">For {s.sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
