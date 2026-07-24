import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarHeart, Pencil, CreditCard, Sparkles, Palette, Globe, RotateCcw, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUpcomingParsha, getPortionDisplay } from "@/components/wizard/TorahPortions";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";

const ease = [0.22, 1, 0.36, 1] as const;

const orbs = [
  "from-violet-200/60 to-fuchsia-200/40",
  "from-sky-200/60 to-indigo-200/40",
  "from-emerald-200/60 to-teal-200/40",
  "from-rose-200/60 to-pink-200/40",
];

const statusPill = (s: string) => {
  if (s === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (s === "paused") return "bg-amber-50 text-amber-700 border-amber-200/60";
  return "bg-muted/60 text-muted-foreground border-border/60";
};

interface Props {
  sub: SubscriptionRecord;
  index: number;
  /** Edit local delivery preferences (child, frequency, shipping address). */
  onEdit: () => void;
  /** Open the Shopify hosted customer portal (payment, pause, cancel, reactivate). */
  onManage: () => void;
}

export function SubscriptionCard({ sub, index, onEdit, onManage }: Props) {
  const { t, lang } = useLanguage();
  const isActive = sub.status === "active";
  const isPaused = sub.status === "paused";
  const isCanceled = sub.status === "canceled";

  const daysUntil = (() => {
    if (!sub.next_delivery_date) return null;
    const diff = new Date(sub.next_delivery_date).getTime() - Date.now();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  // The next few weekly parshiyos this subscription will deliver — shown as small
  // cover thumbnails so it's clear at a glance what's coming for this child.
  const upcoming = (() => {
    const start = sub.next_delivery_date ? new Date(sub.next_delivery_date) : new Date();
    const items: { portion: string; label: string }[] = [];
    let d = new Date(start);
    for (let guard = 0; items.length < 3 && guard < 80; guard++) {
      const portion = getUpcomingParsha(d, 0);
      if (!items.some((it) => it.portion === portion)) {
        items.push({ portion, label: getPortionDisplay(portion, lang) });
      }
      d = new Date(d);
      d.setDate(d.getDate() + 7);
    }
    return items;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease }}
      className="wizard-glass relative rounded-3xl overflow-hidden
        bg-white/70 backdrop-blur-xl backdrop-saturate-150
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]
        p-5 sm:p-6 flex flex-col gap-5"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br ${orbs[index % orbs.length]}`}
      />

      {/* Header */}
      <div className="relative flex items-start gap-4">
        <GlassIconTile Icon={CalendarHeart} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-semibold text-foreground truncate">
            {t.dash.parshaClub}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            For {sub.child_name || "your child"} ·{" "}
            <span className="font-medium text-foreground/80">
              {t.currency.symbol}
              {(sub.price_per_week * t.currency.rate).toFixed(2)}
            </span>
            {t.dash.perWeek}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusPill(sub.status)}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-muted-foreground/40"
            }`}
          />
          {sub.status}
        </span>
      </div>

      {/* Countdown chip */}
      {!isCanceled && daysUntil !== null && (
        <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3
          bg-white/60 backdrop-blur-md border border-white/70 ring-1 ring-black/5">
          <GlassIconTile Icon={CalendarHeart} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {t.dash.nextDelivery}
            </p>
            <p className="text-sm font-display font-semibold text-foreground">
              {daysUntil === 0
                ? "Shipping today"
                : daysUntil === 1
                  ? "Ships tomorrow"
                  : `In ${daysUntil} days`}
              <span className="text-muted-foreground font-normal text-xs ml-1.5">
                · {format(new Date(sub.next_delivery_date!), "MMM d")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Meta strip */}
      <div className="relative grid grid-cols-2 gap-2">
        <MetaPill Icon={Palette} label="Art" value={sub.art_style === "3d-pixar" ? "3D Pixar" : sub.art_style || "Cartoon"} />
        <MetaPill Icon={Globe} label="Lang" value={sub.language || "English"} />
      </div>

      {/* Coming next — small cover thumbnails of the upcoming weekly books */}
      {!isCanceled && upcoming.length > 0 && (
        <div className="relative">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            Coming next for {sub.child_name || "your child"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {upcoming.map((it, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-xl overflow-hidden border border-black/5 ring-1 ring-black/5
                  bg-[hsl(42_50%_94%)] shadow-[0_8px_18px_-12px_rgba(15,23,42,0.35)] flex flex-col items-center justify-center p-2 text-center"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_25%,hsl(42_78%_70%/0.55),transparent_60%)]" />
                <BookOpen className="w-3.5 h-3.5 text-gold/70 mb-1 relative" strokeWidth={1.75} />
                <p className="relative font-display font-bold text-primary leading-[1.05] text-[11px] line-clamp-2">{it.label}</p>
                <p className="relative mt-0.5 font-body italic text-gold text-[9px] line-clamp-1">{sub.child_name || "your child"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions — all billing is managed in the Shopify hosted customer portal,
          the only place that actually updates payment or stops the charge. */}
      <div className="relative flex flex-col gap-2 mt-auto">
        <Button
          type="button"
          variant="gold"
          onClick={onManage}
          className="w-full rounded-2xl gap-2 h-11"
        >
          {isCanceled ? <RotateCcw className="w-4 h-4" strokeWidth={2} /> : <CreditCard className="w-4 h-4" strokeWidth={2} />}
          {isCanceled ? "Reactivate in your account" : "Manage subscription & payment"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center leading-snug px-1">
          {isCanceled
            ? "Restart billing and delivery from your secure account."
            : "Update payment, pause, or cancel anytime in your secure account."}
        </p>
        {!isCanceled && (
          <ActionTile Icon={Pencil} label="Edit delivery details" onClick={onEdit} />
        )}
      </div>
    </motion.div>
  );
}

function MetaPill({ Icon, label, value }: { Icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5
      bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
        <p className="text-xs font-semibold text-foreground capitalize truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ActionTile({
  Icon, label, onClick, danger,
}: {
  Icon: typeof Pencil;
  label: string;
  onClick: () => Promise<void> | void;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onClick()}
      className={`h-auto py-3 px-3 rounded-2xl justify-center gap-2.5 font-medium text-xs
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_4px_12px_-6px_rgba(15,23,42,0.12)]
        backdrop-blur-md transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_8px_20px_-8px_rgba(15,23,42,0.18)]
        ${danger
          ? "bg-white/55 text-destructive hover:bg-destructive/10"
          : "bg-white/55 text-foreground hover:bg-white/75"}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Button>
  );
}
