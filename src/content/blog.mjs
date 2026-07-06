// Blog content — single source of truth shared by the React blog pages
// (src/pages/Blog.tsx, BlogArticle.tsx) AND the static prerender script
// (scripts/prerender.mjs). Plain ESM so both Vite and Node can import it.
// bodyHtml is trusted, hand-authored HTML (rendered via dangerouslySetInnerHTML).
//
// Each article carries top-level ENGLISH fields (used by the prerender/SEO
// layer) plus a `he` object with the Hebrew version of every reader-facing
// field. Use `localizeArticle(article, lang)` to get the right variant —
// Yiddish falls back to Hebrew.

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
 * @property {{title: string, description: string, excerpt: string, date: string, bodyHtml: string}} he
 */

// Real screenshots of the Torah Tale creation wizard (captured from the live
// product in each language, stored in /public/blog/wizard/).
const SHOT = (file, alt, caption, rtl = false) => `
  <figure style="margin:1.35rem auto;max-width:560px"${rtl ? ' dir="rtl"' : ""}>
    <img src="/blog/wizard/${file}" alt="${alt}" loading="lazy"
      style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:14px;box-shadow:0 10px 30px -18px rgba(60,45,15,.25)" />
    ${caption ? `<figcaption style="margin-top:.5rem;text-align:center;font-size:.8rem;color:#8a8578">${caption}</figcaption>` : ""}
  </figure>`;

// The four real book products, side by side (photos of the actual printed books).
const PRODUCT_GRID_ITEMS = [
  ["mockup-softcover.jpg", "Softcover photo book — the printed Torah Tale product", "Softcover 8″×8″", "כריכה רכה 8″×8″"],
  ["mockup-hardcover.jpg", "Hardcover photo book — the printed Torah Tale product", "Hardcover 8″×8″", "כריכה קשה 8″×8″"],
  ["mockup-board.jpg", "Board book — the printed Torah Tale product", "Board book 6″×6″", "ספר קרטון 6″×6″"],
  ["mockup-coloring.jpg", "Matching coloring book — the printed Torah Tale product", "Coloring book 8.5″×11″", "חוברת צביעה 8.5″×11″"],
];

const PRODUCT_GRID_FOR = (he) => `
  <figure style="margin:1.35rem auto;max-width:620px"${he ? ' dir="rtl"' : ""}>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${PRODUCT_GRID_ITEMS.map(([f, alt, en, heLabel]) => `
        <div>
          <img src="/blog/wizard/${f}" alt="${alt}" loading="lazy"
            style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:12px" />
          <p style="margin:.35rem 0 0;text-align:center;font-size:.78rem;color:#8a8578">${he ? heLabel : en}</p>
        </div>`).join("")}
    </div>
    <figcaption style="margin-top:.6rem;text-align:center;font-size:.8rem;color:#8a8578">${
      he
        ? "הספרים המודפסים האמיתיים — כל פורמט מספר את אותו סיפור אישי."
        : "The real printed books — every format tells the same personalized story."
    }</figcaption>
  </figure>`;

const PRODUCT_GRID = PRODUCT_GRID_FOR(false);
const PRODUCT_GRID_HE = PRODUCT_GRID_FOR(true);

