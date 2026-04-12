import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Settings, Image as ImageIcon, Brain, DollarSign,
  Save, Loader2, RefreshCw, Check, AlertTriangle, Globe,
  Upload, Palette, Printer, TestTube2, BookOpen, Copy, Search,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TORAH_PORTIONS, CATEGORY_META, TORAH_BOOKS, type TorahOption } from "@/components/wizard/TorahPortions";

const DEFAULT_PROMPTS: Record<string, string> = {
  "story-system-prompt": `You are a master storyteller for frum Yiddishe kinderlach...`,
  "image-prompt-template": `A beautiful children's book illustration of a frum Yiddishe child named {childName}...`,
  "character-prompt-template": `Create a character portrait illustration of a {age}-year-old Jewish {gender} {ageDesc}...`,
};

const SITE_IMAGE_KEYS = [
  { key: "hero-scene-1", label: "Hero Scene 1 — Bereishis", defaultPrompt: "A breathtaking 3D Pixar-style illustration of Gan Eden with lush gardens, golden light, and a young frum Yiddishe girl with long modest dress exploring among friendly animals." },
  { key: "hero-scene-2", label: "Hero Scene 2 — Noach", defaultPrompt: "A stunning 3D Pixar-style illustration of Noach's Teivah with animals boarding two by two, a frum Yiddishe boy with peyos, yarmulke, and tzitzis helping." },
  { key: "hero-scene-3", label: "Hero Scene 3 — Tower of Bavel", defaultPrompt: "A dramatic 3D Pixar-style illustration of the Tower of Bavel, with a frum Yiddishe boy with peyos looking up in wonder." },
  { key: "hero-scene-4", label: "Hero Scene 4 — Avraham's Stars", defaultPrompt: "A beautiful 3D Pixar-style night scene with Avraham and a frum girl in modest dress counting stars." },
  { key: "hero-scene-5", label: "Hero Scene 5 — Yosef's Coat", defaultPrompt: "A colorful 3D Pixar-style illustration of Yosef in his coat of many colors with a frum boy with peyos." },
  { key: "hero-scene-6", label: "Hero Scene 6 — Baby Moshe", defaultPrompt: "A serene 3D Pixar-style illustration of baby Moshe in a basket on the Nile, frum girl watching." },
  { key: "hero-scene-7", label: "Hero Scene 7 — Krias Yam Suf", defaultPrompt: "A spectacular 3D Pixar-style illustration of splitting the sea with a frum boy with peyos walking through." },
  { key: "hero-scene-8", label: "Hero Scene 8 — Har Sinai", defaultPrompt: "A majestic 3D Pixar-style illustration of Har Sinai with thunder and lightning, a frum girl standing in awe." },
  { key: "hero-scene-9", label: "Hero Scene 9 — Dovid & Golyas", defaultPrompt: "A dramatic 3D Pixar-style illustration of Dovid with a slingshot facing Golyas, a frum boy watching." },
  { key: "hero-scene-10", label: "Hero Scene 10 — Yonah", defaultPrompt: "A magical 3D Pixar-style illustration of Yonah inside the great fish, frum girl finding hope." },
  { key: "hero-boy", label: "Hero Boy Character", defaultPrompt: "A 3D Pixar-style character portrait of a Chareidi Jewish boy with peyos, yarmulke, and tzitzis." },
  { key: "hero-girl", label: "Hero Girl Character", defaultPrompt: "A 3D Pixar-style character portrait of a Chareidi Jewish girl in a modest long-sleeved dress." },
  { key: "logo", label: "Site Logo", defaultPrompt: "A clean modern logo for Torah Tale — a children's Torah book brand." },
  { key: "favicon", label: "Favicon", defaultPrompt: "A small icon for Torah Tale — a Torah book icon." },
  { key: "story-noach", label: "Gallery — Noach", defaultPrompt: "A 3D Pixar-style book cover: Noach's Teivah with animals and frum kinderlach." },
  { key: "story-beshalach", label: "Gallery — Beshalach", defaultPrompt: "A 3D Pixar-style book cover: Krias Yam Suf with frum kinderlach." },
  { key: "story-bereishit", label: "Gallery — Bereishis", defaultPrompt: "A 3D Pixar-style book cover: Gan Eden with frum kinderlach." },
];

const AI_MODELS = [
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
];

