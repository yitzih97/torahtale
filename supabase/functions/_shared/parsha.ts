// Server-side copy of the weekly Torah-reading schedule.
//
// IMPORTANT: keep this in sync with src/components/wizard/TorahPortions.ts
// (PARSHA_CALENDAR + getUpcomingParsha). The frontend uses it to pre-fill a new
// order's portion; the shopify-webhook uses it to stamp the portion onto each
// recurring subscription book it mints, so the admin can generate it directly.
//
// Maps a Saturday date (YYYY-MM-DD) to the parashah value read that Shabbat.
const PARSHA_CALENDAR: Record<string, string> = {
  // Diaspora weekly parashah, generated from the Hebcal sedrot API (i=off).
  // Double parshiyos use the combined slug (e.g. matot-masei). Fallback only —
  // getUpcomingParshaLive prefers the live Hebcal API. Keyed by Shabbos (Saturday).
  "2024-01-06": "shemot", "2024-01-13": "vaera", "2024-01-20": "bo", "2024-01-27": "beshalach",
  "2024-02-03": "yitro", "2024-02-10": "mishpatim", "2024-02-17": "terumah", "2024-02-24": "tetzaveh",
  "2024-03-02": "ki-tisa", "2024-03-09": "vayakhel", "2024-03-16": "pekudei", "2024-03-23": "vayikra",
  "2024-03-30": "tzav", "2024-04-06": "shemini", "2024-04-13": "tazria", "2024-04-20": "metzora",
  "2024-05-04": "acharei-mot", "2024-05-11": "kedoshim", "2024-05-18": "emor", "2024-05-25": "behar",
  "2024-06-01": "bechukotai", "2024-06-08": "bamidbar", "2024-06-15": "naso", "2024-06-22": "behaalotecha",
  "2024-06-29": "shelach", "2024-07-06": "korach", "2024-07-13": "chukat", "2024-07-20": "balak",
  "2024-07-27": "pinchas", "2024-08-03": "matot-masei", "2024-08-10": "devarim", "2024-08-17": "vaetchanan",
  "2024-08-24": "eikev", "2024-08-31": "reeh", "2024-09-07": "shoftim", "2024-09-14": "ki-teitzei",
  "2024-09-21": "ki-tavo", "2024-09-28": "nitzavim-vayelech", "2024-10-05": "haazinu", "2024-10-26": "bereishit",
  "2024-11-02": "noach", "2024-11-09": "lech-lecha", "2024-11-16": "vayera", "2024-11-23": "chayei-sarah",
  "2024-11-30": "toldot", "2024-12-07": "vayetzei", "2024-12-14": "vayishlach", "2024-12-21": "vayeshev",
  "2024-12-28": "miketz", "2025-01-04": "vayigash", "2025-01-11": "vayechi", "2025-01-18": "shemot",
  "2025-01-25": "vaera", "2025-02-01": "bo", "2025-02-08": "beshalach", "2025-02-15": "yitro",
  "2025-02-22": "mishpatim", "2025-03-01": "terumah", "2025-03-08": "tetzaveh", "2025-03-15": "ki-tisa",
  "2025-03-22": "vayakhel", "2025-03-29": "pekudei", "2025-04-05": "vayikra", "2025-04-12": "tzav",
  "2025-04-26": "shemini", "2025-05-03": "tazria-metzora", "2025-05-10": "acharei-mot-kedoshim", "2025-05-17": "emor",
  "2025-05-24": "behar-bechukotai", "2025-05-31": "bamidbar", "2025-06-07": "naso", "2025-06-14": "behaalotecha",
  "2025-06-21": "shelach", "2025-06-28": "korach", "2025-07-05": "chukat", "2025-07-12": "balak",
  "2025-07-19": "pinchas", "2025-07-26": "matot-masei", "2025-08-02": "devarim", "2025-08-09": "vaetchanan",
  "2025-08-16": "eikev", "2025-08-23": "reeh", "2025-08-30": "shoftim", "2025-09-06": "ki-teitzei",
  "2025-09-13": "ki-tavo", "2025-09-20": "nitzavim", "2025-09-27": "vayelech", "2025-10-04": "haazinu",
  "2025-10-18": "bereishit", "2025-10-25": "noach", "2025-11-01": "lech-lecha", "2025-11-08": "vayera",
  "2025-11-15": "chayei-sarah", "2025-11-22": "toldot", "2025-11-29": "vayetzei", "2025-12-06": "vayishlach",
  "2025-12-13": "vayeshev", "2025-12-20": "miketz", "2025-12-27": "vayigash", "2026-01-03": "vayechi",
  "2026-01-10": "shemot", "2026-01-17": "vaera", "2026-01-24": "bo", "2026-01-31": "beshalach",
  "2026-02-07": "yitro", "2026-02-14": "mishpatim", "2026-02-21": "terumah", "2026-02-28": "tetzaveh",
  "2026-03-07": "ki-tisa", "2026-03-14": "vayakhel-pekudei", "2026-03-21": "vayikra", "2026-03-28": "tzav",
  "2026-04-11": "shemini", "2026-04-18": "tazria-metzora", "2026-04-25": "acharei-mot-kedoshim", "2026-05-02": "emor",
  "2026-05-09": "behar-bechukotai", "2026-05-16": "bamidbar", "2026-05-30": "naso", "2026-06-06": "behaalotecha",
  "2026-06-13": "shelach", "2026-06-20": "korach", "2026-06-27": "chukat-balak", "2026-07-04": "pinchas",
  "2026-07-11": "matot-masei", "2026-07-18": "devarim", "2026-07-25": "vaetchanan", "2026-08-01": "eikev",
  "2026-08-08": "reeh", "2026-08-15": "shoftim", "2026-08-22": "ki-teitzei", "2026-08-29": "ki-tavo",
  "2026-09-05": "nitzavim-vayelech", "2026-09-19": "haazinu", "2026-10-10": "bereishit", "2026-10-17": "noach",
  "2026-10-24": "lech-lecha", "2026-10-31": "vayera", "2026-11-07": "chayei-sarah", "2026-11-14": "toldot",
  "2026-11-21": "vayetzei", "2026-11-28": "vayishlach", "2026-12-05": "vayeshev", "2026-12-12": "miketz",
  "2026-12-19": "vayigash", "2026-12-26": "vayechi", "2027-01-02": "shemot", "2027-01-09": "vaera",
  "2027-01-16": "bo", "2027-01-23": "beshalach", "2027-01-30": "yitro", "2027-02-06": "mishpatim",
  "2027-02-13": "terumah", "2027-02-20": "tetzaveh", "2027-02-27": "ki-tisa", "2027-03-06": "vayakhel",
  "2027-03-13": "pekudei", "2027-03-20": "vayikra", "2027-03-27": "tzav", "2027-04-03": "shemini",
  "2027-04-10": "tazria", "2027-04-17": "metzora", "2027-05-01": "acharei-mot", "2027-05-08": "kedoshim",
  "2027-05-15": "emor", "2027-05-22": "behar", "2027-05-29": "bechukotai", "2027-06-05": "bamidbar",
  "2027-06-19": "naso", "2027-06-26": "behaalotecha", "2027-07-03": "shelach", "2027-07-10": "korach",
  "2027-07-17": "chukat-balak", "2027-07-24": "pinchas", "2027-07-31": "matot-masei", "2027-08-07": "devarim",
  "2027-08-14": "vaetchanan", "2027-08-21": "eikev", "2027-08-28": "reeh", "2027-09-04": "shoftim",
  "2027-09-11": "ki-teitzei", "2027-09-18": "ki-tavo", "2027-09-25": "nitzavim-vayelech", "2027-10-09": "haazinu",
  "2027-10-30": "bereishit", "2027-11-06": "noach", "2027-11-13": "lech-lecha", "2027-11-20": "vayera",
  "2027-11-27": "chayei-sarah", "2027-12-04": "toldot", "2027-12-11": "vayetzei", "2027-12-18": "vayishlach",
  "2027-12-25": "vayeshev", "2028-01-01": "miketz", "2028-01-08": "vayigash", "2028-01-15": "vayechi",
  "2028-01-22": "shemot", "2028-01-29": "vaera", "2028-02-05": "bo", "2028-02-12": "beshalach",
  "2028-02-19": "yitro", "2028-02-26": "mishpatim", "2028-03-04": "terumah", "2028-03-11": "tetzaveh",
  "2028-03-18": "ki-tisa", "2028-03-25": "vayakhel-pekudei", "2028-04-01": "vayikra", "2028-04-08": "tzav",
  "2028-04-22": "shemini", "2028-04-29": "tazria-metzora", "2028-05-06": "acharei-mot-kedoshim", "2028-05-13": "emor",
  "2028-05-20": "behar-bechukotai", "2028-05-27": "bamidbar", "2028-06-03": "naso", "2028-06-10": "behaalotecha",
  "2028-06-17": "shelach", "2028-06-24": "korach", "2028-07-01": "chukat", "2028-07-08": "balak",
  "2028-07-15": "pinchas", "2028-07-22": "matot-masei", "2028-07-29": "devarim", "2028-08-05": "vaetchanan",
  "2028-08-12": "eikev", "2028-08-19": "reeh", "2028-08-26": "shoftim", "2028-09-02": "ki-teitzei",
  "2028-09-09": "ki-tavo", "2028-09-16": "nitzavim-vayelech", "2028-09-23": "haazinu", "2028-10-14": "bereishit",
  "2028-10-21": "noach", "2028-10-28": "lech-lecha", "2028-11-04": "vayera", "2028-11-11": "chayei-sarah",
  "2028-11-18": "toldot", "2028-11-25": "vayetzei", "2028-12-02": "vayishlach", "2028-12-09": "vayeshev",
  "2028-12-16": "miketz", "2028-12-23": "vayigash", "2028-12-30": "vayechi", "2029-01-06": "shemot",
  "2029-01-13": "vaera", "2029-01-20": "bo", "2029-01-27": "beshalach", "2029-02-03": "yitro",
  "2029-02-10": "mishpatim", "2029-02-17": "terumah", "2029-02-24": "tetzaveh", "2029-03-03": "ki-tisa",
  "2029-03-10": "vayakhel-pekudei", "2029-03-17": "vayikra", "2029-03-24": "tzav", "2029-04-14": "shemini",
  "2029-04-21": "tazria-metzora", "2029-04-28": "acharei-mot-kedoshim", "2029-05-05": "emor", "2029-05-12": "behar-bechukotai",
  "2029-05-19": "bamidbar", "2029-05-26": "naso", "2029-06-02": "behaalotecha", "2029-06-09": "shelach",
  "2029-06-16": "korach", "2029-06-23": "chukat", "2029-06-30": "balak", "2029-07-07": "pinchas",
  "2029-07-14": "matot-masei", "2029-07-21": "devarim", "2029-07-28": "vaetchanan", "2029-08-04": "eikev",
  "2029-08-11": "reeh", "2029-08-18": "shoftim", "2029-08-25": "ki-teitzei", "2029-09-01": "ki-tavo",
  "2029-09-08": "nitzavim", "2029-09-15": "vayelech", "2029-09-22": "haazinu", "2029-10-06": "bereishit",
  "2029-10-13": "noach", "2029-10-20": "lech-lecha", "2029-10-27": "vayera", "2029-11-03": "chayei-sarah",
  "2029-11-10": "toldot", "2029-11-17": "vayetzei", "2029-11-24": "vayishlach", "2029-12-01": "vayeshev",
  "2029-12-08": "miketz", "2029-12-15": "vayigash", "2029-12-22": "vayechi", "2029-12-29": "shemot",
  "2030-01-05": "vaera", "2030-01-12": "bo", "2030-01-19": "beshalach", "2030-01-26": "yitro",
  "2030-02-02": "mishpatim", "2030-02-09": "terumah", "2030-02-16": "tetzaveh", "2030-02-23": "ki-tisa",
  "2030-03-02": "vayakhel", "2030-03-09": "pekudei", "2030-03-16": "vayikra", "2030-03-23": "tzav",
  "2030-03-30": "shemini", "2030-04-06": "tazria", "2030-04-13": "metzora", "2030-04-27": "acharei-mot",
  "2030-05-04": "kedoshim", "2030-05-11": "emor", "2030-05-18": "behar", "2030-05-25": "bechukotai",
  "2030-06-01": "bamidbar", "2030-06-15": "naso", "2030-06-22": "behaalotecha", "2030-06-29": "shelach",
  "2030-07-06": "korach", "2030-07-13": "chukat-balak", "2030-07-20": "pinchas", "2030-07-27": "matot-masei",
  "2030-08-03": "devarim", "2030-08-10": "vaetchanan", "2030-08-17": "eikev", "2030-08-24": "reeh",
  "2030-08-31": "shoftim", "2030-09-07": "ki-teitzei", "2030-09-14": "ki-tavo", "2030-09-21": "nitzavim-vayelech",
  "2030-10-05": "haazinu", "2030-10-26": "bereishit", "2030-11-02": "noach", "2030-11-09": "lech-lecha",
  "2030-11-16": "vayera", "2030-11-23": "chayei-sarah", "2030-11-30": "toldot", "2030-12-07": "vayetzei",
  "2030-12-14": "vayishlach", "2030-12-21": "vayeshev", "2030-12-28": "miketz", "2031-01-04": "vayigash",
  "2031-01-11": "vayechi", "2031-01-18": "shemot", "2031-01-25": "vaera", "2031-02-01": "bo",
  "2031-02-08": "beshalach", "2031-02-15": "yitro", "2031-02-22": "mishpatim", "2031-03-01": "terumah",
  "2031-03-08": "tetzaveh", "2031-03-15": "ki-tisa", "2031-03-22": "vayakhel-pekudei", "2031-03-29": "vayikra",
  "2031-04-05": "tzav", "2031-04-19": "shemini", "2031-04-26": "tazria-metzora", "2031-05-03": "acharei-mot-kedoshim",
  "2031-05-10": "emor", "2031-05-17": "behar-bechukotai", "2031-05-24": "bamidbar", "2031-05-31": "naso",
  "2031-06-07": "behaalotecha", "2031-06-14": "shelach", "2031-06-21": "korach", "2031-06-28": "chukat",
  "2031-07-05": "balak", "2031-07-12": "pinchas", "2031-07-19": "matot-masei", "2031-07-26": "devarim",
  "2031-08-02": "vaetchanan", "2031-08-09": "eikev", "2031-08-16": "reeh", "2031-08-23": "shoftim",
  "2031-08-30": "ki-teitzei", "2031-09-06": "ki-tavo", "2031-09-13": "nitzavim-vayelech", "2031-09-20": "haazinu",
  "2031-10-11": "bereishit", "2031-10-18": "noach", "2031-10-25": "lech-lecha", "2031-11-01": "vayera",
  "2031-11-08": "chayei-sarah", "2031-11-15": "toldot", "2031-11-22": "vayetzei", "2031-11-29": "vayishlach",
  "2031-12-06": "vayeshev", "2031-12-13": "miketz", "2031-12-20": "vayigash", "2031-12-27": "vayechi",
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
