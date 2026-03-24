import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BookPreviewModal } from "@/components/gallery/BookPreviewModal";

// Covers
import s1Cover from "@/assets/gallery/s1-cover.jpg";
import s2Cover from "@/assets/gallery/s2-cover.jpg";
import s3Cover from "@/assets/gallery/s3-cover.jpg";
import s4Cover from "@/assets/gallery/s4-cover.jpg";
import s5Cover from "@/assets/gallery/s5-cover.jpg";
import s6Cover from "@/assets/gallery/s6-cover.jpg";
import s7Cover from "@/assets/gallery/s7-cover.jpg";
import s8Cover from "@/assets/gallery/s8-cover.jpg";
import s9Cover from "@/assets/gallery/s9-cover.jpg";
import s10Cover from "@/assets/gallery/s10-cover.jpg";

// Interior pages
import s1p1 from "@/assets/gallery/s1-p1.jpg";
import s1p2 from "@/assets/gallery/s1-p2.jpg";
import s2p1 from "@/assets/gallery/s2-p1.jpg";
import s2p2 from "@/assets/gallery/s2-p2.jpg";
import s3p1 from "@/assets/gallery/s3-p1.jpg";
import s3p2 from "@/assets/gallery/s3-p2.jpg";
import s4p1 from "@/assets/gallery/s4-p1.jpg";
import s4p2 from "@/assets/gallery/s4-p2.jpg";
import s5p1 from "@/assets/gallery/s5-p1.jpg";
import s5p2 from "@/assets/gallery/s5-p2.jpg";
import s6p1 from "@/assets/gallery/s6-p1.jpg";
import s6p2 from "@/assets/gallery/s6-p2.jpg";
import s7p1 from "@/assets/gallery/s7-p1.jpg";
import s7p2 from "@/assets/gallery/s7-p2.jpg";
import s8p1 from "@/assets/gallery/s8-p1.jpg";
import s8p2 from "@/assets/gallery/s8-p2.jpg";
import s9p1 from "@/assets/gallery/s9-p1.jpg";
import s9p2 from "@/assets/gallery/s9-p2.jpg";
import s10p1 from "@/assets/gallery/s10-p1.jpg";
import s10p2 from "@/assets/gallery/s10-p2.jpg";

// Back covers
import s1Back from "@/assets/gallery/s1-back.jpg";
import s2Back from "@/assets/gallery/s2-back.jpg";
import s3Back from "@/assets/gallery/s3-back.jpg";
import s4Back from "@/assets/gallery/s4-back.jpg";
import s5Back from "@/assets/gallery/s5-back.jpg";
import s6Back from "@/assets/gallery/s6-back.jpg";
import s7Back from "@/assets/gallery/s7-back.jpg";
import s8Back from "@/assets/gallery/s8-back.jpg";
import s9Back from "@/assets/gallery/s9-back.jpg";
import s10Back from "@/assets/gallery/s10-back.jpg";

const ease = [0.16, 1, 0.3, 1];

