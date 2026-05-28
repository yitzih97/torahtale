import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Loader2, Upload, Save, Wand2 } from "lucide-react";

/** Step keys + defaults — mirror the wizard order */
const DEFAULT_STEPS = [
  { key: "name", title: "What's your child's name?", subtitle: "We'll use this throughout the personalized story.", helper: "" },
  { key: "gender", title: "Is your child a boy or a girl?", subtitle: "Helps us pick the right pronouns and clothing.", helper: "" },
  { key: "age", title: "How old is your child?", subtitle: "We'll adjust the reading level and visuals.", helper: "" },
  { key: "style", title: "Pick an illustration style", subtitle: "This is the look and feel of your book.", helper: "" },
  { key: "photo", title: "Upload your child's photo", subtitle: "We'll turn them into the hero of the story.", helper: "Clear, front-facing photos work best." },
  { key: "parsha", title: "Choose a parsha", subtitle: "Pick this week's portion or any favorite.", helper: "" },
  { key: "details", title: "Add personal details", subtitle: "Small touches make a big difference.", helper: "" },
  { key: "review", title: "Ready to create", subtitle: "Review and let the magic begin.", helper: "" },
];

const CATEGORY = "wizard";

interface Row {
  key: string;
  title: string;
  subtitle: string;
  helper: string;
  iconUrl: string;
  visible: boolean;
  order: number;
}

export function WizardStepsTab() {
  const { settings, isLoading, upsertSetting } = useSiteSettings(CATEGORY);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const get = (key: string, fallback: string) =>
      settings.find((s) => s.category === CATEGORY && s.key === key)?.value ?? fallback;

    const list = DEFAULT_STEPS.map((d, i) => ({
      key: d.key,
      title: get(`step.${d.key}.title`, d.title),
      subtitle: get(`step.${d.key}.subtitle`, d.subtitle),
      helper: get(`step.${d.key}.helper`, d.helper),
      iconUrl: get(`step.${d.key}.icon_url`, ""),
      visible: get(`step.${d.key}.visible`, "true") !== "false",
      order: Number(get(`step.${d.key}.order`, String(i))),
    }));
    return list.sort((a, b) => a.order - b.order);
  }, [settings]);

  const [drafts, setDrafts] = useState<Record<string, Partial<Row>>>({});
  const draftFor = (key: string): Row => {
    const base = rows.find((r) => r.key === key)!;
    return { ...base, ...drafts[key] };
  };
  const setDraft = (key: string, patch: Partial<Row>) =>
    setDrafts((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const saveField = async (key: string, field: keyof Row, value: string) => {
    setSavingKey(`${key}.${field}`);
    try {
      const settingKey =
        field === "iconUrl" ? `step.${key}.icon_url` :
        field === "visible" ? `step.${key}.visible` :
        field === "order"   ? `step.${key}.order`   :
                              `step.${key}.${field}`;
      await upsertSetting.mutateAsync({ category: CATEGORY, key: settingKey, value });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  const saveAll = async (key: string) => {
    const d = drafts[key];
    if (!d) return;
    const current = rows.find((r) => r.key === key)!;
    const tasks: Promise<unknown>[] = [];
    if (d.title !== undefined && d.title !== current.title)
      tasks.push(saveField(key, "title", d.title));
    if (d.subtitle !== undefined && d.subtitle !== current.subtitle)
      tasks.push(saveField(key, "subtitle", d.subtitle));
    if (d.helper !== undefined && d.helper !== current.helper)
      tasks.push(saveField(key, "helper", d.helper));
    await Promise.all(tasks);
    setDrafts((all) => ({ ...all, [key]: {} }));
  };

  const move = async (key: string, dir: -1 | 1) => {
    const ordered = [...rows];
    const idx = ordered.findIndex((r) => r.key === key);
    const swap = idx + dir;
    if (swap < 0 || swap >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[swap];
    await Promise.all([
      upsertSetting.mutateAsync({ category: CATEGORY, key: `step.${a.key}.order`, value: String(b.order) }),
      upsertSetting.mutateAsync({ category: CATEGORY, key: `step.${b.key}.order`, value: String(a.order) }),
    ]);
  };

  const toggleVisible = async (key: string, value: boolean) => {
    await upsertSetting.mutateAsync({
      category: CATEGORY,
      key: `step.${key}.visible`,
      value: String(value),
    });
  };

  const uploadIcon = async (key: string, file: File) => {
    setUploadingKey(key);
    try {
      const path = `wizard-icons/${key}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      await upsertSetting.mutateAsync({
        category: CATEGORY,
        key: `step.${key}.icon_url`,
        value: data.publicUrl,
      });
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const generateIcon = async (key: string) => {
    setUploadingKey(key);
    try {
      const prompt = `A minimal monochrome line icon representing "${key}" for a children's book creation wizard step, single graphite stroke on white background, Apple-inspired liquid glass aesthetic, centered, 512x512`;
      const { data, error } = await supabase.functions.invoke("generate-site-image", {
        body: { key: `wizard-step-${key}`, prompt, bucket: "site-images" },
      });
      if (error) throw error;
      if (data?.url) {
        await upsertSetting.mutateAsync({
          category: CATEGORY,
          key: `step.${key}.icon_url`,
          value: data.url,
        });
        toast.success("Icon generated");
      } else {
        toast.error("No URL returned");
      }
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setUploadingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm">
        <h3 className="font-display text-lg font-semibold text-primary flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-accent" /> Creation Wizard — Steps
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Edit titles, subtitles, helper text, icons, visibility and order for each wizard step.
        </p>
      </div>

      {rows.map((row, i) => {
        const d = draftFor(row.key);
        const dirty = !!drafts[row.key] && Object.values(drafts[row.key]).some((v) => v !== undefined);
        return (
          <div
            key={row.key}
            className="bg-card rounded-2xl border border-border p-5 shadow-soft-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm capitalize">{row.key}</div>
                  <div className="text-[11px] text-muted-foreground">step.{row.key}.*</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => move(row.key, -1)} disabled={i === 0}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(row.key, 1)} disabled={i === rows.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2 ml-2">
                  <Label className="text-xs text-muted-foreground">Visible</Label>
                  <Switch checked={row.visible} onCheckedChange={(v) => toggleVisible(row.key, v)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  value={d.title}
                  onChange={(e) => setDraft(row.key, { title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subtitle</Label>
                <Input
                  value={d.subtitle}
                  onChange={(e) => setDraft(row.key, { subtitle: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs">Helper / body text</Label>
                <Textarea
                  rows={2}
                  value={d.helper}
                  onChange={(e) => setDraft(row.key, { helper: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {row.iconUrl ? (
                  <img src={row.iconUrl} alt={row.key} className="w-12 h-12 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-secondary border border-border" />
                )}
                <div className="text-[11px] text-muted-foreground max-w-[160px] truncate">
                  {row.iconUrl || "No icon override"}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadIcon(row.key, f);
                  }}
                />
                <Button asChild variant="outline" size="sm" disabled={uploadingKey === row.key}>
                  <span>
                    {uploadingKey === row.key ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Upload icon
                  </span>
                </Button>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateIcon(row.key)}
                disabled={uploadingKey === row.key}
              >
                <Wand2 className="w-4 h-4 mr-1" /> Generate
              </Button>
              {row.iconUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveField(row.key, "iconUrl", "")}
                >
                  Clear
                </Button>
              )}
              <div className="ml-auto">
                <Button size="sm" onClick={() => saveAll(row.key)} disabled={!dirty || !!savingKey}>
                  {savingKey?.startsWith(row.key) ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save text
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
