import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Search, BookOpen, Truck, CreditCard, Palette, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const categoryIcons: Record<string, React.ElementType> = {
  general: HelpCircle,
  orders: Truck,
  books: BookOpen,
  billing: CreditCard,
  customization: Palette,
  returns: RotateCcw,
};

const FAQ = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === "he";
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const categories = t.faq.categories;
  const items = t.faq.items;

  const filteredItems = items.filter((item: { question: string; answer: string; category: string }) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !search.trim() ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <Navbar />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingOrb(0, "-left-40", "top-1/4", "w-[500px] h-[500px]", "bg-accent/20")}
        {floatingOrb(3, "-right-40", "top-1/3", "w-[400px] h-[400px]", "bg-primary/15")}
        {floatingOrb(5, "left-1/3", "bottom-0", "w-[600px] h-[300px]", "bg-accent/10")}
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-accent font-semibold tracking-[0.15em] uppercase text-xs mb-5"
          >
            {t.faq.label}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t.faq.title}
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-light"
          >
            {t.faq.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Search */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="container max-w-2xl mx-auto px-6 mb-10"
      >
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
          <Input
            placeholder={t.faq.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 ps-12 pe-6 rounded-2xl bg-card/60 backdrop-blur-xl border-border/30 text-base placeholder:text-muted-foreground/50 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
          />
        </div>
      </motion.section>

      {/* Category pills */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="container max-w-3xl mx-auto px-6 mb-14"
      >
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === "all"
                ? "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
                : "bg-card/60 backdrop-blur-xl border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
            }`}
          >
            {t.faq.allCategories}
          </button>
          {categories.map((cat: { key: string; label: string }) => {
            const Icon = categoryIcons[cat.key] || HelpCircle;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.key
                    ? "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
                    : "bg-card/60 backdrop-blur-xl border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* FAQ Items */}
      <section className="container max-w-2xl mx-auto px-6 pb-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item: { question: string; answer: string; category: string }, idx: number) => {
              const key = `${item.category}-${idx}`;
              const isOpen = openIndex === key;
              const CatIcon = categoryIcons[item.category] || HelpCircle;

              return (
                <motion.div
                  key={key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    className={`w-full text-start p-6 rounded-2xl transition-all duration-300 ${
                      isOpen
                        ? "bg-card/80 backdrop-blur-2xl border border-accent/20 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]"
                        : "bg-card/50 backdrop-blur-xl border border-border/20 hover:border-border/40 hover:bg-card/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                        isOpen ? "bg-accent/15" : "bg-muted/50"
                      }`}>
                        <CatIcon className={`w-4.5 h-4.5 transition-colors duration-300 ${isOpen ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className={`text-base font-semibold leading-snug transition-colors duration-300 ${isOpen ? "text-foreground" : "text-foreground/90"}`}>
                            {item.question}
                          </h3>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-shrink-0"
                          >
                            <ChevronDown className={`w-5 h-5 transition-colors duration-300 ${isOpen ? "text-accent" : "text-muted-foreground"}`} />
                          </motion.div>
                        </div>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <p className="mt-4 text-muted-foreground leading-relaxed text-[0.938rem]">
                                {item.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-lg">{t.faq.noResults}</p>
            </motion.div>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
