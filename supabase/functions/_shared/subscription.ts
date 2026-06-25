// Shared subscription scheduling helpers (used by shopify-webhook + release job).

// How many weekly books one successful charge of each plan entitles.
// Monthly = 4 (one per Monday), per product decision — NOT calendar-month length.
export const BOOKS_PER_PERIOD: Record<string, number> = {
  weekly: 1,
  monthly: 4,
  yearly: 52,
};

export function booksPerPeriod(frequency: string | null | undefined): number {
  return BOOKS_PER_PERIOD[(frequency || "weekly").toLowerCase()] ?? 1;
}

// ── Date helpers, all string-based (YYYY-MM-DD) and anchored at noon UTC so they
//    are immune to DST/timezone drift. ──

const ET = "America/New_York";

/** Today's calendar date in America/New_York as YYYY-MM-DD. */
export function todayET(now: Date = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: ET, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Current hour (0–23) in America/New_York. */
export function hourET(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "2-digit", hour12: false }).format(now),
  ) % 24;
}

/** 0=Sun … 1=Mon … 6=Sat for a YYYY-MM-DD. */
export function weekdayOfISO(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function addDaysISO(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** The next Monday strictly AFTER the given date (YYYY-MM-DD). */
export function nextMondayISO(ymd: string): string {
  const wd = weekdayOfISO(ymd); // 1 = Monday
  let add = (1 - wd + 7) % 7;
  if (add === 0) add = 7; // strictly after, so "today is Monday" → next Monday
  return addDaysISO(ymd, add);
}

/** a <= b for YYYY-MM-DD strings (lexicographic works for ISO dates). */
export function isoLte(a: string, b: string): boolean {
  return a <= b;
}
