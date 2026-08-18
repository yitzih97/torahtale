import { useState, type ReactNode } from "react";
import { Crown, ShieldCheck, Check, Sparkles, TrendingDown, Zap, CalendarDays, Loader2, ChevronDown, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ShippingData } from "./ShippingForm";
import { getPortionLabel, getPortionDisplay } from "./TorahPortions";
import { type BookOptions, calculateBookPriceForCurrency, PAGES_BY_TYPE } from "./BookOptionsStep";
import softcoverThumb from "@/assets/books/thumb-softcover.jpg";
import hardcoverThumb from "@/assets/books/thumb-hardcover.jpg";
import boardThumb from "@/assets/books/thumb-board.jpg";
import coloringThumb from "@/assets/books/thumb-coloring.jpg";

/** The actual product shot for the format the customer chose. */
const FORMAT_THUMB: Record<BookOptions["productType"], string> = {
  softcover: softcoverThumb,
  hardcover: hardcoverThumb,
  board: boardThumb,
  coloring: coloringThumb,
};
import { subPrice } from "@/lib/pricing";

export type PlanType = "weekly" | "monthly" | "yearly" | "once";

interface Plan {
  id: PlanType;
  priceUsd: number;
  perWeekUsd: number;
  savings: string;
  icon: typeof Crown;
  badge?: boolean;
}

/* Round to a friendly .99 price */
const friendly = (n: number) => Math.max(0.99, Math.round(n) - 0.01);

function buildPlansForBook(bookPriceUsd: number): Plan[] {
  const weekly = friendly(bookPriceUsd * 1 * (1 - 0.10));
  const monthly = friendly(bookPriceUsd * 4 * (1 - 0.20));
  const yearly = friendly(bookPriceUsd * 52 * (1 - 0.30));
  return [
    { id: "weekly", priceUsd: weekly, perWeekUsd: weekly, savings: "10% off", icon: Zap },
    { id: "monthly", priceUsd: monthly, perWeekUsd: monthly / 4, savings: "20% off", icon: Crown, badge: true },
    { id: "yearly", priceUsd: yearly, perWeekUsd: yearly / 52, savings: "30% off", icon: CalendarDays },
  ];
}

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  shipping: ShippingData;
  bookOptions: BookOptions;
  onPlaceOrder: (planType: PlanType) => void;
  /** "plan" = choose plan only; "summary" = order summary + place-order button */
  mode?: "plan" | "summary";
  selectedPlan?: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
  quantity?: number;
  /** 0, 0.10 or 0.15 */
  volumeDiscount?: number;
  /** Override the CTA button label. Defaults to "Generate Book". */
  ctaLabel?: string;
  /** Override the CTA icon. Pass null to hide it. */
  ctaIcon?: ReactNode | null;
  /** Hide the CTA button entirely. */
  hideCta?: boolean;
  /** Jump back to the step that owns a summary line, so it can be changed. */
  onEdit?: (target: "story" | "format") => void;
  /** The customer's own generated cover, from useCoverPreview. */
  coverPreview?: {
    url: string | null;
    loading: boolean;
    error: string | null;
    regensLeft: number;
    canRegenerate: boolean;
    regenerate: () => void;
  };
}

