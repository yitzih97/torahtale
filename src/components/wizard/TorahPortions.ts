export interface TorahOption {
  value: string;
  label: string;
  sub: string;
  category: "torah" | "neviim" | "ketuvim" | "megillot" | "holiday";
  book?: string;
  emoji?: string;
}

export const TORAH_PORTIONS: TorahOption[] = [
  // ──── TORAH (Chumash) ────

  // Bereishis
  { value: "bereishit", label: "Parashas Bereishis", sub: "פרשת בראשית", category: "torah", book: "Bereishit", emoji: "🌍" },
  { value: "noach", label: "Parashas Noach", sub: "פרשת נח", category: "torah", book: "Bereishit", emoji: "🌈" },
  { value: "lech-lecha", label: "Parashas Lech Lecha", sub: "פרשת לך לך", category: "torah", book: "Bereishit", emoji: "🏕️" },
  { value: "vayera", label: "Parashas Vayeira", sub: "פרשת וירא", category: "torah", book: "Bereishit", emoji: "👼" },
  { value: "chayei-sarah", label: "Parashas Chayei Sarah", sub: "פרשת חיי שרה", category: "torah", book: "Bereishit", emoji: "💍" },
  { value: "toldot", label: "Parashas Toldos", sub: "פרשת תולדות", category: "torah", book: "Bereishit", emoji: "👬" },
  { value: "vayetzei", label: "Parashas Vayeitzei", sub: "פרשת ויצא", category: "torah", book: "Bereishit", emoji: "🪜" },
  { value: "vayishlach", label: "Parashas Vayishlach", sub: "פרשת וישלח", category: "torah", book: "Bereishit", emoji: "💪" },
  { value: "vayeshev", label: "Parashas Vayeishev", sub: "פרשת וישב", category: "torah", book: "Bereishit", emoji: "🧥" },
  { value: "miketz", label: "Parashas Mikeitz", sub: "פרשת מקץ", category: "torah", book: "Bereishit", emoji: "🏛️" },
  { value: "vayigash", label: "Parashas Vayigash", sub: "פרשת ויגש", category: "torah", book: "Bereishit", emoji: "🤗" },
  { value: "vayechi", label: "Parashas Vayechi", sub: "פרשת ויחי", category: "torah", book: "Bereishit", emoji: "🙏" },

  // Shemos
  { value: "shemot", label: "Parashas Shemos", sub: "פרשת שמות", category: "torah", book: "Shemot", emoji: "👶" },
  { value: "vaera", label: "Parashas Va'eira", sub: "פרשת וארא", category: "torah", book: "Shemot", emoji: "🐸" },
  { value: "bo", label: "Parashas Bo", sub: "פרשת בא", category: "torah", book: "Shemot", emoji: "🚶" },
  { value: "beshalach", label: "Parashas Beshalach", sub: "פרשת בשלח", category: "torah", book: "Shemot", emoji: "🌊" },
  { value: "yitro", label: "Parashas Yisro", sub: "פרשת יתרו", category: "torah", book: "Shemot", emoji: "⛰️" },
  { value: "mishpatim", label: "Parashas Mishpatim", sub: "פרשת משפטים", category: "torah", book: "Shemot", emoji: "⚖️" },
  { value: "terumah", label: "Parashas Terumah", sub: "פרשת תרומה", category: "torah", book: "Shemot", emoji: "🏗️" },
  { value: "tetzaveh", label: "Parashas Tetzaveh", sub: "פרשת תצוה", category: "torah", book: "Shemot", emoji: "👗" },
  { value: "ki-tisa", label: "Parashas Ki Sisa", sub: "פרשת כי תשא", category: "torah", book: "Shemot", emoji: "🐄" },
  { value: "vayakhel", label: "Parashas Vayakhel", sub: "פרשת ויקהל", category: "torah", book: "Shemot", emoji: "🤝" },
  { value: "pekudei", label: "Parashas Pekudei", sub: "פרשת פקודי", category: "torah", book: "Shemot", emoji: "📦" },

  // Vayikra
  { value: "vayikra", label: "Parashas Vayikra", sub: "פרשת ויקרא", category: "torah", book: "Vayikra", emoji: "🔥" },
  { value: "tzav", label: "Parashas Tzav", sub: "פרשת צו", category: "torah", book: "Vayikra", emoji: "🕯️" },
  { value: "shemini", label: "Parashas Shemini", sub: "פרשת שמיני", category: "torah", book: "Vayikra", emoji: "8️⃣" },
  { value: "tazria", label: "Parashas Tazria", sub: "פרשת תזריע", category: "torah", book: "Vayikra", emoji: "🌱" },
  { value: "metzora", label: "Parashas Metzora", sub: "פרשת מצורע", category: "torah", book: "Vayikra", emoji: "💬" },
  { value: "acharei-mot", label: "Parashas Acharei Mos", sub: "פרשת אחרי מות", category: "torah", book: "Vayikra", emoji: "🕊️" },
  { value: "kedoshim", label: "Parashas Kedoshim", sub: "פרשת קדושים", category: "torah", book: "Vayikra", emoji: "✨" },
  { value: "emor", label: "Parashas Emor", sub: "פרשת אמור", category: "torah", book: "Vayikra", emoji: "🎉" },
  { value: "behar", label: "Parashas Behar", sub: "פרשת בהר", category: "torah", book: "Vayikra", emoji: "🌾" },
  { value: "bechukotai", label: "Parashas Bechukosai", sub: "פרשת בחוקותי", category: "torah", book: "Vayikra", emoji: "🛤️" },

  // Bamidbar
  { value: "bamidbar", label: "Parashas Bamidbar", sub: "פרשת במדבר", category: "torah", book: "Bamidbar", emoji: "🏜️" },
  { value: "naso", label: "Parashas Naso", sub: "פרשת נשא", category: "torah", book: "Bamidbar", emoji: "🙌" },
  { value: "behaalotecha", label: "Parashas Beha'aloscha", sub: "פרשת בהעלותך", category: "torah", book: "Bamidbar", emoji: "🕎" },
  { value: "shelach", label: "Parashas Shelach", sub: "פרשת שלח", category: "torah", book: "Bamidbar", emoji: "🍇" },
  { value: "korach", label: "Parashas Korach", sub: "פרשת קרח", category: "torah", book: "Bamidbar", emoji: "⚡" },
  { value: "chukat", label: "Parashas Chukas", sub: "פרשת חוקת", category: "torah", book: "Bamidbar", emoji: "🐄" },
  { value: "balak", label: "Parashas Balak", sub: "פרשת בלק", category: "torah", book: "Bamidbar", emoji: "🫏" },
  { value: "pinchas", label: "Parashas Pinchas", sub: "פרשת פנחס", category: "torah", book: "Bamidbar", emoji: "🛡️" },
  { value: "matot", label: "Parashas Matos", sub: "פרשת מטות", category: "torah", book: "Bamidbar", emoji: "🤞" },
  { value: "masei", label: "Parashas Masei", sub: "פרשת מסעי", category: "torah", book: "Bamidbar", emoji: "🗺️" },

  // Devarim
  { value: "devarim", label: "Parashas Devarim", sub: "פרשת דברים", category: "torah", book: "Devarim", emoji: "📢" },
  { value: "vaetchanan", label: "Parashas Va'eschanan", sub: "פרשת ואתחנן", category: "torah", book: "Devarim", emoji: "👂" },
  { value: "eikev", label: "Parashas Eikev", sub: "פרשת עקב", category: "torah", book: "Devarim", emoji: "🍯" },
  { value: "reeh", label: "Parashas Re'eh", sub: "פרשת ראה", category: "torah", book: "Devarim", emoji: "👁️" },
  { value: "shoftim", label: "Parashas Shoftim", sub: "פרשת שופטים", category: "torah", book: "Devarim", emoji: "⚖️" },
  { value: "ki-teitzei", label: "Parashas Ki Seitzei", sub: "פרשת כי תצא", category: "torah", book: "Devarim", emoji: "💛" },
  { value: "ki-tavo", label: "Parashas Ki Savo", sub: "פרשת כי תבוא", category: "torah", book: "Devarim", emoji: "🍎" },
  { value: "nitzavim", label: "Parashas Nitzavim", sub: "פרשת נצבים", category: "torah", book: "Devarim", emoji: "🧍" },
  { value: "vayelech", label: "Parashas Vayeilech", sub: "פרשת וילך", category: "torah", book: "Devarim", emoji: "👋" },
  { value: "haazinu", label: "Parashas Ha'azinu", sub: "פרשת האזינו", category: "torah", book: "Devarim", emoji: "🎵" },
  { value: "vezot-habracha", label: "Parashas V'Zos Habracha", sub: "פרשת וזאת הברכה", category: "torah", book: "Devarim", emoji: "🌅" },

  // ──── NEVI'IM (Prophets) ────
  { value: "yehoshua-jordan", label: "Sefer Yehoshua – Crossing the Yarden", sub: "ספר יהושע – חציית הירדן", category: "neviim", book: "Yehoshua", emoji: "🏞️" },
  { value: "yehoshua-jericho", label: "Sefer Yehoshua – Walls of Yericho", sub: "ספר יהושע – חומות יריחו", category: "neviim", book: "Yehoshua", emoji: "🎺" },
  { value: "devorah", label: "Sefer Shoftim – Devorah", sub: "ספר שופטים – דבורה", category: "neviim", book: "Shoftim", emoji: "⚔️" },
  { value: "shimshon", label: "Sefer Shoftim – Shimshon", sub: "ספר שופטים – שמשון", category: "neviim", book: "Shoftim", emoji: "💪" },
  { value: "shmuel-birth", label: "Sefer Shmuel – Birth of Shmuel", sub: "ספר שמואל – לידת שמואל", category: "neviim", book: "Shmuel", emoji: "🏛️" },
  { value: "david-goliath", label: "Sefer Shmuel – Dovid & Golias", sub: "ספר שמואל – דוד וגוליית", category: "neviim", book: "Shmuel", emoji: "🪨" },
  { value: "david-yonatan", label: "Sefer Shmuel – Dovid & Yonasan", sub: "ספר שמואל – דוד ויונתן", category: "neviim", book: "Shmuel", emoji: "🤝" },
  { value: "shlomo-wisdom", label: "Sefer Melachim – Shlomo's Wisdom", sub: "ספר מלכים – חכמת שלמה", category: "neviim", book: "Melachim", emoji: "👑" },
  { value: "eliyahu-carmel", label: "Sefer Melachim – Eliyahu on Carmel", sub: "ספר מלכים – אליהו בכרמל", category: "neviim", book: "Melachim", emoji: "🔥" },
  { value: "eliyahu-chariot", label: "Sefer Melachim – Eliyahu's Chariot", sub: "ספר מלכים – מרכבת אליהו", category: "neviim", book: "Melachim", emoji: "🐴" },
  { value: "elisha-miracles", label: "Sefer Melachim – Elisha's Miracles", sub: "ספר מלכים – ניסי אלישע", category: "neviim", book: "Melachim", emoji: "✨" },
  { value: "yeshayahu-peace", label: "Sefer Yeshayahu – Vision of Peace", sub: "ספר ישעיהו – חזון השלום", category: "neviim", book: "Yeshayahu", emoji: "🕊️" },
  { value: "yirmiyahu-call", label: "Sefer Yirmiyahu – The Navi's Call", sub: "ספר ירמיהו – קריאת הנביא", category: "neviim", book: "Yirmiyahu", emoji: "📜" },
  { value: "yechezkel-bones", label: "Sefer Yechezkel – The Valley of Dry Bones", sub: "ספר יחזקאל – בקעת העצמות היבשות", category: "neviim", book: "Yechezkel", emoji: "🦴" },
  { value: "yonah", label: "Sefer Yonah", sub: "ספר יונה", category: "neviim", book: "Trei Asar", emoji: "🐋" },

  // ──── KETUVIM (Writings) ────
  { value: "tehillim-shepherd", label: "Tehillim – Hashem Is My Shepherd", sub: "תהלים – ה׳ רועי", category: "ketuvim", book: "Tehillim", emoji: "🐑" },
  { value: "tehillim-creation", label: "Tehillim – Praising Creation", sub: "תהלים – הלל הבריאה", category: "ketuvim", book: "Tehillim", emoji: "🌸" },
  { value: "mishlei-wisdom", label: "Sefer Mishlei – Wisdom", sub: "ספר משלי – חכמה", category: "ketuvim", book: "Mishlei", emoji: "📚" },
  { value: "iyov", label: "Sefer Iyov", sub: "ספר איוב", category: "ketuvim", book: "Iyov", emoji: "🙏" },
  { value: "daniel-lions", label: "Sefer Daniel – The Lion's Den", sub: "ספר דניאל – גוב האריות", category: "ketuvim", book: "Daniel", emoji: "🦁" },
  { value: "daniel-furnace", label: "Sefer Daniel – The Fiery Furnace", sub: "ספר דניאל – כבשן האש", category: "ketuvim", book: "Daniel", emoji: "🔥" },
  { value: "ezra-return", label: "Sefer Ezra – Return to Yerushalayim", sub: "ספר עזרא – שיבת ירושלים", category: "ketuvim", book: "Ezra", emoji: "🏙️" },
  { value: "nechemia-walls", label: "Sefer Nechemia – Rebuilding the Walls", sub: "ספר נחמיה – בניית החומות", category: "ketuvim", book: "Nechemia", emoji: "🧱" },
  { value: "divrei-hayamim", label: "Sefer Divrei HaYamim", sub: "ספר דברי הימים", category: "ketuvim", book: "Divrei HaYamim", emoji: "📜" },

  // ──── MEGILLOS ────
  { value: "esther", label: "Megillas Esther", sub: "מגילת אסתר", category: "megillot", emoji: "👸" },
  { value: "ruth", label: "Megillas Rus", sub: "מגילת רות", category: "megillot", emoji: "🌾" },
  { value: "shir-hashirim", label: "Shir HaShirim", sub: "שיר השירים", category: "megillot", emoji: "🌹" },
  { value: "kohelet", label: "Koheles", sub: "קהלת", category: "megillot", emoji: "⏳" },
  { value: "eicha", label: "Megillas Eicha", sub: "מגילת איכה", category: "megillot", emoji: "😢" },

  // ──── YAMIM TOVIM ────
  { value: "pesach", label: "Pesach", sub: "פסח", category: "holiday", emoji: "🫓" },
  { value: "purim", label: "Purim", sub: "פורים", category: "holiday", emoji: "🎭" },
  { value: "chanukah", label: "Chanukah", sub: "חנוכה", category: "holiday", emoji: "🕎" },
  { value: "sukkot", label: "Sukkos", sub: "סוכות", category: "holiday", emoji: "🛖" },
  { value: "shavuot", label: "Shavuos", sub: "שבועות", category: "holiday", emoji: "📜" },
  { value: "rosh-hashana", label: "Rosh Hashanah", sub: "ראש השנה", category: "holiday", emoji: "📯" },
  { value: "yom-kippur", label: "Yom Kippur", sub: "יום כיפור", category: "holiday", emoji: "🕊️" },
  { value: "simchat-torah", label: "Simchas Torah", sub: "שמחת תורה", category: "holiday", emoji: "🎉" },
  { value: "tu-bishvat", label: "Tu B'Shvat", sub: "ט״ו בשבט", category: "holiday", emoji: "🌳" },
  { value: "lag-baomer", label: "Lag B'Omer", sub: "ל״ג בעומר", category: "holiday", emoji: "🔥" },
];

