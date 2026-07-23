import {
  BookOpen, Landmark, ScrollText, Scroll, Sparkles, HeartHandshake,
  Library, type LucideIcon,
} from "lucide-react";

import imgChumash from "@/assets/collections/chumash.webp";
import imgNeviim from "@/assets/collections/neviim.webp";
import imgKesuvim from "@/assets/collections/kesuvim.webp";
import imgMegillos from "@/assets/collections/megillos.webp";
import imgYamimTovim from "@/assets/collections/yamim-tovim.webp";
import imgMiddos from "@/assets/collections/middos.webp";
import imgComplete from "@/assets/collections/complete.webp";

export interface Collection {
  key: string;
  icon: LucideIcon;
  image: string;
  name: string;
  blurb: string;
  books: string;
  priceUsd: number;
  priceIls: number;
  featured?: boolean;
}

// Bundle catalog — front-end only for now (no live checkout). Requests flow
// through the creation wizard in "collection request" mode and land in the
// admin inbox as contact tickets; invoicing + generation are handled by hand.
// Book counts match the story catalog (TorahPortions by category).
export const COLLECTIONS: Collection[] = [
  { key: "chumash", icon: BookOpen, image: imgChumash, name: "The Chumash Collection", blurb: "Every weekly parsha across all five Chumashim — Bereishis through Devarim — a full year of personalized parsha storybooks.", books: "54 books", priceUsd: 349, priceIls: 1290 },
  { key: "neviim", icon: Landmark, image: imgNeviim, name: "The Nevi'im Collection", blurb: "The heroes and prophets of Tanach — Yehoshua, Shoftim, Shmuel, Melachim and more brought to life for your kinderlach.", books: "25 books", priceUsd: 179, priceIls: 660 },
  { key: "kesuvim", icon: ScrollText, image: imgKesuvim, name: "The Kesuvim Collection", blurb: "Timeless stories and lessons from the Writings — Tehillim, Mishlei, Daniel, Divrei HaYamim and beyond.", books: "21 books", priceUsd: 149, priceIls: 550 },
  { key: "megillos", icon: Scroll, image: imgMegillos, name: "The Megillos Collection", blurb: "All five Megillos — Esther, Rus, Shir HaShirim, Eicha and Koheles — one keepsake set.", books: "5 books", priceUsd: 49, priceIls: 180 },
  { key: "yamim-tovim", icon: Sparkles, image: imgYamimTovim, name: "The Yamim Tovim Collection", blurb: "A story for every Yom Tov — Rosh Hashanah, Yom Kippur, Sukkos, Chanukah, Purim, Pesach, Shavuos and more.", books: "15 books", priceUsd: 109, priceIls: 400 },
  { key: "middos", icon: HeartHandshake, image: imgMiddos, name: "The Middos Collection", blurb: "Character-building adventures — chesed, emes, kibud av va'em, savlanus and more middos tovos.", books: "10 books", priceUsd: 79, priceIls: 290 },
  { key: "complete", icon: Library, image: imgComplete, name: "The Complete Collection", blurb: "The ultimate library — every Chumash, Nevi'im, Kesuvim, Megillos, Yamim Tovim and Middos book, all starring your child. Our very best value.", books: "130 books", priceUsd: 799, priceIls: 2950, featured: true },
];

export const getCollection = (key: string | null | undefined): Collection | undefined =>
  COLLECTIONS.find((c) => c.key === key);
