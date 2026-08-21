import { useState, useCallback, useEffect, useRef, type MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Plus, Minus,
  Users, BookOpen, Package, Check,
  Camera, Sun, User, Type, Calendar, Heart, Image, PenLine,
  ShieldCheck, Lock, Mail, LogIn, BookOpenCheck, Paintbrush, CheckCircle2, RotateCcw,
  ChevronLeft, ChevronRight, Search, Smile, UserRound
} from "lucide-react";
import softcoverThumb from "@/assets/books/thumb-softcover.jpg";
import coloringThumb from "@/assets/books/thumb-coloring.jpg";
import hardcoverThumb from "@/assets/books/thumb-hardcover.jpg";
import boardThumb from "@/assets/books/thumb-board.jpg";
import photoGoodImg from "@/assets/wizard/photo-good.jpg";
import photoBadFacingImg from "@/assets/wizard/photo-bad-facing.jpg";
import photoBadGroupImg from "@/assets/wizard/photo-bad-group.jpg";
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
import { categoryArt } from "@/lib/categoryArt";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import { storyCover } from "@/lib/storyCovers";
import { TORAH_PORTIONS, CATEGORY_BOOKS, BOOK_LABELS, CATEGORY_META, getPortionLabel, getCurrentParsha, stripSeferPrefix, bookLanguageCode, type TorahOption } from "./wizard/TorahPortions";
import { ParshaCountdown } from "./wizard/ParshaCountdown";
import { PortionIcon } from "./wizard/portionIcons";
import { createOrderCheckout, type OrderPlan } from "@/lib/shopify";
import { subPrice, singlePrice, yearlyEquivalentMonthlyCost, formatMoney } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { notifyContactTicket } from "@/lib/contactTickets";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChildren, type ChildRecord } from "@/hooks/useChildren";
import { ImageCropDialog } from "./ImageCropDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FamilyPhotoDialog, type ReviewedPerson } from "./wizard/FamilyPhotoDialog";
import { en } from "@/i18n/en";
import {
  type Collection as CollectionBundle,
  type CollectionFormat,
  COLLECTION_FORMATS,
  collectionBooksLabel,
  collectionName,
  collectionsBookCount,
  collectionsTotal,
  collectionsTotalForFormat,
  formatUpcharge,
} from "@/data/collections";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { generateId } from "@/lib/utils";



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

/** Photos + trim sizes for the three collection cover options, mirroring the
 *  single-book step so the choice looks the same wherever it is made. */
const COLLECTION_FORMAT_THUMBS: Record<CollectionFormat, string> = {
  softcover: softcoverThumb,
  hardcover: hardcoverThumb,
  board: boardThumb,
  coloring: coloringThumb,
};

const COLLECTION_FORMAT_DIMS: Record<CollectionFormat, string> = {
  softcover: "8″ × 8″",
  hardcover: "8″ × 8″",
  board: "6″ × 6″",
  coloring: "8.5″ × 11″",
};

export interface ChildProfile {
  id: string;
  name: string;
  /** Optional Hebrew / Yiddish spellings, carried from a saved child so the book
   *  can star the name in the book's own language (falls back to `name`). */
  name_he?: string | null;
  name_yi?: string | null;
  age: string;
  gender: string;
  photo: File | null;
  photoPreview: string | null;
  /** The un-cropped uploaded image, kept so the user can re-crop/zoom later. */
  photoOriginalSrc?: string | null;
  /** True when the last crop was confirmed without zooming in on the face. */
  photoNeedsCrop?: boolean;
  description: string;
  characterPreview: string | null;
  savedChildId?: string | null;
  existingPhotoUrl?: string | null;
  role?: "tatty" | "mommy" | "child";
}

const createChild = (): ChildProfile => ({
  id: generateId(),
  name: "",
  name_he: null,
  name_yi: null,
  age: "",
  gender: "",
  photo: null,
  photoPreview: null,
  photoOriginalSrc: null,
  photoNeedsCrop: false,
  description: "",
  characterPreview: null,
  savedChildId: null,
  existingPhotoUrl: null,
  role: "child",
});

/**
 * A parent on the book. Kept in its own array rather than as a ChildProfile with
 * a role flag, so a parent can never be swept into the star cast by code that
 * iterates `children` - they are stars of nothing, and appear on exactly one
 * page at the very end.
 */
export interface ParentProfile {
  id: string;
  role: "tatty" | "mommy";
  name: string;
  photo: File | null;
  photoPreview: string | null;
  photoOriginalSrc?: string | null;
  description: string;
}

const createParent = (role: "tatty" | "mommy"): ParentProfile => ({
  id: generateId(), role, name: "", photo: null, photoPreview: null, description: "",
});

interface WizardData {
  children: ChildProfile[];
  /** Optional - at most one tatty and one mommy. */
  parents: ParentProfile[];
  torahPortion: string;
  artStyle: string;
  narrativeStyle: "story" | "comic";
  language: string;
  pageCount: number;
  activeChildIdx: number;
}

const initialData: WizardData = {
  children: [createChild()],
  parents: [],
  torahPortion: "",
  artStyle: "3d-pixar",
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
  const parsed = parseInt(age);
  const n = Number.isNaN(parsed) ? 5 : parsed; // age 0 is valid - don't default it to 5
  if (n <= 3) return "2-3";
  if (n <= 5) return "4-5";
  if (n <= 7) return "6-7";
  if (n <= 9) return "8-9";
  return "10-12";
};

/* ───────────────── constants ───────────────── */

/**
 * Which plan the summary pre-selects when the customer kept the upcoming parsha.
 * Monthly is the plan the UI already badges "popular", and it costs less per book
 * than paying weekly - so it is the fair one to open on rather than the priciest.
 */
const DEFAULT_PARSHA_PLAN = "monthly" as const;

/**
 * How many children one book can star. Above CAST_ALL_UPTO (4) the pages are
 * cast individually - see supabase/functions/_shared/casting.ts - so a page
 * never exceeds the image model's 4 reference attachments however big the
 * family is. The limit here is a product choice, not a technical ceiling.
 */
const MAX_CHILDREN = 8;

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

/* ── (generation phase icons are constructed inside the component) ── */

/* ───────────────── component ───────────────── */

interface Props {
  /** Optional - when omitted, the wizard renders as a full page (no close affordance). */
  open?: boolean;
  onClose?: () => void;
  /** Collection-request mode: skips story selection + payment; the request is
      sent to the admin inbox and invoicing/generation are handled manually. */
  collection?: CollectionBundle;
  /** The full bundle when several collections were selected together. */
  collections?: CollectionBundle[];
  /** Filled with a function that writes the live wizard state to storage and
      reports whether it landed, so the page's "Save & exit" dialog can save on
      demand instead of trusting that the autosave got there. */
  saveStateRef?: MutableRefObject<(() => boolean) | null>;
}

