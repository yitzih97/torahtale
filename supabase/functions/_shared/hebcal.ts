// Live weekly-parsha lookup via the Hebcal sedrot API (free, public, CORS-open).
// This is the auto-updating source of truth for which parsha a subscription book
// covers — it never runs dry, unlike a hardcoded calendar. _shared/parsha.ts wraps
// it with a hardcoded fallback for when Hebcal is unreachable.

const VALID = new Set([
  "bereishit","noach","lech-lecha","vayera","chayei-sarah","toldot","vayetzei","vayishlach",
  "vayeshev","miketz","vayigash","vayechi","shemot","vaera","bo","beshalach","yitro","mishpatim",
  "terumah","tetzaveh","ki-tisa","vayakhel","pekudei","vayikra","tzav","shemini","tazria","metzora",
  "acharei-mot","kedoshim","emor","behar","bechukotai","bamidbar","naso","behaalotecha","shelach",
  "korach","chukat","balak","pinchas","matot","masei","devarim","vaetchanan","eikev","reeh","shoftim",
  "ki-teitzei","ki-tavo","nitzavim","vayelech","haazinu","vezot-habracha",
]);

// Hebcal spellings (and combined parshiyot) that differ from our slugs. Combined
// weeks (e.g. "Matot-Masei") map to the first parsha, matching our book templates.
const ALIAS: Record<string, string> = {
  "bereshit": "bereishit", "chayei-sara": "chayei-sarah", "shmini": "shemini",
  "achrei-mot": "acharei-mot", "nasso": "naso", "behaalotcha": "behaalotecha",
  "shlach": "shelach", "vayeilech": "vayelech",
  "vezot-haberakhah": "vezot-habracha", "vezot-haberachah": "vezot-habracha",
  "vayakhel-pekudei": "vayakhel", "tazria-metzora": "tazria", "achrei-mot-kedoshim": "acharei-mot",
  "behar-bechukotai": "behar", "chukat-balak": "chukat", "matot-masei": "matot",
  "nitzavim-vayeilech": "nitzavim", "nitzavim-vayelech": "nitzavim",
};

export function parshaSlugFromTitle(title: string): string | null {
  let s = title.replace(/^Parashat\s+/i, "").toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-");
  s = ALIAS[s] ?? s;
  return VALID.has(s) ? s : null;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * The parsha read `leadWeeks` weeks after `from` (default 3 — production lead),
 * fetched live from Hebcal (diaspora). Returns the slug, or null if Hebcal is
 * unreachable / returns nothing (caller should fall back to the hardcoded calendar).
 */
export async function fetchUpcomingParshaSlug(from: Date = new Date(), leadWeeks = 3): Promise<string | null> {
  const daysUntilSat = (6 - from.getDay() + 7) % 7 || 7;
  const target = new Date(from);
  target.setDate(from.getDate() + daysUntilSat + leadWeeks * 7);
  const targetKey = iso(target);

  const windowStart = new Date(target); windowStart.setDate(target.getDate() - 7);
  const windowEnd = new Date(target); windowEnd.setDate(target.getDate() + 21);
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&start=${iso(windowStart)}&end=${iso(windowEnd)}&s=on&i=off`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const events = (data.items || []).filter((e: { category?: string }) => e.category === "parashat");
    const hit = events.find((e: { date: string }) => e.date === targetKey)
      || events.find((e: { date: string }) => e.date >= targetKey);
    return hit ? parshaSlugFromTitle(hit.title) : null;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
