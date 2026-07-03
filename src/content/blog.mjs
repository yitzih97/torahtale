// Blog content — single source of truth shared by the React blog pages
// (src/pages/Blog.tsx, BlogArticle.tsx) AND the static prerender script
// (scripts/prerender.mjs). Plain ESM so both Vite and Node can import it.
// bodyHtml is trusted, hand-authored HTML (rendered via dangerouslySetInnerHTML).

/**
 * @typedef {Object} Article
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string} excerpt
 * @property {string} date        // human-readable
 * @property {string} dateISO     // YYYY-MM-DD
 * @property {number} readingMins
 * @property {string} bodyHtml
 */

// Real screenshots of the Torah Tale creation wizard (captured from the live
// product, stored in /public/blog/wizard/). One helper keeps the markup and
// styling consistent across articles.
const SHOT = (file, alt, caption) => `
  <figure style="margin:1.35rem auto;max-width:560px">
    <img src="/blog/wizard/${file}" alt="${alt}" loading="lazy"
      style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:14px;box-shadow:0 10px 30px -18px rgba(60,45,15,.25)" />
    ${caption ? `<figcaption style="margin-top:.5rem;text-align:center;font-size:.8rem;color:#8a8578">${caption}</figcaption>` : ""}
  </figure>`;

// The four real book products, side by side (photos of the actual printed books).
const PRODUCT_GRID = `
  <figure style="margin:1.35rem auto;max-width:620px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${[
        ["mockup-softcover.jpg", "Softcover photo book — the printed Torah Tale product", "Softcover 8″×8″"],
        ["mockup-hardcover.jpg", "Hardcover photo book — the printed Torah Tale product", "Hardcover 8″×8″"],
        ["mockup-board.jpg", "Board book — the printed Torah Tale product", "Board book 6″×6″"],
        ["mockup-coloring.jpg", "Matching coloring book — the printed Torah Tale product", "Coloring book 8.5″×11″"],
      ].map(([f, alt, label]) => `
        <div>
          <img src="/blog/wizard/${f}" alt="${alt}" loading="lazy"
            style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:12px" />
          <p style="margin:.35rem 0 0;text-align:center;font-size:.78rem;color:#8a8578">${label}</p>
        </div>`).join("")}
    </div>
    <figcaption style="margin-top:.6rem;text-align:center;font-size:.8rem;color:#8a8578">The real printed books — every format tells the same personalized story.</figcaption>
  </figure>`;

