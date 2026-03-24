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

// Interior pages — Story 1
import s1p1 from "@/assets/gallery/s1-p1.jpg";
import s1p2 from "@/assets/gallery/s1-p2.jpg";
import s1p3 from "@/assets/gallery/s1-p3.jpg";
import s1p4 from "@/assets/gallery/s1-p4.jpg";
import s1p5 from "@/assets/gallery/s1-p5.jpg";
import s1p6 from "@/assets/gallery/s1-p6.jpg";
import s1p7 from "@/assets/gallery/s1-p7.jpg";
import s1p8 from "@/assets/gallery/s1-p8.jpg";
import s1p9 from "@/assets/gallery/s1-p9.jpg";
import s1p10 from "@/assets/gallery/s1-p10.jpg";

// Interior pages — Story 2
import s2p1 from "@/assets/gallery/s2-p1.jpg";
import s2p2 from "@/assets/gallery/s2-p2.jpg";
import s2p3 from "@/assets/gallery/s2-p3.jpg";
import s2p4 from "@/assets/gallery/s2-p4.jpg";
import s2p5 from "@/assets/gallery/s2-p5.jpg";
import s2p6 from "@/assets/gallery/s2-p6.jpg";
import s2p7 from "@/assets/gallery/s2-p7.jpg";
import s2p8 from "@/assets/gallery/s2-p8.jpg";
import s2p9 from "@/assets/gallery/s2-p9.jpg";
import s2p10 from "@/assets/gallery/s2-p10.jpg";

// Interior pages — Story 3
import s3p1 from "@/assets/gallery/s3-p1.jpg";
import s3p2 from "@/assets/gallery/s3-p2.jpg";
import s3p3 from "@/assets/gallery/s3-p3.jpg";
import s3p4 from "@/assets/gallery/s3-p4.jpg";
import s3p5 from "@/assets/gallery/s3-p5.jpg";
import s3p6 from "@/assets/gallery/s3-p6.jpg";
import s3p7 from "@/assets/gallery/s3-p7.jpg";
import s3p8 from "@/assets/gallery/s3-p8.jpg";
import s3p9 from "@/assets/gallery/s3-p9.jpg";
import s3p10 from "@/assets/gallery/s3-p10.jpg";

// Interior pages — Story 4
import s4p1 from "@/assets/gallery/s4-p1.jpg";
import s4p2 from "@/assets/gallery/s4-p2.jpg";
import s4p3 from "@/assets/gallery/s4-p3.jpg";
import s4p4 from "@/assets/gallery/s4-p4.jpg";
import s4p5 from "@/assets/gallery/s4-p5.jpg";
import s4p6 from "@/assets/gallery/s4-p6.jpg";
import s4p7 from "@/assets/gallery/s4-p7.jpg";
import s4p8 from "@/assets/gallery/s4-p8.jpg";
import s4p9 from "@/assets/gallery/s4-p9.jpg";
import s4p10 from "@/assets/gallery/s4-p10.jpg";

// Interior pages — Story 5
import s5p1 from "@/assets/gallery/s5-p1.jpg";
import s5p2 from "@/assets/gallery/s5-p2.jpg";
import s5p3 from "@/assets/gallery/s5-p3.jpg";
import s5p4 from "@/assets/gallery/s5-p4.jpg";
import s5p5 from "@/assets/gallery/s5-p5.jpg";
import s5p6 from "@/assets/gallery/s5-p6.jpg";
import s5p7 from "@/assets/gallery/s5-p7.jpg";
import s5p8 from "@/assets/gallery/s5-p8.jpg";
import s5p9 from "@/assets/gallery/s5-p9.jpg";
import s5p10 from "@/assets/gallery/s5-p10.jpg";

