import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getNextParshaRollover } from "./TorahPortions";

/**
 * Live countdown to the order-by deadline for delivery before Shabbos (the next
 * Wednesday-noon-ET rollover — see getNextParshaRollover). Recomputes the
 * target each tick, so the moment the deadline passes it automatically resets
 * to the following week's countdown.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export const ParshaCountdown = ({ label, trailingText }: { label: string; trailingText?: string }) => {
  const [remaining, setRemaining] = useState(() => getNextParshaRollover().getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getNextParshaRollover().getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, remaining);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);

  const unit = (value: number, suffix: string) => (
    <span className="tabular-nums">
      {days === 0 && suffix === "d" ? null : (
        <>
          <span className="font-semibold text-foreground">{suffix === "d" ? value : pad(value)}</span>
          <span className="text-accent/70">{suffix} </span>
        </>
      )}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" aria-label={`${label}: ${days}d ${hours}h ${minutes}m ${seconds}s`}>
      <Clock className="w-3 h-3 text-accent/70" />
      <span className="me-0.5">{label}</span>
      {unit(days, "d")}
      {unit(hours, "h")}
      {unit(minutes, "m")}
      {unit(seconds, "s")}
      {trailingText && <span className="ms-0.5">{trailingText}</span>}
    </span>
  );
};
