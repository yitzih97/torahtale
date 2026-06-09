import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarHeart, Pencil, CreditCard, Pause, Play, X, Sparkles, Palette, Globe, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { useLanguage } from "@/contexts/LanguageContext";
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
  onEdit: () => void;
  onPayment: () => void;
  onToggle: () => Promise<void> | void;
  onCancel: () => Promise<void> | void;
  onReactivate?: () => Promise<void> | void;
}

export function SubscriptionCard({ sub, index, onEdit, onPayment, onToggle, onCancel, onReactivate }: Props) {
  const { t } = useLanguage();
  const isActive = sub.status === "active";
  const isPaused = sub.status === "paused";
  const isCanceled = sub.status === "canceled";

  const daysUntil = (() => {
    if (!sub.next_delivery_date) return null;
    const diff = new Date(sub.next_delivery_date).getTime() - Date.now();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
            {t.dash.parashahClub}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            For {sub.child_name || "your kind"} ·{" "}
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

      {/* Actions */}
      {!isCanceled ? (
        <div className="relative grid grid-cols-2 gap-2">
          <ActionTile Icon={Pencil} label="Edit plan" onClick={onEdit} />
          <ActionTile Icon={CreditCard} label="Payment" onClick={onPayment} />
          <ActionTile
            Icon={isPaused ? Play : Pause}
            label={isPaused ? t.dash.resume : t.dash.pause}
            onClick={onToggle}
          />
          <ActionTile Icon={X} label={t.dash.cancel} onClick={onCancel} danger />
        </div>
      ) : onReactivate ? (
        <div className="relative">
          <ActionTile Icon={RotateCcw} label="Reactivate subscription" onClick={onReactivate} />
        </div>
      ) : null}
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
      className={`h-auto py-3 px-3 rounded-2xl justify-start gap-2.5 font-medium text-xs
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