// Interior pages — Story 6
import s6p1 from "@/assets/gallery/s6-p1.jpg";
import s6p2 from "@/assets/gallery/s6-p2.jpg";
import s6p3 from "@/assets/gallery/s6-p3.jpg";
import s6p4 from "@/assets/gallery/s6-p4.jpg";
import s6p5 from "@/assets/gallery/s6-p5.jpg";
import s6p6 from "@/assets/gallery/s6-p6.jpg";
import s6p7 from "@/assets/gallery/s6-p7.jpg";
import s6p8 from "@/assets/gallery/s6-p8.jpg";
import s6p9 from "@/assets/gallery/s6-p9.jpg";
import s6p10 from "@/assets/gallery/s6-p10.jpg";

// Interior pages — Story 7
import s7p1 from "@/assets/gallery/s7-p1.jpg";
import s7p2 from "@/assets/gallery/s7-p2.jpg";
import s7p3 from "@/assets/gallery/s7-p3.jpg";
import s7p4 from "@/assets/gallery/s7-p4.jpg";
import s7p5 from "@/assets/gallery/s7-p5.jpg";
import s7p6 from "@/assets/gallery/s7-p6.jpg";
import s7p7 from "@/assets/gallery/s7-p7.jpg";
import s7p8 from "@/assets/gallery/s7-p8.jpg";
import s7p9 from "@/assets/gallery/s7-p9.jpg";
import s7p10 from "@/assets/gallery/s7-p10.jpg";

// Interior pages — Story 8
import s8p1 from "@/assets/gallery/s8-p1.jpg";
import s8p2 from "@/assets/gallery/s8-p2.jpg";
import s8p3 from "@/assets/gallery/s8-p3.jpg";
import s8p4 from "@/assets/gallery/s8-p4.jpg";
import s8p5 from "@/assets/gallery/s8-p5.jpg";
import s8p6 from "@/assets/gallery/s8-p6.jpg";
import s8p7 from "@/assets/gallery/s8-p7.jpg";
import s8p8 from "@/assets/gallery/s8-p8.jpg";
import s8p9 from "@/assets/gallery/s8-p9.jpg";
import s8p10 from "@/assets/gallery/s8-p10.jpg";

// Interior pages — Story 9
import s9p1 from "@/assets/gallery/s9-p1.jpg";
import s9p2 from "@/assets/gallery/s9-p2.jpg";
import s9p3 from "@/assets/gallery/s9-p3.jpg";
import s9p4 from "@/assets/gallery/s9-p4.jpg";
import s9p5 from "@/assets/gallery/s9-p5.jpg";
import s9p6 from "@/assets/gallery/s9-p6.jpg";
import s9p7 from "@/assets/gallery/s9-p7.jpg";
import s9p8 from "@/assets/gallery/s9-p8.jpg";
import s9p9 from "@/assets/gallery/s9-p9.jpg";
import s9p10 from "@/assets/gallery/s9-p10.jpg";

