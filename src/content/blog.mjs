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

// Self-contained animated "screencast" of the 5-step book wizard. Pure inline
// SVG + CSS keyframes — no external assets, so it renders identically in the
// React pages and the static prerender. Reused across articles with a tailored
// caption. Prefixed .ttw classes; falls back to a static first step when the
// reader prefers reduced motion.
const WIZARD_DEMO = (caption) => `
<figure class="ttw" role="group" aria-label="Animation of the five steps to create a personalized Torah storybook">
  <svg viewBox="0 0 680 384" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" style="width:100%;height:auto;display:block">
    <style>
      .ttw svg{font-family:'Inter',system-ui,-apple-system,sans-serif}
      .ttw .cap{fill:#9aa0a8;font-size:13px;letter-spacing:.4px}
      .ttw .h{fill:#30353f}
      .ttw .mut{fill:#6b7280}
      .ttw .scr{opacity:0;animation:ttwShow 17.5s infinite}
      .ttw .s1{animation-delay:0s}.ttw .s2{animation-delay:3.5s}.ttw .s3{animation-delay:7s}.ttw .s4{animation-delay:10.5s}.ttw .s5{animation-delay:14s}
      @keyframes ttwShow{0%{opacity:0}1.5%{opacity:1}18.5%{opacity:1}20%{opacity:0}100%{opacity:0}}
      .ttw .bar{animation:ttwBar 17.5s infinite}
      @keyframes ttwBar{0%,20%{width:112px}20.01%,40%{width:229px}40.01%,60%{width:346px}60.01%,80%{width:463px}80.01%,100%{width:580px}}
      @media (prefers-reduced-motion:reduce){.ttw .scr{animation:none}.ttw .s1{opacity:1}.ttw .bar{animation:none;width:112px}}
    </style>
    <rect x="8" y="8" width="664" height="368" rx="18" fill="#fbfcfd" stroke="#e8eaed"/>
    <circle cx="34" cy="38" r="5" fill="#eab7b0"/><circle cx="52" cy="38" r="5" fill="#efd39a"/><circle cx="70" cy="38" r="5" fill="#bcd8b0"/>
    <rect x="214" y="27" width="252" height="22" rx="11" fill="#f0f2f4"/>
    <text x="340" y="42" text-anchor="middle" class="mut" font-size="12">torahtale.com/create</text>
    <line x1="8" y1="62" x2="672" y2="62" stroke="#eef0f2"/>
    <text x="340" y="94" text-anchor="middle" class="h" font-size="22" font-weight="700" font-family="'Playfair Display',Georgia,serif">Create Your Book</text>
    <rect x="50" y="112" width="580" height="8" rx="4" fill="#edeff2"/>
    <rect class="bar" x="50" y="112" width="112" height="8" rx="4" fill="#F1B527"/>
    <!-- Step 1: name -->
    <g class="scr s1">
      <text x="340" y="162" text-anchor="middle" class="cap">STEP 1 · WHO IS IT FOR?</text>
      <rect x="196" y="196" width="288" height="56" rx="12" fill="#ffffff" stroke="#e2e5e9"/>
      <text x="216" y="223" class="mut" font-size="10" letter-spacing="1">CHILD'S NAME</text>
      <text x="216" y="243" class="h" font-size="19" font-weight="600">Adina</text>
      <rect x="279" y="222" width="2" height="22" fill="#F1B527"/>
    </g>
    <!-- Step 2: photo -->
    <g class="scr s2">
      <text x="340" y="162" text-anchor="middle" class="cap">STEP 2 · ADD A PHOTO</text>
      <rect x="290" y="182" width="100" height="100" rx="18" fill="#FCEFCF"/>
      <circle cx="340" cy="226" r="24" fill="#F1B527" opacity="0.55"/>
      <circle cx="340" cy="258" r="20" fill="#F1B527" opacity="0.35"/>
      <circle cx="383" cy="190" r="13" fill="#3BA55D"/>
      <path d="M377 190 l4 4 l8 -8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="340" y="304" text-anchor="middle" class="mut" font-size="13">Clear &amp; front-facing ✓</text>
    </g>
    <!-- Step 3: parsha -->
    <g class="scr s3">
      <text x="340" y="162" text-anchor="middle" class="cap">STEP 3 · CHOOSE THE PARSHA</text>
      <rect x="150" y="182" width="380" height="96" rx="14" fill="#FFF9EC" stroke="#F1B527" stroke-opacity="0.55"/>
      <text x="176" y="212" class="h" font-size="11" font-weight="700" letter-spacing="1" fill="#B67B0A">✦ THIS WEEK'S PARSHA</text>
      <text x="176" y="240" class="h" font-size="21" font-weight="700" font-family="'Playfair Display',Georgia,serif">Parshas Matos-Masei</text>
      <rect x="176" y="252" width="168" height="18" rx="9" fill="#F6E7C4"/>
      <text x="184" y="265" class="mut" font-size="11">Next parsha in 5d 21h</text>
    </g>
    <!-- Step 4: style -->
    <g class="scr s4">
      <text x="340" y="162" text-anchor="middle" class="cap">STEP 4 · PICK THE ART STYLE</text>
      <g>
        <rect x="163" y="184" width="110" height="86" rx="12" fill="#f5f6f8"/>
        <circle cx="218" cy="218" r="20" fill="#cbd2da"/>
        <text x="218" y="260" text-anchor="middle" class="mut" font-size="12">Cartoon</text>
      </g>
      <g>
        <rect x="285" y="184" width="110" height="86" rx="12" fill="#FFF9EC" stroke="#F1B527" stroke-width="2"/>
        <circle cx="340" cy="218" r="20" fill="#F1B527"/>
        <text x="340" y="260" text-anchor="middle" class="h" font-size="12" font-weight="700">3D Pixar</text>
      </g>
      <g>
        <rect x="407" y="184" width="110" height="86" rx="12" fill="#f5f6f8"/>
        <circle cx="462" cy="218" r="20" fill="#cbd2da"/>
        <text x="462" y="260" text-anchor="middle" class="mut" font-size="12">Realistic</text>
      </g>
    </g>
    <!-- Step 5: generate -->
    <g class="scr s5">
      <text x="340" y="162" text-anchor="middle" class="cap">STEP 5 · CREATE THE BOOK</text>
      <rect x="210" y="206" width="260" height="56" rx="28" fill="#F1B527"/>
      <text x="340" y="241" text-anchor="middle" font-size="18" font-weight="700" fill="#3a2c05">Generate Book ✨</text>
    </g>
  </svg>
  <figcaption style="text-align:center;font-size:.85rem;color:hsl(var(--muted-foreground));margin-top:.6rem">${caption}</figcaption>
</figure>
`;