export const CreationWizard = ({ open = true, onClose, collection, collections, saveStateRef }: Props) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, lang, dir: textDir } = useLanguage();
  const { children: existingChildren, addChild: addChildMutation, updateChild: updateChildRecord } = useChildren();

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
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);
  const [collectionSent, setCollectionSent] = useState(false);
  /* Which cover the collection gets printed in. Listed collection prices are the
     softcover ones, so the request step has to let this be chosen and re-price
     before anything is sent - otherwise we quote softcover and hand-invoice
     something else. */
  const [collectionFormat, setCollectionFormat] = useState<CollectionFormat>("softcover");

  // Keep story pageCount in sync with the chosen book format
  // (board=10, softcover=20, hardcover=24, coloring=24)
  useEffect(() => {
    const target = getStoryPageCount(bookOptions);
    setData((d) => (d.pageCount === target ? d : { ...d, pageCount: target }));
  }, [bookOptions]);

  // The book row is created at the step-9 login gate - one step BEFORE the
  // product-type picker (step 10) - so it's inserted with the DEFAULT softcover
  // options. Once the row exists, keep its stored bookOptions/pageCount in sync
  // when the user actually picks a type; otherwise story_data (what the admin
  // generation modal + downstream generation read) stays stuck on softcover.
  useEffect(() => {
    if (!user || !savedBookId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: row } = await supabase
          .from("books")
          .select("story_data, shipping_data")
          .eq("id", savedBookId)
          .maybeSingle();
        if (cancelled || !row) return;
        const sd = (row.story_data as any) || {};
        const shp = (row.shipping_data as any) || {};
        if (sd.bookOptions?.productType === bookOptions.productType && sd.pageCount === data.pageCount) return;
        await supabase
          .from("books")
          .update({
            story_data: { ...sd, bookOptions, pageCount: data.pageCount },
            shipping_data: { ...shp, bookOptions },
          } as any)
          .eq("id", savedBookId);
      } catch (e) {
        console.warn("Failed to sync book options to the saved book:", e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, savedBookId, bookOptions, data.pageCount]);


  
  const [portionFilter, setPortionFilter] = useState<TorahOption["category"]>("torah");
  const [portionSearch, setPortionSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>("Bereishit");
  // Step-6 drill-down: "mode" (parsha vs. different story) → "category" → "stories"
  const [portionView, setPortionView] = useState<"mode" | "category" | "stories">("mode");
  const [styleSubStep, setStyleSubStep] = useState<"art" | "format">("art");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [bookOptionsChosenEarly, setBookOptionsChosenEarly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | "yearly" | "once">("once");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // Same-name-but-different-age/gender children found on the user's account when
  // a returning guest signs in - the user decides merge vs. add-new per child.
  const [pendingConflicts, setPendingConflicts] = useState<
    Array<{ childId: string; incoming: { name: string; age: string; gender: string }; candidate: ChildRecord }>
  >([]);
  // Resolved conflict decisions, keyed by wizard child id: "new" | "merge:<existingId>".
  const mergeDecisionsRef = useRef<Map<string, string>>(new Map());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginFullName, setLoginFullName] = useState("");
  const [loginMode, setLoginMode] = useState<"login" | "signup">("signup");
  const [loginLoading, setLoginLoading] = useState(false);
  // Email-signup confirmation gate: set to the address we sent the Supabase
  // confirmation link to. While set, the auth card shows "check your email"
  // instead of the sign-in/sign-up form.
  const [confirmEmailPendingFor, setConfirmEmailPendingFor] = useState<string | null>(null);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const justSubscribedRef = useRef(false);
  
  // Generation animation state
  const [animating, setAnimating] = useState(false);
  const [animPhaseIdx, setAnimPhaseIdx] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  const persistingBookRef = useRef(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stacked-step scrolling - each section uses a stable DOM id
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
  // Only the active step is rendered. It must NOT claim a viewport height of
  // its own: the scroll region it sits in is already exactly one viewport minus
  // the header and the action bar, and its wrapper centres a short step. A
  // `min-h-[calc(100vh-...)]` here was taller than that region on every step, so
  // every question scrolled by a few rem and opened with dead space above it.
  const sectionClass = useCallback((_n: number) => {
    return "relative scroll-mt-24 flex items-center justify-center py-2 sm:py-4";
  }, []);

  const child = data.children[data.activeChildIdx] || data.children[0];

  /* The customer's REAL cover, generated in the background the moment both
     halves of it exist - the child's photo and the chosen story - so it is
     already on screen by the time they reach the summary. See useCoverPreview. */
  const coverPreview = useCoverPreview({
    referenceImage: data.children[0]?.photoPreview || null,
    childName: data.children.map((c) => c.name).filter(Boolean).join(" & "),
    age: data.children[0]?.age,
    torahPortion: data.torahPortion,
    artStyle: data.artStyle,
    childRefs: data.children
      .filter((c) => c.name)
      .map((c) => ({ name: c.name, age: c.age, gender: c.gender, photoUrl: c.photoPreview })),
    enabled: !collection,
  });

  /** A saved dashboard child as a wizard ChildProfile - used by the "Pick saved
      kids" chips and by the ?child=<id> deep link, so both stay identical. */
  const profileFromRecord = useCallback((k: ChildRecord): ChildProfile => ({
    ...createChild(),
    name: k.name,
    name_he: k.name_he ?? null,
    name_yi: k.name_yi ?? null,
    age: k.age ? String(k.age) : "",
    gender: k.gender || "",
    photoPreview: k.photo_url || null,
    existingPhotoUrl: k.photo_url || null,
    description: k.description || "",
    savedChildId: k.id,
  }), []);

  /* "Create a book" on a dashboard kid card links to /create?child=<id>. Land
     with that child already chosen instead of an empty name field. Runs once,
     after the saved children load, and never fights a restored session that
     already has children in it. */
  const preselectedChildId = new URLSearchParams(window.location.search).get("child");
  const preselectAppliedRef = useRef(false);
  useEffect(() => {
    if (preselectAppliedRef.current || !preselectedChildId || !existingChildren.length) return;
    const record = existingChildren.find((k) => k.id === preselectedChildId);
    if (!record) return;
    preselectAppliedRef.current = true;
    setData((prev) => {
      if (prev.children.some((c) => c.savedChildId === record.id)) return prev;
      const onlyEmptyStarter =
        prev.children.length === 1 && !prev.children[0].name && !prev.children[0].savedChildId;
      const entry = profileFromRecord(record);
      const children = onlyEmptyStarter ? [entry] : [...prev.children, entry];
      return { ...prev, children, activeChildIdx: children.length - 1 };
    });
  }, [preselectedChildId, existingChildren, profileFromRecord]);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateChild = useCallback((id: string, partial: Partial<ChildProfile>) => {
    setData((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
  }, []);

  // The child's name in the BOOK's own language - so a Hebrew book stars "ארי",
  // a Yiddish book its Yiddish spelling, etc. (falls back to the base name).
  const nameForBook = (c: ChildProfile): string => {
    const code = bookLanguageCode(data.language);
    if (code === "he") return c.name_he?.trim() || c.name;
    if (code === "yi") return c.name_yi?.trim() || c.name;
    return c.name;
  };

  const childNames = data.children.map((c) => nameForBook(c)).filter(Boolean).join(" & ") || "your child";

  // Tracks whether we just restored from localStorage so the step-change
  // auto-scroll effect doesn't override the restored scroll position on mount.
  const skipNextStepScrollRef = useRef(false);
  const didRestoreRef = useRef(false);

  // Save wizard state continuously so user can resume after refresh/close/login.
  // We store the active section anchor (step number) rather than a raw scrollY
  // pixel offset, because anchors stay valid across layout changes.
  const saveWizardState = useCallback((): boolean => {
    // A cropped phone photo is a multi-megabyte base64 string, and two children
    // put the payload over the ~5MB localStorage quota. That threw, the throw
    // was swallowed, and NOTHING was saved - the wizard promised the progress
    // was kept and then came back empty. So: try it with the previews, and if
    // storage refuses, drop the previews and save everything else. A photo can
    // be re-picked; a whole answered wizard cannot.
    const build = (withPreviews: boolean) => {
      const stripPreview = (src: string | null | undefined) =>
        withPreviews || !src?.startsWith("data:") ? src ?? null : null;
      return {
        step,
        planType,
        selectedPlan,
        bookOptionsChosenEarly,
        savedBookId,
        data: {
          ...data,
          // Can't serialize File; also drop the large un-cropped original, which
          // is the single biggest thing in the payload (photoPreview is enough).
          children: data.children.map((c) => ({
            ...c, photo: null, photoOriginalSrc: null,
            photoPreview: stripPreview(c.photoPreview),
          })),
          parents: data.parents.map((pr) => ({
            ...pr, photo: null, photoOriginalSrc: null,
            photoPreview: stripPreview(pr.photoPreview),
          })),
        },
        shipping,
        bookOptions,
        portionFilter,
        quantity,
        activeSectionId: `wizard-step-${step}`,
      };
    };
    const write = (payload: unknown) => {
      try {
        localStorage.setItem("torahtale_wizard_state", JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    };
    return write(build(true)) || write(build(false));
  }, [step, planType, selectedPlan, bookOptionsChosenEarly, savedBookId, data, shipping, bookOptions, portionFilter, quantity]);

  // Hand the saver to the page, which owns the "Leave story creation?" dialog.
  useEffect(() => {
    if (!saveStateRef) return;
    saveStateRef.current = saveWizardState;
    return () => { saveStateRef.current = null; };
  }, [saveStateRef, saveWizardState]);

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
        if (["once", "weekly", "monthly", "yearly"].includes(parsed.selectedPlan)) {
          setSelectedPlan(parsed.selectedPlan);
          planTouchedRef.current = true; // don't overwrite what they last chose
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
        // Style selection was removed - every book is 3D Pixar now.
        restoredData.artStyle = "3d-pixar";
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
    } else if (step === 4 && data.children.length > 0 && data.children.every((c) => !!c.savedChildId && !!c.existingPhotoUrl)) {
      setStep(dir >= 0 ? 5 : 3);
    }
  }, [step, dir, data.children]);

  const autoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      setDir(1);
      setStep((s) => {
        const nextStep = s + 1;
        return Math.min(nextStep, TOTAL_STEPS);
      });
    }, 350);
  }, []);

  // Entering the story step always starts at the first drill-down level.
  useEffect(() => {
    if (step === 5) setPortionView("mode");
  }, [step]);

  // Collection-request mode: the bundle already defines the stories, so the
  // story-selection step is skipped in both directions.
  useEffect(() => {
    if (collection && step === 5) setStep(dir >= 0 ? 6 : 7);
  }, [collection, step, dir]);

  /* ───── login prompt during step 8 auth gate ───── */

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    if (showLoginPrompt) setShowLoginPrompt(false);
    setConfirmEmailPendingFor(null); // confirmed + signed in - drop the check-email panel

    // The login/sign-up gate now lives at step 10 (after the generation skeletons
    // begin). When the user signs in there - inline OR returning from an OAuth
    // redirect - create the pending book and let the flow continue to book-type
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
    if (!error) { toast.success("Welcome back!"); return; }
    // Signing in before clicking the confirmation link (or after it expired):
    // pop the check-your-email panel so they can resend instead of a dead end.
    const unconfirmed = (error as { code?: string }).code === "email_not_confirmed" || /not confirmed/i.test(error.message);
    if (unconfirmed) {
      setConfirmEmailPendingFor(loginEmail);
      toast.error(t.wizard.emailNotConfirmed);
    } else {
      toast.error(error.message);
    }
  };

  const handleWizardSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    saveWizardState(); // keep their progress even if sign-up fails
    setLoginLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
      options: { data: { full_name: loginFullName }, emailRedirectTo: `${window.location.origin}/create` },
    });
    setLoginLoading(false);
    if (error) { toast.error(error.message); return; }
    // Supabase obfuscates already-registered emails: it "succeeds" but returns a
    // user with no identities. Steer them to sign in instead of a false success.
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setLoginMode("login");
      toast.info(t.wizard.emailAlreadyRegistered);
      return;
    }
    if (signUpData.session) {
      // Email confirmation is disabled - they're signed in right away.
      toast.success(t.wizard.accountCreated);
    } else {
      // Confirmation required: swap the auth card for the "check your email"
      // panel. The link in the email brings them back to /create, where the
      // wizard restores and continues to the book step.
      setConfirmEmailPendingFor(loginEmail);
      setLoginMode("login");
    }
  };

  const handleResendConfirmEmail = async () => {
    if (!confirmEmailPendingFor) return;
    setLoginLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmEmailPendingFor,
      options: { emailRedirectTo: `${window.location.origin}/create` },
    });
    setLoginLoading(false);
    if (error) toast.error(error.message); else toast.success(t.wizard.confirmEmailResent);
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

  // Shown in place of the sign-in/sign-up form (step-10 gate AND the login
  // dialog) after an email signup that needs confirmation.
  const checkEmailPanel = confirmEmailPendingFor ? (
    <div className="rounded-2xl border-2 border-accent/20 bg-accent/5 backdrop-blur-sm p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7 text-accent" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground">{t.wizard.confirmEmailTitle}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t.wizard.confirmEmailBody}{" "}
        <span className="font-semibold text-foreground" dir="ltr">{confirmEmailPendingFor}</span>.
        <br />
        {t.wizard.confirmEmailHint}
      </p>
      <div className="space-y-2 pt-1">
        <Button type="button" variant="outline" className="w-full rounded-xl h-10 border-border/40 bg-background/70 hover:bg-background" onClick={handleResendConfirmEmail} disabled={loginLoading}>
          {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.wizard.confirmEmailResend}
        </Button>
        <button type="button" onClick={() => setConfirmEmailPendingFor(null)} className="text-xs text-accent font-medium hover:underline">
          {t.wizard.confirmEmailDone}
        </button>
      </div>
    </div>
  ) : null;

  const [cropState, setCropState] = useState<{ childId: string; src: string; fileName: string } | null>(null);
  /** The parent currently being added/edited in the parent sheet (null = closed). */
  const [addingParent, setAddingParent] = useState<ParentProfile | null>(null);
  const [parentCrop, setParentCrop] = useState<{ src: string; fileName: string } | null>(null);
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);

  const handleFamilyPhotoConfirm = (people: ReviewedPerson[]) => {
    const newChildren: ChildProfile[] = people.map((p) => ({
      id: generateId(),
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
  // Requires a signed-in user. Safe to call once - bails if a book already exists.
  // Called from startGeneration (when already signed in) and from the post-auth
  // effect (when the user signs in at the step-10 gate, after generation began).
  const persistGeneratedBook = async () => {
    // NOTE: we do NOT bail when savedBookId is already set. A returning user's
    // book id may have been adopted from a PRIOR awaiting-payment book (the
    // self-heal effect), which carries that book's OLD portion/child/format. We
    // must re-sync ALL fields to the CURRENT wizard selections, else the wrong
    // story gets generated (e.g. picked Sukkos but the stale book was Purim).
    if (!user || persistingBookRef.current) return;
    persistingBookRef.current = true;
    try {
        const portionLabel = getPortionLabel(data.torahPortion);
        const childrenInfo = data.children.map((c) => `${nameForBook(c)} (${c.age} years old, ${c.gender})`).join(", ");

        // ── Reconcile against the user's existing saved children ──
        // A returning user often re-enters a child they already have (e.g. they
        // started as a guest, then signed in at place-order). Match by name:
        //   • same name + same age + same gender  → same kid → merge/update it
        //   • same name, different age/gender      → ask (merge or add new)
        //   • no match                             → add as a new child
        const norm = (s?: string | null) => (s || "").trim().toLowerCase();
        const { data: existingRows } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", user.id);
        const existingList: ChildRecord[] = (existingRows as ChildRecord[]) || [];

        // targetId per wizard child: an existing child id to merge into, or null = insert new.
        const plan = new Map<string, string | null>();
        const conflicts: Array<{ childId: string; incoming: { name: string; age: string; gender: string }; candidate: ChildRecord }> = [];
        for (const c of data.children) {
          if (c.savedChildId) { plan.set(c.id, null); continue; } // already a chosen saved profile
          if (!c.name) { plan.set(c.id, null); continue; }
          const matches = existingList.filter((e) => norm(e.name) === norm(c.name));
          if (matches.length === 0) { plan.set(c.id, null); continue; }
          const age = Number.isNaN(parseInt(c.age)) ? null : parseInt(c.age); // 0 is a valid age
          const exact = matches.find((e) => e.age === age && norm(e.gender) === norm(c.gender));
          if (exact) { plan.set(c.id, exact.id); continue; } // same name+age+gender → auto-merge
          const decided = mergeDecisionsRef.current.get(c.id);
          if (decided === "new") { plan.set(c.id, null); continue; }
          if (decided?.startsWith("merge:")) { plan.set(c.id, decided.slice(6)); continue; }
          conflicts.push({ childId: c.id, incoming: { name: c.name, age: c.age, gender: c.gender }, candidate: matches[0] });
        }

        // Unresolved conflicts → let the user decide, then this runs again.
        if (conflicts.length > 0) {
          setPendingConflicts(conflicts);
          persistingBookRef.current = false;
          return;
        }

        // Upload child photos to storage, merge/insert child records, collect URLs.
        const childDescriptions = await Promise.all(
          data.children.map(async (c) => {
            const targetId = plan.get(c.id) ?? null;
            let photoUrl: string | null = c.existingPhotoUrl ?? null;
            let uploadedNew = false;
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
                uploadedNew = !!photoUrl;
              }
            }

            if (targetId) {
              // MERGE into the existing child: update age/gender/description (and
              // the photo only if a new one was provided - never erase a good
              // saved photo). Reuse the saved photo for book generation if the
              // guest didn't upload a new one.
              const match = existingList.find((e) => e.id === targetId);
              if (!photoUrl) photoUrl = match?.photo_url ?? null;
              const upd: Partial<Omit<ChildRecord, "id" | "user_id" | "created_at">> = {
                age: Number.isNaN(parseInt(c.age)) ? null : parseInt(c.age),
                gender: c.gender || match?.gender || null,
                description: c.description || match?.description || null,
                art_style: data.artStyle,
              };
              if (uploadedNew) upd.photo_url = photoUrl;
              try {
                await updateChildRecord.mutateAsync({ id: targetId, ...upd });
                updateChild(c.id, { savedChildId: targetId }); // link book/subscription to it
              } catch (e) {
                console.warn("Failed to merge into existing child:", e);
              }
            } else if (!c.savedChildId && c.name && c.age && c.gender) {
              // No existing match → save as a new reusable character (unchanged
              // from the original flow).
              try {
                await addChildMutation.mutateAsync({
                  name: c.name,
                  age: Number.isNaN(parseInt(c.age)) ? null : parseInt(c.age),
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
              name: nameForBook(c),
              age: c.age,
              gender: c.gender,
              description: c.description,
              hasPhoto: !!c.photoPreview || !!photoUrl,
              photoUrl,
            };
          })
        );

        /* Parents: upload the face and record name + role. They are NOT saved to
           the children table and never enter childDescriptions - the pipeline
           reads them from their own key and puts them on one page at the end. */
        const parentDescriptions = await Promise.all(
          data.parents.filter((pr) => !!pr.photoPreview).map(async (pr) => {
            let photoUrl: string | null = null;
            if (pr.photo) {
              const filePath = `${user.id}/parent-${pr.id}-${Date.now()}.jpg`;
              const { error: upErr } = await supabase.storage
                .from("child-photos").upload(filePath, pr.photo, { upsert: true });
              if (!upErr) {
                const { data: signed } = await supabase.storage
                  .from("child-photos").createSignedUrl(filePath, 60 * 60 * 24 * 365);
                photoUrl = signed?.signedUrl || null;
              }
            }
            const fallback = pr.role === "tatty"
              ? (lang === "he" ? "אבא" : lang === "yi" ? "טאַטע" : "Tatty")
              : (lang === "he" ? "אמא" : lang === "yi" ? "מאַמע" : "Mommy");
            return { name: (pr.name || "").trim() || fallback, role: pr.role, description: pr.description || "", photoUrl };
          })
        );

        // The current wizard selections - written on both insert and re-sync so a
        // reused (adopted) book can never keep a stale portion/child/format.
        const fields = {
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
            parents: parentDescriptions,
          },
        };

        if (savedBookId) {
          // Re-sync the already-linked book to the CURRENT selections. Merge onto
          // the existing story_data so any pre-generation resume fields survive,
          // but the recipe (portion/child/format) always reflects this order.
          const { data: existing } = await supabase
            .from("books").select("story_data").eq("id", savedBookId).maybeSingle();
          const prevSd = (existing?.story_data as any) || {};
          const { error: updErr } = await supabase
            .from("books")
            .update({ ...fields, story_data: { ...prevSd, ...fields.story_data } } as any)
            .eq("id", savedBookId);
          if (updErr) {
            console.error("Book re-sync failed:", updErr);
            toast.error("We couldn't save your book. Please try again.");
          }
        } else {
          const { data: bookData, error: saveError } = await supabase
            .from("books")
            .insert({ user_id: user.id, ...fields } as any)
            .select()
            .single();
          if (saveError || !bookData) {
            // Surface a save failure instead of silently proceeding with no order -
            // otherwise the book never reaches the admin and it looks "stuck".
            console.error("Book insert failed:", saveError);
            toast.error("We couldn't save your book. Please try again.");
          } else {
            setSavedBookId(bookData.id);
          }
        }
    } catch (err) {
      console.error("Failed to save book:", err);
      toast.error("We couldn't save your book. Please try again.");
    } finally {
      persistingBookRef.current = false;
    }
  };

  // Record the user's choice for one name-conflict child, then - once every
  // conflict is decided - resume persisting the book.
  const resolveConflict = (childId: string, decision: string) => {
    mergeDecisionsRef.current.set(childId, decision);
    setPendingConflicts((prev) => {
      const next = prev.filter((c) => c.childId !== childId);
      if (next.length === 0) setTimeout(() => { void persistGeneratedBook(); }, 0);
      return next;
    });
  };

  // Collection-request mode: no story generation and no checkout - upload the
  // child photos so the admin can see them, then file the request as a contact
  // ticket. Invoicing and book generation happen manually after review.
  const submitCollectionRequest = async () => {
    if (!collection || collectionSubmitting || collectionSent) return;
    if (!user) {
      toast.info(t.collectionRequest.signInToRequest);
      return;
    }
    setCollectionSubmitting(true);
    try {
      const childLines = await Promise.all(
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
              photoUrl = signed?.signedUrl || photoUrl;
            }
          }
          const genderLabel = c.gender === "boy" ? t.wizard.boy : c.gender === "girl" ? t.wizard.girl : c.gender;
          return `- ${c.name || "?"} (${t.collectionRequest.childAge(c.age || "?")}, ${genderLabel || "?"})${photoUrl ? `\n  ${t.collectionRequest.photoLabel}: ${photoUrl}` : ""}`;
        })
      );
      const requesterName =
        (user.user_metadata?.full_name as string | undefined) || user.email || "Torah Tale user";
      // Quote the invoice off the SAME numbers the customer was shown on the
      // request step - listed prices are softcover, so the chosen cover's
      // per-book upcharge has to travel with the request.
      const bundle = collections?.length ? collections : [collection];
      const bundleKeys = bundle.map((c) => c.key);
      const bundleBooks = collectionsBookCount(bundleKeys);
      const upUsd = formatUpcharge(collectionFormat, false);
      const upIls = formatUpcharge(collectionFormat, true);
      /* This message is not admin-only: contact-notify quotes it back to the
         CUSTOMER under "Here's what you sent us". So it names each collection
         the way the customer saw it, keeping the English alongside when they
         differ so the inbox can still match it to the catalogue - and the
         closing line is written to read correctly to both of them. */
      const coverLabel: Record<CollectionFormat, string> = {
        softcover: t.bookOptions.softcover,
        hardcover: t.bookOptions.hardcover,
        board: t.bookOptions.boardBook,
        coloring: t.productsShowcase.coloring,
      };
      const bothNames = (localized: string, english: string) =>
        localized === english ? english : `${localized} / ${english}`;
      const message =
        `Collection purchase request:\n${bundle
          .map((c) => `- ${bothNames(collectionName(c, lang), c.name)} (${c.books}, ~$${c.priceUsd} / ₪${c.priceIls} softcover)`).join("\n")}\n` +
        `Cover: ${bothNames(coverLabel[collectionFormat], en.bookOptions[collectionFormat === "board" ? "boardBook" : collectionFormat])}` +
        `${upUsd ? ` (+$${upUsd} / ₪${upIls} per book × ${bundleBooks} books = +$${upUsd * bundleBooks} / ₪${upIls * bundleBooks})` : " (listed price)"}\n` +
        `Bundle total as quoted: ~$${collectionsTotalForFormat(bundleKeys, false, collectionFormat)} / ₪${collectionsTotalForFormat(bundleKeys, true, collectionFormat)}\n` +
        `Language: ${data.language}\n` +
        `${t.collectionRequest.childrenLabel}:\n${childLines.join("\n")}\n\n` +
        `We'll review this request and email an invoice; the books are then generated by hand, one at a time, once payment arrives.`;
      const { data: ticket, error } = await supabase.from("contact_tickets").insert({
        name: requesterName,
        email: user.email ?? "",
        subject: "collection",
        message,
      }).select("id").maybeSingle();
      if (error) throw error;
      // Same acknowledgement + support alert as the contact page.
      if (ticket?.id) notifyContactTicket(ticket.id);
      try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
      setCollectionSent(true);
      toast.success(t.collectionRequest.sentToast);
    } catch (err) {
      console.error("Failed to send collection request:", err);
      toast.error(t.collectionRequest.errorToast);
    } finally {
      setCollectionSubmitting(false);
    }
  };

  const startGeneration = async () => {
    // No confirm screen and no long generation animation: the book's artwork is
    // produced server-side after payment, so we go straight to book selection.
    setDir(1);
    setAnimating(true);
    // Persist immediately if already signed in; otherwise the post-auth effect
    // creates the book once the user signs in at the step-10 gate.
    if (user) await persistGeneratedBook();
    setAnimating(false);
    setStep(10);
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
    // Language (step 6) is the last question. Collection requests still get a
    // review-and-send screen (step 8); the regular flow skips the confirm screen
    // AND the generation-skeleton animation and goes straight to book selection.
    if (step === 6) {
      if (collection) { setDir(1); setStep(8); return; }
      if (animating) return;
      await startGeneration();
      return;
    }
    if (step === 8) {
      // Only collection-request mode reaches step 8 now: submit the request.
      if (collection) {
        await submitCollectionRequest();
        return;
      }
      if (animating) return;
      await startGeneration();
      return;
    }

    setDir(1);
    let nextStep = step + 1;
    // After the per-child details (photo is the last), pause on the dedicated
    // "add another child?" step (7) before moving to the shared story step (5).
    if (step === 4) nextStep = 7;
    if (step === 7) nextStep = 5;
    if (step === 1 && allChildrenHaveGenderAge()) {
      // Saved children already have gender/age - skip those steps; skip the photo
      // step too when every child already has a stored photo.
      nextStep = allChildrenHavePhotoOrDesc() ? 5 : 4;
    }
    // Step 11 (payment + summary) - the "Continue" CTA inside the step advances directly to step 12 (shipping),
    // and step 12's own Place Order button calls handlePlaceOrder which jumps to the success step.
    if (step === 11) {
      nextStep = 12;
    }
    setStep(Math.min(nextStep, TOTAL_STEPS));
  };

  const back = () => {
    if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
    // Within the Torah-portion step, "back" walks the drill-down up one level before leaving the step.
    if (step === 5 && portionView === "stories") { setPortionView("category"); return; }
    if (step === 5 && portionView === "category") { setPortionView("mode"); return; }
    setDir(-1);
    let prevStep = step - 1;
    // Saved-child skips (gender/age/photo) are handled by the auto-skip effect,
    // which cascades backward when dir < 0, so plain step-1 is correct here.
    // The "add another child?" step (7) sits between photo (4) and story (5).
    if (step === 5) prevStep = 7;
    if (step === 7) prevStep = 4;
    if (step === 8) prevStep = 6; // art-style step removed
    if (step === 10) prevStep = 6; // confirm + generation-skeleton steps removed
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

  // Drives the spinner on the action-bar checkout button (step 11). The button
  // lives in the sticky bar, not in CheckoutStep, so the state lives here too.
  const [placingOrder, setPlacingOrder] = useState(false);

  // Keeping the upcoming parsha IS the subscription intent - that customer wants
  // the weekly cycle, not one book. So the summary opens on a plan for them, and
  // one-time stays one tap away. Picking any other story leaves the default at a
  // single purchase, because nothing about a Yom Tov book implies a weekly drip.
  // Applied at most once, and never over a choice the customer already made or a
  // plan restored from a previous session.
  const planTouchedRef = useRef(false);
  const parshaPlanDefaultedRef = useRef(false);

  useEffect(() => {
    if (step !== 11) return;
    if (planTouchedRef.current || parshaPlanDefaultedRef.current) return;
    if (!data.torahPortion || data.torahPortion !== getCurrentParsha()) return;
    parshaPlanDefaultedRef.current = true;
    setPlanType("subscription");
    setSelectedPlan(DEFAULT_PARSHA_PLAN);
  }, [step, data.torahPortion]);

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
        toast.error("Your book isn't ready yet - please try again in a moment.");
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
      // child's likeness - not just their name.
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
          art_style: data.artStyle || "3d-pixar",
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
      case 3: return !!child.age && parseInt(child.age) >= 0 && parseInt(child.age) <= 15;
      // Photo step: every child needs an uploaded photo.
      case 4: return data.children.every((c) =>
        !!c.photoPreview || !!c.existingPhotoUrl);
      case 5: return !!data.torahPortion;
      case 6: return selectedLanguages.length >= 1;
      case 7: return true; // "add another child?" - Continue always allowed
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
  // Keep in step with the header's mainSteps - the bar was hitting 100% at the
  // book-options step, so the last two screens looked like the end of the flow.
  const WIZARD_STEPS = [0, 1, 2, 3, 4, 7, 5, 6, 8, 10, 11];
  const progressPercent = (() => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx >= 0) return ((idx + 1) / WIZARD_STEPS.length) * 100;
    if (step === 9) return ((WIZARD_STEPS.indexOf(8) + 1) / WIZARD_STEPS.length) * 100;
    return 0;
  })();

  /* ───── character preview ───── */

  const getPreviewImage = (): string | null => {
    if (child.characterPreview) return child.characterPreview;
    const gender = child.gender || "";
    const age = child.age || "";
    const style = data.artStyle || "3d-pixar";
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
      case 4: return Image;
      case 5: return BookOpen;
      case 6: return Sun;
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
    <div className="wizard-glass h-screen h-[100dvh] w-full flex flex-col relative overflow-hidden bg-background">
      {/* ── Clean minimal top bar - back · step title + dots · close ── */}
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
          10: t.wizard.createYourBook,
          11: t.wizard.createYourBook,
        };
        // Steps 10 (book options) and 11 (shipping + summary) are real steps the
        // customer can go back from - they were falling outside the header gate,
        // so those screens rendered with no back arrow, no progress and no close.
        const mainSteps = WIZARD_STEPS;
        const currentIdx = mainSteps.indexOf(step);
        // Step 9 is the generation animation, which auto-advances - no chrome.
        const showHeader = step !== 9 && mainSteps.includes(step);
        if (!showHeader) return null;
        const stepProgress = ((currentIdx + 1) / mainSteps.length) * 100;
        return (
          <div className="shrink-0 z-30 bg-background/90 backdrop-blur-xl">
            {/* Slim progress bar - fills step-by-step toward a finished book */}
            <div className="h-1 w-full bg-foreground/10" role="progressbar" aria-valuenow={Math.round(stepProgress)} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                className="h-full rounded-e-full bg-accent"
                initial={false}
                animate={{ width: `${Math.max(6, stepProgress)}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
            </div>
            <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 sm:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
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

      {/* ── Main content area ──────────────────────────────────────────────────
       * The wizard owns exactly one viewport: header and action bar are fixed
       * flex children and this region takes whatever is left. It scrolls ONLY
       * inside itself, and `justify-center` on a min-h-full inner wrapper means
       * a short step sits centred rather than hugging the top with dead space
       * under it - which is what made the steps feel half-empty. A step taller
       * than the space still scrolls, but the chrome stays put.
       */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-1 sm:py-3.5 min-h-full flex flex-col justify-center">
          <h1 className="sr-only">{t.wizard.createYourBook}</h1>

        <div>
          {/* Multi-child pills (steps 2-8) */}
          {step >= 2 && step <= 8 && step !== 7 && data.children.length > 1 && (
            <motion.div variants={staggerChild} initial="enter" animate="center" className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {data.children.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => update({ activeChildIdx: idx })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 flex-shrink-0 text-xs font-medium border-accent text-accent ${
                    idx === data.activeChildIdx
                      ? "bg-accent/15 ring-2 ring-accent/35 shadow-sm"
                      : "bg-accent/5 hover:bg-accent/10"
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
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
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
                                  // Toggle off - remove this saved kid
                                  const next = prev.children.filter((_, i) => i !== idx);
                                  const remaining = next.length ? next : [createChild()];
                                  return {
                                    ...prev,
                                    children: remaining,
                                    activeChildIdx: Math.min(prev.activeChildIdx, remaining.length - 1),
                                  };
                                }
                                // Toggle on - add this saved kid
                                const newEntry: ChildProfile = profileFromRecord(k);
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
                    // The field only ever holds a name being TYPED. Picking saved
                    // kids above adds them as their own entries and leaves this
                    // box empty - mirroring the last pick in here read as "this
                    // is the child" when several were selected.
                    const typedIdx = data.children.findIndex((c) => !c.savedChildId);
                    const typedName = typedIdx >= 0 ? data.children[typedIdx].name : "";

                    const setTypedName = (value: string) => {
                      setData((prev) => {
                        const idx = prev.children.findIndex((c) => !c.savedChildId);
                        if (idx >= 0) {
                          // Clearing the box drops the empty entry, so saved kids
                          // are not followed by a nameless "Child 2" later on.
                          if (!value.trim() && prev.children.length > 1) {
                            const children = prev.children.filter((_, i) => i !== idx);
                            return { ...prev, children, activeChildIdx: children.length - 1 };
                          }
                          const children = prev.children.map((c, i) =>
                            i === idx ? { ...c, name: value, savedChildId: null, existingPhotoUrl: null } : c);
                          return { ...prev, children, activeChildIdx: idx };
                        }
                        if (!value.trim()) return prev;
                        const children = [...prev.children, { ...createChild(), name: value }];
                        return { ...prev, children, activeChildIdx: children.length - 1 };
                      });
                    };

                    return (
                      <Input
                        placeholder={t.wizard.enterChildName}
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && typedName.trim().length >= 1) {
                            e.preventDefault();
                            autoAdvance();
                          }
                        }}
                        onBlur={() => {
                          if (typedName.trim().length >= 1 && step === 1) autoAdvance();
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
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
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
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.howOld(child.name, child.gender)}
                  </h2>
                </motion.div>

                <motion.div variants={staggerChild} dir="ltr" className="flex items-center justify-center gap-4">
                  {/* minus (left) */}
                  <button
                    type="button"
                    aria-label="Decrease age"
                    disabled={!child.age || (parseInt(child.age) || 0) <= 0}
                    onClick={() => {
                      const cur = parseInt(child.age) || 1;
                      updateChild(child.id, { age: String(Math.max(0, cur - 1)) });
                    }}
                    className="w-16 h-16 rounded-2xl border-2 border-border/40 bg-card/60 backdrop-blur-sm flex items-center justify-center text-accent hover:border-accent/50 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Minus className="w-7 h-7" />
                  </button>
                  {/* age value */}
                  <div className="w-24 h-20 rounded-2xl border-2 border-border/40 bg-card/60 backdrop-blur-sm flex items-center justify-center text-4xl font-bold text-foreground">
                    {child.age || <span className="text-muted-foreground/30 text-2xl">age</span>}
                  </div>
                  {/* plus (right) */}
                  <button
                    type="button"
                    aria-label="Increase age"
                    disabled={(parseInt(child.age) || 0) >= 15}
                    onClick={() => {
                      const cur = parseInt(child.age) || 0;
                      updateChild(child.id, { age: String(Math.min(15, cur + 1)) });
                    }}
                    className="w-16 h-16 rounded-2xl border-2 border-border/40 bg-card/60 backdrop-blur-sm flex items-center justify-center text-accent hover:border-accent/50 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                </motion.div>

              </motion.div>
              </section>
            )}

            {/* ── STEP 7: Art Style (shown after Language, right before Review/Generate;
                    block kept here in the file - only one step renders at a time) ── */}
            {/* ── STEP 4: Photo / Description ── */}
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
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.helpDraw(child.name)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{t.wizard.photoUploadHint}</p>
                </motion.div>

                <div className="max-w-md mx-auto space-y-4">
                  {/* What works best guide */}
                  <motion.div variants={staggerChild} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4">
                    <p className="font-display font-semibold text-xs text-foreground mb-3 text-center">{t.wizard.photoGuideTitle}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {/* GOOD */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-accent/10">
                          <img src={photoGoodImg} alt="" loading="lazy" className="w-full h-full object-cover" />
                          <span className="absolute top-1 end-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-card">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        </div>
                        <span className="text-[11px] leading-tight text-center text-muted-foreground">{t.wizard.photoGood}</span>
                      </div>
                      {/* BAD - facing away */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-accent/10">
                          <img src={photoBadFacingImg} alt="" loading="lazy" className="w-full h-full object-cover" />
                          <span className="absolute top-1 end-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-card">
                            <X className="w-3 h-3 text-white" />
                          </span>
                        </div>
                        <span className="text-[11px] leading-tight text-center text-muted-foreground">{t.wizard.photoBadFacing}</span>
                      </div>
                      {/* BAD - group */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-accent/10">
                          <img src={photoBadGroupImg} alt="" loading="lazy" className="w-full h-full object-cover" />
                          <span className="absolute top-1 end-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-card">
                            <X className="w-3 h-3 text-white" />
                          </span>
                        </div>
                        <span className="text-[11px] leading-tight text-center text-muted-foreground">{t.wizard.photoBadGroup}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Option 1 - upload a photo */}
                  <motion.div variants={staggerChild} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center"><Camera className="w-4 h-4 text-accent" /></div>
                      <p className="font-display font-semibold text-sm text-foreground">{t.wizard.uploadPhoto}</p>
                    </div>
                    {child.photoPreview ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto max-w-xs aspect-square rounded-2xl overflow-hidden border-2 border-accent/40">
                          <img src={child.photoPreview} alt={child.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateChild(child.id, { photo: null, photoPreview: null, photoOriginalSrc: null, photoNeedsCrop: false })}
                            className="absolute top-2 end-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-semibold text-foreground hover:bg-background transition"
                          >
                            {t.wizard.remove}
                          </button>
                        </div>

                        {/* Nudge to re-crop when they didn't zoom in on the face. */}
                        {child.photoNeedsCrop && (
                          <div className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5">
                            <Search className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-foreground/80 leading-snug">{t.wizard.photoZoomTip}</p>
                          </div>
                        )}

                        {(child.photoOriginalSrc || child.photoPreview) && (
                          <Button
                            type="button"
                            variant={child.photoNeedsCrop ? "gold" : "outline"}
                            size="sm"
                            onClick={() => setCropState({
                              childId: child.id,
                              src: child.photoOriginalSrc || child.photoPreview!,
                              fileName: "photo.jpg",
                            })}
                            className="w-full rounded-xl h-10"
                          >
                            <Search className="w-4 h-4" /> {t.wizard.photoAdjust}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <label className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/30 bg-gradient-to-b from-accent/5 to-transparent p-8 cursor-pointer hover:border-accent/60 hover:from-accent/10 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:scale-105 transition-transform"><Camera className="w-6 h-6 text-accent" /></div>
                        <span className="text-sm font-medium text-foreground">{t.wizard.uploadPhoto}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(child.id, e)} />
                      </label>
                    )}
                  </motion.div>
                </div>
              </motion.div>
              </section>
            )}

            {/* ── STEP 7: Add another child? (its own dedicated screen, shown
                 only once the first child's details are fully entered) ── */}
            {step === 7 && (
              <motion.div
                key="s7"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-6 max-w-md mx-auto"
              >
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                    {t.wizard.addAnotherTitle}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t.wizard.addAnotherDesc}</p>
                </div>

                {/* Children added so far */}
                <div className="flex flex-wrap justify-center gap-2">
                  {data.children.filter((c) => c.name.trim()).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-full border-2 border-accent bg-accent/10 text-accent">
                      {c.photoPreview ? (
                        <img src={c.photoPreview} alt={c.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>

                {/* Parents added so far - shown apart from the kids, because they
                    are not stars of the book: they appear once, at the end. */}
                {data.parents.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {data.parents.map((pr) => (
                      <div key={pr.id} className="flex items-center gap-2 rounded-full border-2 border-border/40 bg-muted/40 px-3 py-2">
                        {pr.photoPreview ? (
                          <img src={pr.photoPreview} alt={pr.name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {(pr.name || (pr.role === "tatty" ? t.wizard.parents.tatty : t.wizard.parents.mommy)).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {pr.name || (pr.role === "tatty" ? t.wizard.parents.tatty : t.wizard.parents.mommy)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setData((prev) => ({ ...prev, parents: prev.parents.filter((x) => x.id !== pr.id) }))}
                          aria-label={t.common.delete}
                          className="ms-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {data.children.length < MAX_CHILDREN && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newChild = createChild();
                        setData((prev) => ({
                          ...prev,
                          children: [...prev.children, newChild],
                          activeChildIdx: prev.children.length,
                        }));
                        setDir(1);
                        setStep(1);
                      }}
                      className="w-full border-dashed border-2 border-border/50 rounded-2xl h-12 text-foreground hover:border-accent/40 hover:bg-accent/5"
                    >
                      <Plus className="w-4 h-4" /> {t.wizard.addAnotherChild}
                    </Button>
                  )}

                  {/* A separate door for parents. They do NOT join the children
                      array and never become story stars. */}
                  {data.parents.length < 2 && (
                    <Button
                      variant="outline"
                      onClick={() => setAddingParent(createParent(
                        data.parents.some((pr) => pr.role === "tatty") ? "mommy" : "tatty",
                      ))}
                      className="w-full border-dashed border-2 border-border/50 rounded-2xl h-12 text-foreground hover:border-accent/40 hover:bg-accent/5"
                    >
                      <Plus className="w-4 h-4" /> {t.wizard.parents.addParent}
                    </Button>
                  )}
                  <p className="px-1 text-center text-[11px] leading-snug text-muted-foreground">
                    {t.wizard.parents.hint}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Torah Portion (simplified, single screen) ── */}
            {step === 5 && (() => {
              const isHe = lang === "he" || lang === "yi";
              const upcomingValue = getCurrentParsha();
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
              // `short` strips the "Sefer X - " prefix (used inside a sefer accordion,
              // where the header already names the sefer).
              const renderStoryCard = (p: TorahOption, short = false) => {
                const selected = data.torahPortion === p.value;
                // This story's own cover when it exists; otherwise the category's
                // sample title page, so the grid is never missing an image while
                // the per-story set is being filled in.
                const art = storyCover(p.value) || categoryArt(p.category);
                const title = isHe ? p.sub : p.label;
                const subtitle = isHe ? p.label : p.sub;
                return (
                  <motion.button
                    key={p.value}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { update({ torahPortion: p.value }); autoAdvance(); }}
                    className={`group relative flex flex-col items-stretch gap-2 p-2.5 rounded-2xl border text-start transition-all duration-200 ${
                      selected
                        ? "border-accent bg-accent/10 shadow-md shadow-accent/15 ring-1 ring-accent/40"
                        : "border-border/40 bg-card/70 hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm backdrop-blur-sm"
                    }`}
                  >
                    <span className={`relative block w-full aspect-square rounded-xl overflow-hidden shrink-0 transition-all ${selected ? "ring-2 ring-accent shadow-md" : "ring-1 ring-border/50 shadow-sm group-hover:ring-accent/40"}`}>
                      {art ? (
                        <img src={art} alt="" aria-hidden="true" width={400} height={400} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center bg-muted/40">
                          <PortionIcon name={p.icon} className="w-6 h-6 text-foreground/60" />
                        </span>
                      )}
                    </span>
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
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
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
                            <div className="mt-1.5">
                              <ParshaCountdown label={t.wizard.orderWithin} trailingText={t.wizard.forDeliveryBeforeShabbos} />
                            </div>
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
                          <span className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-border/50 flex items-center justify-center">
                            {categoryArt(cat) ? (
                              <img src={categoryArt(cat)} alt="" aria-hidden="true" width={256} height={256} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <PortionIcon name={meta.icon} className="w-6 h-6 text-accent" />
                            )}
                          </span>
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

                    <motion.div variants={staggerChild} className="flex-1 min-h-[200px] overflow-y-auto pe-1 scrollbar-thin space-y-2.5">
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


            {/* ── STEP 6: Language ── */}
            {step === 6 && (
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
                className="space-y-6 max-w-sm mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.chooseLanguage}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t.wizard.chooseLanguageSubtitle}</p>
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
                            let next: string[];
                            if (prev.includes(l.key)) {
                              next = prev.filter((k) => k !== l.key);
                            } else if (prev.length >= 2) {
                              // Cap at 2 selected at once - bump the oldest pick
                              // to make room for the new one.
                              next = [...prev.slice(1), l.key];
                            } else {
                              next = [...prev, l.key];
                            }
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
                className="space-y-5 max-w-md mx-auto"
              >
                <motion.div variants={staggerChild} className="text-center">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{collection ? t.collectionRequest.readyTitle : t.wizard.readyToCreate}</h2>
                </motion.div>

                {/* Bullet-style summary. A collection request has nothing to
                    confirm here that the customer did not just pick - the cover
                    is the only open question, so the recap is dropped for it. */}
                {!collection && (
                <motion.ul variants={staggerChild} className="space-y-3 max-w-md mx-auto text-start">
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.character}:</span> <span className="font-semibold">{childNames}</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.age}:</span> <span className="font-semibold">{data.children.map(c => c.age).filter(Boolean).join(" & ") || "-"}</span></span>
                  </li>
                  {planType !== "subscription" && (
                    <li className="flex items-start gap-3 text-base">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.story}:</span> <span className="font-semibold">{getPortionLabel(data.torahPortion) || "-"}</span></span>
                    </li>
                  )}
                  <li className="flex items-start gap-3 text-base">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground"><span className="text-muted-foreground">{t.wizard.plan}:</span> <span className="font-semibold">{planType === "subscription" ? (seriesType === "tanach" ? t.wizard.planChoiceTanachTitle : t.wizard.planChoiceSubscriptionTitle) : t.wizard.planSingle}</span></span>
                  </li>
                </motion.ul>
                )}

                {/* Cover + price. The collection prices quoted on /pricing are the
                    SOFTCOVER ones, so the request cannot be sent until a cover is
                    chosen and the bundle re-priced - otherwise the customer agrees
                    to one number and the hand-written invoice says another. */}
                {collection && (() => {
                  const isIls = t.currency.code === "ILS";
                  const sym = t.currency.symbol;
                  const bundle = collections?.length ? collections : [collection];
                  const keys = bundle.map((c) => c.key);
                  const books = collectionsBookCount(keys);
                  const perBook = formatUpcharge(collectionFormat, isIls);
                  const upcharge = perBook * books;
                  const total = collectionsTotalForFormat(keys, isIls, collectionFormat);
                  const money = (n: number) => formatMoney(Math.round(n), sym, 0);
                  const LABEL: Record<CollectionFormat, string> = {
                    softcover: t.bookOptions.softcover,
                    hardcover: t.bookOptions.hardcover,
                    board: t.bookOptions.boardBook,
                    coloring: t.productsShowcase.coloring,
                  };
                  const TAGLINE: Record<CollectionFormat, string> = {
                    softcover: t.bookOptions.softcoverTagline,
                    hardcover: t.bookOptions.hardcoverTagline,
                    board: t.bookOptions.boardTagline,
                    coloring: t.productsShowcase.coloringTagline,
                  };
                  return (
                    <motion.div
                      variants={staggerChild}
                      className="mx-auto max-w-md space-y-3.5 rounded-2xl border border-border/60 bg-card/60 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.collectionRequest.chooseCover}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.collectionRequest.chooseCoverNote}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                          {COLLECTION_FORMATS.map((f) => {
                            const on = collectionFormat === f;
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setCollectionFormat(f)}
                                aria-pressed={on}
                                className={`flex items-center gap-3.5 rounded-2xl border-2 p-2.5 text-start transition-all duration-300 active:scale-[0.99] ${
                                  on ? "border-accent bg-accent/5 ring-1 ring-accent/20" : "border-border/60 hover:border-accent/40"
                                }`}
                              >
                                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                                  <img
                                    src={COLLECTION_FORMAT_THUMBS[f]}
                                    alt={LABEL[f]}
                                    width={320}
                                    height={320}
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                    style={textDir === "rtl" ? { transform: "scaleX(-1)" } : undefined}
                                  />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-display text-base font-bold text-primary">{LABEL[f]}</span>
                                  <span className="mt-0.5 block text-xs leading-tight text-muted-foreground">{TAGLINE[f]}</span>
                                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{COLLECTION_FORMAT_DIMS[f]}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-border/60 pt-3 text-sm">
                        {/* What is in the bundle - but NOT its price. The
                            estimated total below is the only figure needed, and
                            for a softcover order the two were the same number
                            printed twice. */}
                        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
                          <span>{t.collectionRequest.bundleLine(bundle.length, books)}</span>
                        </div>
                        {upcharge > 0 && (
                          <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
                            <span>{t.collectionRequest.upchargeLine(LABEL[collectionFormat], books, money(perBook))}</span>
                            <span>+{money(upcharge)}</span>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-3 pt-1.5 text-foreground">
                          <span className="font-semibold">{t.collectionRequest.estimatedTotal}</span>
                          <span className="font-heading text-2xl font-bold">{money(total)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {collection && (
                  <motion.p variants={staggerChild} className="text-xs text-muted-foreground text-center leading-snug">
                    {t.collectionRequest.noPaymentNow}
                  </motion.p>
                )}


                {/* Single CTA only: the sticky black "Generate" button at the
                    bottom (calls startGeneration). The old in-content button was
                    a confusing duplicate that just advanced the step. */}

                {/* Auth moved to step 10 - anyone can generate; sign-in is asked
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
                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{t.wizard.seferBeingCreated}</h2>
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

            {/* ── STEP 11: Shipping + Order Summary (combined final step) ── */}
            {step === 11 && (
              <motion.div key="s11" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition} className="space-y-2.5 w-full">
                <div className="text-center">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
                    {t.checkout.orderSummary}
                  </h2>
                </div>
                {/* ONE card: how you pay, the billing period, the book, the
                    total. They were separate panels stacked together, which read
                    as four things to check rather than one order. */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {(() => {
                  const isIls = t.currency.code === "ILS";
                  const unit = calculateBookPriceForCurrency(bookOptions, t.currency.code) * quantity;
                  const sym = t.currency.symbol;
                  const fmt = (n: number) => formatMoney(n, sym);
                  // Subscription prices come straight from the canonical Shopify
                  // table (per plan × book format) so what's shown equals what's
                  // charged at checkout.
                  // Two ways to buy: this book once, or the monthly plan. Weekly
                  // and the year bundle are no longer cards - yearly is reached
                  // from the savings toggle below, which only appears once the
                  // customer is actually on a plan.
                  // Yearly is a billing period of the same plan, not a card of its
                  // own, so the one subscription card mirrors whichever period is
                  // active. Otherwise switching to yearly left no card highlighted
                  // and the summary looked like nothing was selected.
                  const onYearly = selectedPlan === "yearly";
                  const opts: Array<{ id: "once" | "monthly"; label: string; price: string; suffix: string; popular?: boolean }> = [
                    { id: "once",    label: t.wizard.planSingle,  price: fmt(unit), suffix: t.checkout.oneTime },
                    {
                      id: "monthly",
                      label: onYearly ? t.wizard.planYearly : t.wizard.planMonthly,
                      price: fmt(subPrice(onYearly ? "yearly" : "monthly", bookOptions.productType, isIls)),
                      suffix: onYearly ? t.checkout.perYear : t.checkout.perMonth,
                      popular: true,
                    },
                  ];
                  return (
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {opts.map((o) => {
                        const active = o.id === "once" ? planType === "single" : planType === "subscription";
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              planTouchedRef.current = true;
                              if (o.id === "once") { setPlanType("single"); setSelectedPlan("once"); }
                              else { setPlanType("subscription"); setSelectedPlan(onYearly ? "yearly" : "monthly"); }
                            }}
                            className={`relative text-start px-2.5 py-1.5 rounded-2xl border-2 transition-all ${active ? "border-accent bg-accent/10 ring-1 ring-accent/30 shadow-sm" : "border-border/40 bg-card/60 hover:border-accent/40"}`}
                          >
                            {o.popular && (
                              <span className="absolute -top-2.5 start-3 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{t.checkout.popular}</span>
                            )}
                            {/* Selected check sits in the END corner so it never
                                overlaps the (start-aligned) title in RTL or LTR. */}
                            {active && (
                              <span className="absolute top-2.5 end-2.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center shadow-sm">
                                <Check className="w-2.5 h-2.5 text-accent-foreground" />
                              </span>
                            )}
                            <div className="font-display font-bold text-sm text-foreground pe-6">{o.label}</div>
                            <div className="mt-0.5 flex items-baseline gap-1 flex-wrap">
                              <span className="text-lg font-bold text-accent">{o.price}</span>
                              <span className="text-[11px] text-muted-foreground">{o.suffix}</span>
                            </div>
                            {o.id === "monthly" && active && (
                              <div className="text-[11px] leading-snug text-accent/80">{t.checkout.fourBooksMonth}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {/* A subscription always drips the UPCOMING WEEKLY PARSHA - one
                    book per Monday, whatever plan pays for it (the frequency is
                    the billing period, not the delivery cadence). The story
                    chosen here is only book one. When that story is not the
                    parsha, say so plainly: the card above reads e.g. "Tisha B'Av
                    · $19.44/wk", which otherwise implies a weekly Tisha B'Av. */}
                {planType === "subscription" && data.torahPortion !== getCurrentParsha() && (
                  <p className="-mt-1.5 flex items-start gap-1.5 px-1 text-[11px] leading-snug text-muted-foreground">
                    <Sparkles className="mt-px h-3 w-3 shrink-0 text-accent" />
                    <span>{t.checkout.subDripNote}</span>
                  </p>
                )}
                {/* Billing period - a segmented control in the brand's own
                    shapes (pill, accent fill, display face) rather than an OS
                    switch, and only once the customer is on a plan. */}
                {planType === "subscription" && (() => {
                  const isIls = t.currency.code === "ILS";
                  const fmtType = bookOptions.productType;
                  const monthlyTotal = subPrice("monthly", fmtType, isIls);
                  const yearlyTotal = subPrice("yearly", fmtType, isIls);
                  const sym = t.currency.symbol;
                  const fmt = (n: number) => formatMoney(n, sym);
                  // Like for like: the bundle's 52 books cost thirteen monthly
                  // charges (4 books each), not twelve. The saving is computed,
                  // never asserted, so it disappears by itself if the prices ever
                  // stop favouring the bundle.
                  const saving = yearlyEquivalentMonthlyCost(fmtType, isIls) - yearlyTotal;
                  const periods: Array<{ id: "monthly" | "yearly"; label: string }> = [
                    { id: "monthly", label: t.wizard.planMonthly },
                    { id: "yearly",  label: t.wizard.planYearly },
                  ];
                  return (
                    <div className="border-t border-border px-3 pb-3 pt-2.5">
                      <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
                        {periods.map((p) => {
                          const on = selectedPlan === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { planTouchedRef.current = true; setSelectedPlan(p.id); }}
                              aria-pressed={on}
                              className={`flex-1 rounded-full px-3 py-1.5 text-center transition-all ${
                                on ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span className="font-display text-xs font-bold">{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {saving > 0 && (
                        <p className="mt-1.5 text-center text-[10px] text-accent">
                          {t.checkout.saveAmount(fmt(saving))}
                        </p>
                      )}
                    </div>
                  );
                })()}
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
                  quantity={quantity}
                  coverPreview={coverPreview}
                  hideCta
                />
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{t.checkout.secureCheckout}</span>
                </div>

                <p className="px-1 text-[10px] leading-tight text-muted-foreground">
                  {t.checkout.disclaimer}
                </p>

              </motion.div>
            )}

            {/* ── STEP 12: Shipping address (final step before order) ── */}
            {step === 12 && (
              <motion.div key="s12" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={springTransition} className="space-y-6">
                <div className="text-center pb-2">
                  <h2 className="font-heading text-4xl sm:text-5xl font-bold text-primary">
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
                  onSubscribe={() => {
                    localStorage.removeItem("torahtale_wizard_state");
                    localStorage.removeItem("torahtale_pending_order");
                    onClose?.();
                    navigate("/dashboard?tab=subs");
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
          </div>

        </div>

        </div>
      </div>

      {/* ── Collection request sent - confirmation takes over the wizard ── */}
      {collectionSent && collection && (
        <div className="fixed inset-0 z-40 bg-background flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={springTransition}
            className="max-w-md text-center space-y-4"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{t.collectionRequest.sentTitle}</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t.collectionRequest.sentBody(collectionName(collection, lang), user?.email || "")}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate("/")}>{t.collectionRequest.backHome}</Button>
              <Button variant="gold" className="rounded-xl" onClick={() => navigate("/dashboard")}>{t.collectionRequest.goToDashboard}</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Sticky bottom action - full-width black pill (Fanvue style) ── */}
      {step !== 9 && step !== 14 && !collectionSent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springTransition }}
          className="shrink-0 w-full z-30 bg-background/95 backdrop-blur-xl border-t border-border/40"
        >
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {(() => {
              const baseBtn = "w-full h-14 rounded-full font-semibold text-base shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98]";
              if (step <= 7) {
                // On the last question (language, step 6) "Continue" also saves the
                // book (uploads the child photo + inserts the order), which takes a
                // moment - show a spinner so it never looks frozen/"stuck".
                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={next}
                    disabled={!canNext || animating}
                    className={baseBtn}
                  >
                    {animating ? <Loader2 className="w-5 h-5 animate-spin" /> : t.common.continue}
                  </motion.button>
                );
              }
              if (step === 8) {
                // Collection-request mode: submit the request instead of generating.
                if (collection) {
                  return (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { void submitCollectionRequest(); }}
                      disabled={collectionSubmitting}
                      className={baseBtn}
                    >
                      {collectionSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t.collectionRequest.submit}
                    </motion.button>
                  );
                }
                // Generation is open to everyone now - sign-in is asked at step 10.
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
              if (step === 11) {
                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (placingOrder) return;
                      setPlacingOrder(true);
                      void handlePlaceOrder(selectedPlan).finally(() => setPlacingOrder(false));
                    }}
                    disabled={placingOrder}
                    className={`${baseBtn} !bg-accent !text-accent-foreground hover:!bg-accent/90`}
                  >
                    {placingOrder ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {planType === "subscription" ? t.checkout.subscribeOrderShort : t.checkout.placeOrderShort}
                      </>
                    )}
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
        // Subscribed - continue past the book-options step into shipping/checkout.
        setDir(1);
        setStep(11);
      }}
      context="limit-reached"
      sourceBookId={savedBookId}
      productType={bookOptions.productType}
      isIls={t.currency.code === "ILS"}
      bookPriceUsd={singlePrice(bookOptions.productType, t.currency.code === "ILS")}
      bookLabel={
        `${bookOptions.productType === "softcover" ? t.bookOptions.softcover :
        bookOptions.productType === "hardcover" ? t.bookOptions.hardcover :
        bookOptions.productType === "board" ? t.bookOptions.boardBook : ""}${bookOptions.coloringBook ? ` + ${t.bookOptions.coloringBookAddon}` : ""}`
      }
    />

    {/* ── Add a parent ─────────────────────────────────────────────────────
     * Deliberately a small, separate sheet rather than a step in the child
     * flow: a parent needs only a name and a face, no age or reading level,
     * and must never be mistaken for one of the stars. */}
    <Dialog open={!!addingParent} onOpenChange={(o) => { if (!o) { setAddingParent(null); setParentCrop(null); } }}>
      <DialogContent className="max-w-md rounded-3xl border-border/50 bg-card p-6" dir={lang === "en" ? "ltr" : "rtl"}>
        {addingParent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 text-accent ring-1 ring-accent/20">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary">{t.wizard.parents.addParent}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.wizard.parents.hint}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["tatty", "mommy"] as const).map((r) => {
                const taken = data.parents.some((pr) => pr.role === r);
                const on = addingParent.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={taken}
                    onClick={() => setAddingParent({ ...addingParent, role: r })}
                    className={`rounded-xl border-2 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
                      on ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground hover:border-accent/40"
                    }`}
                  >
                    {r === "tatty" ? t.wizard.parents.tatty : t.wizard.parents.mommy}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <label className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 transition hover:border-accent/60">
                {addingParent.photoPreview ? (
                  <img src={addingParent.photoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-accent">
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] font-medium">{t.wizard.parents.photo}</span>
                  </span>
                )}
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (!f) return;
                    const rd = new FileReader();
                    rd.onloadend = () => setParentCrop({ src: rd.result as string, fileName: f.name });
                    rd.readAsDataURL(f);
                  }}
                />
              </label>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.wizard.parents.name}</Label>
                <Input
                  value={addingParent.name}
                  onChange={(e) => setAddingParent({ ...addingParent, name: e.target.value })}
                  placeholder={addingParent.role === "tatty" ? t.wizard.parents.tatty : t.wizard.parents.mommy}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="gold"
                className="h-11 w-full rounded-full"
                disabled={!addingParent.photoPreview}
                onClick={() => {
                  setData((prev) => ({ ...prev, parents: [...prev.parents, addingParent] }));
                  setAddingParent(null);
                }}
              >
                {t.wizard.parents.save}
              </Button>
              <Button variant="outline" className="h-10 w-full rounded-full border-border/60" onClick={() => setAddingParent(null)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ImageCropDialog
      open={!!parentCrop}
      imageSrc={parentCrop?.src ?? null}
      fileName={parentCrop?.fileName ?? "photo.jpg"}
      aspect={1}
      onCancel={() => setParentCrop(null)}
      onCropped={(file, dataUrl) => {
        setAddingParent((prev) => (prev ? { ...prev, photo: file, photoPreview: dataUrl, photoOriginalSrc: parentCrop?.src ?? null } : prev));
        setParentCrop(null);
      }}
    />

    <ImageCropDialog
      open={!!cropState}
      imageSrc={cropState?.src ?? null}
      fileName={cropState?.fileName ?? "photo.jpg"}
      aspect={1}
      onCancel={() => setCropState(null)}
      onCropped={(file, dataUrl, zoomed) => {
        if (cropState) updateChild(cropState.childId, {
          photo: file,
          photoPreview: dataUrl,
          photoOriginalSrc: cropState.src,
          // If they didn't zoom in on the face, flag it so we can offer a re-crop.
          photoNeedsCrop: !zoomed,
        });
        setCropState(null);
      }}
    />

    <FamilyPhotoDialog
      open={familyDialogOpen}
      onOpenChange={setFamilyDialogOpen}
      t={t}
      onConfirm={handleFamilyPhotoConfirm}
    />

    {/* Same-name child conflict: existing kid on the account has a different age
        or gender than what was just entered. Ask per child: merge or add new. */}
    <Dialog
      open={pendingConflicts.length > 0}
      onOpenChange={(open) => {
        // Dismissing without choosing defaults to the safe, non-destructive
        // option: add each undecided child as a new, separate profile.
        if (!open && pendingConflicts.length > 0) {
          pendingConflicts.forEach((c) => mergeDecisionsRef.current.set(c.childId, "new"));
          setPendingConflicts([]);
          setTimeout(() => { void persistGeneratedBook(); }, 0);
        }
      }}
    >
      <DialogContent className="max-w-md rounded-3xl p-6">
        <div className="space-y-4">
          <div>
            <p className="font-display font-semibold text-base text-foreground">
              {lang === "he" ? "האם זה אותו ילד?" : lang === "yi" ? "איז דאס דער זעלבער קינד?" : "Is this the same child?"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "he"
                ? "כבר יש לכם ילד בשם הזה עם פרטים שונים. למזג ולעדכן, או להוסיף כילד נוסף?"
                : lang === "yi"
                ? "איר האט שוין א קינד מיט דעם נאמען מיט אנדערע פרטים. צונויפגיסן און דערהײַנטיקן, אדער צולייגן ווי א נײַער קינד?"
                : "You already have a child with this name but different details. Merge and update, or add as a separate child?"}
            </p>
          </div>
          {pendingConflicts.map((conf) => (
            <div key={conf.childId} className="rounded-2xl border border-border/50 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-muted/40 p-2">
                  <p className="font-semibold text-foreground mb-0.5">
                    {lang === "he" ? "קיים" : lang === "yi" ? "עקזיסטירט" : "On your account"}
                  </p>
                  <p className="text-muted-foreground">
                    {conf.candidate.name}
                    {conf.candidate.age != null ? ` · ${conf.candidate.age}` : ""}
                    {conf.candidate.gender ? ` · ${conf.candidate.gender}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <p className="font-semibold text-foreground mb-0.5">
                    {lang === "he" ? "חדש" : lang === "yi" ? "נײַ" : "Just entered"}
                  </p>
                  <p className="text-muted-foreground">
                    {conf.incoming.name}
                    {conf.incoming.age ? ` · ${conf.incoming.age}` : ""}
                    {conf.incoming.gender ? ` · ${conf.incoming.gender}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" className="flex-1 rounded-xl h-9 text-xs" onClick={() => resolveConflict(conf.childId, `merge:${conf.candidate.id}`)}>
                  {lang === "he" ? "אותו ילד - מזג" : lang === "yi" ? "זעלבער קינד - צונויפגיסן" : "Same child - merge"}
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl h-9 text-xs border-border/50" onClick={() => resolveConflict(conf.childId, "new")}>
                  {lang === "he" ? "הוסף כילד נוסף" : lang === "yi" ? "צולייגן ווי נײַער קינד" : "Add as new child"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>

    </>
  );
};
