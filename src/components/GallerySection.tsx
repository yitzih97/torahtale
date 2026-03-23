import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import storyNoach from "@/assets/story-noach.jpg";
import storyBeshalach from "@/assets/story-beshalach.jpg";
import storyBereishit from "@/assets/story-bereishit.jpg";

const GalleryScene = lazy(() =>
  import("@/components/3d/GalleryScene").then((m) => ({ default: m.GalleryScene }))
);

const ease = [0.16, 1, 0.3, 1];

const books = [
  {
    title: "Noach's Incredible Teivah",
    portion: "Parashas Noach",
    style: "3D Pixar",
    image: storyNoach,
    description: "Join the animals two by two on the greatest adventure at sea — with a keshet of Hashem's promise waiting at the end.",
  },
  {
    title: "Krias Yam Suf",
    portion: "Parashas Beshalach",
    style: "3D Pixar",
    image: storyBeshalach,
    description: "Walk between towering walls of water on a golden path to cheirus. Bnei Yisrael's emunah has never looked so beautiful.",
  },
  {
    title: "The Wonders of Gan Eden",
    portion: "Parashas Bereishis",
    style: "3D Pixar",
    image: storyBereishit,
    description: "Explore Hashem's magnificent garden where every creature is a friend and golden light fills the air with wonder.",
  },
];

export const GallerySection = () => (
  <section className="relative py-28 lg:py-40 bg-primary overflow-hidden">
    {/* 3D scene */}
    <div className="absolute right-0 top-0 w-1/2 h-full z-0 opacity-30">
      <Suspense fallback={null}>
        <GalleryScene />
      </Suspense>
    </div>
    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-primary via-primary/85 to-primary/40" />

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="mb-16"
      >
        <span className="font-mono text-xs tracking-widest text-accent uppercase block mb-4">
          Real Examples · 3D Pixar Style
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground leading-tight max-w-xl" style={{ lineHeight: "1.1" }}>
          Seforim Already Loved
          <br /> by Frum Families
        </h2>
        <p className="text-primary-foreground/50 mt-4 max-w-md leading-relaxed">
          Each sefer is AI-generated with stunning Pixar-quality illustrations unique to your child.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {books.map((book, i) => (
          <motion.div
            key={book.title}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: i * 0.15, ease }}
            className="group relative rounded-2xl overflow-hidden bg-primary-foreground/5 border border-primary-foreground/10 hover:border-accent/40 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(201,152,58,0.15)]"
          >
            <div className="aspect-[3/4] overflow-hidden relative">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent/90 text-xs font-semibold text-primary">
                {book.style}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-primary-foreground mb-1.5">{book.title}</h3>
              <p className="text-sm text-primary-foreground/40 font-mono mb-3">{book.portion}</p>
              <p className="text-sm text-primary-foreground/60 leading-relaxed">{book.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
