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

// Per-step animations for the blog articles. Each is a small, self-contained
// inline SVG + CSS-keyframes clip illustrating ONE step of the flow. No external
// assets, so they render identically in the React pages and the static
// prerender. Unique aN- prefixes let all five sit on the same page without
// keyframe collisions; each freezes gracefully under prefers-reduced-motion.
const FIG = (svg) => `<figure aria-hidden="true" style="margin:1.15rem 0"><svg viewBox="0 0 440 150" xmlns="http://www.w3.org/2000/svg" role="img" style="width:100%;max-width:440px;height:auto;display:block;margin:0 auto;font-family:'Inter',system-ui,-apple-system,sans-serif">${svg}</svg></figure>`;

// Step 1 — name types in + photo pops with a check
const ANIM_NAME = FIG(`
  <style>
    @keyframes a1caret{0%,50%{opacity:1}51%,100%{opacity:0}}
    @keyframes a1pop{0%,8%{transform:scale(.5);opacity:0}22%,100%{transform:scale(1);opacity:1}}
    @keyframes a1chk{0%,42%{transform:scale(0)}54%{transform:scale(1.25)}62%,100%{transform:scale(1)}}
    .a1c{animation:a1caret 1s steps(1) infinite}
    .a1p{transform-box:fill-box;transform-origin:center;animation:a1pop 4s ease-in-out infinite}
    .a1k{transform-box:fill-box;transform-origin:center;animation:a1chk 4s ease-in-out infinite}
    @media(prefers-reduced-motion:reduce){.a1c,.a1p,.a1k{animation:none}.a1p,.a1k{transform:none;opacity:1}}
  </style>
  <rect x="1" y="1" width="438" height="148" rx="14" fill="#fbfcfd" stroke="#e8eaed"/>
  <text x="30" y="46" fill="#9aa0a8" font-size="10" letter-spacing="1">CHILD'S NAME</text>
  <rect x="28" y="56" width="212" height="44" rx="10" fill="#fff" stroke="#e2e5e9"/>
  <text x="44" y="84" fill="#30353f" font-size="18" font-weight="600">Adina</text>
  <rect class="a1c" x="103" y="66" width="2" height="24" fill="#F1B527"/>
  <g class="a1p">
    <rect x="300" y="34" width="96" height="82" rx="14" fill="#FCEFCF"/>
    <circle cx="348" cy="72" r="19" fill="#F1B527" opacity=".55"/>
    <circle cx="348" cy="104" r="15" fill="#F1B527" opacity=".33"/>
  </g>
  <g class="a1k"><circle cx="392" cy="40" r="12" fill="#3BA55D"/><path d="M386 40 l4 4 l8 -8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>
`);

// Step 2 — a gold selection ring glides across three style tiles
const ANIM_STYLE = FIG(`
  <style>
    @keyframes a2ring{0%,14%{transform:translateX(0)}31%,47%{transform:translateX(133px)}64%,84%{transform:translateX(266px)}100%{transform:translateX(0)}}
    .a2r{animation:a2ring 5s ease-in-out infinite}
    @media(prefers-reduced-motion:reduce){.a2r{animation:none;transform:translateX(133px)}}
  </style>
  <rect x="1" y="1" width="438" height="148" rx="14" fill="#fbfcfd" stroke="#e8eaed"/>
  <g>
    <rect x="27" y="30" width="120" height="78" rx="12" fill="#f5f6f8"/><circle cx="87" cy="62" r="17" fill="#cbd2da"/><text x="87" y="98" text-anchor="middle" fill="#6b7280" font-size="12">Cartoon</text>
    <rect x="160" y="30" width="120" height="78" rx="12" fill="#FFF9EC"/><circle cx="220" cy="62" r="17" fill="#F1B527"/><text x="220" y="98" text-anchor="middle" fill="#30353f" font-size="12" font-weight="700">3D Pixar</text>
    <rect x="293" y="30" width="120" height="78" rx="12" fill="#f5f6f8"/><circle cx="353" cy="62" r="17" fill="#cbd2da"/><text x="353" y="98" text-anchor="middle" fill="#6b7280" font-size="12">Realistic</text>
  </g>
  <rect class="a2r" x="27" y="30" width="120" height="78" rx="12" fill="none" stroke="#F1B527" stroke-width="3"/>
  <text x="220" y="132" text-anchor="middle" fill="#9aa0a8" font-size="11">One style, applied to every page</text>
`);

