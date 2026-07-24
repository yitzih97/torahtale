import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Heart, Gift, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// Single fixed hero image (the "as the world is created" scene) — no rotation,
// no random per-load switch, so it caches and the title stays constant.
import heroDesktop from "@/assets/hero-desktop-3.jpg";
import heroMobile from "@/assets/hero-m-3.jpg";
import reviewer1 from "@/assets/avatars/reviewer1.jpg";
import reviewer2 from "@/assets/avatars/reviewer2.jpg";
import reviewer3 from "@/assets/avatars/reviewer3.jpg";

const ease = [0.16, 1, 0.3, 1];

interface HeroSectionProps {
  onStart: () => void;
}

const getHeroCopy = (isHebrew: boolean) =>
  isHebrew
    ? {
        title1: "סיפורי תורה,",
        title2: "בכיכוב הילדים שלכם",
        description:
          "יוצרים ספרים מותאמים אישית שמחזירים לחיים סיפורי תורה וסיפורים חינוכיים — בכיכוב הילד שלכם",
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
        title1: "Torah Stories,",
        title2: "Starring Your Kids",
        description:
          "Create personalized books that bring Torah & Educational stories to life - starring your child",
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
          { quote: "Our son feels like the star of the story—and it brings Torah values to life in such a beautiful way.", name: "Avi M.", location: "Toronto, Canada", avatar: reviewer3 },
        ],
        trustBar: [
          { icon: ShieldCheck, label: "Safe & Age Appropriate" },
          { icon: Award, label: "Trusted by Families Worldwide" },
          { icon: Lock, label: "Secure & Private" },
        ],
      };

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { dir, lang } = useLanguage();
  const isRtl = dir === "rtl";
  const isHebrew = lang === "he" || lang === "yi";
  const copy = getHeroCopy(isHebrew);

  return (
    <>
      <section className="relative overflow-hidden bg-[hsl(42_60%_96%)]" dir={dir}>
        {/* Hero visual wrapper — keeps the background images above the opaque trust bar
            so the book at the bottom of the image is never covered by it. */}
        <div className="relative overflow-hidden">
        {/* Desktop: a wide render of the same scene, FULL-BLEED across the whole
            hero. Painted with the kids on one third and open meadow on the rest,
            mirrored for LTR so the subjects land opposite the copy. */}
        <div className="hidden lg:block absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ transform: isRtl ? undefined : "scaleX(-1)" }}>
            <img
              src={heroDesktop}
              alt="Two children with their personalized Torah storybook"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 72%" }}
              width={2688}
              height={1500}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
        {/* Mobile/tablet: a single portrait image. */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <img
            src={heroMobile}
            alt="Two children with their personalized Torah storybook"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center bottom" }}
            width={2294}
            height={4096}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Readability scrim: strong cream fade behind the copy side, plus a soft
            top/bottom wash on mobile where the copy sits over the image. */}
        <div
          className={`hidden lg:block pointer-events-none absolute inset-y-0 ${isRtl ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-[66%] from-[hsl(42_60%_96%)] from-[12%] via-[hsl(42_60%_96%)]/94 via-[52%] to-transparent z-[1]`}
        />
        {/* Mobile scrim — near-solid cream behind the whole copy+CTA block (top ~55%),
            fading out only below it so the text passes WCAG AA over the busy photo. */}
        <div className="lg:hidden pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[hsl(42_60%_96%)] from-[18%] via-[hsl(42_60%_96%)]/88 via-[42%] to-transparent to-[62%]" />

        <div className="container relative z-10 pt-24 sm:pt-28 lg:pt-32 pb-8 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[6fr_5fr] gap-4 lg:gap-6 items-start lg:items-center min-h-[142vw] sm:min-h-[92vw] lg:min-h-[600px]">
            {/* copy */}
            <div className={`relative z-10 ${isRtl ? "text-right" : "text-left"}`}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                style={{ fontFamily: '"TorahTaleTitle", "Playfair Display", serif' }}
                className="font-medium leading-[1.12] tracking-[-0.01em] text-foreground text-[2.5rem] sm:text-6xl lg:text-[4.75rem]"
              >
                <span className="block">{copy.title1}</span>
                {/* Emphasis line — a deep amber gold so it stays legible over the warm background. */}
                {/* pb/-mb pair extends the paint box below the baseline so the
                    "g" descender isn't clipped by backgroundClip: text. */}
                <span className="block italic font-normal pb-[0.18em] -mb-[0.18em] gold-shine-text [filter:drop-shadow(0_1px_2px_hsl(36_70%_15%/0.55))]">
                  {copy.title2}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease }}
                className="mt-3 sm:mt-6 text-sm sm:text-lg text-foreground/90 sm:text-foreground/70 max-w-lg leading-relaxed [text-shadow:0_1px_0_hsl(42_60%_96%/0.9),0_0_12px_hsl(42_60%_96%/0.8)]"
              >
                {copy.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
                className={`mt-4 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start ${isRtl ? "lg:justify-end" : "lg:justify-start"}`}
              >
                <Button
                  variant="gold"
                  size="xl"
                  onClick={onStart}
                  className="group rounded-full w-full max-w-sm sm:max-w-none sm:w-auto px-7 gap-1.5 shadow-lg shadow-[hsl(30_70%_20%/0.35)] ring-1 ring-white/50 text-[hsl(36_60%_10%)] gold-shine-bg hover:brightness-105"
                >
                  {copy.primaryCta}
                  <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                </Button>
              </motion.div>
            </div>

            <div className="hidden lg:block lg:min-h-[600px]" />
          </div>
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
    </>
  );
};

/** "Loved by families" testimonials strip — rendered on the homepage below the
    Collections section (it used to sit directly under the hero). */
export const HeroTestimonialsStrip = () => {
  const { dir, lang } = useLanguage();
  const isRtl = dir === "rtl";
  const isHebrew = lang === "he" || lang === "yi";
  const copy = getHeroCopy(isHebrew);

  return (
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
  );
};
