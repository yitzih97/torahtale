import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
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

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const Terms = () => {
  const [activeSection, setActiveSection] = useState("overview");

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
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

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
            Legal
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            Terms of Service
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>Effective Date: March 27, 2026</span>
            <span className="hidden sm:inline">·</span>
            <Link to="/privacy" className="text-accent hover:underline">Privacy Policy →</Link>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-6 py-12 lg:py-16 relative z-10">
        <div className="flex gap-12 lg:gap-16">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-28 space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">On this page</p>
              {SECTIONS.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`block text-[13px] py-1.5 pl-3 border-l-2 transition-colors ${
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

              <section id="overview">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Overview</h2>
                <p>Welcome to Torah Tale. These Terms of Service ("Terms") govern your access to and use of the Torah Tale platform, including our website, applications, APIs, and all related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.</p>
                <p className="mt-3">Torah Tale is operated by Torah Tale, LLC ("we," "us," or "our"). Throughout these Terms, "you" or "user" refers to any individual or entity accessing the Service.</p>
                <p className="mt-3">We encourage you to read these Terms carefully and revisit them periodically. Your continued use of the Service constitutes acceptance of any updates.</p>
              </section>

              <section id="eligibility">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Eligibility</h2>
                <p>You must be at least 18 years of age to create an account and use the Service. By using Torah Tale, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding agreement. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
                <p className="mt-3">The Service is designed for parents and legal guardians to create personalized children's books. Children under 18 should not use the Service directly; all interactions must be facilitated by a parent or legal guardian.</p>
              </section>

              <section id="accounts">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Account Registration</h2>
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
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Service Description</h2>
                <p>Torah Tale is an AI-powered platform that creates personalized children's books ("seforim") rooted in Torah wisdom. Each book features your child as the main character in stories inspired by the weekly Torah portion (Parshas HaShavua).</p>
                <p className="mt-3">Our Service includes:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li><strong className="text-foreground">Book Creation:</strong> AI-generated stories and illustrations personalized with your child's name, appearance, and characteristics</li>
                  <li><strong className="text-foreground">Digital Previews:</strong> Interactive book previews with page-turning animations</li>
                  <li><strong className="text-foreground">Physical Printing:</strong> High-quality printed books in multiple formats, fulfilled through our print-on-demand partner</li>
                  <li><strong className="text-foreground">Subscription Plans:</strong> Recurring book delivery plans for weekly Torah portions</li>
                  <li><strong className="text-foreground">Dashboard:</strong> Account management, child profiles, order tracking, and book history</li>
                </ul>
              </section>

              <section id="free-tier">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Free Tier & Subscriptions</h2>
                <p>Registered users may generate up to <strong className="text-foreground">2 free book previews per calendar month</strong>. Free previews include full digital book content but do not include physical printing.</p>
                <p className="mt-3">To create additional books or receive printed copies, users must subscribe to one of our paid plans:</p>
                <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background/50">
                        <th className="text-left p-4 font-semibold text-foreground">Plan</th>
                        <th className="text-left p-4 font-semibold text-foreground">Price</th>
                        <th className="text-left p-4 font-semibold text-foreground">Includes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="p-4 font-medium text-foreground">Weekly</td>
                        <td className="p-4">$23.99/week</td>
                        <td className="p-4">1 printed sefer per week</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Monthly</td>
                        <td className="p-4">$79.99/month</td>
                        <td className="p-4">4 seforim per month</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Yearly</td>
                        <td className="p-4">$799.99/year</td>
                        <td className="p-4">52 seforim per year (best value)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">One-time book purchases are also available starting at $24.99 depending on the book format selected. All prices are in USD and subject to change with prior notice.</p>
              </section>

              <section id="pricing">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Book Formats & Pricing</h2>
                <p>Our printed books are available in the following formats:</p>
                <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background/50">
                        <th className="text-left p-4 font-semibold text-foreground">Format</th>
                        <th className="text-left p-4 font-semibold text-foreground">Size</th>
                        <th className="text-left p-4 font-semibold text-foreground">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="p-4 font-medium text-foreground">Softcover Photo Book</td>
                        <td className="p-4">8″ × 8″</td>
                        <td className="p-4">$24.99</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Hardcover Photo Book</td>
                        <td className="p-4">8″ × 8″ or 11″ × 8.5″</td>
                        <td className="p-4">$39.99</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Board Book</td>
                        <td className="p-4">6″ × 6″ (rounded corners)</td>
                        <td className="p-4">$44.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">All books contain 10 pages of AI-generated, personalized content. Each book includes a custom cover, story pages, and back cover. Shipping costs are calculated at checkout based on your location.</p>
              </section>

              <section id="payments">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Payments & Billing</h2>
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
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Print & Fulfillment</h2>
                <p>Physical books are printed and fulfilled through our print-on-demand partner, Printify. By placing an order, you acknowledge and agree that:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>Your shipping address and book content will be shared with Printify for production and delivery</li>
                  <li>Delivery times typically range from <strong className="text-foreground">5–14 business days</strong> depending on your location</li>
                  <li>International orders may be subject to customs duties and import taxes, which are the responsibility of the buyer</li>
                  <li>We are not responsible for delays caused by shipping carriers, customs processing, or force majeure events</li>
                  <li>Delivery confirmation is provided via the tracking information shared at the time of shipment</li>
                </ul>
              </section>

              <section id="ip">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Intellectual Property</h2>
                <p>The Torah Tale platform, including its design, branding, software, algorithms, and proprietary technology, is owned by Torah Tale, LLC and protected by applicable intellectual property laws.</p>
                <p className="mt-3"><strong className="text-foreground">Your Content:</strong> You retain all rights to the personal information you provide, including your child's name, photos, and descriptions.</p>
                <p className="mt-3"><strong className="text-foreground">Generated Content:</strong> AI-generated stories, illustrations, and book designs remain the intellectual property of Torah Tale. Upon purchase, you are granted a personal, non-exclusive, non-transferable, non-commercial license to use, display, and share your purchased books for personal and family use.</p>
                <p className="mt-3">You may not reproduce, distribute, sell, or commercially exploit any AI-generated content without our prior written consent.</p>
              </section>

              <section id="user-content">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">User Content</h2>
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
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Children's Data</h2>
                <p>Torah Tale takes children's privacy extremely seriously. We comply with the Children's Online Privacy Protection Act (COPPA) and similar international regulations.</p>
                <p className="mt-3">Key commitments regarding children's data:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>We do not knowingly collect information directly from children under 13</li>
                  <li>All child information is provided exclusively by parents or legal guardians</li>
                  <li>Child data (name, age, gender, description, photo) is used <strong className="text-foreground">solely</strong> for book personalization</li>
                  <li>Child data is never sold, shared for advertising, or used for profiling</li>
                  <li>Parents may request deletion of their child's data at any time</li>
                  <li>Child photos are stored securely with encryption and access controls</li>
                </ul>
                <p className="mt-3">For full details on how we handle children's data, please review our <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.</p>
              </section>

              <section id="ai-content">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">AI-Generated Content</h2>
                <p>Torah Tale uses artificial intelligence to generate personalized stories and illustrations. You acknowledge and agree that:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>AI-generated content is created algorithmically and may occasionally contain inaccuracies, inconsistencies, or unexpected outputs</li>
                  <li>Generated content is provided for <strong className="text-foreground">educational and entertainment purposes</strong> and should not be considered a substitute for formal Torah education or rabbinic guidance</li>
                  <li>We make reasonable efforts to ensure cultural and religious accuracy but cannot guarantee perfection in every generated piece</li>
                  <li>We reserve the right to review, modify, or remove generated content that violates our content guidelines</li>
                  <li>The style, quality, and output of AI-generated content may evolve over time as we improve our models and prompts</li>
                </ul>
              </section>

              <section id="acceptable-use">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Acceptable Use</h2>
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
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Refunds & Cancellations</h2>
                <p><strong className="text-foreground">Digital Content:</strong> Digital book previews are provided as part of the Service and are non-refundable.</p>
                <p className="mt-3"><strong className="text-foreground">Printed Books:</strong> If you receive a damaged, defective, or materially different product, please contact us within <strong className="text-foreground">14 days of delivery</strong>. We will arrange a replacement or full refund at our discretion. Please include photos of the damaged product with your request.</p>
                <p className="mt-3"><strong className="text-foreground">Subscriptions:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial refunds are provided for unused portions of a billing period. Books already in production at the time of cancellation will still be delivered.</p>
              </section>

              <section id="liability">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Limitation of Liability</h2>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, TORAH TALE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</p>
                <p className="mt-3">Our total aggregate liability for any claims arising under these Terms shall not exceed the greater of (a) the amount you paid to Torah Tale in the twelve (12) months preceding the claim, or (b) one hundred dollars ($100).</p>
                <p className="mt-3">The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
              </section>

              <section id="indemnification">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Indemnification</h2>
                <p>You agree to indemnify, defend, and hold harmless Torah Tale, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any rights of a third party</li>
                  <li>Any content you submit to the Service</li>
                </ul>
              </section>

              <section id="termination">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Termination</h2>
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
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Governing Law</h2>
                <p>These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in New York County, New York.</p>
                <p className="mt-3">Any cause of action or claim you may have arising out of or relating to these Terms or the Service must be commenced within one (1) year after the cause of action accrues; otherwise, such cause of action or claim is permanently barred.</p>
              </section>

              <section id="changes">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Changes to Terms</h2>
                <p>We may modify these Terms at any time. When we make material changes, we will:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>Update the "Effective Date" at the top of this page</li>
                  <li>Notify registered users via email at least 30 days before changes take effect</li>
                  <li>Provide a summary of material changes</li>
                </ul>
                <p className="mt-3">Your continued use of the Service after the effective date of revised Terms constitutes your acceptance of the changes. If you do not agree to the updated Terms, you must stop using the Service and may request account deletion.</p>
              </section>

              <section id="contact">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Contact</h2>
                <p>If you have questions about these Terms, please contact us:</p>
                <div className="mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                  <p><strong className="text-foreground">Torah Tale, LLC</strong></p>
                  <p>Email: <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a></p>
                </div>
              </section>

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
