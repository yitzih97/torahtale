import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { useNavigate } from "react-router-dom";

const Testimonials = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar onStart={() => navigate("/pricing")} transparentHero={false} />
      <main className="pt-24 lg:pt-28">
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;
