// Testimonials shown on the /testimonials page. The first three mirror the
// homepage hero reviews; the rest are a broad wall of frum-family reviews.
// Avatars are assigned in TestimonialsSection by cycling the available photos.
export interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  { name: "Chaya Leah Friedman", location: "Brooklyn, NY", text: "My daughter's face when she saw herself as the heroine of the Purim story — mamash a kiddush Hashem. The kinderlach ask for it every Leil Shabbos.", rating: 5 },
  { name: "Avi Rosenberg", location: "Lakewood, NJ", text: "We subscribed to the Parsha Club. Every Leil Shabbos our son reads his new personalized book at the tish. The whole family loves it.", rating: 5 },
  { name: "Rivky Weinberg", location: "Monsey, NY", text: "The illustrations are stunning and completely tznius — peyos, tzitzis, everything just right. The AI captured the parsha perfectly.", rating: 5 },
  { name: "Shaindy Klein", location: "Boro Park, NY", text: "My son didn't believe it was really him in the sefer until he saw his own face holding the luchos. He hasn't stopped showing his rebbi.", rating: 5 },
  { name: "Dovid Mandel", location: "Passaic, NJ", text: "Worth every penny. The print quality is gorgeous, the hardcover feels like a real keepsake we'll pass down.", rating: 5 },
  { name: "Esty Greenbaum", location: "Cleveland, OH", text: "We ordered for our twins and each got their own story. The faces actually look like them — I was shocked.", rating: 5 },
  { name: "Yossi Adler", location: "Baltimore, MD", text: "The Krias Yam Suf book had my three-year-old gasping at the split sea. Bedtime is now Torah time. Incredible.", rating: 5 },
  { name: "Miriam Stein", location: "Toronto, ON", text: "I cried when it arrived. Seeing my Sarala walking with the Imahos, dressed so tzniusdik — exactly what I hoped for.", rating: 5 },
  { name: "Yitzchok Berman", location: "Chicago, IL", text: "Shipping was fast and the customer care answered every question. The book itself is a work of art.", rating: 5 },
  { name: "Bracha Lowenthal", location: "Far Rockaway, NY", text: "My daughter takes it everywhere. The binding has survived months of daily reading by little hands.", rating: 5 },
  { name: "Menachem Pollak", location: "Los Angeles, CA", text: "As a rebbi I was skeptical about AI, but the content is authentic and respectful. I now recommend it to all my talmidim's parents.", rating: 5 },
  { name: "Devorah Katz", location: "Silver Spring, MD", text: "The personalization goes beyond the name — my son's curly peyos and glasses are right there on every page.", rating: 5 },
  { name: "Shlomo Hirsch", location: "Cedarhurst, NY", text: "Bought it as a birthday gift for my nephew. My sister called me crying happy tears. Best gift I've ever given.", rating: 5 },
  { name: "Rochel Taub", location: "Monsey, NY", text: "The Noach's teivah story with all the animals is my kids' favorite. They point to themselves on the teivah every time.", rating: 5 },
  { name: "Ari Schwartz", location: "Teaneck, NJ", text: "Beautiful values woven into every page. My daughter learned about chesed without even realizing she was learning.", rating: 4 },
  { name: "Tzippy Roth", location: "Brooklyn, NY", text: "I love that the girls are dressed modestly and modern at the same time. Finally a book that reflects our home.", rating: 5 },
  { name: "Naftali Gross", location: "Lakewood, NJ", text: "The Avraham counting the stars page is breathtaking. We framed a print of it for the kids' room.", rating: 5 },
  { name: "Leah Mintz", location: "Flatbush, NY", text: "Three orders and counting. Every grandchild gets one for their upsherin. It's become our family tradition.", rating: 5 },
  { name: "Moshe Davidson", location: "Houston, TX", text: "Living out of town, this brings so much Yiddishkeit into our home. The kids feel connected to the parsha all week.", rating: 5 },
  { name: "Faigy Stern", location: "Montreal, QC", text: "The Hebrew option is wonderful for our chinuch. My son reads the loshon hakodesh proudly to his zaidy.", rating: 5 },
  { name: "Yehuda Brenner", location: "Boro Park, NY", text: "Customer service helped me get it before Yom Tov when I ordered late. Above and beyond. Menschlich people.", rating: 5 },
  { name: "Suri Feldman", location: "Monsey, NY", text: "My daughter who never sat for stories now begs for 'her book.' Seeing herself as the star changed everything.", rating: 5 },
  { name: "Eli Kaplan", location: "Detroit, MI", text: "The Yosef coat of colors edition is so vivid. The colors practically glow off the page. Stunning craftsmanship.", rating: 5 },
  { name: "Nechama Wolf", location: "Memphis, TN", text: "We use it to prepare the kids for the parsha each week. They walk into the seuda already knowing the story.", rating: 5 },
  { name: "Berel Lieberman", location: "Crown Heights, NY", text: "A gift that keeps giving. My son is prouder of this book than any toy he owns. Pure nachas.", rating: 5 },
  { name: "Goldie Ackerman", location: "Lakewood, NJ", text: "The board book is perfect for my toddler — thick pages, rounded corners, gorgeous art. He can't damage it.", rating: 5 },
  { name: "Chaim Steinberg", location: "Phoenix, AZ", text: "Out here we don't have much, so a personalized Torah sefer means the world. The kids treasure it.", rating: 5 },
  { name: "Malky Horowitz", location: "Monsey, NY", text: "I appreciated being able to review and approve before printing. The team made small fixes I asked for happily.", rating: 5 },
  { name: "Shimon Erlich", location: "Toronto, ON", text: "The Matan Torah book with the lightning and shofar is dramatic and tasteful. My son acts it out every night.", rating: 5 },
  { name: "Ruchie Glick", location: "Brooklyn, NY", text: "Five stars isn't enough. The quality, the care, the message — everything is l'shem Shamayim. Hatzlacha to this company.", rating: 5 },
  { name: "Yaakov Neuman", location: "Baltimore, MD", text: "My daughter's modest dress in the book matches how we dress at home. The attention to detail is remarkable.", rating: 5 },
  { name: "Hindy Rubin", location: "Cedarhurst, NY", text: "We gave it at the bris as a gift for the older siblings so they wouldn't feel left out. Genius idea, perfect execution.", rating: 5 },
  { name: "Shea Birnbaum", location: "Lakewood, NJ", text: "The Dovid and Golyas story taught my son real bitachon. He talks about it constantly. Powerful chinuch tool.", rating: 5 },
  { name: "Perel Friedman", location: "Monsey, NY", text: "Ordered in Yiddish for the heimishe feel. The nusach is authentic and warm. My bubby approved — high praise!", rating: 5 },
  { name: "Avrohom Weiss", location: "Chicago, IL", text: "The whole process was simple even for someone not so techy. Uploaded a photo, picked a parsha, done.", rating: 4 },
  { name: "Sara Rivka Cohen", location: "Passaic, NJ", text: "My daughter sleeps with it under her pillow. That's all you need to know about how much she loves it.", rating: 5 },
  { name: "Yonason Marcus", location: "Atlanta, GA", text: "Stunning illustrations and rock-solid hashkafa. As a kiruv family this is a beautiful, non-preachy way to share Torah.", rating: 5 },
  { name: "Frumie Schneider", location: "Brooklyn, NY", text: "The Yonah and the great fish story is mesmerizing. We read it before Yom Kippur and my kids understood teshuva.", rating: 5 },
  { name: "Dov Ber Klein", location: "Monsey, NY", text: "Three kids, three books, three different parshiyos — and each looks exactly like the child. Unreal technology.", rating: 5 },
  { name: "Aidel Reinman", location: "Lakewood, NJ", text: "The subscription is the best value. A fresh book each week keeps the excitement for Torah alive all year.", rating: 5 },
  { name: "Pinchas Gold", location: "Miami, FL", text: "Beautiful, durable, meaningful. My only regret is not ordering sooner for my older kids too.", rating: 4 },
  { name: "Tova Lendner", location: "Toronto, ON", text: "The Tower of Bavel book opened a real conversation about achdus with my kids. Chinuch through a story they love.", rating: 5 },
  { name: "Zevi Halpern", location: "Boro Park, NY", text: "I daven that this company has continued hatzlacha. They're bringing simchas haTorah into so many homes.", rating: 5 },
  { name: "Bashy Edelstein", location: "Monsey, NY", text: "My granddaughter lights up every single time. Worth it just to see that smile. The art is museum quality.", rating: 5 },
  { name: "Refoel Sussman", location: "Cleveland, OH", text: "Gan Eden illustration is otherworldly. My son says it's his favorite place to 'visit' before bed.", rating: 5 },
  { name: "Chani Bauer", location: "Far Rockaway, NY", text: "Fast, frum, and friendly. The book arrived beautifully packaged — felt like opening a real treasure.", rating: 5 },
  { name: "Meir Landau", location: "Baltimore, MD", text: "I teach pre-1A and parents keep asking where I got 'that personalized parsha book.' This one. Always this one.", rating: 5 },
  { name: "Yittel Praver", location: "Lakewood, NJ", text: "The baby Moshe on the Nile pages are so tender. My daughter pats the baby in the picture goodnight. Adorable.", rating: 5 },
  { name: "Sruli Wachsman", location: "Monsey, NY", text: "Quality you can feel. The hardcover is substantial, the pages are thick, the colors are rich. A true heirloom.", rating: 5 },
  { name: "Henny Markowitz", location: "Brooklyn, NY", text: "My son finally has a sefer that's truly his. He reads it to his little sister every Shabbos. Pure nachas, mamash.", rating: 5 },
];
