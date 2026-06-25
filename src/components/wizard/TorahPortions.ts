export interface TorahOption {
  value: string;
  label: string;
  sub: string;
  category: "torah" | "neviim" | "ketuvim" | "megillot" | "holiday" | "educational";
  book?: string;
  emoji?: string;
  /** Lucide icon name (from the wizard icon registry) shown instead of an emoji. */
  icon?: string;
}

export const TORAH_PORTIONS: TorahOption[] = [
  // ──── TORAH (Chumash) ────

  // Bereishis
  { value: "bereishit", label: "Parshas Bereishis", sub: "פרשת בראשית", category: "torah", book: "Bereishit", emoji: "🌍", icon: "Sun" },
  { value: "noach", label: "Parshas Noach", sub: "פרשת נח", category: "torah", book: "Bereishit", emoji: "🌈", icon: "Rainbow" },
  { value: "lech-lecha", label: "Parshas Lech Lecha", sub: "פרשת לך לך", category: "torah", book: "Bereishit", emoji: "🏕️", icon: "Compass" },
  { value: "vayera", label: "Parshas Vayeira", sub: "פרשת וירא", category: "torah", book: "Bereishit", emoji: "👼", icon: "Tent" },
  { value: "chayei-sarah", label: "Parshas Chayei Sarah", sub: "פרשת חיי שרה", category: "torah", book: "Bereishit", emoji: "💍", icon: "HeartHandshake" },
  { value: "toldot", label: "Parshas Toldos", sub: "פרשת תולדות", category: "torah", book: "Bereishit", emoji: "👬", icon: "Users" },
  { value: "vayetzei", label: "Parshas Vayeitzei", sub: "פרשת ויצא", category: "torah", book: "Bereishit", emoji: "🪜", icon: "Moon" },
  { value: "vayishlach", label: "Parshas Vayishlach", sub: "פרשת וישלח", category: "torah", book: "Bereishit", emoji: "💪", icon: "Shield" },
  { value: "vayeshev", label: "Parshas Vayeishev", sub: "פרשת וישב", category: "torah", book: "Bereishit", emoji: "🧥", icon: "Palette" },
  { value: "miketz", label: "Parshas Mikeitz", sub: "פרשת מקץ", category: "torah", book: "Bereishit", emoji: "🏛️", icon: "Landmark" },
  { value: "vayigash", label: "Parshas Vayigash", sub: "פרשת ויגש", category: "torah", book: "Bereishit", emoji: "🤗", icon: "HeartHandshake" },
  { value: "vayechi", label: "Parshas Vayechi", sub: "פרשת ויחי", category: "torah", book: "Bereishit", emoji: "🙏", icon: "Hourglass" },

  // Shemos
  { value: "shemot", label: "Parshas Shemos", sub: "פרשת שמות", category: "torah", book: "Shemot", emoji: "👶", icon: "Baby" },
  { value: "vaera", label: "Parshas Va'eira", sub: "פרשת וארא", category: "torah", book: "Shemot", emoji: "🐸", icon: "Droplets" },
  { value: "bo", label: "Parshas Bo", sub: "פרשת בא", category: "torah", book: "Shemot", emoji: "🚶", icon: "Footprints" },
  { value: "beshalach", label: "Parshas Beshalach", sub: "פרשת בשלח", category: "torah", book: "Shemot", emoji: "🌊", icon: "Waves" },
  { value: "yitro", label: "Parshas Yisro", sub: "פרשת יתרו", category: "torah", book: "Shemot", emoji: "⛰️", icon: "Tablets" },
  { value: "mishpatim", label: "Parshas Mishpatim", sub: "פרשת משפטים", category: "torah", book: "Shemot", emoji: "⚖️", icon: "Landmark" },
  { value: "terumah", label: "Parshas Terumah", sub: "פרשת תרומה", category: "torah", book: "Shemot", emoji: "🏗️", icon: "Hammer" },
  { value: "tetzaveh", label: "Parshas Tetzaveh", sub: "פרשת תצוה", category: "torah", book: "Shemot", emoji: "👗", icon: "Gem" },
  { value: "ki-tisa", label: "Parshas Ki Sisa", sub: "פרשת כי תשא", category: "torah", book: "Shemot", emoji: "🐄", icon: "PawPrint" },
  { value: "vayakhel", label: "Parshas Vayakhel", sub: "פרשת ויקהל", category: "torah", book: "Shemot", emoji: "🤝", icon: "Users" },
  { value: "pekudei", label: "Parshas Pekudei", sub: "פרשת פקודי", category: "torah", book: "Shemot", emoji: "📦", icon: "Tent" },

  // Vayikra
  { value: "vayikra", label: "Parshas Vayikra", sub: "פרשת ויקרא", category: "torah", book: "Vayikra", emoji: "🔥", icon: "Flame" },
  { value: "tzav", label: "Parshas Tzav", sub: "פרשת צו", category: "torah", book: "Vayikra", emoji: "🕯️", icon: "Flame" },
  { value: "shemini", label: "Parshas Shemini", sub: "פרשת שמיני", category: "torah", book: "Vayikra", emoji: "8️⃣", icon: "Bird" },
  { value: "tazria", label: "Parshas Tazria", sub: "פרשת תזריע", category: "torah", book: "Vayikra", emoji: "🌱", icon: "Sprout" },
  { value: "metzora", label: "Parshas Metzora", sub: "פרשת מצורע", category: "torah", book: "Vayikra", emoji: "💬", icon: "Droplet" },
  { value: "acharei-mot", label: "Parshas Acharei Mos", sub: "פרשת אחרי מות", category: "torah", book: "Vayikra", emoji: "🕊️", icon: "Bird" },
  { value: "kedoshim", label: "Parshas Kedoshim", sub: "פרשת קדושים", category: "torah", book: "Vayikra", emoji: "✨", icon: "Sparkles" },
  { value: "emor", label: "Parshas Emor", sub: "פרשת אמור", category: "torah", book: "Vayikra", emoji: "🎉", icon: "CalendarDays" },
  { value: "behar", label: "Parshas Behar", sub: "פרשת בהר", category: "torah", book: "Vayikra", emoji: "🌾", icon: "Wheat" },
  { value: "bechukotai", label: "Parshas Bechukosai", sub: "פרשת בחוקותי", category: "torah", book: "Vayikra", emoji: "🛤️", icon: "Footprints" },

  // Bamidbar
  { value: "bamidbar", label: "Parshas Bamidbar", sub: "פרשת במדבר", category: "torah", book: "Bamidbar", emoji: "🏜️", icon: "MapPin" },
  { value: "naso", label: "Parshas Naso", sub: "פרשת נשא", category: "torah", book: "Bamidbar", emoji: "🙌", icon: "HeartHandshake" },
  { value: "behaalotecha", label: "Parshas Beha'aloscha", sub: "פרשת בהעלותך", category: "torah", book: "Bamidbar", emoji: "🕎", icon: "Flame" },
  { value: "shelach", label: "Parshas Shelach", sub: "פרשת שלח", category: "torah", book: "Bamidbar", emoji: "🍇", icon: "Grape" },
  { value: "korach", label: "Parshas Korach", sub: "פרשת קרח", category: "torah", book: "Bamidbar", emoji: "⚡", icon: "Zap" },
  { value: "chukat", label: "Parshas Chukas", sub: "פרשת חוקת", category: "torah", book: "Bamidbar", emoji: "🐄", icon: "Droplet" },
  { value: "balak", label: "Parshas Balak", sub: "פרשת בלק", category: "torah", book: "Bamidbar", emoji: "🫏", icon: "PawPrint" },
  { value: "pinchas", label: "Parshas Pinchas", sub: "פרשת פנחס", category: "torah", book: "Bamidbar", emoji: "🛡️", icon: "Shield" },
  { value: "matot", label: "Parshas Matos", sub: "פרשת מטות", category: "torah", book: "Bamidbar", emoji: "🤞", icon: "Handshake" },
  { value: "masei", label: "Parshas Masei", sub: "פרשת מסעי", category: "torah", book: "Bamidbar", emoji: "🗺️", icon: "Map" },

  // Devarim
  { value: "devarim", label: "Parshas Devarim", sub: "פרשת דברים", category: "torah", book: "Devarim", emoji: "📢", icon: "Megaphone" },
  { value: "vaetchanan", label: "Parshas Va'eschanan", sub: "פרשת ואתחנן", category: "torah", book: "Devarim", emoji: "👂", icon: "Bell" },
  { value: "eikev", label: "Parshas Eikev", sub: "פרשת עקב", category: "torah", book: "Devarim", emoji: "🍯", icon: "Grape" },
  { value: "reeh", label: "Parshas Re'eh", sub: "פרשת ראה", category: "torah", book: "Devarim", emoji: "👁️", icon: "Eye" },
  { value: "shoftim", label: "Parshas Shoftim", sub: "פרשת שופטים", category: "torah", book: "Devarim", emoji: "⚖️", icon: "Landmark" },
  { value: "ki-teitzei", label: "Parshas Ki Seitzei", sub: "פרשת כי תצא", category: "torah", book: "Devarim", emoji: "💛", icon: "Heart" },
  { value: "ki-tavo", label: "Parshas Ki Savo", sub: "פרשת כי תבוא", category: "torah", book: "Devarim", emoji: "🍎", icon: "Apple" },
  { value: "nitzavim", label: "Parshas Nitzavim", sub: "פרשת נצבים", category: "torah", book: "Devarim", emoji: "🧍", icon: "Users" },
  { value: "vayelech", label: "Parshas Vayeilech", sub: "פרשת וילך", category: "torah", book: "Devarim", emoji: "👋", icon: "Footprints" },
  { value: "haazinu", label: "Parshas Ha'azinu", sub: "פרשת האזינו", category: "torah", book: "Devarim", emoji: "🎵", icon: "Music" },
  { value: "vezot-habracha", label: "Parshas V'Zos Habracha", sub: "פרשת וזאת הברכה", category: "torah", book: "Devarim", emoji: "🌅", icon: "Mountain" },

  // ──── NEVI'IM (Prophets) ────
  // Yehoshua
  { value: "yehoshua-jordan", label: "Sefer Yehoshua – Crossing the Yarden", sub: "ספר יהושע – חציית הירדן", category: "neviim", book: "Yehoshua", emoji: "🏞️", icon: "Waves" },
  { value: "yehoshua-jericho", label: "Sefer Yehoshua – Walls of Yericho", sub: "ספר יהושע – חומות יריחו", category: "neviim", book: "Yehoshua", emoji: "🎺", icon: "Music" },
  { value: "yehoshua-sun", label: "Sefer Yehoshua – The Sun Stands Still", sub: "ספר יהושע – השמש עומדת בגבעון", category: "neviim", book: "Yehoshua", emoji: "☀️", icon: "Sun" },
  // Shoftim
  { value: "devorah", label: "Sefer Shoftim – Devorah", sub: "ספר שופטים – דבורה", category: "neviim", book: "Shoftim", emoji: "⚔️", icon: "Trees" },
  { value: "shimshon", label: "Sefer Shoftim – Shimshon", sub: "ספר שופטים – שמשון", category: "neviim", book: "Shoftim", emoji: "💪", icon: "ShieldCheck" },
  { value: "gidon", label: "Sefer Shoftim – Gidon's Small Army", sub: "ספר שופטים – צבאו הקטן של גדעון", category: "neviim", book: "Shoftim", emoji: "🔦", icon: "Flame" },
  // Shmuel
  { value: "shmuel-birth", label: "Sefer Shmuel – Birth of Shmuel", sub: "ספר שמואל – לידת שמואל", category: "neviim", book: "Shmuel", emoji: "🏛️", icon: "Baby" },
  { value: "david-goliath", label: "Sefer Shmuel – Dovid & Golias", sub: "ספר שמואל – דוד וגוליית", category: "neviim", book: "Shmuel", emoji: "🪨", icon: "Shield" },
  { value: "david-yonatan", label: "Sefer Shmuel – Dovid & Yonasan", sub: "ספר שמואל – דוד ויונתן", category: "neviim", book: "Shmuel", emoji: "🤝", icon: "Handshake" },
  // Melachim
  { value: "shlomo-wisdom", label: "Sefer Melachim – Shlomo's Wisdom", sub: "ספר מלכים – חכמת שלמה", category: "neviim", book: "Melachim", emoji: "👑", icon: "Crown" },
  { value: "eliyahu-carmel", label: "Sefer Melachim – Eliyahu on Carmel", sub: "ספר מלכים – אליהו בכרמל", category: "neviim", book: "Melachim", emoji: "🔥", icon: "Flame" },
  { value: "eliyahu-chariot", label: "Sefer Melachim – Eliyahu's Chariot", sub: "ספר מלכים – מרכבת אליהו", category: "neviim", book: "Melachim", emoji: "🐴", icon: "Wind" },
  { value: "elisha-miracles", label: "Sefer Melachim – Elisha's Miracles", sub: "ספר מלכים – ניסי אלישע", category: "neviim", book: "Melachim", emoji: "✨", icon: "Sparkles" },
  // Yeshayahu
  { value: "yeshayahu-peace", label: "Sefer Yeshayahu – Vision of Peace", sub: "ספר ישעיהו – חזון השלום", category: "neviim", book: "Yeshayahu", emoji: "🕊️", icon: "Bird" },
  { value: "yeshayahu-coal", label: "Sefer Yeshayahu – The Glowing Coal", sub: "ספר ישעיהו – הגחלת הלוהטת", category: "neviim", book: "Yeshayahu", emoji: "🔥", icon: "Flame" },
  { value: "yeshayahu-chizkiyahu", label: "Sefer Yeshayahu – Chizkiyahu's Tefillah", sub: "ספר ישעיהו – תפילת חזקיהו", category: "neviim", book: "Yeshayahu", emoji: "⏳", icon: "Clock" },
  // Yirmiyahu
  { value: "yirmiyahu-call", label: "Sefer Yirmiyahu – The Navi's Call", sub: "ספר ירמיהו – קריאת הנביא", category: "neviim", book: "Yirmiyahu", emoji: "📜", icon: "Megaphone" },
  { value: "yirmiyahu-potter", label: "Sefer Yirmiyahu – The Potter's Clay", sub: "ספר ירמיהו – חומר היוצר", category: "neviim", book: "Yirmiyahu", emoji: "🏺", icon: "Droplet" },
  { value: "yirmiyahu-pit", label: "Sefer Yirmiyahu – Saved from the Pit", sub: "ספר ירמיהו – הצלה מן הבור", category: "neviim", book: "Yirmiyahu", emoji: "🪢", icon: "Anchor" },
  // Yechezkel
  { value: "yechezkel-bones", label: "Sefer Yechezkel – The Valley of Dry Bones", sub: "ספר יחזקאל – בקעת העצמות היבשות", category: "neviim", book: "Yechezkel", emoji: "🦴", icon: "Sparkles" },
  { value: "yechezkel-sticks", label: "Sefer Yechezkel – Two Sticks Become One", sub: "ספר יחזקאל – שני העצים לאחד", category: "neviim", book: "Yechezkel", emoji: "🪵", icon: "TreePine" },
  { value: "yechezkel-watchman", label: "Sefer Yechezkel – The Watchman", sub: "ספר יחזקאל – הצופה", category: "neviim", book: "Yechezkel", emoji: "📯", icon: "Eye" },
  // Trei Asar
  { value: "yonah", label: "Sefer Yonah – Yonah & the Big Fish", sub: "ספר יונה – יונה והדג הגדול", category: "neviim", book: "Trei Asar", emoji: "🐋", icon: "Fish" },
  { value: "amos-shepherd", label: "Sefer Amos – The Shepherd Navi", sub: "ספר עמוס – הנביא הרועה", category: "neviim", book: "Trei Asar", emoji: "🐑", icon: "PawPrint" },
  { value: "zechariah-menorah", label: "Sefer Zechariah – The Golden Menorah", sub: "ספר זכריה – המנורה של זהב", category: "neviim", book: "Trei Asar", emoji: "🕎", icon: "Flame" },

  // ──── KETUVIM (Writings) ────
  // Tehillim
  { value: "tehillim-shepherd", label: "Tehillim – Hashem Is My Shepherd", sub: "תהלים – ה׳ רועי", category: "ketuvim", book: "Tehillim", emoji: "🐑", icon: "PawPrint" },
  { value: "tehillim-creation", label: "Tehillim – Praising Creation", sub: "תהלים – הלל הבריאה", category: "ketuvim", book: "Tehillim", emoji: "🌸", icon: "Flower2" },
  { value: "tehillim-thanks", label: "Tehillim – A Song of Thanks", sub: "תהלים – מזמור לתודה", category: "ketuvim", book: "Tehillim", emoji: "🎶", icon: "Music2" },
  // Mishlei
  { value: "mishlei-wisdom", label: "Sefer Mishlei – Wisdom", sub: "ספר משלי – חכמה", category: "ketuvim", book: "Mishlei", emoji: "📚", icon: "Lightbulb" },
  { value: "mishlei-ant", label: "Sefer Mishlei – Learn from the Ant", sub: "ספר משלי – לך אל נמלה", category: "ketuvim", book: "Mishlei", emoji: "🐜", icon: "Sprout" },
  { value: "mishlei-eishes-chayil", label: "Sefer Mishlei – Eishes Chayil", sub: "ספר משלי – אשת חיל", category: "ketuvim", book: "Mishlei", emoji: "👑", icon: "Gem" },
  // Iyov
  { value: "iyov", label: "Sefer Iyov – A Test of Emunah", sub: "ספר איוב – מבחן האמונה", category: "ketuvim", book: "Iyov", emoji: "🙏", icon: "Heart" },
  { value: "iyov-friends", label: "Sefer Iyov – Iyov's Three Friends", sub: "ספר איוב – שלושת רעי איוב", category: "ketuvim", book: "Iyov", emoji: "👥", icon: "Users" },
  { value: "iyov-storm", label: "Sefer Iyov – Hashem Answers in the Storm", sub: "ספר איוב – ה׳ עונה מן הסערה", category: "ketuvim", book: "Iyov", emoji: "🌪️", icon: "Wind" },
  // Daniel
  { value: "daniel-lions", label: "Sefer Daniel – The Lion's Den", sub: "ספר דניאל – גוב האריות", category: "ketuvim", book: "Daniel", emoji: "🦁", icon: "ShieldCheck" },
  { value: "daniel-furnace", label: "Sefer Daniel – The Fiery Furnace", sub: "ספר דניאל – כבשן האש", category: "ketuvim", book: "Daniel", emoji: "🔥", icon: "Flame" },
  { value: "daniel-writing", label: "Sefer Daniel – The Writing on the Wall", sub: "ספר דניאל – הכתב על הקיר", category: "ketuvim", book: "Daniel", emoji: "✍️", icon: "PenLine" },
  // Ezra
  { value: "ezra-return", label: "Sefer Ezra – Return to Yerushalayim", sub: "ספר עזרא – שיבת ירושלים", category: "ketuvim", book: "Ezra", emoji: "🏙️", icon: "Footprints" },
  { value: "ezra-mikdash", label: "Sefer Ezra – Building the Second Beis HaMikdash", sub: "ספר עזרא – בניין בית המקדש השני", category: "ketuvim", book: "Ezra", emoji: "🏛️", icon: "Hammer" },
  { value: "ezra-torah", label: "Sefer Ezra – Ezra Teaches the Torah", sub: "ספר עזרא – עזרא מלמד תורה", category: "ketuvim", book: "Ezra", emoji: "📜", icon: "BookOpen" },
  // Nechemia
  { value: "nechemia-walls", label: "Sefer Nechemia – Rebuilding the Walls", sub: "ספר נחמיה – בניית החומות", category: "ketuvim", book: "Nechemia", emoji: "🧱", icon: "Hammer" },
  { value: "nechemia-tefillah", label: "Sefer Nechemia – A Tefillah for Yerushalayim", sub: "ספר נחמיה – תפילה למען ירושלים", category: "ketuvim", book: "Nechemia", emoji: "🙏", icon: "Heart" },
  { value: "nechemia-guard", label: "Sefer Nechemia – Guarding Day and Night", sub: "ספר נחמיה – שמירה יומם ולילה", category: "ketuvim", book: "Nechemia", emoji: "🛡️", icon: "Shield" },
  // Divrei HaYamim
  { value: "divrei-hayamim", label: "Sefer Divrei HaYamim – The Story of the Malchus", sub: "ספר דברי הימים – סיפור המלכות", category: "ketuvim", book: "Divrei HaYamim", emoji: "📜", icon: "Crown" },
  { value: "divrei-mikdash", label: "Sefer Divrei HaYamim – Dovid Prepares the Mikdash", sub: "ספר דברי הימים – דוד מכין את המקדש", category: "ketuvim", book: "Divrei HaYamim", emoji: "🏗️", icon: "Hammer" },
  { value: "divrei-leviim", label: "Sefer Divrei HaYamim – The Leviim Sing", sub: "ספר דברי הימים – שירת הלויים", category: "ketuvim", book: "Divrei HaYamim", emoji: "🎵", icon: "Music" },

  // ──── MEGILLOS ────
  { value: "esther", label: "Megillas Esther", sub: "מגילת אסתר", category: "megillot", emoji: "👸", icon: "Crown" },
  { value: "ruth", label: "Megillas Rus", sub: "מגילת רות", category: "megillot", emoji: "🌾", icon: "Wheat" },
  { value: "shir-hashirim", label: "Shir HaShirim", sub: "שיר השירים", category: "megillot", emoji: "🌹", icon: "Flower2" },
  { value: "kohelet", label: "Koheles", sub: "קהלת", category: "megillot", emoji: "⏳", icon: "Hourglass" },
  { value: "eicha", label: "Megillas Eicha", sub: "מגילת איכה", category: "megillot", emoji: "😢", icon: "CloudRain" },

  // ──── YAMIM TOVIM ────
  { value: "pesach", label: "Pesach", sub: "פסח", category: "holiday", emoji: "🫓", icon: "Utensils" },
  { value: "purim", label: "Purim", sub: "פורים", category: "holiday", emoji: "🎭", icon: "PartyPopper" },
  { value: "chanukah", label: "Chanukah", sub: "חנוכה", category: "holiday", emoji: "🕎", icon: "Flame" },
  { value: "sukkot", label: "Sukkos", sub: "סוכות", category: "holiday", emoji: "🛖", icon: "Tent" },
  { value: "shavuot", label: "Shavuos", sub: "שבועות", category: "holiday", emoji: "📜", icon: "Wheat" },
  { value: "rosh-hashana", label: "Rosh Hashanah", sub: "ראש השנה", category: "holiday", emoji: "📯", icon: "Music" },
  { value: "yom-kippur", label: "Yom Kippur", sub: "יום כיפור", category: "holiday", emoji: "🕊️", icon: "Bell" },
  { value: "simchat-torah", label: "Simchas Torah", sub: "שמחת תורה", category: "holiday", emoji: "🎉", icon: "Scroll" },
  { value: "tu-bishvat", label: "Tu B'Shvat", sub: "ט״ו בשבט", category: "holiday", emoji: "🌳", icon: "TreePine" },
  { value: "lag-baomer", label: "Lag B'Omer", sub: "ל״ג בעומר", category: "holiday", emoji: "🔥", icon: "Flame" },

  // ──── EDUCATIONAL STORIES (good middos in daily life) ────
  { value: "edu-hakaras-hatov", label: "Saying Thank You", sub: "אומרים תודה", category: "educational", emoji: "🙏", icon: "Sun" },
  { value: "edu-chesed", label: "A Helping Hand", sub: "יד עוזרת", category: "educational", emoji: "🤝", icon: "HeartHandshake" },
  { value: "edu-emes", label: "Always Telling the Truth", sub: "תמיד אומרים אמת", category: "educational", emoji: "💬", icon: "ShieldCheck" },
  { value: "edu-kibud", label: "Honoring Abba & Imma", sub: "כיבוד אבא ואמא", category: "educational", emoji: "❤️", icon: "Heart" },
  { value: "edu-savlanus", label: "Waiting Patiently", sub: "מחכים בסבלנות", category: "educational", emoji: "⏳", icon: "Hourglass" },
  { value: "edu-shalom", label: "Making Peace with Friends", sub: "עושים שלום", category: "educational", emoji: "🕊️", icon: "Handshake" },
  { value: "edu-tzedakah", label: "Giving Tzedakah", sub: "נתינת צדקה", category: "educational", emoji: "🪙", icon: "Coins" },
  { value: "edu-sharing", label: "Learning to Share", sub: "לומדים לחלוק", category: "educational", emoji: "🎁", icon: "Gift" },
  { value: "edu-slichah", label: "Saying I'm Sorry", sub: "אומרים סליחה", category: "educational", emoji: "🌱", icon: "Sprout" },
  { value: "edu-derech-eretz", label: "Good Middos & Manners", sub: "מידות טובות ודרך ארץ", category: "educational", emoji: "⭐", icon: "Medal" },
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
  educational: null,
};