/** @type {Article[]} */
export const ARTICLES = [
  {
    slug: "how-to-create-a-personalized-torah-storybook",
    title: "How to Create a Personalized Torah Storybook for Your Child (Step by Step)",
    description:
      "A simple step-by-step guide to making a custom Torah storybook that stars your own child — from uploading a photo to choosing the parsha, the language, and the book format.",
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


      <h2>Step 7 — Review and create</h2>
      <p>One last look: name, age, story, and plan, all on one screen. Every book is illustrated in our signature ultra high-resolution 3D Pixar style — rich, movie-quality scenes on every page. Tap "Create My Book" and we start writing and illustrating a complete story where your child is the hero, with the actual events of the parsha unfolding page by page and a clear middos lesson woven through. Every book is created with careful rabbinical guidance and strict tznius, and our team personally reviews it before it goes to print — so you can hand it to your child with confidence. You'll get a quick peek by email when your book ships.</p>
      ${SHOT("step-8-review.jpg", "Wizard step 8 — the review screen before generating the book", "The final check before your book is created.")}

      <h2>Step 8 — Pick your book format (don't skip the coloring book!)</h2>
      <p>After creating a free account, choose how your story gets printed:</p>
      <ul>
        <li><strong>Softcover Photo Book (8″×8″)</strong> — classic and affordable, on smooth semi-gloss paper. Recommended for ages 4–8.</li>
        <li><strong>Hardcover Photo Book (8″×8″)</strong> — premium case-wrap binding with lay-flat pages, in your choice of <strong>square or landscape</strong>. The most popular gift option, for ages 5–12.</li>
        <li><strong>Board Book (6″×6″)</strong> — thick chipboard pages with rounded safety corners, built for the littlest hands (ages 2–4).</li>
        <li><strong>Coloring Book add-on (8.5″×11″)</strong> — a matching coloring book of the same story in black-and-white line art, so your child can color their own adventure. It's an optional add-on to any format — and one of the most-loved extras.</li>
      </ul>
      ${PRODUCT_GRID}

      <h2>Step 9 — Order (once, or as a subscription)</h2>
      <p>On the order screen you choose how you'd like to receive books: a <strong>single custom book</strong>, or a subscription — <strong>Weekly</strong> (a new parsha book every Shabbos), <strong>Monthly</strong> (4 books a month, the most popular), or a <strong>Year Bundle</strong> with two months free. Standard shipping is free (5–7 business days); express (2–3 business days) is available, and we ship worldwide.</p>
      ${SHOT("step-11-order.jpg", "The order summary — single book or weekly, monthly, and yearly subscription plans", "One book or a weekly Torah habit — you choose at the end.")}

      <h2>Ready to start?</h2>
      <p>The whole process takes about five minutes. <a href="/create">Create your child's Torah storybook</a> now, or see <a href="/pricing">pricing and subscription options</a>. Not sure which story to pick? Read <a href="/blog/how-to-choose-the-weekly-parsha-for-your-childs-book">how to choose the weekly parsha for your child's book</a>.</p>
    `,
    he: {
      title: "איך יוצרים ספר תורה מותאם אישית לילד שלכם (שלב אחרי שלב)",
      description:
        "מדריך פשוט, שלב אחרי שלב, ליצירת ספר סיפורי תורה מותאם אישית שבו הילד שלכם הוא הגיבור — מהעלאת תמונה ועד בחירת הפרשה, השפה ופורמט הספר.",
      excerpt:
        "מתמונה אחת ועד מזכרת מודפסת — כך בדיוק הופכים את הילד שלכם לגיבור של הרפתקת התורה שלו, עם צילומי מסך אמיתיים של כל שלב.",
      date: "3 ביולי 2026",
      bodyHtml: `
      <p>ספר תורה מותאם אישית מכניס את <strong>הילד שלכם</strong> אל תוך פרשת השבוע — הוא חוצה את ים סוף, עומד למרגלות הר סיני, ומקבל את פני המלאכים יחד עם אברהם אבינו. כך לימוד הפרשה הופך למשהו שהילד באמת מחכה לו. הנה כל התהליך, שלב אחרי שלב, עם צילומי מסך אמיתיים מתוך יוצר הספרים של טורה־טייל.</p>

      <h2>שלב 1 — הזינו את שם הילד</h2>
      <p>מתחילים בלספר לנו למי הספר. הקלידו את שם הילד — זה השם שיופיע לאורך כל הסיפור ועל הכריכה. יוצרים ספר לכמה אחים? אפשר להוסיף עד ארבעה ילדים לאותו ספר, וכל אחד מהם יופיע באיורים.</p>
      ${SHOT("step-1-name-he.jpg", "שלב 1 — הזנת שם הילד", "שלב 1 ביוצר הספרים — כל ספר מתחיל בשם.", true)}

      <h2>שלב 2 — בן או בת</h2>
      <p>לחיצה אחת. כך אנחנו מוודאים שהדמות, הלבוש ופרטי העלילה מתאימים בדיוק לילד שלכם.</p>
      ${SHOT("step-2-gender-he.jpg", "שלב 2 — בחירת בן או בת", "", true)}

      <h2>שלב 3 — בני כמה הם?</h2>
      <p>קבעו את גיל הילד (1–15). הגיל משפיע על אופן ציור הדמות, וגם עוזר לנו להמליץ בהמשך על הפורמט הנכון — ספרי קרטון עמידים לפעוטות, וספרי תמונות גדולים יותר לילדים גדולים.</p>
      ${SHOT("step-3-age-he.jpg", "שלב 3 — קביעת גיל הילד", "", true)}

      <h2>שלב 4 — העלו תמונה</h2>
      <p>כאן מתחיל הקסם. העלו תמונה אחת ברורה, מחייכת ומול המצלמה — אנחנו משתמשים בה כדי ליצור דמות מאוירת שנראית בדיוק כמו הילד שלכם בכל עמוד. המסך מראה לכם בדיוק מה עובד הכי טוב: תמונה ברורה מלפנים — מושלם; תמונות בפרופיל או תמונות קבוצתיות — לא יעבדו. כלי חיתוך מובנה עוזר למקם את הפנים בדיוק במרכז.</p>
      ${SHOT("step-4-photo-he.jpg", "שלב 4 — העלאת תמונה עם מדריך לתמונות שעובדות הכי טוב", "מדריך התמונות — תמונה אחת ברורה מלפנים וזה הכל.", true)}

      <h2>שלב 5 — בחרו את הסיפור</h2>
      <p><strong>פרשת השבוע</strong> מוצעת אוטומטית, כולל ספירה לאחור חיה עד הפרשה הבאה — מושלם להכנה לשבת, ובשבוע של פרשה כפולה (כמו מטות־מסעי) הספר מכסה את שתיהן יחד. רוצים משהו אחר? לחצו על "בחרו סיפור אחר" ועיינו בכל התנ"ך — חומש, נביאים, כתובים, מגילות וסיפורי ימים טובים לראש השנה, חנוכה, פורים, פסח ועוד.</p>
      ${SHOT("step-5-story-he.jpg", "שלב 5 — בחירת פרשת השבוע או עיון בכל התנ״ך", "פרשת השבוע נבחרת אוטומטית — או שמעיינים בכל התנ״ך.", true)}

      <h2>שלב 6 — בחרו שפה</h2>
      <p>ספרי טורה־טייל זמינים <strong>בעברית, באנגלית וביידיש</strong>. בחרו שפה אחת — או סמנו יותר מאחת אם תרצו את הסיפור בכמה שפות.</p>
      ${SHOT("step-6-language-he.jpg", "שלב 6 — בחירת עברית, אנגלית או יידיש", "", true)}


      <h2>שלב 7 — סקירה ויצירה</h2>
      <p>מבט אחרון: שם, גיל, סיפור ותוכנית — הכל במסך אחד. כל ספר מאויר בסגנון החתימה שלנו — תלת־ממד באיכות פיקסאר וברזולוציה גבוהה במיוחד, עם סצנות באיכות קולנועית בכל עמוד. לחצו על "צור את הספר שלי" ואנחנו מתחילים לכתוב ולאייר סיפור שלם שבו הילד שלכם הוא הגיבור, כשאירועי הפרשה האמיתיים מתגלגלים עמוד אחרי עמוד ולקח ברור במידות שזור לכל אורכו. כל ספר נוצר בליווי רבני קפדני ובצניעות מלאה, והצוות שלנו עובר עליו אישית לפני שהוא יוצא להדפסה — כך שתוכלו למסור אותו לילד בלב שקט. כשהספר יוצא למשלוח תקבלו הצצה מהירה אליו למייל.</p>
      ${SHOT("step-8-review-he.jpg", "שלב 8 — מסך הסקירה לפני יצירת הספר", "בדיקה אחרונה לפני שהספר שלכם נוצר.", true)}

      <h2>שלב 8 — בחרו את פורמט הספר (אל תוותרו על חוברת הצביעה!)</h2>
      <p>אחרי פתיחת חשבון חינם, בחרו איך הסיפור שלכם יודפס:</p>
      <ul>
        <li><strong>ספר בכריכה רכה (8″×8″)</strong> — קלאסי ומשתלם, על נייר סמי־גלוסי חלק. מומלץ לגילאי 4–8.</li>
        <li><strong>ספר בכריכה קשה (8″×8″)</strong> — כריכה איכותית עם עמודים שנפתחים בשטוח, לבחירתכם <strong>מרובע או לרוחב</strong>. המתנה הפופולרית ביותר, לגילאי 5–12.</li>
        <li><strong>ספר קרטון (6″×6″)</strong> — עמודי קרטון עבים עם פינות מעוגלות ובטוחות, בנוי לידיים הקטנות ביותר (גילאי 2–4).</li>
        <li><strong>תוספת חוברת צביעה (8.5″×11″)</strong> — חוברת צביעה תואמת של אותו סיפור בקווי מתאר בשחור־לבן, כדי שהילד יצבע בעצמו את ההרפתקה שלו. זו תוספת אופציונלית לכל פורמט — ואחת התוספות האהובות ביותר.</li>
      </ul>
      ${PRODUCT_GRID_HE}

      <h2>שלב 9 — הזמינו (פעם אחת, או במנוי)</h2>
      <p>במסך ההזמנה בוחרים איך תרצו לקבל ספרים: <strong>ספר בודד</strong>, או מנוי — <strong>שבועי</strong> (ספר פרשה חדש לכל שבת), <strong>חודשי</strong> (4 ספרים בחודש — הפופולרי ביותר), או <strong>חבילה שנתית</strong> עם חודשיים מתנה. משלוח רגיל חינם (5–7 ימי עסקים); משלוח מהיר (2–3 ימי עסקים) זמין בתוספת, ואנחנו שולחים לכל העולם.</p>
      ${SHOT("step-11-order-he.jpg", "סיכום ההזמנה — ספר בודד או מנוי שבועי, חודשי ושנתי", "ספר אחד או הרגל תורה שבועי — אתם בוחרים בסוף.", true)}

      <h2>מוכנים להתחיל?</h2>
      <p>כל התהליך אורך כחמש דקות. <a href="/create">צרו עכשיו את ספר התורה של ילדכם</a>, או עיינו <a href="/pricing">במחירים ובאפשרויות המנוי</a>. לא בטוחים איזה סיפור לבחור? קראו <a href="/blog/how-to-choose-the-weekly-parsha-for-your-childs-book">איך בוחרים את פרשת השבוע לספר של הילד</a>.</p>
      `,
    },
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
    he: {
      title: "איך בוחרים את פרשת השבוע לספר של הילד שלכם",
      description:
        "לבחור את פרשת השבוע, את פרשת בר/בת המצווה, או סיפור אהוב? מדריך מעשי לבחירת פרשת התורה הנכונה לספר מותאם אישית.",
      excerpt:
        "פרשת השבוע, פרשת יום ההולדת, או הסיפור שהילד כבר אוהב — כך בוחרים פרשה שתהפוך את הספר למיוחד באמת.",
      date: "2 ביולי 2026",
      bodyHtml: `
      <p>אחד הדברים הכי יפים בספר תורה מותאם אישית הוא ש<em>אתם</em> בוחרים את הסיפור. הנה הדרכים הפופולריות ביותר שבהן משפחות בוחרות פרשה — ואיך תדעו מה מתאים לילד שלכם.</p>
      ${SHOT("step-5-story-he.jpg", "בוחר הסיפורים של טורה-טייל עם פרשת השבוע שנבחרה אוטומטית", "בוחר הסיפורים האמיתי — פרשת השבוע מוצעת אוטומטית, עם ספירה לאחור חיה.", true)}

      <h2>אפשרות 1 — פרשת השבוע</h2>
      <p>הבחירה הפשוטה והפופולרית ביותר. ללמוד את הפרשה שהילד שומע בחיידר או בבית יעקב השבוע ממש — גורם לספר להרגיש חי ורלוונטי. טורה־טייל מציע אוטומטית את הפרשה הנוכחית ומרענן אותה מדי שבוע, כך שאתם תמיד מסונכרנים עם הקריאה.</p>

      <h2>אפשרות 2 — פרשה "אישית" ומשמעותית</h2>
      <p>יש פרשות שנושאות משמעות מיוחדת לילד:</p>
      <ul>
        <li><strong>פרשת בר/בת המצווה</strong> — מזכרת יקרה בדרך אל השמחה.</li>
        <li><strong>הפרשה של שבוע יום ההולדת או האפשערן.</strong></li>
        <li><strong>הפרשה שעל שמה הילד נקרא</strong> (למשל ילד שנקרא על שם דמות או אירוע בסדרה).</li>
      </ul>

      <h2>אפשרות 3 — סיפור שהילד כבר אוהב</h2>
      <p>אם הילד שלכם מוקסם מנח והתיבה, מיוסף וכתונת הפסים, או מיונה והדג הגדול — לכו על זה. ילד שכבר אוהב את הסיפור יקרא את הספר שוב ושוב. בבוחר הסיפורים, לחצו על "בחרו סיפור אחר" ועיינו בכל התנ"ך — חומש, נביאים, כתובים ומגילות.</p>

      <h2>ומה עם פרשות כפולות?</h2>
      <p>בשבועות שבהם קוראים שתי פרשות יחד — כמו חוקת־בלק או מטות־מסעי — טורה־טייל יוצר ספר אחד שמכסה את <strong>שתי</strong> הפרשות, עם התייחסות מאוזנת לאירועים המרכזיים של כל אחת. מזכרת שלמה אחת לכל קריאת השבוע.</p>

      <h2>חגים וימים טובים</h2>
      <p>מעבר לפרשת השבוע, אפשר לבנות ספר סביב ראש השנה, חנוכה, פורים, פסח ועוד — דרך נפלאה להכין ילד ליום טוב.</p>

      <h2>עדיין מתלבטים?</h2>
      <p>אי אפשר לטעות. כשלא בטוחים, התחילו עם <a href="/create">פרשת השבוע</a> — היא נבחרת עבורכם אוטומטית. חדשים בתהליך? קראו את <a href="/blog/how-to-create-a-personalized-torah-storybook">המדריך שלנו, שלב אחרי שלב, ליצירת ספר תורה מותאם אישית</a>.</p>
      `,
    },
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
    he: {
      title: "המתנות היהודיות המותאמות אישית הטובות ביותר לילדים (ימי הולדת, אפשערן וימים טובים)",
      description:
        "מחפשים מתנה יהודית משמעותית לילד? ספרי תורה מותאמים אישית הם מתנה בלתי נשכחת ליום הולדת, אפשערן, בר/בת מצווה או כל יום טוב.",
      excerpt:
        "מתנה שמלמדת תורה, חוגגת את הילד ונשארת לשנים — למה ספר מותאם אישית מנצח עוד צעצוע בשמחה הבאה.",
      date: "2 ביולי 2026",
      bodyHtml: `
      <p>למצוא מתנה יהודית שהיא גם משמעותית, גם נשארת לאורך זמן וגם באמת מרגשת ילד — זה לא פשוט. צעצועים נשכחים תוך שבוע; ספר תורה מותאם אישית — שבו הילד הוא <strong>גיבור הפרשה</strong> — הופך למזכרת יקרה. הנה מתי הוא זורח במיוחד.</p>
      ${PRODUCT_GRID_HE}

      <h2>ימי הולדת</h2>
      <p>במקום עוד צעצוע, תנו ספר שבו ילד יום ההולדת מככב בתוך הרפתקת תורה. בחרו את הסיפור האהוב עליו או את פרשת שבוע יום ההולדת לנגיעה אישית במיוחד — והוסיפו את <strong>חוברת הצביעה</strong> התואמת, כדי שהכיף יימשך גם אחרי שהסיפור נקרא.</p>

      <h2>אפשערן</h2>
      <p>התספורת הראשונה של ילד היא אבן דרך יפהפייה בכניסה ללימוד התורה. ספר מותאם אישית שבו הוא מופיע — כולל הפאות — סביב פרשה, הוא מזכרת מתאימה להפליא ליום הזה. פורמט ספר הקרטון העמיד מושלם לידיים של בן שלוש.</p>

      <h2>בר ובת מצווה</h2>
      <p>ספר בכריכה קשה שנבנה סביב <strong>פרשת בר או בת המצווה</strong> של הילד, כשהוא הגיבור — זו מתנה שנשארת לכל החיים. מושלם מסבא וסבתא, דוד או דודה, או מלמד.</p>

      <h2>ימים טובים</h2>
      <p>ראש השנה, חנוכה, פורים, פסח — ספר יום טוב מותאם אישית עוזר לילד להרגיש את החג ונותן לו משהו מיוחד לקרוא ליד השולחן. בניית סדרה לאורך השנה יוצרת ספרייה משפחתית נהדרת — <a href="/pricing">המנויים השבועיים והחודשיים</a> עושים בדיוק את זה, אוטומטית.</p>

      <h2>למה זו מתנה טובה יותר</h2>
      <ul>
        <li><strong>היא מלמדת תורה</strong> — הילד סופג את הפרשה תוך כדי הנאה.</li>
        <li><strong>היא אישית באמת</strong> — השם שלו, הפנים שלו, הסיפור שלו — בעברית, באנגלית או ביידיש.</li>
        <li><strong>היא נשארת</strong> — מזכרת מודפסת בכריכה רכה, קשה או ספר קרטון, לא צעצוע חולף.</li>
        <li><strong>היא נעשית באהבה וביראת שמים</strong> — כל ספר נוצר בליווי רבני קפדני ובצניעות מלאה.</li>
      </ul>

      <h2>תנו מתנה כזו היום</h2>
      <p><a href="/create">צרו ספר תורה מותאם אישית</a> כמתנה בכחמש דקות, או עיינו <a href="/pricing">במחירים ובאפשרויות המתנה</a>. פעם ראשונה? התחילו עם <a href="/blog/how-to-create-a-personalized-torah-storybook">המדריך שלנו, שלב אחרי שלב</a>.</p>
      `,
    },
  },
];

export const getArticle = (slug) => ARTICLES.find((a) => a.slug === slug);

/**
 * Returns the article with reader-facing fields swapped for the requested
 * language. Hebrew and Yiddish both get the Hebrew version; anything else
 * (or a missing translation) falls back to English.
 */
export const localizeArticle = (article, lang) => {
  if (!article) return article;
  if ((lang === "he" || lang === "yi") && article.he) {
    return {
      ...article,
      title: article.he.title,
      description: article.he.description,
      excerpt: article.he.excerpt,
      date: article.he.date,
      bodyHtml: article.he.bodyHtml,
    };
  }
  return article;
};
