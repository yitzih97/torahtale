import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

const SECTIONS_EN = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "Eligibility" },
  { id: "accounts", label: "Account Registration" },
  { id: "service", label: "Service Description" },
  { id: "free-tier", label: "Free Tier & Subscriptions" },
  { id: "pricing", label: "Book Formats & Pricing" },
  { id: "payments", label: "Payments & Billing" },
  { id: "fulfillment", label: "Print & Fulfillment" },
  { id: "ip", label: "Intellectual Property" },
  { id: "user-content", label: "User Content" },
  { id: "children", label: "Children's Data" },
  { id: "ai-content", label: "AI-Generated Content" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "refunds", label: "Refunds & Cancellations" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing Law" },
  { id: "changes", label: "Changes to Terms" },
  { id: "contact", label: "Contact" },
];

const SECTIONS_HE = [
  { id: "overview", label: "סקירה כללית" },
  { id: "eligibility", label: "כשירות" },
  { id: "accounts", label: "הרשמת חשבון" },
  { id: "service", label: "תיאור השירות" },
  { id: "free-tier", label: "שכבה חינמית ומנויים" },
  { id: "pricing", label: "פורמטים ומחירים" },
  { id: "payments", label: "תשלומים וחיוב" },
  { id: "fulfillment", label: "הדפסה והפצה" },
  { id: "ip", label: "קניין רוחני" },
  { id: "user-content", label: "תוכן משתמש" },
  { id: "children", label: "נתוני ילדים" },
  { id: "ai-content", label: "תוכן שנוצר בAI" },
  { id: "acceptable-use", label: "שימוש מקובל" },
  { id: "refunds", label: "החזרות וביטולים" },
  { id: "liability", label: "הגבלת אחריות" },
  { id: "indemnification", label: "שיפוי" },
  { id: "termination", label: "סיום" },
  { id: "governing-law", label: "דין חל" },
  { id: "changes", label: "שינויים בתנאים" },
  { id: "contact", label: "צרו קשר" },
];

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const h2Class = "text-2xl font-display font-semibold text-foreground mb-4";
const b = "text-foreground";
const linkClass = "text-accent hover:underline";
const cardClass = "p-5 rounded-2xl bg-background/50 border border-border/30";

