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
  { value: "bereishit", label: "In the Beginning", sub: "Parashat Bereishit", category: "torah", book: "Bereishit", emoji: "🌍" },
  { value: "noach", label: "Noah's Ark", sub: "Parashat Noach", category: "torah", book: "Bereishit", emoji: "🌈" },
  { value: "lech-lecha", label: "Abraham's Journey", sub: "Parashat Lech Lecha", category: "torah", book: "Bereishit", emoji: "🏕️" },
  { value: "vayera", label: "Angels Visit Abraham", sub: "Parashat Vayera", category: "torah", book: "Bereishit", emoji: "👼" },
  { value: "chayei-sarah", label: "A Bride for Isaac", sub: "Parashat Chayei Sarah", category: "torah", book: "Bereishit", emoji: "💍" },
  { value: "toldot", label: "Jacob & Esau", sub: "Parashat Toldot", category: "torah", book: "Bereishit", emoji: "👬" },
  { value: "vayetzei", label: "Jacob's Ladder", sub: "Parashat Vayetzei", category: "torah", book: "Bereishit", emoji: "🪜" },
  { value: "vayishlach", label: "Wrestling with an Angel", sub: "Parashat Vayishlach", category: "torah", book: "Bereishit", emoji: "💪" },
  { value: "vayeshev", label: "Joseph's Coat of Colors", sub: "Parashat Vayeshev", category: "torah", book: "Bereishit", emoji: "🧥" },
  { value: "miketz", label: "Joseph in Egypt", sub: "Parashat Miketz", category: "torah", book: "Bereishit", emoji: "🏛️" },
  { value: "vayigash", label: "Brothers Reunite", sub: "Parashat Vayigash", category: "torah", book: "Bereishit", emoji: "🤗" },
  { value: "vayechi", label: "Jacob Blesses His Sons", sub: "Parashat Vayechi", category: "torah", book: "Bereishit", emoji: "🙏" },

  // Shemot
  { value: "shemot", label: "Baby Moses & the Basket", sub: "Parashat Shemot", category: "torah", book: "Shemot", emoji: "👶" },
  { value: "vaera", label: "The Ten Plagues Begin", sub: "Parashat Va'era", category: "torah", book: "Shemot", emoji: "🐸" },
  { value: "bo", label: "The Exodus from Egypt", sub: "Parashat Bo", category: "torah", book: "Shemot", emoji: "🚶" },
  { value: "beshalach", label: "The Parting of the Sea", sub: "Parashat Beshalach", category: "torah", book: "Shemot", emoji: "🌊" },
  { value: "yitro", label: "The Ten Commandments", sub: "Parashat Yitro", category: "torah", book: "Shemot", emoji: "⛰️" },
  { value: "mishpatim", label: "Laws of Kindness", sub: "Parashat Mishpatim", category: "torah", book: "Shemot", emoji: "⚖️" },
  { value: "terumah", label: "Building the Tabernacle", sub: "Parashat Terumah", category: "torah", book: "Shemot", emoji: "🏗️" },
  { value: "tetzaveh", label: "The Priestly Garments", sub: "Parashat Tetzaveh", category: "torah", book: "Shemot", emoji: "👗" },
  { value: "ki-tisa", label: "The Golden Calf", sub: "Parashat Ki Tisa", category: "torah", book: "Shemot", emoji: "🐄" },
  { value: "vayakhel", label: "Building Together", sub: "Parashat Vayakhel", category: "torah", book: "Shemot", emoji: "🤝" },
  { value: "pekudei", label: "Counting the Donations", sub: "Parashat Pekudei", category: "torah", book: "Shemot", emoji: "📦" },

  // Vayikra
  { value: "vayikra", label: "Offerings to Hashem", sub: "Parashat Vayikra", category: "torah", book: "Vayikra", emoji: "🔥" },
  { value: "tzav", label: "The Eternal Flame", sub: "Parashat Tzav", category: "torah", book: "Vayikra", emoji: "🕯️" },
  { value: "shemini", label: "The Eighth Day", sub: "Parashat Shemini", category: "torah", book: "Vayikra", emoji: "8️⃣" },
  { value: "tazria", label: "New Life", sub: "Parashat Tazria", category: "torah", book: "Vayikra", emoji: "🌱" },
  { value: "metzora", label: "The Power of Words", sub: "Parashat Metzora", category: "torah", book: "Vayikra", emoji: "💬" },
  { value: "acharei-mot", label: "Yom Kippur Service", sub: "Parashat Acharei Mot", category: "torah", book: "Vayikra", emoji: "🕊️" },
  { value: "kedoshim", label: "Be Holy", sub: "Parashat Kedoshim", category: "torah", book: "Vayikra", emoji: "✨" },
  { value: "emor", label: "The Festivals", sub: "Parashat Emor", category: "torah", book: "Vayikra", emoji: "🎉" },
  { value: "behar", label: "The Sabbatical Year", sub: "Parashat Behar", category: "torah", book: "Vayikra", emoji: "🌾" },
  { value: "bechukotai", label: "Walking in Hashem's Ways", sub: "Parashat Bechukotai", category: "torah", book: "Vayikra", emoji: "🛤️" },

  // Bamidbar
  { value: "bamidbar", label: "Counting in the Desert", sub: "Parashat Bamidbar", category: "torah", book: "Bamidbar", emoji: "🏜️" },
  { value: "naso", label: "The Priestly Blessing", sub: "Parashat Naso", category: "torah", book: "Bamidbar", emoji: "🙌" },
  { value: "behaalotecha", label: "Lighting the Menorah", sub: "Parashat Beha'alotecha", category: "torah", book: "Bamidbar", emoji: "🕎" },
  { value: "shelach", label: "The Spies in the Land", sub: "Parashat Shelach", category: "torah", book: "Bamidbar", emoji: "🍇" },
  { value: "korach", label: "Korach's Rebellion", sub: "Parashat Korach", category: "torah", book: "Bamidbar", emoji: "⚡" },
  { value: "chukat", label: "The Red Cow", sub: "Parashat Chukat", category: "torah", book: "Bamidbar", emoji: "🐄" },
  { value: "balak", label: "Balaam's Talking Donkey", sub: "Parashat Balak", category: "torah", book: "Bamidbar", emoji: "🫏" },
  { value: "pinchas", label: "Zealous for Hashem", sub: "Parashat Pinchas", category: "torah", book: "Bamidbar", emoji: "🛡️" },
  { value: "matot", label: "Keeping Promises", sub: "Parashat Matot", category: "torah", book: "Bamidbar", emoji: "🤞" },
  { value: "masei", label: "Journeys in the Desert", sub: "Parashat Masei", category: "torah", book: "Bamidbar", emoji: "🗺️" },

  // Devarim
  { value: "devarim", label: "Moses Speaks to the People", sub: "Parashat Devarim", category: "torah", book: "Devarim", emoji: "📢" },
  { value: "vaetchanan", label: "Hear O Israel (Shema)", sub: "Parashat Va'etchanan", category: "torah", book: "Devarim", emoji: "👂" },
  { value: "eikev", label: "Blessings of the Land", sub: "Parashat Eikev", category: "torah", book: "Devarim", emoji: "🍯" },
  { value: "reeh", label: "Choose Life", sub: "Parashat Re'eh", category: "torah", book: "Devarim", emoji: "👁️" },
  { value: "shoftim", label: "Justice, Justice Pursue", sub: "Parashat Shoftim", category: "torah", book: "Devarim", emoji: "⚖️" },
  { value: "ki-teitzei", label: "Kindness to All", sub: "Parashat Ki Teitzei", category: "torah", book: "Devarim", emoji: "💛" },
  { value: "ki-tavo", label: "First Fruits", sub: "Parashat Ki Tavo", category: "torah", book: "Devarim", emoji: "🍎" },
  { value: "nitzavim", label: "Standing Before Hashem", sub: "Parashat Nitzavim", category: "torah", book: "Devarim", emoji: "🧍" },
  { value: "vayelech", label: "Moses Says Goodbye", sub: "Parashat Vayelech", category: "torah", book: "Devarim", emoji: "👋" },
  { value: "haazinu", label: "The Song of Moses", sub: "Parashat Ha'azinu", category: "torah", book: "Devarim", emoji: "🎵" },
  { value: "vezot-habracha", label: "The Final Blessing", sub: "Parashat V'Zot HaBracha", category: "torah", book: "Devarim", emoji: "🌅" },

  // ──── NEVI'IM (Prophets) ────
  { value: "yehoshua-jordan", label: "Crossing the Jordan", sub: "Sefer Yehoshua", category: "neviim", emoji: "🏞️" },
  { value: "yehoshua-jericho", label: "The Walls of Jericho", sub: "Sefer Yehoshua", category: "neviim", emoji: "🎺" },
  { value: "devorah", label: "Devorah the Judge", sub: "Sefer Shoftim", category: "neviim", emoji: "⚔️" },
  { value: "shimshon", label: "Samson the Strongman", sub: "Sefer Shoftim", category: "neviim", emoji: "💪" },
  { value: "shmuel-birth", label: "Baby Samuel at the Temple", sub: "Sefer Shmuel", category: "neviim", emoji: "🏛️" },
  { value: "david-goliath", label: "David & Goliath", sub: "Sefer Shmuel", category: "neviim", emoji: "🪨" },
  { value: "david-yonatan", label: "David & Jonathan's Friendship", sub: "Sefer Shmuel", category: "neviim", emoji: "🤝" },
  { value: "shlomo-wisdom", label: "King Solomon's Wisdom", sub: "Sefer Melachim", category: "neviim", emoji: "👑" },
  { value: "eliyahu-carmel", label: "Elijah on Mt. Carmel", sub: "Sefer Melachim", category: "neviim", emoji: "🔥" },
  { value: "eliyahu-chariot", label: "Elijah's Chariot of Fire", sub: "Sefer Melachim", category: "neviim", emoji: "🐴" },
  { value: "elisha-miracles", label: "Elisha's Miracles", sub: "Sefer Melachim", category: "neviim", emoji: "✨" },
  { value: "yonah", label: "Jonah and the Whale", sub: "Sefer Yonah", category: "neviim", emoji: "🐋" },
  { value: "yeshayahu-peace", label: "Isaiah's Vision of Peace", sub: "Sefer Yeshayahu", category: "neviim", emoji: "🕊️" },

  // ──── KETUVIM (Writings) ────
  { value: "tehillim-shepherd", label: "Hashem Is My Shepherd", sub: "Tehillim (Psalm 23)", category: "ketuvim", emoji: "🐑" },
  { value: "tehillim-creation", label: "Praising Creation", sub: "Tehillim (Psalm 104)", category: "ketuvim", emoji: "🌸" },
  { value: "mishlei-wisdom", label: "Wisdom of Proverbs", sub: "Sefer Mishlei", category: "ketuvim", emoji: "📚" },
  { value: "iyov", label: "Job's Faith", sub: "Sefer Iyov", category: "ketuvim", emoji: "🙏" },
  { value: "daniel-lions", label: "Daniel in the Lion's Den", sub: "Sefer Daniel", category: "ketuvim", emoji: "🦁" },
  { value: "daniel-furnace", label: "The Fiery Furnace", sub: "Sefer Daniel", category: "ketuvim", emoji: "🔥" },
  { value: "ezra-return", label: "Return to Jerusalem", sub: "Sefer Ezra", category: "ketuvim", emoji: "🏙️" },
  { value: "nechemia-walls", label: "Rebuilding the Walls", sub: "Sefer Nechemia", category: "ketuvim", emoji: "🧱" },
  { value: "divrei-hayamim", label: "Chronicles of the Kings", sub: "Divrei HaYamim", category: "ketuvim", emoji: "📜" },

  // ──── MEGILLOT (Scrolls) ────
  { value: "esther", label: "Queen Esther Saves the Day", sub: "Megillat Esther", category: "megillot", emoji: "👸" },
  { value: "ruth", label: "Ruth's Loyalty", sub: "Megillat Ruth", category: "megillot", emoji: "🌾" },
  { value: "shir-hashirim", label: "Song of Songs", sub: "Shir HaShirim", category: "megillot", emoji: "🌹" },
  { value: "kohelet", label: "A Time for Everything", sub: "Kohelet (Ecclesiastes)", category: "megillot", emoji: "⏳" },
  { value: "eicha", label: "Lament for Jerusalem", sub: "Megillat Eicha", category: "megillot", emoji: "😢" },

  // ──── HOLIDAYS ────
  { value: "pesach", label: "The Passover Story", sub: "Pesach", category: "holiday", emoji: "🫓" },
  { value: "purim", label: "Queen Esther Saves the Day", sub: "Purim", category: "holiday", emoji: "🎭" },
  { value: "chanukah", label: "The Miracle of Lights", sub: "Chanukah", category: "holiday", emoji: "🕎" },
  { value: "sukkot", label: "The Sukkah Adventure", sub: "Sukkot", category: "holiday", emoji: "🛖" },
  { value: "shavuot", label: "Receiving the Torah", sub: "Shavuot", category: "holiday", emoji: "📜" },
  { value: "rosh-hashana", label: "The New Year's Shofar", sub: "Rosh Hashana", category: "holiday", emoji: "📯" },
  { value: "yom-kippur", label: "The Day of Forgiveness", sub: "Yom Kippur", category: "holiday", emoji: "🕊️" },
  { value: "simchat-torah", label: "Dancing with the Torah", sub: "Simchat Torah", category: "holiday", emoji: "🎉" },
  { value: "tu-bishvat", label: "The Birthday of Trees", sub: "Tu B'Shvat", category: "holiday", emoji: "🌳" },
  { value: "lag-baomer", label: "The Bonfire Festival", sub: "Lag B'Omer", category: "holiday", emoji: "🔥" },
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
  return found ? found.sub : value;
};
