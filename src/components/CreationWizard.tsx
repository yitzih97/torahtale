import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Plus,
  Users, BookOpen, Palette, Package, Check,
  Camera, Sun, User, Type, Calendar, Heart, Image, PenLine,
  Lock, Mail, LogIn, BookOpenCheck, Paintbrush, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SparkleEffect } from "./SparkleEffect";
import { ShippingForm, DEFAULT_SHIPPING, type ShippingData } from "./wizard/ShippingForm";
import { CheckoutStep } from "./wizard/CheckoutStep";
import { SubscriptionUpsellDialog } from "./wizard/SubscriptionUpsellDialog";
import { SuccessStep } from "./wizard/SuccessStep";
import { BookOptionsStep, DEFAULT_BOOK_OPTIONS, type BookOptions } from "./wizard/BookOptionsStep";
import { TORAH_PORTIONS, TORAH_BOOKS, CATEGORY_META, getPortionLabel, type TorahOption } from "./wizard/TorahPortions";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
  language: string;
  pageCount: number;
  activeChildIdx: number;
}

const initialData: WizardData = {
  children: [createChild()],
  torahPortion: "",
  artStyle: "cartoon",
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

const TOTAL_STEPS = 13;

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
  { key: "cartoon", label: "Cartoon" },
  { key: "3d-pixar", label: "3D Pixar" },
  { key: "realistic", label: "Realistic" },
];

/* ── animation phases for the 10-second creation sequence ── */
const GENERATION_PHASES = [
  { icon: BookOpenCheck, text: "Writing your Torah story...", duration: 3000 },
  { icon: Paintbrush, text: "Illustrating beautiful scenes...", duration: 3000 },
  { icon: Sparkles, text: "Adding the finishing touches...", duration: 3000 },
  { icon: CheckCircle2, text: "Almost ready!", duration: 1000 },
];

