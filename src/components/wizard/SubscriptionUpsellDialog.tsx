import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Zap, CalendarDays, Check, TrendingDown, Loader2, Sparkles, CreditCard, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type PlanType = "weekly" | "monthly" | "yearly";
type DialogStep = "plan" | "payment";

interface PlanData {
  id: PlanType;
  priceUsd: number;
  perWeekUsd: number;
  savings: string;
  savingsPct: number;
  booksPerPeriod: number;
  icon: typeof Crown;
  badge?: boolean;
  frequency: string;
}

/* Default fallback pricing (used when no bookPriceUsd is provided) */
const DEFAULT_PLANS: PlanData[] = [
  { id: "weekly", priceUsd: 23.99, perWeekUsd: 23.99, savings: "20% off", savingsPct: 0.20, booksPerPeriod: 1, icon: Zap, frequency: "weekly" },
  { id: "monthly", priceUsd: 79.99, perWeekUsd: 19.99, savings: "33% off", savingsPct: 0.33, booksPerPeriod: 4, icon: Crown, badge: true, frequency: "monthly" },
  { id: "yearly", priceUsd: 799.99, perWeekUsd: 15.38, savings: "49% off", savingsPct: 0.49, booksPerPeriod: 52, icon: CalendarDays, frequency: "yearly" },
];

/* Round to a friendly .99 price */
const friendly = (n: number) => Math.max(0.99, Math.round(n) - 0.01);

function buildPlansForBook(bookPriceUsd: number): PlanData[] {
  // Weekly: 1 book × (1 - 20%)
  // Monthly: 4 books × (1 - 33%)
  // Yearly: 52 books × (1 - 49%)
  const weekly = friendly(bookPriceUsd * 1 * (1 - 0.20));
  const monthly = friendly(bookPriceUsd * 4 * (1 - 0.33));
  const yearly = friendly(bookPriceUsd * 52 * (1 - 0.49));

  return [
    { id: "weekly", priceUsd: weekly, perWeekUsd: weekly, savings: "20% off", savingsPct: 0.20, booksPerPeriod: 1, icon: Zap, frequency: "weekly" },
    { id: "monthly", priceUsd: monthly, perWeekUsd: monthly / 4, savings: "33% off", savingsPct: 0.33, booksPerPeriod: 4, icon: Crown, badge: true, frequency: "monthly" },
    { id: "yearly", priceUsd: yearly, perWeekUsd: yearly / 52, savings: "49% off", savingsPct: 0.49, booksPerPeriod: 52, icon: CalendarDays, frequency: "yearly" },
  ];
}

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
  /** Per-book USD price (customer-facing) — used to compute plan prices */
  bookPriceUsd?: number;
  /** Optional book label (e.g. "Hardcover Book") shown for context */
  bookLabel?: string;
}

