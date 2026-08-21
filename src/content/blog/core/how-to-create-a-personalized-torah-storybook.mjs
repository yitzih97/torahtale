// Hand-authored step-by-step guide. See ./shared.mjs for the figure helpers.
//
// The screenshots are captured from the real wizard by
// scripts/capture-wizard-shots.mjs - re-run it (and re-read this article)
// whenever the creation flow changes.
import { SHOT, PRODUCT_GRID, PRODUCT_GRID_HE } from "../shared.mjs";

export default {
  slug: "how-to-create-a-personalized-torah-storybook",
  title: "How to Create a Personalized Torah Storybook for Your Child (Step by Step)",
  description:
    "A step-by-step walkthrough of making a custom Torah storybook that stars your own child - name, photo, parsha, language, and printed format - with real screenshots of every screen.",
  excerpt:
    "From a single photo to a printed keepsake - here is exactly how to turn your child into the hero of their own Torah adventure, with real screenshots of every step.",
  date: "August 18, 2026",
  dateISO: "2026-08-18",
  updatedISO: "2026-08-18",
  readingMins: 7,
  category: "guide",
  keywords: [
    "personalized Torah storybook",
    "custom Jewish children's book",
    "how to make a parsha book",
    "personalized book with my child's photo",
    "Torah Tale how it works",
  ],
  keyFacts: [
    "Making a book takes about <strong>five minutes</strong> and eight short questions: name, boy or girl, age, one photo, siblings, story, language, and printed format.",
    "You need a <strong>free account</strong> before the book creator opens - every step is saved as you go, so you can leave and come back.",
    "The story picker offers <strong>next week's parsha</strong> by default, with a countdown to the order deadline for delivery before Shabbos, or you can browse all of Tanach, the Yamim Tovim and middos stories.",
    "Books print as a <strong>softcover or hardcover 8″×8″, or a board book 6″×6″</strong>, with an optional matching coloring book, in English, Hebrew or Yiddish.",
    "Your child's likeness comes from <strong>one clear, front-facing photo</strong>, cropped in the built-in crop tool.",
  ],
  faq: [
    {
      q: "How long does it take to make a personalized Torah storybook?",
      a: "About five minutes. There are eight short questions - name, gender, age, photo, siblings, story, language, and book format - and each answer is saved as you go, so you can stop and pick it up later.",
    },
    {
      q: "Do I need an account to create a book?",
      a: "Yes. The book creator opens after you sign in with a free account, which is what lets us save your progress, keep your child's details for the next book, and attach the order to you.",
    },
    {
      q: "What kind of photo works best?",
      a: "One clear, front-facing, smiling photo with the face well lit - the same photo you would send to a grandparent. Group shots, profiles, sunglasses and hats make it harder to draw a likeness that looks like your child. A crop tool opens right after you upload so you can frame the face.",
    },
    {
      q: "Can I put more than one child in the same book?",
      a: "Yes, up to four. After the photo step the wizard asks whether you want to add another child, and each one you add appears in the illustrations.",
    },
    {
      q: "Which parsha does it suggest?",
      a: "Next week's parsha, not this week's - with a live countdown showing how long you have to order for the book to be printed and delivered before that Shabbos. You can pick any other story instead.",
    },
    {
      q: "When do I choose hardcover, softcover or board book?",
      a: "After the language step, on the \"Choose Your Book\" screen. It recommends a format based on the age you entered, shows the size and price of each, and lets you add the matching coloring book.",
    },
  ],
  bodyHtml: `
      <p>A personalized Torah storybook puts <strong>your own child</strong> inside a real Torah story - walking through the split sea, standing at Har Sinai, greeting the malachim with Avraham Avinu. It turns parsha learning into something a child looks forward to. Below is the whole process, screen by screen, with real screenshots from the Torah Tale book creator.</p>

      <h2>First: sign in</h2>
      <p>The book creator sits behind a free account, so the first thing you'll see is a sign-in screen. Creating the account takes a few seconds, and it's what lets us save your answers as you go, remember your child's details for the next book, and tie the finished book to your order. Come back a week later and your child is already there - the next book takes a fraction of the time.</p>

      <h2>Step 1 - Enter your child's name</h2>
      <p>Type your child's name. This is the name that appears throughout the story and on the cover.</p>
      ${SHOT("step-1-name.jpg", "Wizard step 1 - entering the child's name", "Every book starts with a name.")}

      <h2>Step 2 - Boy or girl</h2>
      <p>One tap. This sets the character, the clothing and the storyline details correctly for your child.</p>
      ${SHOT("step-2-gender.jpg", "Wizard step 2 - choosing boy or girl")}

      <h2>Step 3 - How old are they?</h2>
      <p>Tap up or down to your child's age, anywhere from 0 to 15. The age does two jobs: it shapes how the character is drawn and how the story is written, and it drives the format recommendation later on - sturdy board books for toddlers, bigger photo books for older children.</p>
      ${SHOT("step-3-age.jpg", "Wizard step 3 - setting the child's age with the age stepper")}

      <h2>Step 4 - Upload a photo</h2>
      <p>This is where the magic starts. Upload one clear, smiling, front-facing photo - we use it to create an illustrated character who looks like your child on every page. The screen shows you exactly what works: clear and front-facing is perfect; photos facing away, group shots and heavy shadows are not.</p>
      ${SHOT("step-4-photo.jpg", "Wizard step 4 - photo upload with a guide showing which photos work best", "The photo guide - one clear, front-facing photo is all it takes.")}
      <p>As soon as you choose a photo, a crop tool opens. Drag to reposition, pinch or use the slider to zoom, and put the face inside the circle.</p>
      ${SHOT("step-4-crop.jpg", "The built-in crop tool, with the child's face framed in a circle", "The built-in crop tool - frame the face and tap Use Photo.")}

      <h2>Step 5 - Any brothers or sisters?</h2>
      <p>Next you're asked whether to add another child. You can put <strong>up to four children</strong> in the same book, and each one appears in the illustrations - which is what makes a single book work for a whole family rather than starting an argument. Adding a sibling loops you back through name, gender, age and photo for that child.</p>
      ${SHOT("step-7-add-child.jpg", "The add-another-child step, showing the children added so far", "Up to four children can share one book.")}

      <h2>Step 6 - Choose the story</h2>
      <p><strong>Next week's parsha</strong> is offered first, with a live countdown - "order within 1d 13h 52m for delivery before next week's Shabbos". That deadline is real: it's the time we need to write, illustrate, print and ship the book so it's on your table for that Shabbos. On a double-parsha week (like Matos-Masei), the book covers both together.</p>
      ${SHOT("step-5-story.jpg", "Wizard step 6 - next week's parsha offered with a countdown to the order deadline", "Next week's parsha, with the order-by countdown.")}
      <p>Want something else? Tap <strong>"Choose a different story"</strong> and browse the six collections: Torah, Nevi'im, Kesuvim, Megillos, Yamim Tovim, and Educational Stories - the middos stories set in everyday life, like saying thank you, making peace with a friend, or giving tzedakah.</p>
      ${SHOT("step-5-browse.jpg", "The category browser - Torah, Nevi'im, Kesuvim, Megillos, Yamim Tovim and Educational Stories", "The whole library: Tanach, Yom Tov, and middos stories.")}

      <h2>Step 7 - Pick the language</h2>
      <p>Torah Tale books come in <strong>English, Hebrew and Yiddish</strong>, and you can select up to two - useful for a bilingual home, or for grandparents who'd rather read it in Yiddish.</p>
      ${SHOT("step-6-language.jpg", "Wizard step 7 - choosing English, Hebrew or Yiddish", "Up to two languages per book.")}

      <h2>Step 8 - Choose your book (don't skip the coloring book!)</h2>
      <p>Last question: how the story gets printed. The screen recommends a format for the age you entered and shows the size and price of each.</p>
      ${SHOT("step-9-format.jpg", "The Choose Your Book screen with softcover, hardcover, board book and coloring book options", "Formats, sizes and prices - with a recommendation for your child's age.")}
      <ul>
        <li><strong>Softcover Photo Book (8″×8″)</strong> - classic and affordable, on smooth semi-gloss paper. Recommended for ages 4-8.</li>
        <li><strong>Hardcover Photo Book (8″×8″)</strong> - premium case-wrap binding with lay-flat pages. The most popular gift option, for ages 5-12.</li>
        <li><strong>Board Book (6″×6″)</strong> - thick chipboard pages with rounded safety corners, built for the littlest hands (ages 2-4).</li>
        <li><strong>Coloring Book add-on (8.5″×11″)</strong> - the same story in black-and-white line art, so your child can color their own adventure. Optional with any format, and one of the most-loved extras.</li>
      </ul>
      ${PRODUCT_GRID}

      <h2>Step 9 - Checkout, once or by subscription</h2>
      <p>At checkout you choose how you'd like to receive books: a <strong>single custom book</strong>, or a subscription - the <strong>Parsha Series</strong> (4 books a month, shipped together in one delivery) or a <strong>Year Bundle</strong>. US standard shipping is $3.00 (5-8 business days) and express is $6.00 (3 business days); we ship worldwide, with rates shown at checkout. See <a href="/pricing">pricing and subscription options</a> for the current plans.</p>

      <h2>What happens after you order</h2>
      <p>Your book is written and illustrated in our signature high-resolution 3D Pixar style, with the actual events of the story unfolding page by page and a clear middos lesson woven through. Every book is created with careful rabbinical guidance and strict tznius, and <strong>our team personally reviews it before it goes to print</strong> - so you can hand it to your child with confidence. You'll get an email when it ships, with tracking.</p>

      <h2>Ready to start?</h2>
      <p>The whole process takes about five minutes. <a href="/create">Create your child's Torah storybook</a> now, or see <a href="/pricing">pricing and subscription options</a>. Not sure which story to pick? Read <a href="/blog/how-to-choose-the-weekly-parsha-for-your-childs-book">how to choose the weekly parsha for your child's book</a>, or browse <a href="/blog/best-personalized-jewish-gifts-for-kids">gift ideas for birthdays, an upsherin and Yom Tov</a>.</p>
    `,
  he: {
    title: "איך יוצרים ספר תורה מותאם אישית לילד שלכם (שלב אחרי שלב)",
    description:
      "מדריך מסך אחרי מסך ליצירת ספר סיפורי תורה מותאם אישית שבו הילד שלכם הוא הגיבור - שם, תמונה, פרשה, שפה ופורמט הדפסה, עם צילומי מסך אמיתיים.",
    excerpt:
      "מתמונה אחת ועד מזכרת מודפסת - כך בדיוק הופכים את הילד שלכם לגיבור של הרפתקת התורה שלו, עם צילומי מסך אמיתיים של כל שלב.",
    date: "18 באוגוסט 2026",
    keyFacts: [
      "יצירת ספר לוקחת <strong>כחמש דקות</strong> ושמונה שאלות קצרות: שם, בן או בת, גיל, תמונה אחת, אחים, סיפור, שפה ופורמט הדפסה.",
      "צריך <strong>חשבון חינם</strong> כדי שיוצר הספרים ייפתח - כל שלב נשמר תוך כדי, כך שאפשר לצאת ולחזור.",
      "בוחר הסיפורים מציע כברירת מחדל את <strong>פרשת השבוע הבא</strong>, עם ספירה לאחור עד מועד ההזמנה האחרון למשלוח לפני שבת - או שמעיינים בכל התנ״ך, בימים הטובים ובסיפורי המידות.",
      "הספרים מודפסים ב<strong>כריכה רכה או קשה 8″×8″, או כספר קרטון 6″×6″</strong>, עם חוברת צביעה תואמת כתוספת, בעברית, אנגלית או יידיש.",
      "דמות הילד נוצרת מ<strong>תמונה אחת ברורה מלפנים</strong>, שנחתכת בכלי החיתוך המובנה.",
    ],
    faq: [
      {
        q: "כמה זמן לוקח ליצור ספר תורה מותאם אישית?",
        a: "כחמש דקות. יש שמונה שאלות קצרות - שם, מין, גיל, תמונה, אחים, סיפור, שפה ופורמט - וכל תשובה נשמרת תוך כדי, כך שאפשר לעצור ולהמשיך אחר כך.",
      },
      {
        q: "צריך חשבון כדי ליצור ספר?",
        a: "כן. יוצר הספרים נפתח אחרי כניסה עם חשבון חינם, וזה מה שמאפשר לשמור את ההתקדמות, לזכור את פרטי הילד לספר הבא ולקשר את ההזמנה אליכם.",
      },
      {
        q: "איזו תמונה עובדת הכי טוב?",
        a: "תמונה אחת ברורה, מחייכת ומול המצלמה, עם תאורה טובה על הפנים - בדיוק כמו תמונה שהייתם שולחים לסבתא. תמונות קבוצתיות, פרופיל, משקפי שמש וכובעים מקשים על יצירת דמיון אמיתי. מיד אחרי ההעלאה נפתח כלי חיתוך למיקום הפנים.",
      },
      {
        q: "אפשר להכניס יותר מילד אחד לאותו ספר?",
        a: "כן, עד ארבעה. אחרי שלב התמונה נשאלים אם להוסיף עוד ילד, וכל ילד שמוסיפים מופיע באיורים.",
      },
      {
        q: "איזו פרשה מוצעת?",
        a: "פרשת השבוע הבא, לא של השבוע הנוכחי - עם ספירה לאחור חיה שמראה כמה זמן נשאר להזמין כדי שהספר יודפס ויגיע לפני אותה שבת. אפשר כמובן לבחור כל סיפור אחר.",
      },
      {
        q: "מתי בוחרים כריכה קשה, רכה או ספר קרטון?",
        a: "אחרי שלב השפה, במסך ״בחרו את הספר שלכם״. המסך ממליץ על פורמט לפי הגיל שהזנתם, מציג את הגודל והמחיר של כל אחד, ומאפשר להוסיף את חוברת הצביעה התואמת.",
      },
    ],
    bodyHtml: `
      <p>ספר תורה מותאם אישית מכניס את <strong>הילד שלכם</strong> אל תוך סיפור תורה אמיתי - הוא חוצה את ים סוף, עומד למרגלות הר סיני, ומקבל את פני המלאכים יחד עם אברהם אבינו. כך לימוד הפרשה הופך למשהו שהילד מחכה לו. הנה כל התהליך, מסך אחרי מסך, עם צילומי מסך אמיתיים מתוך יוצר הספרים של טורה־טייל.</p>

      <h2>קודם כול: כניסה לחשבון</h2>
      <p>יוצר הספרים נמצא מאחורי חשבון חינם, ולכן הדבר הראשון שתראו הוא מסך כניסה. פתיחת החשבון אורכת כמה שניות, והיא זו שמאפשרת לשמור את התשובות תוך כדי, לזכור את פרטי הילד לספר הבא ולקשר את הספר המוגמר להזמנה שלכם. תחזרו בעוד שבוע - הילד כבר שם, והספר הבא ייקח חלק קטן מהזמן.</p>

      <h2>שלב 1 - הזינו את שם הילד</h2>
      <p>הקלידו את שם הילד. זה השם שיופיע לאורך כל הסיפור ועל הכריכה.</p>
      ${SHOT("step-1-name-he.jpg", "שלב 1 - הזנת שם הילד", "כל ספר מתחיל בשם.", true)}

      <h2>שלב 2 - בן או בת</h2>
      <p>לחיצה אחת. כך הדמות, הלבוש ופרטי העלילה מתאימים בדיוק לילד שלכם.</p>
      ${SHOT("step-2-gender-he.jpg", "שלב 2 - בחירת בן או בת", "", true)}

      <h2>שלב 3 - בני כמה הם?</h2>
      <p>לוחצים למעלה או למטה עד לגיל הילד, בין 0 ל־15. לגיל שני תפקידים: הוא מעצב את אופן ציור הדמות ואת אופן כתיבת הסיפור, והוא זה שמניע בהמשך את המלצת הפורמט - ספרי קרטון עמידים לפעוטות, ספרי תמונות גדולים יותר לילדים גדולים.</p>
      ${SHOT("step-3-age-he.jpg", "שלב 3 - קביעת גיל הילד", "", true)}

      <h2>שלב 4 - העלו תמונה</h2>
      <p>כאן מתחיל הקסם. העלו תמונה אחת ברורה, מחייכת ומול המצלמה - ממנה נוצרת דמות מאוירת שנראית כמו הילד שלכם בכל עמוד. המסך מראה בדיוק מה עובד: תמונה ברורה מלפנים - מושלם; תמונות בפרופיל, תמונות קבוצתיות וצללים כבדים - לא.</p>
      ${SHOT("step-4-photo-he.jpg", "שלב 4 - העלאת תמונה עם מדריך לתמונות שעובדות הכי טוב", "מדריך התמונות - תמונה אחת ברורה מלפנים וזה הכל.", true)}
      <p>ברגע שבוחרים תמונה נפתח כלי חיתוך. גוררים למיקום, מקרבים עם המחוון, וממקמים את הפנים בתוך העיגול.</p>
      ${SHOT("step-4-crop-he.jpg", "כלי החיתוך המובנה, עם פני הילדה בתוך העיגול", "כלי החיתוך המובנה - ממקמים את הפנים ולוחצים ״שימוש בתמונה״.", true)}

      <h2>שלב 5 - יש אחים ואחיות?</h2>
      <p>עכשיו נשאלים אם להוסיף עוד ילד. אפשר להכניס <strong>עד ארבעה ילדים</strong> לאותו ספר, וכל אחד מהם מופיע באיורים - וזה מה שהופך ספר אחד למשהו שעובד לכל המשפחה במקום להתחיל ויכוח. הוספת אח מחזירה אתכם לשם, מין, גיל ותמונה עבורו.</p>
      ${SHOT("step-7-add-child-he.jpg", "שלב הוספת ילד נוסף, עם הילדים שנוספו עד כה", "עד ארבעה ילדים בספר אחד.", true)}

      <h2>שלב 6 - בחרו את הסיפור</h2>
      <p><strong>פרשת השבוע הבא</strong> מוצעת ראשונה, עם ספירה לאחור חיה - ״הזמינו תוך יום ו־13 שעות למשלוח לפני שבת הבאה״. זה מועד אמיתי: זהו הזמן שאנחנו צריכים כדי לכתוב, לאייר, להדפיס ולשלוח את הספר כך שיהיה על השולחן שלכם לאותה שבת. בשבוע של פרשה כפולה (כמו מטות־מסעי) הספר מכסה את שתיהן יחד.</p>
      ${SHOT("step-5-story-he.jpg", "שלב 6 - פרשת השבוע הבא עם ספירה לאחור עד מועד ההזמנה", "פרשת השבוע הבא, עם הספירה לאחור.", true)}
      <p>רוצים משהו אחר? לחצו על <strong>״בחרו סיפור אחר״</strong> ועיינו בשש הקטגוריות: תורה, נביאים, כתובים, מגילות, ימים טובים וסיפורים חינוכיים - סיפורי המידות מחיי היום־יום, כמו לומר תודה, לעשות שלום עם חבר או לתת צדקה.</p>
      ${SHOT("step-5-browse-he.jpg", "בוחר הקטגוריות - תורה, נביאים, כתובים, מגילות, ימים טובים וסיפורים חינוכיים", "כל הספרייה: תנ״ך, ימים טובים וסיפורי מידות.", true)}

      <h2>שלב 7 - בחרו שפה</h2>
      <p>ספרי טורה־טייל זמינים <strong>בעברית, באנגלית וביידיש</strong>, ואפשר לבחור עד שתי שפות - נוח לבית דו־לשוני, או לסבא וסבתא שיעדיפו לקרוא ביידיש.</p>
      ${SHOT("step-6-language-he.jpg", "שלב 7 - בחירת עברית, אנגלית או יידיש", "עד שתי שפות לספר.", true)}

      <h2>שלב 8 - בחרו את הספר (אל תוותרו על חוברת הצביעה!)</h2>
      <p>השאלה האחרונה: איך הסיפור יודפס. המסך ממליץ על פורמט לפי הגיל שהזנתם ומציג את הגודל והמחיר של כל אפשרות.</p>
      ${SHOT("step-9-format-he.jpg", "מסך בחירת הספר עם כריכה רכה, כריכה קשה, ספר קרטון וחוברת צביעה", "פורמטים, גדלים ומחירים - עם המלצה לפי גיל הילד.", true)}
      <ul>
        <li><strong>ספר בכריכה רכה (8″×8″)</strong> - קלאסי ומשתלם, על נייר סמי־גלוסי חלק. מומלץ לגילאי 4-8.</li>
        <li><strong>ספר בכריכה קשה (8″×8″)</strong> - כריכה איכותית עם עמודים שנפתחים בשטוח. המתנה הפופולרית ביותר, לגילאי 5-12.</li>
        <li><strong>ספר קרטון (6″×6″)</strong> - עמודי קרטון עבים עם פינות מעוגלות ובטוחות, בנוי לידיים הקטנות ביותר (גילאי 2-4).</li>
        <li><strong>תוספת חוברת צביעה (8.5″×11″)</strong> - אותו סיפור בקווי מתאר בשחור־לבן, כדי שהילד יצבע בעצמו את ההרפתקה שלו. אופציונלי לכל פורמט, ואחת התוספות האהובות ביותר.</li>
      </ul>
      ${PRODUCT_GRID_HE}

      <h2>שלב 9 - תשלום, פעם אחת או במנוי</h2>
      <p>בקופה בוחרים איך תרצו לקבל ספרים: <strong>ספר בודד</strong>, או מנוי - <strong>שבועי</strong> (ספר פרשה חדש לכל שבת), <strong>חודשי</strong> (4 ספרים בחודש - הפופולרי ביותר), או <strong>חבילה שנתית</strong>. משלוח רגיל חינם (5-7 ימי עסקים), משלוח מהיר (2-3 ימי עסקים) זמין בתוספת, ואנחנו שולחים לכל העולם. <a href="/pricing">המחירים ואפשרויות המנוי</a> מעודכנים באתר.</p>

      <h2>מה קורה אחרי ההזמנה</h2>
      <p>הספר נכתב ומאויר בסגנון החתימה שלנו - תלת־ממד באיכות פיקסאר וברזולוציה גבוהה - כשאירועי הסיפור מתגלגלים עמוד אחרי עמוד ולקח ברור במידות שזור לכל אורכו. כל ספר נוצר בליווי רבני קפדני ובצניעות מלאה, <strong>והצוות שלנו עובר עליו אישית לפני שהוא יוצא להדפסה</strong> - כך שתוכלו למסור אותו לילד בלב שקט. כשהספר יוצא למשלוח תקבלו מייל עם מעקב.</p>

      <h2>מוכנים להתחיל?</h2>
      <p>כל התהליך אורך כחמש דקות. <a href="/create">צרו עכשיו את ספר התורה של ילדכם</a>, או עיינו <a href="/pricing">במחירים ובאפשרויות המנוי</a>. לא בטוחים איזה סיפור לבחור? קראו <a href="/blog/how-to-choose-the-weekly-parsha-for-your-childs-book">איך בוחרים את פרשת השבוע לספר של הילד</a>, או עיינו <a href="/blog/best-personalized-jewish-gifts-for-kids">ברעיונות למתנה ליום הולדת, לאפשערן וליום טוב</a>.</p>
    `,
  },
};
