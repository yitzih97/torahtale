import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { BookOpen, Star } from "lucide-react";
import heroBook from "@/assets/hero-book.png";
import samplePage from "@/assets/sample-page.png";

const GalleryScene = lazy(() =>
  import("@/components/3d/GalleryScene").then((m) => ({ default: m.GalleryScene }))
);

const ease = [0.16, 1, 0.3, 1];

const books = [
  { title: "Noah's Incredible Ark", portion: "Parashat Noach", style: "Cartoon", image: heroBook },
  { title: "Miriam Crosses the Sea", portion: "Parashat Beshalach", style: "3D Pixar", image: samplePage },
  { title: "The Garden of Wonders", portion: "Parashat Bereishit", style: "Graphic Novel", image: heroBook },
];

export const GallerySection = () => (
  <section className="relative py-28 lg:py-40 bg-primary overflow-hidden">
    {/* 3D scene */}
    <div className="absolute right-0 top-0 w-1/2 h-full z-0 opacity-40">
      <Suspense fallback={null}>
        <GalleryScene />
      </Suspense>
    </div>
    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-primary via-primary/80 to-transparent" />

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="mb-16"
      >
        <span className="font-mono text-xs tracking-widest text-accent uppercase block mb-4">
          Gallery
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground leading-tight max-w-lg" style={{ lineHeight: "1.1" }}>
          Stories Already Loved by Families
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book, i) => (
          <motion.div
            key={book.title}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease }}
            className="group relative rounded-2xl overflow-hidden bg-primary-foreground/5 border border-primary-foreground/10 hover:border-accent/30 transition-all duration-500"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-primary-foreground">{book.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-primary-foreground/50 font-mono">{book.portion}</span>
                <span className="text-xs text-accent font-medium">{book.style}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
