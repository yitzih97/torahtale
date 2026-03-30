import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Zap, CalendarDays, Check, TrendingDown, Loader2, Sparkles, CreditCard, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PlanType = "weekly" | "monthly" | "yearly";
type DialogStep = "plan" | "payment";

interface Plan {
  id: PlanType;
  label: string;
  price: number;
  perWeek: number;
  savings: string;
  icon: typeof Crown;
  badge?: string;
  description: string;
  frequency: string;
}

const PLANS: Plan[] = [
  {
    id: "weekly",
    label: "Weekly",
    price: 23.99,
    perWeek: 23.99,
    savings: "20% off",
    icon: Zap,
    description: "A new Torah adventure every Shabbos",
    frequency: "weekly",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: 79.99,
    perWeek: 19.99,
    savings: "33% off",
    icon: Crown,
    badge: "MOST POPULAR",
    description: "4 seforim/month — best value for mishpachos",
    frequency: "monthly",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 799.99,
    perWeek: 15.38,
    savings: "49% off",
    icon: CalendarDays,
    description: "Full year of seforim — biggest savings",
    frequency: "yearly",
  },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  context?: "limit-reached" | "wizard-step";
}

export const SubscriptionUpsellDialog = ({ open, onClose, onSubscribed, context = "limit-reached" }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [step, setStep] = useState<DialogStep>("plan");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [billingZip, setBillingZip] = useState("");

  const activePlan = PLANS.find(p => p.id === selectedPlan)!;

  const isPaymentValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardName.trim().length > 0 &&
    billingZip.trim().length >= 5;

  const handleGoToPayment = () => {
    if (!user) {
      toast.error("Please sign in to subscribe.");
      return;
    }
    setStep("payment");
  };

  const handleSubmitPayment = async () => {
    if (!activePlan || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        frequency: activePlan.frequency,
        price_per_week: activePlan.perWeek,
        status: "active",
      });

      if (error) throw error;

      toast.success(`Subscribed to the ${activePlan.label} plan!`);
      onSubscribed?.();
      resetAndClose();
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error("Could not create subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep("plan");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardName("");
    setBillingZip("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-accent/20">
        {step === "plan" ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent p-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <DialogTitle className="font-display text-xl font-bold text-primary">
                  {context === "limit-reached" ? "Unlock Unlimited Seforim!" : "Join the Parashah Club"}
                </DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {context === "limit-reached"
                  ? "You've used your 2 free book previews this month. Subscribe to create unlimited personalized Torah seforim for your kinderlach!"
                  : "Subscribe and get a new personalized Torah sefer delivered every Shabbos!"}
              </p>
            </div>

            {/* Plans */}
            <div className="px-6 pb-2 space-y-3">
              {PLANS.map((plan) => {
                const isActive = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative w-full rounded-xl border-2 p-3.5 text-left transition-all duration-200 active:scale-[0.98] ${
                      isActive
                        ? "border-accent bg-accent/5 shadow-md shadow-accent/10 ring-1 ring-accent/20"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2.5 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {plan.badge}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                      }`}>
                        {isActive ? <Check className="w-5 h-5" /> : <plan.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-primary">{plan.label}</span>
                          <span className="text-lg font-bold text-accent">${plan.price}</span>
                          <span className="text-xs text-muted-foreground">/{plan.id === "yearly" ? "yr" : plan.id === "monthly" ? "mo" : "wk"}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                        <TrendingDown className="w-3 h-3" /> {plan.savings}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-2 space-y-3">
              <Button
                variant="gold"
                size="lg"
                className="w-full rounded-xl h-12 text-base"
                onClick={handleGoToPayment}
              >
                <Crown className="w-4 h-4" />
                Subscribe — ${activePlan.price.toFixed(2)}/{selectedPlan === "yearly" ? "yr" : selectedPlan === "monthly" ? "mo" : "wk"}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                🚚 Free shipping · Cancel anytime · Secure checkout
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Payment Step Header */}
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent p-6 pb-4">
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to plans
              </button>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-accent" />
                <DialogTitle className="font-display text-xl font-bold text-primary">
                  Payment Details
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-accent/10 rounded-lg px-3 py-2">
                <Crown className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-primary">{activePlan.label} Plan</span>
                <span className="ml-auto text-sm font-bold text-accent">
                  ${activePlan.price.toFixed(2)}/{selectedPlan === "yearly" ? "yr" : selectedPlan === "monthly" ? "mo" : "wk"}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="px-6 pb-2 space-y-4">
              <div>
                <label className="text-xs font-medium text-primary mb-1.5 block">Name on Card</label>
                <Input
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-primary mb-1.5 block">Card Number</label>
                <div className="relative">
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="rounded-xl h-11 pl-10"
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">Expiry</label>
                  <Input
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="rounded-xl h-11"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">CVV</label>
                  <Input
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="rounded-xl h-11"
                    maxLength={4}
                    type="password"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">Billing ZIP</label>
                  <Input
                    placeholder="10001"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="rounded-xl h-11"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Secure badge + submit */}
            <div className="px-6 pb-6 pt-2 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>256-bit encryption · Your payment details are safe</span>
                <Lock className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
              </div>
              <Button
                variant="gold"
                size="lg"
                className="w-full rounded-xl h-12 text-base"
                onClick={handleSubmitPayment}
                disabled={isLoading || !isPaymentValid}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay ${activePlan.price.toFixed(2)} & Subscribe
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                🚚 Free shipping · Cancel anytime
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
