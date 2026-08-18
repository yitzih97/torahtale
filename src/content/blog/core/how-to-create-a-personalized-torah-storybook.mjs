// Hand-authored step-by-step guide. See ./shared.mjs for the figure helpers.
import { SHOT, PRODUCT_GRID, PRODUCT_GRID_HE } from "../shared.mjs";

export default {
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
    <p>Set your child's age (0–15). The age shapes how the character is drawn and also helps us recommend the right book format later — sturdy board books for toddlers, bigger photo books for older kids.</p>
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
    <p>קבעו את גיל הילד (0–15). הגיל משפיע על אופן ציור הדמות, וגם עוזר לנו להמליץ בהמשך על הפורמט הנכון — ספרי קרטון עמידים לפעוטות, וספרי תמונות גדולים יותר לילדים גדולים.</p>
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
};
