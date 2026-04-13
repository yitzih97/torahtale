import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
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

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const Privacy = () => {
  const [activeSection, setActiveSection] = useState("intro");

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
            Privacy Policy
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
            <Link to="/terms" className="text-accent hover:underline">Terms of Service →</Link>
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

              <section id="intro">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Introduction</h2>
                <p>Torah Tale, LLC ("Torah Tale," "we," "us," or "our") is committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered personalized children's book platform (the "Service").</p>
                <p className="mt-3">This Policy applies to all users of our website, applications, and related services. By using the Service, you consent to the data practices described in this Policy. If you do not agree, please discontinue use of the Service.</p>
                <p className="mt-3">We encourage you to read this Policy in its entirety. For questions, contact us at <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a>.</p>
              </section>

              <section id="info-collect">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Account Information:</strong> Name, email address, and password when you create an account</li>
                  <li><strong className="text-foreground">Child Information:</strong> Child's name, age, gender, physical description, and optional photo — provided by you for book personalization</li>
                  <li><strong className="text-foreground">Shipping Information:</strong> Mailing address, phone number, and recipient name for physical book delivery</li>
                  <li><strong className="text-foreground">Preferences:</strong> Art style preferences, language settings, Torah portion selections, and book format choices</li>
                  <li><strong className="text-foreground">Communications:</strong> Messages, feedback, and support requests you send to us</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Information Collected Automatically</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, book creation history, click patterns, and session duration</li>
                  <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, screen resolution, and device identifiers</li>
                  <li><strong className="text-foreground">Log Data:</strong> IP address, access times, referring URLs, and error logs</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Information We Do Not Collect</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Credit card numbers or financial account details (processed by Shopify)</li>
                  <li>Social Security numbers or government-issued identification</li>
                  <li>Information directly from children under 13</li>
                </ul>
              </section>

              <section id="how-we-use">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Service Delivery:</strong> Generate personalized Torah-based children's books using AI, including stories, illustrations, and cover designs</li>
                  <li><strong className="text-foreground">Order Fulfillment:</strong> Process and fulfill print orders through our fulfillment partner</li>
                  <li><strong className="text-foreground">Account Management:</strong> Create and manage your account, child profiles, and subscription plans</li>
                  <li><strong className="text-foreground">Communication:</strong> Send order confirmations, shipping updates, subscription notices, and important service announcements</li>
                  <li><strong className="text-foreground">Improvement:</strong> Analyze usage patterns to improve our service, AI models, and user experience</li>
                  <li><strong className="text-foreground">Security:</strong> Detect, prevent, and address fraud, abuse, and security incidents</li>
                  <li><strong className="text-foreground">Compliance:</strong> Enforce our terms of service, free tier limits, and legal obligations</li>
                </ul>
                <p className="mt-3">We do <strong className="text-foreground">not</strong> use your information for targeted advertising or sell it to third-party advertisers.</p>
              </section>

              <section id="sharing">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Information Sharing</h2>
                <p>We do not sell your personal information. We share your information only in the following circumstances:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Service Providers:</strong> With trusted third-party service providers who assist us in operating the Service (see Third-Party Services below)</li>
                  <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, subpoena, court order, or governmental regulation</li>
                  <li><strong className="text-foreground">Safety:</strong> To protect the rights, property, or safety of Torah Tale, our users, or the public</li>
                  <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
                  <li><strong className="text-foreground">Consent:</strong> With your explicit consent for any purpose not described in this Policy</li>
                </ul>
              </section>

              <section id="third-party">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Third-Party Services</h2>
                <p>We use the following third-party services to operate Torah Tale. Each processes only the minimum data necessary for their function:</p>
                <div className="mt-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-background/50 border border-border/30">
                    <h4 className="font-semibold text-foreground mb-1">Shopify — Payment Processing</h4>
                    <p className="text-sm">Handles checkout and payment processing. Your payment data (credit card, billing address) is managed entirely by Shopify and never touches our servers. <a href="https://www.shopify.com/legal/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Shopify Privacy Policy</a></p>
                  </div>
                  <div className="p-5 rounded-2xl bg-background/50 border border-border/30">
                    <h4 className="font-semibold text-foreground mb-1">Printify — Print Fulfillment</h4>
                    <p className="text-sm">Produces and ships physical books. We share your shipping address and book content (images and text) with Printify to fulfill your order. <a href="https://printify.com/privacy-policy/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Printify Privacy Policy</a></p>
                  </div>
                  <div className="p-5 rounded-2xl bg-background/50 border border-border/30">
                    <h4 className="font-semibold text-foreground mb-1">Google AI (Gemini) — Content Generation</h4>
                    <p className="text-sm">Generates personalized stories and illustrations. Child information (name, age, gender, physical description) is sent to Google's AI services for content creation. No photos are sent to AI services. <a href="https://policies.google.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></p>
                  </div>
                </div>
              </section>

              <section id="children">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Children's Privacy</h2>
                <p>Torah Tale takes children's privacy extremely seriously. We are committed to complying with the Children's Online Privacy Protection Act (COPPA) and similar international regulations.</p>
                
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Our Commitments</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do <strong className="text-foreground">not</strong> knowingly collect information directly from children under 13</li>
                  <li>All child information is provided exclusively by parents or legal guardians</li>
                  <li>Child data is used <strong className="text-foreground">solely</strong> for generating personalized book content</li>
                  <li>Child data is <strong className="text-foreground">never</strong> sold, shared for advertising, used for profiling, or monetized in any way</li>
                  <li>Child photos are stored securely with encryption and row-level access controls</li>
                  <li>AI processing of child data is limited to text descriptions — photos are not sent to AI services</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Parental Rights</h3>
                <p>As a parent or legal guardian, you have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1.5">
                  <li>Review the child information we have stored</li>
                  <li>Request correction of inaccurate child information</li>
                  <li>Request deletion of your child's data at any time</li>
                  <li>Revoke consent for future collection and use of your child's information</li>
                </ul>
                <p className="mt-3">To exercise these rights, contact us at <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a>. We will respond within 30 days.</p>
              </section>

              <section id="storage">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Data Storage & Security</h2>
                <p>We implement industry-standard security measures to protect your personal information:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Encryption:</strong> Data is encrypted in transit (TLS 1.2+) and at rest</li>
                  <li><strong className="text-foreground">Access Controls:</strong> Row-level security ensures users can only access their own data</li>
                  <li><strong className="text-foreground">Authentication:</strong> Secure authentication with email verification and password hashing</li>
                  <li><strong className="text-foreground">Monitoring:</strong> Continuous monitoring for unauthorized access attempts</li>
                  <li><strong className="text-foreground">Infrastructure:</strong> Hosted on enterprise-grade cloud infrastructure with redundancy and automatic backups</li>
                </ul>
                <p className="mt-3">While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but are committed to promptly addressing any security incidents.</p>
              </section>

              <section id="cookies">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Cookies & Local Storage</h2>
                <p>We use minimal browser storage technologies:</p>
                <div className="mt-4 rounded-2xl border border-border/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background/50">
                        <th className="text-left p-4 font-semibold text-foreground">Type</th>
                        <th className="text-left p-4 font-semibold text-foreground">Purpose</th>
                        <th className="text-left p-4 font-semibold text-foreground">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="p-4 font-medium text-foreground">Session Cookie</td>
                        <td className="p-4">Authentication and security</td>
                        <td className="p-4">Session</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Local Storage</td>
                        <td className="p-4">Theme preference, shopping cart state</td>
                        <td className="p-4">Persistent</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Auth Token</td>
                        <td className="p-4">Maintaining logged-in session</td>
                        <td className="p-4">30 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">We do <strong className="text-foreground">not</strong> use third-party tracking cookies, analytics cookies, or advertising pixels.</p>
              </section>

              <section id="international">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">International Data Transfers</h2>
                <p>Torah Tale is based in the United States. If you access the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.</p>
                <p className="mt-3">By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.</p>
              </section>

              <section id="rights">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Your Rights</h2>
                <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you and your children</li>
                  <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and all associated data, including child profiles and book history</li>
                  <li><strong className="text-foreground">Portability:</strong> Request your data in a structured, machine-readable format</li>
                  <li><strong className="text-foreground">Restriction:</strong> Request that we limit the processing of your data in certain circumstances</li>
                  <li><strong className="text-foreground">Objection:</strong> Object to the processing of your data for certain purposes</li>
                  <li><strong className="text-foreground">Withdrawal:</strong> Withdraw consent at any time where processing is based on consent</li>
                </ul>
                <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a>. We will respond within 30 days. We may need to verify your identity before processing your request.</p>
              </section>

              <section id="retention">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Data Retention</h2>
                <p>We retain your information for as long as necessary to provide the Service and fulfill the purposes described in this Policy:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Account Data:</strong> Retained while your account is active and for 30 days after deletion request</li>
                  <li><strong className="text-foreground">Child Profiles:</strong> Retained until you request deletion or delete your account</li>
                  <li><strong className="text-foreground">Book Content:</strong> Retained until you request deletion or delete your account</li>
                  <li><strong className="text-foreground">Order Records:</strong> Retained for 7 years for legal and accounting purposes</li>
                  <li><strong className="text-foreground">Usage Analytics:</strong> Anonymized and aggregated data may be retained indefinitely for service improvement</li>
                </ul>
                <p className="mt-3">Upon account deletion, all personal data, child profiles, photos, and book history will be permanently removed within 30 days. Some anonymized, aggregated data may be retained for analytics.</p>
              </section>

              <section id="ccpa">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">California Privacy Rights (CCPA)</h2>
                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Right to Know:</strong> You may request disclosure of the categories and specific pieces of personal information we have collected about you</li>
                  <li><strong className="text-foreground">Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions</li>
                  <li><strong className="text-foreground">Right to Opt-Out:</strong> We do not sell personal information, so no opt-out is necessary</li>
                  <li><strong className="text-foreground">Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
                </ul>
                <p className="mt-3">To make a CCPA request, contact us at <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a>. We will verify your identity and respond within 45 days.</p>
              </section>

              <section id="gdpr">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">European Privacy Rights (GDPR)</h2>
                <p>If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have rights under the General Data Protection Regulation (GDPR):</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong className="text-foreground">Legal Basis:</strong> We process your data based on consent (child data, account creation), contract performance (service delivery), and legitimate interests (security, improvement)</li>
                  <li><strong className="text-foreground">Data Protection Officer:</strong> You may contact our DPO at <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a></li>
                  <li><strong className="text-foreground">Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority</li>
                </ul>
              </section>

              <section id="changes">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Policy Changes</h2>
                <p>We may update this Privacy Policy from time to time. When we make material changes, we will:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5">
                  <li>Update the "Effective Date" at the top of this page</li>
                  <li>Notify registered users via email at least 30 days before changes take effect</li>
                  <li>Provide a summary of the changes made</li>
                </ul>
                <p className="mt-3">Your continued use of the Service after the effective date of the revised Policy constitutes your acceptance. If you disagree, please discontinue use and request account deletion.</p>
              </section>

              <section id="contact">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Contact Us</h2>
                <p>For privacy-related questions, concerns, or to exercise your rights, please contact us:</p>
                <div className="mt-4 p-6 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                  <p><strong className="text-foreground">Torah Tale, LLC</strong></p>
                  <p>Email: <a href="mailto:help@torahtale.com" className="text-accent hover:underline">help@torahtale.com</a></p>
                </div>
                <p className="mt-4 text-sm">We aim to respond to all privacy-related inquiries within 30 days.</p>
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

export default Privacy;
