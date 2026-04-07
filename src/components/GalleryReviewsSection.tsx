import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BookPreviewModal } from "@/components/gallery/BookPreviewModal";
import { useLanguage } from "@/contexts/LanguageContext";

// Covers
import s1Cover from "@/assets/gallery/s1-cover.jpg";
import s2Cover from "@/assets/gallery/s2-cover.jpg";
import s3Cover from "@/assets/gallery/s3-cover.jpg";
import s4Cover from "@/assets/gallery/s4-cover.jpg";
import s5Cover from "@/assets/gallery/s5-cover.jpg";
import s6Cover from "@/assets/gallery/s6-cover.jpg";
import s7Cover from "@/assets/gallery/s7-cover.jpg";
import s8Cover from "@/assets/gallery/s8-cover.jpg";
import s9Cover from "@/assets/gallery/s9-cover.jpg";
import s10Cover from "@/assets/gallery/s10-cover.jpg";

// Kid profile photos
import kidRivka from "@/assets/gallery/kid-rivka.jpg";
import kidYehuda from "@/assets/gallery/kid-yehuda.jpg";
import kidChaya from "@/assets/gallery/kid-chaya.jpg";
import kidShmuel from "@/assets/gallery/kid-shmuel.jpg";
import kidEsther from "@/assets/gallery/kid-esther.jpg";
import kidAri from "@/assets/gallery/kid-ari.jpg";
import kidDevorah from "@/assets/gallery/kid-devorah.jpg";
import kidMoshe from "@/assets/gallery/kid-moshe.jpg";
import kidDovid from "@/assets/gallery/kid-dovid.jpg";
import kidNoa from "@/assets/gallery/kid-noa.jpg";

const ease = [0.16, 1, 0.3, 1];

const stories = [
  { title: "The Wonders of Gan Eden", titleHe: "פלאות גן עדן", portion: "Parashas Bereishis", child: "Rivka", childPhoto: kidRivka, coverImage: s1Cover, review: "My daughter couldn't stop talking about Gan Eden! She felt like she was really there walking with Adam and Chava.", reviewHe: "הבת שלי לא הפסיקה לדבר על גן עדן! היא הרגישה שהיא באמת הולכת שם עם אדם וחוה.", reviewer: "Talia B.", location: "Brooklyn, NY", rating: 5 },
  { title: "Noach's Incredible Teivah", titleHe: "התיבה המדהימה של נח", portion: "Parashas Noach", child: "Yehuda", childPhoto: kidYehuda, coverImage: s2Cover, review: "The animals, the teivah, the keshet — every detail was perfect. Our boys read it every Shabbos afternoon.", reviewHe: "החיות, התיבה, הקשת — כל פרט היה מושלם. הבנים שלנו קוראים את זה כל שבת אחר הצהריים.", reviewer: "Avi R.", location: "Lakewood, NJ", rating: 5 },
  { title: "The Tower That Fell", titleHe: "המגדל שנפל", portion: "Parashas Noach", child: "Chaya", childPhoto: kidChaya, coverImage: s3Cover, review: "Such a creative way to teach about achdus. My son finally understood why the dor haflagah was punished.", reviewHe: "דרך יצירתית כל כך ללמד על אחדות. הבן שלי סוף סוף הבין למה דור הפלגה נענש.", reviewer: "Racheli K.", location: "Monsey, NY", rating: 5 },
  { title: "Avraham Counts the Stars", titleHe: "אברהם סופר את הכוכבים", portion: "Parashas Lech Lecha", child: "Shmuel", childPhoto: kidShmuel, coverImage: s4Cover, review: "The night sky illustration took our breath away. Our daughter asks to read this one every single night.", reviewHe: "האיור של שמי הלילה לקח לנו את הנשימה. הבת שלנו מבקשת לקרוא את זה כל לילה.", reviewer: "Shira G.", location: "Passaic, NJ", rating: 5 },
  { title: "Yosef's Coat of Colors", titleHe: "כתונת הפסים של יוסף", portion: "Parashas Vayeishev", child: "Esther", childPhoto: kidEsther, coverImage: s5Cover, review: "The colors are magnificent! My son wears his own 'Yosef coat' now while we read. Pure magic.", reviewHe: "הצבעים מרהיבים! הבן שלי לובש את 'כתונת היוסף' שלו עכשיו בזמן שאנחנו קוראים. קסם טהור.", reviewer: "Devorah M.", location: "Crown Heights, NY", rating: 5 },
  { title: "Baby Moshe on the Nile", titleHe: "משה התינוק על הנילוס", portion: "Parashas Shemos", child: "Ari", childPhoto: kidAri, coverImage: s6Cover, review: "My kids were so moved by baby Moshe's story. The Egyptian scenery is absolutely breathtaking.", reviewHe: "הילדים שלי היו כל כך מרוגשים מהסיפור של משה התינוק. הנוף המצרי פשוט עוצר נשימה.", reviewer: "Miriam L.", location: "Flatbush, NY", rating: 5 },
  { title: "Krias Yam Suf", titleHe: "קריעת ים סוף", portion: "Parashas Beshalach", child: "Devorah", childPhoto: kidDevorah, coverImage: s7Cover, review: "Walking through the split sea with Moshe Rabbeinu — my children were mesmerized. A masterpiece.", reviewHe: "ללכת דרך הים שנבקע עם משה רבינו — הילדים שלי היו מהופנטים. יצירת מופת.", reviewer: "Yosef C.", location: "Far Rockaway, NY", rating: 5 },
  { title: "Matan Torah on Har Sinai", titleHe: "מתן תורה על הר סיני", portion: "Parashas Yisro", child: "Moshe", childPhoto: kidMoshe, coverImage: s8Cover, review: "The lightning, the luchos, the shofar — every detail brings Matan Torah alive. Truly special.", reviewHe: "הברקים, הלוחות, השופר — כל פרט מחיה את מתן תורה. באמת מיוחד.", reviewer: "Chana S.", location: "Boro Park, NY", rating: 5 },
  { title: "Dovid and Golyas", titleHe: "דוד וגלית", portion: "Sefer Shmuel", child: "Dovid", childPhoto: kidDovid, coverImage: s9Cover, review: "My son carries this book everywhere. Dovid's bitachon in Hashem made a lasting impression on him.", reviewHe: "הבן שלי נושא את הספר הזה לכל מקום. הביטחון של דוד בה׳ השאיר רושם עמוק.", reviewer: "Menachem F.", location: "Baltimore, MD", rating: 5 },
  { title: "Yonah and the Great Dag", titleHe: "יונה והדג הגדול", portion: "Sefer Yonah", child: "Noa", childPhoto: kidNoa, coverImage: s10Cover, review: "We read this before Yom Kippur and my daughter finally understood the message of teshuvah. Beautiful.", reviewHe: "קראנו את זה לפני יום כיפור והבת שלי סוף סוף הבינה את המסר של תשובה. יפהפה.", reviewer: "Leah W.", location: "Chicago, IL", rating: 5 },
];

