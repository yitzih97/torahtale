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
  { value: "vayakhel-pekudei", label: "Parshas Vayakhel-Pekudei", sub: "פרשת ויקהל-פקודי", category: "torah", book: "Shemot", emoji: "🤝", icon: "Users" },

  // Vayikra
  { value: "vayikra", label: "Parshas Vayikra", sub: "פרשת ויקרא", category: "torah", book: "Vayikra", emoji: "🔥", icon: "Flame" },
  { value: "tzav", label: "Parshas Tzav", sub: "פרשת צו", category: "torah", book: "Vayikra", emoji: "🕯️", icon: "Flame" },
  { value: "shemini", label: "Parshas Shemini", sub: "פרשת שמיני", category: "torah", book: "Vayikra", emoji: "8️⃣", icon: "Bird" },
  { value: "tazria", label: "Parshas Tazria", sub: "פרשת תזריע", category: "torah", book: "Vayikra", emoji: "🌱", icon: "Sprout" },
  { value: "metzora", label: "Parshas Metzora", sub: "פרשת מצורע", category: "torah", book: "Vayikra", emoji: "💬", icon: "Droplet" },
  { value: "tazria-metzora", label: "Parshas Tazria-Metzora", sub: "פרשת תזריע-מצורע", category: "torah", book: "Vayikra", emoji: "🌱", icon: "Sprout" },
  { value: "acharei-mot", label: "Parshas Acharei Mos", sub: "פרשת אחרי מות", category: "torah", book: "Vayikra", emoji: "🕊️", icon: "Bird" },
  { value: "kedoshim", label: "Parshas Kedoshim", sub: "פרשת קדושים", category: "torah", book: "Vayikra", emoji: "✨", icon: "Sparkles" },
  { value: "acharei-mot-kedoshim", label: "Parshas Acharei Mos-Kedoshim", sub: "פרשת אחרי מות-קדושים", category: "torah", book: "Vayikra", emoji: "🕊️", icon: "Bird" },
  { value: "emor", label: "Parshas Emor", sub: "פרשת אמור", category: "torah", book: "Vayikra", emoji: "🎉", icon: "CalendarDays" },
  { value: "behar", label: "Parshas Behar", sub: "פרשת בהר", category: "torah", book: "Vayikra", emoji: "🌾", icon: "Wheat" },
  { value: "bechukotai", label: "Parshas Bechukosai", sub: "פרשת בחוקותי", category: "torah", book: "Vayikra", emoji: "🛤️", icon: "Footprints" },
  { value: "behar-bechukotai", label: "Parshas Behar-Bechukosai", sub: "פרשת בהר-בחוקותי", category: "torah", book: "Vayikra", emoji: "🌾", icon: "Wheat" },

  // Bamidbar
  { value: "bamidbar", label: "Parshas Bamidbar", sub: "פרשת במדבר", category: "torah", book: "Bamidbar", emoji: "🏜️", icon: "MapPin" },
  { value: "naso", label: "Parshas Naso", sub: "פרשת נשא", category: "torah", book: "Bamidbar", emoji: "🙌", icon: "HeartHandshake" },
  { value: "behaalotecha", label: "Parshas Beha'aloscha", sub: "פרשת בהעלותך", category: "torah", book: "Bamidbar", emoji: "🕎", icon: "Flame" },
  { value: "shelach", label: "Parshas Shelach", sub: "פרשת שלח", category: "torah", book: "Bamidbar", emoji: "🍇", icon: "Grape" },
  { value: "korach", label: "Parshas Korach", sub: "פרשת קרח", category: "torah", book: "Bamidbar", emoji: "⚡", icon: "Zap" },
  { value: "chukat", label: "Parshas Chukas", sub: "פרשת חוקת", category: "torah", book: "Bamidbar", emoji: "🐄", icon: "Droplet" },
  { value: "balak", label: "Parshas Balak", sub: "פרשת בלק", category: "torah", book: "Bamidbar", emoji: "🫏", icon: "PawPrint" },
  { value: "chukat-balak", label: "Parshas Chukas-Balak", sub: "פרשת חוקת-בלק", category: "torah", book: "Bamidbar", emoji: "🐄", icon: "Droplet" },
  { value: "pinchas", label: "Parshas Pinchas", sub: "פרשת פנחס", category: "torah", book: "Bamidbar", emoji: "🛡️", icon: "Shield" },
  { value: "matot", label: "Parshas Matos", sub: "פרשת מטות", category: "torah", book: "Bamidbar", emoji: "🤞", icon: "Handshake" },
  { value: "masei", label: "Parshas Masei", sub: "פרשת מסעי", category: "torah", book: "Bamidbar", emoji: "🗺️", icon: "Map" },
  { value: "matot-masei", label: "Parshas Matos-Masei", sub: "פרשת מטות-מסעי", category: "torah", book: "Bamidbar", emoji: "🤞", icon: "Handshake" },

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
  { value: "nitzavim-vayelech", label: "Parshas Nitzavim-Vayeilech", sub: "פרשת נצבים-וילך", category: "torah", book: "Devarim", emoji: "🧍", icon: "Users" },
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
  // Fast days (in calendar order through the year)
  { value: "tzom-gedaliah", label: "Tzom Gedaliah", sub: "צום גדליה", category: "holiday", emoji: "🍂", icon: "Leaf" },
  { value: "asarah-bteves", label: "Asarah B'Teves", sub: "עשרה בטבת", category: "holiday", emoji: "🏰", icon: "Castle" },
  { value: "taanis-esther", label: "Taanis Esther", sub: "תענית אסתר", category: "holiday", emoji: "👑", icon: "Crown" },
  { value: "shiva-asar-btammuz", label: "Shiva Asar B'Tammuz", sub: "שבעה עשר בתמוז", category: "holiday", emoji: "🧱", icon: "Shield" },
  { value: "tisha-bav", label: "Tisha B'Av", sub: "תשעה באב", category: "holiday", emoji: "🕯️", icon: "Landmark" },

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
/** Map a book's stored `language` ("english" | "hebrew" | "yiddish") to the
 *  short display code + text direction. Book text (incl. the cover) must follow
 *  the BOOK's own language, not the viewer's UI language. */
