import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import gardenEden from "@/assets/torah-garden-eden.jpg";
import noahPage1 from "@/assets/noah-page1.jpg";
import towerBabel from "@/assets/torah-tower-babel.jpg";
import abrahamStars from "@/assets/torah-abraham-stars.jpg";
import josephCoat from "@/assets/torah-joseph-coat.jpg";
import mosesBasket from "@/assets/torah-moses-basket.jpg";
import redSea from "@/assets/torah-red-sea.jpg";
import tenCommandments from "@/assets/torah-ten-commandments.jpg";
import davidGoliath from "@/assets/torah-david-goliath.jpg";
import jonahWhale from "@/assets/torah-jonah-whale.jpg";

const ease = [0.16, 1, 0.3, 1];

const stories = [
  {
    title: "The Wonders of Gan Eden",
    portion: "Parashas Bereishis",
    image: gardenEden,
    review: "My daughter couldn't stop talking about Gan Eden! She felt like she was really there walking with Adam and Chava.",
    reviewer: "Talia B.",
    location: "Brooklyn, NY",
    rating: 5,
    pages: [gardenEden, noahPage1, gardenEden],
  },
  {
    title: "Noach's Incredible Teivah",
    portion: "Parashas Noach",
    image: noahPage1,
    review: "The animals, the teivah, the keshet — every detail was perfect. Our boys read it every Shabbos afternoon.",
    reviewer: "Avi R.",
    location: "Lakewood, NJ",
    rating: 5,
    pages: [noahPage1, gardenEden, noahPage1],
  },
  {
    title: "The Tower That Fell",
    portion: "Parashas Noach",
    image: towerBabel,
    review: "Such a creative way to teach about achdus. My son finally understood why the dor haflagah was punished.",
    reviewer: "Racheli K.",
    location: "Monsey, NY",
    rating: 5,
    pages: [towerBabel, noahPage1, towerBabel],
  },
  {
    title: "Avraham Counts the Stars",
    portion: "Parashas Lech Lecha",
    image: abrahamStars,
    review: "The night sky illustration took our breath away. Our daughter asks to read this one every single night.",
    reviewer: "Shira G.",
    location: "Passaic, NJ",
    rating: 5,
    pages: [abrahamStars, gardenEden, abrahamStars],
  },
  {
    title: "Yosef's Coat of Colors",
    portion: "Parashas Vayeishev",
    image: josephCoat,
    review: "The colors are magnificent! My son wears his own 'Yosef coat' now while we read. Pure magic.",
    reviewer: "Devorah M.",
    location: "Crown Heights, NY",
    rating: 5,
    pages: [josephCoat, abrahamStars, josephCoat],
  },
  {
    title: "Baby Moshe on the Nile",
    portion: "Parashas Shemos",
    image: mosesBasket,
    review: "My kids were so moved by baby Moshe's story. The Egyptian scenery is absolutely breathtaking.",
    reviewer: "Miriam L.",
    location: "Flatbush, NY",
    rating: 5,
    pages: [mosesBasket, josephCoat, mosesBasket],
  },
  {
    title: "Krias Yam Suf",
    portion: "Parashas Beshalach",
    image: redSea,
    review: "Walking through the split sea with Moshe Rabbeinu — my children were mesmerized. A masterpiece.",
    reviewer: "Yosef C.",
    location: "Far Rockaway, NY",
    rating: 5,
    pages: [redSea, mosesBasket, redSea],
  },
  {
    title: "Matan Torah on Har Sinai",
    portion: "Parashas Yisro",
    image: tenCommandments,
    review: "The lightning, the luchos, the shofar — every detail brings Matan Torah alive. Truly special.",
    reviewer: "Chana S.",
    location: "Boro Park, NY",
    rating: 5,
    pages: [tenCommandments, redSea, tenCommandments],
  },
  {
    title: "Dovid and Golyas",
    portion: "Sefer Shmuel",
    image: davidGoliath,
    review: "My son carries this book everywhere. Dovid's bitachon in Hashem made a lasting impression on him.",
    reviewer: "Menachem F.",
    location: "Baltimore, MD",
    rating: 5,
    pages: [davidGoliath, tenCommandments, davidGoliath],
  },
  {
    title: "Yonah and the Great Dag",
    portion: "Sefer Yonah",
    image: jonahWhale,
    review: "We read this before Yom Kippur and my daughter finally understood the message of teshuvah. Beautiful.",
    reviewer: "Leah W.",
    location: "Chicago, IL",
    rating: 5,
    pages: [jonahWhale, davidGoliath, jonahWhale],
  },
];

export const GalleryReviewsSection = () => {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [previewPage, setPreviewPage] = useState(0);

  const openBook = (index: number) => {
    setSelectedBook(index);
    setPreviewPage(0);
  };

  const book = selectedBook !== null ? stories[selectedBook] : null;

  return (
    <section id="gallery" className="py-24 lg:py-32 bg-card">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">Gallery & Reviews</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Stories Loved by
            <br />
            <span className="text-accent">Frum Families Everywhere</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed font-body">
            Each sefer is AI-generated with stunning illustrations unique to your child. Click any story to preview the book.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {stories.map((story, i) => (
            <motion.div
              key={story.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className="group cursor-pointer"
              onClick={() => openBook(i)}
            >
              {/* Book cover */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden relative border border-border hover:border-accent/40 transition-all duration-500 hover:shadow-[0_8px_30px_hsl(var(--accent)/0.15)]">
                <img
                  src={story.image}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Title overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-3 pt-10">
                  <h3 className="font-display text-xs lg:text-sm font-semibold text-foreground leading-tight">{story.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{story.portion}</p>
                </div>
                {/* Hover preview indicator */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-semibold text-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    Preview Book
                  </span>
                </div>
              </div>

              {/* Review snippet below */}
              <div className="mt-3 px-1">
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: story.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 font-body">
                  "{story.review}"
                </p>
                <p className="text-[10px] text-accent mt-1 font-medium">
                  — {story.reviewer}, {story.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Book Preview Modal */}
      <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-3xl p-0 bg-card border-border overflow-hidden rounded-3xl">
          {book && (
            <div className="flex flex-col">
              {/* Book image */}
              <div className="relative aspect-[16/10] bg-background">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={previewPage}
                    src={book.pages[previewPage]}
                    alt={`${book.title} page ${previewPage + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease }}
                  />
                </AnimatePresence>

                {/* Page navigation */}
                {book.pages.length > 1 && (
                  <>
                    <button
                      onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                      disabled={previewPage === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPreviewPage(Math.min(book.pages.length - 1, previewPage + 1))}
                      disabled={previewPage === book.pages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Page dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {book.pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewPage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === previewPage ? "bg-accent w-5" : "bg-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Book info + review */}
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.portion}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: book.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-secondary/50 border border-border">
                  <Quote className="w-5 h-5 text-accent/30 mb-2" />
                  <p className="text-foreground/80 font-body text-sm leading-relaxed">"{book.review}"</p>
                  <p className="text-xs text-accent font-medium mt-3">
                    — {book.reviewer}, {book.location}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