/** @type {Article[]} */
export const ARTICLES = [
  {
    slug: "how-to-create-a-personalized-torah-storybook",
    title: "How to Create a Personalized Torah Storybook for Your Child (Step by Step)",
    description:
      "A simple step-by-step guide to making a custom Torah storybook that stars your own child — from uploading a photo to choosing the parsha, the language, the art style, and the book format.",
    excerpt:
      "From a single photo to a printed keepsake — here is exactly how to turn your child into the hero of their own Torah adventure, with real screenshots of every step.",
    date: "July 3, 2026",
    dateISO: "2026-07-03",
    readingMins: 7,
    bodyHtml: `
      <p>A personalized Torah storybook puts <strong>your own child</strong> inside the weekly parsha — walking through the split sea, standing at Har Sinai, greeting the malachim with Avraham Avinu. It turns parsha learning into something a child genuinely looks forward to. Below is the whole process, step by step, with real screenshots from the Torah Tale book creator.</p>

      <h2>Step 1 — Enter your child's name</h2>
      <p>Start by telling us who the book is for. Type your child's name — this is the name that will appear throughout the story and on the cover. Making a book for siblings? You can add up to four children to the same book, and each one will appear in the illustrations.</p>
      ${SHOT("step-1-name.jpg", "Wizard step 1 — entering the child's name", "Step 1 of the book creator — every book starts with a name.")}

      <h2>Step 2 — Boy or girl</h2>
      <p>One tap. This makes sure the character, the clothing, and the storyline details are right for your child.</p>
      ${SHOT("step-2-gender.jpg", "Wizard step 2 — choosing boy or girl")}

      <h2>Step 3 — How old are they?</h2>
      <p>Set your child's age (1–15). The age shapes how the character is drawn and also helps us recommend the right book format later — sturdy board books for toddlers, bigger photo books for older kids.</p>
      ${SHOT("step-3-age.jpg", "Wizard step 3 — setting the child's age")}

      <h2>Step 4 — Upload a photo</h2>
      <p>This is where the magic starts. Upload one clear, smiling, front-facing photo — we use it to create an illustrated character that looks just like your child on every page. The screen shows you exactly what works best: clear and front-facing is perfect; photos facing away or group shots won't work. A built-in crop tool lets you frame the face just right.</p>
      ${SHOT("step-4-photo.jpg", "Wizard step 4 — photo upload with a guide showing which photos work best", "The photo guide — one clear, front-facing photo is all it takes.")}

      <h2>Step 5 — Choose the story</h2>
      <p><strong>This week's parsha</strong> is suggested automatically, complete with a live countdown to the next one — perfect for Shabbos prep, and on a double-parsha week (like Matos-Masei) the book covers both together. Want something else? Tap "Choose a different story" and browse the full Tanach — Chumash, Nevi'im, Kesuvim, Megillos, and Yamim Tovim stories for Rosh Hashanah, Chanukah, Purim, Pesach, and more.</p>
      ${SHOT("step-5-story.jpg", "Wizard step 5 — choosing this week's parsha or browsing the full Tanach", "This week's parsha is auto-selected — or browse the entire Tanach.")}

      <h2>Step 6 — Pick the language</h2>
      <p>Torah Tale books come in <strong>English, Hebrew, and Yiddish</strong>. Pick one — or select more than one if you'd like the story in multiple languages.</p>
      ${SHOT("step-6-language.jpg", "Wizard step 6 — choosing English, Hebrew, or Yiddish")}

      <h2>Step 7 — Choose the art style</h2>
      <p>Here's everyone's favorite step: the moment you arrive, you see <strong>your own child</strong> previewed in each illustration style — a warm hand-painted Cartoon, a 3D Pixar-style render, and a Realistic style. Whichever you choose is applied consistently across every page of the book.</p>
      ${SHOT("step-7-style.jpg", "Wizard step 7 — the child previewed in Cartoon, 3D Pixar, and Realistic styles", "Your child, previewed in all three styles before you decide.")}

      <h2>Step 8 — Review and create</h2>
      <p>One last look: name, age, story, art style, and plan, all on one screen. Tap "Create My Book" and we start writing and illustrating a complete story where your child is the hero, with the actual events of the parsha unfolding page by page and a clear middos lesson woven through. Every book is created with careful rabbinical guidance and strict tznius, so you can hand it to your child with confidence. You'll also receive an email preview of the book within 24 hours.</p>
      ${SHOT("step-8-review.jpg", "Wizard step 8 — the review screen before generating the book", "The final check before your book is created.")}

      <h2>Step 9 — Pick your book format (don't skip the coloring book!)</h2>
      <p>After creating a free account, choose how your story gets printed:</p>
      <ul>
        <li><strong>Softcover Photo Book (8″×8″)</strong> — classic and affordable, on smooth semi-gloss paper. Recommended for ages 4–8.</li>
        <li><strong>Hardcover Photo Book (8″×8″)</strong> — premium case-wrap binding with lay-flat pages, in your choice of <strong>square or landscape</strong>. The most popular gift option, for ages 5–12.</li>
        <li><strong>Board Book (6″×6″)</strong> — thick chipboard pages with rounded safety corners, built for the littlest hands (ages 2–4).</li>
        <li><strong>Coloring Book add-on (8.5″×11″)</strong> — a matching coloring book of the same story in black-and-white line art, so your child can color their own adventure. It's an optional add-on to any format — and one of the most-loved extras.</li>
      </ul>
      ${PRODUCT_GRID}

      <h2>Step 10 — Order (once, or as a subscription)</h2>
      <p>On the order screen you choose how you'd like to receive books: a <strong>single custom book</strong>, or a subscription — <strong>Weekly</strong> (a new parsha book every Shabbos), <strong>Monthly</strong> (4 books a month, the most popular), or a <strong>Year Bundle</strong> with two months free. Standard shipping is free (5–7 business days); express (2–3 business days) is available, and we ship worldwide.</p>
      ${SHOT("step-11-order.jpg", "The order summary — single book or weekly, monthly, and yearly subscription plans", "One book or a weekly Torah habit — you choose at the end.")}

      <h2>Ready to start?</h2>
      <p>The whole process takes about five minutes. <a href="/create">Create your child's Torah storybook</a> now, or see <a href="/pricing">pricing and subscription options</a>. Not sure which story to pick? Read <a href="/blog/how-to-choose-the-weekly-parsha-for-your-childs-book">how to choose the weekly parsha for your child's book</a>.</p>
    `,
  },
  {
    slug: "how-to-choose-the-weekly-parsha-for-your-childs-book",
    title: "How to Choose the Weekly Parsha for Your Child's Book",
    description:
      "Should you pick this week's parsha, your child's bar/bas mitzvah parsha, or a favorite story? A practical guide to choosing the right Torah portion for a personalized book.",
    excerpt:
      "This week's parsha, a birthday parsha, or the story your child already loves — here's how to choose a portion that will make the book truly special.",
    date: "July 2, 2026",
    dateISO: "2026-07-02",
    readingMins: 5,
    bodyHtml: `
      <p>One of the best things about a personalized Torah book is that <em>you</em> choose the story. Here are the most popular ways families pick a parsha — and how to decide what's right for your child.</p>
      ${SHOT("step-5-story.jpg", "The Torah Tale story picker with this week's parsha auto-selected", "The real story picker — this week's parsha is suggested automatically, with a live countdown.")}

      <h2>Option 1 — This week's parsha</h2>
      <p>The simplest and most popular choice. Learning the parsha your child is hearing in cheder or Bais Yaakov this very week makes the book feel alive and timely. Torah Tale automatically suggests the current parsha and refreshes it every week, so you're always in sync with the leining.</p>

      <h2>Option 2 — A meaningful "personal" parsha</h2>
      <p>Some parshiyos carry special meaning for a child:</p>
      <ul>
        <li><strong>Their bar/bas mitzvah parsha</strong> — a treasured keepsake in the lead-up to the simcha.</li>
        <li><strong>The parsha of their birthday or upsherin week.</strong></li>
        <li><strong>The parsha they were named after</strong> (e.g. a child named after an event or person in the sedra).</li>
      </ul>

      <h2>Option 3 — A story your child already loves</h2>
      <p>If your child is captivated by Noach and the teivah, Yosef and his colorful coat, or Yonah and the big fish, lean into it. A child who already loves the story will read the book again and again. In the story picker, tap "Choose a different story" to browse the full Tanach — Chumash, Nevi'im, Kesuvim, and Megillos.</p>

      <h2>What about double parshiyos?</h2>
      <p>On weeks when two parshiyos are read together — like Chukas-Balak or Matos-Masei — Torah Tale creates a single book that covers <strong>both</strong> parshiyos, with balanced attention to the key events of each. You get one complete keepsake for the full week's leining.</p>

      <h2>Holidays and Yomim Tovim</h2>
      <p>Beyond the weekly parsha, you can build a book around Rosh Hashanah, Chanukah, Purim, Pesach, and more — a wonderful way to prepare a child for the Yom Tov.</p>

      <h2>Still deciding?</h2>
      <p>You can't go wrong. When in doubt, start with <a href="/create">this week's parsha</a> — it's chosen for you automatically. New to the process? Read our <a href="/blog/how-to-create-a-personalized-torah-storybook">step-by-step guide to creating a personalized Torah storybook</a>.</p>
    `,
  },
  {
    slug: "best-personalized-jewish-gifts-for-kids",
    title: "The Best Personalized Jewish Gifts for Kids (Birthdays, Upsherin & Yom Tov)",
    description:
      "Looking for a meaningful Jewish gift for a child? Personalized Torah storybooks make an unforgettable present for birthdays, an upsherin, a bar/bas mitzvah, or any Yom Tov.",
    excerpt:
      "A gift that teaches Torah, celebrates the child, and lasts for years — why a personalized storybook beats another toy for the next simcha.",
    date: "July 2, 2026",
    dateISO: "2026-07-02",
    readingMins: 5,
    bodyHtml: `
      <p>Finding a Jewish gift that's meaningful, lasting, and genuinely exciting for a child is hard. Toys are forgotten in a week; a personalized Torah storybook — where the child is the <strong>hero of the parsha</strong> — becomes a treasured keepsake. Here's when it shines.</p>
      ${PRODUCT_GRID}

      <h2>Birthdays</h2>
      <p>Instead of another toy, give a book that stars the birthday child inside a Torah adventure. Pick their favorite story or the parsha of their birthday week for an extra-personal touch — and add the matching <strong>coloring book</strong> so the fun continues after the story is read.</p>

      <h2>Upsherin</h2>
      <p>A boy's first haircut is a beautiful milestone into learning Torah. A custom book featuring him — peyos and all — celebrating a parsha makes a deeply fitting keepsake for the day. The sturdy board book format is perfect for a three-year-old's hands.</p>

      <h2>Bar &amp; Bas Mitzvah</h2>
      <p>A hardcover book built around the child's <strong>bar or bas mitzvah parsha</strong>, with them as the hero, is a gift they'll keep for life — perfect from grandparents, an aunt or uncle, or a rebbe.</p>

      <h2>Yom Tov</h2>
      <p>Rosh Hashanah, Chanukah, Purim, Pesach — a personalized Yom Tov book helps a child feel the chag and gives them something special to read at the table. Building a set over the year makes a wonderful family library — the <a href="/pricing">weekly and monthly subscriptions</a> do exactly that, automatically.</p>

      <h2>Why it makes a better gift</h2>
      <ul>
        <li><strong>It teaches Torah</strong> — the child absorbs the parsha while being entertained.</li>
        <li><strong>It's truly personal</strong> — their name, their face, their story, in English, Hebrew, or Yiddish.</li>
        <li><strong>It lasts</strong> — a printed keepsake in softcover, hardcover, or board book, not a passing toy.</li>
        <li><strong>It's made with care</strong> — every book follows careful rabbinical guidance and strict tznius.</li>
      </ul>

      <h2>Give one today</h2>
      <p><a href="/create">Create a personalized Torah storybook</a> as a gift in about five minutes, or explore <a href="/pricing">pricing and gift options</a>. First time? Start with our <a href="/blog/how-to-create-a-personalized-torah-storybook">step-by-step guide</a>.</p>
    `,
  },
];

export const getArticle = (slug) => ARTICLES.find((a) => a.slug === slug);
