import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Heart, Gift, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import heroFlip1 from "@/assets/hero-flip-1.jpg";
import heroFlip2 from "@/assets/hero-flip-2.jpg";
import heroFlip3 from "@/assets/hero-flip-3.jpg";
import heroM1 from "@/assets/hero-m-1.jpg";
import heroM2 from "@/assets/hero-m-2.jpg";
import heroM3 from "@/assets/hero-m-3.jpg";
import reviewer1 from "@/assets/avatars/reviewer1.jpg";
import reviewer2 from "@/assets/avatars/reviewer2.jpg";
import reviewer3 from "@/assets/avatars/reviewer3.jpg";

const ease = [0.16, 1, 0.3, 1];

// Hero slides — same two children, a different parashah and book type on each.
// One is picked at random per page load and stays put (no rotation/transition).
const SLIDES = [
  { img: heroFlip1, imgM: heroM1, en: "aboard Noach’s ark.", he: "על תיבת נח." },
  { img: heroFlip2, imgM: heroM2, en: "as the world is created.", he: "כשהעולם נברא." },
  { img: heroFlip3, imgM: heroM3, en: "crossing the sea.", he: "כשהים נבקע." },
];

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === "rtl";
  const isHebrew = lang === "he" || lang === "yi";

  // Pick one slide at random on mount and keep it for this page load.
  const [slide] = useState(() => Math.floor(Math.random() * SLIDES.length));

  const copy = isHebrew
    ? {
        title1: "המסע שלהם.",
        title2: "הסיפור שלהם -",
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
        title2: "Their story -",
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
        {/* Background — the children, the book and the meadow are identical in every
            frame; ONLY the book's page art changes, so a soft crossfade reads as the
            page gently dissolving to the next story. Mirrored for LTR so the copy
            sits opposite the book. */}
        {/* Desktop: wide image (kids+book on one side, copy space the other), mirrored for LTR. */}
        <div className="hidden lg:block absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ transform: isRtl ? undefined : "scaleX(-1)" }}>
            <img
              src={SLIDES[slide].img}
              alt="Two children with their personalized Torah storybook"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center bottom" }}
              width={3840}
              height={2160}
              loading="eager"
            />
          </div>
        </div>
        {/* Mobile/tablet: a single portrait image (same random slide as desktop). */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <img
            src={SLIDES[slide].imgM}
            alt="Two children with their personalized Torah storybook"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center bottom" }}
            width={2160}
            height={3840}
            loading="eager"
          />
        </div>

        {/* Readability scrim: strong cream fade behind the copy side, plus a soft
            top/bottom wash on mobile where the copy sits over the image. */}
        <div
          className={`hidden lg:block pointer-events-none absolute inset-y-0 ${isRtl ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-[62%] from-[hsl(42_60%_96%)] via-[hsl(42_60%_96%)]/96 to-transparent z-[1]`}
        />
        <div className="lg:hidden pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[hsl(42_60%_96%)]/97 via-[hsl(42_60%_96%)]/80 to-transparent" />

        <div className="container relative z-10 pt-28 lg:pt-32 pb-8 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[6fr_5fr] gap-4 lg:gap-6 items-start lg:items-center min-h-[132vw] sm:min-h-[92vw] lg:min-h-[600px]">
            {/* copy */}
            <div className={`relative z-10 ${isRtl ? "text-right" : "text-left"}`}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                className="font-heading font-bold leading-[1.05] tracking-tight text-foreground text-[2.25rem] sm:text-5xl lg:text-[4.25rem]"
              >
                <span className="block">{copy.title1}</span>
                <span className="block">{copy.title2}</span>
                {/* Story line — a deep amber gold so it stays legible over the warm background. */}
                <span
                  className="block italic [filter:drop-shadow(0_1px_1px_hsl(36_70%_18%/0.4))]"
                  style={{
                    background: "linear-gradient(180deg, hsl(38 92% 46%), hsl(28 88% 34%))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {storyLine}
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
            </div>

            <div className="hidden lg:block lg:min-h-[600px]" />
          </div>
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
                <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground leading-tight">{copy.trustHeading}</h3>
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