export const CheckoutStep = ({
  childName,
  torahPortion,
  artStyle,
  shipping,
  bookOptions,
  onPlaceOrder,
  mode = "summary",
  selectedPlan: selectedPlanProp,
  onSelectPlan,
  quantity = 1,
  volumeDiscount = 0,
  ctaLabel,
  ctaIcon,
  hideCta = false,
  onEdit,
  coverPreview,
}: Props) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPlanLocal, setSelectedPlanLocal] = useState<PlanType>("monthly");
  const selectedPlan = selectedPlanProp ?? selectedPlanLocal;
  const setSelectedPlan = (p: PlanType) => {
    if (onSelectPlan) onSelectPlan(p);
    else setSelectedPlanLocal(p);
  };
  const [placingOrder, setPlacingOrder] = useState(false);
  const { t, lang } = useLanguage();
  const { symbol, rate, code } = t.currency;

  const isIls = code === "ILS";
  const fmt = (amount: number) => `${symbol}${amount.toFixed(2)}`;

  const unitBookPrice = calculateBookPriceForCurrency(bookOptions, code);
  const unitBaseBookPrice = calculateBookPriceForCurrency({ ...bookOptions, coloringBook: false }, code);
  const unitColoringAddonPrice = Math.max(0, unitBookPrice - unitBaseBookPrice);
  const bookPrice = unitBookPrice * quantity;
  const baseBookPrice = unitBaseBookPrice * quantity;
  const coloringAddonTotal = unitColoringAddonPrice * quantity;
  const discountAmount = bookPrice * volumeDiscount;
  const bookPriceAfterDiscount = bookPrice - discountAmount;
  const shippingCost = isIls
    ? (shipping.shippingMethod === "express" ? 35 : 0)
    : (shipping.shippingMethod === "express" ? 9.99 : 0);

  const PLANS = buildPlansForBook(bookPrice);

  const isSubscription = selectedPlan !== "once";
  const activePlan = PLANS.find((p) => p.id === selectedPlan);

  // The subscription price MUST come from the same canonical table (subPrice) the
  // plan cards use — otherwise the summary shows a different number than the card
  // the user selected (and than what Shopify actually charges).
  const subscriptionPrice = isSubscription
    ? subPrice(selectedPlan as "weekly" | "monthly" | "yearly", bookOptions.productType, isIls)
    : 0;

  const total = isSubscription
    ? subscriptionPrice + shippingCost
    : bookPriceAfterDiscount + shippingCost;

  const periodLabel = (id: string) =>
    id === "yearly" ? (t.currency.code === "ILS" ? "שנה" : "yr")
    : id === "monthly" ? (t.currency.code === "ILS" ? "חודש" : "mo")
    : (t.currency.code === "ILS" ? "שבוע" : "wk");

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

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await onPlaceOrder(selectedPlan);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ── Plan selection screen (Membership) ── */
  if (mode === "plan") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            {t.checkout.choosePlan}
          </h2>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-md mx-auto">
            {t.checkout.subscribeMsg(childName)}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {PLANS.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border-2 p-4 text-start transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                    : "border-border hover:border-accent/30 hover:shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {t.bookOptions.mostPopular}
                  </div>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                }`}>
                  {isActive ? <Check className="w-5 h-5" /> : <plan.icon className="w-5 h-5" />}
                </div>
                <p className="font-display font-bold text-base text-primary">{planLabels[plan.id]}</p>
                <div className="mt-1.5">
                  <span className="text-xl font-bold text-accent">{fmt(plan.priceUsd)}</span>
                  <span className="text-xs text-muted-foreground">/{periodLabel(plan.id)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{planDescs[plan.id]}</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" /> {plan.savings}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{fmt(plan.perWeekUsd)}/{t.currency.code === "ILS" ? "שבוע" : "wk"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setSelectedPlan(selectedPlan === "once" ? "monthly" : "once")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              selectedPlan === "once"
                ? "text-accent bg-accent/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {selectedPlan === "once" ? `✓ ${t.checkout.oneTimePurchase}` : `${t.checkout.skipSubscription} →`}
          </button>
        </div>
      </div>
    );
  }

  /* ── Order summary screen ──────────────────────────────────────────────────
   * Leads with the actual product — the mockup of the format they picked, the
   * story name, and what it costs — because that is what someone is deciding
   * on. The line-by-line breakdown is real but secondary, so it collapses; each
   * changeable line carries an Edit that jumps back to the step that owns it,
   * which previously meant backing out of the flow entirely.
   */
  const formatLabel =
    bookOptions.productType === "hardcover" ? `${t.bookOptions.hardcover} 8″×8″`
    : bookOptions.productType === "board" ? `${t.bookOptions.boardBook} 6″×6″`
    : bookOptions.productType === "coloring" ? `${t.productsShowcase.coloring} 8.5″×11″`
    : `${t.bookOptions.softcover} 8″×8″`;
  const storyLabel = getPortionDisplay(torahPortion, lang) || getPortionLabel(torahPortion);
  const artLabel = artStyle === "3d-pixar" ? "3D Pixar"
    : artStyle === "graphic-novel" ? t.checkout.artGraphicNovel : t.checkout.artCartoon;
  const pageCount = PAGES_BY_TYPE[bookOptions.productType] ?? 20;

  const EditBtn = ({ target }: { target: "story" | "format" }) => (
    onEdit ? (
      <button
        type="button"
        onClick={() => onEdit(target)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline shrink-0"
      >
        <Pencil className="w-3 h-3" /> {t.common.edit}
      </button>
    ) : null
  );

  const Row = ({ label, value, target }: { label: string; value: ReactNode; target?: "story" | "format" }) => (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="flex items-center gap-2 text-end">
        <span className="font-medium text-primary">{value}</span>
        {target && <EditBtn target={target} />}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* The book itself */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          {/* The customer's OWN cover once it exists — the point of the moment
              before paying is seeing the actual book, not a stock product shot.
              It is shown flat, not printed onto a mock-up: the format they chose
              doesn't change the artwork. Falls back to the product photo while
              it generates or if it could not be made. */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-muted/30 border border-border/50 shrink-0">
            {coverPreview?.url ? (
              <img src={coverPreview.url} alt={storyLabel} decoding="async" className="w-full h-full object-cover" />
            ) : (
              <img
                src={FORMAT_THUMB[bookOptions.productType]}
                alt={formatLabel}
                width={320}
                height={320}
                decoding="async"
                className="w-full h-full object-cover"
                style={lang === "en" ? undefined : { transform: "scaleX(-1)" }}
              />
            )}
            {coverPreview?.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg sm:text-xl font-bold text-primary leading-tight truncate">{storyLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.checkout.bookFor(childName)}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {formatLabel} · {t.checkout.pagesCount(pageCount)}
              {quantity > 1 ? ` · ×${quantity}` : ""}
            </p>
            {coverPreview && (coverPreview.url || coverPreview.loading) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[11px] text-accent font-medium">
                  {coverPreview.loading ? t.checkout.coverPreparing : t.checkout.coverYours}
                </span>
                {coverPreview.canRegenerate && (
                  <button
                    type="button"
                    onClick={coverPreview.regenerate}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent underline underline-offset-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.checkout.coverTryAnother(coverPreview.regensLeft)}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-end shrink-0">
            <p className="text-xl sm:text-2xl font-bold text-accent leading-none">{fmt(total)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isSubscription && activePlan ? `/${periodLabel(activePlan.id)}` : t.checkout.oneTimePurchase}
            </p>
          </div>
        </div>

        {/* Details — collapsed by default, so the panel stays clean */}
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <span className="font-medium">{t.checkout.orderDetails}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button>

        {detailsOpen && (
          <div className="px-4 sm:px-5 pb-4 space-y-2.5 text-sm border-t border-border pt-3.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t.checkout.bookFor(childName)}{quantity > 1 ? ` × ${quantity}` : ""}
              </span>
              <span className="font-medium text-primary">
                {isSubscription ? t.checkout.included : fmt(baseBookPrice)}
              </span>
            </div>
            {bookOptions.coloringBook && (
              <div className="flex justify-between text-accent">
                <span>{t.bookOptions.coloringBookAddon}{quantity > 1 ? ` × ${quantity}` : ""}</span>
                <span className="font-medium">{isSubscription ? t.checkout.included : fmt(coloringAddonTotal)}</span>
              </div>
            )}
            {!isSubscription && volumeDiscount > 0 && (
              <div className="flex justify-between text-accent">
                <span>{t.checkout.volumeDiscount(Math.round(volumeDiscount * 100))}</span>
                <span className="font-medium">−{fmt(discountAmount)}</span>
              </div>
            )}
            {!isSubscription && <Row label={t.wizard.story} value={storyLabel} target="story" />}
            <Row label={t.wizard.artStyle} value={<span className="capitalize">{artLabel}</span>} />
            <Row
              label={t.checkout.format}
              value={`${formatLabel}${bookOptions.coloringBook ? ` + ${t.bookOptions.coloringBookAddon}` : ""}`}
              target="format"
            />
            {shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.checkout.shippingLabel}</span>
                <span className="font-medium text-primary">{fmt(shippingCost)}</span>
              </div>
            )}
            {isSubscription && activePlan && (
              <div className="flex justify-between text-accent">
                <span>{t.checkout.planNamed(planLabels[activePlan.id])}</span>
                <span className="font-medium">{fmt(subscriptionPrice)}/{periodLabel(activePlan.id)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-baseline px-4 sm:px-5 py-3.5 border-t border-border bg-muted/25 font-bold">
          <span className="text-primary">{t.checkout.totalToday}</span>
          <span className="text-accent text-lg">{fmt(total)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <span>{t.checkout.secureCheckout}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        {t.checkout.disclaimer}
      </p>

      {!hideCta && (
        <Button
          variant="gold"
          size="lg"
          className="w-full rounded-xl h-12 text-base"
          onClick={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {ctaIcon === null ? null : (ctaIcon ?? <Sparkles className="w-4 h-4" />)}
              {ctaLabel ?? t.wizard.generateBook}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

