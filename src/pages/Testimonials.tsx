import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { useNavigate } from "react-router-dom";

const Testimonials = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Testimonials — What Families Say About Torah Tale"
        description="Real reviews from frum families enjoying their personalized Torah Tale storybooks. See why children light up when they become the star of the parsha."
        path="/testimonials"
      />
      <Navbar onStart={() => navigate("/pricing")} transparentHero={false} />
      <main className="pt-24 lg:pt-28">
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;
