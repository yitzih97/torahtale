import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Upload, Loader2, Sparkles, Plus, Trash2,
  Users, BookOpen, Palette, Package, CreditCard, Check,
  Camera, Sun, User, Type, Calendar, Heart, Image, PenLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SparkleEffect } from "./SparkleEffect";
import { BookViewer, type BookPage } from "./wizard/BookViewer";
import { ShippingForm, DEFAULT_SHIPPING, type ShippingData } from "./wizard/ShippingForm";
import { CheckoutStep } from "./wizard/CheckoutStep";
import { SuccessStep } from "./wizard/SuccessStep";
import { TORAH_PORTIONS, getPortionLabel } from "./wizard/TorahPortions";
import { supabase } from "@/integrations/supabase/client";
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
  pageCount: 4,
  activeChildIdx: 0,
};

/* ───────────────── preset lookup helpers ───────────────── */

/** Get the right preset image based on gender + art style */
const getStylePreset = (gender: string, style: string): string => {
  const map: Record<string, Record<string, string>> = {
    boy: { cartoon: presetBoyCartoon, "3d-pixar": presetBoy3dPixar, realistic: presetBoyRealistic },
    girl: { cartoon: presetGirlCartoon, "3d-pixar": presetGirl3dPixar, realistic: presetGirlRealistic },
  };
  return map[gender]?.[style] || presetBoyCartoon;
};

/** Get the right preset image based on gender + age bracket */
const getAgePreset = (gender: string, ageLabel: string): string => {
  const g = gender || "boy";
  const map: Record<string, Record<string, string>> = {
    boy: { "2-3": presetToddlerBoy, "4-5": presetPreschoolBoy, "6-7": presetBoyCartoon, "8-9": presetExplorerBoy, "10-12": presetPreteenBoy },
    girl: { "2-3": presetToddlerGirl, "4-5": presetPreschoolGirl, "6-7": presetGirlCartoon, "8-9": presetExplorerGirl, "10-12": presetPreteenGirl },
  };
  return map[g]?.[ageLabel] || (g === "girl" ? presetGirlCartoon : presetBoyCartoon);
};

/** Find the age bracket label for a numeric age */
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
const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const STEP_GROUPS = [
  { label: "Character", icon: Users, steps: [1, 2, 3, 4, 5] },
  { label: "Story", icon: BookOpen, steps: [6, 7, 8] },
  { label: "Create", icon: Sparkles, steps: [9, 10] },
  { label: "Order", icon: Package, steps: [11, 12, 13] },
];

const AGE_BRACKETS = [
  { min: 2, max: 3, label: "2-3", desc: "Toddler", emoji: "👶" },
  { min: 4, max: 5, label: "4-5", desc: "Preschool", emoji: "🧒" },
  { min: 6, max: 7, label: "6-7", desc: "Early Reader", emoji: "📖" },
  { min: 8, max: 9, label: "8-9", desc: "Explorer", emoji: "🔍" },
  { min: 10, max: 12, label: "10-12", desc: "Preteen", emoji: "🌟" },
];