export const SubscriptionUpsellDialog = ({ open, onClose, onSubscribed, context = "limit-reached", bookPriceUsd, bookLabel }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [step, setStep] = useState<DialogStep>("plan");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { symbol, rate, code } = t.currency;

  const PLANS = useMemo(
    () => (bookPriceUsd && bookPriceUsd > 0 ? buildPlansForBook(bookPriceUsd) : DEFAULT_PLANS),
    [bookPriceUsd]
  );

  // When a bookPriceUsd is provided we treat it as already-in-display-currency
  // (caller decides USD vs ILS). Otherwise fall back to converted USD pricing.
  const fmt = (amount: number) =>
    bookPriceUsd ? `${symbol}${amount.toFixed(2)}` : `${symbol}${(amount * rate).toFixed(2)}`;
  const periodLabel = (id: string) =>
    id === "yearly" ? (code === "ILS" ? "שנה" : "yr")
    : id === "monthly" ? (code === "ILS" ? "חודש" : "mo")
    : (code === "ILS" ? "שבוע" : "wk");

  const planLabels: Record<string, string> = {
    weekly: t.checkout.weekly,
    monthly: t.checkout.monthly,
    yearly: t.checkout.yearly,
  };

  const planDescs: Record<string, string> = {
    weekly: t.checkout.weeklyDesc,
    monthly: t.checkout.monthlyDesc,
    yearly: t.checkout.yearlyDesc,
  };

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
      toast.error(t.upsell.signInToSubscribe);
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
        price_per_week: activePlan.perWeekUsd,
        status: "active",
      });

      if (error) throw error;

      toast.success(t.upsell.subscribed(planLabels[activePlan.id]));
      onSubscribed?.();
      resetAndClose();
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error(t.upsell.subError);
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
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent p-6 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <DialogTitle className="font-display text-xl font-bold text-primary">
                  {context === "limit-reached" ? t.upsell.unlockTitle : t.upsell.joinTitle}
                </DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {context === "limit-reached" ? t.upsell.limitMsg : t.upsell.joinMsg}
              </p>
              {bookPriceUsd && bookLabel && (
                <div className="mt-3 inline-flex items-center gap-2 bg-accent/10 rounded-full px-3 py-1.5">
                  <BookBadgeIcon />
                  <span className="text-xs font-semibold text-primary">{bookLabel}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-bold text-accent">{fmt(bookPriceUsd)}/book</span>
                </div>
              )}
            </div>

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
                        {t.bookOptions.mostPopular}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                      }`}>
                        {isActive ? <Check className="w-5 h-5" /> : <plan.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-display font-bold text-primary">{planLabels[plan.id]}</span>
                          <span className="text-lg font-bold text-accent">{fmt(plan.priceUsd)}</span>
                          <span className="text-xs text-muted-foreground">/{periodLabel(plan.id)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {bookPriceUsd
                            ? `${plan.booksPerPeriod} book${plan.booksPerPeriod > 1 ? "s" : ""} · ${fmt(plan.perWeekUsd)}/wk avg`
                            : planDescs[plan.id]}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                        <TrendingDown className="w-3 h-3" /> {plan.savings}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-6 pb-6 pt-2 space-y-3">
              <Button
                variant="gold"
                size="lg"
                className="w-full rounded-xl h-12 text-base"
                onClick={handleGoToPayment}
              >
                <Crown className="w-4 h-4" />
                {t.upsell.subscribe} — {fmt(activePlan.priceUsd)}/{periodLabel(selectedPlan)}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                {t.upsell.freeShipCancel}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-transparent p-6 pb-4">
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {t.upsell.backToPlans}
              </button>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-accent" />
                <DialogTitle className="font-display text-xl font-bold text-primary">
                  {t.upsell.paymentDetails}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-accent/10 rounded-lg px-3 py-2">
                <Crown className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-primary">{planLabels[activePlan.id]} {t.checkout.plan}</span>
                <span className="ml-auto text-sm font-bold text-accent">
                  {fmt(activePlan.priceUsd)}/{periodLabel(selectedPlan)}
                </span>
              </div>
            </div>

            <div className="px-6 pb-2 space-y-4">
              <div>
                <label className="text-xs font-medium text-primary mb-1.5 block">{t.upsell.nameOnCard}</label>
                <Input placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs font-medium text-primary mb-1.5 block">{t.upsell.cardNumber}</label>
                <div className="relative">
                  <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} className="rounded-xl h-11 pl-10" maxLength={19} />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">{t.upsell.expiry}</label>
                  <Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} className="rounded-xl h-11" maxLength={5} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">{t.upsell.cvv}</label>
                  <Input placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className="rounded-xl h-11" maxLength={4} type="password" />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">{t.upsell.billingZip}</label>
                  <Input placeholder="10001" value={billingZip} onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-xl h-11" maxLength={10} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>{t.upsell.encryption}</span>
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
                    {t.upsell.paySubscribe((bookPriceUsd ? activePlan.priceUsd : activePlan.priceUsd * rate).toFixed(2))}
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                {t.upsell.freeShipCancelShort}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const BookBadgeIcon = () => (
  <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
