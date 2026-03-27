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
  Upload, Palette, Printer, TestTube2,
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function AdminCMS() {
  const { settings, isLoading: settingsLoading, getSetting, upsertSetting } = useSiteSettings();
  const { assets, regenerateImage, uploadImage } = useSiteAssets();

  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({});
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});
  const [aiEdits, setAiEdits] = useState<Record<string, string>>({});
  const [pricingEdits, setPricingEdits] = useState<Record<string, string>>({});
  const [integrationEdits, setIntegrationEdits] = useState<Record<string, string>>({});
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
      settings.forEach((s) => {
        if (s.category === "prompts") prompts[s.key] = s.value;
        if (s.category === "website") content[s.key] = s.value;
        if (s.category === "ai") ai[s.key] = s.value;
        if (s.category === "pricing") pricing[s.key] = s.value;
        if (s.category === "integrations") integrations[s.key] = s.value;
      });
      setPromptEdits(prompts);
      setContentEdits(content);
      setAiEdits(ai);
      setPricingEdits(pricing);
      setIntegrationEdits(integrations);
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
          onClick={() => handleSave(category, settingKey, val)}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
        </Button>
      </div>
    );
  };

  const ModelSelect = ({ category, settingKey, label, models, edits, setEdits }: {
    category: string; settingKey: string; label: string;
    models: { value: string; label: string }[];
    edits: Record<string, string>; setEdits: (v: Record<string, string>) => void;
  }) => {
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
          onClick={() => handleSave(category, settingKey, val)}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="w-full grid grid-cols-7 mb-4 bg-secondary rounded-xl h-10">
          {[
            { val: "prompts", icon: Brain, label: "Prompts" },
            { val: "content", icon: Globe, label: "Content" },
            { val: "images", icon: ImageIcon, label: "Images" },
            { val: "branding", icon: Palette, label: "Branding" },
            { val: "ai", icon: Settings, label: "AI" },
            { val: "pricing", icon: DollarSign, label: "Pricing" },
            { val: "printify", icon: Printer, label: "Printify" },
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
            <SettingField category="prompts" settingKey="story-system-prompt" label="Story Generation — System Prompt" multiline placeholder={DEFAULT_PROMPTS["story-system-prompt"]} edits={promptEdits} setEdits={setPromptEdits} />
            <SettingField category="prompts" settingKey="image-prompt-template" label="Image Generation — Prompt Template" multiline placeholder={DEFAULT_PROMPTS["image-prompt-template"]} edits={promptEdits} setEdits={setPromptEdits} />
            <SettingField category="prompts" settingKey="character-prompt-template" label="Character Preview — Prompt Template" multiline placeholder={DEFAULT_PROMPTS["character-prompt-template"]} edits={promptEdits} setEdits={setPromptEdits} />
          </div>
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
                <SettingField category="website" settingKey="brand-name" label="Brand Name" placeholder="MyTorahTale" edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="navbar-cta" label="Navbar CTA Button" placeholder="Create a Sefer" edits={contentEdits} setEdits={setContentEdits} />
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Hero Section</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="hero-badge" label="Badge Text" placeholder="AI-Powered Torah Stories for Frum Kinderlach" edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="hero-cta" label="CTA Button" placeholder="Begin the Journey" edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="hero-price-text" label="Price Subtext" placeholder="From $34.99 · Ships in 5 days" edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="hero-social-proof" label="Social Proof Text" placeholder="2,847+ Chareidi mishpachos" edits={contentEdits} setEdits={setContentEdits} />
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="space-y-2 border border-border/50 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-muted-foreground">Slide {i + 1}</p>
                    <SettingField category="website" settingKey={`hero-slide-${i}-headline-1`} label={`Headline Line 1`} placeholder={`Slide ${i + 1} headline...`} edits={contentEdits} setEdits={setContentEdits} />
                    <SettingField category="website" settingKey={`hero-slide-${i}-headline-2`} label={`Headline Line 2 (accent)`} placeholder={`Slide ${i + 1} accent...`} edits={contentEdits} setEdits={setContentEdits} />
                    <SettingField category="website" settingKey={`hero-slide-${i}-description`} label={`Description`} placeholder={`Slide ${i + 1} description...`} edits={contentEdits} setEdits={setContentEdits} />
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
                    <SettingField category="website" settingKey={`how-step-${i}-title`} label="Title" placeholder={`Step ${num} title`} edits={contentEdits} setEdits={setContentEdits} />
                    <SettingField category="website" settingKey={`how-step-${i}-desc`} label="Description" placeholder={`Step ${num} description`} edits={contentEdits} setEdits={setContentEdits} />
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
                    <SettingField category="website" settingKey={`testimonial-${i}-name`} label="Name" placeholder={`Name`} edits={contentEdits} setEdits={setContentEdits} />
                    <SettingField category="website" settingKey={`testimonial-${i}-location`} label="Location" placeholder={`City, State`} edits={contentEdits} setEdits={setContentEdits} />
                    <SettingField category="website" settingKey={`testimonial-${i}-text`} label="Quote" multiline placeholder={`Testimonial text...`} edits={contentEdits} setEdits={setContentEdits} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">CTA Section</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="cta-headline" label="Headline" placeholder="Every Yiddishe Kind Deserves to Be Part of the Story" edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="cta-subtext" label="Subtext" placeholder="Powered by AI. Printed with ahavas Yisrael." edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="cta-button" label="Button Text" placeholder="Begin the Tale" edits={contentEdits} setEdits={setContentEdits} />
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground">Footer</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="footer-tagline" label="Tagline" placeholder="AI-powered personalized children's seforim rooted in Torah wisdom." edits={contentEdits} setEdits={setContentEdits} />
                <SettingField category="website" settingKey="footer-copyright" label="Copyright" placeholder="MyTorahTale. Made with ahavas Yisrael." edits={contentEdits} setEdits={setContentEdits} />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Auth Page</h4>
              <div className="border-l-2 border-accent/20 pl-4 space-y-4">
                <SettingField category="website" settingKey="auth-subtitle" label="Sign-In Subtitle" placeholder="Sign in to create personalized Torah seforim for your kinderlach" edits={contentEdits} setEdits={setContentEdits} />
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
            <ModelSelect category="ai" settingKey="story-model" label="Story Generation Model" models={AI_MODELS} edits={aiEdits} setEdits={setAiEdits} />
            <ModelSelect category="ai" settingKey="image-model" label="Book Image Generation Model" models={IMAGE_MODELS} edits={aiEdits} setEdits={setAiEdits} />
            <ModelSelect category="ai" settingKey="site-image-model" label="Site Image Generation Model" models={IMAGE_MODELS} edits={aiEdits} setEdits={setAiEdits} />
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
            <SettingField category="pricing" settingKey="weekly-price" label="Weekly Subscription ($)" placeholder="24.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="monthly-price" label="Monthly Subscription ($)" placeholder="79.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="yearly-price" label="Yearly Subscription ($)" placeholder="699.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="one-time-price" label="One-Time Purchase ($)" placeholder="34.99" edits={pricingEdits} setEdits={setPricingEdits} />
            <SettingField category="pricing" settingKey="subscription-discount" label="Subscription Discount (%)" placeholder="20" edits={pricingEdits} setEdits={setPricingEdits} />
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

              <SettingField category="integrations" settingKey="printify-shop-id" label="Printify Shop ID" placeholder="Enter your Printify shop ID" edits={integrationEdits} setEdits={setIntegrationEdits} />
              <SettingField category="integrations" settingKey="printify-blueprint-id" label="Product Blueprint ID" placeholder="e.g. 635 for hardcover book" edits={integrationEdits} setEdits={setIntegrationEdits} />
              <SettingField category="integrations" settingKey="printify-print-provider-id" label="Print Provider ID" placeholder="e.g. 99" edits={integrationEdits} setEdits={setIntegrationEdits} />

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
      </Tabs>
    </div>
  );
}