/* ───────────────── component ───────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreationWizard = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { children: existingChildren } = useChildren();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [bookOptions, setBookOptions] = useState<BookOptions>(DEFAULT_BOOK_OPTIONS);
  
  const [portionFilter, setPortionFilter] = useState<TorahOption["category"] | "all">("all");
  const [portionSearch, setPortionSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
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

  // Save wizard state before login so we can resume
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
    };
    localStorage.setItem("torahtale_wizard_state", JSON.stringify(serializable));
  }, [step, data, shipping, bookOptions, portionFilter]);

  // Restore wizard state on mount if user just logged in
  useEffect(() => {
    const saved = localStorage.getItem("torahtale_wizard_state");
    if (saved && user) {
      try {
        const parsed = JSON.parse(saved);
        setStep(parsed.step || 1);
        setData(parsed.data || initialData);
        setShipping(parsed.shipping || DEFAULT_SHIPPING);
        setBookOptions(parsed.bookOptions || DEFAULT_BOOK_OPTIONS);
        if (parsed.portionFilter) setPortionFilter(parsed.portionFilter);
        localStorage.removeItem("torahtale_wizard_state");
      } catch { /* ignore */ }
    }
  }, []);

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

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
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count, error: countErr } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());
      if (!countErr && (count ?? 0) >= 2 && !justSubscribedRef.current) {
        setShowUpsellDialog(true);
        return;
      }
      justSubscribedRef.current = false;
      await startGeneration();
      return;
    }
    setDir(1);
    let nextStep = step + 1;
    if (step === 1 && allChildrenHaveGenderAge()) {
      nextStep = 4;
    }
    if (step === 4 && allChildrenHaveGenderAge() && allChildrenHavePhotoOrDesc()) {
      nextStep = 6;
    }
    setStep(Math.min(nextStep, TOTAL_STEPS));
  };

  const back = () => {
    setDir(-1);
    let prevStep = step - 1;
    if (allChildrenHaveGenderAge()) {
      if (step === 4) prevStep = 1;
      if (step === 6 && allChildrenHavePhotoOrDesc()) prevStep = 4;
    }
    setStep(Math.max(prevStep, 1));
  };

  const handlePlaceOrder = async (planType: string = "once") => {
    if (!savedBookId || !user) return;

    const isSubscription = planType !== "once";
    const orderNumber = `TT-${Date.now().toString().slice(-6)}`;

    try {
      // Update book status
      await supabase.from("books").update({
        status: "ordered",
        shipping_data: shipping,
        order_number: orderNumber,
        updated_at: new Date().toISOString(),
      } as any).eq("id", savedBookId);

      // Save subscription record if subscribing
      if (isSubscription) {
        const freqMap: Record<string, { frequency: string; price: number }> = {
          weekly: { frequency: "weekly", price: 23.99 },
          monthly: { frequency: "monthly", price: 19.99 },
          yearly: { frequency: "yearly", price: 15.38 },
        };
        const plan = freqMap[planType] || freqMap.weekly;
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          child_name: childNames,
          child_id: data.children[0]?.id || null,
          art_style: data.artStyle,
          language: data.language,
          shipping_data: shipping as any,
          status: "active",
          frequency: plan.frequency,
          price_per_week: plan.price,
        });
      }

      // Create Shopify cart and redirect to checkout
      const { createShopifyCart, SHOPIFY_VARIANT_IDS } = await import("@/lib/shopify");

      let variantId: string;
      if (isSubscription) {
        const subMap: Record<string, string> = {
          weekly: SHOPIFY_VARIANT_IDS.weeklySubscription,
          monthly: SHOPIFY_VARIANT_IDS.monthlySubscription,
          yearly: SHOPIFY_VARIANT_IDS.yearlySubscription,
        };
        variantId = subMap[planType] || SHOPIFY_VARIANT_IDS.monthlySubscription;
      } else {
        // One-time purchase — pick variant based on book options
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

      // Save wizard state so we can resume after checkout redirect
      localStorage.setItem("torahtale_pending_order", JSON.stringify({
        bookId: savedBookId,
        orderNumber,
        planType,
      }));

      const cart = await createShopifyCart({
        lineId: null,
        product: {} as any,
        variantId,
        variantTitle: isSubscription ? `${planType} subscription` : "Book",
        price: { amount: "0", currencyCode: "USD" },
        quantity: 1,
        selectedOptions: [],
      });

      if (cart?.checkoutUrl) {
        window.location.href = cart.checkoutUrl;
        return;
      } else {
        toast.error("Could not create checkout. Please try again.");
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      toast.error("Order failed. Please try again.");
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
    `relative rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 cursor-pointer
    ${isSelected
      ? "border-accent bg-accent/8 shadow-lg shadow-accent/10 scale-[1.02]"
      : "border-border/40 bg-card/60 backdrop-blur-sm hover:border-accent/40 hover:shadow-md hover:-translate-y-1"
    }`;

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[100dvh] sm:max-h-[90vh] overflow-hidden p-0 gap-0 rounded-none sm:rounded-3xl border-0 sm:border sm:border-border/30 shadow-2xl bg-background backdrop-blur-xl flex flex-col" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Create Your Book</DialogTitle>

        {/* ── Minimal progress bar + step counter ── */}
        {step <= 8 && (
          <div className="px-6 sm:px-8 pt-5 sm:pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  key={step}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springTransition}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center"
                >
                  <StepIcon className="w-4 h-4 text-accent" />
                </motion.div>
              </div>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">
                {step} <span className="text-muted-foreground/50">of</span> 8
              </span>
            </div>
            <div className="h-[3px] bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        {/* ── Scrollable content area ── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-5 sm:pt-6 pb-4">
          {/* ── Floating character preview badge (steps 2-5) ── */}
          {step >= 2 && step <= 5 && (() => {
            const preview = getPreviewImage();
            return preview ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
                className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-lg shadow-accent/10 ring-2 ring-background">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                {child.name && (
                  <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground mt-1 font-medium truncate max-w-20">{child.name}</p>
                )}
              </motion.div>
            ) : null;
          })()}

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

          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP 1: Name ── */}
            {step === 1 && (
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
                    What's your hero's name?
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
                              <div className="min-w-0 text-left">
                                <p className="font-display font-semibold text-sm text-foreground truncate">{ec.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {ec.age ? `${ec.age}yo` : ""}{ec.gender ? ` · ${ec.gender}` : ""}
                                </p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                >
                                  <Check className="w-4 h-4 text-accent ml-auto flex-shrink-0" />
                                </motion.div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">or enter a new name</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={staggerChild}>
                  <Input
                    placeholder="Enter child's name"
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
                        {c.name || `Child ${idx + 1}`}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: Gender ── */}
            {step === 2 && (
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
                    Is {child.name || "your hero"} a boy or girl?
                  </h2>
                </motion.div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { key: "boy", label: "Boy", img: presetBoyCartoon },
                    { key: "girl", label: "Girl", img: presetGirlCartoon },
                  ].map((g, i) => (
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
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md"
                        >
                          <Check className="w-4 h-4 text-accent-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Age ── */}
            {step === 3 && (
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
                    How old is {child.name || "your hero"}?
                  </h2>
                </motion.div>

                <motion.div variants={staggerChild}>
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    placeholder="Age"
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
                    {child.age} years old ✨
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Art Style ── */}
            {step === 4 && (
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
                    Choose an illustration style
                  </h2>
                </motion.div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {ART_STYLES.map((s, i) => {
                    const previewGender = data.children.length >= 2 ? "duo" : (child.gender || "boy");
                    const stylePreview = getStylePreset(previewGender, s.key);
                    return (
                      <motion.button
                        key={s.key}
                        variants={staggerChild}
                        onClick={() => {
                          update({ artStyle: s.key });
                          autoAdvance();
                        }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className={glassCard(data.artStyle === s.key)}
                      >
                        <div className="aspect-square bg-muted/20 relative">
                          <img src={stylePreview} alt={s.label} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                        </div>
                        <div className="p-2 sm:p-3">
                          <span className="text-xs sm:text-sm font-semibold text-foreground block">{s.label}</span>
                        </div>
                        {data.artStyle === s.key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
                          >
                            <Check className="w-3.5 h-3.5 text-accent-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Photo / Description ── */}
            {step === 5 && (
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
                    Help us draw {child.name || "your hero"}
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
                      <p className="text-sm font-semibold text-foreground">Upload a Photo</p>
                      {child.photoPreview ? (
                        <div className="flex items-center gap-3 w-full justify-center">
                          <img src={child.photoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                          <button
                            onClick={() => updateChild(child.id, { photo: null, photoPreview: null })}
                            className="text-xs text-destructive hover:underline font-medium"
                          >
                            Remove
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
                      <p className="text-sm font-semibold text-foreground">Describe Instead</p>
                    </div>
                    <Textarea
                      placeholder="e.g., Brown curly hair, olive skin, big brown eyes..."
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
                      <Plus className="w-4 h-4" /> Add Another Child
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── STEP 6: Torah Portion ── */}
            {step === 6 && (
              <motion.div
                key="s6"
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
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Choose a Parsha</h2>
                </motion.div>

                {/* Category pills */}
                <motion.div variants={staggerChild} className="flex justify-center flex-wrap gap-2">
                  {(["all", "torah", "neviim", "ketuvim", "megillot", "holiday"] as const).map((cat) => {
                    const meta = cat === "all" ? { label: "All", emoji: "📚" } : CATEGORY_META[cat];
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
                    placeholder="Search parsha..."
                    value={portionSearch}
                    onChange={(e) => setPortionSearch(e.target.value)}
                    className="rounded-2xl h-11 text-sm pl-10 bg-card/60 border-border/40 focus:border-accent/50 shadow-sm backdrop-blur-sm"
                  />
                  <BookOpen className="w-4 h-4 text-muted-foreground/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </motion.div>

                {/* Story cards */}
                <motion.div variants={staggerChild} className="max-h-[38vh] sm:max-h-[42vh] overflow-y-auto pr-1 scrollbar-thin space-y-3">
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
                                <span className="text-base">📖</span> Sefer {book}
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
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
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
                                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
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
                                      className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
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
                                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
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
                          className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
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
                              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-accent-foreground" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                      {filteredPortions.length === 0 && (
                        <p className="col-span-full text-center text-sm text-muted-foreground py-8">No stories found.</p>
                      )}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* ── STEP 7: Language ── */}
            {step === 7 && (
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
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Choose a Language</h2>
                </motion.div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { key: "english", label: "English", emoji: "🇺🇸" },
                    { key: "hebrew", label: "Hebrew", emoji: "🇮🇱" },
                    { key: "bilingual", label: "Both", emoji: "🌍" },
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
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3.5 h-3.5 text-accent-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 8: Review & Generate ── */}
            {step === 8 && (
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
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Ready to Create!</h2>
                </motion.div>

                {/* Summary cards */}
                <motion.div variants={staggerChild} className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Character</p>
                    <p className="text-sm font-semibold text-foreground">{childNames}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Story</p>
                    <p className="text-sm font-semibold text-foreground">{getPortionLabel(data.torahPortion) || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Art Style</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{data.artStyle}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Pages</p>
                    <p className="text-sm font-semibold text-foreground">10 pages</p>
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
                      <p className="font-display font-semibold text-sm text-foreground">Sign in to generate your sefer</p>
                    </div>

                    <form onSubmit={loginMode === "login" ? handleWizardLogin : handleWizardSignup} className="space-y-3">
                      {loginMode === "signup" && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Full Name</Label>
                          <Input value={loginFullName} onChange={(e) => setLoginFullName(e.target.value)} placeholder="Rachel Goldberg" className="rounded-xl h-10 mt-1 border-border/40 bg-card/60" />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <div className="relative mt-1">
                          <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@email.com" className="rounded-xl h-10 pl-9 border-border/40 bg-card/60" required />
                          <Mail className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Password</Label>
                        <div className="relative mt-1">
                          <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="rounded-xl h-10 pl-9 border-border/40 bg-card/60" required minLength={6} />
                          <Lock className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <Button type="submit" variant="gold" className="w-full rounded-xl h-10" disabled={loginLoading}>
                        {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : loginMode === "login" ? "Sign In" : "Create Account"}
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        {loginMode === "login" ? (
                          <>Don't have an account?{" "}<button type="button" onClick={() => setLoginMode("signup")} className="text-accent font-medium hover:underline">Sign up</button></>
                        ) : (
                          <>Already have an account?{" "}<button type="button" onClick={() => setLoginMode("login")} className="text-accent font-medium hover:underline">Sign in</button></>
                        )}
                      </p>
                    </form>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground/60">or</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <Button type="button" variant="outline" className="w-full rounded-xl h-10 gap-2 border-border/40" onClick={handleWizardGoogleLogin} disabled={loginLoading}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Continue with Google
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

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
                  <AutoAdvanceStep onAdvance={() => { setDir(1); setStep(10); }} delayMs={5000}>
                    {(progress) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center space-y-6"
                      >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto">
                          <Mail className="w-10 h-10 text-accent" />
                        </div>
                        <div>
                          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Your sefer is being created!</h2>
                          <p className="text-muted-foreground text-sm mt-3 max-w-sm mx-auto leading-relaxed">
                            You'll receive an email within <span className="font-semibold text-accent">24 hours</span> with a preview of {childNames}'s book.
                          </p>
                        </div>

                        <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-4 sm:p-5 max-w-sm mx-auto space-y-2">
                          <div className="flex items-center gap-3 justify-center">
                            <BookOpen className="w-5 h-5 text-accent" />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-foreground">{childNames}'s Torah Adventure</p>
                              <p className="text-xs text-muted-foreground">{getPortionLabel(data.torahPortion)} · {data.artStyle === "3d-pixar" ? "3D Pixar" : data.artStyle === "realistic" ? "Realistic" : "Cartoon"}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => { setDir(1); setStep(10); }}
                          className="relative inline-flex items-center justify-center gap-2 rounded-full h-12 sm:h-13 px-8 sm:px-10 font-semibold text-accent-foreground overflow-hidden cursor-pointer border-0 shadow-lg shadow-accent/20"
                          style={{ background: 'hsl(var(--accent))' }}
                        >
                          <span
                            className="absolute inset-0 bg-black/15 origin-left transition-none"
                            style={{ transform: `scaleX(${progress})` }}
                          />
                          <span className="relative z-10 flex items-center gap-2 text-sm">
                            Continue to Choose Your Book <ArrowRight className="w-4 h-4" />
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AutoAdvanceStep>
                )}
              </motion.div>
            )}

            {/* ── STEP 10: Book Options ── */}
            {step === 10 && (
              <motion.div key="s10" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <BookOptionsStep options={bookOptions} onChange={setBookOptions} />
              </motion.div>
            )}

            {/* ── STEP 11: Shipping ── */}
            {step === 11 && (
              <motion.div key="s11" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <ShippingForm data={shipping} onChange={setShipping} />
              </motion.div>
            )}

            {/* ── STEP 12: Checkout ── */}
            {step === 12 && (
              <motion.div key="s12" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <CheckoutStep childName={childNames} torahPortion={data.torahPortion} artStyle={data.artStyle} shipping={shipping} bookOptions={bookOptions} onPlaceOrder={handlePlaceOrder} />
              </motion.div>
            )}

            {/* ── STEP 13: Success ── */}
            {step === 13 && (
              <motion.div key="s13" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <SuccessStep childName={childNames} onGoToDashboard={() => { onClose(); navigate("/dashboard"); }} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Nav buttons — pinned to bottom ── */}
        {step !== 9 && step !== 12 && step !== 13 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0 flex justify-between px-6 sm:px-8 py-4 sm:py-5 border-t border-border/30 bg-background/80 backdrop-blur-sm"
          >
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step <= 7 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 sm:px-8 h-11 rounded-full bg-gradient-to-r from-accent to-accent/85 text-accent-foreground font-semibold text-sm shadow-md shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
            {step === 8 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                className="flex items-center gap-2 px-6 sm:px-8 h-11 rounded-full bg-gradient-to-r from-accent to-accent/85 text-accent-foreground font-semibold text-sm shadow-md shadow-accent/20 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Generate Book
              </motion.button>
            )}
            {(step === 10 || step === 11) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 sm:px-8 h-11 rounded-full bg-gradient-to-r from-accent to-accent/85 text-accent-foreground font-semibold text-sm shadow-md shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>

    <SubscriptionUpsellDialog
      open={showUpsellDialog}
      onClose={() => setShowUpsellDialog(false)}
      onSubscribed={() => {
        justSubscribedRef.current = true;
        setShowUpsellDialog(false);
        startGeneration();
      }}
      context="limit-reached"
    />
    </>
  );
};
