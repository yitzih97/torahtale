import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Settings, Image as ImageIcon, Brain, DollarSign,
  Save, Loader2, RefreshCw, Check, AlertTriangle, Globe,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { toast } from "sonner";

// Default prompts for fallback
const DEFAULT_PROMPTS: Record<string, string> = {
  "story-system-prompt": `You are a master storyteller for frum Yiddishe kinderlach in the Chareidi community. You write warm, engaging, age-appropriate stories that weave Torah wisdom into magical adventures. Every story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim, and ahavas Yisrael.

IMPORTANT CULTURAL RULES:
- Boys ALWAYS wear a yarmulke, have peyos (sidelocks), and tzitzis visible
- Girls ALWAYS wear long sleeves, long skirts below the knee, modest clothing
- Use Chareidi terminology naturally: Tatty, Mommy, Rebbe, Morah, davening, bentching, learning, Shabbos, Hashem, sefer/seforim, beis medrash, cheder/yeshiva, Bais Yaakov
- NO mention of TV, movies, video games, secular entertainment
- At least 70% of pages MUST depict ACTUAL events from the Torah portion in vivid detail`,
  "image-prompt-template": `A beautiful children's book illustration of a frum Yiddishe child named {childName} in a scene from the Torah story "{torahPortion}". {styleDesc}. Boys MUST have peyos (sidelocks), yarmulke/kippah, and visible tzitzis. Girls MUST wear long modest dresses with long sleeves and long skirts below the knee. Orthodox Jewish setting — no modern secular elements visible. Safe for children, warm and magical atmosphere, vibrant colors, no text in the image.`,
  "character-prompt-template": `Create a character portrait illustration of a {age}-year-old Jewish {gender} {ageDesc}. {genderDetails}. {descPart} Style: {style}. Children's book character design, bust/portrait view, clean white background, vibrant colors, warm and inviting. No text in the image.`,
};

const SITE_IMAGE_KEYS = [
  { key: "hero-scene-1", label: "Hero Scene 1 — Bereishis", defaultPrompt: "A breathtaking 3D Pixar-style illustration of Gan Eden with lush gardens, golden light, and a young frum Yiddishe girl with long modest dress exploring among friendly animals. Boys with peyos, yarmulke, tzitzis. Orthodox Jewish children's book style." },
  { key: "hero-scene-2", label: "Hero Scene 2 — Noach", defaultPrompt: "A stunning 3D Pixar-style illustration of Noach's Teivah (ark) with animals boarding two by two, a frum Yiddishe boy with peyos, yarmulke, and tzitzis helping gather animals. Warm magical atmosphere." },
  { key: "hero-scene-3", label: "Hero Scene 3 — Tower of Bavel", defaultPrompt: "A dramatic 3D Pixar-style illustration of the Tower of Bavel rising to the sky, with a young frum Yiddishe boy with peyos and yarmulke looking up in wonder. Orthodox Jewish children's book." },
  { key: "hero-scene-4", label: "Hero Scene 4 — Avraham's Stars", defaultPrompt: "A beautiful 3D Pixar-style night scene with Avraham Avinu and a young frum girl in modest long dress counting stars. Magical starry sky, warm lighting." },
  { key: "hero-scene-5", label: "Hero Scene 5 — Yosef's Coat", defaultPrompt: "A colorful 3D Pixar-style illustration of Yosef HaTzaddik in his coat of many colors with a frum boy with peyos, yarmulke, and tzitzis dreaming alongside him." },
  { key: "hero-scene-6", label: "Hero Scene 6 — Baby Moshe", defaultPrompt: "A serene 3D Pixar-style illustration of baby Moshe floating in a basket on the Nile River, with a frum girl in modest clothing watching from the reeds." },
  { key: "hero-scene-7", label: "Hero Scene 7 — Krias Yam Suf", defaultPrompt: "A spectacular 3D Pixar-style illustration of the splitting of the Yam Suf with towering walls of water and a golden path, a frum boy with peyos and tzitzis walking through." },
  { key: "hero-scene-8", label: "Hero Scene 8 — Har Sinai", defaultPrompt: "A majestic 3D Pixar-style illustration of Har Sinai with thunder and lightning, the Luchos visible, a frum girl in modest long dress standing in awe at Matan Torah." },
  { key: "hero-scene-9", label: "Hero Scene 9 — Dovid & Golyas", defaultPrompt: "A dramatic 3D Pixar-style illustration of young Dovid HaMelech with a slingshot facing Golyas, a frum boy with peyos and yarmulke watching with bitachon." },
  { key: "hero-scene-10", label: "Hero Scene 10 — Yonah", defaultPrompt: "A magical 3D Pixar-style illustration of Yonah HaNavi inside the great fish, with a frum girl in modest dress finding hope and light inside." },
  { key: "hero-boy", label: "Hero Boy Character", defaultPrompt: "A 3D Pixar-style character portrait of a cheerful 7-year-old Chareidi Jewish boy with peyos (sidelocks), yarmulke/kippah, and visible tzitzis. Clean white background, children's book style." },
  { key: "hero-girl", label: "Hero Girl Character", defaultPrompt: "A 3D Pixar-style character portrait of a cheerful 7-year-old Chareidi Jewish girl wearing a modest long-sleeved dress with long skirt below the knee, no head covering. Clean white background, children's book style." },
  { key: "story-noach", label: "Gallery — Noach", defaultPrompt: "A 3D Pixar-style book cover illustration: Noach's Teivah with animals, a rainbow (keshet), and frum Yiddishe kinderlach with peyos and tzitzis (boys) or modest dresses (girls). Vibrant, magical." },
  { key: "story-beshalach", label: "Gallery — Beshalach", defaultPrompt: "A 3D Pixar-style book cover: Krias Yam Suf with towering water walls and a golden path, frum Yiddishe kinderlach walking to freedom. Boys with peyos and tzitzis." },
  { key: "story-bereishit", label: "Gallery — Bereishis", defaultPrompt: "A 3D Pixar-style book cover: Gan Eden with golden light, friendly animals, lush gardens, and frum Yiddishe kinderlach exploring. Boys with peyos and yarmulke." },
];

