import { describe, it, expect } from "vitest";
import { getCurrentParsha, getNextParshaRollover, PRINT_LEAD_BUSINESS_DAYS } from "./TorahPortions";

/**
 * The wizard must never offer a Shabbos it cannot print and ship for. These lock
 * the two halves of that promise together: the parsha shown is the one whose
 * Shabbos is at least PRINT_LEAD_BUSINESS_DAYS business days after the order
 * deadline the customer is counting down to.
 */

/** Business days strictly between two instants (excluding Sat/Sun). */
const businessDaysBetween = (from: Date, to: Date): number => {
  let n = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // start the day AFTER the deadline
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d < end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
};

// Parsha → the Shabbos it falls on, for the stretch these cases live in.
const SHABBOS: Record<string, string> = {
  reeh: "2026-08-08",
  shoftim: "2026-08-15",
  "ki-teitzei": "2026-08-22",
  "ki-tavo": "2026-08-29",
  "nitzavim-vayelech": "2026-09-05",
};

describe("wizard parsha timing", () => {
  it("offers next week's parsha, not the one that cannot be shipped in time", () => {
    // Monday 2026-08-17, the day this was reported: the wizard was showing
    // Ki Seitzei (Shabbos 08-22), only three days out.
    expect(getCurrentParsha(new Date("2026-08-17T15:00:00Z"))).toBe("ki-tavo");
  });

  it("holds one parsha across its week and rolls at Wednesday noon ET", () => {
    // Just BEFORE the Wednesday-noon-ET deadline (11:00 ET = 15:00 UTC in EDT).
    expect(getCurrentParsha(new Date("2026-08-19T15:00:00Z"))).toBe("ki-tavo");
    // Just AFTER it (13:00 ET = 17:00 UTC) — rolls to the following week.
    expect(getCurrentParsha(new Date("2026-08-19T17:00:00Z"))).toBe("nitzavim-vayelech");
  });

  it("always leaves at least 7 business days between the deadline and Shabbos", () => {
    for (const iso of [
      "2026-08-13T12:00:00Z", // Thursday
      "2026-08-15T12:00:00Z", // Shabbos
      "2026-08-17T15:00:00Z", // Monday
      "2026-08-19T15:00:00Z", // Wednesday, before noon ET
      "2026-08-19T17:00:00Z", // Wednesday, after noon ET
      "2026-08-21T12:00:00Z", // Friday
    ]) {
      const now = new Date(iso);
      const deadline = getNextParshaRollover(now);
      const shabbos = SHABBOS[getCurrentParsha(now)];
      expect(shabbos, `no Shabbos mapped for ${iso}`).toBeTruthy();
      const days = businessDaysBetween(deadline, new Date(`${shabbos}T12:00:00Z`));
      expect(days, `only ${days} business days from ${iso}`).toBeGreaterThanOrEqual(PRINT_LEAD_BUSINESS_DAYS);
    }
  });
});
