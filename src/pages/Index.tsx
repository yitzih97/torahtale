import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { GalleryReviewsSection } from "@/components/GalleryReviewsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { CreationWizard } from "@/components/CreationWizard";


const Index = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onStart={() => setWizardOpen(true)} />
      <HeroSection onStart={() => setWizardOpen(true)} />
      <HowItWorks />
      <GalleryReviewsSection />
      <CTASection onStart={() => setWizardOpen(true)} />
      <Footer />
      
      <AnimatePresence>
        {wizardOpen && <CreationWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