/** @type {Article[]} */
export const ARTICLES = [
  {
    slug: "how-to-create-a-personalized-torah-storybook",
    title: "How to Create a Personalized Torah Storybook for Your Child (Step by Step)",
    description:
      "A simple step-by-step guide to making a custom Torah storybook that stars your own child — from uploading a photo to choosing the parsha and printing a keepsake hardcover.",
    excerpt:
      "From a single photo to a printed keepsake — here is exactly how to turn your child into the hero of their own Torah adventure in about five minutes.",
    date: "July 2, 2026",
    dateISO: "2026-07-02",
    readingMins: 6,
    bodyHtml: `
      <p>A personalized Torah storybook puts <strong>your own child</strong> inside the weekly parsha — walking through the split sea, standing at Har Sinai, greeting the malachim with Avraham Avinu. It turns parsha learning into something a child genuinely looks forward to. Here is the whole process, step by step.</p>
      ${WIZARD_DEMO("The five-step flow — from a single photo to a printed keepsake, in about five minutes.")}

      <h2>Step 1 — Add your child (name, age, and a photo)</h2>
      <p>Start by telling us who the book is for. Enter your child's name and age, then upload one clear, front-facing photo. The photo is used only as a likeness reference so the illustrated hero looks like your child on every page.</p>
      <ul>
        <li>Use a bright, front-facing photo where the face is clearly visible.</li>
        <li>Avoid group shots, sunglasses, or photos taken from the side.</li>
        <li>Adding several children? You can include siblings in the same book.</li>
      </ul>

      <h2>Step 2 — Pick the art style</h2>
      <p>Choose the look that fits your family — a warm 3D Pixar-style render, a hand-painted cartoon, or a classic illustrated style. Whatever you pick is applied consistently across every page of the book.</p>

      <h2>Step 3 — Choose the parsha or story</h2>
      <p>By default we suggest <strong>this week's parsha</strong>, automatically selected and refreshed every week. You can also browse the full Chumash, the Neviim, Yomim Tovim, and more, and pick any story you like. On a double-parsha week (like Chukas-Balak or Matos-Masei) the book covers both together.</p>

      <h2>Step 4 — Review the story and pages</h2>
      <p>We generate a complete story where your child is the hero, with the actual events of the parsha unfolding page by page and a clear middos lesson woven through. Every book is created with careful rabbinical guidance and strict tznius, so you can hand it to your child with confidence.</p>

      <h2>Step 5 — Choose your book and order</h2>
      <p>Pick a format — softcover, a premium hardcover keepsake, or a sturdy board book for little hands — and we print and ship it to your door. Prefer a weekly habit? A <a href="/pricing">subscription</a> delivers a fresh parsha book every week.</p>

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
      ${WIZARD_DEMO("Choosing a parsha is Step 3 of the quick five-step flow — this week's portion is filled in for you automatically.")}

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
      <p>If your child is captivated by Noach and the teivah, Yosef and his colorful coat, or Yonah and the big fish, lean into it. A child who already loves the story will read the book again and again.</p>

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
      ${WIZARD_DEMO("Personalizing the gift takes about five minutes — name and photo, parsha, art style, and order.")}

      <h2>Birthdays</h2>
      <p>Instead of another toy, give a book that stars the birthday child inside a Torah adventure. Pick their favorite story or the parsha of their birthday week for an extra-personal touch.</p>

      <h2>Upsherin</h2>
      <p>A boy's first haircut is a beautiful milestone into learning Torah. A custom book featuring him — peyos and all — celebrating a parsha makes a deeply fitting keepsake for the day.</p>

      <h2>Bar &amp; Bas Mitzvah</h2>
      <p>A hardcover book built around the child's <strong>bar or bas mitzvah parsha</strong>, with them as the hero, is a gift they'll keep for life — perfect from grandparents, an aunt or uncle, or a rebbe.</p>

      <h2>Yom Tov</h2>
      <p>Rosh Hashanah, Chanukah, Purim, Pesach — a personalized Yom Tov book helps a child feel the chag and gives them something special to read at the table. Building a set over the year makes a wonderful family library.</p>

      <h2>Why it makes a better gift</h2>
      <ul>
        <li><strong>It teaches Torah</strong> — the child absorbs the parsha while being entertained.</li>
        <li><strong>It's truly personal</strong> — their name, their face, their story.</li>
        <li><strong>It lasts</strong> — a printed hardcover keepsake, not a passing toy.</li>
        <li><strong>It's made with care</strong> — every book follows careful rabbinical guidance and strict tznius.</li>
      </ul>

      <h2>Give one today</h2>
      <p><a href="/create">Create a personalized Torah storybook</a> as a gift in about five minutes, or explore <a href="/pricing">pricing and gift options</a>. First time? Start with our <a href="/blog/how-to-create-a-personalized-torah-storybook">step-by-step guide</a>.</p>
    `,
  },
];

export const getArticle = (slug) => ARTICLES.find((a) => a.slug === slug);