const IMAGE_MODELS = [
  { value: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image" },
  { value: "gemini-2.5-flash-image-preview", label: "Gemini 2.5 Flash Image" },
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (stable)" },
];

/* ─── Extracted components (outside AdminCMS to prevent remount on every keystroke) ─── */

function SettingField({ category, settingKey, label, multiline, placeholder, edits, setEdits, onSave, savingKey, getSetting }: {
  category: string; settingKey: string; label: string; multiline?: boolean; placeholder?: string;
  edits: Record<string, string>; setEdits: (v: Record<string, string>) => void;
  onSave: (category: string, key: string, value: string) => void;
  savingKey: string | null;
  getSetting: (cat: string, key: string, fallback: string) => string;
}) {
  const val = edits[settingKey] ?? getSetting(category, settingKey, placeholder || "");
  const saving = savingKey === `${category}:${settingKey}`;
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {multiline ? (
        <Textarea
          value={val}
          onChange={(e) => setEdits({ ...edits, [settingKey]: e.target.value })}
          rows={6}
          className="text-xs font-mono"
          placeholder={placeholder}
        />
      ) : (
        <Input
          value={val}
          onChange={(e) => setEdits({ ...edits, [settingKey]: e.target.value })}
          className="text-sm"
          placeholder={placeholder}
        />
      )}
      <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={saving}
        onClick={() => onSave(category, settingKey, val)}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
      </Button>
    </div>
  );
}

function ModelSelect({ category, settingKey, label, models, edits, setEdits, onSave, savingKey, getSetting }: {
  category: string; settingKey: string; label: string;
  models: { value: string; label: string }[];
  edits: Record<string, string>; setEdits: (v: Record<string, string>) => void;
  onSave: (category: string, key: string, value: string) => void;
  savingKey: string | null;
  getSetting: (cat: string, key: string, fallback: string) => string;
}) {
  const val = edits[settingKey] ?? getSetting(category, settingKey, models[0]?.value || "");
  const saving = savingKey === `${category}:${settingKey}`;
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <Select value={val} onValueChange={(v) => setEdits({ ...edits, [settingKey]: v })}>
        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={saving}
        onClick={() => onSave(category, settingKey, val)}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
      </Button>
    </div>
  );
}

/* ─── Book Templates Tab ─── */

const PAGE_SLOTS = [
  { key: "cover", label: "Cover" },
  ...Array.from({ length: 8 }, (_, i) => ({ key: `page-${i + 1}`, label: `Page ${i + 1}` })),
  { key: "back-cover", label: "Back Cover" },
];

const PRINT_SPECS: Record<string, { cover: string; page: string }> = {
  "cover": {
    cover: "Softcover 8×8: 4790×2400 | Hardcover 8×8: 5370×2850 | Board 6×6: 3863×1875",
    page: "",
  },
  "back-cover": {
    cover: "Softcover 8×8: 4790×2400 | Hardcover 8×8: 5370×2850 | Board 6×6: 3863×1875",
    page: "",
  },
  "story": {
    cover: "",
    page: "Softcover 8×8: 2400×2400 | Hardcover 8×8: 2325×2325 | Board 6×6: 3675×1875",
  },
};

