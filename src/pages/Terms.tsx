import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container max-w-3xl mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-display font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 27, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              Torah Tale ("we," "us," or "our") provides an AI-powered platform that creates personalized children's books ("seforim") rooted in Torah wisdom. Each book features your child as the main character in stories based on the weekly Torah portion (Parshas HaShavua). Our service includes digital book previews, physical printed books, and subscription plans for recurring deliveries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use our services, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Free Tier & Subscription Plans</h2>
            <p className="text-muted-foreground leading-relaxed">
              Registered users may generate up to 2 free book previews per calendar month. To create additional books or receive printed copies, users must subscribe to one of our paid plans:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Weekly Plan</strong> — $23.99/week: A new personalized sefer delivered each week</li>
              <li><strong>Monthly Plan</strong> — $79.99/month: 4 seforim per month</li>
              <li><strong>Yearly Plan</strong> — $799.99/year: A full year of weekly seforim at the best value</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              One-time book purchases are also available starting at $24.99 depending on the book format selected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Book Formats & Pricing</h2>
            <p className="text-muted-foreground leading-relaxed">Our printed books are available in the following formats:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Softcover Photo Book</strong> (8″×8″) — $24.99</li>
              <li><strong>Hardcover Photo Book</strong> (8″×8″ or 11″×8.5″) — $39.99</li>
              <li><strong>Board Book</strong> (6″×6″, rounded corners) — $44.99</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed securely through Shopify. By making a purchase, you agree to Shopify's terms of service and payment processing policies. We do not store your credit card information on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Print & Fulfillment</h2>
            <p className="text-muted-foreground leading-relaxed">
              Physical books are printed and fulfilled through our print-on-demand partner, Printify. Delivery times vary based on your location and typically range from 5–14 business days. We are not responsible for delays caused by shipping carriers or customs processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Book content is generated using artificial intelligence based on Torah sources and user-provided information. You retain rights to the personal information you provide (child's name, photos, descriptions). The AI-generated stories, illustrations, and book designs remain the intellectual property of Torah Tale. You are granted a personal, non-commercial license to use your purchased books.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. User Content & Children's Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using our service, you confirm that you are the parent or legal guardian of any child whose information you provide. You grant us permission to use the child's name, age, gender, and optional photo solely for the purpose of generating personalized book content. We handle all children's data with the utmost care and in compliance with applicable privacy laws. See our Privacy Policy for details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Refunds & Cancellations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Digital book previews are non-refundable. For printed books, if you receive a damaged or defective product, please contact us within 14 days of delivery for a replacement or refund. Subscription plans may be canceled at any time; cancellation takes effect at the end of the current billing period. No partial refunds are provided for unused portions of a billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Torah Tale provides its services "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for the specific product or service giving rise to the claim. AI-generated content is provided for educational and entertainment purposes and should not be considered a substitute for formal Torah education.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at our discretion if you violate these terms, engage in abusive behavior, or attempt to exploit the free tier limits. You may delete your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. We will notify users of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us at <a href="mailto:support@torahtale.com" className="text-accent hover:underline">support@torahtale.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
