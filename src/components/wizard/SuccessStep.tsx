import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useLanguage } from "@/contexts/LanguageContext";
import celebrationPopper from "@/assets/wizard/celebration-popper.png";

interface Props {
  childName: string;
  orderNumber?: string | null;
  onGoToDashboard: () => void;
  onCreateAnother?: () => void;
  onSendToGrandparents?: () => void;
}

export const SuccessStep = ({
  childName,
  orderNumber,
  onGoToDashboard,
  onCreateAnother,
  onSendToGrandparents,
}: Props) => {
  const { lang } = useLanguage();
  const isHe = lang === "he" || lang === "yi";

  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["hsl(43, 64%, 52%)", "hsl(233, 50%, 21%)", "#ffffff"];

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const title = isHe ? "הספר תורה שלך הולך להדפסה" : "Your Torah Tale Is Going to Print";
  const tagline = isHe
    ? `הספר התורה המותאם של ${childName || "הילד שלכם"} בדרך אליכם.`
    : `${childName || "Your child"}'s personalized Torah book is on its way.`;
  const orderLabel = isHe ? "מספר הזמנה" : "Order number";
  const dashCta = isHe ? "ללוח הבקרה שלי" : "Go to My Dashboard";
  const anotherCta = isHe ? "צור עוד ספר" : "Create Another Book";
  const grandCta = isHe ? "שלחו אחד לסבא וסבתא" : "Send One to Grandparents";

  return (
    <div className="py-10 text-center space-y-6 max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="w-48 h-48 mx-auto flex items-center justify-center"
      >
        <img src={celebrationPopper} alt="" width={256} height={256} loading="lazy" className="w-full h-full object-contain" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="font-display text-2xl sm:text-3xl font-bold text-primary"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-muted-foreground leading-relaxed"
      >
        {tagline}
      </motion.p>

      {orderNumber && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-sm"
        >
          <span className="text-muted-foreground">{orderLabel}:</span>
          <span className="font-mono font-bold text-accent">{orderNumber}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-muted/30 rounded-2xl border border-border p-5 text-sm space-y-2"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <Mail className="w-5 h-5 text-accent" />
        </div>
        <p className="font-semibold text-primary">{isHe ? "מה הלאה?" : "What happens next?"}</p>
        <ul className="text-muted-foreground text-xs space-y-1.5 text-start">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">1.</span>
            {isHe ? "אנו מסיימים את ההפקה והדפסה" : "We finalize production and send your book to print"}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">2.</span>
            {isHe ? "תקבלו אישור משלוח באימייל" : "You'll receive a shipping confirmation by email"}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">3.</span>
            {isHe ? "הספר מגיע לפתח דלתכם" : "Your book arrives at your door"}
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="space-y-3"
      >
        <Button variant="gold" size="lg" onClick={onGoToDashboard} className="rounded-xl h-12 px-8 w-full">
          {dashCta} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {onCreateAnother && (
            <Button variant="outline" onClick={onCreateAnother} className="rounded-xl h-11">
              <Plus className="w-4 h-4" /> {anotherCta}
            </Button>
          )}
          {onSendToGrandparents && (
            <Button variant="outline" onClick={onSendToGrandparents} className="rounded-xl h-11">
              <Heart className="w-4 h-4" /> {grandCta}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