export const TORAH_BOOKS = ["Bereishit", "Shemot", "Vayikra", "Bamidbar", "Devarim"] as const;

/** Bilingual sefer titles for the Torah books — shown as accordion headers. */
export const TORAH_BOOK_LABELS: Record<string, { en: string; he: string }> = {
  Bereishit: { en: "Sefer Bereishis", he: "ספר בראשית" },
  Shemot: { en: "Sefer Shemos", he: "ספר שמות" },
  Vayikra: { en: "Sefer Vayikra", he: "ספר ויקרא" },
  Bamidbar: { en: "Sefer Bamidbar", he: "ספר במדבר" },
  Devarim: { en: "Sefer Devarim", he: "ספר דברים" },
};

/** Sifrei Nevi'im, in order — used to group the Nevi'im list into accordions. */
export const NEVIIM_BOOKS = ["Yehoshua", "Shoftim", "Shmuel", "Melachim", "Yeshayahu", "Yirmiyahu", "Yechezkel", "Trei Asar"] as const;

/** Sifrei Kesuvim (excluding the Megillos, which are their own category). */
export const KETUVIM_BOOKS = ["Tehillim", "Mishlei", "Iyov", "Daniel", "Ezra", "Nechemia", "Divrei HaYamim"] as const;

/** Bilingual sefer titles for Nevi'im + Kesuvim accordion headers. */
const NEVIIM_KETUVIM_BOOK_LABELS: Record<string, { en: string; he: string }> = {
  Yehoshua: { en: "Sefer Yehoshua", he: "ספר יהושע" },
  Shoftim: { en: "Sefer Shoftim", he: "ספר שופטים" },
  Shmuel: { en: "Sefer Shmuel", he: "ספר שמואל" },
  Melachim: { en: "Sefer Melachim", he: "ספר מלכים" },
  Yeshayahu: { en: "Sefer Yeshayahu", he: "ספר ישעיהו" },
  Yirmiyahu: { en: "Sefer Yirmiyahu", he: "ספר ירמיהו" },
  Yechezkel: { en: "Sefer Yechezkel", he: "ספר יחזקאל" },
  "Trei Asar": { en: "Trei Asar", he: "תרי עשר" },
  Tehillim: { en: "Sefer Tehillim", he: "ספר תהלים" },
  Mishlei: { en: "Sefer Mishlei", he: "ספר משלי" },
  Iyov: { en: "Sefer Iyov", he: "ספר איוב" },
  Daniel: { en: "Sefer Daniel", he: "ספר דניאל" },
  Ezra: { en: "Sefer Ezra", he: "ספר עזרא" },
  Nechemia: { en: "Sefer Nechemia", he: "ספר נחמיה" },
  "Divrei HaYamim": { en: "Sefer Divrei HaYamim", he: "ספר דברי הימים" },
};

