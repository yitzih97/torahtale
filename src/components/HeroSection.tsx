import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Heart, Gift, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import heroFlip1 from "@/assets/hero-flip-1.jpg";
import heroFlip2 from "@/assets/hero-flip-2.jpg";
import heroFlip3 from "@/assets/hero-flip-3.jpg";
import heroFlip4 from "@/assets/hero-flip-4.jpg";
import heroFlip5 from "@/assets/hero-flip-5.jpg";
import heroFlip6 from "@/assets/hero-flip-6.jpg";
import reviewer1 from "@/assets/avatars/reviewer1.jpg";
import reviewer2 from "@/assets/avatars/reviewer2.jpg";
import reviewer3 from "@/assets/avatars/reviewer3.jpg";

const ease = [0.16, 1, 0.3, 1];

// Rotating hero slides — same two children, a different parashah and book type on
// each. The headline below types out the matching story line.
const SLIDES = [
  { img: heroFlip1, en: "aboard Noach’s ark.", he: "על תיבת נח." },
  { img: heroFlip2, en: "as the world is created.", he: "כשהעולם נברא." },
  { img: heroFlip3, en: "splitting the sea.", he: "כשהים נבקע." },
  { img: heroFlip4, en: "coloring Avraham’s journey.", he: "בצביעת מסע אברהם." },
  { img: heroFlip5, en: "deep in the sea with Yonah.", he: "במעמקים עם יונה." },
  { img: heroFlip6, en: "at the Purim miracle.", he: "בנס פורים." },
];
const ROTATE_MS = 4000;

