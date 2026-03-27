import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container max-w-3xl mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-display font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 27, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
              <li><strong>Child Information:</strong> Child's name, age, gender, physical description, and optional photo — provided by you for book personalization</li>
              <li><strong>Shipping Information:</strong> Mailing address for physical book delivery</li>
              <li><strong>Payment Information:</strong> Processed securely by Shopify; we do not store credit card details</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and book creation history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Generate personalized Torah-based children's books using AI</li>
              <li>Process and fulfill print orders through our fulfillment partner</li>
              <li>Manage your account and subscription</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Improve our service and user experience</li>
              <li>Enforce our terms of service and free tier limits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">We use the following third-party services to operate Torah Tale:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Shopify:</strong> Payment processing and checkout. Your payment data is handled according to Shopify's privacy policy.</li>
              <li><strong>Printify:</strong> Print-on-demand fulfillment. Your shipping address and book content are shared with Printify to produce and deliver your order.</li>
              <li><strong>Google AI (Gemini):</strong> Story and image generation. Child information (name, age, gender, description) is sent to Google's AI services to create personalized content. Google's data handling policies apply to this processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Torah Tale takes children's privacy seriously. We do not knowingly collect information directly from children under 13. All child information is provided by parents or legal guardians. Child data (name, age, gender, description, photo) is used exclusively for book personalization and is never sold, shared for advertising, or used for any purpose other than creating the requested book content. Parents may request deletion of their child's data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption and access controls. Account data and book content are stored in our cloud database with row-level security ensuring users can only access their own data. Child photos are stored in secure cloud storage. We implement appropriate technical and organizational measures to protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cookies & Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use browser local storage to maintain your session, theme preference, and shopping cart state. We do not use third-party tracking cookies. Essential cookies are used for authentication and security purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Access</strong> the personal data we hold about you and your children</li>
              <li><strong>Correct</strong> inaccurate information in your account or child profiles</li>
              <li><strong>Delete</strong> your account and all associated data, including child profiles and book history</li>
              <li><strong>Export</strong> your data in a portable format</li>
              <li><strong>Opt out</strong> of non-essential communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To exercise these rights, contact us at <a href="mailto:privacy@torahtale.com" className="text-accent hover:underline">privacy@torahtale.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account data for as long as your account is active. Book content and child profiles are retained until you request deletion. If you delete your account, all personal data, child profiles, and book history will be permanently removed within 30 days. Anonymized, aggregated data may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of material changes via email. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or concerns, please contact us at <a href="mailto:privacy@torahtale.com" className="text-accent hover:underline">privacy@torahtale.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
