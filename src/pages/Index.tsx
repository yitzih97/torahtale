import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { GalleryReviewsSection } from "@/components/GalleryReviewsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("start") === "1") {
      setSearchParams({}, { replace: true });
      navigate("/create");
    }
  }, [searchParams, setSearchParams, navigate]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Defer until sections render
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [location.hash]);

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