export const bookLanguageCode = (language?: string | null): "en" | "he" | "yi" => {
  const l = (language || "").toLowerCase();
  if (l.startsWith("he")) return "he";
  if (l.startsWith("yi")) return "yi";
  return "en";
};
export const isBookRtl = (language?: string | null): boolean => bookLanguageCode(language) !== "en";

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
  // Diaspora weekly parashah, generated from the Hebcal sedrot API (i=off).
  // Double parshiyos are labelled with the combined slug (e.g. matot-masei) so a
  // combined week sells ONE book covering both. Keyed by the Shabbos (Saturday) date.
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

/**
 * The stories to tease on a book's back cover (to drive subscriptions): for a
 * Megilla, the OTHER Megillos; otherwise the next few upcoming weekly parshiyos.
 * Returns up to `count` { value, label } entries, never including the current one.
 */
export const getBackCoverPreviewPortions = (
  currentPortion: string,
  lang: "en" | "he" | "yi" = "en",
  count = 4,
  from: Date = new Date(),
): { value: string; label: string }[] => {
  const current = TORAH_PORTIONS.find((p) => p.value === currentPortion);
  const out: { value: string; label: string }[] = [];
  const push = (value: string) => {
    if (value && value !== currentPortion && !out.some((o) => o.value === value)) {
      out.push({ value, label: getPortionDisplay(value, lang) });
    }
  };
  if (current?.category === "megillot") {
    for (const p of TORAH_PORTIONS) {
      if (out.length >= count) break;
      if (p.category === "megillot") push(p.value);
    }
  } else {
    let d = new Date(from);
    for (let guard = 0; out.length < count && guard < 120; guard++) {
      push(getUpcomingParsha(d, 0));
      d = new Date(d);
      d.setDate(d.getDate() + 7);
    }
  }
  return out.slice(0, count);
};

// ── Weekly parashah rollover: Wednesday 12:00 PM Eastern ─────────────────────
// The wizard's auto-selected parashah rolls over every Wednesday at noon ET and
// the on-screen countdown ticks toward that moment. We derive the Eastern wall
// clock of any instant via toLocaleString (DST-safe, no date library): `et` is a
// Date whose LOCAL fields mirror the America/New_York clock, and `offset`
// converts an ET-wall-clock Date back into a real UTC instant.
const easternClock = (d: Date): { et: Date; offset: number } => {
  const et = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return { et, offset: d.getTime() - et.getTime() };
};

/** The instant of the next Wednesday 12:00 PM ET strictly after `from`. */
export const getNextParshaRollover = (from: Date = new Date()): Date => {
  const { et, offset } = easternClock(from);
  const target = new Date(et);
  target.setDate(et.getDate() + ((3 - et.getDay() + 7) % 7)); // next Wednesday (Wed = 3)
  target.setHours(12, 0, 0, 0);
  if (target.getTime() <= et.getTime()) target.setDate(target.getDate() + 7);
  return new Date(target.getTime() + offset);
};

/**
 * The parashah to suggest as "this week" in the creation wizard.
 *
 * A parashah "week" runs from one Wednesday-noon-ET rollover to the next: from
 * Wednesday noon ET we point at the coming Shabbat and hold it through the
 * following Wednesday noon, then roll forward. (Unlike getUpcomingParsha, which
 * adds a multi-week production lead used by the subscription release job — this
 * one shows the current/upcoming week, no lead.)
 *
 * e.g. now → 2026-07-02 (before Wed 07-08 noon ET) → pinchas (Shabbat 07-04);
 * from Wed 2026-07-08 noon ET → matot (Shabbat 07-11).
 */
export const getCurrentParsha = (from: Date = new Date()): string => {
  const { et } = easternClock(from);
  // Anchor on the most recent Wednesday-noon-ET rollover, then show the parashah
  // of the Shabbat of the FOLLOWING week (rollover + 10 days). This gives a
  // production lead: once Wednesday noon passes we advance to next week's parashah.
  // e.g. Thu 2026-07-02 (past Wed 07-01 noon) -> Shabbat 07-11 = matot-masei;
  // it flips to the next parashah at Wed 07-08 noon ET.
  const rollover = new Date(et);
  rollover.setDate(et.getDate() - ((et.getDay() - 3 + 7) % 7)); // this/most-recent Wednesday
  rollover.setHours(12, 0, 0, 0);
  if (rollover.getTime() > et.getTime()) rollover.setDate(rollover.getDate() - 7); // before noon on a Wed
  const sat = new Date(rollover);
  sat.setDate(rollover.getDate() + 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${sat.getFullYear()}-${pad(sat.getMonth() + 1)}-${pad(sat.getDate())}`;

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];
  const future = Object.keys(PARSHA_CALENDAR).sort().find((d) => d >= key);
  return future ? PARSHA_CALENDAR[future] : "bereishit";
};