const DEFAULT_PAGE_TEMPLATES: Record<string, { text: string; "image-prompt": string }> = {
  "cover": {
    text: `{childName}'s {torahPortion} Adventure\nA personalized Torah tale`,
    "image-prompt": `A stunning children's book cover illustration in {artStyle} style. A frum Yiddishe {gender} named {childName}, age {age}, as the hero. The scene depicts the opening moment of the {torahPortion} story. Warm, magical atmosphere with golden light. Include subtle Torah motifs (stars of David, olive branches, scrollwork border). Title area at top. Safe for children. High resolution for print: Softcover 4790×2400px, Hardcover 5370×2850px, Board Book 3863×1875px.`,
  },
  "page-1": {
    text: `In a cozy Yiddishe home, {childName} discovered something extraordinary — a glowing sefer that would transport them into the story of {torahPortion}...`,
    "image-prompt": `A warm, inviting children's book illustration in {artStyle} style. A frum Yiddishe {gender} named {childName}, age {age}, sitting in a cozy room filled with seforim. A magical Torah scroll glows with golden light. The child reaches toward it with wonder. Warm home setting with Jewish decor (menorah, mezuzah visible). Print dimensions: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-2": {
    text: `Suddenly, the world around {childName} shimmered and changed. The story of {torahPortion} came alive before their very eyes...`,
    "image-prompt": `A magical transformation scene in {artStyle} style. {childName}, a frum Yiddishe {gender} age {age}, being transported through swirling light into the Biblical scene of {torahPortion}. Sparkles and Torah letters float in the air. The ancient landscape begins to materialize. Vibrant colors, child-safe imagery. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-3": {
    text: `{childName} looked around in amazement at the ancient land. The {torahPortion} story was unfolding, and they were right in the middle of it!`,
    "image-prompt": `A breathtaking panoramic scene in {artStyle} style showing the Biblical setting of {torahPortion}. {childName}, a frum Yiddishe {gender} age {age}, stands in awe looking at the landscape. Include historically appropriate details for the Torah story. Lush, colorful, warm lighting. Safe for children. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-4": {
    text: `{childName} met the great Torah figures from {torahPortion}. They shared words of wisdom and showed kindness that touched {childName}'s heart.`,
    "image-prompt": `A heartwarming meeting scene in {artStyle} style. {childName}, a frum Yiddishe {gender} age {age}, meets the key Biblical figure(s) from {torahPortion}. The Torah character is depicted with dignity and warmth. They interact kindly with the child. Beautiful background appropriate to the story. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-5": {
    text: `The most exciting moment arrived — the central miracle of {torahPortion}! {childName} watched with wide eyes as Hashem's power was revealed.`,
    "image-prompt": `A dramatic, awe-inspiring scene in {artStyle} style depicting the central event/miracle of {torahPortion}. {childName}, a frum Yiddishe {gender} age {age}, witnesses the event with wonder. Dramatic lighting, vibrant colors, sense of divine power. Appropriate for the specific Torah portion. Child-safe. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-6": {
    text: `{childName} learned an important lesson: just as in the story of {torahPortion}, Hashem is always watching over us with love.`,
    "image-prompt": `A reflective, emotional scene in {artStyle} style. {childName}, a frum Yiddishe {gender} age {age}, sits peacefully reflecting on what they witnessed in {torahPortion}. Soft golden light suggesting divine protection. Serene landscape. Torah-appropriate imagery. Warm and comforting. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-7": {
    text: `With a grateful heart, {childName} understood the moral of {torahPortion}: we must always trust in Hashem and follow His Torah.`,
    "image-prompt": `A meaningful scene in {artStyle} style showing {childName}, a frum Yiddishe {gender} age {age}, applying the moral lesson from {torahPortion}. The child performs a related mitzvah or act of kindness. Warm community setting with other frum characters. Uplifting atmosphere. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "page-8": {
    text: `As the magical journey ended, {childName} returned home, carrying the beautiful lessons of {torahPortion} forever in their heart. The End.`,
    "image-prompt": `A warm closing scene in {artStyle} style. {childName}, a frum Yiddishe {gender} age {age}, back in their cozy home, hugging a Torah scroll or sefer. The magical glow fades gently. Family members nearby. Shabbos candles or Jewish home elements visible. Sense of completion and warmth. Print: Softcover 2400×2400px, Hardcover 2325×2325px, Board Book 3675×1875px.`,
  },
  "back-cover": {
    text: `Synopsis: Join {childName} on an unforgettable adventure through the story of {torahPortion}, where Torah wisdom comes alive!\n\nDedication: With love and brachos`,
    "image-prompt": `A beautiful back cover design in {artStyle} style for a children's Torah book. Soft, decorative background with subtle Torah motifs (olive branches, scrollwork, stars). Space for text overlay with synopsis and dedication. Warm, elegant color palette. No characters needed — decorative only. Print: Softcover 4790×2400px, Hardcover 5370×2850px, Board Book 3863×1875px.`,
  },
};

