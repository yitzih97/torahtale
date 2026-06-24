import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookOpen, Heart, Gift, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import heroSceneDesktop from "@/assets/hero-scene-desktop.jpg";
import heroMobileAsset from "@/assets/hero-mobile.png";
import heroTabletAsset from "@/assets/hero-tablet.png";
import reviewer1 from "@/assets/avatars/reviewer1.jpg";
import reviewer2 from "@/assets/avatars/reviewer2.jpg";
import reviewer3 from "@/assets/avatars/reviewer3.jpg";

const ease = [0.16, 1, 0.3, 1];

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === "rtl";

  const copy = lang === "he" || lang === "yi"
    ? {
        badge: "ספרי תורה אישיים — בכיכוב הילד שלכם",
        title1: "המסע שלהם.",
        title2: "הסיפור שלהם.",
        titleAccent: "מושרש בתורה.",
        description: "אנחנו יוצרים ספרים אישיים שמחזירים את סיפורי התורה לחיים — כשהילד שלכם הוא גיבור הסיפור, וכל עמוד מנחיל ערכים שנשארים לכל החיים.",
        primaryCta: "צרו את הסיפור של ילדכם",
        watchCta: "ככה זה עובד",
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
        badge: "Personalized Torah Books for Your Child",
        title1: "Their journey.",
        title2: "Their story.",
        titleAccent: "Rooted in Torah.",
        description: "We create personalized books that bring Torah stories to life—starring your child, instilling values that inspire a lifetime.",
        primaryCta: "Start Your Child's Story",
        watchCta: "Watch How It Works",
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

  return (
    <>
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(42 60% 96%) 0%, hsl(38 50% 94%) 60%, hsl(36 45% 92%) 100%)",
      }}
      dir={dir}
    >
      {/* Hero scene image as background — desktop only; kids anchored to the side, text on cream */}
      <img
        src={heroSceneDesktop}
        alt="Two Jewish children with their personalized Torah storybook"
        className="hidden lg:block pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: isRtl ? "left top" : "right top",
          transform: isRtl ? "scaleX(-1)" : undefined,
        }}
        width={1536}
        height={1024}
        fetchPriority="high"
      />
      {/* Soft fade from cream into the image so text stays readable (desktop only) */}
      <div
        className={`hidden lg:block pointer-events-none absolute inset-y-0 ${isRtl ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-[55%] from-[hsl(42_60%_96%)] via-[hsl(42_60%_96%)/0.92] to-transparent z-[1]`}
      />

      {/* Mobile/tablet hero background — full image with kids + book */}
      <picture>
        <source media="(min-width: 640px) and (max-width: 1023px)" srcSet={heroTabletAsset} />
        <img
          src={heroMobileAsset}
          alt=""
          aria-hidden="true"
          className="lg:hidden pointer-events-none select-none absolute inset-x-0 top-0 w-full h-auto"
          loading="eager"
          fetchPriority="high"
        />
      </picture>


      <div className="container relative z-10 pt-28 sm:pt-28 lg:pt-32 pb-8 lg:pb-16">
        <div className="relative grid grid-cols-1 lg:grid-cols-[6fr_5fr] gap-4 lg:gap-6 items-start lg:items-center min-h-[178vw] sm:min-h-[132vw] lg:min-h-[640px]">

          {/* (Mobile/tablet hero illustration is rendered below the copy — see picture element after copy block) */}

          {/* LEFT — copy */}
          <div className={`relative z-10 ${isRtl ? "text-right" : "text-left"}`}>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="font-display font-bold leading-[1.05] tracking-tight text-foreground text-[2.25rem] sm:text-5xl lg:text-[4.5rem]"
            >
              <span className="block">{copy.title1}</span>
              <span className="block">{copy.title2}</span>
              <span className="block gold-text-gradient italic">{copy.titleAccent}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease }}
              className={`mt-4 sm:mt-6 text-sm sm:text-lg text-foreground/70 max-w-lg leading-relaxed`}
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
                className="group gold-glow rounded-xl w-full sm:w-auto px-7 max-sm:bg-accent/55 max-sm:backdrop-blur-md max-sm:shadow-[0_4px_20px_hsl(43_64%_52%/0.2)]"
              >
                {copy.primaryCta}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
              </Button>
            </motion.div>
          </div>

          {/* RIGHT — desktop only spacer (image is section bg on lg+) */}
          <div className="hidden lg:block lg:min-h-[640px]" />
        </div>




        {/* feature pills — full-width row below the hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease }}
          className="mt-8 lg:mt-12 rounded-2xl border border-foreground/8 bg-background/70 backdrop-blur px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center justify-around gap-x-6 gap-y-3"
        >
          {copy.features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <f.icon className="w-6 h-6 sm:w-7 sm:h-7 text-gold flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs sm:text-sm font-medium text-foreground/80 max-w-[8rem] leading-tight">
                {f.label}
              </span>
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
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
                {copy.trustHeading}
              </h3>
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
                  <img
                    src={tm.avatar}
                    alt={tm.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[hsl(var(--gold)/0.3)]"
                    width={48}
                    height={48}
                    loading="lazy"
                  />
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
