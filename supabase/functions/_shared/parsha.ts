// Server-side copy of the weekly Torah-reading schedule.
//
// IMPORTANT: keep this in sync with src/components/wizard/TorahPortions.ts
// (PARSHA_CALENDAR + getUpcomingParsha). The frontend uses it to pre-fill a new
// order's portion; the shopify-webhook uses it to stamp the portion onto each
// recurring subscription book it mints, so the admin can generate it directly.
//
// Maps a Saturday date (YYYY-MM-DD) to the parashah value read that Shabbat.
const PARSHA_CALENDAR: Record<string, string> = {
  // 5785 cycle (2024-2025)
  "2024-10-26": "bereishit", "2024-11-02": "noach", "2024-11-09": "lech-lecha",
  "2024-11-16": "vayera", "2024-11-23": "chayei-sarah", "2024-11-30": "toldot",
  "2024-12-07": "vayetzei", "2024-12-14": "vayishlach", "2024-12-21": "vayeshev",
  "2024-12-28": "miketz", "2025-01-04": "vayigash", "2025-01-11": "vayechi",
  "2025-01-18": "shemot", "2025-01-25": "vaera", "2025-02-01": "bo",
  "2025-02-08": "beshalach", "2025-02-15": "yitro", "2025-02-22": "mishpatim",
  "2025-03-01": "terumah", "2025-03-08": "tetzaveh", "2025-03-15": "ki-tisa",
  "2025-03-22": "vayakhel", "2025-03-29": "pekudei", "2025-04-05": "vayikra",
  "2025-04-12": "tzav", "2025-04-26": "shemini", "2025-05-03": "tazria",
  "2025-05-10": "metzora", "2025-05-17": "acharei-mot", "2025-05-24": "kedoshim",
  "2025-05-31": "emor", "2025-06-07": "behar", "2025-06-14": "bechukotai",
  "2025-06-21": "bamidbar", "2025-06-28": "naso", "2025-07-05": "behaalotecha",
  "2025-07-12": "shelach", "2025-07-19": "korach", "2025-07-26": "chukat",
  "2025-08-02": "balak", "2025-08-09": "pinchas", "2025-08-16": "matot",
  "2025-08-23": "masei", "2025-08-30": "devarim", "2025-09-06": "vaetchanan",
  "2025-09-13": "eikev", "2025-09-20": "reeh", "2025-09-27": "shoftim",
  "2025-10-04": "ki-teitzei", "2025-10-11": "ki-tavo", "2025-10-18": "nitzavim",
  // 5786 cycle (2025-2026)
  "2025-10-25": "bereishit", "2025-11-01": "noach", "2025-11-08": "lech-lecha",
  "2025-11-15": "vayera", "2025-11-22": "chayei-sarah", "2025-11-29": "toldot",
  "2025-12-06": "vayetzei", "2025-12-13": "vayishlach", "2025-12-20": "vayeshev",
  "2025-12-27": "miketz", "2026-01-03": "vayigash", "2026-01-10": "vayechi",
  "2026-01-17": "shemot", "2026-01-24": "vaera", "2026-01-31": "bo",
  "2026-02-07": "beshalach", "2026-02-14": "yitro", "2026-02-21": "mishpatim",
  "2026-02-28": "terumah", "2026-03-07": "tetzaveh", "2026-03-14": "ki-tisa",
  "2026-03-21": "vayakhel", "2026-03-28": "pekudei", "2026-04-04": "vayikra",
  "2026-04-11": "tzav", "2026-04-18": "shemini", "2026-04-25": "tazria",
  "2026-05-02": "metzora", "2026-05-09": "acharei-mot", "2026-05-16": "kedoshim",
  "2026-05-23": "emor", "2026-05-30": "behar", "2026-06-06": "bechukotai",
  "2026-06-13": "bamidbar", "2026-06-20": "naso", "2026-06-27": "behaalotecha",
  "2026-07-04": "shelach", "2026-07-11": "korach", "2026-07-18": "chukat",
  "2026-07-25": "balak", "2026-08-01": "pinchas", "2026-08-08": "matot",
  "2026-08-15": "masei", "2026-08-22": "devarim", "2026-08-29": "vaetchanan",
  "2026-09-05": "eikev", "2026-09-12": "reeh", "2026-09-19": "shoftim",
  "2026-09-26": "ki-teitzei", "2026-10-03": "ki-tavo", "2026-10-10": "nitzavim",
};

import { fetchUpcomingParshaSlug } from "./hebcal.ts";

/**
 * Live upcoming parashah: tries the Hebcal API first (auto-updating, never runs
 * dry), then falls back to the hardcoded calendar below if Hebcal is unreachable.
 * This is what the mint/release path should call.
 */
export async function getUpcomingParshaLive(from: Date = new Date(), leadWeeks = 3): Promise<string | null> {
  try {
    const live = await fetchUpcomingParshaSlug(from, leadWeeks);
    if (live) return live;
    console.warn("Hebcal returned no parsha; falling back to hardcoded calendar.");
  } catch (e) {
    console.error("Hebcal lookup failed; falling back to hardcoded calendar:", e);
  }
  return getUpcomingParsha(from, leadWeeks);
}

/**
 * Hardcoded-calendar fallback. Returns the parashah read `leadWeeks` weeks from
 * `from` (default 3 weeks, the production+shipping lead time). `null` if the
 * calendar has run out — the live path above should normally prevent this.
 */
export function getUpcomingParsha(from: Date = new Date(), leadWeeks = 3): string | null {
  const daysUntilSat = (6 - from.getDay() + 7) % 7 || 7;
  const targetSat = new Date(from);
  targetSat.setDate(from.getDate() + daysUntilSat + leadWeeks * 7);
  const key = targetSat.toISOString().slice(0, 10);

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];

  // Fall forward to the next scheduled Shabbat if the exact date isn't a key
  // (e.g. a Yom Tov week the calendar skips).
  const future = Object.keys(PARSHA_CALENDAR).sort().find((d) => d >= key);
  return future ? PARSHA_CALENDAR[future] : null;
}