const EnContent = () => (
  <>
    <section id="overview">
      <h2 className={h2Class}>Overview</h2>
      <p>Welcome to Torah Tale. These Terms of Service ("Terms") govern your access to and use of the Torah Tale platform, including our website, applications, APIs, and all related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.</p>
      <p className="mt-3">Torah Tale is operated by Torah Tale, LLC ("we," "us," or "our"). Throughout these Terms, "you" or "user" refers to any individual or entity accessing the Service.</p>
      <p className="mt-3">We encourage you to read these Terms carefully and revisit them periodically. Your continued use of the Service constitutes acceptance of any updates.</p>
    </section>

    <section id="eligibility">
      <h2 className={h2Class}>Eligibility</h2>
      <p>You must be at least 18 years of age to create an account and use the Service. By using Torah Tale, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding agreement. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
      <p className="mt-3">The Service is designed for parents and legal guardians to create personalized children's books. Children under 18 should not use the Service directly; all interactions must be facilitated by a parent or legal guardian.</p>
    </section>

    <section id="accounts">
      <h2 className={h2Class}>Account Registration</h2>
      <p>To access certain features of the Service, you must create an account by providing a valid email address and password. You are responsible for:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Maintaining the confidentiality of your account credentials</li>
        <li>All activities that occur under your account</li>
        <li>Notifying us immediately of any unauthorized use of your account</li>
        <li>Ensuring that your account information is accurate and up to date</li>
      </ul>
      <p className="mt-3">We reserve the right to suspend or terminate accounts that contain false or misleading information, or that are used in violation of these Terms.</p>
    </section>

    <section id="service">
      <h2 className={h2Class}>Service Description</h2>
      <p>Torah Tale is an AI-powered platform that creates personalized children's books ("seforim") rooted in Torah wisdom. Each book features your child as the main character in stories inspired by the weekly Torah portion (Parshas HaShavua).</p>
      <p className="mt-3">Our Service includes:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li><strong className={b}>Book Creation:</strong> AI-generated stories and illustrations personalized with your child's name, appearance, and characteristics</li>
        <li><strong className={b}>Digital Previews:</strong> Interactive book previews with page-turning animations</li>
        <li><strong className={b}>Physical Printing:</strong> High-quality printed books in multiple formats, fulfilled through our print-on-demand partner</li>
        <li><strong className={b}>Subscription Plans:</strong> Recurring book delivery plans for weekly Torah portions</li>
        <li><strong className={b}>Dashboard:</strong> Account management, child profiles, order tracking, and book history</li>
      </ul>
    </section>

    <section id="free-tier">
      <h2 className={h2Class}>Free Tier & Subscriptions</h2>
      <p>Registered users may generate up to <strong className={b}>2 free book previews per calendar month</strong>. Free previews include full digital book content but do not include physical printing.</p>
      <p className="mt-3">To create additional books or receive printed copies, users must subscribe to one of our paid plans:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-left p-4 font-semibold text-foreground">Plan</th><th className="text-left p-4 font-semibold text-foreground">Price</th><th className="text-left p-4 font-semibold text-foreground">Includes</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">Torah Series</td><td className="p-4">starting at $22.99/month</td><td className="p-4">4 personalized seforim per month (Weekly Parsha + Yomim Tovim)</td></tr>
            <tr><td className="p-4 font-medium text-foreground">Tanach Series</td><td className="p-4">starting at $34.99/month</td><td className="p-4">Full access — Torah, Neviim, Kesuvim</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">One-time book purchases are also available starting at $7.05 depending on the book format selected. All prices are in USD and subject to change with prior notice.</p>
    </section>

    <section id="pricing">
      <h2 className={h2Class}>Book Formats & Pricing</h2>
      <p>Our printed books are available in the following formats:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-left p-4 font-semibold text-foreground">Format</th><th className="text-left p-4 font-semibold text-foreground">Size</th><th className="text-left p-4 font-semibold text-foreground">Price</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">Softcover Photo Book</td><td className="p-4">8″ × 8″</td><td className="p-4">$7.05</td></tr>
            <tr><td className="p-4 font-medium text-foreground">Hardcover Photo Book</td><td className="p-4">8″ × 8″ or 11″ × 8.5″</td><td className="p-4">$9.95</td></tr>
            <tr><td className="p-4 font-medium text-foreground">Board Book</td><td className="p-4">6″ × 6″ (rounded corners)</td><td className="p-4">$18.28</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">All books contain 10 pages of AI-generated, personalized content. Each book includes a custom cover, story pages, and back cover. Shipping costs are calculated at checkout based on your location.</p>
    </section>

    <section id="payments">
      <h2 className={h2Class}>Payments & Billing</h2>
      <p>All payments are processed securely through Shopify. By making a purchase, you agree to Shopify's terms of service and payment processing policies. We do not store your credit card information on our servers.</p>
      <p className="mt-3">For subscription plans:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Billing occurs automatically at the beginning of each billing cycle</li>
        <li>You authorize us to charge your payment method on a recurring basis</li>
        <li>Failed payments may result in temporary suspension of your subscription</li>
        <li>Price changes will be communicated at least 30 days in advance</li>
      </ul>
    </section>

    <section id="fulfillment">
      <h2 className={h2Class}>Print & Fulfillment</h2>
      <p>Physical books are printed and fulfilled through our print-on-demand partner, Printify. By placing an order, you acknowledge and agree that:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Your shipping address and book content will be shared with Printify for production and delivery</li>
        <li>Delivery times typically range from <strong className={b}>5–14 business days</strong> depending on your location</li>
        <li>International orders may be subject to customs duties and import taxes, which are the responsibility of the buyer</li>
        <li>We are not responsible for delays caused by shipping carriers, customs processing, or force majeure events</li>
        <li>Delivery confirmation is provided via the tracking information shared at the time of shipment</li>
      </ul>
    </section>

    <section id="ip">
      <h2 className={h2Class}>Intellectual Property</h2>
      <p>The Torah Tale platform, including its design, branding, software, algorithms, and proprietary technology, is owned by Torah Tale, LLC and protected by applicable intellectual property laws.</p>
      <p className="mt-3"><strong className={b}>Your Content:</strong> You retain all rights to the personal information you provide, including your child's name, photos, and descriptions.</p>
      <p className="mt-3"><strong className={b}>Generated Content:</strong> AI-generated stories, illustrations, and book designs remain the intellectual property of Torah Tale. Upon purchase, you are granted a personal, non-exclusive, non-transferable, non-commercial license to use, display, and share your purchased books for personal and family use.</p>
      <p className="mt-3">You may not reproduce, distribute, sell, or commercially exploit any AI-generated content without our prior written consent.</p>
    </section>

    <section id="user-content">
      <h2 className={h2Class}>User Content</h2>
      <p>By submitting content to Torah Tale (including child profiles, photos, descriptions, and preferences), you grant us a limited, non-exclusive license to use that content solely for the purpose of providing the Service — specifically, generating personalized book content.</p>
      <p className="mt-3">You represent and warrant that:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>You own or have the right to use all content you submit</li>
        <li>Your content does not infringe on the rights of any third party</li>
        <li>Your content does not contain unlawful, harmful, or objectionable material</li>
        <li>Any photos uploaded are of your own children or you have appropriate consent</li>
      </ul>
    </section>

    <section id="children">
      <h2 className={h2Class}>Children's Data</h2>
      <p>Torah Tale takes children's privacy extremely seriously. We comply with the Children's Online Privacy Protection Act (COPPA) and similar international regulations.</p>
      <p className="mt-3">Key commitments regarding children's data:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>We do not knowingly collect information directly from children under 13</li>
        <li>All child information is provided exclusively by parents or legal guardians</li>
        <li>Child data (name, age, gender, description, photo) is used <strong className={b}>solely</strong> for book personalization</li>
        <li>Child data is never sold, shared for advertising, or used for profiling</li>
        <li>Parents may request deletion of their child's data at any time</li>
        <li>Child photos are stored securely with encryption and access controls</li>
      </ul>
      <p className="mt-3">For full details on how we handle children's data, please review our <Link to="/privacy" className={linkClass}>Privacy Policy</Link>.</p>
    </section>

    <section id="ai-content">
      <h2 className={h2Class}>AI-Generated Content</h2>
      <p>Torah Tale uses artificial intelligence to generate personalized stories and illustrations. You acknowledge and agree that:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>AI-generated content is created algorithmically and may occasionally contain inaccuracies, inconsistencies, or unexpected outputs</li>
        <li>Generated content is provided for <strong className={b}>educational and entertainment purposes</strong> and should not be considered a substitute for formal Torah education or rabbinic guidance</li>
        <li>We make reasonable efforts to ensure cultural and religious accuracy but cannot guarantee perfection in every generated piece</li>
        <li>We reserve the right to review, modify, or remove generated content that violates our content guidelines</li>
        <li>The style, quality, and output of AI-generated content may evolve over time as we improve our models and prompts</li>
      </ul>
    </section>

    <section id="acceptable-use">
      <h2 className={h2Class}>Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Violate any applicable law or regulation</li>
        <li>Upload content that is offensive, obscene, defamatory, or otherwise objectionable</li>
        <li>Attempt to exploit the free tier through multiple accounts or automated means</li>
        <li>Reverse-engineer, decompile, or attempt to extract the source code of our software</li>
        <li>Use the Service to create content that is harmful to children</li>
        <li>Interfere with or disrupt the Service or servers connected to the Service</li>
        <li>Use automated scripts, bots, or scrapers to access the Service</li>
        <li>Resell, redistribute, or commercially exploit generated content without authorization</li>
      </ul>
    </section>

    <section id="refunds">
      <h2 className={h2Class}>Refunds & Cancellations</h2>
      <p><strong className={b}>Digital Content:</strong> Digital book previews are provided as part of the Service and are non-refundable.</p>
      <p className="mt-3"><strong className={b}>Printed Books:</strong> If you receive a damaged, defective, or materially different product, please contact us within <strong className={b}>14 days of delivery</strong>. We will arrange a replacement or full refund at our discretion. Please include photos of the damaged product with your request.</p>
      <p className="mt-3"><strong className={b}>Subscriptions:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial refunds are provided for unused portions of a billing period. Books already in production at the time of cancellation will still be delivered.</p>
    </section>

    <section id="liability">
      <h2 className={h2Class}>Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, TORAH TALE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</p>
      <p className="mt-3">Our total aggregate liability for any claims arising under these Terms shall not exceed the greater of (a) the amount you paid to Torah Tale in the twelve (12) months preceding the claim, or (b) one hundred dollars ($100).</p>
      <p className="mt-3">The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
    </section>

    <section id="indemnification">
      <h2 className={h2Class}>Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless Torah Tale, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Your use of the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any rights of a third party</li>
        <li>Any content you submit to the Service</li>
      </ul>
    </section>

    <section id="termination">
      <h2 className={h2Class}>Termination</h2>
      <p>We reserve the right to suspend or terminate your account at our sole discretion, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties, or for any other reason.</p>
      <p className="mt-3">Upon termination:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Your right to access and use the Service will immediately cease</li>
        <li>We may delete your account data in accordance with our Privacy Policy</li>
        <li>Any outstanding orders in production will be fulfilled</li>
        <li>Provisions that by their nature should survive termination will remain in effect</li>
      </ul>
      <p className="mt-3">You may delete your account at any time through your dashboard settings or by contacting us.</p>
    </section>

    <section id="governing-law">
      <h2 className={h2Class}>Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in New York County, New York.</p>
      <p className="mt-3">Any cause of action or claim you may have arising out of or relating to these Terms or the Service must be commenced within one (1) year after the cause of action accrues; otherwise, such cause of action or claim is permanently barred.</p>
    </section>

    <section id="changes">
      <h2 className={h2Class}>Changes to Terms</h2>
      <p>We may modify these Terms at any time. When we make material changes, we will:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Update the "Effective Date" at the top of this page</li>
        <li>Notify registered users via email at least 30 days before changes take effect</li>
        <li>Provide a summary of material changes</li>
      </ul>
      <p className="mt-3">Your continued use of the Service after the effective date of revised Terms constitutes your acceptance of the changes. If you do not agree to the updated Terms, you must stop using the Service and may request account deletion.</p>
    </section>

    <section id="contact">
      <h2 className={h2Class}>Contact</h2>
      <p>If you have questions about these Terms, please contact us:</p>
      <div className={`mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2`}>
        <p><strong className={b}>Torah Tale, LLC</strong></p>
        <p>Email: <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></p>
      </div>
    </section>
  </>
);