function BookTemplatesTab({ onSave, savingKey }: {
  onSave: (category: string, key: string, value: string) => void;
  savingKey: string | null;
}) {
  const [selectedPortion, setSelectedPortion] = useState<string>("");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copySource, setCopySource] = useState<string>("");
  const [fillingDefaults, setFillingDefaults] = useState(false);
  const [uploadingRefKey, setUploadingRefKey] = useState<string | null>(null);
  const refImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUploadRefImage = async (slotKey: string, file: File) => {
    if (!selectedPortion) return;
    setUploadingRefKey(slotKey);
    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `template-ref/${selectedPortion}/${slotKey}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(filePath, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(filePath);
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const settingKey = `${selectedPortion}:${slotKey}:reference-image`;
      onSave("book-templates", settingKey, imageUrl);
      setTemplates((prev) => ({ ...prev, [`${slotKey}:reference-image`]: imageUrl }));
      toast.success(`Reference image uploaded for ${slotKey}`);
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    }
    setUploadingRefKey(null);
  };

  const handleDeleteRefImage = (slotKey: string) => {
    if (!selectedPortion) return;
    const settingKey = `${selectedPortion}:${slotKey}:reference-image`;
    onSave("book-templates", settingKey, "");
    setTemplates((prev) => ({ ...prev, [`${slotKey}:reference-image`]: "" }));
    toast.success(`Reference image removed for ${slotKey}`);
  };

  // Group portions by category
  const groupedPortions: Record<string, TorahOption[]> = {};
  TORAH_PORTIONS.forEach((p) => {
    if (!groupedPortions[p.category]) groupedPortions[p.category] = [];
    groupedPortions[p.category].push(p);
  });

  // Load templates for selected portion
  useEffect(() => {
    if (!selectedPortion) return;
    setLoading(true);
    supabase
      .from("site_settings" as any)
      .select("*")
      .eq("category", "book-templates")
      .like("key", `${selectedPortion}:%`)
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, string> = {};
          (data as any[]).forEach((row: any) => {
            const suffix = row.key.replace(`${selectedPortion}:`, "");
            map[suffix] = row.value;
          });
          setTemplates(map);
        } else {
          setTemplates({});
        }
        setLoading(false);
      });
  }, [selectedPortion]);

  const handleSaveSlot = (slotKey: string, field: "text" | "image-prompt") => {
    const fullKey = `${selectedPortion}:${slotKey}:${field}`;
    const value = templates[`${slotKey}:${field}`] || "";
    onSave("book-templates", fullKey, value);
  };

  const handleFillDefaults = async () => {
    if (!selectedPortion) return;
    setFillingDefaults(true);
    const newTemplates = { ...templates };
    let count = 0;
    for (const slot of PAGE_SLOTS) {
      const defaults = DEFAULT_PAGE_TEMPLATES[slot.key];
      if (!defaults) continue;
      for (const field of ["text", "image-prompt"] as const) {
        const tKey = `${slot.key}:${field}`;
        if (!newTemplates[tKey]) {
          newTemplates[tKey] = defaults[field];
          const fullKey = `${selectedPortion}:${tKey}`;
          onSave("book-templates", fullKey, defaults[field]);
          count++;
        }
      }
    }
    setTemplates(newTemplates);
    setFillingDefaults(false);
    toast.success(`Filled ${count} empty template fields with defaults`);
  };

  const handleCopyFrom = async () => {
    if (!copySource || !selectedPortion) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("*")
        .eq("category", "book-templates")
        .like("key", `${copySource}:%`);
      if (data && (data as any[]).length > 0) {
        const newTemplates: Record<string, string> = {};
        for (const row of data as any[]) {
          const suffix = row.key.replace(`${copySource}:`, "");
          newTemplates[suffix] = row.value;
          const fullKey = `${selectedPortion}:${suffix}`;
          onSave("book-templates", fullKey, row.value);
        }
        setTemplates(newTemplates);
        toast.success(`Copied ${(data as any[]).length} templates from ${copySource}`);
      } else {
        toast.info("No templates found for the source portion");
      }
    } catch {
      toast.error("Failed to copy templates");
    }
    setLoading(false);
  };

  const portionObj = TORAH_PORTIONS.find((p) => p.value === selectedPortion);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
      <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-accent" /> Per-Book Page Templates
      </h3>
      <p className="text-xs text-muted-foreground">
        Control the narrative text and image prompt for each page of each Torah portion/story. Empty fields = AI generates freely.
        <br />
        <span className="font-semibold">Variables:</span> <code className="text-[10px] bg-muted px-1 rounded">{"{childName}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{age}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{gender}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{artStyle}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{language}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{torahPortion}"}</code>
      </p>

      {/* Portion selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Select Portion / Story</label>
        <Select value={selectedPortion} onValueChange={setSelectedPortion}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Choose a Torah portion or story..." />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const items = groupedPortions[cat] || [];
              if (items.length === 0) return null;

              if (cat === "torah") {
                return TORAH_BOOKS.map((book) => {
                  const bookItems = items.filter((i) => i.book === book);
                  if (bookItems.length === 0) return null;
                  return (
                    <div key={book}>
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50">
                        {meta.emoji} {meta.label} — {book}
                      </div>
                      {bookItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.emoji} {p.label} — {p.sub}
                        </SelectItem>
                      ))}
                    </div>
                  );
                });
              }

              return (
                <div key={cat}>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    {meta.emoji} {meta.label}
                  </div>
                  {items.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.emoji} {p.label} — {p.sub}
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Copy from another portion + Fill defaults */}
      {selectedPortion && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-xs font-semibold text-foreground">Copy templates from another portion</label>
            <Select value={copySource} onValueChange={setCopySource}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select source..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TORAH_PORTIONS.filter((p) => p.value !== selectedPortion).map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.emoji} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={!copySource || loading}
            onClick={handleCopyFrom}>
            <Copy className="w-3 h-3" /> Copy
          </Button>
          <Button size="sm" variant="default" className="text-xs gap-1.5" disabled={fillingDefaults}
            onClick={handleFillDefaults}>
            {fillingDefaults ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
            Fill All Defaults
          </Button>
        </div>
      )}

      {/* Page editor grid */}
      {selectedPortion && loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
        </div>
      )}

      {selectedPortion && !loading && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
            {portionObj?.emoji} {portionObj?.label} <span className="text-muted-foreground font-normal">— {portionObj?.sub}</span>
          </div>

          {PAGE_SLOTS.map((slot) => {
            const textKey = `${slot.key}:text`;
            const imgKey = `${slot.key}:image-prompt`;
            const refImgKey = `${slot.key}:reference-image`;
            const refImgVal = templates[refImgKey] || "";
            const textVal = templates[textKey] || "";
            const imgVal = templates[imgKey] || "";
            const savingText = savingKey === `book-templates:${selectedPortion}:${textKey}`;
            const savingImg = savingKey === `book-templates:${selectedPortion}:${imgKey}`;
            const defaults = DEFAULT_PAGE_TEMPLATES[slot.key];
            const specType = slot.key === "cover" || slot.key === "back-cover" ? slot.key : "story";
            const specs = PRINT_SPECS[specType];

            return (
              <div key={slot.key} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-foreground">{slot.label}</p>
                  {specs && (
                    <div className="text-[9px] font-mono text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">
                      📐 {specs.cover || specs.page}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Narrative Text Template
                  </label>
                  <Textarea
                    value={textVal}
                    onChange={(e) => setTemplates((prev) => ({ ...prev, [textKey]: e.target.value }))}
                    rows={3}
                    className="text-xs font-mono"
                    placeholder={defaults?.text || (slot.key === "cover" ? "Title and subtitle template..." : slot.key === "back-cover" ? "Synopsis and dedication template..." : `Story text for ${slot.label}...`)}
                  />
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={savingText}
                    onClick={() => handleSaveSlot(slot.key, "text")}>
                    {savingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Text
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Image Prompt Template
                  </label>
                  <Textarea
                    value={imgVal}
                    onChange={(e) => setTemplates((prev) => ({ ...prev, [imgKey]: e.target.value }))}
                    rows={3}
                    className="text-xs font-mono"
                    placeholder={defaults?.["image-prompt"] || `Image generation prompt for ${slot.label}...`}
                  />
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={savingImg}
                    onClick={() => handleSaveSlot(slot.key, "image-prompt")}>
                    {savingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Image Prompt
                  </Button>
                </div>

                {/* Reference Image Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Reference Image (Scene Guide)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Upload a reference image so every book uses the same scene layout for this page — only the child character will change.
                  </p>
                  {refImgVal && refImgVal.trim() !== "" ? (
                    <div className="flex items-start gap-3">
                      <img src={refImgVal} alt="Reference" className="w-32 h-32 object-cover rounded-lg border border-border" />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" className="text-xs gap-1.5"
                          onClick={() => handleDeleteRefImage(slot.key)}>
                          <AlertTriangle className="w-3 h-3" /> Remove
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs gap-1.5"
                          disabled={uploadingRefKey === slot.key}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (f) handleUploadRefImage(slot.key, f);
                            };
                            input.click();
                          }}>
                          {uploadingRefKey === slot.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Replace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs gap-1.5"
                      disabled={uploadingRefKey === slot.key}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const f = (e.target as HTMLInputElement).files?.[0];
                          if (f) handleUploadRefImage(slot.key, f);
                        };
                        input.click();
                      }}>
                      {uploadingRefKey === slot.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload Reference Image
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main AdminCMS ─── */

export function AdminCMS() {
  const { settings, isLoading: settingsLoading, getSetting, upsertSetting } = useSiteSettings();
  const { assets, regenerateImage, uploadImage } = useSiteAssets();

  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({});
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});
  const [aiEdits, setAiEdits] = useState<Record<string, string>>({});
  const [pricingEdits, setPricingEdits] = useState<Record<string, string>>({});
  const [integrationEdits, setIntegrationEdits] = useState<Record<string, string>>({});
  const [seoEdits, setSeoEdits] = useState<Record<string, string>>({});
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [testingPrintify, setTestingPrintify] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!settingsLoading && settings.length > 0) {
      const prompts: Record<string, string> = {};
      const content: Record<string, string> = {};
      const ai: Record<string, string> = {};
      const pricing: Record<string, string> = {};
      const integrations: Record<string, string> = {};
      const seo: Record<string, string> = {};
      settings.forEach((s) => {
        if (s.category === "prompts") prompts[s.key] = s.value;
        if (s.category === "website") content[s.key] = s.value;
        if (s.category === "ai") ai[s.key] = s.value;
        if (s.category === "pricing") pricing[s.key] = s.value;
        if (s.category === "integrations") integrations[s.key] = s.value;
        if (s.category === "seo") seo[s.key] = s.value;
      });
      setPromptEdits(prompts);
      setContentEdits(content);
      setAiEdits(ai);
      setPricingEdits(pricing);
      setIntegrationEdits(integrations);
      setSeoEdits(seo);
    }
  }, [settingsLoading, settings]);

  const handleSave = async (category: string, key: string, value: string) => {
    setSavingKey(`${category}:${key}`);
    try {
      await upsertSetting.mutateAsync({ category, key, value });
      toast.success("Setting saved!");
    } catch {
      toast.error("Failed to save");
    }
    setSavingKey(null);
  };

  const handleRegenerate = async (assetKey: string, prompt: string) => {
    setRegeneratingKey(assetKey);
    try {
      await regenerateImage.mutateAsync({ assetKey, prompt });
      toast.success(`Image "${assetKey}" regenerated!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate image");
    }
    setRegeneratingKey(null);
  };

  const handleUpload = async (assetKey: string, file: File) => {
    setUploadingKey(assetKey);
    try {
      await uploadImage.mutateAsync({ assetKey, file });
      toast.success(`Image "${assetKey}" uploaded!`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    }
    setUploadingKey(null);
  };

  const handleTestPrintify = async () => {
    setTestingPrintify(true);
    try {
      const { data, error } = await supabase.functions.invoke("printify-submit", {
        body: { action: "test-connection" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Connected! Shop: ${data.shopName || data.shopId}`);
      } else {
        toast.error(data?.error || "Connection failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Test failed");
    }
    setTestingPrintify(false);
  };

  // Shared props for SettingField / ModelSelect
  const fieldProps = { onSave: handleSave, savingKey, getSetting };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="w-full grid grid-cols-9 mb-4 bg-secondary rounded-xl h-10">
          {[
            { val: "prompts", icon: Brain, label: "Prompts" },
            { val: "templates", icon: BookOpen, label: "Templates" },
            { val: "content", icon: Globe, label: "Content" },
            { val: "images", icon: ImageIcon, label: "Images" },
            { val: "branding", icon: Palette, label: "Branding" },
            { val: "ai", icon: Settings, label: "AI" },
            { val: "pricing", icon: DollarSign, label: "Pricing" },
            { val: "printify", icon: Printer, label: "Printify" },
            { val: "seo", icon: Search, label: "SEO" },
          ].map((t) => (
            <TabsTrigger key={t.val} value={t.val} className="text-[10px] gap-1 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <t.icon className="w-3 h-3" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PROMPTS */}
        <TabsContent value="prompts">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" /> Master AI Prompts
            </h3>
            <p className="text-xs text-muted-foreground">Edit the prompts that control how stories, images, and characters are generated.</p>
            <SettingField category="prompts" settingKey="story-system-prompt" label="Story Generation — System Prompt" multiline placeholder={DEFAULT_PROMPTS["story-system-prompt"]} edits={promptEdits} setEdits={setPromptEdits} {...fieldProps} />
            <SettingField category="prompts" settingKey="image-prompt-template" label="Image Generation — Prompt Template" multiline placeholder={DEFAULT_PROMPTS["image-prompt-template"]} edits={promptEdits} setEdits={setPromptEdits} {...fieldProps} />
            <SettingField category="prompts" settingKey="character-prompt-template" label="Character Preview — Prompt Template" multiline placeholder={DEFAULT_PROMPTS["character-prompt-template"]} edits={promptEdits} setEdits={setPromptEdits} {...fieldProps} />
          </div>
        </TabsContent>

        {/* BOOK TEMPLATES */}
        <TabsContent value="templates">
          <BookTemplatesTab onSave={handleSave} savingKey={savingKey} />
        </TabsContent>

        {/* WEBSITE CONTENT */}
        <TabsContent value="content">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" /> Website Content
            </h3>
            <p className="text-xs text-muted-foreground">Edit text across the entire website. Leave empty to use defaults.</p>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Navbar</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="brand-name" label="Brand Name" placeholder="Torah Tale" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="navbar-cta" label="Navbar CTA Button" placeholder="Create a Sefer" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Hero Section</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="hero-badge" label="Badge Text" placeholder="AI-Powered Torah Stories for Frum Kinderlach" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="hero-cta" label="CTA Button" placeholder="Begin the Journey" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="hero-price-text" label="Price Subtext" placeholder="From $34.99 · Ships in 5 days" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="hero-social-proof" label="Social Proof Text" placeholder="2,847+ Chareidi mishpachos" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="space-y-2 border border-border/50 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-muted-foreground">Slide {i + 1}</p>
                    <SettingField category="website" settingKey={`hero-slide-${i}-headline-1`} label={`Headline Line 1`} placeholder={`Slide ${i + 1} headline...`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                    <SettingField category="website" settingKey={`hero-slide-${i}-headline-2`} label={`Headline Line 2 (accent)`} placeholder={`Slide ${i + 1} accent...`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                    <SettingField category="website" settingKey={`hero-slide-${i}-description`} label={`Description`} placeholder={`Slide ${i + 1} description...`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">How It Works</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                {["01", "02", "03"].map((num, i) => (
                  <div key={num} className="space-y-2 border border-border/50 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-muted-foreground">Step {num}</p>
                    <SettingField category="website" settingKey={`how-step-${i}-title`} label="Title" placeholder={`Step ${num} title`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                    <SettingField category="website" settingKey={`how-step-${i}-desc`} label="Description" placeholder={`Step ${num} description`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Testimonials</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 border border-border/50 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-muted-foreground">Testimonial {i + 1}</p>
                    <SettingField category="website" settingKey={`testimonial-${i}-name`} label="Name" placeholder={`Name`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                    <SettingField category="website" settingKey={`testimonial-${i}-location`} label="Location" placeholder={`City, State`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                    <SettingField category="website" settingKey={`testimonial-${i}-text`} label="Quote" multiline placeholder={`Testimonial text...`} edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">CTA Section</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="cta-headline" label="Headline" placeholder="Every Yiddishe Kind Deserves to Be Part of the Story" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="cta-subtext" label="Subtext" placeholder="Powered by AI. Printed with ahavas Yisrael." edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="cta-button" label="Button Text" placeholder="Begin the Tale" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Footer</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="footer-tagline" label="Tagline" placeholder="AI-powered personalized children's seforim rooted in Torah wisdom." edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
                <SettingField category="website" settingKey="footer-copyright" label="Copyright" placeholder="Torah Tale. Made with ahavas Yisrael." edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Auth Page</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="auth-subtitle" label="Sign-In Subtitle" placeholder="Sign in to create personalized Torah seforim for your kinderlach" edits={contentEdits} setEdits={setContentEdits} {...fieldProps} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* IMAGES */}
        <TabsContent value="images">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" /> Site Images
            </h3>
            <p className="text-xs text-muted-foreground">Regenerate with AI or upload custom images.</p>

            <div className="space-y-4">
              {SITE_IMAGE_KEYS.map((img) => {
                const asset = assets.find((a) => a.asset_key === img.key);
                const prompt = imagePrompts[img.key] ?? asset?.prompt_used ?? img.defaultPrompt;
                const isGenerating = regeneratingKey === img.key || asset?.status === "generating";
                const isUploading = uploadingKey === img.key;

                return (
                  <div key={img.key} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{img.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{img.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset?.status === "ready" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Ready
                          </span>
                        )}
                        {asset?.status === "error" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Error
                          </span>
                        )}
                      </div>
                    </div>

                    {asset?.image_url && asset.status === "ready" && (
                      <img src={asset.image_url} alt={img.label} className="w-full max-w-xs rounded-lg border border-border" />
                    )}

                    <Textarea
                      value={prompt}
                      onChange={(e) => setImagePrompts({ ...imagePrompts, [img.key]: e.target.value })}
                      rows={3} className="text-xs" placeholder={img.defaultPrompt}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isGenerating}
                        onClick={() => handleRegenerate(img.key, prompt)}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {isGenerating ? "Generating..." : "Regenerate"}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[img.key] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(img.key, file);
                          e.target.value = "";
                        }}
                      />
                      <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isUploading}
                        onClick={() => fileInputRefs.current[img.key]?.click()}>
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button className="w-full gap-2" disabled={!!regeneratingKey} onClick={async () => {
              for (const img of SITE_IMAGE_KEYS) {
                const prompt = imagePrompts[img.key] ?? assets.find((a) => a.asset_key === img.key)?.prompt_used ?? img.defaultPrompt;
                await handleRegenerate(img.key, prompt);
              }
            }}>
              <RefreshCw className="w-4 h-4" /> Regenerate All Images (Sequential)
            </Button>
          </div>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" /> Branding
            </h3>
            <p className="text-xs text-muted-foreground">Upload your logo and favicon. These will be used across the site.</p>

            {["logo", "favicon"].map((key) => {
              const asset = assets.find((a) => a.asset_key === key);
              const isUploading = uploadingKey === key;
              return (
                <div key={key} className="border border-border rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground capitalize">{key === "favicon" ? "Favicon" : "Site Logo"}</p>
                  {asset?.image_url && asset.status === "ready" && (
                    <img src={asset.image_url} alt={key} className="w-24 h-24 rounded-lg border border-border object-contain bg-muted/30" />
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    ref={(el) => { fileInputRefs.current[`branding-${key}`] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(key, file);
                      e.target.value = "";
                    }}
                  />
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isUploading}
                    onClick={() => fileInputRefs.current[`branding-${key}`]?.click()}>
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* AI SETTINGS */}
        <TabsContent value="ai">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" /> AI Agent Settings
            </h3>
            <ModelSelect category="ai" settingKey="story-model" label="Story Generation Model" models={AI_MODELS} edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
            <ModelSelect category="ai" settingKey="image-model" label="Book Image Generation Model" models={IMAGE_MODELS} edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
            <ModelSelect category="ai" settingKey="site-image-model" label="Site Image Generation Model" models={IMAGE_MODELS} edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
            <SettingField category="ai" settingKey="story-temperature" label="Story Temperature (0-2)" placeholder="0.9" edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
            <SettingField category="ai" settingKey="default-page-count" label="Default Page Count" placeholder="4" edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
            <SettingField category="ai" settingKey="art-styles" label="Available Art Styles (comma-separated)" placeholder="cartoon,3d-pixar,realistic,graphic-novel" edits={aiEdits} setEdits={setAiEdits} {...fieldProps} />
          </div>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" /> Pricing & Plans
            </h3>
            <SettingField category="pricing" settingKey="weekly-price" label="Weekly Subscription ($)" placeholder="24.99" edits={pricingEdits} setEdits={setPricingEdits} {...fieldProps} />
            <SettingField category="pricing" settingKey="monthly-price" label="Monthly Subscription ($)" placeholder="79.99" edits={pricingEdits} setEdits={setPricingEdits} {...fieldProps} />
            <SettingField category="pricing" settingKey="yearly-price" label="Yearly Subscription ($)" placeholder="699.99" edits={pricingEdits} setEdits={setPricingEdits} {...fieldProps} />
            <SettingField category="pricing" settingKey="one-time-price" label="One-Time Purchase ($)" placeholder="34.99" edits={pricingEdits} setEdits={setPricingEdits} {...fieldProps} />
            <SettingField category="pricing" settingKey="subscription-discount" label="Subscription Discount (%)" placeholder="20" edits={pricingEdits} setEdits={setPricingEdits} {...fieldProps} />
          </div>
        </TabsContent>

        {/* PRINTIFY */}
        <TabsContent value="printify">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent" /> Printify Integration
            </h3>
            <p className="text-xs text-muted-foreground">
              Connect to Printify for automatic print-on-demand fulfillment. When a book is ordered, it will be sent to Printify automatically.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Enable Printify</label>
                <Switch
                  checked={integrationEdits["printify-enabled"] === "true"}
                  onCheckedChange={(checked) => {
                    const val = checked ? "true" : "false";
                    setIntegrationEdits({ ...integrationEdits, "printify-enabled": val });
                    handleSave("integrations", "printify-enabled", val);
                  }}
                />
              </div>

              <SettingField category="integrations" settingKey="printify-shop-id" label="Printify Shop ID" placeholder="Enter your Printify shop ID" edits={integrationEdits} setEdits={setIntegrationEdits} {...fieldProps} />
              <SettingField category="integrations" settingKey="printify-blueprint-id" label="Product Blueprint ID" placeholder="e.g. 635 for hardcover book" edits={integrationEdits} setEdits={setIntegrationEdits} {...fieldProps} />
              <SettingField category="integrations" settingKey="printify-print-provider-id" label="Print Provider ID" placeholder="e.g. 99" edits={integrationEdits} setEdits={setIntegrationEdits} {...fieldProps} />

              <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-2">
                <p className="text-xs font-semibold text-foreground">API Key</p>
                <p className="text-[10px] text-muted-foreground">
                  The Printify API key is stored as a secure secret. Add or update it in the secrets panel.
                </p>
              </div>

              <Button variant="outline" className="gap-2 text-xs" disabled={testingPrintify} onClick={handleTestPrintify}>
                {testingPrintify ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube2 className="w-3 h-3" />}
                Test Connection
              </Button>
            </div>
          </div>
        </TabsContent>
        {/* SEO & META TAGS */}
        <TabsContent value="seo">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Search className="w-5 h-5 text-accent" /> SEO & Meta Tags
            </h3>
            <p className="text-xs text-muted-foreground">
              Control how your site appears in search engines and social media. Changes apply instantly.
            </p>

            {/* General Meta */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">General Meta</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="seo" settingKey="title" label="Page Title (<title>)" placeholder="Torah Tale — Personalized Torah Storybooks" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="description" label="Meta Description" placeholder="AI-powered personalized Torah storybooks for frum Yiddishe kinderlach." edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="author" label="Author" placeholder="Torah Tale" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="canonical-url" label="Canonical URL" placeholder="https://torahtale.lovable.app" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
              </div>
            </div>

            {/* Open Graph */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Open Graph (Facebook / LinkedIn)</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="seo" settingKey="og-title" label="og:title" placeholder="Torah Tale — Personalized Torah Storybooks" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="og-description" label="og:description" placeholder="AI-powered personalized Torah storybooks for frum Yiddishe kinderlach." edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="og-type" label="og:type" placeholder="website" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="og-image" label="og:image (URL)" placeholder="https://..." edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="og-url" label="og:url" placeholder="https://torahtale.lovable.app" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
              </div>
            </div>

            {/* Twitter Card */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Twitter Card</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="seo" settingKey="twitter-card" label="twitter:card" placeholder="summary_large_image" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="twitter-site" label="twitter:site" placeholder="@TorahTale" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="twitter-title" label="twitter:title" placeholder="Torah Tale — Personalized Torah Storybooks" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="twitter-description" label="twitter:description" placeholder="AI-powered personalized Torah storybooks for frum Yiddishe kinderlach." edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="twitter-image" label="twitter:image (URL)" placeholder="https://..." edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Favicon</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Upload a favicon in the <strong>Branding</strong> tab. It will be applied automatically.
                </p>
                {(() => {
                  const faviconAsset = assets.find((a) => a.asset_key === "favicon");
                  return faviconAsset?.image_url && faviconAsset.status === "ready" ? (
                    <div className="flex items-center gap-3">
                      <img src={faviconAsset.image_url} alt="Current favicon" className="w-8 h-8 rounded border border-border" />
                      <span className="text-xs text-muted-foreground">Current favicon</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No custom favicon uploaded yet.</p>
                  );
                })()}
              </div>
            </div>

            {/* Robots / Indexing */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Robots & Verification</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="seo" settingKey="robots" label="Robots Meta Tag" placeholder="index, follow" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="google-verification" label="Google Site Verification Code" placeholder="google-site-verification code" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
                <SettingField category="seo" settingKey="bing-verification" label="Bing Site Verification Code" placeholder="msvalidate.01 code" edits={seoEdits} setEdits={setSeoEdits} {...fieldProps} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
