import torahArt from "@/assets/categories/torah.jpg";
import neviimArt from "@/assets/categories/neviim.jpg";
import ketuvimArt from "@/assets/categories/ketuvim.jpg";
import megillotArt from "@/assets/categories/megillot.jpg";
import holidayArt from "@/assets/categories/holiday.jpg";
import educationalArt from "@/assets/categories/educational.jpg";

/**
 * A sample story title page per category, shown on every story option in that
 * category instead of a line icon - so browsing Yamim Tovim looks like browsing
 * a shelf of holiday books rather than a list of glyphs.
 *
 * The art is deliberately TEXT-FREE: one image serves English, Hebrew and
 * Yiddish, and the story's own name is set beside it.
 */
export const CATEGORY_ART: Record<string, string> = {
  torah: torahArt,
  neviim: neviimArt,
  ketuvim: ketuvimArt,
  megillot: megillotArt,
  holiday: holidayArt,
  educational: educationalArt,
};

export const categoryArt = (category?: string | null): string | undefined =>
  category ? CATEGORY_ART[category] : undefined;
