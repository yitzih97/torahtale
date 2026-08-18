// Hand-authored evergreen guide. See ./shared.mjs for the figure helpers.
import { SHOT, PRODUCT_GRID, PRODUCT_GRID_HE } from "../shared.mjs";

export default {
  slug: "how-to-choose-the-weekly-parsha-for-your-childs-book",
  title: "How to Choose the Weekly Parsha for Your Child's Book",
  description:
    "Should you pick this week's parsha, your child's bar/bas mitzvah parsha, or a favorite story? A practical guide to choosing the right Torah portion for a personalized book.",
  excerpt:
    "This week's parsha, a birthday parsha, or the story your child already loves — here's how to choose a portion that will make the book truly special.",
  date: "July 2, 2026",
  dateISO: "2026-07-02",
  readingMins: 5,
  category: "guide",
  keywords: [
    "which parsha for a personalized book",
    "weekly parsha for kids",
    "bar mitzvah parsha gift",
    "double parsha",
    "personalized Torah book",
  ],
  keyFacts: [
    "Most families pick <strong>this week's parsha</strong> — Torah Tale selects it automatically and refreshes it every week.",
    "The other two popular choices are a <strong>personal parsha</strong> (bar/bas mitzvah, birthday, upsherin week) and a <strong>story the child already loves</strong>.",
    "On a double-parsha week the book covers <strong>both</strong> parshiyos in one story.",
    "Beyond the weekly parsha you can choose any story in Tanach — Chumash, Nevi'im, Kesuvim, Megillos — or a Yom Tov.",
  ],
  faq: [
    {
      q: "Which parsha should I pick for my child's first book?",
      a: "Start with this week's parsha. It's selected for you automatically, it matches what your child is learning in cheder or Bais Yaakov right now, and it makes the book feel immediately relevant.",
    },
    {
      q: "Can I make a book for my child's bar mitzvah parsha?",
      a: "Yes. Choose \"a different story\" in the story picker and select the parsha of the bar or bas mitzvah. A hardcover book built around that sedra, with the child as the hero, is one of the most popular gifts we print.",
    },
    {
      q: "What happens on a double-parsha week like Matos-Masei?",
      a: "Torah Tale creates a single book covering both parshiyos, with balanced attention to the key events of each — one complete keepsake for the full week's leining.",
    },
    {
      q: "Can I choose a story that isn't a parsha at all?",
      a: "Yes. The story picker includes all of Nevi'im and Kesuvim, the five Megillos, Yamim Tovim (Rosh Hashanah, Chanukah, Purim, Pesach and more), and middos stories set in everyday life.",
    },
  ],
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
    keyFacts: [
      "רוב המשפחות בוחרות ב<strong>פרשת השבוע</strong> — טורה־טייל בוחר אותה אוטומטית ומרענן אותה כל שבוע.",
      "שתי הבחירות הפופולריות הנוספות הן <strong>פרשה אישית</strong> (בר/בת מצווה, יום הולדת, שבוע האפשערן) ו<strong>סיפור שהילד כבר אוהב</strong>.",
      "בשבוע של פרשה כפולה הספר מכסה את <strong>שתי</strong> הפרשות בסיפור אחד.",
      "מעבר לפרשת השבוע אפשר לבחור כל סיפור בתנ״ך — חומש, נביאים, כתובים, מגילות — או יום טוב.",
    ],
    faq: [
      {
        q: "איזו פרשה לבחור לספר הראשון של הילד?",
        a: "התחילו עם פרשת השבוע. היא נבחרת עבורכם אוטומטית, היא בדיוק מה שהילד לומד עכשיו בחיידר או בבית יעקב, וזה גורם לספר להרגיש רלוונטי מיד.",
      },
      {
        q: "אפשר ליצור ספר לפרשת בר המצווה?",
        a: "בהחלט. בחרו ״בחרו סיפור אחר״ בבוחר הסיפורים ולחצו על פרשת בר או בת המצווה. ספר בכריכה קשה סביב אותה סדרה, כשהילד הוא הגיבור, הוא אחת המתנות המבוקשות ביותר שלנו.",
      },
      {
        q: "מה קורה בשבוע של פרשה כפולה כמו מטות־מסעי?",
        a: "טורה־טייל יוצר ספר אחד שמכסה את שתי הפרשות, עם התייחסות מאוזנת לאירועים המרכזיים של כל אחת — מזכרת שלמה אחת לכל קריאת השבוע.",
      },
      {
        q: "אפשר לבחור סיפור שהוא לא פרשה בכלל?",
        a: "כן. בוחר הסיפורים כולל את כל נביאים וכתובים, חמש המגילות, ימים טובים (ראש השנה, חנוכה, פורים, פסח ועוד) וסיפורי מידות מחיי היום־יום.",
      },
    ],
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
};