// Step 3 — this-week's-parsha card with a ticking countdown clock
const ANIM_PARSHA = FIG(`
  <style>
    @keyframes a3spin{to{transform:rotate(360deg)}}
    @keyframes a3in{0%,6%{opacity:0;transform:translateY(8px)}20%,100%{opacity:1;transform:translateY(0)}}
    .a3h{transform-box:fill-box;transform-origin:349px 92px;animation:a3spin 3s linear infinite}
    .a3card{transform-box:fill-box;animation:a3in 5s ease-out infinite}
    @media(prefers-reduced-motion:reduce){.a3h,.a3card{animation:none;transform:none;opacity:1}}
  </style>
  <rect x="1" y="1" width="438" height="148" rx="14" fill="#fbfcfd" stroke="#e8eaed"/>
  <g class="a3card">
    <rect x="24" y="26" width="392" height="98" rx="14" fill="#FFF9EC" stroke="#F1B527" stroke-opacity=".55"/>
    <text x="44" y="54" fill="#B67B0A" font-size="11" font-weight="700" letter-spacing="1">✦ THIS WEEK'S PARSHA</text>
    <text x="44" y="84" fill="#30353f" font-size="21" font-weight="700" font-family="'Playfair Display',Georgia,serif">Parshas Matos-Masei</text>
    <text x="44" y="108" fill="#6b7280" font-size="12">Auto-selected · refreshes every week</text>
    <circle cx="349" cy="92" r="24" fill="#fff" stroke="#F1B527" stroke-width="2"/>
    <line class="a3h" x1="349" y1="92" x2="349" y2="76" stroke="#B67B0A" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="349" cy="92" r="2.5" fill="#B67B0A"/>
  </g>
`);

// Step 4 — a book with a page turning
const ANIM_REVIEW = FIG(`
  <style>
    @keyframes a4turn{0%,8%{transform:scaleX(1)}46%{transform:scaleX(0)}54%{transform:scaleX(0)}92%,100%{transform:scaleX(1)}}
    .a4pg{transform-box:fill-box;transform-origin:left;animation:a4turn 4s ease-in-out infinite}
    @media(prefers-reduced-motion:reduce){.a4pg{animation:none}}
  </style>
  <rect x="1" y="1" width="438" height="148" rx="14" fill="#fbfcfd" stroke="#e8eaed"/>
  <rect x="120" y="30" width="100" height="92" rx="4" fill="#fff" stroke="#e2e5e9"/>
  <rect x="220" y="30" width="100" height="92" rx="4" fill="#fff" stroke="#e2e5e9"/>
  <line x1="220" y1="30" x2="220" y2="122" stroke="#e2e5e9"/>
  <circle cx="170" cy="58" r="12" fill="#FCEFCF"/><rect x="136" y="80" width="68" height="5" rx="2.5" fill="#e6e9ed"/><rect x="136" y="92" width="52" height="5" rx="2.5" fill="#eef0f2"/>
  <rect x="236" y="46" width="68" height="5" rx="2.5" fill="#e6e9ed"/><rect x="236" y="58" width="60" height="5" rx="2.5" fill="#eef0f2"/><circle cx="270" cy="92" r="14" fill="#FCEFCF"/>
  <rect class="a4pg" x="220" y="30" width="100" height="92" rx="4" fill="#fdfdfe" stroke="#e2e5e9"/>
  <text x="360" y="72" fill="#9aa0a8" font-size="11">Every</text><text x="360" y="88" fill="#9aa0a8" font-size="11">page</text>
`);

