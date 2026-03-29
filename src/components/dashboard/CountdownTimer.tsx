import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  createdAt: string; // ISO date string
  durationMs?: number; // default 24 hours
}

export function CountdownTimer({ createdAt, durationMs = 24 * 60 * 60 * 1000 }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    const end = new Date(createdAt).getTime() + durationMs;
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const end = new Date(createdAt).getTime() + durationMs;
      const r = Math.max(0, end - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt, durationMs]);

  const totalSec = Math.floor(remaining / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (remaining <= 0) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="w-3 h-3" /> Ready soon
      </span>
    );
  }

  return (
    <span className="text-xs font-mono text-accent flex items-center gap-1.5 tabular-nums">
      <Clock className="w-3 h-3 animate-pulse" />
      {pad(hrs)}:{pad(mins)}:{pad(secs)}
    </span>
  );
}
