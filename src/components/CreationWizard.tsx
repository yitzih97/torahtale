import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Plus,
  Users, BookOpen, Palette, Package, Check,
  Camera, Sun, User, Type, Calendar, Heart, Image, PenLine,
  Lock, Mail, LogIn, BookOpenCheck, Paintbrush, CheckCircle2, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { SparkleEffect } from "./SparkleEffect";
import { ShippingForm, DEFAULT_SHIPPING, type ShippingData } from "./wizard/ShippingForm";
import { CheckoutStep } from "./wizard/CheckoutStep";
import { SubscriptionUpsellDialog } from "./wizard/SubscriptionUpsellDialog";
import { SuccessStep } from "./wizard/SuccessStep";
import { BookOptionsStep, DEFAULT_BOOK_OPTIONS, type BookOptions } from "./wizard/BookOptionsStep";
import { StoryPreviewStep } from "./wizard/StoryPreviewStep";
import { QuantityStep, getVolumeDiscount } from "./wizard/QuantityStep";
import { TORAH_PORTIONS, TORAH_BOOKS, CATEGORY_META, getPortionLabel, getUpcomingParsha, type TorahOption } from "./wizard/TorahPortions";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChildren } from "@/hooks/useChildren";

/* ── preset images ── */
import presetBoyCartoon from "@/assets/presets/boy-cartoon.jpg";
import presetGirlCartoon from "@/assets/presets/girl-cartoon.jpg";
import presetBoy3dPixar from "@/assets/presets/boy-3d-pixar.jpg";
import presetGirl3dPixar from "@/assets/presets/girl-3d-pixar.jpg";
import presetBoyRealistic from "@/assets/presets/boy-realistic.jpg";
import presetGirlRealistic from "@/assets/presets/girl-realistic.jpg";
import presetToddlerBoy from "@/assets/presets/toddler-boy-cartoon.jpg";
import presetToddlerGirl from "@/assets/presets/toddler-girl-cartoon.jpg";
import presetPreschoolBoy from "@/assets/presets/preschool-boy-cartoon.jpg";
import presetPreschoolGirl from "@/assets/presets/preschool-girl-cartoon.jpg";
import presetExplorerBoy from "@/assets/presets/explorer-boy-cartoon.jpg";
import presetExplorerGirl from "@/assets/presets/explorer-girl-cartoon.jpg";
import presetPreteenBoy from "@/assets/presets/preteen-boy-cartoon.jpg";
import presetPreteenGirl from "@/assets/presets/preteen-girl-cartoon.jpg";
import presetDuoCartoon from "@/assets/presets/duo-cartoon.jpg";
import presetDuo3dPixar from "@/assets/presets/duo-3d-pixar.jpg";
import presetDuoRealistic from "@/assets/presets/duo-realistic.jpg";
import storybookPreview from "@/assets/books/style-story-preview.jpg";
import comicbookPreview from "@/assets/books/style-comic-preview.jpg";

/* ───────────────── types ───────────────── */

export interface ChildProfile {
  id: string;
  name: string;
  age: string;
  gender: string;
  photo: File | null;
  photoPreview: string | null;
  description: string;
  characterPreview: string | null;
}

const createChild = (): ChildProfile => ({
  id: crypto.randomUUID(),
  name: "",
  age: "",
  gender: "",
  photo: null,
  photoPreview: null,
  description: "",
  characterPreview: null,
});

interface WizardData {
  children: ChildProfile[];
  torahPortion: string;
  artStyle: string;
  narrativeStyle: "story" | "comic";
  language: string;
  pageCount: number;
  activeChildIdx: number;
}

const initialData: WizardData = {
  children: [createChild()],
  torahPortion: "",
  artStyle: "cartoon",
  narrativeStyle: "story",
  language: "english",
  pageCount: 10,
  activeChildIdx: 0,
};

/* ───────────────── AutoAdvanceStep ───────────────── */

function AutoAdvanceStep({ onAdvance, delayMs, children }: { onAdvance: () => void; delayMs: number; children: (progress: number) => React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / delayMs, 1);
      setProgress(p);
      if (p >= 1 && !firedRef.current) {
        firedRef.current = true;
        onAdvance();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delayMs, onAdvance]);

  return <>{children(progress)}</>;
}

/* ───────────────── preset lookup helpers ───────────────── */

const getStylePreset = (gender: string, style: string): string => {
  const map: Record<string, Record<string, string>> = {
    boy: { cartoon: presetBoyCartoon, "3d-pixar": presetBoy3dPixar, realistic: presetBoyRealistic },
    girl: { cartoon: presetGirlCartoon, "3d-pixar": presetGirl3dPixar, realistic: presetGirlRealistic },
    duo: { cartoon: presetDuoCartoon, "3d-pixar": presetDuo3dPixar, realistic: presetDuoRealistic },
  };
  return map[gender]?.[style] || presetBoyCartoon;
};

const getAgePreset = (gender: string, ageLabel: string): string => {
  const g = gender || "boy";
  const map: Record<string, Record<string, string>> = {
    boy: { "2-3": presetToddlerBoy, "4-5": presetPreschoolBoy, "6-7": presetBoyCartoon, "8-9": presetExplorerBoy, "10-12": presetPreteenBoy },
    girl: { "2-3": presetToddlerGirl, "4-5": presetPreschoolGirl, "6-7": presetGirlCartoon, "8-9": presetExplorerGirl, "10-12": presetPreteenGirl },
  };
  return map[g]?.[ageLabel] || (g === "girl" ? presetGirlCartoon : presetBoyCartoon);
};

const ageToBracketLabel = (age: string): string => {
  const n = parseInt(age) || 5;
  if (n <= 3) return "2-3";
  if (n <= 5) return "4-5";
  if (n <= 7) return "6-7";
  if (n <= 9) return "8-9";
  return "10-12";
};

/* ───────────────── constants ───────────────── */

const TOTAL_STEPS = 16;

/* New spring-based transition variants */
const stepVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 30 : -20,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -20 : 30,
    opacity: 0,
    scale: 0.98,
  }),
};

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

