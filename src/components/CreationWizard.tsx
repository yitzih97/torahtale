import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Plus,
  Users, BookOpen, Palette, Package, Check,
  Camera, Sun, User, Type, Calendar, Heart, Image, PenLine,
  Lock, Mail, LogIn, BookOpenCheck, Paintbrush, CheckCircle2, RotateCcw,
  ChevronLeft, ChevronRight, Search
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
import { BookOptionsStep, DEFAULT_BOOK_OPTIONS, calculateBookPriceForCurrency, getColoringBookAddonPrice, getStoryPageCount, type BookOptions } from "./wizard/BookOptionsStep";
import { StoryPreviewStep } from "./wizard/StoryPreviewStep";
import { QuantityStep, getVolumeDiscount } from "./wizard/QuantityStep";
import { TORAH_PORTIONS, CATEGORY_BOOKS, BOOK_LABELS, CATEGORY_META, getPortionLabel, getUpcomingParsha, stripSeferPrefix, type TorahOption } from "./wizard/TorahPortions";
import { PortionIcon } from "./wizard/portionIcons";
import { createOrderCheckout, type OrderPlan } from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChildren } from "@/hooks/useChildren";
import { ImageCropDialog } from "./ImageCropDialog";
import { FamilyPhotoDialog, type ReviewedPerson } from "./wizard/FamilyPhotoDialog";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";



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
import presetEarlyReaderBoy from "@/assets/presets/early-reader-boy-cartoon.jpg";
import presetEarlyReaderGirl from "@/assets/presets/early-reader-girl-cartoon.jpg";
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
  savedChildId?: string | null;
  existingPhotoUrl?: string | null;
  role?: "tatty" | "mommy" | "child";
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
  savedChildId: null,
  existingPhotoUrl: null,
  role: "child",
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
  pageCount: getStoryPageCount(DEFAULT_BOOK_OPTIONS),
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
    boy: { "2-3": presetToddlerBoy, "4-5": presetPreschoolBoy, "6-7": presetEarlyReaderBoy, "8-9": presetExplorerBoy, "10-12": presetPreteenBoy },
    girl: { "2-3": presetToddlerGirl, "4-5": presetPreschoolGirl, "6-7": presetEarlyReaderGirl, "8-9": presetExplorerGirl, "10-12": presetPreteenGirl },
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
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const { children: existingChildren, addChild: addChildMutation } = useChildren();

  const GENERATION_PHASES = [
    { icon: BookOpenCheck, text: t.wizard.writingStory, duration: 3000 },
    { icon: Paintbrush, text: t.wizard.illustrating, duration: 3000 },
    { icon: Sparkles, text: t.wizard.finishing, duration: 3000 },
    { icon: CheckCircle2, text: t.wizard.almostReady, duration: 1000 },
  ];
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState<"subscription" | "single">("single");
  const [seriesType, setSeriesType] = useState<"torah" | "tanach">("torah");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [bookOptions, setBookOptions] = useState<BookOptions>(DEFAULT_BOOK_OPTIONS);

  // Keep story pageCount in sync with the chosen book format (board=10, softcover=20, hardcover=24)
  useEffect(() => {
    const target = getStoryPageCount(bookOptions);
    setData((d) => (d.pageCount === target ? d : { ...d, pageCount: target }));
  }, [bookOptions]);


  
  const [portionFilter, setPortionFilter] = useState<TorahOption["category"]>("torah");
  const [portionSearch, setPortionSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>("Bereishit");
  // Step-6 drill-down: "mode" (parsha vs. different story) → "category" → "stories"
  const [portionView, setPortionView] = useState<"mode" | "category" | "stories">("mode");
  const [styleSubStep, setStyleSubStep] = useState<"art" | "format">("art");
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [bookOptionsChosenEarly, setBookOptionsChosenEarly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | "yearly" | "once">("once");
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

  const persistingBookRef = useRef(false);
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
      planType,
      bookOptionsChosenEarly,
      savedBookId,
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
  }, [step, planType, bookOptionsChosenEarly, savedBookId, data, shipping, bookOptions, portionFilter, quantity]);

  // Restore wizard state on mount (whether logged in or not)
  useEffect(() => {
    const defaultLanguage = lang === "he" ? "hebrew" : lang === "yi" ? "yiddish" : "english";
    const saved = localStorage.getItem("torahtale_wizard_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Don't restore terminal/transient steps (success or generation animation)
        const rawStep = typeof parsed.step === "number" && parsed.step < 16 ? parsed.step : 1;
        const restoredStep = rawStep < 1 ? 1 : rawStep;
        setStep(restoredStep);
        if (parsed.planType === "single" || parsed.planType === "subscription") {
          setPlanType(parsed.planType);
        }
        if (typeof parsed.bookOptionsChosenEarly === "boolean") {
          setBookOptionsChosenEarly(parsed.bookOptionsChosenEarly);
        }
        // Restore the already-created book id so checkout works after a
        // refresh/close/login. Without this, savedBookId is null on return and
        // handlePlaceOrder wrongly reports the book "isn't ready yet".
        if (typeof parsed.savedBookId === "string" && parsed.savedBookId) {
          setSavedBookId(parsed.savedBookId);
        }
        const restoredData = parsed.data || initialData;
        if (!restoredData.language || restoredData.language === "english") {
          restoredData.language = defaultLanguage;
        }
        setData(restoredData);
        // Seed selectedLanguages from the restored language string
        if (restoredData.language) {
          const parts = restoredData.language.split("+").filter((s: string) => ["english", "hebrew", "yiddish"].includes(s));
          if (parts.length) setSelectedLanguages(parts);
          else if (["english", "hebrew", "yiddish"].includes(restoredData.language)) setSelectedLanguages([restoredData.language]);
        }
        setShipping(parsed.shipping || DEFAULT_SHIPPING);
        setBookOptions(parsed.bookOptions || DEFAULT_BOOK_OPTIONS);
        if (typeof parsed.quantity === "number" && parsed.quantity >= 1) setQuantity(parsed.quantity);
        if (parsed.portionFilter && ["torah","neviim","ketuvim","megillot","holiday","educational"].includes(parsed.portionFilter)) setPortionFilter(parsed.portionFilter);

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
      setSelectedLanguages([defaultLanguage]);
    }
    didRestoreRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every meaningful change
  useEffect(() => {
    if (step > 0 || data.children.some(c => c.name || c.age || c.gender)) {
      saveWizardState();
    }
  }, [saveWizardState, step, data]);

  // Self-heal: if we're logged in but lost the book id (e.g. localStorage was
  // cleared, or the book was created in a prior session before savedBookId was
  // persisted), adopt the user's most recent unpaid book so checkout isn't
  // wrongly blocked with "your book isn't ready yet".
  useEffect(() => {
    if (!user || savedBookId) return;
    let cancelled = false;
    (async () => {
      const { data: book, error } = await supabase
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "awaiting_payment")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && !error && book?.id) {
        setSavedBookId(book.id);
      }
    })();
    return () => { cancelled = true; };
  }, [user, savedBookId]);

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

  // Skip gender/age steps when every selected child already has them
  // (e.g. all children were chosen from saved profiles).
  useEffect(() => {
    // Only auto-skip when every selected child is a fully-loaded saved profile.
    // Never skip for fresh entries, even if gender/age are leftover from restored state.
    if (step === 2 && data.children.length > 0 && data.children.every((c) => !!c.savedChildId && !!c.gender)) {
      setStep(dir >= 0 ? 3 : 1);
    } else if (step === 3 && data.children.length > 0 && data.children.every((c) => !!c.savedChildId && !!c.age && !!c.gender)) {
      setStep(dir >= 0 ? 4 : 1);
    } else if (step === 5 && data.children.length > 0 && data.children.every((c) => !!c.savedChildId && !!c.existingPhotoUrl)) {
      setStep(dir >= 0 ? 6 : 4);
    }
  }, [step, dir, data.children]);

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

  // Entering the story step always starts at the first drill-down level.
  useEffect(() => {
    if (step === 6) setPortionView("mode");
  }, [step]);

  /* ───── login prompt during step 8 auth gate ───── */

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    if (showLoginPrompt) setShowLoginPrompt(false);

    // The login/sign-up gate now lives at step 10 (after the generation skeletons
    // begin). When the user signs in there — inline OR returning from an OAuth
    // redirect — create the pending book and let the flow continue to book-type
    // selection + checkout.
    if (step >= 9 && !savedBookId) {
      void persistGeneratedBook().then(() => {
        if (step === 9) return; // animation will auto-advance to step 10
        toast.success("Signed in! Continue choosing your book.");
      });
    }
  }, [user, authLoading, showLoginPrompt, step, savedBookId]);

  const handleWizardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    saveWizardState(); // keep their progress even if sign-in fails
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Welcome back!"); }
  };

  const handleWizardSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    saveWizardState(); // keep their progress even if sign-up fails
    setLoginLoading(true);
    const { error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
      options: { data: { full_name: loginFullName }, emailRedirectTo: `${window.location.origin}/create` },
    });
    setLoginLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Account created!"); }
  };

  const handleWizardGoogleLogin = async () => {
    setLoginLoading(true);
    saveWizardState();
    // Return straight to the wizard so it restores from localStorage to the
    // exact step the user was on (not the home page).
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/create` },
    });
    setLoginLoading(false);
    if (error) toast.error(error.message);
  };

  const [cropState, setCropState] = useState<{ childId: string; src: string; fileName: string } | null>(null);
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);

  const handleFamilyPhotoConfirm = (people: ReviewedPerson[]) => {
    const newChildren: ChildProfile[] = people.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      age: p.age,
      gender: p.gender,
      photo: p.photo,
      photoPreview: p.photoPreview,
      description: p.description,
      characterPreview: null,
      savedChildId: null,
      existingPhotoUrl: null,
      role: p.role,
    }));
    setData((prev) => ({ ...prev, children: newChildren, activeChildIdx: 0 }));
    toast.success(`Added ${newChildren.length} ${newChildren.length === 1 ? "person" : "people"} from your photo`);
  };

  const handlePhoto = (childId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropState({ childId, src: reader.result as string, fileName: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  /* ───── book generation (fire-and-forget → 10s animation) ───── */

  // Persist the pending book record (photos + reusable characters + book row).
  // Requires a signed-in user. Safe to call once — bails if a book already exists.
  // Called from startGeneration (when already signed in) and from the post-auth
  // effect (when the user signs in at the step-10 gate, after generation began).
  const persistGeneratedBook = async () => {
    if (!user || savedBookId || persistingBookRef.current) return;
    persistingBookRef.current = true;
    try {
        const portionLabel = getPortionLabel(data.torahPortion);
        const childrenInfo = data.children.map((c) => `${c.name} (${c.age} years old, ${c.gender})`).join(", ");

        // Upload child photos to storage and collect URLs
        const childDescriptions = await Promise.all(
          data.children.map(async (c) => {
            let photoUrl: string | null = c.existingPhotoUrl ?? null;
            if (c.photo) {
              const filePath = `${user.id}/${c.id}-${Date.now()}.jpg`;
              const { error: uploadErr } = await supabase.storage
                .from("child-photos")
                .upload(filePath, c.photo, { upsert: true });
              if (!uploadErr) {
                const { data: signed } = await supabase.storage
                  .from("child-photos")
                  .createSignedUrl(filePath, 60 * 60 * 24 * 365);
                photoUrl = signed?.signedUrl || null;
              }
            }
            // Save new children as reusable characters
            if (!c.savedChildId && c.name && c.age && c.gender) {
              try {
                await addChildMutation.mutateAsync({
                  name: c.name,
                  age: parseInt(c.age) || null,
                  gender: c.gender,
                  photo_url: photoUrl,
                  art_style: data.artStyle,
                  description: c.description || null,
                });
              } catch (e) {
                console.warn("Failed to save child as character:", e);
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
            status: "awaiting_payment",
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
    } finally {
      persistingBookRef.current = false;
    }
  };

  const startGeneration = async () => {
    setDir(1);
    setStep(9);
    setAnimating(true);
    setAnimPhaseIdx(0);
    setAnimDone(false);

    // Persist immediately if already signed in; otherwise the post-auth effect
    // creates the book once the user signs in at the step-10 gate.
    if (user) await persistGeneratedBook();

    for (let i = 0; i < GENERATION_PHASES.length; i++) {
      setAnimPhaseIdx(i);
      await new Promise((r) => setTimeout(r, GENERATION_PHASES[i].duration));
    }

    setAnimating(false);
    setAnimDone(true);
  };

  /* ───── step skipping helpers ───── */

  // Only treat children as "pre-filled" (allowing step skip) when they're loaded saved profiles.
  // This prevents leftover gender/age from a restored wizard state from skipping required steps.
  const allChildrenHaveGenderAge = useCallback(() =>
    data.children.length > 0 && data.children.every((c) => !!c.savedChildId && !!c.gender && !!c.age), [data.children]);

  const allChildrenHavePhotoOrDesc = useCallback(() =>
    data.children.length > 0 && data.children.every((c) => !!c.savedChildId && (!!c.photoPreview || !!c.description || !!c.existingPhotoUrl)), [data.children]);

  /* ───── navigation ───── */

  const next = async () => {
    // Cancel any queued auto-advance so we don't double-step
    if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
    if (step === 8) {
      // Generation no longer requires sign-in. Anyone can generate; the
      // login/sign-up gate moved to step 10 (after the skeletons begin), before
      // book-type selection + checkout.
      if (animating) return;
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
    // Step 11 (payment + summary) — the "Continue" CTA inside the step advances directly to step 12 (shipping),
    // and step 12's own Place Order button calls handlePlaceOrder which jumps to the success step.
    if (step === 11) {
      nextStep = 12;
    }
    setStep(Math.min(nextStep, TOTAL_STEPS));
  };

  const back = () => {
    if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
    // Within step 6, "back" walks the drill-down up one level before leaving the step.
    if (step === 6 && portionView === "stories") { setPortionView("category"); return; }
    if (step === 6 && portionView === "category") { setPortionView("mode"); return; }
    setDir(-1);
    let prevStep = step - 1;
    if (allChildrenHaveGenderAge()) {
      if (step === 6 && allChildrenHavePhotoOrDesc()) prevStep = 4;
    }
    if (step === 12) prevStep = 11;
    if (step === 13) prevStep = 11;
    setStep(Math.max(prevStep, 1));
  };

  const resetWizard = useCallback(() => {
    try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
    const defaultLanguage = lang === "he" ? "hebrew" : lang === "yi" ? "yiddish" : "english";
    setData({ ...initialData, children: [createChild()], language: defaultLanguage });
    setShipping(DEFAULT_SHIPPING);
    setBookOptions(DEFAULT_BOOK_OPTIONS);
    setPortionFilter("torah");
    setPortionSearch("");
    setPortionView("mode");
    setStyleSubStep("art");
    setSavedBookId(null);
    setDir(-1);
    setPlanType("single");
    setSelectedPlan("once");
    setBookOptionsChosenEarly(false);
    setStep(1);
    toast.success(t.wizard.createYourBook ? `${t.wizard.createYourBook} · ${"1/8"}` : "Wizard reset");
  }, [lang, t]);

  const handlePlaceOrder = async (planType: string = "once") => {
    // Real checkout: hand the order off to Shopify's hosted checkout. The book stays
    // "awaiting_payment" until the orders/paid webhook flips it to "paid"; the admin
    // then generates + approves it before it goes to Printify for printing.
    try {
      if (!user) {
        setShowLoginPrompt(true);
        toast.info("Please sign in to complete your order.");
        return;
      }
      if (!savedBookId) {
        toast.error("Your book isn't ready yet — please try again in a moment.");
        return;
      }

      const orderPlan: OrderPlan =
        planType === "weekly" || planType === "monthly" || planType === "yearly" ? planType : "once";
      const isSubscription = orderPlan !== "once";

      // Persist chosen options on the book so the Printify step has them.
      const { error: bookErr } = await supabase
        .from("books")
        .update({
          status: "awaiting_payment",
          shipping_data: { ...shipping, bookOptions, quantity, planType: orderPlan },
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", savedBookId);
      if (bookErr) console.error("Checkout: book update failed", bookErr);

      // For subscriptions, create the row now so the webhook can correlate the
      // Shopify customer/contract back to it once payment completes. Carry the child
      // id + the book "recipe" (childDescriptions incl. photo, page count, options)
      // from this first book so every recurring book the webhook mints keeps the
      // child's likeness — not just their name.
      if (isSubscription) {
        const { data: srcBook } = await supabase
          .from("books")
          .select("story_data, child_id")
          .eq("id", savedBookId)
          .maybeSingle();
        const subChildId =
          (srcBook as any)?.child_id ?? data.children.find((c) => c.savedChildId)?.savedChildId ?? null;
        const { error: subErr } = await supabase.from("subscriptions").insert({
          user_id: user.id,
          child_id: subChildId,
          child_name: childNames,
          art_style: data.artStyle || "cartoon",
          language: data.language || "english",
          status: "active",
          frequency: orderPlan,
          shipping_data: shipping as any,
          book_config: (srcBook as any)?.story_data ?? null,
        } as any);
        if (subErr) console.error("Checkout: subscription insert failed", subErr);
      }

      const checkout = await createOrderCheckout({
        bookId: savedBookId,
        plan: orderPlan,
        bookOptions,
        quantity,
      });
      if (!checkout) {
        toast.error("Couldn't start checkout. Please try again.");
        return;
      }

      localStorage.removeItem("torahtale_pending_order");
      // Redirect to Shopify's hosted checkout to collect payment + shipping address.
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Something went wrong starting checkout.");
    }
  };


  /* ───── can proceed checks ───── */

  const canNext = (() => {
    switch (step) {
      case 1: return data.children.some((c) => !!c.name.trim());
      case 2: return !!child.gender;
      case 3: return !!child.age && parseInt(child.age) >= 1 && parseInt(child.age) <= 15;
      case 4: return !!data.artStyle;
      // Photo step: every child needs either an image OR a description of 3+ words.
      case 5: return data.children.every((c) =>
        !!c.photoPreview || !!c.existingPhotoUrl ||
        (c.description || "").trim().split(/\s+/).filter(Boolean).length >= 3);
      case 6: return !!data.torahPortion;
      case 7: return selectedLanguages.length >= 1;
      case 8: return true;
      case 10: return true;
      case 11: return !!(shipping.fullName && shipping.street && shipping.city && shipping.state && shipping.zip);
      case 12: return true;
      default: return false;
    }
  })();

  const filteredPortions = (() => {
    let list = TORAH_PORTIONS.filter((p) => p.category === portionFilter);
    if (portionSearch.trim()) {
      const q = portionSearch.toLowerCase();
      list = TORAH_PORTIONS.filter((p) => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));
    }
    return list;
  })();

  /* ───── progress calculation ───── */
  const progressPercent = (() => {
    const mainSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8];
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
    <div className="wizard-glass min-h-screen w-full flex flex-col relative bg-background">
      {/* ── Clean minimal top bar — back · step title + dots · close ── */}
      {(() => {
        const stepTitles: Record<number, string> = {
          0: t.wizard.planChoiceTitle,
          1: t.wizard.createYourBook,
          2: t.wizard.createYourBook,
          3: t.wizard.createYourBook,
          4: t.wizard.createYourBook,
          5: t.wizard.createYourBook,
          6: t.wizard.createYourBook,
          7: t.wizard.createYourBook,
          8: t.wizard.createYourBook,
        };
        const mainSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const currentIdx = mainSteps.indexOf(step);
        const showHeader = step <= 8;
        if (!showHeader) return null;
        return (
          <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 h-16 sm:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center">
                {step > 1 ? (
                  <button
                    onClick={back}
                    aria-label={t.common.back}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                ) : (
                  <div className="w-10 h-10" />
                )}
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate text-center">
                  {stepTitles[step] || t.wizard.createYourBook}
                </p>
                <div className="flex items-center gap-1.5" aria-label={`Step ${currentIdx + 1} of ${mainSteps.length}`}>
                  {mainSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`block rounded-full transition-all duration-300 ${
                        i === currentIdx
                          ? "w-1.5 h-1.5 bg-foreground"
                          : i < currentIdx
                          ? "w-1.5 h-1.5 bg-foreground/40"
                          : "w-1.5 h-1.5 bg-foreground/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end">
                {onClose && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Main content area — generous spacing, Fanvue clean layout ── */}
      <div className="flex-1 w-full">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6 sm:py-10 pb-[140px] sm:pb-32">
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

                {user && existingChildren.length > 0 && (
                  <motion.div variants={staggerChild} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        {lang === "he" ? "בחרו מילדים שמורים" : lang === "yi" ? "קלייַבן געראטעוועטע קינדער" : "Pick saved kids"}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        {lang === "he" ? "ניהול הילדים" : lang === "yi" ? "פירן קינדער" : "Manage kids"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {existingChildren.map((k) => {
                        const selected = data.children.some((c) => c.savedChildId === k.id);
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => {
                              setData((prev) => {
                                const idx = prev.children.findIndex((c) => c.savedChildId === k.id);
                                if (idx >= 0) {
                                  // Toggle off — remove this saved kid
                                  const next = prev.children.filter((_, i) => i !== idx);
                                  const remaining = next.length ? next : [createChild()];
                                  return {
                                    ...prev,
                                    children: remaining,
                                    activeChildIdx: Math.min(prev.activeChildIdx, remaining.length - 1),
                                  };
                                }
                                // Toggle on — add this saved kid
                                const newEntry: ChildProfile = {
                                  ...createChild(),
                                  name: k.name,
                                  age: k.age ? String(k.age) : "",
                                  gender: k.gender || "",
                                  photoPreview: k.photo_url || null,
                                  existingPhotoUrl: k.photo_url || null,
                                  description: k.description || "",
                                  savedChildId: k.id,
                                };
                                // If the only existing child is the empty starter, replace it
                                const base = prev.children;
                                const onlyEmptyStarter =
                                  base.length === 1 && !base[0].name && !base[0].savedChildId;
                                const nextChildren = onlyEmptyStarter ? [newEntry] : [...base, newEntry];
                                return {
                                  ...prev,
                                  children: nextChildren,
                                  activeChildIdx: nextChildren.length - 1,
                                };
                              });
                            }}
                            aria-pressed={selected}
                            className={`relative flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-200 ${
                              selected
                                ? "border-accent bg-accent/10 shadow-sm"
                                : "border-border/40 bg-card/60 hover:border-accent/60 hover:bg-accent/5"
                            }`}
                          >
                            {k.photo_url ? (
                              <img src={k.photo_url} alt={k.name} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                                {k.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground">{k.name}</span>
                            {selected && (
                              <span className="ms-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                                <Check className="w-3 h-3 text-accent-foreground" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {lang === "he" ? "או" : lang === "yi" ? "אָדער" : "or"}
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={staggerChild}>
                  {(() => {
                    const activeIsSaved = !!child.savedChildId;
                    const inputValue = activeIsSaved ? "" : child.name;
                    const placeholder = activeIsSaved
                      ? (lang === "he" ? "להוספת ילד נוסף" : lang === "yi" ? "לייג צו אן אנדער קינד" : "Add another child")
                      : t.wizard.enterChildName;
                    const handleChange = (val: string) => {
                      if (activeIsSaved) {
                        setData((prev) => {
                          const newEntry: ChildProfile = { ...createChild(), name: val };
                          const nextChildren = [...prev.children, newEntry];
                          return {
                            ...prev,
                            children: nextChildren,
                            activeChildIdx: nextChildren.length - 1,
                          };
                        });
                      } else {
                        updateChild(child.id, { name: val, savedChildId: null, existingPhotoUrl: null });
                      }
                    };
                    return (
                      <Input
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && inputValue.trim().length >= 1) {
                            e.preventDefault();
                            autoAdvance();
                          }
                        }}
                        onBlur={() => {
                          if (!activeIsSaved && child.name.trim().length >= 1 && step === 1) autoAdvance();
                        }}
                        className="rounded-2xl h-14 text-lg text-center border-2 border-border/40 bg-card/60 backdrop-blur-sm focus:border-accent/50 focus:ring-accent/20 placeholder:text-muted-foreground/40 font-medium"
                        autoFocus
                      />
                    );
                  })()}
                </motion.div>


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
                    { key: "boy", label: t.wizard.boy, Icon: User, tile: "from-sky-100 to-sky-50", color: "text-sky-600" },
                    { key: "girl", label: t.wizard.girl, Icon: User, tile: "from-rose-100 to-rose-50", color: "text-rose-500" },
                  ].map((g) => {
                    const selected = child.gender === g.key;
                    return (
                      <motion.button
                        key={g.key}
                        variants={staggerChild}
                        onClick={() => {
                          updateChild(child.id, { gender: g.key });
                          autoAdvance();
                        }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className={glassCard(selected)}
                      >
                        <div className="flex flex-col items-center justify-center gap-3.5 px-4 py-7 sm:py-8">
                          <span className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${g.tile} flex items-center justify-center shadow-inner ring-1 ring-foreground/5`}>
                            <g.Icon className={`w-9 h-9 sm:w-11 sm:h-11 ${g.color}`} strokeWidth={1.75} />
                          </span>
                          <span className="text-base sm:text-lg font-semibold text-foreground">{g.label}</span>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md"
                          >
                            <Check className="w-4 h-4 text-accent-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
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
                    {t.wizard.chooseStyle}
                  </h2>
                </motion.div>

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
                          autoAdvance();
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
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.helpDraw(child.name)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{t.wizard.photoOrDescHint}</p>
                </motion.div>

                <div className="max-w-md mx-auto space-y-4">
                  {/* Option 1 — upload a photo */}
                  <motion.div variants={staggerChild} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center"><Camera className="w-4 h-4 text-accent" /></div>
                      <p className="font-display font-semibold text-sm text-foreground">{t.wizard.uploadPhoto}</p>
                    </div>
                    {child.photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-accent/40">
                        <img src={child.photoPreview} alt={child.name} className="w-full h-52 object-cover" />
                        <button
                          type="button"
                          onClick={() => updateChild(child.id, { photo: null, photoPreview: null })}
                          className="absolute top-2 end-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-semibold text-foreground hover:bg-background transition"
                        >
                          {t.wizard.remove}
                        </button>
                      </div>
                    ) : (
                      <label className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/30 bg-gradient-to-b from-accent/5 to-transparent p-8 cursor-pointer hover:border-accent/60 hover:from-accent/10 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:scale-105 transition-transform"><Camera className="w-6 h-6 text-accent" /></div>
                        <span className="text-sm font-medium text-foreground">{t.wizard.uploadPhoto}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(child.id, e)} />
                      </label>
                    )}
                    <button type="button" onClick={() => setFamilyDialogOpen(true)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-accent hover:underline">
                      <Users className="w-3.5 h-3.5" /> {t.wizard.uploadFamilyPhoto}
                    </button>
                  </motion.div>

                  {/* divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">{t.wizard.or}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  {/* Option 2 — describe in words */}
                  <motion.div variants={staggerChild} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center"><PenLine className="w-4 h-4 text-accent" /></div>
                      <p className="font-display font-semibold text-sm text-foreground">{t.wizard.describeInstead}</p>
                    </div>
                    <Textarea
                      placeholder={t.wizard.descPlaceholder}
                      value={child.description}
                      onChange={(e) => updateChild(child.id, { description: e.target.value })}
                      className="rounded-xl min-h-[110px] text-sm border-border/40 bg-background/50"
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

            {/* ── STEP 6: Torah Portion (simplified, single screen) ── */}
            {step === 6 && (() => {
              const isHe = lang === "he" || lang === "yi";
              const upcomingValue = getUpcomingParsha();
              const upcoming = TORAH_PORTIONS.find((p) => p.value === upcomingValue);
              const upcomingTitle = upcoming
                ? (isHe ? upcoming.sub : upcoming.label)
                : "";
              const isSearching = portionSearch.trim().length > 0;
              const catBooks = CATEGORY_BOOKS[portionFilter];
              const showAccordion = !!catBooks && !isSearching;
              const flatList = isSearching
                ? filteredPortions
                : TORAH_PORTIONS.filter((p) => p.category === portionFilter);
              const catMeta = CATEGORY_META[portionFilter];
              // `short` strips the "Sefer X – " prefix (used inside a sefer accordion,
              // where the header already names the sefer).
              const renderStoryCard = (p: TorahOption, short = false) => {
                const selected = data.torahPortion === p.value;
                const title = isHe ? p.sub : p.label;
                const subtitle = isHe ? p.label : p.sub;
                return (
                  <motion.button
                    key={p.value}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { update({ torahPortion: p.value }); autoAdvance(); }}
                    className={`group relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-start transition-all duration-200 ${
                      selected
                        ? "border-accent bg-accent/10 shadow-md shadow-accent/15 ring-1 ring-accent/40"
                        : "border-border/40 bg-card/70 hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm backdrop-blur-sm"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${selected ? "bg-accent/15 text-accent" : "bg-muted/50 text-foreground/70 group-hover:bg-accent/10 group-hover:text-accent"}`}><PortionIcon name={p.icon} className="w-[18px] h-[18px]" /></span>
                    <span className="font-display text-sm font-semibold text-foreground leading-snug pe-5">{short ? stripSeferPrefix(title) : title}</span>
                    {!isHe && (
                      <span className="text-[11px] text-muted-foreground font-medium leading-snug">{short ? stripSeferPrefix(subtitle) : subtitle}</span>
                    )}
                    {selected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} className="absolute top-2.5 end-2.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              };

              return (
              <section
                id={stepIdFor(6)}
                ref={setStepRef(6)}
                onClick={step !== 6 ? () => setStep(6) : undefined}
                className={sectionClass(6)}
              >
              {step !== 6 && <div className="absolute inset-0 z-10" aria-hidden />}
              <motion.div
                key="s6"
                custom={dir}
                variants={{ ...stepVariants, ...staggerContainer }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-5 w-full max-w-3xl"
              >
                {/* ── Header (with back at deeper levels) ── */}
                <motion.div variants={staggerChild} className="text-center relative">
                  {portionView !== "mode" && (
                    <button
                      onClick={back}
                      className="absolute start-0 top-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t.wizard.backStory}
                    </button>
                  )}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4"
                  >
                    <BookOpen className="w-7 h-7 text-accent" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {portionView === "mode"
                      ? t.wizard.chooseParsha
                      : portionView === "category"
                        ? t.wizard.chooseCategory
                        : (isHe ? catMeta.labelHe : catMeta.label)}
                  </h2>
                </motion.div>

                {/* ── LEVEL 1: this week's parsha vs. a different story ── */}
                {portionView === "mode" && (
                  <>
                    {upcoming && (
                      <motion.button
                        variants={staggerChild}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { update({ torahPortion: upcomingValue }); autoAdvance(); }}
                        className={`w-full relative p-5 rounded-2xl border-2 text-start transition-all duration-300 backdrop-blur-sm ${
                          data.torahPortion === upcomingValue
                            ? "border-accent bg-accent/10 shadow-lg shadow-accent/15"
                            : "border-accent/40 bg-gradient-to-r from-accent/8 to-transparent hover:border-accent/60 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 text-accent">
                            <PortionIcon name={upcoming.icon} className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-accent font-semibold uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {t.wizard.thisWeeksParsha}
                            </p>
                            <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight mt-1">
                              {upcomingTitle}
                            </p>
                          </div>
                          {data.torahPortion === upcomingValue && (
                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5 text-accent-foreground" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )}

                    <motion.button
                      variants={staggerChild}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setPortionSearch(""); setPortionView("category"); }}
                      className="w-full relative p-5 rounded-2xl border-2 border-border/50 bg-card/60 text-start transition-all duration-300 hover:border-accent/50 hover:shadow-md backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center flex-shrink-0 text-foreground/70">
                          <PortionIcon name="BookOpen" className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">{t.wizard.chooseDifferentStory}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.wizard.chooseDifferentStoryDesc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180 flex-shrink-0" />
                      </div>
                    </motion.button>
                  </>
                )}

                {/* ── LEVEL 2: pick a category ── */}
                {portionView === "category" && (
                  <motion.div variants={staggerChild} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(["torah", "neviim", "ketuvim", "megillot", "holiday", "educational"] as const).map((cat) => {
                      const meta = CATEGORY_META[cat];
                      return (
                        <motion.button
                          key={cat}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setPortionFilter(cat);
                            setPortionSearch("");
                            const books = CATEGORY_BOOKS[cat];
                            if (books && books.length) setExpandedBook(books[0]);
                            setPortionView("stories");
                          }}
                          className="relative p-5 rounded-2xl border-2 border-border/50 bg-card/60 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 backdrop-blur-sm flex flex-col items-center gap-2 text-center"
                        >
                          <span className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><PortionIcon name={meta.icon} className="w-6 h-6" /></span>
                          <span className="font-display text-sm font-semibold text-foreground">{isHe ? meta.labelHe : meta.label}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* ── LEVEL 3: stories within the chosen category ── */}
                {portionView === "stories" && (
                  <>
                    <motion.div variants={staggerChild} className="relative">
                      <Input
                        placeholder={t.wizard.searchParsha}
                        value={portionSearch}
                        onChange={(e) => setPortionSearch(e.target.value)}
                        className="rounded-2xl h-11 text-sm ps-10 bg-card/60 border-border/40 focus:border-accent/50 shadow-sm backdrop-blur-sm"
                      />
                      <Search className="w-4 h-4 text-muted-foreground/50 absolute start-3.5 top-1/2 -translate-y-1/2" />
                    </motion.div>

                    <motion.div variants={staggerChild} className="max-h-[44vh] overflow-y-auto pe-1 scrollbar-thin space-y-2.5">
                      {showAccordion && catBooks!.map((book) => {
                        const bookPortions = TORAH_PORTIONS.filter((p) => p.category === portionFilter && p.book === book);
                        if (bookPortions.length === 0) return null;
                        const isExpanded = expandedBook === book;
                        const seferLabel = BOOK_LABELS[book] || { en: book, he: book };
                        const hasSelected = bookPortions.some((p) => p.value === data.torahPortion);
                        return (
                          <div
                            key={book}
                            className={`rounded-2xl border bg-card/60 backdrop-blur-sm overflow-hidden transition-colors ${
                              isExpanded || hasSelected ? "border-accent/40 shadow-sm" : "border-border/40"
                            }`}
                          >
                            <button
                              onClick={() => setExpandedBook(isExpanded ? null : book)}
                              className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-accent/5 transition-colors"
                            >
                              <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded || hasSelected ? "bg-accent/15 text-accent" : "bg-muted/50 text-foreground/70"}`}><PortionIcon name="Book" className="w-[18px] h-[18px]" /></span>
                              <span className="min-w-0 flex-1 text-start">
                                <span className="font-display text-sm font-semibold text-foreground block leading-tight truncate">{isHe ? seferLabel.he : seferLabel.en}</span>
                                {!isHe && (
                                  <span className="text-muted-foreground/70 text-[11px] font-normal block truncate">{seferLabel.he}</span>
                                )}
                              </span>
                              {hasSelected && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                              <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 flex-shrink-0">{bookPortions.length}</span>
                              <motion.span
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] text-muted-foreground flex-shrink-0"
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
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 pt-1">
                                    {bookPortions.map((p) => renderStoryCard(p, true))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {!showAccordion && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {flatList.map((p) => renderStoryCard(p))}
                          {flatList.length === 0 && (
                            <p className="col-span-full text-center text-sm text-muted-foreground py-8">{t.wizard.noStories}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </motion.div>
              </section>
              );
            })()}


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
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.chooseLanguage}</h2>
                </motion.div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { key: "english", label: t.wizard.english, emoji: "🇺🇸" },
                    { key: "hebrew", label: t.wizard.hebrew, emoji: "🇮🇱" },
                    { key: "yiddish", label: t.wizard.yiddish, emoji: "✡️" },
                  ].map((l) => {
                    const isSelected = selectedLanguages.includes(l.key);
                    return (
                      <motion.button
                        key={l.key}
                        variants={staggerChild}
                        onClick={() => {
                          setSelectedLanguages((prev) => {
                            const next = prev.includes(l.key)
                              ? prev.filter((k) => k !== l.key)
                              : [...prev, l.key];
                            // Sync the legacy single-language field for downstream code
                            if (next.length === 0) update({ language: l.key });
                            else if (next.length === 1) update({ language: next[0] });
                            else update({ language: next.join("+") });
                            return next;
                          });
                        }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className={glassCard(isSelected)}
                      >
                        <div className="p-4 sm:p-5">
                          <span className="text-3xl sm:text-4xl block mb-2">{l.emoji}</span>
                          <span className="text-xs sm:text-sm font-semibold text-foreground">{l.label}</span>
                        </div>
                        {isSelected && (
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

                {/* Bullet-style summary */}
                <motion.ul variants={staggerChild} className="space-y-3 max-w-md mx-auto text-start">
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.character}:</span> <span className="font-semibold">{childNames}</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.age}:</span> <span className="font-semibold">{data.children.map(c => c.age).filter(Boolean).join(" & ") || "—"}</span></span>
                  </li>
                  {planType !== "subscription" && (
                    <li className="flex items-start gap-3 text-base">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.story}:</span> <span className="font-semibold">{getPortionLabel(data.torahPortion) || "—"}</span></span>
                    </li>
                  )}
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.artStyle}:</span> <span className="font-semibold capitalize">{data.artStyle}</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.plan}:</span> <span className="font-semibold">{planType === "subscription" ? (seriesType === "tanach" ? t.wizard.planChoiceTanachTitle : t.wizard.planChoiceSubscriptionTitle) : t.wizard.planSingle}</span></span>
                  </li>
                </motion.ul>


                {/* Single CTA only: the sticky black "Generate" button at the
                    bottom (calls startGeneration). The old in-content button was
                    a confusing duplicate that just advanced the step. */}

                {/* Auth moved to step 10 — anyone can generate; sign-in is asked
                    after the skeletons begin, before book-type + checkout. */}
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
                {!user && !authLoading ? (
                  /* Sign-in / sign-up gate — shown after the skeletons begin,
                     before book-type selection + checkout. */
                  <div className="space-y-6 max-w-md mx-auto">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-accent" />
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.seferBeingCreated}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{t.wizard.signInToContinue}</p>
                    </div>

                    <div className="rounded-2xl border-2 border-accent/20 bg-accent/5 backdrop-blur-sm p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                          <LogIn className="w-5 h-5 text-accent" />
                        </div>
                        <p className="font-display font-semibold text-sm text-foreground">{t.wizard.signInToContinue}</p>
                      </div>

                      {/* Google first — the default sign-in. */}
                      <Button type="button" variant="outline" className="w-full rounded-xl h-11 gap-2 border-border/40 font-semibold bg-background/70 hover:bg-background" onClick={handleWizardGoogleLogin} disabled={loginLoading}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        {t.wizard.continueWithGoogle}
                      </Button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-[10px] text-muted-foreground/60">{t.wizard.or}</span>
                        <div className="flex-1 h-px bg-border/50" />
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
                    </div>
                  </div>
                ) : (
                  <BookOptionsStep options={bookOptions} onChange={setBookOptions} childAge={parseInt(child?.age || "0") || 0} />
                )}
              </motion.div>
            )}

            {/* ── STEP 11: Shipping + Order Summary (combined final step) ── */}
            {step === 11 && (
              <motion.div key="s11" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition} className="space-y-6">
                <div className="text-center pb-2">
                  <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary">
                    {t.checkout.orderSummary}
                  </h2>
                </div>
                {(() => {
                  const unit = calculateBookPriceForCurrency(bookOptions, t.currency.code) * quantity;
                  const friendly = (n: number) => Math.max(0.99, Math.round(n) - 0.01);
                  const sym = t.currency.symbol;
                  const fmt = (n: number) => `${sym}${n.toFixed(2)}`;
                  const opts: Array<{ id: "once" | "weekly" | "monthly" | "yearly"; label: string; price: string; suffix: string; popular?: boolean; note?: string }> = [
                    { id: "once",    label: t.wizard.planSingle,  price: fmt(unit),                       suffix: "one-time" },
                    { id: "weekly",  label: t.wizard.planWeekly,  price: fmt(friendly(unit)),             suffix: "/week" },
                    { id: "monthly", label: t.wizard.planMonthly, price: fmt(friendly(unit * 4 * 0.8)),   suffix: "/month", popular: true },
                    { id: "yearly",  label: t.wizard.planYearly,  price: fmt(friendly(unit * 52 * 0.7)),  suffix: "/year",  note: "2 months free" },
                  ];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {opts.map((o) => {
                        const active = (o.id === "once" && planType === "single") || (o.id !== "once" && planType === "subscription" && selectedPlan === o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              if (o.id === "once") { setPlanType("single"); setSelectedPlan("once"); }
                              else { setPlanType("subscription"); setSelectedPlan(o.id); }
                            }}
                            className={`relative text-start p-4 rounded-2xl border-2 transition-all ${active ? "border-accent bg-accent/10 ring-1 ring-accent/30 shadow-sm" : "border-border/40 bg-card/60 hover:border-accent/40"}`}
                          >
                            {o.popular && (
                              <span className="absolute -top-2.5 end-3 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                            )}
                            <div className="font-display font-bold text-base text-foreground">{o.label}</div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-xl font-bold text-accent">{o.price}</span>
                              <span className="text-xs text-muted-foreground">{o.suffix}</span>
                            </div>
                            {o.note && <div className="text-xs text-accent/80 mt-1">{o.note}</div>}
                            {active && (
                              <span className="absolute top-3 start-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                <Check className="w-3 h-3 text-accent-foreground" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {planType === "subscription" && (() => {
                  const unit = calculateBookPriceForCurrency(bookOptions, t.currency.code) * quantity;
                  const friendly = (n: number) => Math.max(0.99, Math.round(n) - 0.01);
                  const monthlyTotal = friendly(unit * 4 * 0.8);
                  const yearlyTotal = friendly(unit * 52 * 0.7);
                  const sym = t.currency.symbol;
                  const fmt = (n: number) => `${sym}${n.toFixed(2)}`;
                  if (selectedPlan === "monthly") {
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("yearly")}
                        className="w-full rounded-2xl border-2 border-accent/40 bg-gradient-to-r from-accent/10 to-accent/5 p-4 flex items-center justify-between gap-4 hover:border-accent transition-all active:scale-[0.99]"
                      >
                        <div className="text-start">
                          <p className="font-display font-bold text-primary flex flex-wrap items-baseline gap-x-2">
                            <span>Switch to yearly ·</span>
                            <span className="text-muted-foreground line-through font-normal">{fmt(monthlyTotal * 12)}/year</span>
                            <span className="text-accent">{fmt(yearlyTotal)}/year</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Save 2 months free when you go yearly</p>
                        </div>
                        <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-input">
                          <span className="inline-block h-5 w-5 transform rounded-full bg-background shadow translate-x-0.5" />
                        </span>
                      </button>
                    );
                  }
                  if (selectedPlan === "yearly") {
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("monthly")}
                        className="w-full rounded-2xl border-2 border-accent bg-accent/10 p-4 flex items-center justify-between gap-4 transition-all active:scale-[0.99]"
                      >
                        <div className="text-start">
                          <p className="font-display font-bold text-primary">Yearly plan · {fmt(yearlyTotal)}/year · 2 months free</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Tap to switch back to monthly ({fmt(monthlyTotal)}/month)</p>
                        </div>
                        <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-accent">
                          <span className="inline-block h-5 w-5 transform rounded-full bg-background shadow translate-x-[1.375rem]" />
                        </span>
                      </button>
                    );
                  }
                  return null;
                })()}
                {/* No website card/address forms — Shopify's hosted checkout
                    collects payment + shipping, and the orders/paid webhook
                    captures the real address. Go straight to checkout. */}
                <CheckoutStep
                  mode="summary"
                  childName={childNames}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  shipping={shipping}
                  bookOptions={bookOptions}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  onPlaceOrder={(plan) => { void handlePlaceOrder(plan); }}
                  ctaLabel={planType === "subscription" ? t.checkout.subscribeOrderShort : t.checkout.placeOrderShort}
                />
              </motion.div>
            )}

            {/* ── STEP 12: Shipping address (final step before order) ── */}
            {step === 12 && (
              <motion.div key="s12" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition} className="space-y-6">
                <div className="text-center pb-2">
                  <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary">
                    {t.shipping.whereShip}
                  </h2>
                </div>
                <ShippingForm data={shipping} onChange={setShipping} isSubscription={planType === "subscription"} section="shipping" />
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full rounded-xl h-12 text-base"
                  onClick={() => { void handlePlaceOrder(selectedPlan); }}
                >
                  <Sparkles className="w-4 h-4" />
                  {planType === "subscription" ? t.checkout.subscribeOrderShort : t.checkout.placeOrderShort}
                </Button>
              </motion.div>
            )}

            {/* ── STEP 14: Success ── */}
            {step === 14 && (
              <motion.div key="s14" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition}>
                <SuccessStep
                  childName={childNames}
                  orderNumber={orderNumber}
                  onGoToDashboard={() => {
                    localStorage.removeItem("torahtale_wizard_state");
                    localStorage.removeItem("torahtale_pending_order");
                    onClose?.();
                    navigate("/dashboard");
                  }}
                  onCreateAnother={() => {
                    localStorage.removeItem("torahtale_wizard_state");
                    localStorage.removeItem("torahtale_pending_order");
                    resetWizard();
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
          </div>

        </div>

        </div>
      </div>

      {/* ── Sticky bottom action — full-width black pill (Fanvue style) ── */}
      {step !== 9 && step !== 14 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springTransition }}
          className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl"
        >
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-4 sm:py-5">
            {(() => {
              const baseBtn = "w-full h-14 rounded-full font-semibold text-base shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98]";
              if (step <= 7) {
                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={next}
                    disabled={!canNext}
                    className={baseBtn}
                  >
                    {t.common.continue}
                  </motion.button>
                );
              }
              if (step === 8) {
                // Generation is open to everyone now — sign-in is asked at step 10.
                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { void startGeneration(); }}
                    disabled={animating}
                    className={baseBtn}
                  >
                    {t.hero.cta}
                  </motion.button>
                );
              }
              if (step === 10 && user) {
                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={next}
                    disabled={!canNext}
                    className={baseBtn}
                  >
                    {t.common.continue}
                  </motion.button>
                );
              }
              // step 10 while logged out: the inline auth gate has its own buttons.
              return null;
            })()}
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
      sourceBookId={savedBookId}
      bookPriceUsd={(() => {
        const pt = bookOptions.productType;
        const isIls = t.currency.code === "ILS";
        if (pt === "softcover") return isIls ? 55 : 14.99;
        if (pt === "hardcover") return isIls ? 90 : 24.99;
        if (pt === "board") return isIls ? 110 : 29.99;
        if (pt === "coloring") return isIls ? 60 : 16.99;
        return undefined;
      })()}
      bookLabel={
        `${bookOptions.productType === "softcover" ? t.bookOptions.softcover :
        bookOptions.productType === "hardcover" ? t.bookOptions.hardcover :
        bookOptions.productType === "board" ? t.bookOptions.boardBook : ""}${bookOptions.coloringBook ? ` + ${t.bookOptions.coloringBookAddon}` : ""}`
      }
    />

    <ImageCropDialog
      open={!!cropState}
      imageSrc={cropState?.src ?? null}
      fileName={cropState?.fileName ?? "photo.jpg"}
      aspect={1}
      onCancel={() => setCropState(null)}
      onCropped={(file, dataUrl) => {
        if (cropState) updateChild(cropState.childId, { photo: file, photoPreview: dataUrl });
        setCropState(null);
      }}
    />

    <FamilyPhotoDialog
      open={familyDialogOpen}
      onOpenChange={setFamilyDialogOpen}
      t={t}
      onConfirm={handleFamilyPhotoConfirm}
    />
    </>
  );
};
