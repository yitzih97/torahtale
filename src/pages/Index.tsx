import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { GalleryReviewsSection } from "@/components/GalleryReviewsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("start") === "1") {
      setSearchParams({}, { replace: true });
      navigate("/create");
    }
  }, [searchParams, setSearchParams, navigate]);

  const goToCreate = () => navigate("/create");

  return (
    <div className="min-h-screen">
      <Navbar onStart={goToCreate} />
      <HeroSection onStart={goToCreate} />
      <HowItWorks />
      <GalleryReviewsSection />
      <CTASection onStart={goToCreate} />
      <Footer />
    </div>
  );
};

export default Index;
