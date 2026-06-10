import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, BookOpen, Heart, Gift, Star, ShieldCheck, Award, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import heroSceneDesktop from "@/assets/hero-scene-desktop.jpg";
import heroKidsMobile from "@/assets/hero-kids-mobile.jpg";
import kid1 from "@/assets/avatars/kid1.jpg";
import kid2 from "@/assets/avatars/kid2.jpg";
import kid3 from "@/assets/avatars/kid3.jpg";

const ease = [0.16, 1, 0.3, 1];

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { t, dir, lang } = useLanguage();
  const scrollToHow = () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const isRtl = dir === "rtl";

  const copy = lang === "he" || lang === "yi"
    ? {
        badge: "ספרי תורה מותאמים אישית לילדכם",
        title1: "המסע שלהם.",
        title2: "הסיפור שלהם.",
        titleAccent: "מושרשים בתורה.",
        description: "אנו יוצרים ספרים מותאמים אישית שמחיים סיפורי תורה — עם ילדכם בתפקיד הראשי, ומנחילים ערכים לכל החיים.",
        primaryCta: "צרו את הספר של ילדכם",
        watchCta: "צפו איך זה עובד",
        features: [
          { icon: BookOpen, label: "תוכן יהודי 100%" },
          { icon: Heart, label: "נעשה באהבה" },
          { icon: Gift, label: "מתנה שיוקירו לתמיד" },
        ],
        trustHeading: "אהוב ע״י משפחות. נבחר ברחבי העולם.",
        rating: "4.9/5 מתוך 500+ ביקורות",
        testimonials: [
          { quote: "הדרך הכי יפה לחבר את הילדים שלנו לתורה. הם מבקשים את הספר שלהם בכל לילה!", name: "רבקי ומשה ש.", location: "ברוקלין, ניו יורק", avatar: kid1 },
          { quote: "האיכות מדהימה וההתאמה האישית מיוחדת מאוד. מתנה שילדינו יוקירו לנצח.", name: "חנה פ.", location: "לוס אנג׳לס", avatar: kid2 },
          { quote: "הבן שלנו מרגיש כמו הגיבור של הסיפור — וזה מביא את ערכי התורה לחיים בצורה כל כך יפה.", name: "אבי מ.", location: "טורונטו, קנדה", avatar: kid3 },
        ],
        trustBar: [
          { icon: ShieldCheck, label: "בטוח ומתאים לגיל" },
          { icon: Award, label: "מהימן ע״י משפחות בעולם" },
          { icon: Lock, label: "מאובטח ופרטי" },
        ],
      }
    : {
        badge: "Personalized Torah Books for Your Child",
        title1: "Their journey.",
        title2: "Their story.",
        titleAccent: "Rooted in Torah.",
        description: "We create personalized books that bring Torah stories to life—starring your child, instilling values that inspire a lifetime.",
        primaryCta: "Start Your Child's Book",
        watchCta: "Watch How It Works",
        features: [
          { icon: BookOpen, label: "100% Jewish Content" },
          { icon: Heart, label: "Made with Love" },
          { icon: Gift, label: "A Gift They'll Cherish" },
        ],
        trustHeading: "Loved by families. Trusted worldwide.",
        rating: "4.9/5 from 500+ reviews",
        testimonials: [
          { quote: "The most beautiful way to connect our kids to Torah. They ask for their book every night!", name: "Rivky & Moshe S.", location: "Brooklyn, NY", avatar: kid1 },
          { quote: "The quality is amazing and the personalization is beyond special. It's a gift our children will cherish forever.", name: "Chana F.", location: "Los Angeles, CA", avatar: kid2 },
          { quote: "Our son feels like the hero of the story—and it brings Torah values to life in such a beautiful way.", name: "Avi M.", location: "Toronto, Canada", avatar: kid3 },
        ],
        trustBar: [
          { icon: ShieldCheck, label: "Safe & Age Appropriate" },
          { icon: Award, label: "Trusted by Families Worldwide" },
          { icon: Lock, label: "Secure & Private" },
        ],
      };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(42 60% 96%) 0%, hsl(38 50% 94%) 60%, hsl(36 45% 92%) 100%)",
      }}
      dir={dir}
    >
      {/* Desktop: hero scene image as background, anchored right */}
      <img
        src={heroSceneDesktop}
        alt="Two Jewish children with their personalized Torah storybook"
        className="hidden lg:block pointer-events-none select-none absolute inset-y-0 right-0 h-full w-[70%] xl:w-[65%] object-cover object-left"
        style={isRtl ? { left: 0, right: "auto", transform: "scaleX(-1)" } : undefined}
        width={1536}
        height={1024}
        fetchPriority="high"
      />
      {/* Soft fade from cream into the image so text stays readable */}
      <div
        className={`hidden lg:block pointer-events-none absolute inset-y-0 ${isRtl ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-[55%] from-[hsl(42_60%_96%)] via-[hsl(42_60%_96%)/0.85] to-transparent z-[1]`}
      />

      <div className="container relative z-10 pt-28 lg:pt-32 pb-10 lg:pb-16">
        <div className="grid lg:grid-cols-[6fr_5fr] gap-10 lg:gap-6 items-center min-h-[640px]">
          {/* LEFT — copy */}
          <div className={`text-center ${isRtl ? "lg:text-right" : "lg:text-left"}`}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.08)] mb-6`}
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold-dark">{copy.badge}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="font-display font-bold leading-[1.02] tracking-tight text-foreground text-[2.5rem] sm:text-6xl lg:text-[4.5rem]"
            >
              <span className="block">{copy.title1}</span>
              <span className="block">{copy.title2}</span>
              <span className="block gold-text-gradient italic">{copy.titleAccent}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease }}
              className={`mt-6 text-base sm:text-lg text-foreground/70 max-w-lg leading-relaxed ${isRtl ? "lg:mr-0 mx-auto lg:ml-auto" : "lg:mx-0 mx-auto"}`}
            >
              {copy.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className={`mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 ${isRtl ? "lg:justify-end" : "lg:justify-start"} justify-center items-center`}
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

              <Button
                variant="outline"
                size="xl"
                onClick={scrollToHow}
                className="rounded-xl w-full sm:w-auto px-6 bg-background/80 backdrop-blur border-foreground/15 hover:border-gold hover:text-gold-dark"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--gold)/0.15)] text-gold">
                  <Play className="w-3 h-3 fill-current" />
                </span>
                {copy.watchCta}
              </Button>
            </motion.div>

            {/* feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease }}
              className={`mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 ${isRtl ? "lg:justify-end" : "lg:justify-start"} justify-center`}
            >
              {copy.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && <span className="hidden sm:block w-px h-8 bg-foreground/15" />}
                  <f.icon className="w-7 h-7 text-gold" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-foreground/80 max-w-[8rem] leading-tight">
                    {f.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — empty on desktop (image is in the background); mobile keeps an inline photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease }}
            className="relative w-full lg:hidden"
          >
            <img
              src={heroKidsMobile}
              alt="Two Jewish children in a sunlit meadow"
              className="w-full h-auto rounded-3xl object-cover"
              style={{ objectPosition: isRtl ? "left center" : "right center" }}
              width={1200}
              height={900}
              fetchPriority="high"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
          className="mt-20 lg:mt-28 rounded-2xl bg-background/70 backdrop-blur border border-foreground/8 shadow-sm px-6 sm:px-8 py-6 sm:py-8"
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
  );
};
