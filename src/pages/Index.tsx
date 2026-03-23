import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { GallerySection } from "@/components/GallerySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { CreationWizard } from "@/components/CreationWizard";

const Index = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection onStart={() => setWizardOpen(true)} />
      <HowItWorks />
      <GallerySection />
      <TestimonialsSection />
      <CTASection onStart={() => setWizardOpen(true)} />
      <Footer />
      <AnimatePresence>
        {wizardOpen && <CreationWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