export function AdminCMS() {
  const { settings, isLoading: settingsLoading, getSetting, upsertSetting } = useSiteSettings();
  const { assets, regenerateImage } = useSiteAssets();

  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({});
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});
  const [aiEdits, setAiEdits] = useState<Record<string, string>>({});
  const [pricingEdits, setPricingEdits] = useState<Record<string, string>>({});
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  // Initialize prompt edits from settings
  useEffect(() => {
    if (!settingsLoading && settings.length > 0) {
      const prompts: Record<string, string> = {};
      const content: Record<string, string> = {};
      const ai: Record<string, string> = {};
      const pricing: Record<string, string> = {};
      settings.forEach((s) => {
        if (s.category === "prompts") prompts[s.key] = s.value;
        if (s.category === "website") content[s.key] = s.value;
        if (s.category === "ai") ai[s.key] = s.value;
        if (s.category === "pricing") pricing[s.key] = s.value;
      });
      setPromptEdits(prompts);
      setContentEdits(content);
      setAiEdits(ai);
      setPricingEdits(pricing);
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

  const SettingField = ({ category, settingKey, label, multiline, placeholder, edits, setEdits }: {
    category: string; settingKey: string; label: string; multiline?: boolean; placeholder?: string;
    edits: Record<string, string>; setEdits: (v: Record<string, string>) => void;
  }) => {
    const val = edits[settingKey] ?? getSetting(category, settingKey, placeholder || "");
    const saving = savingKey === `${category}:${settingKey}`;
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {multiline ? (
          <Textarea
            value={val}
            onChange={(e) => setEdits({ ...edits, [settingKey]: e.target.value })}
            rows={8}
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
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5"
          disabled={saving}
          onClick={() => handleSave(category, settingKey, val)}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-4 bg-secondary rounded-xl h-10">
          <TabsTrigger value="prompts" className="text-[11px] gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Brain className="w-3.5 h-3.5" /> Prompts
          </TabsTrigger>
          <TabsTrigger value="content" className="text-[11px] gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Globe className="w-3.5 h-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger value="images" className="text-[11px] gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <ImageIcon className="w-3.5 h-3.5" /> Images
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-[11px] gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Settings className="w-3.5 h-3.5" /> AI
          </TabsTrigger>
          <TabsTrigger value="pricing" className="text-[11px] gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <DollarSign className="w-3.5 h-3.5" /> Pricing
          </TabsTrigger>
        </TabsList>

        {/* PROMPTS */}
        <TabsContent value="prompts">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" /> Master AI Prompts
            </h3>
            <p className="text-xs text-muted-foreground">
              Edit the prompts that control how stories, images, and character previews are generated. Changes apply to all new generations.
            </p>
            <SettingField
              category="prompts" settingKey="story-system-prompt" label="Story Generation — System Prompt"
              multiline placeholder={DEFAULT_PROMPTS["story-system-prompt"]}
              edits={promptEdits} setEdits={setPromptEdits}
            />
            <SettingField
              category="prompts" settingKey="image-prompt-template" label="Image Generation — Prompt Template"
              multiline placeholder={DEFAULT_PROMPTS["image-prompt-template"]}
              edits={promptEdits} setEdits={setPromptEdits}
            />
            <SettingField
              category="prompts" settingKey="character-prompt-template" label="Character Preview — Prompt Template"
              multiline placeholder={DEFAULT_PROMPTS["character-prompt-template"]}
              edits={promptEdits} setEdits={setPromptEdits}
            />
          </div>
        </TabsContent>

        {/* WEBSITE CONTENT */}
        <TabsContent value="content">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" /> Website Content
            </h3>
            <p className="text-xs text-muted-foreground">
              Edit text that appears on the website. Leave empty to use default values.
            </p>
            <SettingField category="website" settingKey="hero-badge" label="Hero Badge Text" placeholder="AI-Powered Torah Stories for Frum Kinderlach" edits={contentEdits} setEdits={setContentEdits} />
            <SettingField category="website" settingKey="hero-cta" label="Hero CTA Button" placeholder="Begin the Journey" edits={contentEdits} setEdits={setContentEdits} />
            <SettingField category="website" settingKey="cta-headline" label="CTA Section Headline" placeholder="Every Yiddishe Kind Deserves to Be Part of the Story" edits={contentEdits} setEdits={setContentEdits} />
            <SettingField category="website" settingKey="cta-subtext" label="CTA Section Subtext" placeholder="Powered by AI. Printed with ahavas Yisrael." edits={contentEdits} setEdits={setContentEdits} />
          </div>
        </TabsContent>

        {/* IMAGES */}
        <TabsContent value="images">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" /> Site Images
            </h3>
            <p className="text-xs text-muted-foreground">
              Regenerate site images with Chareidi-appropriate visuals. Each image will be generated using AI and stored for the website.
            </p>

            <div className="space-y-4">
              {SITE_IMAGE_KEYS.map((img) => {
                const asset = assets.find((a) => a.asset_key === img.key);
                const prompt = imagePrompts[img.key] ?? asset?.prompt_used ?? img.defaultPrompt;
                const isGenerating = regeneratingKey === img.key || asset?.status === "generating";

                return (
                  <div key={img.key} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{img.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{img.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset?.status === "ready" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Ready
                          </span>
                        )}
                        {asset?.status === "error" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center gap-1">
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
                      rows={3}
                      className="text-xs"
                      placeholder={img.defaultPrompt}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      disabled={isGenerating}
                      onClick={() => handleRegenerate(img.key, prompt)}
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {isGenerating ? "Generating..." : "Regenerate"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full gap-2"
              disabled={!!regeneratingKey}
              onClick={async () => {
                for (const img of SITE_IMAGE_KEYS) {
                  const prompt = imagePrompts[img.key] ?? assets.find((a) => a.asset_key === img.key)?.prompt_used ?? img.defaultPrompt;
                  await handleRegenerate(img.key, prompt);
                }
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate All Images (Sequential)
            </Button>
          </div>
        </TabsContent>

        {/* AI SETTINGS */}
        <TabsContent value="ai">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" /> AI Agent Settings
            </h3>
            <SettingField category="ai" settingKey="story-model" label="Story Generation Model" placeholder="gemini-2.5-pro" edits={aiEdits} setEdits={setAiEdits} />
            <SettingField category="ai" settingKey="story-temperature" label="Story Temperature (0-2)" placeholder="0.9" edits={aiEdits} setEdits={setAiEdits} />
            <SettingField category="ai" settingKey="default-page-count" label="Default Page Count" placeholder="4" edits={aiEdits} setEdits={setAiEdits} />
            <SettingField category="ai" settingKey="art-styles" label="Available Art Styles (comma-separated)" placeholder="cartoon,3d-pixar,realistic,graphic-novel" edits={aiEdits} setEdits={setAiEdits} />
          </div>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm space-y-6">
            <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" /> Pricing & Plans
            </h3>
            <SettingField category="pricing" settingKey="weekly-price" label="Weekly Subscription Price ($)" placeholder="24.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="monthly-price" label="Monthly Subscription Price ($)" placeholder="79.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="yearly-price" label="Yearly Subscription Price ($)" placeholder="699.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="one-time-price" label="One-Time Purchase Price ($)" placeholder="34.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="subscription-discount" label="Subscription Discount (%)" placeholder="20" edits={pricingEdits} setEdits={setPricingEdits} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
