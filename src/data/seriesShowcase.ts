import seriesYamimTovim from "@/assets/collections/yamim-tovim.webp";
import seriesMiddos from "@/assets/collections/middos.webp";
import seriesNeviim from "@/assets/collections/neviim.webp";
import seriesComplete from "@/assets/collections/complete.webp";

export interface SeriesTeaser {
  image: string;
  label: Record<"en" | "he" | "yi", string>;
}

/** The four "series" tiles showcased on the back cover — a taste of the OTHER
 *  Torah Tale weekly series a subscriber can collect. Yamim Tovim + Middos are
 *  called out by name; Nevi'im adds variety and the last tile invites the reader
 *  to explore the rest. Swap the entries here to change what the back cover shows
 *  (both the printed cover and the on-screen preview read from this one list). */
export const SERIES_SHOWCASE: SeriesTeaser[] = [
  { image: seriesYamimTovim, label: { en: "Yamim Tovim", he: "ימים טובים", yi: "ימים טובים" } },
  { image: seriesMiddos, label: { en: "Middos", he: "מידות", yi: "מידות" } },
  { image: seriesNeviim, label: { en: "Nevi'im", he: "נביאים", yi: "נביאים" } },
  { image: seriesComplete, label: { en: "& many more", he: "ועוד הרבה", yi: "און נאך אסאך" } },
];

/** Small-caps label above the series-teaser row on the back cover. */
export const SERIES_ROW_LABEL: Record<"en" | "he" | "yi", string> = {
  en: "More weekly series",
  he: "עוד סדרות שבועיות",
  yi: "נאך וועכנטלעכע סעריעס",
};
