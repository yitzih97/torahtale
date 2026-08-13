/* Locale-aware date formatting for the dashboard.
 *
 * date-fns' format()/formatDistanceToNow() render English month/weekday names
 * unless a `locale` is passed. These helpers pick the Hebrew locale for
 * Hebrew/Yiddish (Yiddish has no date-fns locale, so it borrows Hebrew month
 * names — the closest available) and English otherwise. */
import { format as fnsFormat, formatDistanceToNow as fnsDistance } from "date-fns";
import { he } from "date-fns/locale";

export type UiLang = "en" | "he" | "yi";

const localeFor = (lang: UiLang) => (lang === "he" || lang === "yi" ? he : undefined);

/** format() with the UI language's locale (Hebrew months for he/yi). */
export const dfFormat = (date: Date | number, fmt: string, lang: UiLang): string =>
  fnsFormat(date, fmt, { locale: localeFor(lang) });

/** formatDistanceToNow() localized to the UI language (no suffix). */
export const dfDistance = (date: Date | number, lang: UiLang): string =>
  fnsDistance(date, { locale: localeFor(lang) });