// Step 5 — three formats rise, then a shipped check
const ANIM_ORDER = FIG(`
  <style>
    @keyframes a5rise{0%,10%{transform:translateY(24px);opacity:0}30%,100%{transform:translateY(0);opacity:1}}
    @keyframes a5ship{0%,55%{opacity:0;transform:scale(.6)}70%{transform:scale(1.15)}80%,100%{opacity:1;transform:scale(1)}}
    .a5b{transform-box:fill-box;animation:a5rise 4.5s ease-out infinite}
    .a5b2{animation-delay:.15s}.a5b3{animation-delay:.3s}
    .a5s{transform-box:fill-box;transform-origin:center;animation:a5ship 4.5s ease-out infinite}
    @media(prefers-reduced-motion:reduce){.a5b,.a5s{animation:none;transform:none;opacity:1}}
  </style>
  <rect x="1" y="1" width="438" height="148" rx="14" fill="#fbfcfd" stroke="#e8eaed"/>
  <g class="a5b"><rect x="44" y="44" width="64" height="76" rx="6" fill="#f0f2f4" stroke="#e2e5e9"/><rect x="44" y="44" width="8" height="76" rx="3" fill="#cbd2da"/><text x="76" y="136" text-anchor="middle" fill="#9aa0a8" font-size="10">Soft</text></g>
  <g class="a5b a5b2"><rect x="120" y="36" width="64" height="84" rx="6" fill="#FFF9EC" stroke="#F1B527" stroke-width="2"/><rect x="120" y="36" width="8" height="84" rx="3" fill="#F1B527"/><text x="152" y="136" text-anchor="middle" fill="#B67B0A" font-size="10" font-weight="700">Hardcover</text></g>
  <g class="a5b a5b3"><rect x="196" y="44" width="64" height="76" rx="6" fill="#f0f2f4" stroke="#e2e5e9"/><rect x="196" y="44" width="8" height="76" rx="3" fill="#cbd2da"/><text x="228" y="136" text-anchor="middle" fill="#9aa0a8" font-size="10">Board</text></g>
  <g class="a5s"><circle cx="340" cy="70" r="22" fill="#3BA55D"/><path d="M330 70 l7 7 l14 -15" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="340" y="112" text-anchor="middle" fill="#6b7280" font-size="11">Shipped to</text><text x="340" y="126" text-anchor="middle" fill="#6b7280" font-size="11">your door</text></g>
`);


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
      <h2>Step 1 — Add your child (name, age, and a photo)</h2>
      <p>Start by telling us who the book is for. Enter your child's name and age, then upload one clear, front-facing photo. The photo is used only as a likeness reference so the illustrated hero looks like your child on every page.</p>
      <ul>
        <li>Use a bright, front-facing photo where the face is clearly visible.</li>
        <li>Avoid group shots, sunglasses, or photos taken from the side.</li>
        <li>Adding several children? You can include siblings in the same book.</li>
      </ul>
      ${ANIM_NAME}

      <h2>Step 2 — Pick the art style</h2>
      <p>Choose the look that fits your family — a warm 3D Pixar-style render, a hand-painted cartoon, or a classic illustrated style. Whatever you pick is applied consistently across every page of the book.</p>
      ${ANIM_STYLE}

      <h2>Step 3 — Choose the parsha or story</h2>
      <p>By default we suggest <strong>this week's parsha</strong>, automatically selected and refreshed every week. You can also browse the full Chumash, the Neviim, Yomim Tovim, and more, and pick any story you like. On a double-parsha week (like Chukas-Balak or Matos-Masei) the book covers both together.</p>
      ${ANIM_PARSHA}

      <h2>Step 4 — Review the story and pages</h2>
      <p>We generate a complete story where your child is the hero, with the actual events of the parsha unfolding page by page and a clear middos lesson woven through. Every book is created with careful rabbinical guidance and strict tznius, so you can hand it to your child with confidence.</p>
      ${ANIM_REVIEW}

      <h2>Step 5 — Choose your book and order</h2>
      <p>Pick a format — softcover, a premium hardcover keepsake, or a sturdy board book for little hands — and we print and ship it to your door. Prefer a weekly habit? A <a href="/pricing">subscription</a> delivers a fresh parsha book every week.</p>
      ${ANIM_ORDER}

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
      ${ANIM_PARSHA}

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
      ${ANIM_ORDER}

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