/* Stagger container & children */
const staggerContainer = {
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      ...springTransition,
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const staggerChild = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const ART_STYLES = [
  { key: "cartoon", labelKey: "cartoon" as const },
  { key: "3d-pixar", labelKey: "threeDPixar" as const },
  { key: "realistic", labelKey: "realistic" as const },
];
/* ── (generation phase icons are constructed inside the component) ── */

/* ───────────────── component ───────────────── */

interface Props {
  /** Optional — when omitted, the wizard renders as a full page (no close affordance). */
  open?: boolean;
  onClose?: () => void;
}

export const CreationWizard = ({ open = true, onClose }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { children: existingChildren } = useChildren();

  const GENERATION_PHASES = [
    { icon: BookOpenCheck, text: t.wizard.writingStory, duration: 3000 },
    { icon: Paintbrush, text: t.wizard.illustrating, duration: 3000 },
    { icon: Sparkles, text: t.wizard.finishing, duration: 3000 },
    { icon: CheckCircle2, text: t.wizard.almostReady, duration: 1000 },
  ];
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [bookOptions, setBookOptions] = useState<BookOptions>(DEFAULT_BOOK_OPTIONS);
  
  const [portionFilter, setPortionFilter] = useState<TorahOption["category"] | "all">("all");
  const [portionSearch, setPortionSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [portionMode, setPortionMode] = useState<"choose" | "manual" | null>(null);
  const [styleSubStep, setStyleSubStep] = useState<"art" | "format">("art");
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | "yearly" | "once">("monthly");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginFullName, setLoginFullName] = useState("");
  const [loginMode, setLoginMode] = useState<"login" | "signup">("signup");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const justSubscribedRef = useRef(false);
  
  // Generation animation state
  const [animating, setAnimating] = useState(false);
  const [animPhaseIdx, setAnimPhaseIdx] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  const pendingGenerationRef = useRef(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stacked-step scrolling — each section uses a stable DOM id
  // (e.g. "wizard-step-3") so scroll restoration can anchor to a section
  // rather than a pixel offset, surviving layout changes.
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const stepIdFor = useCallback((n: number) => `wizard-step-${n}`, []);
  const setStepRef = useCallback((n: number) => (el: HTMLDivElement | null) => {
    stepRefs.current[n] = el;
  }, []);
  const scrollToStep = useCallback((n: number, behavior: ScrollBehavior = "smooth") => {
    const el = stepRefs.current[n] || (typeof document !== "undefined" ? document.getElementById(`wizard-step-${n}`) as HTMLDivElement | null : null);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior, block: "center" });
      });
    }
  }, []);

  // Build the className for a wizard step's outer <section>.
  // Only the active step is rendered, and it occupies the full viewport
  // so the user sees the current question perfectly centered with no
  // distractions from previous/next sections.
  const sectionClass = useCallback((_n: number) => {
    return "relative scroll-mt-24 min-h-[calc(100vh-11rem)] flex items-center justify-center py-10 sm:py-14";
  }, []);

  const child = data.children[data.activeChildIdx] || data.children[0];

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateChild = useCallback((id: string, partial: Partial<ChildProfile>) => {
    setData((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
  }, []);

  const childNames = data.children.map((c) => c.name).filter(Boolean).join(" & ") || "your child";

  // Tracks whether we just restored from localStorage so the step-change
  // auto-scroll effect doesn't override the restored scroll position on mount.
  const skipNextStepScrollRef = useRef(false);
  const didRestoreRef = useRef(false);

  // Save wizard state continuously so user can resume after refresh/close/login.
  // We store the active section anchor (step number) rather than a raw scrollY
  // pixel offset, because anchors stay valid across layout changes.
  const saveWizardState = useCallback(() => {
    const serializable = {
      step,
      data: {
        ...data,
        children: data.children.map(c => ({ ...c, photo: null })), // can't serialize File
      },
      shipping,
      bookOptions,
      portionFilter,
      quantity,
      activeSectionId: `wizard-step-${step}`,
    };
    try {
      localStorage.setItem("torahtale_wizard_state", JSON.stringify(serializable));
    } catch { /* ignore quota */ }
  }, [step, data, shipping, bookOptions, portionFilter, quantity]);

  // Restore wizard state on mount (whether logged in or not)
  useEffect(() => {
    const defaultLanguage = lang === "he" ? "hebrew" : lang === "yi" ? "yiddish" : "english";
    const saved = localStorage.getItem("torahtale_wizard_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Don't restore terminal/transient steps (success or generation animation)
        const restoredStep = parsed.step && parsed.step < 16 ? parsed.step : 1;
        setStep(restoredStep);
        const restoredData = parsed.data || initialData;
        if (!restoredData.language || restoredData.language === "english") {
          restoredData.language = defaultLanguage;
        }
        setData(restoredData);
        setShipping(parsed.shipping || DEFAULT_SHIPPING);
        setBookOptions(parsed.bookOptions || DEFAULT_BOOK_OPTIONS);
        if (typeof parsed.quantity === "number" && parsed.quantity >= 1) setQuantity(parsed.quantity);
        if (parsed.portionFilter) setPortionFilter(parsed.portionFilter);

        // Restore to the active section anchor. Stagger the attempts to win
        // against late layout (images, fonts, motion).
        if (restoredStep <= 8) {
          skipNextStepScrollRef.current = true;
          const attempts = [80, 220, 500, 900];
          attempts.forEach((delay) => {
            setTimeout(() => scrollToStep(restoredStep, "auto"), delay);
          });
        }
      } catch { /* ignore */ }
    } else {
      setData((prev) => ({ ...prev, language: defaultLanguage }));
    }
    didRestoreRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every meaningful change
  useEffect(() => {
    if (step > 1 || data.children.some(c => c.name || c.age || c.gender)) {
      saveWizardState();
    }
  }, [saveWizardState, step, data]);

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Auto-scroll to the active step section whenever it changes
  useEffect(() => {
    if (skipNextStepScrollRef.current) {
      skipNextStepScrollRef.current = false;
      return;
    }
    scrollToStep(step);
  }, [step, scrollToStep]);

  const autoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      setDir(1);
      setStep((s) => {
        let nextStep = s + 1;
        return Math.min(nextStep, TOTAL_STEPS);
      });
    }, 350);
  }, []);

  /* ───── login prompt during step 8 auth gate ───── */

  useEffect(() => {
    if (user && showLoginPrompt) {
      setShowLoginPrompt(false);
      if (step === 8 && pendingGenerationRef.current) {
        pendingGenerationRef.current = false;
        toast.success("Signed in! Starting your sefer...");
        startGeneration();
      } else {
        toast.success("Signed in!");
      }
    }
  }, [user, showLoginPrompt]);

  const handleWizardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Welcome back!"); }
  };

  const handleWizardSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
      options: { data: { full_name: loginFullName }, emailRedirectTo: window.location.origin },
    });
    setLoginLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Account created!"); }
  };

  const handleWizardGoogleLogin = async () => {
    setLoginLoading(true);
    saveWizardState();
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/?start=1`,
    });
    setLoginLoading(false);
    if (error) toast.error(error.message);
  };

  const handlePhoto = (childId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateChild(childId, { photo: file, photoPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  /* ───── book generation (fire-and-forget → 10s animation) ───── */

  const startGeneration = async () => {
    setDir(1);
    setStep(9);
    setAnimating(true);
    setAnimPhaseIdx(0);
    setAnimDone(false);

    if (user) {
      try {
        const portionLabel = getPortionLabel(data.torahPortion);
        const childrenInfo = data.children.map((c) => `${c.name} (${c.age} years old, ${c.gender})`).join(", ");

        // Upload child photos to storage and collect URLs
        const childDescriptions = await Promise.all(
          data.children.map(async (c) => {
            let photoUrl: string | null = null;
            if (c.photo) {
              const filePath = `${user.id}/${c.id}-${Date.now()}.jpg`;
              const { error: uploadErr } = await supabase.storage
                .from("child-photos")
                .upload(filePath, c.photo, { upsert: true });
              if (!uploadErr) {
                const { data: urlData } = supabase.storage
                  .from("child-photos")
                  .getPublicUrl(filePath);
                photoUrl = urlData?.publicUrl || null;
              }
            }
            return {
              name: c.name,
              age: c.age,
              gender: c.gender,
              description: c.description,
              hasPhoto: !!c.photoPreview,
              photoUrl,
            };
          })
        );

        const { data: bookData, error: saveError } = await supabase
          .from("books")
          .insert({
            user_id: user.id,
            child_name: childNames,
            torah_portion: data.torahPortion,
            art_style: data.artStyle,
            language: data.language,
            status: "generating",
            story_data: {
              childrenInfo,
              portionLabel,
              pageCount: data.pageCount,
              bookOptions: bookOptions,
              narrativeStyle: data.narrativeStyle,
              childDescriptions,
            },
          } as any)
          .select()
          .single();
        if (!saveError && bookData) {
          setSavedBookId(bookData.id);
        }
      } catch (err) {
        console.error("Failed to save book:", err);
      }
    }

    for (let i = 0; i < GENERATION_PHASES.length; i++) {
      setAnimPhaseIdx(i);
      await new Promise((r) => setTimeout(r, GENERATION_PHASES[i].duration));
    }

    setAnimating(false);
    setAnimDone(true);
  };

  /* ───── step skipping helpers ───── */

  const allChildrenHaveGenderAge = useCallback(() =>
    data.children.every((c) => !!c.gender && !!c.age), [data.children]);

  const allChildrenHavePhotoOrDesc = useCallback(() =>
    data.children.every((c) => !!c.photoPreview || !!c.description), [data.children]);

  /* ───── navigation ───── */

  const next = async () => {
    if (step === 8) {
      if (!user) {
        pendingGenerationRef.current = true;
        saveWizardState();
        setShowLoginPrompt(true);
        toast.info("Please sign in to generate your sefer.");
        return;
      }
      // Free-preview limit is now checked AFTER book-type selection (step 10),
      // so the upsell pricing can reflect the chosen book.
      await startGeneration();
      return;
    }

    setDir(1);
    let nextStep = step + 1;
    if (step === 1 && allChildrenHaveGenderAge()) {
      nextStep = 4;
    }
    if (step === 4) {
      // sub-step: art -> format -> next
      if (styleSubStep === "art") {
        setStyleSubStep("format");
        return;
      }
    }
    if (step === 4 && allChildrenHaveGenderAge() && allChildrenHavePhotoOrDesc()) {
      nextStep = 6;
    }
    setStep(Math.min(nextStep, TOTAL_STEPS));
  };

  const back = () => {
    if (step === 6 && portionMode === "manual") {
      setPortionMode(null);
      return;
    }
    if (step === 4 && styleSubStep === "format") {
      setStyleSubStep("art");
      return;
    }
    setDir(-1);
    setPortionMode(null);
    let prevStep = step - 1;
    if (allChildrenHaveGenderAge()) {
      if (step === 6 && allChildrenHavePhotoOrDesc()) prevStep = 4;
    }
    setStep(Math.max(prevStep, 1));
  };

  const resetWizard = useCallback(() => {
    try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
    const defaultLanguage = lang === "he" ? "hebrew" : lang === "yi" ? "yiddish" : "english";
    setData({ ...initialData, children: [createChild()], language: defaultLanguage });
    setShipping(DEFAULT_SHIPPING);
    setBookOptions(DEFAULT_BOOK_OPTIONS);
    setPortionFilter("all");
    setPortionSearch("");
    setPortionMode(null);
    setStyleSubStep("art");
    setSavedBookId(null);
    setDir(-1);
    setStep(1);
    toast.success(t.wizard.createYourBook ? `${t.wizard.createYourBook} · ${"1/8"}` : "Wizard reset");
  }, [lang, t]);

  const handlePlaceOrder = async (planType: string = "once") => {
    const isSubscription = planType !== "once";
    const orderNumber = `TT-${Date.now().toString().slice(-6)}`;
    const { createShopifyCart, SHOPIFY_VARIANT_IDS } = await import("@/lib/shopify");

    // CRITICAL: open the popup synchronously while we still have the user-gesture
    // context. We point it at about:blank now and redirect it once we have the
    // real checkout URL. Without this, Safari/iOS and most popup blockers will
    // silently swallow the window and the button looks "broken".
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");

    const sendToCheckout = (url: string) => {
      try {
        if (popup && !popup.closed) {
          popup.location.href = url;
          return true;
        }
      } catch { /* cross-origin write fails are caught below */ }
      // No popup or write blocked — navigate the current tab instead.
      window.location.assign(url);
      return false;
    };

    // Advance to the success screen so the user sees confirmation immediately.
    const goToSuccess = () => {
      setDir(1);
      setStep(14);
      try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
    };

    let variantId: string;
    if (isSubscription) {
      const subMap: Record<string, string> = {
        weekly: SHOPIFY_VARIANT_IDS.weeklySubscription,
        monthly: SHOPIFY_VARIANT_IDS.monthlySubscription,
        yearly: SHOPIFY_VARIANT_IDS.yearlySubscription,
      };
      variantId = subMap[planType] || SHOPIFY_VARIANT_IDS.monthlySubscription;
    } else {
      const bookVariantMap: Record<string, string> = {
        "softcover-8x8": SHOPIFY_VARIANT_IDS.bookSoftcover8x8,
        "hardcover-8x8": SHOPIFY_VARIANT_IDS.bookHardcover8x8,
        "hardcover-11x8.5": SHOPIFY_VARIANT_IDS.bookHardcover11x85,
        "board-6x6": SHOPIFY_VARIANT_IDS.bookBoardBook6x6,
      };
      const optKey = bookOptions.productType === "board"
        ? "board-6x6"
        : bookOptions.productType === "softcover"
          ? "softcover-8x8"
          : `hardcover-${bookOptions.hardcoverSize || "8x8"}`;
      variantId = bookVariantMap[optKey] || SHOPIFY_VARIANT_IDS.bookSoftcover8x8;
    }

    const variantNumericId = variantId.split("/").pop();
    const fallbackCheckoutUrl = `https://fek120-t9.myshopify.com/cart/${variantNumericId}:1?channel=online_store`;

    try {
      if (user && savedBookId) {
        // Best-effort metadata writes — don't block checkout on these.
        supabase.from("books").update({
          status: "ordered",
          shipping_data: shipping,
          order_number: orderNumber,
          updated_at: new Date().toISOString(),
        } as any).eq("id", savedBookId).then(({ error }) => {
          if (error) console.error("Failed updating book before checkout:", error);
        });

        if (isSubscription) {
          const freqMap: Record<string, { frequency: string; price: number }> = {
            weekly: { frequency: "weekly", price: 23.99 },
            monthly: { frequency: "monthly", price: 19.99 },
            yearly: { frequency: "yearly", price: 15.38 },
          };
          const plan = freqMap[planType] || freqMap.weekly;
          supabase.from("subscriptions").insert({
            user_id: user.id,
            child_name: childNames,
            child_id: data.children[0]?.id || null,
            art_style: data.artStyle,
            language: data.language,
            shipping_data: shipping as any,
            status: "active",
            frequency: plan.frequency,
            price_per_week: plan.price,
          }).then(({ error }) => {
            if (error) console.error("Failed saving subscription before checkout:", error);
          });
        }
      }

      try {
        localStorage.setItem("torahtale_pending_order", JSON.stringify({
          bookId: savedBookId,
          orderNumber,
          planType,
          checkoutUrl: fallbackCheckoutUrl,
          createdAt: Date.now(),
        }));
      } catch { /* ignore quota */ }

      // Try to create a proper Shopify cart; fall through to the direct
      // /cart/{variant}:1 URL on any failure so the user always lands on Shopify.
      let finalUrl = fallbackCheckoutUrl;
      try {
        const cart = await createShopifyCart({
          lineId: null,
          product: {} as any,
          variantId,
          variantTitle: isSubscription ? `${planType} subscription` : "Book",
          price: { amount: "0", currencyCode: "USD" },
          quantity: 1,
          selectedOptions: [],
        });
        if (cart?.checkoutUrl) finalUrl = cart.checkoutUrl;
      } catch (cartErr) {
        console.error("createShopifyCart threw, using fallback URL:", cartErr);
      }

      // Update the stored URL with whichever is final.
      try {
        const stored = JSON.parse(localStorage.getItem("torahtale_pending_order") || "{}");
        localStorage.setItem("torahtale_pending_order", JSON.stringify({ ...stored, checkoutUrl: finalUrl }));
      } catch { /* ignore */ }

      const opened = sendToCheckout(finalUrl);

      toast.success(t.checkout.redirectingToShopify || "Redirecting to Shopify checkout…", {
        description: finalUrl,
        duration: 10000,
        action: {
          label: t.checkout.openCheckout || "Open checkout",
          onClick: () => window.open(finalUrl, "_blank", "noopener,noreferrer"),
        },
      });

      // Show success page right away. If the popup was blocked we already
      // navigated the current tab via sendToCheckout, so this only runs in
      // the popup case.
      if (opened) goToSuccess();
    } catch (err) {
      console.error("Failed to place order:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Checkout error", {
        description: fallbackCheckoutUrl,
        duration: 14000,
        action: {
          label: t.checkout.openCheckout || "Open checkout",
          onClick: () => window.open(fallbackCheckoutUrl, "_blank", "noopener,noreferrer"),
        },
      });
      const opened = sendToCheckout(fallbackCheckoutUrl);
      if (opened) goToSuccess();
    }
  };

  /* ───── can proceed checks ───── */

  const canNext = (() => {
    switch (step) {
      case 1: return data.children.some((c) => !!c.name.trim());
      case 2: return !!child.gender;
      case 3: return !!child.age && parseInt(child.age) >= 1 && parseInt(child.age) <= 15;
      case 4: return !!data.artStyle;
      case 5: return true;
      case 6: return !!data.torahPortion;
      case 7: return true;
      case 8: return true;
      case 10: return true;
      case 11: return !!(shipping.fullName && shipping.street && shipping.city && shipping.state && shipping.zip);
      case 12: return true;
      default: return false;
    }
  })();

  const filteredPortions = (() => {
    let list = portionFilter === "all" ? TORAH_PORTIONS : TORAH_PORTIONS.filter((p) => p.category === portionFilter);
    if (portionSearch.trim()) {
      const q = portionSearch.toLowerCase();
      list = list.filter((p) => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));
    }
    return list;
  })();

  /* ───── progress calculation ───── */
  const progressPercent = (() => {
    const mainSteps = [1, 2, 3, 4, 5, 6, 7, 8];
    const idx = mainSteps.indexOf(step);
    if (idx >= 0) return ((idx + 1) / mainSteps.length) * 100;
    if (step === 9) return 100;
    if (step >= 10) return 100;
    return 0;
  })();

  /* ───── character preview ───── */

  const getPreviewImage = (): string | null => {
    if (child.characterPreview) return child.characterPreview;
    const gender = child.gender || "";
    const age = child.age || "";
    const style = data.artStyle || "cartoon";
    if (gender && age) return getAgePreset(gender, ageToBracketLabel(age));
    if (gender) return getStylePreset(gender, style);
    return null;
  };

  /* ───── step icon ───── */
  const getStepIcon = () => {
    switch (step) {
      case 1: return Type;
      case 2: return Heart;
      case 3: return Calendar;
      case 4: return Palette;
      case 5: return Image;
      case 6: return BookOpen;
      case 7: return Sun;
      case 8: return Sparkles;
      default: return Sparkles;
    }
  };

  const StepIcon = getStepIcon();

  /* ───── glassmorphism selection card ───── */
  const glassCard = (isSelected: boolean) =>
    `relative rounded-2xl border overflow-hidden text-center transition-all duration-300 cursor-pointer
    ${isSelected
      ? "border-accent/60 bg-accent/8 shadow-xl shadow-accent/10 scale-[1.02] ring-1 ring-accent/20"
      : "border-border/30 bg-card/40 backdrop-blur-md hover:border-accent/30 hover:shadow-lg hover:-translate-y-1"
    }`;

  return (
    <>
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* ── Sticky Apple-style top bar ── */}
      <div className="sticky top-0 z-30 bg-background/70 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              key={`hdr-${step}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springTransition, stiffness: 400 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent flex items-center justify-center ring-1 ring-accent/15 flex-shrink-0"
            >
              <StepIcon className="w-4 h-4 text-accent" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70 font-medium">
                {t.wizard.createYourBook}
              </p>
              <p className="font-display text-sm font-semibold text-foreground truncate">
                {step <= 8 ? `${t.common.continue} · ${Math.min(step, 8)}/8` : t.checkout.orderSummary}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => {
                if (step === 1 && !data.children.some(c => c.name || c.age || c.gender)) return;
                if (window.confirm(t.wizard.resetConfirm || "Reset the wizard and start over from the beginning?")) {
                  resetWizard();
                }
              }}
              aria-label={t.wizard.resetWizard || "Reset wizard"}
              title={t.wizard.resetWizard || "Reset wizard"}
              className="h-9 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.wizard.startOver || "Start over"}</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress strip */}
        {step <= 8 && (
          <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-3">
            <div className="h-[2px] bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0.6))" }}
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Main content area — Apple/Tesla generous spacing ── */}
      <div className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12 pb-[140px] sm:pb-32">
          <h1 className="sr-only">{t.wizard.createYourBook}</h1>

        <div>
          {/* Multi-child pills (steps 2-8) */}
          {step >= 2 && step <= 8 && data.children.length > 1 && (
            <motion.div variants={staggerChild} initial="enter" animate="center" className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {data.children.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => update({ activeChildIdx: idx })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 flex-shrink-0 text-xs font-medium ${
                    idx === data.activeChildIdx
                      ? "border-accent bg-accent/10 text-accent shadow-sm"
                      : "border-border/50 bg-card/60 text-muted-foreground hover:border-accent/30"
                  }`}
                >
                  {c.photoPreview ? (
                    <img src={c.photoPreview} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                      {(c.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {c.name || `Child ${idx + 1}`}
                </button>
              ))}
            </motion.div>
          )}

          <div className="space-y-0">


            {/* ── STEP 1: Name ── */}
            {step === 1 && (
              <section
                id={stepIdFor(1)}
                ref={setStepRef(1)}
                onClick={step !== 1 ? () => setStep(1) : undefined}
                className={sectionClass(1)}
              >
              {step !== 1 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s1"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-md mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Type className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.whatsHeroName}
                  </h2>
                </motion.div>

                {existingChildren.length > 0 && (
                  <motion.div variants={staggerChild} className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {existingChildren.map((ec) => {
                        const isSelected = data.children.some(
                          (c) => c.name === ec.name && c.gender === (ec.gender || "") && c.age === String(ec.age || "")
                        );
                        return (
                          <button
                            key={ec.id}
                            onClick={() => {
                              if (isSelected) {
                                const remaining = data.children.filter(
                                  (c) => !(c.name === ec.name && c.gender === (ec.gender || "") && c.age === String(ec.age || ""))
                                );
                                if (remaining.length === 0) remaining.push(createChild());
                                update({ children: remaining, activeChildIdx: 0 });
                              } else {
                                const newChild: ChildProfile = {
                                  ...createChild(),
                                  name: ec.name,
                                  gender: ec.gender || "",
                                  age: ec.age ? String(ec.age) : "",
                                  description: ec.description || "",
                                  photoPreview: ec.photo_url || null,
                                };
                                const currentFirst = data.children[0];
                                const isFirstBlank = !currentFirst.name && !currentFirst.gender && !currentFirst.age;
                                const newChildren = isFirstBlank
                                  ? [newChild, ...data.children.slice(1)]
                                  : [...data.children, newChild];
                                update({ children: newChildren, activeChildIdx: newChildren.length - 1 });
                                if (ec.art_style) update({ artStyle: ec.art_style });
                              }
                            }}
                            className={glassCard(isSelected)}
                          >
                            <div className="flex items-center gap-2 p-3">
                              {ec.photo_url ? (
                                <img src={ec.photo_url} alt={ec.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                  {ec.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 text-start">
                                <p className="font-display font-semibold text-sm text-foreground truncate">{ec.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {ec.age ? `${ec.age}${t.wizard.yearsSuffix}` : ""}{ec.gender ? ` · ${ec.gender === "boy" ? t.wizard.boy : ec.gender === "girl" ? t.wizard.girl : ec.gender}` : ""}
                                </p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                >
                                  <Check className="w-4 h-4 text-accent ms-auto flex-shrink-0" />
                                </motion.div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{t.wizard.orEnterNewName}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={staggerChild}>
                  <Input
                    placeholder={t.wizard.enterChildName}
                    value={child.name}
                    onChange={(e) => updateChild(child.id, { name: e.target.value })}
                    className="rounded-2xl h-14 text-lg text-center border-2 border-border/40 bg-card/60 backdrop-blur-sm focus:border-accent/50 focus:ring-accent/20 placeholder:text-muted-foreground/40 font-medium"
                    autoFocus
                  />
                </motion.div>

                {data.children.length > 1 && (
                  <motion.div variants={staggerChild} className="flex flex-wrap gap-2 justify-center">
                    {data.children.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => update({ activeChildIdx: idx })}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all font-medium ${
                          idx === data.activeChildIdx
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/80 border border-transparent"
                        }`}
                      >
                        {c.name || `${t.wizard.child} ${idx + 1}`}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
              </section>
            )}

            {/* ── STEP 2: Gender ── */}
            {step === 2 && (
              <section
                id={stepIdFor(2)}
                ref={setStepRef(2)}
                onClick={step !== 2 ? () => setStep(2) : undefined}
                className={sectionClass(2)}
              >
              {step !== 2 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s2"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-sm mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Heart className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.isBoyOrGirl(child.name)}
                  </h2>
                </motion.div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { key: "boy", label: t.wizard.boy, img: presetBoyCartoon },
                    { key: "girl", label: t.wizard.girl, img: presetGirlCartoon },
                  ].map((g) => (
                    <motion.button
                      key={g.key}
                      variants={staggerChild}
                      onClick={() => {
                        updateChild(child.id, { gender: g.key });
                        autoAdvance();
                      }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className={glassCard(child.gender === g.key)}
                    >
                      <div className="w-full aspect-square bg-muted/20">
                        <img src={g.img} alt={g.label} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                      </div>
                      <div className="p-3 sm:p-4">
                        <span className="text-base sm:text-lg font-semibold text-foreground block">{g.label}</span>
                      </div>
                      {child.gender === g.key && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="absolute top-2 end-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md"
                        >
                          <Check className="w-4 h-4 text-accent-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              </section>
            )}

            {/* ── STEP 3: Age ── */}
            {step === 3 && (
              <section
                id={stepIdFor(3)}
                ref={setStepRef(3)}
                onClick={step !== 3 ? () => setStep(3) : undefined}
                className={sectionClass(3)}
              >
              {step !== 3 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s3"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-xs mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Calendar className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.howOld(child.name, child.gender)}
                  </h2>
                </motion.div>

                <motion.div variants={staggerChild}>
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    placeholder={t.wizard.agePlaceholder}
                    value={child.age}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 15)) {
                        updateChild(child.id, { age: val });
                      }
                    }}
                    className="rounded-2xl h-20 text-4xl text-center font-bold border-2 border-border/40 bg-card/60 backdrop-blur-sm focus:border-accent/50 focus:ring-accent/20 placeholder:text-muted-foreground/30"
                    autoFocus
                  />
                </motion.div>

                {child.age && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm font-semibold text-accent"
                  >
                    {t.wizard.yearsOld(child.age, child.gender)}
                  </motion.p>
                )}
              </motion.div>
              </section>
            )}

            {/* ── STEP 4: Art Style ── */}
            {step === 4 && (
              <section
                id={stepIdFor(4)}
                ref={setStepRef(4)}
                onClick={step !== 4 ? () => setStep(4) : undefined}
                className={sectionClass(4)}
              >
              {step !== 4 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s4"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Palette className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {styleSubStep === "art" ? t.wizard.chooseStyle : t.wizard.chooseFormat}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <span className={`h-1.5 w-6 rounded-full transition-all ${styleSubStep === "art" ? "bg-accent" : "bg-accent/40"}`} />
                    <span className={`h-1.5 w-6 rounded-full transition-all ${styleSubStep === "format" ? "bg-accent" : "bg-border/40"}`} />
                  </div>
                </motion.div>

                {styleSubStep === "art" && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {ART_STYLES.map((s) => {
                      const previewGender = data.children.length >= 2 ? "duo" : (child.gender || "boy");
                      const stylePreview = getStylePreset(previewGender, s.key);
                      return (
                        <motion.button
                          key={s.key}
                          variants={staggerChild}
                          onClick={() => {
                            update({ artStyle: s.key });
                            setStyleSubStep("format");
                          }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          className={glassCard(data.artStyle === s.key)}
                        >
                          <div className="aspect-square bg-muted/20 relative">
                            <img src={stylePreview} alt={t.wizard[s.labelKey]} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                          </div>
                          <div className="p-2 sm:p-3">
                            <span className="text-xs sm:text-sm font-semibold text-foreground block">{t.wizard[s.labelKey]}</span>
                          </div>
                          {data.artStyle === s.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className="absolute top-2 end-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
                            >
                              <Check className="w-3.5 h-3.5 text-accent-foreground" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {styleSubStep === "format" && (() => {
                  const childAge = parseInt(child.age) || 0;
                  const recommendComic = childAge >= 7;
                  const formats = [
                    { key: "story" as const, label: t.wizard.formatStory, desc: t.wizard.formatStoryDesc, age: "2–8", img: storybookPreview, recommended: !recommendComic },
                    { key: "comic" as const, label: t.wizard.formatComic, desc: t.wizard.formatComicDesc, age: "7–12", img: comicbookPreview, recommended: recommendComic },
                  ];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formats.map((f) => (
                        <motion.button
                          key={f.key}
                          variants={staggerChild}
                          onClick={() => {
                            update({ narrativeStyle: f.key });
                            autoAdvance();
                          }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          className={glassCard(data.narrativeStyle === f.key)}
                        >
                          {f.recommended && childAge > 0 && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                              ★ {t.wizard.bestForYou}
                            </div>
                          )}
                          <div className="aspect-[4/3] bg-muted/20 relative overflow-hidden">
                            <img src={f.img} alt={f.label} className="w-full h-full object-cover" loading="lazy" width={512} height={384} />
                          </div>
                          <div className="p-3 sm:p-4 text-start">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm sm:text-base font-display font-bold text-foreground">{f.label}</span>
                              <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full whitespace-nowrap">{t.wizard.recommendedForAge(f.age)}</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{f.desc}</p>
                          </div>
                          {data.narrativeStyle === f.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className="absolute top-2 end-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
                            >
                              <Check className="w-3.5 h-3.5 text-accent-foreground" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
              </section>
            )}

            {/* ── STEP 5: Photo / Description ── */}
            {step === 5 && (
              <section
                id={stepIdFor(5)}
                ref={setStepRef(5)}
                onClick={step !== 5 ? () => setStep(5) : undefined}
                className={sectionClass(5)}
              >
              {step !== 5 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s5"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Image className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.helpDraw(child.name)}
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <motion.div
                    variants={staggerChild}
                    className="rounded-2xl border-2 border-dashed border-border/50 p-5 sm:p-6 text-center hover:border-accent/40 hover:bg-accent/3 transition-all duration-300 relative bg-card/40 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-accent" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t.wizard.uploadPhoto}</p>
                      {child.photoPreview ? (
                        <div className="flex items-center gap-3 w-full justify-center">
                          <img src={child.photoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                          <button
                            onClick={() => updateChild(child.id, { photo: null, photoPreview: null })}
                            className="text-xs text-destructive hover:underline font-medium"
                          >
                            {t.wizard.remove}
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhoto(child.id, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={staggerChild}
                    className="rounded-2xl border-2 border-border/50 p-5 sm:p-6 bg-card/40 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        <PenLine className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t.wizard.describeInstead}</p>
                    </div>
                    <Textarea
                      placeholder={t.wizard.descPlaceholder}
                      value={child.description}
                      onChange={(e) => updateChild(child.id, { description: e.target.value })}
                      className="rounded-xl min-h-[100px] text-sm border-border/40 bg-background/50"
                    />
                  </motion.div>
                </div>

                {data.children.length < 4 && (
                  <motion.div variants={staggerChild}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newChild = createChild();
                        setData((prev) => ({
                          ...prev,
                          children: [...prev.children, newChild],
                          activeChildIdx: prev.children.length,
                        }));
                        setStep(1);
                      }}
                      className="w-full border-dashed border-2 border-border/50 rounded-2xl h-11 text-muted-foreground hover:text-foreground hover:border-accent/30"
                    >
                      <Plus className="w-4 h-4" /> {t.wizard.addAnotherChild}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
              </section>
            )}

            {/* ── STEP 6: Torah Portion ── */}
            {step === 6 && (
              <section
                id={stepIdFor(6)}
                ref={setStepRef(6)}
                onClick={step !== 6 ? () => setStep(6) : undefined}
                className={sectionClass(6)}
              >
              {step !== 6 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key={`s6-${portionMode}`}
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-5"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <BookOpen className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {portionMode === "manual" ? t.wizard.chooseParsha : t.wizard.chooseStorySource}
                  </h2>
                </motion.div>

                {/* ── Mode selection cards ── */}
                {portionMode !== "manual" && (
                  <motion.div variants={staggerChild} className="space-y-3 max-w-md mx-auto">
                    {/* Weekly Parashah */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const upcomingValue = getUpcomingParsha();
                        update({ torahPortion: upcomingValue });
                        setPortionMode("choose");
                        autoAdvance();
                      }}
                      className="w-full relative p-5 rounded-2xl border-2 text-start transition-all duration-300 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent hover:border-accent/50 hover:shadow-md backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📜</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">{t.wizard.weeklyParashah}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.wizard.weeklyParashahDesc}</p>
                          {(() => {
                            const upcomingValue = getUpcomingParsha();
                            const upcomingPortion = TORAH_PORTIONS.find(p => p.value === upcomingValue);
                            return upcomingPortion ? (
                              <p className="text-[10px] text-accent font-semibold mt-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {t.wizard.thisWeeksParsha}: {upcomingPortion.label}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </motion.button>

                    {/* Parashah + Holidays */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const upcomingValue = getUpcomingParsha();
                        update({ torahPortion: upcomingValue });
                        setPortionMode("choose");
                        autoAdvance();
                      }}
                      className="w-full relative p-5 rounded-2xl border-2 text-start transition-all duration-300 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent hover:border-primary/50 hover:shadow-md backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🕯️</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">{t.wizard.parashahAndHolidays}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.wizard.parashahAndHolidaysDesc}</p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Choose Manually */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPortionMode("manual")}
                      className="w-full relative p-5 rounded-2xl border-2 text-start transition-all duration-300 border-border/40 bg-card/60 hover:border-accent/40 hover:shadow-md backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📚</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">{t.wizard.chooseManually}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.wizard.chooseManuallyDesc}</p>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Manual selection browser ── */}
                {portionMode === "manual" && (
                  <>
                    <motion.div variants={staggerChild}>
                      <button
                        onClick={() => setPortionMode(null)}
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        {t.wizard.backToOptions}
                      </button>
                    </motion.div>

                    {/* Category pills */}
                    <motion.div variants={staggerChild} className="flex justify-center flex-wrap gap-2">
                      {(["all", "torah", "neviim", "ketuvim", "megillot", "holiday"] as const).map((cat) => {
                        const meta = cat === "all" ? { label: t.wizard.all, emoji: "📚" } : CATEGORY_META[cat];
                        const isActive = portionFilter === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => { setPortionFilter(cat); setExpandedBook(null); }}
                            className={`text-xs font-medium px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                              isActive
                                ? "bg-accent text-accent-foreground shadow-md shadow-accent/15"
                                : "bg-card/60 border border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/40 backdrop-blur-sm"
                            }`}
                          >
                            <span className="text-sm">{meta.emoji}</span> {meta.label}
                          </button>
                        );
                      })}
                    </motion.div>

                    {/* Search */}
                    <motion.div variants={staggerChild} className="relative">
                      <Input
                        placeholder={t.wizard.searchParsha}
                        value={portionSearch}
                        onChange={(e) => setPortionSearch(e.target.value)}
                        className="rounded-2xl h-11 text-sm ps-10 bg-card/60 border-border/40 focus:border-accent/50 shadow-sm backdrop-blur-sm"
                      />
                      <BookOpen className="w-4 h-4 text-muted-foreground/50 absolute start-3.5 top-1/2 -translate-y-1/2" />
                    </motion.div>

                    {/* Story cards */}
                    <motion.div variants={staggerChild} className="max-h-[30vh] sm:max-h-[34vh] overflow-y-auto pe-1 scrollbar-thin space-y-3">
                      {(portionFilter === "torah" || portionFilter === "all") && !portionSearch.trim() && (
                        <>
                          {TORAH_BOOKS.map((book) => {
                            const bookPortions = filteredPortions.filter((p) => p.category === "torah" && p.book === book);
                            if (bookPortions.length === 0) return null;
                            const isExpanded = expandedBook === book;
                            return (
                              <div key={book} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <button
                                  onClick={() => setExpandedBook(isExpanded ? null : book)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                                >
                                  <span className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                                    <span className="text-base">📖</span> {t.wizard.sefer} {book}
                                  </span>
                                  <motion.span
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-xs text-muted-foreground"
                                  >▼</motion.span>
                                </button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 pt-0">
                                        {bookPortions.map((p) => (
                                          <motion.button
                                            key={p.value}
                                            whileHover={{ y: -2, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                              update({ torahPortion: p.value });
                                              autoAdvance();
                                            }}
                                            className={`relative p-3 rounded-xl border-2 text-start transition-all duration-200 ${
                                              data.torahPortion === p.value
                                                ? "border-accent bg-accent/8 shadow-md shadow-accent/10"
                                                : "border-transparent bg-muted/30 hover:border-accent/30 hover:bg-muted/50 backdrop-blur-sm"
                                            }`}
                                          >
                                            <span className="text-lg block mb-1.5">{p.emoji || "📜"}</span>
                                            <span className="font-display text-xs sm:text-sm font-semibold text-foreground block leading-tight">{p.label}</span>
                                            <span className="text-[10px] text-muted-foreground mt-1 block font-medium">{p.sub}</span>
                                            {data.torahPortion === p.value && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                                className="absolute top-2 end-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                                              >
                                                <Check className="w-3 h-3 text-accent-foreground" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                          {portionFilter === "all" && (
                            <>
                              {(["neviim", "ketuvim", "megillot", "holiday"] as const).map((cat) => {
                                const catPortions = filteredPortions.filter((p) => p.category === cat);
                                if (catPortions.length === 0) return null;
                                const meta = CATEGORY_META[cat];
                                return (
                                  <div key={cat} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
                                    <div className="px-4 py-3">
                                      <span className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                                        <span className="text-base">{meta.emoji}</span> {meta.label}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 pt-0">
                                      {catPortions.map((p) => (
                                        <motion.button
                                          key={p.value}
                                          whileHover={{ y: -2, scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => {
                                            update({ torahPortion: p.value });
                                            autoAdvance();
                                          }}
                                          className={`relative p-3 rounded-xl border-2 text-start transition-all duration-200 ${
                                            data.torahPortion === p.value
                                              ? "border-accent bg-accent/8 shadow-md shadow-accent/10"
                                              : "border-transparent bg-muted/30 hover:border-accent/30 hover:bg-muted/50 backdrop-blur-sm"
                                          }`}
                                        >
                                          <span className="text-lg block mb-1.5">{p.emoji || "📖"}</span>
                                          <span className="font-display text-xs sm:text-sm font-semibold text-foreground block leading-tight">{p.label}</span>
                                          <span className="text-[10px] text-muted-foreground mt-1 block font-medium">{p.sub}</span>
                                          {data.torahPortion === p.value && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                              className="absolute top-2 end-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                                            >
                                              <Check className="w-3 h-3 text-accent-foreground" />
                                            </motion.div>
                                          )}
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}

                      {((portionFilter !== "torah" && portionFilter !== "all") || portionSearch.trim()) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {filteredPortions.map((p) => (
                            <motion.button
                              key={p.value}
                              whileHover={{ y: -2, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                update({ torahPortion: p.value });
                                autoAdvance();
                              }}
                              className={`relative p-3 rounded-xl border-2 text-start transition-all duration-200 ${
                                data.torahPortion === p.value
                                  ? "border-accent bg-accent/8 shadow-md shadow-accent/10"
                                  : "border-transparent bg-muted/30 hover:border-accent/30 hover:bg-muted/50 backdrop-blur-sm"
                              }`}
                            >
                              <span className="text-lg block mb-1.5">{p.emoji || "📜"}</span>
                              <span className="font-display text-xs sm:text-sm font-semibold text-foreground block leading-tight">{p.label}</span>
                              <span className="text-[10px] text-muted-foreground mt-1 block font-medium">{p.sub}</span>
                              {data.torahPortion === p.value && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                  className="absolute top-2 end-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                                >
                                  <Check className="w-3 h-3 text-accent-foreground" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                          {filteredPortions.length === 0 && (
                            <p className="col-span-full text-center text-sm text-muted-foreground py-8">{t.wizard.noStories}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </motion.div>
              </section>
            )}

            {/* ── STEP 7: Language ── */}
            {step === 7 && (
              <section
                id={stepIdFor(7)}
                ref={setStepRef(7)}
                onClick={step !== 7 ? () => setStep(7) : undefined}
                className={sectionClass(7)}
              >
              {step !== 7 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s7"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-sm mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Sun className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.chooseLanguage}</h2>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { key: "english", label: t.wizard.english, emoji: "🇺🇸" },
                    { key: "hebrew", label: t.wizard.hebrew, emoji: "🇮🇱" },
                    { key: "yiddish", label: t.wizard.yiddish, emoji: "✡️" },
                    { key: "bilingual", label: t.wizard.both, emoji: "🌍" },
                  ].map((l) => (
                    <motion.button
                      key={l.key}
                      variants={staggerChild}
                      onClick={() => {
                        update({ language: l.key });
                        autoAdvance();
                      }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className={glassCard(data.language === l.key)}
                    >
                      <div className="p-4 sm:p-5">
                        <span className="text-3xl sm:text-4xl block mb-2">{l.emoji}</span>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{l.label}</span>
                      </div>
                      {data.language === l.key && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="absolute top-2 end-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3.5 h-3.5 text-accent-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              </section>
            )}

            {/* ── STEP 8: Review & Generate ── */}
            {step === 8 && (
              <section
                id={stepIdFor(8)}
                ref={setStepRef(8)}
                onClick={step !== 8 ? () => setStep(8) : undefined}
                className={sectionClass(8)}
              >
              {step !== 8 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s8"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-md mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <Sparkles className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.readyToCreate}</h2>
                </motion.div>

                {/* Summary cards */}
                <motion.div variants={staggerChild} className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.wizard.character}</p>
                    <p className="text-sm font-semibold text-foreground">{childNames}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.wizard.story}</p>
                    <p className="text-sm font-semibold text-foreground">{getPortionLabel(data.torahPortion) || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.wizard.artStyle}</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{data.artStyle}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.wizard.pages}</p>
                    <p className="text-sm font-semibold text-foreground">{t.wizard.pagesCount}</p>
                  </div>
                </motion.div>

                {/* Inline auth gate */}
                {showLoginPrompt && !user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springTransition}
                    className="rounded-2xl border-2 border-accent/20 bg-accent/5 backdrop-blur-sm p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                        <LogIn className="w-5 h-5 text-accent" />
                      </div>
                      <p className="font-display font-semibold text-sm text-foreground">{t.wizard.signInToGenerate}</p>
                    </div>

                    <form onSubmit={loginMode === "login" ? handleWizardLogin : handleWizardSignup} className="space-y-3">
                      {loginMode === "signup" && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{t.wizard.fullName}</Label>
                          <Input value={loginFullName} onChange={(e) => setLoginFullName(e.target.value)} placeholder="Rachel Goldberg" className="rounded-xl h-10 mt-1 border-border/40 bg-card/60" />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">{t.wizard.email}</Label>
                        <div className="relative mt-1">
                          <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@email.com" className="rounded-xl h-10 pl-9 border-border/40 bg-card/60" required />
                          <Mail className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t.wizard.password}</Label>
                        <div className="relative mt-1">
                          <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="rounded-xl h-10 pl-9 border-border/40 bg-card/60" required minLength={6} />
                          <Lock className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <Button type="submit" variant="gold" className="w-full rounded-xl h-10" disabled={loginLoading}>
                        {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : loginMode === "login" ? t.wizard.signIn : t.wizard.createAccount}
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        {loginMode === "login" ? (
                          <>{t.wizard.noAccount}{" "}<button type="button" onClick={() => setLoginMode("signup")} className="text-accent font-medium hover:underline">{t.wizard.signUp}</button></>
                        ) : (
                          <>{t.wizard.haveAccount}{" "}<button type="button" onClick={() => setLoginMode("login")} className="text-accent font-medium hover:underline">{t.wizard.signInLink}</button></>
                        )}
                      </p>
                    </form>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground/60">{t.wizard.or}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <Button type="button" variant="outline" className="w-full rounded-xl h-10 gap-2 border-border/40" onClick={handleWizardGoogleLogin} disabled={loginLoading}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      {t.wizard.continueWithGoogle}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
              </section>
            )}

            <AnimatePresence mode="wait" custom={dir}>
            {/* ── STEP 9: Generation Animation + Confirmation ── */}
            {step === 9 && (
              <motion.div
                key="s9"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="py-8 sm:py-12 space-y-6"
              >
                {animating && !animDone && (
                  <>
                    <SparkleEffect count={15} />
                    <div className="text-center space-y-6">
                      {/* Pulsing concentric rings */}
                      <div className="relative w-24 h-24 mx-auto">
                        <motion.div
                          className="absolute inset-0 rounded-3xl bg-accent/10"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-2xl bg-accent/15"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        />
                        <motion.div
                          key={animPhaseIdx}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center"
                        >
                          {(() => {
                            const PhaseIcon = GENERATION_PHASES[animPhaseIdx]?.icon || Sparkles;
                            return <PhaseIcon className="w-10 h-10 text-accent" />;
                          })()}
                        </motion.div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`phase-text-${animPhaseIdx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="font-display text-xl sm:text-2xl text-foreground font-semibold"
                        >
                          {GENERATION_PHASES[animPhaseIdx]?.text}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                          className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
                          animate={{
                            width: `${((animPhaseIdx + 1) / GENERATION_PHASES.length) * 100}%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {animDone && (
                  <AutoAdvanceStep onAdvance={() => { setDir(1); setStep(10); }} delayMs={1500}>
                    {(progress) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-center space-y-5"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 15 }}
                          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center mx-auto"
                        >
                          <CheckCircle2 className="w-10 h-10 text-accent" />
                        </motion.div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.seferBeingCreated}</h2>
                        <div className="max-w-xs mx-auto h-1 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
                        </div>
                      </motion.div>
                    )}
                  </AutoAdvanceStep>
                )}
              </motion.div>
            )}

            {/* ── STEP 10: Book Options ── */}
            {step === 10 && (
              <motion.div key="s10" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <BookOptionsStep options={bookOptions} onChange={setBookOptions} childAge={parseInt(child?.age || "0") || 0} />
              </motion.div>
            )}

            {/* ── STEP 11: Shipping ── */}
            {step === 11 && (
              <motion.div key="s11" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <ShippingForm data={shipping} onChange={setShipping} />
              </motion.div>
            )}

            {/* ── STEP 12: Choose Plan ── */}
            {step === 12 && (
              <motion.div key="s12" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <CheckoutStep
                  mode="plan"
                  childName={childNames}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  shipping={shipping}
                  bookOptions={bookOptions}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}

            {/* ── STEP 13: Order Summary ── */}
            {step === 13 && (
              <motion.div key="s13" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <CheckoutStep
                  mode="summary"
                  childName={childNames}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  shipping={shipping}
                  bookOptions={bookOptions}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}

            {/* ── STEP 14: Success ── */}
            {step === 14 && (
              <motion.div key="s14" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <SuccessStep childName={childNames} onGoToDashboard={() => { localStorage.removeItem("torahtale_wizard_state"); onClose?.(); navigate("/dashboard"); }} />
              </motion.div>
            )}

          </AnimatePresence>
          </div>

        </div>

        </div>
      </div>

      {/* ── Sticky bottom action bar (Apple/Tesla style) ── */}
      {step !== 9 && step !== 13 && step !== 14 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springTransition }}
          className="fixed bottom-0 inset-x-0 z-30 border-t border-border/30 bg-background/85 backdrop-blur-2xl"
        >
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center gap-4">
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0" /> {t.common.back}
              </button>
            ) : <div />}

            {step <= 7 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2 px-7 sm:px-8 h-11 rounded-full font-semibold text-sm shadow-lg shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))" }}
              >
                {t.common.continue} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </motion.button>
            )}
            {step === 8 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={next}
                className="flex items-center gap-2 px-7 sm:px-8 h-11 rounded-full font-semibold text-sm shadow-lg shadow-accent/15 transition-all text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))" }}
              >
                <Sparkles className="w-4 h-4" /> {t.wizard.generateBook}
              </motion.button>
            )}
            {(step === 10 || step === 11 || step === 12) && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2 px-7 sm:px-8 h-11 rounded-full font-semibold text-sm shadow-lg shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))" }}
              >
                {t.common.continue}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </div>

    <SubscriptionUpsellDialog
      open={showUpsellDialog}
      onClose={() => setShowUpsellDialog(false)}
      onSubscribed={() => {
        justSubscribedRef.current = true;
        setShowUpsellDialog(false);
        // Subscribed — continue past the book-options step into shipping/checkout.
        setDir(1);
        setStep(11);
      }}
      context="limit-reached"
      bookPriceUsd={(() => {
        const pt = bookOptions.productType;
        const isIls = t.currency.code === "ILS";
        if (pt === "softcover") return isIls ? 25 : 9;
        if (pt === "hardcover") return isIls ? 50 : 17;
        if (pt === "board") return isIls ? 70 : 24;
        return undefined;
      })()}
      bookLabel={
        bookOptions.productType === "softcover" ? t.bookOptions.softcover :
        bookOptions.productType === "hardcover" ? t.bookOptions.hardcover :
        bookOptions.productType === "board" ? t.bookOptions.boardBook : undefined
      }
    />
    </>
  );
};