// Interior pages — Story 10
import s10p1 from "@/assets/gallery/s10-p1.jpg";
import s10p2 from "@/assets/gallery/s10-p2.jpg";
import s10p3 from "@/assets/gallery/s10-p3.jpg";
import s10p4 from "@/assets/gallery/s10-p4.jpg";
import s10p5 from "@/assets/gallery/s10-p5.jpg";
import s10p6 from "@/assets/gallery/s10-p6.jpg";
import s10p7 from "@/assets/gallery/s10-p7.jpg";
import s10p8 from "@/assets/gallery/s10-p8.jpg";
import s10p9 from "@/assets/gallery/s10-p9.jpg";
import s10p10 from "@/assets/gallery/s10-p10.jpg";

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
    pages: [s1p1, s1p2, s1p3, s1p4, s1p5, s1p6, s1p7, s1p8, s1p9, s1p10],
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
      "What did Adam name the animals in the garden?",
      "Why did Hashem give Adam and Chava a special rule to follow?",
      "How did Rivka feel when she had to leave the garden?",
      "What sounds did Rivka hear in Gan Eden?",
      "Why is the Shabbos connected to the creation story?",
      "What fruits grew in Gan Eden?",
      "How can we make our own homes feel like a little Gan Eden?",
      "What does it mean that Hashem saw everything was 'very good'?",
      "Why is gratitude important when we enjoy Hashem's creations?",
      "What is your favorite thing that Hashem created?",
    ],
  },
  {
    title: "Noach's Incredible Teivah",
    portion: "Parashas Noach",
    child: "Yehuda",
    coverImage: s2Cover,
    pages: [s2p1, s2p2, s2p3, s2p4, s2p5, s2p6, s2p7, s2p8, s2p9, s2p10],
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
      "How long did it rain during the mabul?",
      "What did Noach and his family eat on the teivah?",
      "How did Yehuda feel when the teivah finally stopped moving?",
      "Why did Noach send out a raven first?",
      "What did the olive branch from the dove mean?",
      "How did the animals know it was time to leave the teivah?",
      "Why does Hashem never want to destroy the whole world again?",
      "What chessed did Noach do for the animals every day?",
      "How can we be like Noach and stand up for what is right?",
      "What is the most beautiful rainbow you have ever seen?",
    ],
  },
  {
    title: "The Tower That Fell",
    portion: "Parashas Noach",
    child: "Chaya",
    coverImage: s3Cover,
    pages: [s3p1, s3p2, s3p3, s3p4, s3p5, s3p6, s3p7, s3p8, s3p9, s3p10],
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
      "Why did Hashem scatter the people across the earth?",
      "What language did everyone speak before the tower?",
      "How did the builders feel when they lost their shared language?",
      "Why is listening to Hashem more important than building big things?",
      "What does the name 'Bavel' mean?",
      "How did Chaya try to help the confused builders?",
      "What is more important — bricks or people?",
      "How can we show respect for Hashem in our daily lives?",
      "Why is humility a special middah?",
      "What is one way you can bring achdus to your family or class?",
    ],
  },
  {
    title: "Avraham Counts the Stars",
    portion: "Parashas Lech Lecha",
    child: "Shmuel",
    coverImage: s4Cover,
    pages: [s4p1, s4p2, s4p3, s4p4, s4p5, s4p6, s4p7, s4p8, s4p9, s4p10],
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
      "How many stars can you count on a clear night?",
      "Why did Avraham set up his tent with openings on all sides?",
      "What food did Avraham serve to his guests?",
      "How did Shmuel feel when he heard Hashem's promise?",
      "Why is Avraham called the father of the Jewish people?",
      "What does 'Lech Lecha' mean and why is it important?",
      "How did Avraham show chesed to strangers?",
      "What can we learn from Avraham about trusting Hashem?",
      "Why is every Jewish person compared to a star?",
      "What is one act of chesed you can do today?",
    ],
  },
  {
    title: "Yosef's Coat of Colors",
    portion: "Parashas Vayeishev",
    child: "Esther",
    coverImage: s5Cover,
    pages: [s5p1, s5p2, s5p3, s5p4, s5p5, s5p6, s5p7, s5p8, s5p9, s5p10],
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
      "Why did Yaakov give Yosef a special coat?",
      "How did Yosef feel when he was far from his family?",
      "What did Yosef do when Pharaoh had a dream?",
      "How did Yosef save Egypt from hunger?",
      "Why did the brothers not recognize Yosef in Egypt?",
      "How did Yosef test his brothers before revealing himself?",
      "What does Esther learn about patience from Yosef?",
      "Why is it important to use our talents to help others?",
      "How did Yosef show that Hashem was always with him?",
      "What would you do if someone treated you unfairly?",
    ],
  },
  {
    title: "Baby Moshe on the Nile",
    portion: "Parashas Shemos",
    child: "Ari",
    coverImage: s6Cover,
    pages: [s6p1, s6p2, s6p3, s6p4, s6p5, s6p6, s6p7, s6p8, s6p9, s6p10],
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
      "Why was Pharaoh afraid of the Jewish babies?",
      "How did Miriam watch over Moshe from the riverbank?",
      "What did the princess name the baby and why?",
      "How did Moshe end up being nursed by his own mother?",
      "What does Ari learn about bravery from this story?",
      "Why is a mother's love so powerful?",
      "How did Hashem protect Moshe as a baby?",
      "What can we learn from Miriam about looking out for family?",
      "Why did Hashem choose Moshe to be the leader of the Jewish people?",
      "What is one way you can be brave like Moshe's family?",
    ],
  },
  {
    title: "Krias Yam Suf",
    portion: "Parashas Beshalach",
    child: "Devorah",
    coverImage: s7Cover,
    pages: [s7p1, s7p2, s7p3, s7p4, s7p5, s7p6, s7p7, s7p8, s7p9, s7p10],
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
      "Why did the Jewish people have to walk into the water first?",
      "Who was Nachshon ben Aminadav and what did he do?",
      "What happened to the Egyptian army at the sea?",
      "How did Devorah help keep everyone calm?",
      "What did the dry land in the middle of the sea look like?",
      "Why do we say Shiras HaYam in our davening every day?",
      "How did the children react when they saw the sea split?",
      "What fruits and sweet water were inside the walls of water?",
      "Why is emunah the most important thing we can have?",
      "What song would you sing to thank Hashem for a miracle?",
    ],
  },
  {
    title: "Matan Torah on Har Sinai",
    portion: "Parashas Yisro",
    child: "Moshe",
    coverImage: s8Cover,
    pages: [s8p1, s8p2, s8p3, s8p4, s8p5, s8p6, s8p7, s8p8, s8p9, s8p10],
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
      "Why did Hashem choose Har Sinai for giving the Torah?",
      "What did the Jewish people see and hear at Har Sinai?",
      "Why is the Torah compared to water?",
      "How did the children prepare for Matan Torah?",
      "What does Moshe learn about responsibility from this event?",
      "Why is learning Torah a lifelong journey?",
      "What were the luchos made of?",
      "How do we celebrate Matan Torah on Shavuos?",
      "Why is every word in the Torah precious?",
      "What is one thing you learned from the Torah this week?",
    ],
  },
  {
    title: "Dovid and Golyas",
    portion: "Sefer Shmuel",
    child: "Dovid",
    coverImage: s9Cover,
    pages: [s9p1, s9p2, s9p3, s9p4, s9p5, s9p6, s9p7, s9p8, s9p9, s9p10],
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
      "Why did King Shaul not believe Dovid could win?",
      "What experience did Dovid have before fighting Golyas?",
      "How did Dovid's brothers react when he came to the battlefield?",
      "Why is courage not about being big or strong?",
      "What did the Plishtim think when they saw young Dovid?",
      "How did Dovid become the king of Israel?",
      "Why did Dovid write Tehillim (Psalms)?",
      "What can we learn from Dovid about never giving up?",
      "How does Hashem help those who trust in Him?",
      "What is your favorite chapter of Tehillim and why?",
    ],
  },
  {
    title: "Yonah and the Great Dag",
    portion: "Sefer Yonah",
    child: "Noa",
    coverImage: s10Cover,
    pages: [s10p1, s10p2, s10p3, s10p4, s10p5, s10p6, s10p7, s10p8, s10p9, s10p10],
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
      "Why did the sailors throw Yonah into the sea?",
      "How long was Yonah inside the great fish?",
      "What did Yonah see inside the belly of the dag?",
      "Why did Hashem send a kikayon plant for Yonah?",
      "What message did Yonah bring to the people of Nineveh?",
      "How did the king of Nineveh respond to Yonah's words?",
      "Why does Hashem want everyone to do teshuvah?",
      "What does Noa learn about second chances?",
      "Why do we read Sefer Yonah on Yom Kippur?",
      "What is one way you can do teshuvah today?",
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