/** All sefer labels (Torah + Nevi'im + Kesuvim) keyed by `book`. */
export const BOOK_LABELS: Record<string, { en: string; he: string }> = {
  ...TORAH_BOOK_LABELS,
  ...NEVIIM_KETUVIM_BOOK_LABELS,
};

/**
 * Which categories drill down into per-sefer accordions, and in what order.
 * Categories mapped to `null` render as a flat grid of stories.
 */
export const CATEGORY_BOOKS: Record<TorahOption["category"], readonly string[] | null> = {
  torah: TORAH_BOOKS,
  neviim: NEVIIM_BOOKS,
  ketuvim: KETUVIM_BOOKS,
  megillot: null,
  holiday: null,
};

export const CATEGORY_META: Record<TorahOption["category"], { label: string; emoji: string }> = {
  torah: { label: "Torah", emoji: "📜" },
  neviim: { label: "Nevi'im", emoji: "⚔️" },
  ketuvim: { label: "Kesuvim", emoji: "✍️" },
  megillot: { label: "Megillos", emoji: "📖" },
  holiday: { label: "Yamim Tovim", emoji: "🕯️" },
};

export const getPortionLabel = (value: string): string => {
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  return found ? `${found.label} / ${found.sub}` : value;
};

/** Capitalize first letter of fallback slug, replacing dashes with spaces. */
const prettifySlug = (value: string): string =>
  value
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");

