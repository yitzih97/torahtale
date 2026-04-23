import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const SECTIONS_EN = [
  { id: "intro", label: "Introduction" },
  { id: "info-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Information" },
  { id: "sharing", label: "Information Sharing" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "children", label: "Children's Privacy" },
  { id: "storage", label: "Data Storage & Security" },
  { id: "cookies", label: "Cookies & Local Storage" },
  { id: "international", label: "International Transfers" },
  { id: "rights", label: "Your Rights" },
  { id: "retention", label: "Data Retention" },
  { id: "ccpa", label: "California Privacy Rights" },
  { id: "gdpr", label: "European Privacy Rights" },
  { id: "changes", label: "Policy Changes" },
  { id: "contact", label: "Contact Us" },
];

const SECTIONS_HE = [
  { id: "intro", label: "מבוא" },
  { id: "info-collect", label: "מידע שאנו אוספים" },
  { id: "how-we-use", label: "כיצד אנו משתמשים במידע" },
  { id: "sharing", label: "שיתוף מידע" },
  { id: "third-party", label: "שירותי צד שלישי" },
  { id: "children", label: "פרטיות ילדים" },
  { id: "storage", label: "אחסון ואבטחת מידע" },
  { id: "cookies", label: "עוגיות ואחסון מקומי" },
  { id: "international", label: "העברות בינלאומיות" },
  { id: "rights", label: "הזכויות שלכם" },
  { id: "retention", label: "שמירת מידע" },
  { id: "ccpa", label: "זכויות פרטיות בקליפורניה" },
  { id: "gdpr", label: "זכויות פרטיות אירופיות" },
  { id: "changes", label: "שינויים במדיניות" },
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
const h3Class = "text-lg font-semibold text-foreground mt-6 mb-3";
const ulClass = "list-disc pl-6 space-y-2";
const b = "text-foreground";
const cardClass = "p-5 rounded-2xl bg-background/50 border border-border/30";
const linkClass = "text-accent hover:underline";

const EnContent = () => (
  <>
    <section id="intro">
      <h2 className={h2Class}>Introduction</h2>
      <p>Torah Tale, LLC ("Torah Tale," "we," "us," or "our") is committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered personalized children's book platform (the "Service").</p>
      <p className="mt-3">This Policy applies to all users of our website, applications, and related services. By using the Service, you consent to the data practices described in this Policy. If you do not agree, please discontinue use of the Service.</p>
      <p className="mt-3">We encourage you to read this Policy in its entirety. For questions, contact us at <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>.</p>
    </section>

    <section id="info-collect">
      <h2 className={h2Class}>Information We Collect</h2>
      <h3 className={h3Class}>Information You Provide</h3>
      <ul className={ulClass}>
        <li><strong className={b}>Account Information:</strong> Name, email address, and password when you create an account</li>
        <li><strong className={b}>Child Information:</strong> Child's name, age, gender, physical description, and optional photo — provided by you for book personalization</li>
        <li><strong className={b}>Shipping Information:</strong> Mailing address, phone number, and recipient name for physical book delivery</li>
        <li><strong className={b}>Preferences:</strong> Art style preferences, language settings, Torah portion selections, and book format choices</li>
        <li><strong className={b}>Communications:</strong> Messages, feedback, and support requests you send to us</li>
      </ul>
      <h3 className={h3Class}>Information Collected Automatically</h3>
      <ul className={ulClass}>
        <li><strong className={b}>Usage Data:</strong> Pages visited, features used, book creation history, click patterns, and session duration</li>
        <li><strong className={b}>Device Information:</strong> Browser type, operating system, screen resolution, and device identifiers</li>
        <li><strong className={b}>Log Data:</strong> IP address, access times, referring URLs, and error logs</li>
      </ul>
      <h3 className={h3Class}>Information We Do Not Collect</h3>
      <ul className={ulClass}>
        <li>Credit card numbers or financial account details (processed by Shopify)</li>
        <li>Social Security numbers or government-issued identification</li>
        <li>Information directly from children under 13</li>
      </ul>
    </section>

    <section id="how-we-use">
      <h2 className={h2Class}>How We Use Your Information</h2>
      <p>We use the information we collect for the following purposes:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Service Delivery:</strong> Generate personalized Torah-based children's books using AI, including stories, illustrations, and cover designs</li>
        <li><strong className={b}>Order Fulfillment:</strong> Process and fulfill print orders through our fulfillment partner</li>
        <li><strong className={b}>Account Management:</strong> Create and manage your account, child profiles, and subscription plans</li>
        <li><strong className={b}>Communication:</strong> Send order confirmations, shipping updates, subscription notices, and important service announcements</li>
        <li><strong className={b}>Improvement:</strong> Analyze usage patterns to improve our service, AI models, and user experience</li>
        <li><strong className={b}>Security:</strong> Detect, prevent, and address fraud, abuse, and security incidents</li>
        <li><strong className={b}>Compliance:</strong> Enforce our terms of service, free tier limits, and legal obligations</li>
      </ul>
      <p className="mt-3">We do <strong className={b}>not</strong> use your information for targeted advertising or sell it to third-party advertisers.</p>
    </section>

    <section id="sharing">
      <h2 className={h2Class}>Information Sharing</h2>
      <p>We do not sell your personal information. We share your information only in the following circumstances:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Service Providers:</strong> With trusted third-party service providers who assist us in operating the Service (see Third-Party Services below)</li>
        <li><strong className={b}>Legal Requirements:</strong> When required by law, subpoena, court order, or governmental regulation</li>
        <li><strong className={b}>Safety:</strong> To protect the rights, property, or safety of Torah Tale, our users, or the public</li>
        <li><strong className={b}>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
        <li><strong className={b}>Consent:</strong> With your explicit consent for any purpose not described in this Policy</li>
      </ul>
    </section>

    <section id="third-party">
      <h2 className={h2Class}>Third-Party Services</h2>
      <p>We use the following third-party services to operate Torah Tale. Each processes only the minimum data necessary for their function:</p>
      <div className="mt-4 space-y-4">
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Shopify — Payment Processing</h4>
          <p className="text-sm">Handles checkout and payment processing. Your payment data (credit card, billing address) is managed entirely by Shopify and never touches our servers. <a href="https://www.shopify.com/legal/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">Shopify Privacy Policy</a></p>
        </div>
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Printify — Print Fulfillment</h4>
          <p className="text-sm">Produces and ships physical books. We share your shipping address and book content (images and text) with Printify to fulfill your order. <a href="https://printify.com/privacy-policy/" className={linkClass} target="_blank" rel="noopener noreferrer">Printify Privacy Policy</a></p>
        </div>
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Google AI (Gemini) — Content Generation</h4>
          <p className="text-sm">Generates personalized stories and illustrations. Child information (name, age, gender, physical description) is sent to Google's AI services for content creation. No photos are sent to AI services. <a href="https://policies.google.com/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></p>
        </div>
      </div>
    </section>

    <section id="children">
      <h2 className={h2Class}>Children's Privacy</h2>
      <p>Torah Tale takes children's privacy extremely seriously. We are committed to complying with the Children's Online Privacy Protection Act (COPPA) and similar international regulations.</p>
      <h3 className={h3Class}>Our Commitments</h3>
      <ul className={ulClass}>
        <li>We do <strong className={b}>not</strong> knowingly collect information directly from children under 13</li>
        <li>All child information is provided exclusively by parents or legal guardians</li>
        <li>Child data is used <strong className={b}>solely</strong> for generating personalized book content</li>
        <li>Child data is <strong className={b}>never</strong> sold, shared for advertising, used for profiling, or monetized in any way</li>
        <li>Child photos are stored securely with encryption and row-level access controls</li>
        <li>AI processing of child data is limited to text descriptions — photos are not sent to AI services</li>
      </ul>
      <h3 className={h3Class}>Parental Rights</h3>
      <p>As a parent or legal guardian, you have the right to:</p>
      <ul className="list-disc pl-6 mt-2 space-y-1.5">
        <li>Review the child information we have stored</li>
        <li>Request correction of inaccurate child information</li>
        <li>Request deletion of your child's data at any time</li>
        <li>Revoke consent for future collection and use of your child's information</li>
      </ul>
      <p className="mt-3">To exercise these rights, contact us at <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. We will respond within 30 days.</p>
    </section>

    <section id="storage">
      <h2 className={h2Class}>Data Storage & Security</h2>
      <p>We implement industry-standard security measures to protect your personal information:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Encryption:</strong> Data is encrypted in transit (TLS 1.2+) and at rest</li>
        <li><strong className={b}>Access Controls:</strong> Row-level security ensures users can only access their own data</li>
        <li><strong className={b}>Authentication:</strong> Secure authentication with email verification and password hashing</li>
        <li><strong className={b}>Monitoring:</strong> Continuous monitoring for unauthorized access attempts</li>
        <li><strong className={b}>Infrastructure:</strong> Hosted on enterprise-grade cloud infrastructure with redundancy and automatic backups</li>
      </ul>
      <p className="mt-3">While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but are committed to promptly addressing any security incidents.</p>
    </section>

    <section id="cookies">
      <h2 className={h2Class}>Cookies & Local Storage</h2>
      <p>We use minimal browser storage technologies:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-left p-4 font-semibold text-foreground">Type</th><th className="text-left p-4 font-semibold text-foreground">Purpose</th><th className="text-left p-4 font-semibold text-foreground">Duration</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">Session Cookie</td><td className="p-4">Authentication and security</td><td className="p-4">Session</td></tr>
            <tr><td className="p-4 font-medium text-foreground">Local Storage</td><td className="p-4">Theme preference, shopping cart state</td><td className="p-4">Persistent</td></tr>
            <tr><td className="p-4 font-medium text-foreground">Auth Token</td><td className="p-4">Maintaining logged-in session</td><td className="p-4">30 days</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">We do <strong className={b}>not</strong> use third-party tracking cookies, analytics cookies, or advertising pixels.</p>
    </section>

    <section id="international">
      <h2 className={h2Class}>International Data Transfers</h2>
      <p>Torah Tale is based in the United States. If you access the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.</p>
      <p className="mt-3">By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.</p>
    </section>

    <section id="rights">
      <h2 className={h2Class}>Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Access:</strong> Request a copy of the personal data we hold about you and your children</li>
        <li><strong className={b}>Correction:</strong> Request correction of inaccurate or incomplete information</li>
        <li><strong className={b}>Deletion:</strong> Request deletion of your account and all associated data, including child profiles and book history</li>
        <li><strong className={b}>Portability:</strong> Request your data in a structured, machine-readable format</li>
        <li><strong className={b}>Restriction:</strong> Request that we limit the processing of your data in certain circumstances</li>
        <li><strong className={b}>Objection:</strong> Object to the processing of your data for certain purposes</li>
        <li><strong className={b}>Withdrawal:</strong> Withdraw consent at any time where processing is based on consent</li>
      </ul>
      <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. We will respond within 30 days. We may need to verify your identity before processing your request.</p>
    </section>

    <section id="retention">
      <h2 className={h2Class}>Data Retention</h2>
      <p>We retain your information for as long as necessary to provide the Service and fulfill the purposes described in this Policy:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Account Data:</strong> Retained while your account is active and for 30 days after deletion request</li>
        <li><strong className={b}>Child Profiles:</strong> Retained until you request deletion or delete your account</li>
        <li><strong className={b}>Book Content:</strong> Retained until you request deletion or delete your account</li>
        <li><strong className={b}>Order Records:</strong> Retained for 7 years for legal and accounting purposes</li>
        <li><strong className={b}>Usage Analytics:</strong> Anonymized and aggregated data may be retained indefinitely for service improvement</li>
      </ul>
      <p className="mt-3">Upon account deletion, all personal data, child profiles, photos, and book history will be permanently removed within 30 days. Some anonymized, aggregated data may be retained for analytics.</p>
    </section>

    <section id="ccpa">
      <h2 className={h2Class}>California Privacy Rights (CCPA)</h2>
      <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Right to Know:</strong> You may request disclosure of the categories and specific pieces of personal information we have collected about you</li>
        <li><strong className={b}>Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions</li>
        <li><strong className={b}>Right to Opt-Out:</strong> We do not sell personal information, so no opt-out is necessary</li>
        <li><strong className={b}>Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
      </ul>
      <p className="mt-3">To make a CCPA request, contact us at <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. We will verify your identity and respond within 45 days.</p>
    </section>

    <section id="gdpr">
      <h2 className={h2Class}>European Privacy Rights (GDPR)</h2>
      <p>If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have rights under the General Data Protection Regulation (GDPR):</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>Legal Basis:</strong> We process your data based on consent (child data, account creation), contract performance (service delivery), and legitimate interests (security, improvement)</li>
        <li><strong className={b}>Data Protection Officer:</strong> You may contact our DPO at <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></li>
        <li><strong className={b}>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority</li>
      </ul>
    </section>

    <section id="changes">
      <h2 className={h2Class}>Policy Changes</h2>
      <p>We may update this Privacy Policy from time to time. When we make material changes, we will:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>Update the "Effective Date" at the top of this page</li>
        <li>Notify registered users via email at least 30 days before changes take effect</li>
        <li>Provide a summary of the changes made</li>
      </ul>
      <p className="mt-3">Your continued use of the Service after the effective date of the revised Policy constitutes your acceptance. If you disagree, please discontinue use and request account deletion.</p>
    </section>

    <section id="contact">
      <h2 className={h2Class}>Contact Us</h2>
      <p>For privacy-related questions, concerns, or to exercise your rights, please contact us:</p>
      <div className={`mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2`}>
        <p><strong className={b}>Torah Tale, LLC</strong></p>
        <p>Email: <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></p>
      </div>
      <p className="mt-4 text-sm">We aim to respond to all privacy-related inquiries within 30 days.</p>
    </section>
  </>
);

const HeContent = () => (
  <>
    <section id="intro">
      <h2 className={h2Class}>מבוא</h2>
      <p>Torah Tale, LLC ("Torah Tale", "אנחנו", "שלנו") מחויבת להגן על הפרטיות שלכם ושל ילדיכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, חושפים ומגנים על המידע שלכם כשאתם משתמשים בפלטפורמת ספרי הילדים המותאמים אישית המופעלת באמצעות AI (ה"שירות").</p>
      <p className="mt-3">מדיניות זו חלה על כל משתמשי האתר, היישומים והשירותים הקשורים שלנו. בשימושכם בשירות, אתם מסכימים לנוהלי הנתונים המתוארים במדיניות זו. אם אינכם מסכימים, אנא הפסיקו את השימוש בשירות.</p>
      <p className="mt-3">אנו מעודדים אתכם לקרוא מדיניות זו במלואה. לשאלות, פנו אלינו ב-<a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>.</p>
    </section>

    <section id="info-collect">
      <h2 className={h2Class}>מידע שאנו אוספים</h2>
      <h3 className={h3Class}>מידע שאתם מספקים</h3>
      <ul className={ulClass}>
        <li><strong className={b}>פרטי חשבון:</strong> שם, כתובת אימייל וסיסמה בעת יצירת חשבון</li>
        <li><strong className={b}>מידע על הילד:</strong> שם הילד, גיל, מגדר, תיאור חיצוני ותמונה אופציונלית — מסופקים על ידכם להתאמה אישית של הספר</li>
        <li><strong className={b}>פרטי משלוח:</strong> כתובת למשלוח, מספר טלפון ושם הנמען למשלוח ספרים פיזיים</li>
        <li><strong className={b}>העדפות:</strong> העדפות סגנון איור, הגדרות שפה, בחירת פרשיות תורה ואפשרויות פורמט ספר</li>
        <li><strong className={b}>תקשורת:</strong> הודעות, משוב ובקשות תמיכה שאתם שולחים אלינו</li>
      </ul>
      <h3 className={h3Class}>מידע הנאסף אוטומטית</h3>
      <ul className={ulClass}>
        <li><strong className={b}>נתוני שימוש:</strong> עמודים שבוקרו, תכונות בשימוש, היסטוריית יצירת ספרים, דפוסי לחיצות ומשך סשן</li>
        <li><strong className={b}>מידע על מכשיר:</strong> סוג דפדפן, מערכת הפעלה, רזולוציית מסך ומזהי מכשיר</li>
        <li><strong className={b}>נתוני לוג:</strong> כתובת IP, זמני גישה, כתובות URL מפנות ולוגי שגיאות</li>
      </ul>
      <h3 className={h3Class}>מידע שאיננו אוספים</h3>
      <ul className={ulClass}>
        <li>מספרי כרטיסי אשראי או פרטי חשבון פיננסי (מעובדים על ידי Shopify)</li>
        <li>מספרי תעודת זהות או מסמכים ממשלתיים</li>
        <li>מידע ישירות מילדים מתחת לגיל 13</li>
      </ul>
    </section>

    <section id="how-we-use">
      <h2 className={h2Class}>כיצד אנו משתמשים במידע שלכם</h2>
      <p>אנו משתמשים במידע שאנו אוספים למטרות הבאות:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>מתן שירות:</strong> יצירת ספרי ילדים מותאמים אישית מבוססי תורה באמצעות AI, כולל סיפורים, איורים ועיצוב כריכות</li>
        <li><strong className={b}>מילוי הזמנות:</strong> עיבוד ומילוי הזמנות הדפסה דרך שותף ההפצה שלנו</li>
        <li><strong className={b}>ניהול חשבון:</strong> יצירה וניהול של החשבון שלכם, פרופילי ילדים ותוכניות מנוי</li>
        <li><strong className={b}>תקשורת:</strong> שליחת אישורי הזמנה, עדכוני משלוח, הודעות מנוי והודעות שירות חשובות</li>
        <li><strong className={b}>שיפור:</strong> ניתוח דפוסי שימוש לשיפור השירות, מודלי ה-AI וחוויית המשתמש</li>
        <li><strong className={b}>אבטחה:</strong> זיהוי, מניעה וטיפול בהונאה, שימוש לרעה ותקריות אבטחה</li>
        <li><strong className={b}>ציות:</strong> אכיפת תנאי השימוש, מגבלות שימוש חינמי וחובות משפטיות</li>
      </ul>
      <p className="mt-3">אנו <strong className={b}>לא</strong> משתמשים במידע שלכם לפרסום ממוקד ולא מוכרים אותו למפרסמים צד שלישי.</p>
    </section>

    <section id="sharing">
      <h2 className={h2Class}>שיתוף מידע</h2>
      <p>אנו לא מוכרים את המידע האישי שלכם. אנו משתפים את המידע שלכם רק בנסיבות הבאות:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>ספקי שירות:</strong> עם ספקי שירות צד שלישי מהימנים המסייעים לנו בהפעלת השירות (ראו שירותי צד שלישי להלן)</li>
        <li><strong className={b}>דרישות משפטיות:</strong> כאשר נדרש על פי חוק, צו הזמנה, צו בית משפט או תקנה ממשלתית</li>
        <li><strong className={b}>בטיחות:</strong> להגנה על הזכויות, הרכוש או הבטיחות של Torah Tale, המשתמשים שלנו או הציבור</li>
        <li><strong className={b}>העברות עסקיות:</strong> בקשר למיזוג, רכישה או מכירת נכסים, המידע שלכם עשוי להיות מועבר כחלק מהעסקה</li>
        <li><strong className={b}>הסכמה:</strong> בהסכמתכם המפורשת לכל מטרה שאינה מתוארת במדיניות זו</li>
      </ul>
    </section>

    <section id="third-party">
      <h2 className={h2Class}>שירותי צד שלישי</h2>
      <p>אנו משתמשים בשירותי צד שלישי הבאים להפעלת Torah Tale. כל אחד מעבד רק את המידע המינימלי הנדרש לתפקודו:</p>
      <div className="mt-4 space-y-4">
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Shopify — עיבוד תשלומים</h4>
          <p className="text-sm">מטפל בתשלום ובעיבוד תשלומים. נתוני התשלום שלכם (כרטיס אשראי, כתובת חיוב) מנוהלים כולם על ידי Shopify ולעולם אינם מגיעים לשרתים שלנו. <a href="https://www.shopify.com/legal/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">מדיניות הפרטיות של Shopify</a></p>
        </div>
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Printify — הפקת הדפסה</h4>
          <p className="text-sm">מייצר ושולח ספרים פיזיים. אנו משתפים את כתובת המשלוח ותוכן הספר (תמונות וטקסט) עם Printify למילוי ההזמנה שלכם. <a href="https://printify.com/privacy-policy/" className={linkClass} target="_blank" rel="noopener noreferrer">מדיניות הפרטיות של Printify</a></p>
        </div>
        <div className={cardClass}>
          <h4 className="font-semibold text-foreground mb-1">Google AI (Gemini) — יצירת תוכן</h4>
          <p className="text-sm">מייצר סיפורים ואיורים מותאמים אישית. מידע על הילד (שם, גיל, מגדר, תיאור חיצוני) נשלח לשירותי ה-AI של Google ליצירת תוכן. תמונות אינן נשלחות לשירותי AI. <a href="https://policies.google.com/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">מדיניות הפרטיות של Google</a></p>
        </div>
      </div>
    </section>

    <section id="children">
      <h2 className={h2Class}>פרטיות ילדים</h2>
      <p>Torah Tale מתייחסת לפרטיות ילדים ברצינות רבה. אנו מחויבים לעמוד בחוק הגנת הפרטיות המקוונת של ילדים (COPPA) ותקנות בינלאומיות דומות.</p>
      <h3 className={h3Class}>ההתחייבויות שלנו</h3>
      <ul className={ulClass}>
        <li>אנו <strong className={b}>לא</strong> אוספים ביודעין מידע ישירות מילדים מתחת לגיל 13</li>
        <li>כל מידע על ילדים מסופק אך ורק על ידי הורים או אפוטרופוסים חוקיים</li>
        <li>מידע על ילדים משמש <strong className={b}>אך ורק</strong> ליצירת תוכן ספר מותאם אישית</li>
        <li>מידע על ילדים <strong className={b}>לעולם לא</strong> נמכר, משותף לפרסום, משמש לפרופילינג או ממומן בכל דרך</li>
        <li>תמונות ילדים מאוחסנות באופן מאובטח עם הצפנה ובקרות גישה ברמת שורה</li>
        <li>עיבוד AI של נתוני ילדים מוגבל לתיאורי טקסט — תמונות אינן נשלחות לשירותי AI</li>
      </ul>
      <h3 className={h3Class}>זכויות הורים</h3>
      <p>כהורה או אפוטרופוס חוקי, יש לכם הזכות:</p>
      <ul className="list-disc pl-6 mt-2 space-y-1.5">
        <li>לבדוק את מידע הילד שאנו מאחסנים</li>
        <li>לבקש תיקון מידע לא מדויק על הילד</li>
        <li>לבקש מחיקת נתוני ילדכם בכל עת</li>
        <li>לבטל הסכמה לאיסוף ושימוש עתידי במידע על ילדכם</li>
      </ul>
      <p className="mt-3">למימוש זכויות אלו, פנו אלינו ב-<a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. נשיב תוך 30 יום.</p>
    </section>

    <section id="storage">
      <h2 className={h2Class}>אחסון ואבטחת מידע</h2>
      <p>אנו מיישמים אמצעי אבטחה בתקן התעשייה להגנה על המידע האישי שלכם:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>הצפנה:</strong> הנתונים מוצפנים במעבר (TLS 1.2+) ובמנוחה</li>
        <li><strong className={b}>בקרות גישה:</strong> אבטחה ברמת שורה מבטיחה שמשתמשים יכולים לגשת רק לנתונים שלהם</li>
        <li><strong className={b}>אימות:</strong> אימות מאובטח עם אימות אימייל וגיבוב סיסמאות</li>
        <li><strong className={b}>ניטור:</strong> ניטור מתמשך לזיהוי ניסיונות גישה לא מורשים</li>
        <li><strong className={b}>תשתית:</strong> מאוחסן על תשתית ענן ברמה ארגונית עם גיבוי ויתירות אוטומטיים</li>
      </ul>
      <p className="mt-3">למרות שאנו שואפים להגן על המידע שלכם, אין שיטת שידור או אחסון אלקטרוני שהיא מאובטחת ב-100%. איננו יכולים להבטיח אבטחה מוחלטת אך מחויבים לטפל מיידית בכל תקרית אבטחה.</p>
    </section>

    <section id="cookies">
      <h2 className={h2Class}>עוגיות ואחסון מקומי</h2>
      <p>אנו משתמשים בטכנולוגיות אחסון דפדפן מינימליות:</p>
      <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-background/50"><th className="text-right p-4 font-semibold text-foreground">סוג</th><th className="text-right p-4 font-semibold text-foreground">מטרה</th><th className="text-right p-4 font-semibold text-foreground">משך</th></tr></thead>
          <tbody className="divide-y divide-border/30">
            <tr><td className="p-4 font-medium text-foreground">עוגיית סשן</td><td className="p-4">אימות ואבטחה</td><td className="p-4">סשן</td></tr>
            <tr><td className="p-4 font-medium text-foreground">אחסון מקומי</td><td className="p-4">העדפת ערכת נושא, מצב עגלת קניות</td><td className="p-4">קבוע</td></tr>
            <tr><td className="p-4 font-medium text-foreground">טוקן אימות</td><td className="p-4">שמירה על סשן מחובר</td><td className="p-4">30 יום</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">אנו <strong className={b}>לא</strong> משתמשים בעוגיות מעקב של צד שלישי, עוגיות אנליטיקה או פיקסלי פרסום.</p>
    </section>

    <section id="international">
      <h2 className={h2Class}>העברות נתונים בינלאומיות</h2>
      <p>Torah Tale מבוססת בארצות הברית. אם אתם ניגשים לשירות מחוץ לארצות הברית, שימו לב שהמידע שלכם עשוי להיות מועבר, מאוחסן ומעובד בארצות הברית ובמדינות אחרות בהן פועלים ספקי השירות שלנו.</p>
      <p className="mt-3">בשימושכם בשירות, אתם מסכימים להעברת המידע שלכם למדינות שעשויות להיות להן חוקי הגנת נתונים שונים ממדינת מגוריכם. אנו נוקטים אמצעי הגנה מתאימים כדי להבטיח שהמידע שלכם יישאר מוגן בהתאם למדיניות פרטיות זו.</p>
    </section>

    <section id="rights">
      <h2 className={h2Class}>הזכויות שלכם</h2>
      <p>בהתאם לתחום השיפוט שלכם, עשויות להיות לכם הזכויות הבאות בנוגע למידע האישי שלכם:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>גישה:</strong> בקשו עותק של הנתונים האישיים שאנו מחזיקים עליכם ועל ילדיכם</li>
        <li><strong className={b}>תיקון:</strong> בקשו תיקון מידע לא מדויק או חלקי</li>
        <li><strong className={b}>מחיקה:</strong> בקשו מחיקת חשבונכם וכל הנתונים הקשורים, כולל פרופילי ילדים והיסטוריית ספרים</li>
        <li><strong className={b}>ניידות:</strong> בקשו את הנתונים שלכם בפורמט מובנה וקריא למכונה</li>
        <li><strong className={b}>הגבלה:</strong> בקשו שנגביל את עיבוד הנתונים שלכם בנסיבות מסוימות</li>
        <li><strong className={b}>התנגדות:</strong> התנגדו לעיבוד הנתונים שלכם למטרות מסוימות</li>
        <li><strong className={b}>ביטול:</strong> בטלו הסכמה בכל עת כאשר העיבוד מבוסס על הסכמה</li>
      </ul>
      <p className="mt-3">למימוש כל אחת מזכויות אלו, שלחו אימייל אל <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. נשיב תוך 30 יום. ייתכן שנצטרך לאמת את זהותכם לפני עיבוד בקשתכם.</p>
    </section>

    <section id="retention">
      <h2 className={h2Class}>שמירת מידע</h2>
      <p>אנו שומרים את המידע שלכם כל עוד הדבר נחוץ למתן השירות ולמילוי המטרות המתוארות במדיניות זו:</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>נתוני חשבון:</strong> נשמרים כל עוד החשבון פעיל ו-30 יום לאחר בקשת מחיקה</li>
        <li><strong className={b}>פרופילי ילדים:</strong> נשמרים עד שתבקשו מחיקה או תמחקו את חשבונכם</li>
        <li><strong className={b}>תוכן ספרים:</strong> נשמר עד שתבקשו מחיקה או תמחקו את חשבונכם</li>
        <li><strong className={b}>רשומות הזמנות:</strong> נשמרות ל-7 שנים למטרות משפטיות וחשבונאיות</li>
        <li><strong className={b}>נתוני שימוש:</strong> נתונים אנונימיים ומצטברים עשויים להישמר ללא הגבלת זמן לשיפור השירות</li>
      </ul>
      <p className="mt-3">עם מחיקת החשבון, כל הנתונים האישיים, פרופילי הילדים, התמונות והיסטוריית הספרים יוסרו לצמיתות תוך 30 יום. נתונים אנונימיים ומצטברים עשויים להישמר לאנליטיקה.</p>
    </section>

    <section id="ccpa">
      <h2 className={h2Class}>זכויות פרטיות בקליפורניה (CCPA)</h2>
      <p>אם אתם תושבי קליפורניה, יש לכם זכויות נוספות על פי חוק פרטיות הצרכן של קליפורניה (CCPA):</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>הזכות לדעת:</strong> תוכלו לבקש גילוי של קטגוריות ופריטים ספציפיים של מידע אישי שאספנו עליכם</li>
        <li><strong className={b}>הזכות למחוק:</strong> תוכלו לבקש מחיקת המידע האישי שלכם, בכפוף לחריגים מסוימים</li>
        <li><strong className={b}>הזכות לסרב:</strong> אנו לא מוכרים מידע אישי, ולכן אין צורך בסירוב</li>
        <li><strong className={b}>אי-אפליה:</strong> לא נפלה נגדכם על מימוש זכויות ה-CCPA שלכם</li>
      </ul>
      <p className="mt-3">להגשת בקשת CCPA, פנו אלינו ב-<a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a>. נאמת את זהותכם ונשיב תוך 45 יום.</p>
    </section>

    <section id="gdpr">
      <h2 className={h2Class}>זכויות פרטיות אירופיות (GDPR)</h2>
      <p>אם אתם נמצאים באזור הכלכלי האירופי (EEA), בריטניה או שוויץ, יש לכם זכויות על פי הרגולציה הכללית להגנת נתונים (GDPR):</p>
      <ul className="list-disc pl-6 mt-3 space-y-2">
        <li><strong className={b}>בסיס משפטי:</strong> אנו מעבדים את הנתונים שלכם על בסיס הסכמה (נתוני ילדים, יצירת חשבון), ביצוע חוזה (מתן שירות) ואינטרסים לגיטימיים (אבטחה, שיפור)</li>
        <li><strong className={b}>קצין הגנת מידע:</strong> תוכלו לפנות לקצין הגנת המידע שלנו ב-<a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></li>
        <li><strong className={b}>רשות פיקוח:</strong> יש לכם הזכות להגיש תלונה לרשות הגנת הנתונים המקומית שלכם</li>
      </ul>
    </section>

    <section id="changes">
      <h2 className={h2Class}>שינויים במדיניות</h2>
      <p>אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. כאשר נבצע שינויים מהותיים, אנו:</p>
      <ul className="list-disc pl-6 mt-3 space-y-1.5">
        <li>נעדכן את "תאריך התחולה" בראש עמוד זה</li>
        <li>נודיע למשתמשים רשומים באימייל לפחות 30 יום לפני שהשינויים ייכנסו לתוקף</li>
        <li>נספק סיכום של השינויים שבוצעו</li>
      </ul>
      <p className="mt-3">המשך השימוש שלכם בשירות לאחר תאריך התחולה של המדיניות המעודכנת מהווה הסכמתכם. אם אינכם מסכימים, אנא הפסיקו את השימוש ובקשו מחיקת חשבון.</p>
    </section>

    <section id="contact">
      <h2 className={h2Class}>צרו קשר</h2>
      <p>לשאלות, חששות או מימוש זכויות הקשורים לפרטיות, אנא פנו אלינו:</p>
      <div className={`mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2`}>
        <p><strong className={b}>Torah Tale, LLC</strong></p>
        <p>אימייל: <a href="mailto:help@torahtale.com" className={linkClass}>help@torahtale.com</a></p>
      </div>
      <p className="mt-4 text-sm">אנו שואפים להשיב לכל פניה הקשורה לפרטיות תוך 30 יום.</p>
    </section>
  </>
);

const Privacy = () => {
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
            {t.privacy.label}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t.privacy.title}
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>{t.privacy.effectiveDate}</span>
            <span className="hidden sm:inline">·</span>
            <Link to={t.privacy.crossLinkPath} className="text-accent hover:underline">{t.privacy.crossLink}</Link>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-6 py-12 lg:py-16 relative z-10">
        <div className="flex gap-12 lg:gap-16">
          {/* Sidebar TOC */}
          <aside className={`hidden lg:block w-56 shrink-0 ${isRtl ? "order-last" : ""}`}>
            <nav className="sticky top-28 space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">{t.privacy.tocLabel}</p>
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

export default Privacy;
