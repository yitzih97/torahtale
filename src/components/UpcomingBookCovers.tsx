import { getUpcomingParsha, getPortionDisplay } from "@/components/wizard/TorahPortions";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface Props {
  /** Joined child names, e.g. "Adina & Ari". */
  childNames: string;
  /** How many upcoming parshiyos to preview. */
  count?: number;
  /** Where to start counting from (defaults to now). */
  startFrom?: Date;
  heading?: string;
  subtext?: string;
  /** When provided, a call-to-action button is shown under the covers. */
  ctaLabel?: string;
  onCta?: () => void;
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
 * A row of mini book covers for the upcoming weekly parshiyos, each "starring"
 * the user's own kids — mirrors the real cover (Parsha name big, kids small).
 * Used to drive subscriptions (a preview of the books they'd receive) and to
 * show weekly subscribers what's coming next.
 */
export function UpcomingBookCovers({
  childNames,
  count = 4,
  startFrom = new Date(),
  heading,
  subtext,
  ctaLabel,
  onCta,
}: Props) {
  const { lang } = useLanguage();

  // Collect the next `count` DISTINCT upcoming parshiyos (weekly steps).
  const items: { portion: string; label: string }[] = [];
  let d = nextMonday(startFrom);
  for (let guard = 0; items.length < count && guard < 80; guard++) {
    const portion = getUpcomingParsha(d, 0);
    if (!items.some((it) => it.portion === portion)) {
      items.push({ portion, label: getPortionDisplay(portion, lang) });
    }
    d = new Date(d);
    d.setDate(d.getDate() + 7);
  }

  const kids = childNames?.trim() || (lang === "he" ? "הילדים שלכם" : lang === "yi" ? "אײַערע קינדער" : "your kids");

  return (
    <div className="space-y-4">
      {(heading || subtext) && (
        <div className="text-center">
          {heading && <h3 className="font-display text-lg font-semibold text-primary">{heading}</h3>}
          {subtext && <p className="text-sm text-muted-foreground mt-1">{subtext}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-black/5 ring-1 ring-black/5
              bg-[hsl(42_50%_94%)] shadow-[0_10px_24px_-14px_rgba(15,23,42,0.35)] flex flex-col items-center justify-center p-3 text-center"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_25%,hsl(42_78%_70%/0.55),transparent_60%)]" />
            <BookOpen className="w-5 h-5 text-gold/70 mb-2 relative" />
            <p className="relative font-display font-extrabold text-primary leading-[1.05] text-sm sm:text-base tracking-tight line-clamp-3">
              {it.label}
            </p>
            <p className="relative mt-1 font-body italic text-gold text-[11px] sm:text-xs line-clamp-1">{kids}</p>
          </div>
        ))}
      </div>

      {ctaLabel && onCta && (
        <div className="text-center pt-1">
          <Button variant="gold" onClick={onCta} className="rounded-xl">{ctaLabel}</Button>
        </div>
      )}
    </div>
  );
}
