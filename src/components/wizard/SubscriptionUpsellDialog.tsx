import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, CalendarDays, Check, TrendingDown, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PlanType = "weekly" | "monthly" | "yearly";

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

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  context?: "limit-reached" | "wizard-step";
}

export const SubscriptionUpsellDialog = ({ open, onClose, onSubscribed, context = "limit-reached" }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubscribe = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan || !user) {
      toast.error("Please sign in to subscribe.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        frequency: plan.frequency,
        price_per_week: plan.perWeek,
        status: "active",
      });

      if (error) throw error;

      toast.success(`Subscribed to the ${plan.label} plan!`);
      onSubscribed?.();
      onClose();
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error("Could not create subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-accent/20">
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
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Crown className="w-4 h-4" />
                Subscribe — ${PLANS.find(p => p.id === selectedPlan)?.price.toFixed(2)}/{selectedPlan === "yearly" ? "yr" : selectedPlan === "monthly" ? "mo" : "wk"}
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            🚚 Free shipping · Cancel anytime · Secure checkout
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