const HeContent = () => (
  <>
    <section id="overview">
      <h2 className={h2Class}>סקירה כללית</h2>
      <p>ברוכים הבאים ל-Torah Tale. תנאי שימוש אלו ("התנאים") מסדירים את הגישה שלכם לפלטפורמת Torah Tale ואת השימוש בה, כולל האתר, היישומים, ממשקי ה-API וכל השירותים הקשורים (יחד, "השירות"). בגישה לשירות או בשימוש בו, אתם מסכימים להיות כפופים לתנאים אלו. אם אינכם מסכימים, אינכם רשאים להשתמש בשירות.</p>
      <p className="mt-3">Torah Tale מופעלת על ידי Torah Tale, LLC ("אנחנו", "שלנו"). לאורך תנאים אלו, "אתם" או "משתמש" מתייחס לכל אדם או ישות הניגשים לשירות.</p>
      <p className="mt-3">אנו מעודדים אתכם לקרוא תנאים אלו בעיון ולחזור אליהם מעת לעת. המשך השימוש שלכם בשירות מהווה קבלה של כל עדכון.</p>
    </section>

    <section id="eligibility">
      <h2 className={h2Class}>כשירות</h2>
      <p>עליכם להיות בני 18 לפחות כדי ליצור חשבון ולהשתמש בשירות. בשימושכם ב-Torah Tale, אתם מצהירים ומתחייבים שאתם עומדים בדרישת גיל זו ויש לכם כשירות משפטית להתקשר בהסכם מחייב. אם אתם משתמשים בשירות בשם ארגון, אתם מצהירים שיש לכם סמכות לחייב את הארגון לתנאים אלו.</p>
      <p className="mt-3">השירות מיועד להורים ואפוטרופוסים חוקיים ליצירת ספרי ילדים מותאמים אישית. ילדים מתחת לגיל 18 אינם צריכים להשתמש בשירות ישירות; כל האינטראקציות חייבות להתבצע בליווי הורה או אפוטרופוס חוקי.</p>
    </section>

    <section id="accounts">
      <h2 className={h2Class}>הרשמת חשבון</h2>
      <p>כדי לגשת לתכונות מסוימות של השירות, עליכם ליצור חשבון על ידי מתן כתובת אימייל תקפה וסיסמה. אתם אחראים על:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>שמירת סודיות פרטי הגישה לחשבון שלכם</li>
        <li>כל הפעילויות המתרחשות תחת חשבונכם</li>
        <li>הודעה מיידית על כל שימוש לא מורשה בחשבונכם</li>
        <li>הבטחה שפרטי החשבון שלכם מדויקים ועדכניים</li>
      </ul>
      <p className="mt-3">אנו שומרים לעצמנו את הזכות להשעות או לסיים חשבונות המכילים מידע כוזב או מטעה, או שנעשה בהם שימוש בהפרת תנאים אלו.</p>
    </section>

    <section id="service">
      <h2 className={h2Class}>תיאור השירות</h2>
      <p>Torah Tale היא פלטפורמה מופעלת AI המייצרת ספרי ילדים מותאמים אישית ("ספרים") מושרשים בחכמת התורה. כל ספר מציג את ילדכם כדמות הראשית בסיפורים בהשראת פרשת השבוע.</p>
      <p className="mt-3">השירות שלנו כולל:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li><strong className={b}>יצירת ספרים:</strong> סיפורים ואיורים שנוצרו בAI ומותאמים עם שם ילדכם, מראהו ומאפייניו</li>
        <li><strong className={b}>תצוגות מקדימות דיגיטליות:</strong> תצוגות ספר אינטראקטיביות עם אנימציות דפדוף</li>
        <li><strong className={b}>הדפסה פיזית:</strong> ספרים מודפסים באיכות גבוהה במספר פורמטים, מופקים דרך שותף ההדפסה לפי דרישה שלנו</li>
        <li><strong className={b}>תוכניות מנוי:</strong> תוכניות משלוח ספרים חוזרות לפרשיות השבוע</li>
        <li><strong className={b}>לוח בקרה:</strong> ניהול חשבון, פרופילי ילדים, מעקב הזמנות והיסטוריית ספרים</li>
      </ul>
    </section>

    <section id="free-tier">
      <h2 className={h2Class}>שכבה חינמית ומנויים</h2>
      <p>משתמשים רשומים רשאים ליצור עד <strong className={b}>2 תצוגות ספר חינמיות בחודש קלנדרי</strong>. תצוגות חינמיות כוללות תוכן ספר דיגיטלי מלא אך אינן כוללות הדפסה פיזית.</p>
      <p className="mt-3">ליצירת ספרים נוספים או קבלת עותקים מודפסים, על המשתמשים להירשם לאחת מהתוכניות בתשלום שלנו:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-right p-4 font-semibold text-foreground">תוכנית</th><th className="text-right p-4 font-semibold text-foreground">מחיר</th><th className="text-right p-4 font-semibold text-foreground">כולל</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">שבועי</td><td className="p-4">₪88.99/שבוע</td><td className="p-4">ספר מודפס אחד בשבוע</td></tr>
            <tr><td className="p-4 font-medium text-foreground">חודשי</td><td className="p-4">₪295.99/חודש</td><td className="p-4">4 ספרים בחודש</td></tr>
            <tr><td className="p-4 font-medium text-foreground">שנתי</td><td className="p-4">₪2,959.99/שנה</td><td className="p-4">52 ספרים בשנה (הערך הטוב ביותר)</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">רכישות ספר חד-פעמיות זמינות גם החל מ-₪92.49 בהתאם לפורמט הספר שנבחר. כל המחירים בש"ח וכפופים לשינוי בהודעה מראש.</p>
    </section>

    <section id="pricing">
      <h2 className={h2Class}>פורמטים ומחירי ספרים</h2>
      <p>הספרים המודפסים שלנו זמינים בפורמטים הבאים:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-right p-4 font-semibold text-foreground">פורמט</th><th className="text-right p-4 font-semibold text-foreground">גודל</th><th className="text-right p-4 font-semibold text-foreground">מחיר</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">ספר כריכה רכה</td><td className="p-4">8″ × 8″</td><td className="p-4">₪92.49</td></tr>
            <tr><td className="p-4 font-medium text-foreground">ספר כריכה קשה</td><td className="p-4">8″ × 8″ או 11″ × 8.5″</td><td className="p-4">₪147.99</td></tr>
            <tr><td className="p-4 font-medium text-foreground">ספר קרטון</td><td className="p-4">6″ × 6″ (פינות מעוגלות)</td><td className="p-4">₪166.49</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">כל הספרים מכילים 10 עמודים של תוכן מותאם אישית שנוצר בAI. כל ספר כולל כריכה מותאמת, עמודי סיפור וכריכה אחורית. עלויות משלוח מחושבות בתשלום בהתאם למיקומכם.</p>
    </section>

    <section id="payments">
      <h2 className={h2Class}>תשלומים וחיוב</h2>
      <p>כל התשלומים מעובדים באופן מאובטח דרך Shopify. בביצוע רכישה, אתם מסכימים לתנאי השימוש ומדיניות עיבוד התשלומים של Shopify. איננו מאחסנים את פרטי כרטיס האשראי שלכם בשרתים שלנו.</p>
      <p className="mt-3">עבור תוכניות מנוי:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>החיוב מתבצע אוטומטית בתחילת כל מחזור חיוב</li>
        <li>אתם מאשרים לנו לחייב את אמצעי התשלום שלכם באופן חוזר</li>
        <li>תשלומים שנכשלו עלולים לגרום להשעיה זמנית של המנוי</li>
        <li>שינויי מחיר יתקבלו לפחות 30 יום מראש</li>
      </ul>
    </section>

    <section id="fulfillment">
      <h2 className={h2Class}>הדפסה והפצה</h2>
      <p>ספרים פיזיים מודפסים ומופצים דרך שותף ההדפסה לפי דרישה שלנו, Printify. בביצוע הזמנה, אתם מאשרים ומסכימים כי:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>כתובת המשלוח ותוכן הספר שלכם ישותפו עם Printify לייצור ומשלוח</li>
        <li>זמני אספקה נעים בדרך כלל בין <strong className={b}>5–14 ימי עסקים</strong> בהתאם למיקומכם</li>
        <li>הזמנות בינלאומיות עשויות להיות כפופות למכס ומיסי יבוא, שהם באחריות הקונה</li>
        <li>איננו אחראים לעיכובים הנגרמים על ידי חברות שילוח, עיבוד מכס או אירועי כוח עליון</li>
        <li>אישור מסירה מסופק באמצעות מידע מעקב המשותף בעת המשלוח</li>
      </ul>
    </section>

    <section id="ip">
      <h2 className={h2Class}>קניין רוחני</h2>
      <p>פלטפורמת Torah Tale, כולל עיצובה, מיתוגה, תוכנותיה, אלגוריתמים וטכנולוגיה קניינית, שייכת ל-Torah Tale, LLC ומוגנת על ידי חוקי קניין רוחני החלים.</p>
      <p className="mt-3"><strong className={b}>התוכן שלכם:</strong> אתם שומרים על כל הזכויות למידע האישי שאתם מספקים, כולל שם ילדכם, תמונות ותיאורים.</p>
      <p className="mt-3"><strong className={b}>תוכן שנוצר:</strong> סיפורים, איורים ועיצובי ספרים שנוצרו בAI נשארים הקניין הרוחני של Torah Tale. עם הרכישה, מוענקת לכם רישיון אישי, לא-בלעדי, לא-ניתן להעברה ולא-מסחרי לשימוש, תצוגה ושיתוף הספרים שרכשתם לשימוש אישי ומשפחתי.</p>
      <p className="mt-3">אינכם רשאים לשכפל, להפיץ, למכור או לנצל מסחרית כל תוכן שנוצר בAI ללא הסכמתנו מראש בכתב.</p>
    </section>

    <section id="user-content">
      <h2 className={h2Class}>תוכן משתמש</h2>
      <p>בהגשת תוכן ל-Torah Tale (כולל פרופילי ילדים, תמונות, תיאורים והעדפות), אתם מעניקים לנו רישיון מוגבל ולא-בלעדי לשימוש בתוכן זה אך ורק לצורך מתן השירות — ספציפית, יצירת תוכן ספר מותאם אישית.</p>
      <p className="mt-3">אתם מצהירים ומתחייבים כי:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>אתם בעלי הזכויות או שיש לכם הרשאה לשימוש בכל תוכן שאתם מגישים</li>
        <li>התוכן שלכם אינו מפר זכויות של צד שלישי</li>
        <li>התוכן שלכם אינו מכיל חומר בלתי חוקי, מזיק או פוגעני</li>
        <li>כל תמונה שהועלתה היא של ילדיכם או שיש לכם הסכמה מתאימה</li>
      </ul>
    </section>

    <section id="children">
      <h2 className={h2Class}>נתוני ילדים</h2>
      <p>Torah Tale מתייחסת לפרטיות ילדים ברצינות רבה. אנו עומדים בחוק הגנת הפרטיות המקוונת של ילדים (COPPA) ותקנות בינלאומיות דומות.</p>
      <p className="mt-3">התחייבויות מרכזיות בנוגע לנתוני ילדים:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>איננו אוספים ביודעין מידע ישירות מילדים מתחת לגיל 13</li>
        <li>כל מידע על ילדים מסופק אך ורק על ידי הורים או אפוטרופוסים חוקיים</li>
        <li>נתוני ילדים (שם, גיל, מגדר, תיאור, תמונה) משמשים <strong className={b}>אך ורק</strong> להתאמה אישית של ספרים</li>
        <li>נתוני ילדים לעולם אינם נמכרים, משותפים לפרסום או משמשים לפרופילינג</li>
        <li>הורים רשאים לבקש מחיקת נתוני ילדם בכל עת</li>
        <li>תמונות ילדים מאוחסנות באופן מאובטח עם הצפנה ובקרות גישה</li>
      </ul>
      <p className="mt-3">לפרטים המלאים על אופן הטיפול שלנו בנתוני ילדים, אנא עיינו ב<Link to="/privacy" className={linkClass}>מדיניות הפרטיות</Link> שלנו.</p>
    </section>

    <section id="ai-content">
      <h2 className={h2Class}>תוכן שנוצר בAI</h2>
      <p>Torah Tale משתמשת בבינה מלאכותית ליצירת סיפורים ואיורים מותאמים אישית. אתם מאשרים ומסכימים כי:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>תוכן שנוצר בAI נוצר באופן אלגוריתמי ועשוי להכיל מדי פעם אי-דיוקים, חוסר עקביות או תוצרים בלתי צפויים</li>
        <li>תוכן שנוצר מסופק ל<strong className={b}>מטרות חינוכיות ובידוריות</strong> ואינו צריך להיחשב כתחליף לחינוך תורני רשמי או הדרכה רבנית</li>
        <li>אנו עושים מאמצים סבירים להבטיח דיוק תרבותי ודתי אך איננו יכולים להבטיח שלמות בכל יצירה</li>
        <li>אנו שומרים לעצמנו את הזכות לבדוק, לשנות או להסיר תוכן שנוצר ומפר את הנחיות התוכן שלנו</li>
        <li>הסגנון, האיכות והתוצר של תוכן שנוצר בAI עשויים להתפתח עם הזמן ככל שנשפר את המודלים וההנחיות שלנו</li>
      </ul>
    </section>

    <section id="acceptable-use">
      <h2 className={h2Class}>שימוש מקובל</h2>
      <p>אתם מסכימים שלא להשתמש בשירות כדי:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>להפר כל חוק או תקנה החלים</li>
        <li>להעלות תוכן פוגעני, מגונה, משמיץ או בלתי הולם בדרך אחרת</li>
        <li>לנסות לנצל את השכבה החינמית באמצעות חשבונות מרובים או אמצעים אוטומטיים</li>
        <li>לבצע הנדסה לאחור, פירוק או ניסיון לחלץ את קוד המקור של התוכנה שלנו</li>
        <li>להשתמש בשירות ליצירת תוכן מזיק לילדים</li>
        <li>להפריע לשירות או לשרתים המחוברים לשירות</li>
        <li>להשתמש בסקריפטים אוטומטיים, בוטים או סקרייפרים לגישה לשירות</li>
        <li>למכור מחדש, להפיץ מחדש או לנצל מסחרית תוכן שנוצר ללא אישור</li>
      </ul>
    </section>

    <section id="refunds">
      <h2 className={h2Class}>החזרות וביטולים</h2>
      <p><strong className={b}>תוכן דיגיטלי:</strong> תצוגות ספר דיגיטליות מסופקות כחלק מהשירות ואינן ניתנות להחזר.</p>
      <p className="mt-3"><strong className={b}>ספרים מודפסים:</strong> אם קיבלתם מוצר פגום, לקוי או שונה מהותית, אנא פנו אלינו תוך <strong className={b}>14 יום מהמסירה</strong>. נסדר החלפה או החזר מלא לפי שיקול דעתנו. אנא כללו תמונות של המוצר הפגום עם בקשתכם.</p>
      <p className="mt-3"><strong className={b}>מנויים:</strong> תוכלו לבטל את המנוי בכל עת. הביטול נכנס לתוקף בסוף תקופת החיוב הנוכחית. לא ניתנים החזרים חלקיים עבור חלקים שלא נוצלו מתקופת חיוב. ספרים שכבר בייצור בעת הביטול עדיין יישלחו.</p>
    </section>

    <section id="liability">
      <h2 className={h2Class}>הגבלת אחריות</h2>
      <p>במידה המרבית המותרת בחוק, TORAH TALE והנושאי משרה, הדירקטורים, העובדים והסוכנים שלה לא יהיו אחראים לכל נזק עקיף, מקרי, מיוחד, תוצאתי או עונשי, כולל אך לא מוגבל לאובדן רווחים, נתונים, שימוש או מוניטין, הנובע מהשימוש שלכם בשירות או בקשר אליו.</p>
      <p className="mt-3">האחריות המצטברת הכוללת שלנו לכל תביעות הנובעות מתנאים אלו לא תעלה על הגבוה מבין (א) הסכום ששילמתם ל-Torah Tale בשנים עשר (12) החודשים שקדמו לתביעה, או (ב) מאה דולר ($100).</p>
      <p className="mt-3">השירות מסופק "כמות שהוא" ו"כפי שזמין" ללא אחריות מכל סוג, בין אם מפורשת או משתמעת, כולל אך לא מוגבל לאחריות משתמעת של סחירות, התאמה למטרה מסוימת ואי-הפרה.</p>
    </section>

    <section id="indemnification">
      <h2 className={h2Class}>שיפוי</h2>
      <p>אתם מסכימים לשפות, להגן ולפצות את Torah Tale, שותפיה, נושאי המשרה, הדירקטורים, העובדים והסוכנים שלה מכל תביעות, חבויות, נזקים, הפסדים, עלויות או הוצאות (כולל שכר טרחת עורכי דין סביר) הנובעים מ:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>השימוש שלכם בשירות</li>
        <li>הפרת תנאים אלו על ידכם</li>
        <li>הפרת זכויות צד שלישי על ידכם</li>
        <li>כל תוכן שאתם מגישים לשירות</li>
      </ul>
    </section>

    <section id="termination">
      <h2 className={h2Class}>סיום</h2>
      <p>אנו שומרים לעצמנו את הזכות להשעות או לסיים את חשבונכם לפי שיקול דעתנו הבלעדי, עם או ללא הודעה מוקדמת, בגין התנהגות שאנו קובעים שמפרה תנאים אלו או מזיקה למשתמשים אחרים, לנו או לצדדים שלישיים, או מכל סיבה אחרת.</p>
      <p className="mt-3">עם הסיום:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>זכותכם לגשת לשירות ולהשתמש בו תפסק באופן מיידי</li>
        <li>אנו עשויים למחוק את נתוני חשבונכם בהתאם למדיניות הפרטיות שלנו</li>
        <li>כל הזמנות בייצור יבוצעו</li>
        <li>הוראות שמטבען צריכות לשרוד את הסיום יישארו בתוקף</li>
      </ul>
      <p className="mt-3">תוכלו למחוק את חשבונכם בכל עת דרך הגדרות לוח הבקרה או על ידי פנייה אלינו.</p>
    </section>

    <section id="governing-law">
      <h2 className={h2Class}>דין חל</h2>
      <p>תנאים אלו ייושלטו ויפורשו בהתאם לחוקי מדינת ניו יורק, ארצות הברית, מבלי להתחשב בעקרונות ברירת הדין שלה. כל מחלוקת הנובעת מתנאים אלו תיושב אך ורק בבתי המשפט המדינתיים או הפדרליים הנמצאים במחוז ניו יורק, ניו יורק.</p>
      <p className="mt-3">כל עילת תביעה או תביעה שעשויה להיות לכם הנובעת מתנאים אלו או מהשירות חייבת להיות מוגשת תוך שנה אחת (1) מהרגע שעילת התביעה נוצרת; אחרת, עילת תביעה או תביעה כזו נחסמת לצמיתות.</p>
    </section>

    <section id="changes">
      <h2 className={h2Class}>שינויים בתנאים</h2>
      <p>אנו עשויים לשנות תנאים אלו בכל עת. כאשר נבצע שינויים מהותיים, אנו:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>נעדכן את "תאריך התחולה" בראש עמוד זה</li>
        <li>נודיע למשתמשים רשומים באימייל לפחות 30 יום לפני שהשינויים ייכנסו לתוקף</li>
        <li>נספק סיכום של השינויים המהותיים</li>
      </ul>
      <p className="mt-3">המשך השימוש שלכם בשירות לאחר תאריך התחולה של התנאים המעודכנים מהווה קבלת השינויים. אם אינכם מסכימים לתנאים המעודכנים, עליכם להפסיק את השימוש בשירות ותוכלו לבקש מחיקת חשבון.</p>
    </section>

    <section id="contact">
      <h2 className={h2Class}>צרו קשר</h2>
      <p>אם יש לכם שאלות לגבי תנאים אלו, אנא פנו אלינו:</p>
      <div className={`mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2`}>
        <p><strong className={b}>Torah Tale, LLC</strong></p>
        <p>אימייל: <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></p>
      </div>
    </section>
  </>
);