export const GalleryReviewsSection = () => {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const { t, lang } = useLanguage();

  const book = selectedBook !== null ? {
    ...stories[selectedBook],
    pages: [],
    backCoverImage: "",
    questions: [],
  } : null;

  return (
    <section id="gallery" className="py-24 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">{t.gallery.label}</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            {t.gallery.title}
            <br />
            <span className="text-accent">{t.gallery.titleAccent}</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed font-body">
            {t.gallery.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-6">
          {stories.map((story, i) => (
            <motion.div
              key={story.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className={`group cursor-pointer ${i % 3 === 1 ? "lg:mt-8" : ""}`}
              onClick={() => setSelectedBook(i)}
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative rounded-2xl overflow-hidden border border-border/50 hover:border-accent/40 transition-all duration-500 shadow-md hover:shadow-xl"
              >
                <div className="aspect-[3/4] relative">
                  <img src={story.coverImage} alt={lang === "he" ? story.titleHe : story.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {story.childPhoto && (
                    <div className="absolute top-3 right-3 z-10">
                      <img src={story.childPhoto} alt={story.child} className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shadow-md" />
                    </div>
                  )}

                  <div className="absolute bottom-0 inset-x-0 p-3 pt-8">
                    <h3 className="font-display text-xs lg:text-sm font-semibold text-white leading-tight drop-shadow-md">{lang === "he" ? story.titleHe : story.title}</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">{story.portion}</p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-semibold text-white bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                      {t.gallery.readReview}
                    </span>
                  </div>
                </div>
              </motion.div>

              <div className="mt-3 px-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: story.rating }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-body">·</span>
                  <span className="text-[10px] text-accent font-medium">{lang === "he" ? t.gallery.childStory + story.child : story.child + t.gallery.childStory}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 font-body">
                  "{lang === "he" ? story.reviewHe : story.review}"
                </p>
                <p className="text-[10px] text-foreground/60 mt-1 font-medium">
                  — {story.reviewer}, {story.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <BookPreviewModal
        book={book}
        open={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
      />
    </section>
  );
};
