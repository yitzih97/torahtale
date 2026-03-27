import { useEffect } from "react";
import { motion } from "framer-motion";
import { PartyPopper, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface Props {
  childName: string;
  onGoToDashboard: () => void;
}

export const SuccessStep = ({ childName, onGoToDashboard }: Props) => {
  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["hsl(43, 64%, 52%)", "hsl(233, 50%, 21%)", "#ffffff"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="py-12 text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto"
      >
        <PartyPopper className="w-12 h-12 text-accent" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="font-display text-3xl font-bold text-primary"
      >
        Mazel Tov! 🎉
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-muted-foreground max-w-sm mx-auto leading-relaxed"
      >
        Your order has been placed! We're creating {childName || "your child"}'s personalized Torah sefer and you'll receive an email preview within 24 hours for you to review and confirm.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-muted/30 rounded-2xl border border-border p-6 max-w-xs mx-auto text-sm space-y-2"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5 text-accent" />
        </div>
        <p className="font-semibold text-primary">What happens next?</p>
        <ul className="text-muted-foreground text-xs space-y-1.5 text-left">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">1.</span>
            We generate your book with AI illustrations
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">2.</span>
            You'll get an email preview within 24 hours
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">3.</span>
            Confirm and we'll print & ship your sefer!
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Button variant="gold" size="lg" onClick={onGoToDashboard} className="rounded-xl h-12 px-8">
          Go to My Dashboard <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
};