const Terms = () => {
  const { t, lang } = useLanguage();
  const isRtl = (lang === "he" || lang === "yi");
  const SECTIONS = (lang === "he" || lang === "yi") ? SECTIONS_HE : SECTIONS_EN;
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <SEO
        title="Terms of Service — Torah Tale"
        description="Read the Torah Tale terms of service covering accounts, subscriptions, book orders, refunds, and acceptable use."
        path="/terms"
      />
      <Navbar transparentHero={false} />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingOrb(0, "-left-40", "top-1/4", "w-[500px] h-[500px]", "bg-accent/20")}
        {floatingOrb(3, "-right-40", "top-1/3", "w-[400px] h-[400px]", "bg-primary/15")}
        {floatingOrb(5, "left-1/3", "bottom-0", "w-[600px] h-[300px]", "bg-accent/10")}
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-accent font-semibold tracking-[0.15em] uppercase text-xs mb-5"
          >
            {t.terms.label}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t.terms.title}
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>{t.terms.effectiveDate}</span>
            <span className="hidden sm:inline">·</span>
            <Link to={t.terms.crossLinkPath} className="text-accent hover:underline">{t.terms.crossLink}</Link>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-6 py-12 lg:py-16 relative z-10">
        <div className="flex gap-12 lg:gap-16">
          {/* Sidebar TOC */}
          <aside className={`hidden lg:block w-56 shrink-0 ${isRtl ? "order-last" : ""}`}>
            <nav className="sticky top-28 space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">{t.terms.tocLabel}</p>
              {SECTIONS.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`block text-[13px] py-1.5 ${isRtl ? "pr-3 border-r-2" : "pl-3 border-l-2"} transition-colors ${
                    activeSection === id
                      ? "border-accent text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1 max-w-3xl"
          >
            <div className="p-8 md:p-12 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
              <div className="space-y-12 text-[15px] leading-[1.75] text-muted-foreground">
                {(lang === "he" || lang === "yi") ? <HeContent /> : <EnContent />}
              </div>
            </div>

            {/* Subtle reflection */}
            <div className="mt-3 mx-8 h-12 rounded-b-3xl bg-gradient-to-b from-card/20 to-transparent blur-sm" />
          </motion.main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