/** Types `text` out character-by-character whenever it changes, with a blinking caret. */
function TypedText({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 42);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      {shown}
      <span className="inline-block w-[2px] -mb-1 h-[0.9em] bg-current ml-0.5 animate-pulse align-baseline" />
    </>
  );
}

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === "rtl";
  const isHebrew = lang === "he" || lang === "yi";

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const copy = isHebrew
    ? {
        title1: "המסע שלהם.",
        title2: "הסיפור שלהם —",
        description:
          "אנחנו יוצרים ספרים אישיים שמחזירים את סיפורי התורה לחיים — כשהילד שלכם הוא גיבור הסיפור, וכל עמוד מנחיל ערכים לכל החיים.",
        primaryCta: "צרו את הסיפור של ילדכם",
        features: [
          { icon: BookOpen, label: "תוכן יהודי טהור" },
          { icon: Heart, label: "נעשה באהבה" },
          { icon: Gift, label: "מתנה ששומרים לכל החיים" },
        ],
        trustHeading: "משפחות מתאהבות. נבחר בכל העולם.",
        rating: "4.9/5 מתוך 500+ ביקורות",
        testimonials: [
          { quote: "הדרך הכי יפה לחבר את הילדים שלנו לתורה. הם מבקשים את הספר שלהם כל ערב מחדש!", name: "רבקי ומשה ש.", location: "ברוקלין, ניו יורק", avatar: reviewer1 },
          { quote: "האיכות פשוט מדהימה, וההתאמה האישית עושה את כל ההבדל. מתנה שתישאר איתנו שנים.", name: "חנה פ.", location: "לוס אנג׳לס", avatar: reviewer2 },
          { quote: "הבן שלנו מרגיש שהוא ממש גיבור הסיפור — וזה מחבר אותו לערכים של התורה בצורה הכי טבעית.", name: "אבי מ.", location: "טורונטו, קנדה", avatar: reviewer3 },
        ],
        trustBar: [
          { icon: ShieldCheck, label: "בטוח ומותאם לגיל" },
          { icon: Award, label: "משפחות מכל העולם סומכות עלינו" },
          { icon: Lock, label: "מאובטח ופרטי" },
        ],
      }
    : {
        title1: "Their journey.",
        title2: "Their story —",
        description:
          "We create personalized books that bring Torah stories to life—starring your child, instilling values that inspire a lifetime.",
        primaryCta: "Start Your Child's Story",
        features: [
          { icon: BookOpen, label: "100% Jewish Content" },
          { icon: Heart, label: "Made with Love" },
          { icon: Gift, label: "A Gift They'll Cherish" },
        ],
        trustHeading: "Loved by families. Trusted worldwide.",
        rating: "4.9/5 from 500+ reviews",
        testimonials: [
          { quote: "The most beautiful way to connect our kids to Torah. They ask for their book every night!", name: "Rivky & Moshe S.", location: "Brooklyn, NY", avatar: reviewer1 },
          { quote: "The quality is amazing and the personalization is beyond special. It's a gift our children will cherish forever.", name: "Chana F.", location: "Los Angeles, CA", avatar: reviewer2 },
          { quote: "Our son feels like the hero of the story—and it brings Torah values to life in such a beautiful way.", name: "Avi M.", location: "Toronto, Canada", avatar: reviewer3 },
        ],
        trustBar: [
          { icon: ShieldCheck, label: "Safe & Age Appropriate" },
          { icon: Award, label: "Trusted by Families Worldwide" },
          { icon: Lock, label: "Secure & Private" },
        ],
      };

  const storyLine = isHebrew ? SLIDES[slide].he : SLIDES[slide].en;

  return (
    <>
      <section className="relative overflow-hidden bg-[hsl(42_60%_96%)]" dir={dir}>
        {/* Rotating book-flip background — same kids, different parsha + book type. */}
        <div className="absolute inset-0">
          {SLIDES.map((s, i) => (
            <img
              key={i}
              src={s.img}
              alt={i === slide ? "Two children reading their personalized Torah storybook" : ""}
              aria-hidden={i !== slide}
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1200ms] ease-in-out"
              style={{ opacity: i === slide ? 1 : 0 }}
              width={1376}
              height={768}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>

        {/* Readability scrim: strong cream fade behind the copy side, plus a soft
            top/bottom wash on mobile where the copy sits over the image. */}
        <div
          className={`hidden lg:block pointer-events-none absolute inset-y-0 ${isRtl ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-[60%] from-[hsl(42_60%_96%)] via-[hsl(42_60%_96%)]/90 to-transparent z-[1]`}
        />
        <div className="lg:hidden pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[hsl(42_60%_96%)]/92 via-[hsl(42_60%_96%)]/55 to-[hsl(42_60%_96%)]/92" />

        <div className="container relative z-10 pt-28 lg:pt-32 pb-8 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[6fr_5fr] gap-4 lg:gap-6 items-center min-h-[88vw] sm:min-h-[60vw] lg:min-h-[600px]">
            {/* copy */}
            <div className={`relative z-10 ${isRtl ? "text-right" : "text-left"}`}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                className="font-display font-bold leading-[1.05] tracking-tight text-foreground text-[2.25rem] sm:text-5xl lg:text-[4.25rem]"
              >
                <span className="block">{copy.title1}</span>
                <span className="block">{copy.title2}</span>
                {/* Rotating, typed story line — reflects the book on screen. */}
                <span className="block gold-text-gradient italic min-h-[1.2em]" aria-live="polite">
                  <TypedText text={storyLine} />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease }}
                className="mt-4 sm:mt-6 text-sm sm:text-lg text-foreground/70 max-w-lg leading-relaxed"
              >
                {copy.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
                className={`mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start ${isRtl ? "lg:justify-end" : "lg:justify-start"}`}
              >
                <Button
                  variant="gold"
                  size="xl"
                  onClick={onStart}
                  className="group gold-glow rounded-xl w-full sm:w-auto px-7"
                >
                  {copy.primaryCta}
                  <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                </Button>
              </motion.div>

              {/* Slide dots */}
              <div className={`mt-6 flex gap-2 ${isRtl ? "justify-end lg:justify-end" : "justify-start"}`}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Show slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-6 bg-gold" : "w-1.5 bg-foreground/25 hover:bg-foreground/40"}`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block lg:min-h-[600px]" />
          </div>

          {/* feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease }}
            className="mt-8 lg:mt-12 rounded-2xl border border-foreground/8 bg-background/70 backdrop-blur px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center justify-around gap-x-6 gap-y-3"
          >
            {copy.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <f.icon className="w-6 h-6 sm:w-7 sm:h-7 text-gold flex-shrink-0" strokeWidth={1.5} />
                <span className="text-xs sm:text-sm font-medium text-foreground/80 max-w-[8rem] leading-tight">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Trust bar */}
        <div className="relative z-10 bg-[hsl(220_45%_10%)] text-white/85">
          <div className="container py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-sm">
            {copy.trustBar.map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3 py-2 sm:py-0">
                <item.icon className="w-5 h-5 text-gold" />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="relative bg-gradient-to-b from-[hsl(42_55%_95%)] to-[hsl(38_45%_92%)]" dir={dir}>
        <div className="container py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="rounded-2xl bg-background/70 backdrop-blur border border-foreground/8 shadow-sm px-6 sm:px-8 py-6 sm:py-8"
          >
            <div className="grid lg:grid-cols-[1fr_2.4fr] gap-6 lg:gap-10 items-center">
              <div className={`${isRtl ? "lg:text-right" : "lg:text-left"} text-center`}>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground leading-tight">{copy.trustHeading}</h3>
                <div className={`mt-3 flex items-center gap-2 ${isRtl ? "lg:justify-end" : "lg:justify-start"} justify-center`}>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-sm text-foreground/60">{copy.rating}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                {copy.testimonials.map((tm, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <img src={tm.avatar} alt={tm.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[hsl(var(--gold)/0.3)]" width={48} height={48} loading="lazy" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-foreground/75 leading-snug">
                        <span className="text-gold font-display text-lg leading-none align-top">“</span>
                        {tm.quote}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-foreground">{tm.name}</p>
                      <p className="text-xs text-foreground/55">{tm.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};