export const CATEGORY_META: Record<TorahOption["category"], { label: string; labelHe: string; emoji: string; icon: string }> = {
  torah: { label: "Torah", labelHe: "תורה", emoji: "📜", icon: "Scroll" },
  neviim: { label: "Nevi'im", labelHe: "נביאים", emoji: "⚔️", icon: "Megaphone" },
  ketuvim: { label: "Kesuvim", labelHe: "כתובים", emoji: "✍️", icon: "PenLine" },
  megillot: { label: "Megillos", labelHe: "מגילות", emoji: "📖", icon: "ScrollText" },
  holiday: { label: "Yamim Tovim", labelHe: "ימים טובים", emoji: "🕯️", icon: "Sparkles" },
  educational: { label: "Educational Stories", labelHe: "סיפורים חינוכיים", emoji: "🌟", icon: "Lightbulb" },
};

/**
 * Story title with the leading "Sefer X – " (or "Tehillim – ", etc.) removed —
 * used inside a sefer accordion, where the header already names the sefer.
 * Returns the text unchanged when there is no " – " separator (e.g. Torah parshiyos).
 */
export const stripSeferPrefix = (text: string): string => {
  const idx = text.indexOf(" – ");
  return idx >= 0 ? text.slice(idx + 3) : text;
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

/**
 * Returns the parashah read `leadWeeks` weeks after `from` (default: 3 weeks from
 * now, the production lead time). Pass a future Monday to find the portion a
 * subscription book released that day will cover — mirrors the server-side
 * supabase/functions/_shared/parsha.ts used by the release job.
 */
export const getUpcomingParsha = (from: Date = new Date(), leadWeeks = 3): string => {
  const daysUntilSat = (6 - from.getDay() + 7) % 7 || 7;
  const targetSat = new Date(from);
  targetSat.setDate(from.getDate() + daysUntilSat + leadWeeks * 7);
  const key = targetSat.toISOString().slice(0, 10);

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];

  const allDates = Object.keys(PARSHA_CALENDAR).sort();
  const future = allDates.find(d => d >= key);
  if (future) return PARSHA_CALENDAR[future];

  return "bereishit";
};