const ART_STYLES = [
  { key: "cartoon", label: "Cartoon", desc: "Colorful & whimsical" },
  { key: "3d-pixar", label: "3D Pixar", desc: "Cinematic & polished" },
  { key: "realistic", label: "Realistic", desc: "Lifelike & detailed" },
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
  const [generating, setGenerating] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [genText, setGenText] = useState("");
  const [portionFilter, setPortionFilter] = useState<"all" | "torah" | "holiday">("all");
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCreditsExhausted, setPreviewCreditsExhausted] = useState(false);
  const [artStylePreviews, setArtStylePreviews] = useState<Record<string, string | null>>({});
  const [artStylePreviewsLoading, setArtStylePreviewsLoading] = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewCache = useRef<Map<string, string>>(new Map());
  const previewFallbackNoticeShown = useRef(false);

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

  const isCreditsExhaustedError = useCallback((error: unknown) => {
    const err = error as { context?: { status?: number }; status?: number; message?: string };
    const status = err?.context?.status ?? err?.status;
    const message = (err?.message || "").toLowerCase();
    return status === 402 || message.includes("credits exhausted");
  }, []);

  const disableAiPreviews = useCallback(() => {
    setPreviewCreditsExhausted(true);
    if (!previewFallbackNoticeShown.current) {
      previewFallbackNoticeShown.current = true;
      toast.info("Live AI previews are temporarily unavailable, using preset illustrations.");
    }
  }, []);

  /* ───── character preview generation ───── */

  const generateCharacterPreview = useCallback(async (c: ChildProfile, style: string) => {
    if (!c.gender || !c.age) return;
    if (previewCreditsExhausted) return;
    const cacheKey = `${c.gender}-${c.age}-${style}-${c.description}-${c.photoPreview ? "photo" : "no"}`;
    if (previewCache.current.has(cacheKey)) {
      updateChild(c.id, { characterPreview: previewCache.current.get(cacheKey)! });
      return;
    }
    setPreviewLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-character-preview", {
        body: {
          gender: c.gender,
          age: c.age,
          artStyle: style,
          description: c.description || undefined,
          referenceImage: c.photoPreview || undefined,
        },
      });
      if (error) {
        if (isCreditsExhaustedError(error)) {
          disableAiPreviews();
          return;
        }
        throw error;
      }
      if (result?.imageUrl) {
        previewCache.current.set(cacheKey, result.imageUrl);
        updateChild(c.id, { characterPreview: result.imageUrl });
      }
    } catch (err: any) {
      if (isCreditsExhaustedError(err)) {
        disableAiPreviews();
        return;
      }
      // Silently fall back to presets — don't show errors for preview generation
      console.warn("Character preview unavailable, using preset:", err?.message || err);
    } finally {
      setPreviewLoading(false);
    }
  }, [previewCreditsExhausted, updateChild, isCreditsExhaustedError, disableAiPreviews]);

  const triggerPreviewDebounced = useCallback((c: ChildProfile, style: string) => {
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(() => generateCharacterPreview(c, style), 600);
  }, [generateCharacterPreview]);

   // Trigger preview on age selection (step 3, after gender)
  useEffect(() => {
    if (step === 3 && child.gender && child.age) {
      triggerPreviewDebounced(child, data.artStyle);
    }
  }, [step, child.age]);

  // Generate art style preview cards when entering step 4
  useEffect(() => {
    if (step !== 4 || !child.gender || !child.age) return;
    if (artStylePreviewsLoading) return;

    if (previewCreditsExhausted) {
      setArtStylePreviews(
        ART_STYLES.reduce<Record<string, string>>((acc, style) => {
          acc[style.key] = getStylePreset(child.gender, style.key);
          return acc;
        }, {})
      );
      return;
    }

    setArtStylePreviewsLoading(true);

    const generateStylePreviews = async () => {
      const results: Record<string, string | null> = {};
      for (const style of ART_STYLES) {
        const cacheKey = `style-${child.gender}-${child.age}-${style.key}`;
        if (previewCache.current.has(cacheKey)) {
          results[style.key] = previewCache.current.get(cacheKey)!;
          continue;
        }
        try {
          const { data: result, error } = await supabase.functions.invoke("generate-character-preview", {
            body: { gender: child.gender, age: child.age, artStyle: style.key },
          });
          if (error) {
            if (isCreditsExhaustedError(error)) {
              disableAiPreviews();
            }
            results[style.key] = getStylePreset(child.gender, style.key);
          } else if (result?.imageUrl) {
            results[style.key] = result.imageUrl;
            previewCache.current.set(cacheKey, result.imageUrl);
          } else {
            results[style.key] = getStylePreset(child.gender, style.key);
          }
        } catch {
          results[style.key] = getStylePreset(child.gender, style.key);
        }
        // Update as each arrives
        setArtStylePreviews((prev) => ({ ...prev, [style.key]: results[style.key] }));
      }
      setArtStylePreviewsLoading(false);
    };
    generateStylePreviews();
  }, [step, child.gender, child.age, previewCreditsExhausted, artStylePreviewsLoading, isCreditsExhaustedError, disableAiPreviews]);

  /* ───── photo handling ───── */

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

  /* ───── book generation (step 9) ───── */

  const generateImageForPage = async (pageId: number, promptOrText: string, artStyle: string, names: string, torahPortion: string) => {
    try {
      const firstChildWithPhoto = data.children.find((c) => c.photoPreview);
      const referenceImage = firstChildWithPhoto?.photoPreview || null;
      const { data: imgData, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: promptOrText, childName: names, artStyle, torahPortion, referenceImage },
      });
      if (error) throw error;
      if (imgData?.error) throw new Error(imgData.error);
      return imgData.imageUrl;
    } catch (err) {
      console.error(`Image gen failed for page ${pageId}:`, err);
      return null;
    }
  };

  const startGeneration = async () => {
    setDir(1);
    setStep(9);
    setGenerating(true);

    const texts = ["Weaving the magic...", "Writing story with AI...", "Illustrating pages...", "Almost there..."];
    let i = 0;
    setGenText(texts[0]);
    const iv = setInterval(() => { i++; if (i < texts.length) setGenText(texts[i]); }, 2500);

    try {
      setGenText("Writing story with AI...");
      const portionLabel = getPortionLabel(data.torahPortion);
      const childrenInfo = data.children.map((c) => `${c.name} (${c.age} years old, ${c.gender})`).join(", ");

      const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-story", {
        body: {
          childName: childNames,
          childrenInfo,
          age: data.children[0]?.age || "6",
          gender: data.children[0]?.gender || "boy",
          torahPortion: data.torahPortion,
          torahPortionLabel: portionLabel,
          artStyle: data.artStyle,
          language: data.language,
          pageCount: data.pageCount,
        },
      });

      if (storyError) throw storyError;
      if (storyData?.error) throw new Error(storyData.error);

      const cover = storyData.cover || { title: `${childNames}'s Torah Adventure`, subtitle: "" };
      const backCover = storyData.backCover || { synopsis: "", dedication: "" };
      const questions = storyData.backCover?.questions || storyData.questions || [];

      let pageId = 0;
      const allPages: BookPage[] = [];

      allPages.push({ id: pageId++, text: cover.title, image: null, imageLoading: true, type: "cover", coverTitle: cover.title, coverSubtitle: cover.subtitle });

      for (const p of storyData.pages || []) {
        allPages.push({ id: pageId++, text: p.text, image: null, imageLoading: true, type: "story" });
      }

      allPages.push({ id: pageId++, text: backCover.synopsis || "", image: null, imageLoading: true, type: "back-cover", synopsis: backCover.synopsis, dedication: backCover.dedication, questions });

      setBookPages(allPages);
      clearInterval(iv);
      setGenerating(false);
      setStep(10);

      // Auto-save
      if (user) {
        try {
          const { data: bookData, error: saveError } = await supabase
            .from("books")
            .insert({
              user_id: user.id,
              child_name: childNames,
              torah_portion: data.torahPortion,
              art_style: data.artStyle,
              language: data.language,
              status: "draft",
              pages_data: allPages,
              story_data: storyData,
              questions,
            } as any)
            .select()
            .single();
          if (!saveError && bookData) {
            setSavedBookId(bookData.id);
            toast.success("Book saved to your account!");
          }
        } catch (err) {
          console.error("Failed to save book:", err);
        }
      }

      // Generate images with character consistency
      const ageDescMap: Record<string, string> = {
        "2": "toddler", "3": "toddler", "4": "small preschool child", "5": "small preschool child",
        "6": "young child", "7": "young child", "8": "school-age child", "9": "school-age child",
        "10": "preteen", "11": "preteen", "12": "young teenager",
      };

      // Build a consistent character identity prompt used on EVERY page
      const characterIdentities = data.children.map((c) => {
        const ageDesc = ageDescMap[c.age] || "child";
        const ageNum = c.age || "6";
        const genderLabel = c.gender || "child";
        const kippahNote = c.gender === "boy" ? ", wearing a kippah/yarmulke and tzitzis" : ", wearing a modest long dress with long sleeves";
        const descNote = c.description ? `. Physical appearance: ${c.description}` : "";
        return `${c.name} — a ${ageNum}-year-old ${genderLabel} (${ageDesc})${kippahNote}${descNote}`;
      }).join("; ");

      const consistencyNote = `IMPORTANT: The character(s) must look EXACTLY the same on every page — same face, same hair, same body proportions, same clothing. Characters: ${characterIdentities}.`;

      const styleMap: Record<string, string> = {
        cartoon: "colorful cartoon illustration, soft watercolor textures, children's book style",
        "3d-pixar": "3D Pixar-style CGI render, warm lighting, soft shadows",
        realistic: "photorealistic illustration, natural lighting, lifelike detail, warm cinematic tones",
      };
      const style = styleMap[data.artStyle] || styleMap.cartoon;
      const portionLabelForImg = getPortionLabel(data.torahPortion);

      // Generate images sequentially for consistency, with retry
      for (const page of allPages) {
        let imgPrompt: string;

        if (page.type === "cover") {
          imgPrompt = `A stunning children's book FRONT COVER illustration (4:3 landscape). Scene from the Torah story "${portionLabelForImg}". ${consistencyNote} Style: ${style}. Magical, inviting, vibrant colors. DO NOT include any text, title, or lettering in the image. No words.`;
        } else if (page.type === "back-cover") {
          imgPrompt = `A beautiful children's book BACK COVER illustration (4:3 landscape). A warm, peaceful closing scene from the Torah story "${portionLabelForImg}". ${consistencyNote} Style: ${style}. Soft, warm colors, peaceful atmosphere. DO NOT include any text, title, or lettering in the image. No words.`;
        } else {
          imgPrompt = `A beautiful children's book page illustration (4:3 landscape). Scene: "${page.text}". ${consistencyNote} Torah story: "${portionLabelForImg}". Style: ${style}. Warm magical atmosphere, vibrant colors. DO NOT include any text or lettering in the image. The text will be displayed separately below the illustration.`;
        }

        // Try up to 2 times per page
        let imageUrl: string | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          imageUrl = await generateImageForPage(page.id, imgPrompt, data.artStyle, childNames, data.torahPortion);
          if (imageUrl) break;
          console.warn(`Retrying image for page ${page.id}, attempt ${attempt + 2}`);
        }

        setBookPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, image: imageUrl, imageLoading: false } : p)));
      }
    } catch (err: any) {
      clearInterval(iv);
      setGenerating(false);
      console.error("Generation failed:", err);
      toast.error(err?.message || "Failed to generate story. Please try again.");
      setStep(8);
    }
  };

  /* ───── navigation ───── */

  const next = async () => {
    if (step === 8) {
      await startGeneration();
      return;
    }
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handlePlaceOrder = async () => {
    if (savedBookId && user) {
      try {
        await supabase.from("books").update({
          status: "ordered",
          shipping_data: shipping,
          order_number: `MTT-${Date.now().toString().slice(-6)}`,
          updated_at: new Date().toISOString(),
        } as any).eq("id", savedBookId);
      } catch (err) {
        console.error("Failed to update order:", err);
      }
    }
    setDir(1);
    setStep(13);
  };

  /* ───── can proceed checks ───── */

  const canNext = (() => {
    switch (step) {
      case 1: return !!child.name.trim();
      case 2: return !!child.gender;
      case 3: return !!child.age;
      case 4: return !!data.artStyle;
      case 5: return true; // photo/desc optional
      case 6: return !!data.torahPortion;
      case 7: return true;
      case 8: return true;
      case 10: return true;
      case 11: return !!(shipping.fullName && shipping.street && shipping.city && shipping.state && shipping.zip);
      default: return false;
    }
  })();

  const filteredPortions = portionFilter === "all"
    ? TORAH_PORTIONS
    : TORAH_PORTIONS.filter((p) => p.category === portionFilter);

  /* ───── determine which stepper group is active ───── */

  const activeGroupIdx = STEP_GROUPS.findIndex((g) => g.steps.includes(step));

  /* ───── character preview panel ───── */

  /** Resolve best preview: AI-generated > preset based on current selections */
  const getPreviewImage = (): string | null => {
    if (child.characterPreview) return child.characterPreview;
    // Show preset based on what we know so far
    const gender = child.gender || "";
    const age = child.age || "";
    const style = data.artStyle || "cartoon";
    if (gender && age) return getAgePreset(gender, ageToBracketLabel(age));
    if (gender) return getStylePreset(gender, style);
    return null;
  };

  const CharacterPreview = () => {
    if (step < 2 || step > 5) return null;
    const preview = getPreviewImage();
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-muted/50 border border-border/50 shadow-sm">
          {previewLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          )}
          {preview ? (
            <img src={preview} alt="Character preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <User className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        {(child.name || child.age || child.gender) && (
          <p className="text-xs text-muted-foreground text-center">
            {child.name && <span className="font-semibold text-foreground">{child.name}</span>}
            {child.age && <span> · {child.age}yo</span>}
            {child.gender && <span> · {child.gender}</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border/50 shadow-soft-lg">
        {/* ── Grouped Stepper ── */}
        {step !== 13 && (
          <div className="px-6 sm:px-8 pt-6 pb-2">
            <div className="flex items-center justify-between gap-1">
              {STEP_GROUPS.map((g, i) => {
                const isActive = i === activeGroupIdx;
                const isCompleted = i < activeGroupIdx;
                return (
                  <div key={g.label} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                        isCompleted ? "bg-accent text-accent-foreground"
                        : isActive ? "bg-accent/15 text-accent ring-2 ring-accent/30"
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : <g.icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[10px] font-medium hidden sm:block transition-colors duration-300 ${
                        isActive ? "text-accent" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}>{g.label}</span>
                    </div>
                    {i < STEP_GROUPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 transition-colors duration-500 ${isCompleted ? "bg-accent" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Sub-progress within group */}
            {activeGroupIdx >= 0 && (
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={false}
                  animate={{
                    width: `${((STEP_GROUPS[activeGroupIdx].steps.indexOf(step) + 1) / STEP_GROUPS[activeGroupIdx].steps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        )}

        <div className="p-6 sm:p-8 pt-4">
          {/* Layout: steps 2-5 show character preview on the side */}
          <div className={step >= 2 && step <= 5 ? "flex flex-col sm:flex-row gap-6" : ""}>
            {/* Character preview (top on mobile, right on desktop) */}
            {step >= 2 && step <= 5 && (
              <div className="sm:order-2 flex-shrink-0 flex justify-center sm:pt-8">
                <CharacterPreview />
              </div>
            )}

            <div className="flex-1 sm:order-1">
              <AnimatePresence mode="wait" custom={dir}>

                {/* ── STEP 1: Name ── */}
                {step === 1 && (
                  <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Type className="w-6 h-6 text-accent" /> What's your hero's name?
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">Enter the name of the child who will star in this Torah adventure.</p>
                    </div>
                    <Input
                      placeholder="e.g., Chaya Mushka"
                      value={child.name}
                      onChange={(e) => updateChild(child.id, { name: e.target.value })}
                      className="rounded-xl h-14 text-lg px-5"
                      autoFocus
                    />
                    {data.children.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {data.children.map((c, idx) => (
                          <button
                            key={c.id}
                            onClick={() => update({ activeChildIdx: idx })}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                              idx === data.activeChildIdx
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {c.name || `Child ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 2: Gender ── */}
                {step === 2 && (
                  <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Heart className="w-6 h-6 text-accent" /> Is {child.name || "your hero"} a boy or a girl?
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">This shapes the character's appearance and clothing in the illustrations.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "boy", label: "Boy", detail: "Will wear a kippah", img: presetBoyCartoon },
                        { key: "girl", label: "Girl", detail: "Modest dress", img: presetGirlCartoon },
                      ].map((g) => (
                        <button
                          key={g.key}
                          onClick={() => {
                            updateChild(child.id, { gender: g.key });
                          }}
                          className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                            child.gender === g.key
                              ? "border-accent bg-accent/5 shadow-md"
                              : "border-border hover:border-accent/30"
                          }`}
                        >
                          <div className="w-full aspect-square bg-muted/30">
                            <img src={g.img} alt={g.label} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                          </div>
                          <div className="p-3">
                            <span className="text-lg font-semibold text-primary block">{g.label}</span>
                            <span className="text-xs text-muted-foreground">{g.detail}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Age ── */}
                {step === 3 && (
                  <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-accent" /> How old is {child.name || "your hero"}?
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">This helps us tailor the story to the right reading level.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {AGE_BRACKETS.map((bracket) => {
                        const ageNum = child.age ? parseInt(child.age) : 0;
                        const isSelected = ageNum >= bracket.min && ageNum <= bracket.max;
                        const presetImg = getAgePreset(child.gender || "boy", bracket.label);
                        return (
                          <button
                            key={bracket.label}
                            onClick={() => {
                              updateChild(child.id, { age: String(bracket.min) });
                            }}
                            className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                              isSelected
                                ? "border-accent bg-accent/5 shadow-sm"
                                : "border-border hover:border-accent/30"
                            }`}
                          >
                            <div className="w-full aspect-square bg-muted/30 relative">
                              <img src={presetImg} alt={bracket.desc} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                            </div>
                            <div className="p-2">
                              <span className="text-sm font-semibold text-primary block">{bracket.label} yrs</span>
                              <span className="text-[11px] text-muted-foreground">{bracket.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                      {/* Exact age fine-tune */}
                      <div className="col-span-full mt-2">
                        <Label className="text-xs text-muted-foreground">Or set exact age:</Label>
                        <Slider
                          value={[parseInt(child.age) || 5]}
                          onValueChange={([v]) => updateChild(child.id, { age: String(v) })}
                          min={2}
                          max={12}
                          step={1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>2</span>
                          <span className="font-semibold text-accent">{child.age || "5"} years old</span>
                          <span>12</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 4: Art Style ── */}
                {step === 4 && (
                  <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Palette className="w-6 h-6 text-accent" /> Choose an illustration style
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">See how {child.name || "your hero"} looks in each style.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {ART_STYLES.map((s) => {
                        const presetImg = getStylePreset(child.gender || "boy", s.key);
                        const stylePreview = artStylePreviews[s.key] || presetImg;
                        return (
                          <button
                            key={s.key}
                            onClick={() => {
                              update({ artStyle: s.key });
                              if (child.gender && child.age) {
                                triggerPreviewDebounced(child, s.key);
                              }
                            }}
                            className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                              data.artStyle === s.key
                                ? "border-accent shadow-md ring-2 ring-accent/20"
                                : "border-border hover:border-accent/30"
                            }`}
                          >
                            <div className="aspect-square bg-muted/50 relative">
                              <img src={stylePreview} alt={s.label} className="w-full h-full object-cover" loading="lazy" width={512} height={512} />
                            </div>
                            <div className="p-3">
                              <span className="text-sm font-semibold text-primary block">{s.label}</span>
                              <span className="text-[11px] text-muted-foreground">{s.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 5: Photo / Description ── */}
                {step === 5 && (
                  <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Image className="w-6 h-6 text-accent" /> Help us draw {child.name || "your hero"}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">Upload a photo or describe your child's appearance. Both are optional!</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Upload option */}
                      <div className="rounded-2xl border-2 border-dashed border-border p-5 text-center hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 relative">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary">Upload a Photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Best results with clear face photos</p>
                          </div>
                          {child.photoPreview ? (
                            <div className="flex items-center gap-3 w-full">
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
                              onChange={(e) => {
                                handlePhoto(child.id, e);
                                // Trigger preview after photo loads
                                setTimeout(() => {
                                  const updatedChild = { ...child, photoPreview: child.photoPreview };
                                  if (updatedChild.gender && updatedChild.age) {
                                    triggerPreviewDebounced(updatedChild, data.artStyle);
                                  }
                                }, 1000);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          )}
                        </div>

                        {/* Photo tips */}
                        <div className="mt-4 rounded-xl bg-accent/5 border border-accent/15 p-3 text-left">
                          <p className="text-xs font-semibold text-accent mb-1.5 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" /> Tips for best results
                          </p>
                          <ul className="text-[11px] text-muted-foreground space-y-1">
                            <li className="flex items-start gap-1.5"><User className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Face clearly visible</li>
                            <li className="flex items-start gap-1.5"><Sun className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Good lighting</li>
                            <li className="flex items-start gap-1.5"><Camera className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Close-up portrait</li>
                          </ul>
                        </div>
                      </div>

                      {/* Description option */}
                      <div className="rounded-2xl border-2 border-border p-5">
                        <div className="flex flex-col items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <PenLine className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">Describe Instead</p>
                            <p className="text-xs text-muted-foreground mt-1">Tell us what your child looks like</p>
                          </div>
                        </div>
                        <Textarea
                          placeholder="e.g., Brown curly hair, olive skin, big brown eyes, loves wearing blue..."
                          value={child.description}
                          onChange={(e) => {
                            updateChild(child.id, { description: e.target.value });
                            if (child.gender && child.age && e.target.value.length > 10) {
                              triggerPreviewDebounced({ ...child, description: e.target.value }, data.artStyle);
                            }
                          }}
                          className="rounded-xl min-h-[120px] text-sm"
                        />
                      </div>
                    </div>

                    {/* Multi-child controls */}
                    {data.children.length < 4 && (
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
                          setStep(1); // Go back to name for new child
                        }}
                        className="w-full border-dashed border-2 rounded-xl h-11"
                      >
                        <Plus className="w-4 h-4" /> Add Another Child
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 6: Torah Portion ── */}
                {step === 6 && (
                  <motion.div key="s6" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-5">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary">Choose a Torah Story</h2>
                      <p className="text-muted-foreground text-sm mt-1">Which adventure will {childNames} explore?</p>
                    </div>

                    <div className="flex gap-2">
                      {(["all", "torah", "holiday"] as const).map((f) => (
                        <button key={f} onClick={() => setPortionFilter(f)} className={`text-xs font-medium px-4 py-2 rounded-full transition-all duration-300 capitalize ${
                          portionFilter === f ? "bg-accent text-accent-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}>
                          {f === "all" ? "All Stories" : f === "torah" ? "Torah Portions" : "Holidays"}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin">
                      {filteredPortions.map((p) => (
                        <button key={p.value} onClick={() => update({ torahPortion: p.value })} className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                          data.torahPortion === p.value ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/30 hover:bg-card"
                        }`}>
                          <span className="font-display text-base font-semibold text-primary">{p.label}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{p.sub}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 7: Language ── */}
                {step === 7 && (
                  <motion.div key="s7" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary">Choose a Language</h2>
                      <p className="text-muted-foreground text-sm mt-1">In which language should the story be written?</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "english", label: "English", emoji: "🇺🇸" },
                        { key: "hebrew", label: "Hebrew", emoji: "🇮🇱" },
                        { key: "bilingual", label: "Both", emoji: "🌍" },
                      ].map((l) => (
                        <button key={l.key} onClick={() => update({ language: l.key })} className={`p-5 rounded-2xl border-2 text-center transition-all duration-300 active:scale-[0.97] ${
                          data.language === l.key ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/30"
                        }`}>
                          <span className="text-3xl block mb-2">{l.emoji}</span>
                          <span className="text-sm font-semibold text-primary">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 8: Page Count ── */}
                {step === 8 && (
                  <motion.div key="s8" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary">How many pages?</h2>
                      <p className="text-muted-foreground text-sm mt-1">Choose how long {childNames}'s story should be.</p>
                    </div>
                    <div className="py-8">
                      <div className="text-center mb-6">
                        <span className="text-6xl font-bold text-accent">{data.pageCount}</span>
                        <span className="text-lg text-muted-foreground ml-2">pages</span>
                      </div>
                      <Slider
                        value={[data.pageCount]}
                        onValueChange={([v]) => update({ pageCount: v })}
                        min={2}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-3">
                        <span>Short story</span>
                        <span>Epic adventure</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 9: Generating ── */}
                {step === 9 && generating && (
                  <motion.div key="s9" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="py-16 space-y-8">
                    <SparkleEffect count={15} />
                    <div className="text-center space-y-5">
                      <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                      </div>
                      <motion.p key={genText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl text-primary font-semibold">
                        {genText}
                      </motion.p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Creating something extraordinary for {childNames}...</p>
                    </div>
                    <div className="space-y-4 px-4 max-w-sm mx-auto">
                      <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-full" />
                        <Skeleton className="h-4 w-full rounded-full" />
                        <Skeleton className="h-4 w-2/3 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 10: Book Viewer ── */}
                {step === 10 && (
                  <motion.div key="s10" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }}>
                    <BookViewer childName={childNames} torahPortion={data.torahPortion} artStyle={data.artStyle} pages={bookPages} onPagesChange={setBookPages} />
                  </motion.div>
                )}

                {/* ── STEP 11: Shipping ── */}
                {step === 11 && (
                  <motion.div key="s11" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }}>
                    <ShippingForm data={shipping} onChange={setShipping} />
                  </motion.div>
                )}

                {/* ── STEP 12: Checkout ── */}
                {step === 12 && (
                  <motion.div key="s12" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }}>
                    <CheckoutStep childName={childNames} torahPortion={data.torahPortion} artStyle={data.artStyle} shipping={shipping} onPlaceOrder={handlePlaceOrder} />
                  </motion.div>
                )}

                {/* ── STEP 13: Success ── */}
                {step === 13 && (
                  <motion.div key="s13" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }}>
                    <SuccessStep childName={childNames} onGoToDashboard={() => { onClose(); navigate("/dashboard"); }} />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* ── Nav buttons ── */}
          {step !== 9 && step !== 12 && step !== 13 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="ghost" onClick={back} className="rounded-xl gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              {step <= 7 && (
                <Button variant="gold" onClick={next} disabled={!canNext} className="rounded-xl gap-2 px-6 h-11">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {step === 8 && (
                <Button variant="gold" onClick={next} className="rounded-xl gap-2 px-6 h-11">
                  <Sparkles className="w-4 h-4" /> Generate Book
                </Button>
              )}
              {step === 10 && (
                <Button variant="gold" onClick={next} className="rounded-xl gap-2 px-6 h-11">
                  Looks Great! <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {step === 11 && (
                <Button variant="gold" onClick={next} disabled={!canNext} className="rounded-xl gap-2 px-6 h-11">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