/** Language-aware display: English label for "en", Hebrew sub for "he"/"yi". */
export const getPortionDisplay = (value: string, lang: "en" | "he" | "yi"): string => {
  if (!value) return "";
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  if (!found) return prettifySlug(value);
  return lang === "en" ? found.label : found.sub;
};

/**
 * Weekly Torah portion reading schedule.
 * Maps a Saturday date (YYYY-MM-DD) to the parashah value(s) read that Shabbat.
 */
const PARSHA_CALENDAR: Record<string, string> = {
  // 5785 cycle (2024-2025)
  "2024-10-26": "bereishit",
  "2024-11-02": "noach",
  "2024-11-09": "lech-lecha",
  "2024-11-16": "vayera",
  "2024-11-23": "chayei-sarah",
  "2024-11-30": "toldot",
  "2024-12-07": "vayetzei",
  "2024-12-14": "vayishlach",
  "2024-12-21": "vayeshev",
  "2024-12-28": "miketz",
  "2025-01-04": "vayigash",
  "2025-01-11": "vayechi",
  "2025-01-18": "shemot",
  "2025-01-25": "vaera",
  "2025-02-01": "bo",
  "2025-02-08": "beshalach",
  "2025-02-15": "yitro",
  "2025-02-22": "mishpatim",
  "2025-03-01": "terumah",
  "2025-03-08": "tetzaveh",
  "2025-03-15": "ki-tisa",
  "2025-03-22": "vayakhel",
  "2025-03-29": "pekudei",
  "2025-04-05": "vayikra",
  "2025-04-12": "tzav",
  "2025-04-26": "shemini",
  "2025-05-03": "tazria",
  "2025-05-10": "metzora",
  "2025-05-17": "acharei-mot",
  "2025-05-24": "kedoshim",
  "2025-05-31": "emor",
  "2025-06-07": "behar",
  "2025-06-14": "bechukotai",
  "2025-06-21": "bamidbar",
  "2025-06-28": "naso",
  "2025-07-05": "behaalotecha",
  "2025-07-12": "shelach",
  "2025-07-19": "korach",
  "2025-07-26": "chukat",
  "2025-08-02": "balak",
  "2025-08-09": "pinchas",
  "2025-08-16": "matot",
  "2025-08-23": "masei",
  "2025-08-30": "devarim",
  "2025-09-06": "vaetchanan",
  "2025-09-13": "eikev",
  "2025-09-20": "reeh",
  "2025-09-27": "shoftim",
  "2025-10-04": "ki-teitzei",
  "2025-10-11": "ki-tavo",
  "2025-10-18": "nitzavim",
  // 5786 cycle (2025-2026)
  "2025-10-25": "bereishit",
  "2025-11-01": "noach",
  "2025-11-08": "lech-lecha",
  "2025-11-15": "vayera",
  "2025-11-22": "chayei-sarah",
  "2025-11-29": "toldot",
  "2025-12-06": "vayetzei",
  "2025-12-13": "vayishlach",
  "2025-12-20": "vayeshev",
  "2025-12-27": "miketz",
  "2026-01-03": "vayigash",
  "2026-01-10": "vayechi",
  "2026-01-17": "shemot",
  "2026-01-24": "vaera",
  "2026-01-31": "bo",
  "2026-02-07": "beshalach",
  "2026-02-14": "yitro",
  "2026-02-21": "mishpatim",
  "2026-02-28": "terumah",
  "2026-03-07": "tetzaveh",
  "2026-03-14": "ki-tisa",
  "2026-03-21": "vayakhel",
  "2026-03-28": "pekudei",
  "2026-04-04": "vayikra",
  "2026-04-11": "tzav",
  "2026-04-18": "shemini",
  "2026-04-25": "tazria",
  "2026-05-02": "metzora",
  "2026-05-09": "acharei-mot",
  "2026-05-16": "kedoshim",
  "2026-05-23": "emor",
  "2026-05-30": "behar",
  "2026-06-06": "bechukotai",
  "2026-06-13": "bamidbar",
  "2026-06-20": "naso",
  "2026-06-27": "behaalotecha",
  "2026-07-04": "shelach",
  "2026-07-11": "korach",
  "2026-07-18": "chukat",
  "2026-07-25": "balak",
  "2026-08-01": "pinchas",
  "2026-08-08": "matot",
  "2026-08-15": "masei",
  "2026-08-22": "devarim",
  "2026-08-29": "vaetchanan",
  "2026-09-05": "eikev",
  "2026-09-12": "reeh",
  "2026-09-19": "shoftim",
  "2026-09-26": "ki-teitzei",
  "2026-10-03": "ki-tavo",
  "2026-10-10": "nitzavim",
};

/** Returns the parashah read three weeks from now (production lead time). */
export const getUpcomingParsha = (): string => {
  const now = new Date();
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  const targetSat = new Date(now);
  targetSat.setDate(now.getDate() + daysUntilSat + 21);
  const key = targetSat.toISOString().slice(0, 10);

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];

  const allDates = Object.keys(PARSHA_CALENDAR).sort();
  const future = allDates.find(d => d >= key);
  if (future) return PARSHA_CALENDAR[future];

  return "bereishit";
};
