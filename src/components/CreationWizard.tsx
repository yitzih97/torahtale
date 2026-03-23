import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, X, Loader2, Sparkles, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SparkleEffect } from "./SparkleEffect";
import { BookViewer, type BookPage } from "./wizard/BookViewer";
import { ShippingForm, DEFAULT_SHIPPING, type ShippingData } from "./wizard/ShippingForm";
import { CheckoutStep } from "./wizard/CheckoutStep";
import { SuccessStep } from "./wizard/SuccessStep";
import { TORAH_PORTIONS, getPortionLabel } from "./wizard/TorahPortions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChildProfile {
  id: string;
  name: string;
  age: string;
  gender: string;
  photo: File | null;
  photoPreview: string | null;
}

const createChild = (): ChildProfile => ({
  id: crypto.randomUUID(),
  name: "",
  age: "",
  gender: "",
  photo: null,
  photoPreview: null,
});

interface WizardData {
  children: ChildProfile[];
  torahPortion: string;
  artStyle: string;
  language: string;
  pageCount: number;
}

const initialData: WizardData = {
  children: [createChild()],
  torahPortion: "",
  artStyle: "cartoon",
  language: "english",
  pageCount: 4,
};

const TOTAL_STEPS = 8;
const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, filter: "blur(4px)" }),
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreationWizard = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [generating, setGenerating] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [genText, setGenText] = useState("");
  const [portionFilter, setPortionFilter] = useState<"all" | "torah" | "holiday">("all");
  const [bookPages, setBookPages] = useState<BookPage[]>([]);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateChild = useCallback((id: string, partial: Partial<ChildProfile>) => {
    setData((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
  }, []);

  const addChild = () => {
    if (data.children.length >= 4) return;
    setData((prev) => ({ ...prev, children: [...prev.children, createChild()] }));
  };

  const removeChild = (id: string) => {
    if (data.children.length <= 1) return;
    setData((prev) => ({ ...prev, children: prev.children.filter((c) => c.id !== id) }));
  };

  const childNames = data.children.map((c) => c.name).filter(Boolean).join(" & ") || "your child";

  const generateImageForPage = async (pageId: number, pageText: string, artStyle: string, names: string, torahPortion: string) => {
    try {
      const styleMap: Record<string, string> = {
        cartoon: "colorful cartoon illustration, soft watercolor textures",
        "3d-pixar": "3D Pixar-style CGI render, warm lighting",
        "graphic-novel": "graphic novel, bold ink lines, flat colors",
      };
      const prompt = `A beautiful children's book page illustration with the story text elegantly embedded inside the image as part of the layout, like a real printed children's book. The text should appear in a readable area (top or bottom banner, speech bubble, or decorative text area) within the illustration itself. Story text: "${pageText}". Characters: children named ${names}. Torah story: ${torahPortion}. Style: ${styleMap[artStyle] || styleMap.cartoon}. Safe for children, warm magical atmosphere, vibrant colors.`;

      const { data: imgData, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, childName: names, artStyle, torahPortion },
      });
      if (error) throw error;
      if (imgData?.error) throw new Error(imgData.error);
      return imgData.imageUrl;
    } catch (err) {
      console.error(`Image gen failed for page ${pageId}:`, err);
      return null;
    }
  };

  const next = async () => {
    if (step === 3) {
      setDir(1);
      setStep(4);
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

        const storyPages: BookPage[] = (storyData.pages || []).map((p: any, idx: number) => ({
          id: idx + 1,
          text: p.text,
          image: null,
          imageLoading: true,
        }));

        setBookPages(storyPages);
        clearInterval(iv);
        setGenerating(false);
        setStep(5);

        // Generate images in parallel
        const imagePromises = storyPages.map(async (page) => {
          const imageUrl = await generateImageForPage(page.id, page.text, data.artStyle, childNames, data.torahPortion);
          return { id: page.id, imageUrl };
        });

        for (const promise of imagePromises) {
          const result = await promise;
          setBookPages((prev) =>
            prev.map((p) => (p.id === result.id ? { ...p, image: result.imageUrl, imageLoading: false } : p))
          );
        }
      } catch (err: any) {
        clearInterval(iv);
        setGenerating(false);
        console.error("Generation failed:", err);
        toast.error(err?.message || "Failed to generate story. Please try again.");
        setStep(3);
      }
      return;
    }
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => { setDir(-1); setStep((s) => Math.max(s - 1, 1)); };

  const handlePhoto = (childId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateChild(childId, { photo: file, photoPreview: URL.createObjectURL(file) });
  };

  const handlePlaceOrder = () => { setDir(1); setStep(8); };

  const canNext =
    (step === 1 && data.children.every((c) => c.name && c.age && c.gender)) ||
    (step === 2 && data.torahPortion) ||
    step === 3 ||
    step === 5 ||
    (step === 6 && shipping.fullName && shipping.street && shipping.city && shipping.state && shipping.zip);

  const progressPct = step === 4 ? 45 : (step / TOTAL_STEPS) * 100;

  const filteredPortions = portionFilter === "all"
    ? TORAH_PORTIONS
    : TORAH_PORTIONS.filter((p) => p.category === portionFilter);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-book border-border">
        {/* Progress bar */}
        <div className="h-1.5 bg-muted sticky top-0 z-10">
          <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease }} />
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait" custom={dir}>
            {/* STEP 1: The Heroes */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-5">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 1 of {TOTAL_STEPS}</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" /> The Heroes
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">Add one or more children to star in this story.</p>
                </div>

                <div className="space-y-4">
                  {data.children.map((child, idx) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3, ease }}
                      className="rounded-book border border-border bg-secondary/50 p-4 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">Child {idx + 1}</span>
                        {data.children.length > 1 && (
                          <button onClick={() => removeChild(child.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input placeholder="e.g., Sarah / שרה" value={child.name} onChange={(e) => updateChild(child.id, { name: e.target.value })} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Age</Label>
                          <Select value={child.age} onValueChange={(v) => updateChild(child.id, { age: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Age" /></SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 11 }, (_, i) => i + 2).map((a) => (
                                <SelectItem key={a} value={String(a)}>{a} years old</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <Select value={child.gender} onValueChange={(v) => updateChild(child.id, { gender: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Gender" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boy">Boy</SelectItem>
                              <SelectItem value="girl">Girl</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Photo upload */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Photo (optional)</Label>
                        <div className="mt-1 border border-dashed border-border rounded-book p-3 text-center cursor-pointer hover:border-accent transition-colors relative">
                          {child.photoPreview ? (
                            <div className="flex items-center gap-3">
                              <img src={child.photoPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                              <span className="text-xs text-muted-foreground flex-1 truncate">{child.photo?.name}</span>
                              <button onClick={() => updateChild(child.id, { photo: null, photoPreview: null })} className="text-xs text-destructive hover:underline">Remove</button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">Drag & drop or click</p>
                              <input type="file" accept="image/*" onChange={(e) => handlePhoto(child.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {data.children.length < 4 && (
                  <Button variant="outline" size="sm" onClick={addChild} className="w-full border-dashed">
                    <Plus className="w-4 h-4" /> Add Another Child
                  </Button>
                )}
              </motion.div>
            )}

            {/* STEP 2: The Journey */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-5">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 2 of {TOTAL_STEPS}</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Journey</h2>
                  <p className="text-muted-foreground text-sm mt-1">Which story will {childNames} explore?</p>
                </div>
                <div className="flex gap-2">
                  {(["all", "torah", "holiday"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPortionFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 capitalize ${
                        portionFilter === f ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "All" : f === "torah" ? "Torah Portions" : "Holidays"}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
                  {filteredPortions.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => update({ torahPortion: p.value })}
                      className={`p-3 rounded-book border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                        data.torahPortion === p.value ? "border-accent bg-accent/5 shadow-soft-sm" : "border-border hover:border-accent/40"
                      }`}
                    >
                      <span className="font-display text-base font-semibold text-primary">{p.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: The Magic */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-5">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 3 of {TOTAL_STEPS}</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Magic</h2>
                  <p className="text-muted-foreground text-sm mt-1">Customize the look, language, and length of your book.</p>
                </div>
                <div className="space-y-5">
                  {/* Art Style */}
                  <div>
                    <Label className="mb-2 block">Art Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "cartoon", label: "Cartoon", emoji: "🎨" },
                        { key: "3d-pixar", label: "3D Pixar", emoji: "✨" },
                        { key: "graphic-novel", label: "Graphic Novel", emoji: "📓" },
                      ].map((s) => (
                        <button key={s.key} onClick={() => update({ artStyle: s.key })} className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${data.artStyle === s.key ? "border-accent bg-accent/5 shadow-soft-sm" : "border-border hover:border-accent/40"}`}>
                          <span className="text-lg block mb-1">{s.emoji}</span>
                          <span className="text-xs font-medium text-primary">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <Label className="mb-2 block">Language</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "english", label: "English", emoji: "🇺🇸" },
                        { key: "hebrew", label: "Hebrew", emoji: "🇮🇱" },
                        { key: "bilingual", label: "Bilingual", emoji: "🌍" },
                      ].map((l) => (
                        <button key={l.key} onClick={() => update({ language: l.key })} className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${data.language === l.key ? "border-accent bg-accent/5 shadow-soft-sm" : "border-border hover:border-accent/40"}`}>
                          <span className="text-lg block mb-1">{l.emoji}</span>
                          <span className="text-xs font-medium text-primary">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Count */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Number of Pages</Label>
                      <span className="text-sm font-semibold text-accent">{data.pageCount} pages</span>
                    </div>
                    <Slider
                      value={[data.pageCount]}
                      onValueChange={([v]) => update({ pageCount: v })}
                      min={2}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>2</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Generating */}
            {step === 4 && generating && (
              <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="py-12 space-y-8">
                <SparkleEffect count={15} />
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                  <motion.p key={genText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl text-primary">
                    {genText}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Creating something extraordinary for {childNames}...</p>
                </div>
                {/* Skeleton preview */}
                <div className="space-y-4 px-4">
                  <Skeleton className="w-full aspect-[4/3] rounded-book" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    {Array.from({ length: data.pageCount }).map((_, i) => (
                      <Skeleton key={i} className="w-3 h-3 rounded-full" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Book Viewer */}
            {step === 5 && (
              <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <BookViewer
                  childName={childNames}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  pages={bookPages}
                  onPagesChange={setBookPages}
                />
              </motion.div>
            )}

            {/* STEP 6: Shipping */}
            {step === 6 && (
              <motion.div key="s6" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <ShippingForm data={shipping} onChange={setShipping} />
              </motion.div>
            )}

            {/* STEP 7: Checkout */}
            {step === 7 && (
              <motion.div key="s7" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <CheckoutStep
                  childName={childNames}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  shipping={shipping}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}

            {/* STEP 8: Success */}
            {step === 8 && (
              <motion.div key="s8" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <SuccessStep
                  childName={childNames}
                  onGoToDashboard={() => { onClose(); navigate("/dashboard"); }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step !== 4 && step !== 7 && step !== 8 && (
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button variant="outline" onClick={back}><ArrowLeft className="w-4 h-4" /> Back</Button>
              ) : <div />}
              {step < 3 && (
                <Button variant="gold" onClick={next} disabled={!canNext}>Next <ArrowRight className="w-4 h-4" /></Button>
              )}
              {step === 3 && (
                <Button variant="gold" onClick={next}>
                  <Sparkles className="w-4 h-4" /> Generate {data.pageCount}-Page Book
                </Button>
              )}
              {step === 5 && (
                <Button variant="gold" onClick={next}>Approve & Continue <ArrowRight className="w-4 h-4" /></Button>
              )}
              {step === 6 && (
                <Button variant="gold" onClick={next} disabled={!canNext}>Continue to Checkout <ArrowRight className="w-4 h-4" /></Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
