import { motion } from "framer-motion";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import storyNoach from "@/assets/story-noach.jpg";
import storyBeshalach from "@/assets/story-beshalach.jpg";
import storyBereishit from "@/assets/story-bereishit.jpg";

const ease = [0.16, 1, 0.3, 1];

const books = [
  {
    title: "Noach's Incredible Teivah",
    portion: "Parashas Noach",
    style: "3D Pixar",
    image: storyNoach,
    assetKey: "story-noach",
    description: "Join the animals two by two on the greatest adventure at sea — with a keshet of Hashem's promise waiting at the end.",
  },
  {
    title: "Krias Yam Suf",
    portion: "Parashas Beshalach",
    style: "3D Pixar",
    image: storyBeshalach,
    assetKey: "story-beshalach",
    description: "Walk between towering walls of water on a golden path to cheirus. Bnei Yisrael's emunah has never looked so beautiful.",
  },
  {
    title: "The Wonders of Gan Eden",
    portion: "Parashas Bereishis",
    style: "3D Pixar",
    image: storyBereishit,
    assetKey: "story-bereishit",
    description: "Explore Hashem's magnificent garden where every creature is a friend and golden light fills the air with wonder.",
  },
];

export const GallerySection = () => {
  const { getAssetUrl } = useSiteAssets();

  const resolvedBooks = books.map((book) => ({
    ...book,
    image: getAssetUrl(book.assetKey, book.image),
  }));

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
        <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">Real Examples</span>
        <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
          Seforim Already Loved
          <br />
          by Frum Families
        </h2>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed font-body">
          Each book is AI-generated with stunning Pixar-quality illustrations unique to your child.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {resolvedBooks.map((book, i) => (
          <motion.div
            key={book.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease }}
            className="group rounded-3xl overflow-hidden bg-secondary border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-500"
          >
            <div className="aspect-[3/4] overflow-hidden relative">
              <img
                src={book.image}
                alt={book.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                {book.style}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{book.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{book.portion}</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{book.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};