const stories = [
  {
    title: "The Wonders of Gan Eden",
    portion: "Parashas Bereishis",
    child: "Rivka",
    coverImage: s1Cover,
    pages: [s1p1, s1p2],
    backCoverImage: s1Back,
    review: "My daughter couldn't stop talking about Gan Eden! She felt like she was really there walking with Adam and Chava.",
    reviewer: "Talia B.",
    location: "Brooklyn, NY",
    rating: 5,
    questions: [
      "What was Rivka's favorite part of Gan Eden?",
      "Why did Hashem create such a beautiful garden?",
      "What animals did Rivka meet in the garden?",
      "What did Rivka learn under the Tree of Life?",
      "Why is it important to take care of nature?",
      "How did Rivka feel when she first saw the garden?",
      "What does Gan Eden teach us about Hashem's kindness?",
      "If you could visit Gan Eden, what would you do first?",
      "Why does every creation have a special purpose?",
      "What is one way you can help take care of the world today?",
    ],
  },
  {
    title: "Noach's Incredible Teivah",
    portion: "Parashas Noach",
    child: "Yehuda",
    coverImage: s2Cover,
    pages: [s2p1, s2p2],
    backCoverImage: s2Back,
    review: "The animals, the teivah, the keshet — every detail was perfect. Our boys read it every Shabbos afternoon.",
    reviewer: "Avi R.",
    location: "Lakewood, NJ",
    rating: 5,
    questions: [
      "Why did Hashem ask Noach to build a teivah?",
      "How did Yehuda help the animals on the ark?",
      "What did the rainbow mean after the flood?",
      "Why did Noach listen to Hashem even when others didn't?",
      "How many of each animal came onto the teivah?",
      "What lesson can we learn from Noach's faith?",
      "How did the dove help Noach know the water was gone?",
      "What does the keshet remind us about Hashem's promise?",
      "Why is it important to be kind to animals?",
      "What would you bring on the teivah if you were Yehuda?",
    ],
  },
  {
    title: "The Tower That Fell",
    portion: "Parashas Noach",
    child: "Chaya",
    coverImage: s3Cover,
    pages: [s3p1, s3p2],
    backCoverImage: s3Back,
    review: "Such a creative way to teach about achdus. My son finally understood why the dor haflagah was punished.",
    reviewer: "Racheli K.",
    location: "Monsey, NY",
    rating: 5,
    questions: [
      "Why did the people want to build a tower to the sky?",
      "What happened when Hashem mixed their languages?",
      "What did Chaya learn about working together?",
      "Why is it wrong to try to be greater than Hashem?",
      "How did the people feel when they couldn't understand each other?",
      "What does achdus (unity) mean to you?",
      "Why is kindness more important than being powerful?",
      "What happened to the tower in the end?",
      "How can we work together with kindness every day?",
      "What would you say to the builders if you were Chaya?",
    ],
  },
  {
    title: "Avraham Counts the Stars",
    portion: "Parashas Lech Lecha",
    child: "Shmuel",
    coverImage: s4Cover,
    pages: [s4p1, s4p2],
    backCoverImage: s4Back,
    review: "The night sky illustration took our breath away. Our daughter asks to read this one every single night.",
    reviewer: "Shira G.",
    location: "Passaic, NJ",
    rating: 5,
    questions: [
      "What did Avraham promise Shmuel about the stars?",
      "Why did Hashem compare the Jewish people to stars?",
      "What is the mitzvah of hachnasas orchim?",
      "How did Shmuel feel sitting by the campfire with Avraham?",
      "Why did Avraham leave his home when Hashem told him to?",
      "What makes Avraham such a special person in the Torah?",
      "How can we welcome guests like Avraham did?",
      "What did Shmuel learn about having faith?",
      "Why are the stars a sign of hope?",
      "What is one brave thing you could do to follow Hashem?",
    ],
  },
  {
    title: "Yosef's Coat of Colors",
    portion: "Parashas Vayeishev",
    child: "Esther",
    coverImage: s5Cover,
    pages: [s5p1, s5p2],
    backCoverImage: s5Back,
    review: "The colors are magnificent! My son wears his own 'Yosef coat' now while we read. Pure magic.",
    reviewer: "Devorah M.",
    location: "Crown Heights, NY",
    rating: 5,
    questions: [
      "Why was Yosef's coat so special?",
      "How did Yosef's brothers feel about the coat?",
      "What happened to Yosef after his brothers sold him?",
      "Why did Yosef forgive his brothers in the end?",
      "What does Esther learn about jealousy in this story?",
      "How did Yosef become a leader in Egypt?",
      "Why is forgiveness stronger than anger?",
      "What dreams did Yosef have?",
      "How can we show love to our siblings even when it's hard?",
      "What is one colorful thing that makes you feel special?",
    ],
  },
  {
    title: "Baby Moshe on the Nile",
    portion: "Parashas Shemos",
    child: "Ari",
    coverImage: s6Cover,
    pages: [s6p1, s6p2],
    backCoverImage: s6Back,
    review: "My kids were so moved by baby Moshe's story. The Egyptian scenery is absolutely breathtaking.",
    reviewer: "Miriam L.",
    location: "Flatbush, NY",
    rating: 5,
    questions: [
      "Why did Moshe's mother put him in a basket on the Nile?",
      "Who found baby Moshe in the river?",
      "What role did Miriam play in saving Moshe?",
      "How did Ari feel watching baby Moshe float on the water?",
      "Why did Hashem have a special plan for Moshe?",
      "What does it mean to have bitachon (trust) in Hashem?",
      "How did the princess take care of baby Moshe?",
      "Why is every child precious to Hashem?",
      "What brave thing did Moshe's mother do?",
      "If you found a baby in a basket, what would you do?",
    ],
  },
  {
    title: "Krias Yam Suf",
    portion: "Parashas Beshalach",
    child: "Devorah",
    coverImage: s7Cover,
    pages: [s7p1, s7p2],
    backCoverImage: s7Back,
    review: "Walking through the split sea with Moshe Rabbeinu — my children were mesmerized. A masterpiece.",
    reviewer: "Yosef C.",
    location: "Far Rockaway, NY",
    rating: 5,
    questions: [
      "How did Devorah feel walking between the walls of water?",
      "Why did Hashem split the sea for the Jewish people?",
      "What did they see inside the walls of water?",
      "How did everyone celebrate after crossing the sea?",
      "What instrument did Miriam play during the celebration?",
      "Why is it important to thank Hashem for miracles?",
      "What does trust in Hashem mean to you?",
      "How did the Jewish people feel before the sea split?",
      "What is the Shiras HaYam?",
      "What is one miracle in your life you are thankful for?",
    ],
  },
  {
    title: "Matan Torah on Har Sinai",
    portion: "Parashas Yisro",
    child: "Moshe",
    coverImage: s8Cover,
    pages: [s8p1, s8p2],
    backCoverImage: s8Back,
    review: "The lightning, the luchos, the shofar — every detail brings Matan Torah alive. Truly special.",
    reviewer: "Chana S.",
    location: "Boro Park, NY",
    rating: 5,
    questions: [
      "What happened at Har Sinai when Hashem spoke?",
      "What are the Aseres HaDibros (Ten Commandments)?",
      "How did Moshe feel standing at the foot of the mountain?",
      "Why did the mountain shake and the shofar sound?",
      "What is the Torah and why is it the greatest gift?",
      "How do we keep the Torah alive today?",
      "Why did the Jewish people say 'Naaseh V'Nishma'?",
      "What does it mean to accept the Torah with love?",
      "How can you learn Torah every day?",
      "What is your favorite mitzvah from the Torah?",
    ],
  },
  {
    title: "Dovid and Golyas",
    portion: "Sefer Shmuel",
    child: "Dovid",
    coverImage: s9Cover,
    pages: [s9p1, s9p2],
    backCoverImage: s9Back,
    review: "My son carries this book everywhere. Dovid's bitachon in Hashem made a lasting impression on him.",
    reviewer: "Menachem F.",
    location: "Baltimore, MD",
    rating: 5,
    questions: [
      "Why was everyone afraid of Golyas?",
      "How did Dovid prepare to fight the giant?",
      "What did Dovid whisper before using his sling?",
      "Why did Dovid trust Hashem instead of wearing armor?",
      "What happened when the stone hit Golyas?",
      "What does it mean that the smallest can do the greatest things?",
      "How can you show bitachon in Hashem in your daily life?",
      "Why did the soldiers cheer for Dovid?",
      "What makes a true hero?",
      "What is something brave you would like to do?",
    ],
  },
  {
    title: "Yonah and the Great Dag",
    portion: "Sefer Yonah",
    child: "Noa",
    coverImage: s10Cover,
    pages: [s10p1, s10p2],
    backCoverImage: s10Back,
    review: "We read this before Yom Kippur and my daughter finally understood the message of teshuvah. Beautiful.",
    reviewer: "Leah W.",
    location: "Chicago, IL",
    rating: 5,
    questions: [
      "Why did Yonah try to run away from Hashem?",
      "What happened to Yonah when he was on the boat?",
      "How did Noa feel inside the great fish?",
      "What did Yonah pray for inside the dag?",
      "Why did the people of Nineveh do teshuvah?",
      "What does teshuvah mean?",
      "Why is it never too late to say sorry?",
      "How did Noa learn about forgiveness from this story?",
      "What can we learn from Yonah about listening to Hashem?",
      "What is one thing you would like to change about yourself?",
    ],
  },
];

export const GalleryReviewsSection = () => {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);

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
              onClick={() => setSelectedBook(i)}
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden relative border border-border hover:border-accent/40 transition-all duration-500 hover:shadow-[0_8px_30px_hsl(var(--accent)/0.15)]">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-3 pt-10">
                  <h3 className="font-display text-xs lg:text-sm font-semibold text-foreground leading-tight">{story.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{story.portion}</p>
                </div>
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-semibold text-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    Preview Book
                  </span>
                </div>
              </div>

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

      <BookPreviewModal
        book={book}
        open={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
      />
    </section>
  );
};
