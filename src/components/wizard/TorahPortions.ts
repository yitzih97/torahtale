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

  // Bereishit
  { value: "bereishit", label: "Parshas Bereishis", sub: "פרשת בראשית", category: "torah", book: "Bereishit", emoji: "🌍" },
  { value: "noach", label: "Parshas Noach", sub: "פרשת נח", category: "torah", book: "Bereishit", emoji: "🌈" },
  { value: "lech-lecha", label: "Parshas Lech Lecha", sub: "פרשת לך לך", category: "torah", book: "Bereishit", emoji: "🏕️" },
  { value: "vayera", label: "Parshas Vayeira", sub: "פרשת וירא", category: "torah", book: "Bereishit", emoji: "👼" },
  { value: "chayei-sarah", label: "Parshas Chayei Sarah", sub: "פרשת חיי שרה", category: "torah", book: "Bereishit", emoji: "💍" },
  { value: "toldot", label: "Parshas Toldos", sub: "פרשת תולדות", category: "torah", book: "Bereishit", emoji: "👬" },
  { value: "vayetzei", label: "Parshas Vayeitzei", sub: "פרשת ויצא", category: "torah", book: "Bereishit", emoji: "🪜" },
  { value: "vayishlach", label: "Parshas Vayishlach", sub: "פרשת וישלח", category: "torah", book: "Bereishit", emoji: "💪" },
  { value: "vayeshev", label: "Parshas Vayeishev", sub: "פרשת וישב", category: "torah", book: "Bereishit", emoji: "🧥" },
  { value: "miketz", label: "Parshas Mikeitz", sub: "פרשת מקץ", category: "torah", book: "Bereishit", emoji: "🏛️" },
  { value: "vayigash", label: "Parshas Vayigash", sub: "פרשת ויגש", category: "torah", book: "Bereishit", emoji: "🤗" },
  { value: "vayechi", label: "Parshas Vayechi", sub: "פרשת ויחי", category: "torah", book: "Bereishit", emoji: "🙏" },

  // Shemot
  { value: "shemot", label: "Parshas Shemos", sub: "פרשת שמות", category: "torah", book: "Shemot", emoji: "👶" },
  { value: "vaera", label: "Parshas Va'eira", sub: "פרשת וארא", category: "torah", book: "Shemot", emoji: "🐸" },
  { value: "bo", label: "Parshas Bo", sub: "פרשת בא", category: "torah", book: "Shemot", emoji: "🚶" },
  { value: "beshalach", label: "Parshas Beshalach", sub: "פרשת בשלח", category: "torah", book: "Shemot", emoji: "🌊" },
  { value: "yitro", label: "Parshas Yisro", sub: "פרשת יתרו", category: "torah", book: "Shemot", emoji: "⛰️" },
  { value: "mishpatim", label: "Parshas Mishpatim", sub: "פרשת משפטים", category: "torah", book: "Shemot", emoji: "⚖️" },
  { value: "terumah", label: "Parshas Terumah", sub: "פרשת תרומה", category: "torah", book: "Shemot", emoji: "🏗️" },
  { value: "tetzaveh", label: "Parshas Tetzaveh", sub: "פרשת תצוה", category: "torah", book: "Shemot", emoji: "👗" },
  { value: "ki-tisa", label: "Parshas Ki Sisa", sub: "פרשת כי תשא", category: "torah", book: "Shemot", emoji: "🐄" },
  { value: "vayakhel", label: "Parshas Vayakhel", sub: "פרשת ויקהל", category: "torah", book: "Shemot", emoji: "🤝" },
  { value: "pekudei", label: "Parshas Pekudei", sub: "פרשת פקודי", category: "torah", book: "Shemot", emoji: "📦" },

  // Vayikra
  { value: "vayikra", label: "Parshas Vayikra", sub: "פרשת ויקרא", category: "torah", book: "Vayikra", emoji: "🔥" },
  { value: "tzav", label: "Parshas Tzav", sub: "פרשת צו", category: "torah", book: "Vayikra", emoji: "🕯️" },
  { value: "shemini", label: "Parshas Shemini", sub: "פרשת שמיני", category: "torah", book: "Vayikra", emoji: "8️⃣" },
  { value: "tazria", label: "Parshas Tazria", sub: "פרשת תזריע", category: "torah", book: "Vayikra", emoji: "🌱" },
  { value: "metzora", label: "Parshas Metzora", sub: "פרשת מצורע", category: "torah", book: "Vayikra", emoji: "💬" },
  { value: "acharei-mot", label: "Parshas Acharei Mos", sub: "פרשת אחרי מות", category: "torah", book: "Vayikra", emoji: "🕊️" },
  { value: "kedoshim", label: "Parshas Kedoshim", sub: "פרשת קדושים", category: "torah", book: "Vayikra", emoji: "✨" },
  { value: "emor", label: "Parshas Emor", sub: "פרשת אמור", category: "torah", book: "Vayikra", emoji: "🎉" },
  { value: "behar", label: "Parshas Behar", sub: "פרשת בהר", category: "torah", book: "Vayikra", emoji: "🌾" },
  { value: "bechukotai", label: "Parshas Bechukosai", sub: "פרשת בחוקותי", category: "torah", book: "Vayikra", emoji: "🛤️" },

  // Bamidbar
  { value: "bamidbar", label: "Parshas Bamidbar", sub: "פרשת במדבר", category: "torah", book: "Bamidbar", emoji: "🏜️" },
  { value: "naso", label: "Parshas Naso", sub: "פרשת נשא", category: "torah", book: "Bamidbar", emoji: "🙌" },
  { value: "behaalotecha", label: "Parshas Beha'aloscha", sub: "פרשת בהעלותך", category: "torah", book: "Bamidbar", emoji: "🕎" },
  { value: "shelach", label: "Parshas Shelach", sub: "פרשת שלח", category: "torah", book: "Bamidbar", emoji: "🍇" },
  { value: "korach", label: "Parshas Korach", sub: "פרשת קרח", category: "torah", book: "Bamidbar", emoji: "⚡" },
  { value: "chukat", label: "Parshas Chukas", sub: "פרשת חוקת", category: "torah", book: "Bamidbar", emoji: "🐄" },
  { value: "balak", label: "Parshas Balak", sub: "פרשת בלק", category: "torah", book: "Bamidbar", emoji: "🫏" },
  { value: "pinchas", label: "Parshas Pinchas", sub: "פרשת פנחס", category: "torah", book: "Bamidbar", emoji: "🛡️" },
  { value: "matot", label: "Parshas Matos", sub: "פרשת מטות", category: "torah", book: "Bamidbar", emoji: "🤞" },
  { value: "masei", label: "Parshas Masei", sub: "פרשת מסעי", category: "torah", book: "Bamidbar", emoji: "🗺️" },

  // Devarim
  { value: "devarim", label: "Parshas Devarim", sub: "פרשת דברים", category: "torah", book: "Devarim", emoji: "📢" },
  { value: "vaetchanan", label: "Parshas Va'eschanan", sub: "פרשת ואתחנן", category: "torah", book: "Devarim", emoji: "👂" },
  { value: "eikev", label: "Parshas Eikev", sub: "פרשת עקב", category: "torah", book: "Devarim", emoji: "🍯" },
  { value: "reeh", label: "Parshas Re'eh", sub: "פרשת ראה", category: "torah", book: "Devarim", emoji: "👁️" },
  { value: "shoftim", label: "Parshas Shoftim", sub: "פרשת שופטים", category: "torah", book: "Devarim", emoji: "⚖️" },
  { value: "ki-teitzei", label: "Parshas Ki Seitzei", sub: "פרשת כי תצא", category: "torah", book: "Devarim", emoji: "💛" },
  { value: "ki-tavo", label: "Parshas Ki Savo", sub: "פרשת כי תבוא", category: "torah", book: "Devarim", emoji: "🍎" },
  { value: "nitzavim", label: "Parshas Nitzavim", sub: "פרשת נצבים", category: "torah", book: "Devarim", emoji: "🧍" },
  { value: "vayelech", label: "Parshas Vayeilech", sub: "פרשת וילך", category: "torah", book: "Devarim", emoji: "👋" },
  { value: "haazinu", label: "Parshas Ha'azinu", sub: "פרשת האזינו", category: "torah", book: "Devarim", emoji: "🎵" },
  { value: "vezot-habracha", label: "Parshas V'Zos Habracha", sub: "פרשת וזאת הברכה", category: "torah", book: "Devarim", emoji: "🌅" },

  // ──── NEVI'IM (Prophets) ────
  { value: "yehoshua-jordan", label: "Sefer Yehoshua – Crossing the Jordan", sub: "ספר יהושע – חציית הירדן", category: "neviim", emoji: "🏞️" },
  { value: "yehoshua-jericho", label: "Sefer Yehoshua – Walls of Jericho", sub: "ספר יהושע – חומות יריחו", category: "neviim", emoji: "🎺" },
  { value: "devorah", label: "Sefer Shoftim – Devorah", sub: "ספר שופטים – דבורה", category: "neviim", emoji: "⚔️" },
  { value: "shimshon", label: "Sefer Shoftim – Shimshon", sub: "ספר שופטים – שמשון", category: "neviim", emoji: "💪" },
  { value: "shmuel-birth", label: "Sefer Shmuel – Birth of Shmuel", sub: "ספר שמואל – לידת שמואל", category: "neviim", emoji: "🏛️" },
  { value: "david-goliath", label: "Sefer Shmuel – Dovid & Golias", sub: "ספר שמואל – דוד וגוליית", category: "neviim", emoji: "🪨" },
  { value: "david-yonatan", label: "Sefer Shmuel – Dovid & Yonasan", sub: "ספר שמואל – דוד ויונתן", category: "neviim", emoji: "🤝" },
  { value: "shlomo-wisdom", label: "Sefer Melachim – Shlomo's Wisdom", sub: "ספר מלכים – חכמת שלמה", category: "neviim", emoji: "👑" },
  { value: "eliyahu-carmel", label: "Sefer Melachim – Eliyahu on Carmel", sub: "ספר מלכים – אליהו בכרמל", category: "neviim", emoji: "🔥" },
  { value: "eliyahu-chariot", label: "Sefer Melachim – Eliyahu's Chariot", sub: "ספר מלכים – מרכבת אליהו", category: "neviim", emoji: "🐴" },
  { value: "elisha-miracles", label: "Sefer Melachim – Elisha's Miracles", sub: "ספר מלכים – ניסי אלישע", category: "neviim", emoji: "✨" },
  { value: "yonah", label: "Sefer Yonah", sub: "ספר יונה", category: "neviim", emoji: "🐋" },
  { value: "yeshayahu-peace", label: "Sefer Yeshayahu – Vision of Peace", sub: "ספר ישעיהו – חזון השלום", category: "neviim", emoji: "🕊️" },

  // ──── KETUVIM (Writings) ────
  { value: "tehillim-shepherd", label: "Tehillim – Hashem Is My Shepherd", sub: "תהלים – ה׳ רועי", category: "ketuvim", emoji: "🐑" },
  { value: "tehillim-creation", label: "Tehillim – Praising Creation", sub: "תהלים – הלל הבריאה", category: "ketuvim", emoji: "🌸" },
  { value: "mishlei-wisdom", label: "Sefer Mishlei – Wisdom", sub: "ספר משלי – חכמה", category: "ketuvim", emoji: "📚" },
  { value: "iyov", label: "Sefer Iyov", sub: "ספר איוב", category: "ketuvim", emoji: "🙏" },
  { value: "daniel-lions", label: "Sefer Daniel – The Lion's Den", sub: "ספר דניאל – גוב האריות", category: "ketuvim", emoji: "🦁" },
  { value: "daniel-furnace", label: "Sefer Daniel – The Fiery Furnace", sub: "ספר דניאל – כבשן האש", category: "ketuvim", emoji: "🔥" },
  { value: "ezra-return", label: "Sefer Ezra – Return to Yerushalayim", sub: "ספר עזרא – שיבת ירושלים", category: "ketuvim", emoji: "🏙️" },
  { value: "nechemia-walls", label: "Sefer Nechemia – Rebuilding the Walls", sub: "ספר נחמיה – בניית החומות", category: "ketuvim", emoji: "🧱" },
  { value: "divrei-hayamim", label: "Divrei HaYamim", sub: "דברי הימים", category: "ketuvim", emoji: "📜" },

  // ──── MEGILLOT (Scrolls) ────
  { value: "esther", label: "Megillas Esther", sub: "מגילת אסתר", category: "megillot", emoji: "👸" },
  { value: "ruth", label: "Megillas Rus", sub: "מגילת רות", category: "megillot", emoji: "🌾" },
  { value: "shir-hashirim", label: "Shir HaShirim", sub: "שיר השירים", category: "megillot", emoji: "🌹" },
  { value: "kohelet", label: "Koheles", sub: "קהלת", category: "megillot", emoji: "⏳" },
  { value: "eicha", label: "Megillas Eicha", sub: "מגילת איכה", category: "megillot", emoji: "😢" },

  // ──── HOLIDAYS ────
  { value: "pesach", label: "Pesach", sub: "פסח", category: "holiday", emoji: "🫓" },
  { value: "purim", label: "Purim", sub: "פורים", category: "holiday", emoji: "🎭" },
  { value: "chanukah", label: "Chanukah", sub: "חנוכה", category: "holiday", emoji: "🕎" },
  { value: "sukkot", label: "Sukkos", sub: "סוכות", category: "holiday", emoji: "🛖" },
  { value: "shavuot", label: "Shavuos", sub: "שבועות", category: "holiday", emoji: "📜" },
  { value: "rosh-hashana", label: "Rosh Hashana", sub: "ראש השנה", category: "holiday", emoji: "📯" },
  { value: "yom-kippur", label: "Yom Kippur", sub: "יום כיפור", category: "holiday", emoji: "🕊️" },
  { value: "simchat-torah", label: "Simchas Torah", sub: "שמחת תורה", category: "holiday", emoji: "🎉" },
  { value: "tu-bishvat", label: "Tu B'Shvat", sub: "ט״ו בשבט", category: "holiday", emoji: "🌳" },
  { value: "lag-baomer", label: "Lag B'Omer", sub: "ל״ג בעומר", category: "holiday", emoji: "🔥" },
];

export const TORAH_BOOKS = ["Bereishit", "Shemot", "Vayikra", "Bamidbar", "Devarim"] as const;

export const CATEGORY_META: Record<TorahOption["category"], { label: string; emoji: string }> = {
  torah: { label: "Torah", emoji: "📜" },
  neviim: { label: "Nevi'im", emoji: "⚔️" },
  ketuvim: { label: "Ketuvim", emoji: "✍️" },
  megillot: { label: "Megillot", emoji: "📖" },
  holiday: { label: "Holidays", emoji: "🕯️" },
};

export const getPortionLabel = (value: string): string => {
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  return found ? `${found.label} / ${found.sub}` : value;
};
