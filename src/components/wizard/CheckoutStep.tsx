import { useState, type ReactNode } from "react";
import { Crown, ShieldCheck, Check, Sparkles, TrendingDown, Zap, CalendarDays, Loader2, ChevronDown, Pencil, RefreshCw, ZoomIn, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";
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
import { shippingPrice, subPrice, formatMoney } from "@/lib/pricing";

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

/* The weekly plan is retired - a subscription is 4 books a month in ONE
 * delivery, which is what the monthly plan is. "weekly" stays in the types and
 * in SUB_PRICE because subscriptions sold under it are still live and still
 * render in the dashboard; it is simply no longer offered. */
function buildPlansForBook(bookPriceUsd: number): Plan[] {
  const monthly = friendly(bookPriceUsd * 4 * (1 - 0.20));
  const yearly = friendly(bookPriceUsd * 52 * (1 - 0.30));
  return [
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
    /** Keep this cover: it becomes the character the book's pages are drawn from. */
    save?: () => void;
    saving?: boolean;
    saved?: boolean;
    /** Out of re-rolls, and the one photo retake is still available. */
    canRetakePhoto?: boolean;
  };
  /**
   * Replacing a child's photo from inside the enlarged cover. Out of re-rolls
   * usually means the photo is the problem, so this is the way forward rather
   * than sending the customer back through the wizard to find the photo step.
   */
  coverRetake?: {
    children: Array<{ id: string; name: string }>;
    onPhoto: (childId: string, file: File, dataUrl: string) => void;
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
  coverRetake,
}: Props) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  // The cover opens full size in a dialog. Everything about the cover - what
  // it is, and the chance to roll another one - lives in there, so the summary
  // row stays a row about the order.
  const [coverOpen, setCoverOpen] = useState(false);
  // A replacement photo waiting to be cropped, from the enlarged cover.
  const [retakeFor, setRetakeFor] = useState<{ childId: string; src: string; fileName: string } | null>(null);
  const [selectedPlanLocal, setSelectedPlanLocal] = useState<PlanType>("monthly");
  const selectedPlan = selectedPlanProp ?? selectedPlanLocal;
  const setSelectedPlan = (p: PlanType) => {
    if (onSelectPlan) onSelectPlan(p);
    else setSelectedPlanLocal(p);
  };
  const [placingOrder, setPlacingOrder] = useState(false);
  const { t, lang, dir } = useLanguage();
  const { symbol, rate, code } = t.currency;

  const isIls = code === "ILS";
  const fmt = (amount: number) => formatMoney(amount, symbol);

  const unitBookPrice = calculateBookPriceForCurrency(bookOptions, code);
  const unitBaseBookPrice = calculateBookPriceForCurrency({ ...bookOptions, coloringBook: false }, code);
  const unitColoringAddonPrice = Math.max(0, unitBookPrice - unitBaseBookPrice);
  const bookPrice = unitBookPrice * quantity;
  const baseBookPrice = unitBaseBookPrice * quantity;
  const coloringAddonTotal = unitColoringAddonPrice * quantity;
  const discountAmount = bookPrice * volumeDiscount;
  const bookPriceAfterDiscount = bookPrice - discountAmount;
  // Standard shipping used to be free; both methods are charged now, per the
  // Shopify zones. See SHIPPING_PRICE in lib/pricing.ts.
  const shippingCost = shippingPrice(
    shipping.shippingMethod === "express" ? "express" : "standard", isIls,
  );

  const PLANS = buildPlansForBook(bookPrice);

  const isSubscription = selectedPlan !== "once";
  const activePlan = PLANS.find((p) => p.id === selectedPlan);

  // The subscription price MUST come from the same canonical table (subPrice) the
  // plan cards use - otherwise the summary shows a different number than the card
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
   * Leads with the actual product - the mockup of the format they picked, the
   * story name, and what it costs - because that is what someone is deciding
   * on. The line-by-line breakdown is real but secondary, so it collapses; each
   * changeable line carries an Edit that jumps back to the step that owns it,
   * which previously meant backing out of the flow entirely.
   */
  const isColoringBook = bookOptions.productType === "coloring";
  const formatDims =
    bookOptions.productType === "board" ? "6″×6″"
    : isColoringBook ? "8.5″×11″"
    : "8″×8″";
  const formatName =
    bookOptions.productType === "hardcover" ? t.bookOptions.hardcover
    : bookOptions.productType === "board" ? t.bookOptions.boardBook
    : isColoringBook ? t.productsShowcase.coloring
    : t.bookOptions.softcover;
  const formatLabel = `${formatName} ${formatDims}`;
  /* The standalone coloring book named itself twice - "Book for Adina and Ari ·
     Coloring Book 8.5″×11″" - as if a storybook came with a coloring book. It is
     the product, so it takes the name and the size follows it. */
  const productLine = isColoringBook
    ? `${t.checkout.coloringBookFor(childName)} · ${formatDims}`
    : `${t.checkout.bookFor(childName)} · ${formatLabel}`;
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
    <>
      {/* One card, no chrome of its own - the wizard wraps the plan chooser and
          this together so the whole summary reads as a single object. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border p-3 sm:p-4">
        {/* The customer's OWN cover once it exists - the point of the moment
            before paying is seeing the actual book, not a stock product shot.
            It is shown flat, not printed onto a mock-up: the format they chose
            doesn't change the artwork. Falls back to the product photo while
            it generates or if it could not be made. */}
        <button
          type="button"
          onClick={() => setCoverOpen(true)}
          aria-label={t.checkout.coverEnlarge}
          title={t.checkout.coverEnlarge}
          className="group/cover relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-muted/30 border border-border/50 shrink-0 cursor-zoom-in"
        >
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/cover:bg-black/25">
            <ZoomIn className="w-5 h-5 text-white opacity-0 drop-shadow transition-opacity group-hover/cover:opacity-100" />
          </div>
          <div className="absolute bottom-0.5 end-0.5 rounded-full bg-black/45 p-0.5">
            <ZoomIn className="w-3 h-3 text-white" />
          </div>
          {coverPreview?.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          )}
        </button>
        {/* The book, named once. No price here - it is on the plan card above
            and on the total below, and repeating it three more times was the
            main thing making this panel feel busy. */}
        <div className="min-w-[8rem] flex-1">
          <p className="font-display text-lg sm:text-xl font-bold text-primary leading-tight truncate">{storyLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {productLine}
            {quantity > 1 ? ` · ×${quantity}` : ""}
          </p>
          {/* Trying another cover lives inside the enlarged view now: it is a
              decision about the artwork, and it should be made looking at the
              artwork rather than at a 96px thumbnail. */}
          {coverPreview && (coverPreview.url || coverPreview.loading) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] text-accent font-medium">
                {coverPreview.loading ? t.checkout.coverPreparing : t.checkout.coverYours}
              </span>
              <button
                type="button"
                onClick={() => setCoverOpen(true)}
                className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-accent"
              >
                {t.checkout.coverEnlarge}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The cover, full size. This is where the artwork is actually judged, so
          this is where "try another" belongs - with the count of rolls left, so
          a customer can see what a retry costs them before spending one. */}
      <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
        <DialogContent dir={dir} className="max-w-lg p-3 sm:p-4 bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full overflow-hidden rounded-xl bg-muted/30">
              <img
                src={coverPreview?.url || FORMAT_THUMB[bookOptions.productType]}
                alt={storyLabel}
                decoding="async"
                className="w-full h-auto object-contain"
                style={!coverPreview?.url && lang !== "en" ? { transform: "scaleX(-1)" } : undefined}
              />
              {coverPreview?.loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 backdrop-blur-sm">
                  <Loader2 className="w-7 h-7 animate-spin text-accent" />
                  <span className="text-xs font-medium text-accent">{t.checkout.coverPreparing}</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <DialogTitle className="font-display text-lg font-bold text-primary leading-tight">{storyLabel}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">{productLine}</DialogDescription>
            </div>
            {coverPreview && !!coverPreview.url && !coverPreview.loading && (
              <div className="w-full space-y-2">
                {/* Keeping a cover is a real decision, not a bookmark: the child
                    on it becomes the character every page is drawn from. */}
                {coverPreview.save && (
                  coverPreview.saved ? (
                    <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-accent">
                      <Check className="w-3.5 h-3.5" />
                      {t.checkout.coverSaved}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="gold"
                      onClick={coverPreview.save}
                      disabled={coverPreview.saving}
                      className="w-full rounded-full gap-2"
                    >
                      {coverPreview.saving
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />}
                      {t.checkout.coverUseThis}
                    </Button>
                  )
                )}
                {coverPreview.saved && (
                  <p className="text-center text-[11px] leading-snug text-muted-foreground">
                    {t.checkout.coverSavedNote}
                  </p>
                )}

                {coverPreview.canRegenerate ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={coverPreview.regenerate}
                    className="w-full rounded-full gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t.checkout.coverTryAnother(coverPreview.regensLeft)}
                  </Button>
                ) : coverPreview.canRetakePhoto && coverRetake?.children.length ? (
                  /* Out of re-rolls almost always means the photo is the problem
                     - a dark shot, a side profile, the wrong child in frame. So
                     the way forward is a better photo, offered right here rather
                     than back through the wizard. A new photo earns a fresh set
                     of re-rolls. */
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-center text-[11px] leading-snug text-muted-foreground">
                      {t.checkout.coverRetakeHint}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {coverRetake.children.map((c) => (
                        <label
                          key={c.id}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-xs font-medium text-primary transition-colors hover:border-accent hover:text-accent"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {t.checkout.coverNewPhotoFor(c.name)}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";           // same file twice still fires
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => setRetakeFor({
                                childId: c.id, src: String(reader.result || ""), fileName: file.name,
                              });
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Say why the button is gone. Silence reads as a bug.
                  <p className="text-center text-xs text-muted-foreground">{t.checkout.coverNoRegensLeft}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* The replacement photo is cropped exactly the way the wizard crops one,
          so the reference the model gets is the same shape either way. */}
      <ImageCropDialog
        open={!!retakeFor}
        imageSrc={retakeFor?.src || null}
        fileName={retakeFor?.fileName}
        onCancel={() => setRetakeFor(null)}
        onCropped={(file, dataUrl) => {
          if (retakeFor) coverRetake?.onPhoto(retakeFor.childId, file, dataUrl);
          setRetakeFor(null);
        }}
      />

      {/* The expandable details are gone: every row in them repeated something
          already on screen. What did NOT appear elsewhere - an add-on, a volume
          discount, shipping - still shows, and only when it actually applies, so
          the ordinary order stays a clean card. */}
      {(bookOptions.coloringBook || (!isSubscription && volumeDiscount > 0) || shippingCost > 0) && (
        <div className="space-y-1.5 border-t border-border px-4 sm:px-5 py-2.5 text-xs">
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
          {shippingCost > 0 && (
            <div className="flex justify-between">
              {/* A subscription's books for the period ship TOGETHER - the
                  monthly plan is 4 books in one box - so shipping is charged
                  once per delivery, not once per book. Say so, or the single
                  line looks like it under-counts. */}
              <span className="text-muted-foreground">
                {isSubscription ? t.checkout.shippingOneDelivery : t.checkout.shippingLabel}
              </span>
              <span className="font-medium text-primary">{fmt(shippingCost)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-baseline border-t border-border bg-muted/25 px-4 sm:px-5 py-3 font-bold">
        <span className="text-primary">{t.checkout.totalToday}</span>
        <span className="text-accent text-lg">{fmt(total)}</span>
      </div>
    </>
  );
};
