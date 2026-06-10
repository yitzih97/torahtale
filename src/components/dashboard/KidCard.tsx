import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Pencil, BookOpen, Pause, Play, Sparkles, Settings, Plus,
} from "lucide-react";
import type { ChildRecord } from "@/hooks/useChildren";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";

const ease = [0.22, 1, 0.36, 1] as const;

interface KidCardProps {
  kid: ChildRecord;
  index: number;
  subscription?: SubscriptionRecord;
  bookCount: number;
  onEdit: () => void;
  onViewBooks: () => void;
  onManageSubscription: () => void;
  onToggleSubscription: () => Promise<void> | void;
}

const subPillStyle = (s?: string) => {
  if (s === "active") return "text-emerald-700 border-emerald-200/70 bg-emerald-50/70";
  if (s === "paused") return "text-amber-700 border-amber-200/70 bg-amber-50/70";
  return "text-primary/70 border-white/80 bg-white/60";
};

const subPillDot = (s?: string) => {
  if (s === "active") return "bg-emerald-500";
  if (s === "paused") return "bg-amber-500";
  return "bg-muted-foreground/40";
};

const subPillLabel = (s?: string) => {
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
  if (s === "canceled") return "Canceled";
  return "No plan";
};

export function KidCard({
  kid,
  index,
  subscription,
  bookCount,
  onEdit,
  onViewBooks,
  onManageSubscription,
  onToggleSubscription,
}: KidCardProps) {
  const initials = kid.name.slice(0, 2).toUpperCase();
  const status = subscription?.status;
  const isPaused = status === "paused";
  const hasSub = !!subscription && status !== "canceled";

  // Days until next delivery
  const daysUntil = (() => {
    if (!subscription?.next_delivery_date) return null;
    const next = new Date(subscription.next_delivery_date).getTime();
    const diff = next - Date.now();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  const nextDeliveryCopy = (() => {
    if (!hasSub || daysUntil === null) return null;
    if (daysUntil === 0) return "Shipping today";
    if (daysUntil === 1) return "Ships tomorrow";
    return `In ${daysUntil} days`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease }}
      className="group relative overflow-hidden rounded-[2.5rem]
        bg-white/40 backdrop-blur-2xl backdrop-saturate-150
        border border-white/60 ring-1 ring-black/5
        shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]
        transition-all duration-500 hover:-translate-y-1.5
        hover:shadow-[0_30px_60px_-20px_rgba(15,23,42,0.25)]"
    >
      {/* Decorative gold ambient orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full
          bg-gold/10 blur-3xl transition-colors duration-500 group-hover:bg-gold/20"
      />

      {/* Status pill */}
      <div className="absolute top-6 right-6 z-10">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
            text-[10px] font-semibold uppercase tracking-wider
            border backdrop-blur-sm shadow-sm ${subPillStyle(status)}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${subPillDot(status)}`} />
          {subPillLabel(status)}
        </span>
      </div>

      <div className="relative pt-12 pb-8 px-8 flex flex-col items-center">
        {/* Hero portrait with gold halo */}
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit child"
          className="group/photo relative mb-6 transition-transform duration-300 active:scale-95"
        >
          <div
            aria-hidden
            className="absolute inset-0 -m-1 rounded-full opacity-40 blur-[2px]
              bg-gradient-to-br from-[hsl(42_78%_72%)] via-gold to-[hsl(42_78%_42%)]
              transition-opacity duration-500 group-hover/photo:opacity-70"
          />
          <div className="relative w-28 h-28 rounded-full border-2 border-white overflow-hidden
            shadow-inner bg-gradient-to-br from-slate-100 to-slate-200">
            {kid.photo_url ? (
              <img src={kid.photo_url} alt={kid.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-primary/70">
                {initials}
              </div>
            )}
            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100
              transition-opacity flex items-center justify-center text-white text-[10px] font-semibold
              uppercase tracking-wider rounded-full">
              Edit
            </span>
          </div>
        </button>

        {/* Identity */}
        <div className="text-center space-y-1 mb-6">
          <h3 className="font-display text-3xl font-bold text-primary leading-tight">
            {kid.name}
          </h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] font-medium">
            {kid.age ? `${kid.age} yrs` : "Age —"} · {kid.gender || "—"}
          </p>
          <p className="pt-1 text-base italic font-medium text-primary/60"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {bookCount === 0
              ? "Ready for the first book"
              : `${bookCount} ${bookCount === 1 ? "book" : "books"} created together`}
          </p>
        </div>

        {/* Next delivery panel — only when subscribed */}
        {hasSub && nextDeliveryCopy && (
          <div className="w-full p-4 mb-6 bg-white/40 rounded-2xl border border-white/60 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] font-medium leading-none mb-1.5">
              Next Delivery
            </p>
            <p className="text-primary font-medium text-lg leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {nextDeliveryCopy}
              {subscription?.next_delivery_date && (
                <span className="text-muted-foreground/80 font-normal text-sm ml-1.5">
                  · {format(new Date(subscription.next_delivery_date), "MMM d")}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Primary action */}
        <button
          type="button"
          onClick={onViewBooks}
          className="group/btn w-full py-3.5 px-6 mb-5 rounded-2xl
            text-white font-semibold text-sm
            bg-gradient-to-br from-[hsl(42_78%_70%)] via-gold to-[hsl(42_78%_42%)]
            shadow-[0_10px_24px_-8px_rgba(201,162,62,0.5)]
            hover:shadow-[0_16px_32px_-10px_rgba(201,162,62,0.6)]
            transition-all duration-300 active:scale-[0.98]
            flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 transition-transform duration-300 group-hover/btn:rotate-90" strokeWidth={2.5} />
          Create new book
        </button>

        {/* Secondary actions */}
        <div className={`grid ${hasSub ? "grid-cols-4" : "grid-cols-3"} gap-2.5 w-full`}>
          <IconAction Icon={BookOpen} label="View books" onClick={onViewBooks} />
          <IconAction Icon={Pencil} label="Edit profile" onClick={onEdit} />
          <IconAction
            Icon={hasSub ? Settings : Sparkles}
            label={hasSub ? "Manage plan" : "Start plan"}
            onClick={onManageSubscription}
          />
          {hasSub && (
            <IconAction
              Icon={isPaused ? Play : Pause}
              label={isPaused ? "Resume" : "Pause"}
              onClick={onToggleSubscription}
              disabled={status === "canceled"}
            />
          )}
        </div>
      </div>

      {/* Liquid sheen on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full
          bg-gradient-to-r from-transparent via-white/15 to-transparent
          group-hover:translate-x-full transition-transform duration-[1400ms] ease-out"
      />
    </motion.div>
  );
}

interface IconActionProps {
  Icon: typeof BookOpen;
  label: string;
  onClick: () => Promise<void> | void;
  disabled?: boolean;
}

function IconAction({ Icon, label, onClick, disabled }: IconActionProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => { void onClick(); }}
      disabled={disabled}
      className="group/icon relative flex items-center justify-center p-3 rounded-xl
        bg-white/30 border border-white/60 ring-1 ring-black/5
        text-primary/70
        hover:bg-white/70 hover:text-gold hover:border-gold/30
        hover:shadow-[0_8px_20px_-8px_rgba(201,162,62,0.4)]
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Icon className="w-5 h-5" strokeWidth={1.6} />
    </button>
  );
}
