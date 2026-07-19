import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, X, Wand2, Sparkles, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookLoadingSkeleton } from "./BookLoadingSkeleton";
import type { TextStyle } from "./DraggableText";
import { EditableTextBox, DEFAULT_TEXT_LAYOUT, makeDefaultLayout, makeQuestionsLayout, migrateLayout, type TextLayout } from "./EditableTextBox";
import { computeAutoTextLayout } from "@/lib/analyzeImageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandMark } from "@/components/BrandMark";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPortionDisplay, bookLanguageCode, isBookRtl } from "./TorahPortions";
import { COVER_NAVY, COVER_GOLD, COVER_MAGENTA, FRONT_TAGLINE, coverTitleParts } from "@/lib/coverBranding";
import { toLineArtDataURL } from "@/lib/lineArt";

export interface BookPage {
  id: number;
  text: string;
  image: string | null;
  imageLoading?: boolean;
  type?: "cover" | "story" | "back-cover" | "questions" | "preview";
  /** For a "preview" page: the upcoming portion value this teaser illustrates. */
  portion?: string;
  coverTitle?: string;
  coverSubtitle?: string;
  /** Editable back-cover blurb (one line per row). Falls back to COVER_TAGLINE. */
  backCoverText?: string;
  synopsis?: string;
  dedication?: string;
  questions?: { number: number; question: string }[];
  textStyle?: TextStyle;
  textLayout?: TextLayout;
}

export type { TextLayout } from "./EditableTextBox";

/**
 * Legacy default text style — kept for backward-compatible code that
 * predates the per-page `textLayout` field.
 */
export const BOOK_TEXT_STYLE = {
  fontFamily: DEFAULT_TEXT_LAYOUT.fontFamily,
  fontSizePx: DEFAULT_TEXT_LAYOUT.fontSize,
  color: DEFAULT_TEXT_LAYOUT.color,
  bgColor: "rgba(252, 247, 236, 0.94)",
  lineHeight: 1.5,
  padding: 22,
  borderRadius: 18,
};

export const COVER_TAGLINE = ["Visit our website &", "Subscribe to receive", "Weekly Parshah Stories"];
export const COVER_URL = "torahtale.com";

/** Back-cover subscribe invitation, localized to the BOOK's language. Falls back
 *  to English. The site URL stays as-is (it's a domain). */
export const COVER_TAGLINE_BY_LANG: Record<"en" | "he" | "yi", string[]> = {
  en: COVER_TAGLINE,
  he: ["בקרו באתר שלנו", "והירשמו לקבלת", "סיפורי פרשת השבוע"],
  yi: ["באזוכט אונדזער וועבזייטל", "און אבאנירט צו באקומען", "וועכנטלעכע פרשה מעשיות"],
};
export const getCoverTagline = (lang: "en" | "he" | "yi"): string[] =>
  COVER_TAGLINE_BY_LANG[lang] || COVER_TAGLINE;

/** Cover text styling — the book name + kids render in Inter, white, with a soft
 *  drop shadow (matching the story captions) over the illustration. */
export const COVER_FONT = "'Inter', system-ui, sans-serif";
export const COVER_TEXT_SHADOW = "0 2px 8px rgba(0,0,0,0.6)";

/** "Coming next" heading above the back-cover teasers, per book language. */
export const COMING_NEXT_LABEL: Record<"en" | "he" | "yi", string> = {
  en: "Coming next",
  he: "בקרוב",
  yi: "קומט נאכדעם",
};

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  /** The BOOK's language ("english" | "hebrew" | "yiddish"). Cover + captions
   *  render in this language regardless of the admin/customer UI language. */
  language?: string;
  pages: BookPage[];
  onPagesChange: (pages: BookPage[]) => void;
  /** When true (admin), shows editing/regen controls. Customer views are read-only. */
  editable?: boolean;
  generationContext?: {
    childDescription?: string;
    referenceImage?: string | null;
    characterSheet?: string | null;
    characterSheets?: Record<string, string>;
    bookFormat?: string;
    childRefs?: Array<{
      name: string;
      age?: string | number;
      gender?: string;
      description?: string;
      photoUrl?: string | null;
      characterSheet?: string | null;
    }>;
    /** Recurring Torah-story characters (Moshe, Dovid, …) with fixed look. */
    storyCharacters?: Array<{ name: string; description: string; sheet?: string | null }>;
  };
}

export const BookViewer = ({ childName, torahPortion, artStyle, language, pages, onPagesChange, editable = false, generationContext }: Props) => {
  const { dir: uiDir, lang: uiLang } = useLanguage();
  // Cover text and captions follow the BOOK's own language (Hebrew/Yiddish
  // books read RTL and show Hebrew parsha names) — not the viewer's UI language.
  // Fall back to the UI language for legacy callers that don't pass one.
  const lang = language ? bookLanguageCode(language) : uiLang;
  const isRtl = language ? isBookRtl(language) : uiDir === "rtl";
  const dir = isRtl ? "rtl" : "ltr";

  // Cover text: the Parasha name is the hero (big), the kids are the co-stars
  // (small). Derived from the book's portion + child names, so this applies to
  // every book — new and existing — without depending on stored cover titles.
  const parashaName = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  // Default text side: over the open sky on the reading-start side.
  const defaultTextSide: "left" | "right" = isRtl ? "right" : "left";

  // Board books (6×6) are spread-based: one wide illustration per open spread.
  // Softcover/Hardcover (8×8) are page-based: one square illustration per page.
  // A genuine board book is 10 spreads; a "board" book carrying far more pages
  // was mis-flagged (softcover/hardcover run 20/24 pages), so treat it as
  // page-based (separate square pages) rather than wide spreads.
  const storyCount = pages.filter((p) => p.type === "story" || !p.type).length;
  const spreadBased = (generationContext?.bookFormat || "").startsWith("board") && storyCount <= 12;
  // Coloring book (8.5×11): tall portrait line-art pages + a portrait front
  // cover (no wraparound back/spine like the bound 8×8 books).
  const isColoring = (generationContext?.bookFormat || "").startsWith("coloring");

  // Hide any legacy "back-cover" pages — the cover spread renders both sides.
  const displayPages = pages.filter((p) => p.type !== "back-cover");
  // The "coming next" teasers, shown as editable mini-covers ON the back cover
  // (and still navigable as their own pages for full editing).
  const previewPages = pages.filter((p) => p.type === "preview");

  const [currentPage, setCurrentPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  // Cover text editor (front title/subtitle + back-cover blurb)
  const [coverEditOpen, setCoverEditOpen] = useState(false);
  const [coverTitleDraft, setCoverTitleDraft] = useState("");
  const [coverSubtitleDraft, setCoverSubtitleDraft] = useState("");
  const [backTextDraft, setBackTextDraft] = useState("");
  // Auto-computed text layout per page (from the illustration's clear space),
  // used as the default when the admin hasn't manually positioned the text.
  const [autoLayouts, setAutoLayouts] = useState<Record<number, TextLayout>>({});
  const spreadRef = useRef<HTMLDivElement>(null);

  const safeIndex = Math.min(currentPage, Math.max(displayPages.length - 1, 0));
  const page = displayPages[safeIndex];
  const pageType = page?.type || "story";

  // Coloring interior pages are stored as the raw 2K colour generation; convert
  // the current one to clean B&W line art in the browser so the preview matches
  // what actually prints (the same conversion runs in generateBookPdf). Only
  // interior story pages — the coloring cover stays full colour.
  const isColoringStoryPage = isColoring && !!page && (page.type === "story" || !page.type);
  const [lineArtSrc, setLineArtSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (isColoringStoryPage && page?.image) {
      toLineArtDataURL(page.image).then((url) => { if (!cancelled) setLineArtSrc(url); });
    } else {
      setLineArtSrc(null);
    }
    return () => { cancelled = true; };
  }, [isColoringStoryPage, page?.id, page?.image]);

  const updatePage = (id: number, patch: Partial<BookPage>) => {
    onPagesChange(pages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  // Drop a single story page — e.g. to bring an older book's interior page
  // count back down to its Printify blueprint's print-slot capacity (a book
  // generated before a page-budget fix can carry one extra image and get
  // rejected at submit time). Story pages only — never the cover or the
  // discussion-questions page.
  const deletePage = (id: number) => {
    const storyPages = pages.filter((p) => p.type === "story" || !p.type);
    if (storyPages.length <= 1) {
      toast.error("Can't delete the last story page");
      return;
    }
    if (!window.confirm("Delete this page? This can't be undone (you can Quick Regen a fresh page in its place instead).")) return;
    onPagesChange(pages.filter((p) => p.id !== id));
    setCurrentPage((p) => Math.max(0, p - 1));
    toast.success("Page deleted");
  };

  // "Apply to all": copy the STYLE of one caption (font, size, colour, outline,
  // border, shadow, alignment — never its position) onto every story/questions
  // page, so the whole book matches with one click.
  const STYLE_KEYS: (keyof TextLayout)[] = [
    "fontFamily", "fontSize", "color", "align", "bold", "italic",
    "background", "border", "borderColor", "outlineWidth", "outlineColor", "shadow",
  ];
  const applyStyleToAll = (src: TextLayout) => {
    const stylePatch: Partial<TextLayout> = {};
    for (const k of STYLE_KEYS) (stylePatch as any)[k] = src[k];
    onPagesChange(pages.map((p) => {
      if (p.type === "cover" || p.type === "back-cover") return p;
      const base = p.textLayout || autoLayouts[p.id]
        || (p.type === "questions" ? makeQuestionsLayout(isRtl) : makeDefaultLayout(defaultTextSide, isRtl));
      return { ...p, textLayout: { ...base, ...stylePatch } };
    }));
    toast.success("Style applied to all pages");
  };

  const startEdit = () => {
    if (!page) return;
    setEditingId(page.id);
    setEditText(page.text || "");
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updatePage(editingId, { text: editText });
    setEditingId(null);
    toast.success("Text updated");
  };

  const startCoverEdit = () => {
    if (!page) return;
    // Pre-fill with what's actually shown (localized parsha name + kids) so the
    // admin edits from the visible text rather than a blank field.
    setCoverTitleDraft(page.coverTitle?.trim() || parashaName);
    setCoverSubtitleDraft(page.coverSubtitle?.trim() || childName);
    setBackTextDraft(
      page.backCoverText && page.backCoverText.trim() ? page.backCoverText : getCoverTagline(lang).join("\n"),
    );
    setCoverEditOpen(true);
  };

  const saveCoverEdit = () => {
    if (!page) return;
    updatePage(page.id, {
      coverTitle: coverTitleDraft,
      coverSubtitle: coverSubtitleDraft,
      // Keep title/text in sync — the cover page's `text` mirrors the title elsewhere.
      text: coverTitleDraft,
      backCoverText: backTextDraft,
    });
    setCoverEditOpen(false);
    toast.success("Cover text updated");
  };

  const openPromptEditor = () => {
    if (!page) return;
    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting",
      "graphic-novel": "graphic novel, bold ink lines, flat colors",
    };
    const previewPortion = page.type === "preview" ? (getPortionDisplay(page.portion || "", lang) || page.portion || "") : "";
    const desc = page.type === "cover"
      ? `Book cover for "${page.coverTitle}". ${page.coverSubtitle || ""}`
      : page.type === "preview"
        ? `Front cover for ${previewPortion}`
        : page.text;
    const storyRef = page.type === "preview" ? previewPortion : torahPortion;
    const defaultPrompt = `A beautiful children's book illustration that fills a 2:1 landscape spread. ${desc}. Characters: children named ${childName}. Torah story: ${storyRef}. Style: ${styleMap[artStyle] || styleMap.cartoon}. Composition: subject centered, with breathing room on both halves so text can sit over one side. Safe for children, warm magical atmosphere, vibrant colors.`;
    setCustomPrompt(defaultPrompt);
    setShowPromptEditor(true);
  };

  const regenImage = async (prompt?: string, target?: BookPage) => {
    const tgt = target || page;
    if (!tgt) return;
    setRegeneratingId(tgt.id);
    setShowPromptEditor(false);
    try {
      const finalPrompt = prompt || customPrompt;
      // A "preview" teaser is a cover for a DIFFERENT (upcoming) parsha — render it
      // as a cover for that portion, without this story's recurring characters.
      const isPreview = tgt.type === "preview";
      const targetType = isPreview ? "cover" : (tgt.type || "story");
      const effPortion = isPreview ? (tgt.portion || torahPortion) : torahPortion;
      const storyPages = pages.filter((p) => p.type === "story");
      const pageNumber = tgt.type === "story" ? storyPages.findIndex((p) => p.id === tgt.id) + 1 : undefined;
      // Recurring Torah characters named on this page (all on the cover) — pass
      // their fixed descriptions + sheets so a single-page regen keeps them
      // looking the same as the rest of the book.
      const pageTextLc = String(tgt.text || "").toLowerCase();
      const storyCharacterRefs = isPreview ? [] : (generationContext?.storyCharacters || [])
        .filter((ch) => ch?.name && (targetType === "cover" || pageTextLc.includes(ch.name.toLowerCase())))
        .map((ch) => ({ name: ch.name, description: ch.description || "", sheet: ch.sheet || null }));
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          promptAdditions: finalPrompt
            ? `${finalPrompt}. NON-NEGOTIABLE: preserve the exact same child face, age, body size, clothing, and all age-specific rules from the existing book across this regenerated page.`
            : undefined,
          childName,
          artStyle,
          torahPortion: effPortion,
          bookFormat: generationContext?.bookFormat,
          pageType: targetType,
          pageNumber,
          pageText: tgt.text,
          childDescription: generationContext?.childDescription,
          referenceImage: generationContext?.referenceImage,
          characterSheet: generationContext?.characterSheet,
          characterSheets: generationContext?.characterSheets,
          childRefs: generationContext?.childRefs,
          storyCharacterRefs,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      updatePage(tgt.id, { image: data.imageUrl });
      toast.success("Image regenerated!");
    } catch (err: any) {
      console.error("Image regen failed:", err);
      toast.error(err?.message || "Failed to regenerate image.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const getPageLabel = () => {
    if (pageType === "cover") return isColoring ? "Front Cover" : "Cover (Back · Front)";
    if (pageType === "questions") return "Discussion Page";
    if (pageType === "preview") return `Back-cover teaser · ${getPortionDisplay(page?.portion || "", lang) || page?.portion || ""}`;
    const storyPages = displayPages.filter((p) => p.type === "story");
    const storyIdx = storyPages.findIndex((p) => p.id === page?.id);
    const unit = spreadBased ? "Spread" : "Page";
    return `${unit} ${storyIdx + 1} of ${storyPages.length}`;
  };

  const isRegenThis = page && regeneratingId === page.id;

  /* ── Renderers ───────────────────────────────────────────────────── */

  // One "coming next" teaser, styled like a miniature front cover (illustration
  // + localized parsha name + kids). In editable mode each can be regenerated in
  // place, or opened as its own page for a full Custom-Prompt edit.
  const renderMiniCover = (pv: BookPage) => {
    const pvLabel = getPortionDisplay(pv.portion || "", lang) || pv.portion || "";
    const pvIdx = displayPages.findIndex((p) => p.id === pv.id);
    const regenning = regeneratingId === pv.id;
    return (
      <button
        key={pv.id}
        type="button"
        onClick={() => { if (editable && pvIdx >= 0) setCurrentPage(pvIdx); }}
        title={editable ? `Open & edit — ${pvLabel}` : pvLabel}
        className={`group relative block aspect-square w-full overflow-hidden rounded-md bg-muted shadow-soft-sm ring-1 ring-black/10 ${editable ? "cursor-pointer" : "cursor-default"}`}
      >
        {pv.image ? (
          <img src={pv.image} alt={pvLabel} crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover" />
        ) : pv.imageLoading ? (
          <BookLoadingSkeleton type="story" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
        )}
        {/* Mini front-cover text band */}
        <div className="absolute inset-x-0 top-0 px-0.5 pb-2 pt-0.5 bg-gradient-to-b from-black/65 to-transparent text-center" dir={dir}>
          <p className="font-extrabold leading-tight text-white text-[6px] sm:text-[8px]" style={{ fontFamily: COVER_FONT, textShadow: COVER_TEXT_SHADOW }}>{pvLabel}</p>
          {childName && (
            <p className="leading-tight text-white/85 text-[5px] sm:text-[6px]" style={{ fontFamily: COVER_FONT, textShadow: COVER_TEXT_SHADOW }}>{childName}</p>
          )}
        </div>
        {regenning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45"><RefreshCw className="h-3.5 w-3.5 animate-spin text-white" /></div>
        )}
        {editable && !regenning && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); if (regeneratingId === null) regenImage(undefined, pv); }}
            title="Regenerate this teaser"
            className="absolute bottom-0.5 right-0.5 flex items-center justify-center rounded-full bg-black/65 p-0.5 text-white opacity-0 transition-opacity hover:bg-black/85 group-hover:opacity-100"
          >
            <RefreshCw className="h-2.5 w-2.5" />
          </span>
        )}
      </button>
    );
  };

  // Spine label — the localized Parasha name + kids' names, printed down the
  // book's edge (mirrors the front cover, so it follows the book's language).
  const spineLabel = `${parashaName}${childName ? `  ${childName}` : ""}`;

  // Majestic front-cover chrome — navy filigree frame, gold engraved parsha
  // title, magenta personalized title/child line, gold tagline. Shared with
  // the print/PDF renderer (generateBookPdf.ts) via coverBranding.ts so this
  // on-screen preview always matches what actually gets printed.
  const renderCoverChrome = (title?: string, childLine?: string) => (
    <div className="absolute inset-0 pointer-events-none" dir={dir}>
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[rgba(8,14,30,0.82)] via-[rgba(8,14,30,0.32)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-[rgba(8,14,30,0.72)] to-transparent" />

      {/* Navy frame + gold double keyline */}
      <div className="absolute" style={{ inset: "3%", border: `6px solid ${COVER_NAVY}` }} />
      <div className="absolute" style={{ inset: "4.6%", border: `2px solid ${COVER_GOLD}` }} />
      <div className="absolute" style={{ inset: "5.1%", border: "1px solid rgba(227,193,105,0.5)" }} />

      {/* Corner flourishes */}
      <span className="absolute top-[6%] left-[6%] text-sm sm:text-lg" style={{ color: COVER_GOLD }}>❦</span>
      <span className="absolute top-[6%] right-[6%] text-sm sm:text-lg" style={{ color: COVER_GOLD }}>❦</span>
      <span className="absolute bottom-[6%] right-[6%] text-sm sm:text-lg" style={{ color: COVER_GOLD }}>❦</span>
      <span className="absolute bottom-[6%] left-[6%] text-sm sm:text-lg" style={{ color: COVER_GOLD }}>❦</span>

      <div className="absolute inset-x-0 top-[7%] text-center px-3">
        <p className="font-semibold uppercase tracking-[0.3em] text-[9px] sm:text-sm" style={{ fontFamily: "'Cinzel', serif", color: COVER_GOLD }}>
          Torah Tale
        </p>
        <div className="mt-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs" style={{ color: COVER_GOLD }}>
          <span className="h-px w-5 sm:w-6 bg-current opacity-70" /><span>❦</span><span className="h-px w-5 sm:w-6 bg-current opacity-70" />
        </div>
      </div>

      <div className="absolute inset-x-0 top-[15%] sm:top-[16%] text-center px-4">
        <h1
          className="font-bold uppercase leading-tight text-lg sm:text-3xl"
          style={{
            fontFamily: "'Cinzel', serif",
            backgroundImage: "linear-gradient(180deg, #fff6d5 0%, #f6df97 28%, #e7be5c 50%, #c9992f 72%, #a9791f 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 2px 3px rgba(0,0,0,0.45)",
          }}
        >
          {parashaName.toUpperCase()}
        </h1>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs" style={{ color: COVER_GOLD }}>
          <span className="h-px w-7 sm:w-8 bg-current opacity-70" /><span>❦</span><span className="h-px w-7 sm:w-8 bg-current opacity-70" />
        </div>
        {title && (
          <p
            className="mt-1.5 italic font-semibold text-sm sm:text-xl"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: COVER_MAGENTA, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
          >
            {title}
          </p>
        )}
        {childLine && (
          <p
            className="mt-0.5 italic text-[11px] sm:text-base"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,240,214,0.95)", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            {childLine}
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-[6%] text-center px-3">
        <div className="mb-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs" style={{ color: COVER_GOLD }}>
          <span className="h-px w-5 sm:w-6 bg-current opacity-70" /><span>❦</span><span className="h-px w-5 sm:w-6 bg-current opacity-70" />
        </div>
        <p className="italic text-[9px] sm:text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", color: COVER_GOLD, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
          {FRONT_TAGLINE}
        </p>
      </div>
    </div>
  );

  // Coloring-book cover: a single 8.5×11 portrait front cover (line-art image +
  // title band), matching the print output — no wraparound back/spine.
  const renderColoringCover = () => {
    return (
      <div className="absolute inset-0 bg-white">
        {page?.image ? (
          <img src={page.image} alt={page.coverTitle || ""} className="absolute inset-0 w-full h-full object-cover" />
        ) : page?.imageLoading ? (
          <BookLoadingSkeleton type="cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-10 h-10 text-muted-foreground" /></div>
        )}
        {renderCoverChrome(childName)}
      </div>
    );
  };

  const renderCoverSpread = () => {
    // Front cover text: the gold parsha title always shows; the magenta
    // personalized title/child line follow the same coverTitleParts logic as
    // the print renderer (falls back to the child's name when there's no
    // creative title, or it just repeats the parsha).
    const { title: frontTitle, childLine } = coverTitleParts(page?.coverTitle, childName, parashaName);
    return (
    <div className="absolute inset-0 grid grid-cols-2">
      {/* Back cover — left: brand logo, the 4 "coming next" teaser mini-covers,
          a subscribe invitation, and the site URL. */}
      <div className="relative flex flex-col items-center justify-between gap-2 p-3 sm:p-5 text-center bg-[hsl(42_50%_94%)]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_30%,hsl(42_78%_70%/0.5),transparent_60%)]" />
        <div className="relative pt-1">
          <BrandMark stacked iconClassName="h-9 w-9 sm:h-11 sm:w-11" wordmarkClassName="h-5 sm:h-6" />
        </div>

        {/* "Coming next" teaser mini-covers (each looks like a front cover). */}
        {previewPages.length > 0 && (
          <div className="relative w-full">
            <p className="mb-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/60">{COMING_NEXT_LABEL[lang]}</p>
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {previewPages.slice(0, 4).map((pv) => renderMiniCover(pv))}
            </div>
          </div>
        )}

        <div className="relative font-body italic text-primary/80 leading-snug space-y-0.5 text-xs sm:text-sm whitespace-pre-line" dir={dir}>
          {((page?.backCoverText && page.backCoverText.trim() ? page.backCoverText.split("\n") : getCoverTagline(lang))).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <p className="relative font-mono text-[10px] sm:text-xs tracking-[0.2em] text-gold uppercase">{COVER_URL}</p>
      </div>

      {/* Front cover — right */}
      <div className="relative bg-muted">
        {page?.image ? (
          <img src={page.image} alt={page.coverTitle || ""} className="absolute inset-0 w-full h-full object-cover" />
        ) : page?.imageLoading ? (
          <BookLoadingSkeleton type="cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        {renderCoverChrome(frontTitle, childLine)}
      </div>

      {/* Spine — story title + kids' names down the center fold */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center bg-[hsl(42_46%_89%)] shadow-[inset_3px_0_7px_rgba(0,0,0,0.14),inset_-3px_0_7px_rgba(0,0,0,0.14)]"
        style={{ width: "5%" }}
      >
        <span
          dir={dir}
          className="font-display font-semibold tracking-wide text-primary/85 whitespace-nowrap text-[9px] sm:text-[11px] px-0.5"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {spineLabel}
        </span>
      </div>
    </div>
    );
  };

  const renderStorySpread = () => {
    // Text precedence: the admin's manual placement wins; otherwise the layout
    // auto-computed from the illustration's clear space; otherwise the default.
    let layout = migrateLayout(page?.textLayout) || (page ? autoLayouts[page.id] : undefined) || makeDefaultLayout(defaultTextSide, isRtl);
    // Coloring pages are line art on WHITE — the white caption default would be
    // invisible, so force dark text with a soft cream backing box.
    if (isColoring) layout = { ...layout, color: "#2b2418", shadow: false, background: true };
    // For coloring story pages show the B&W line-art conversion (falling back to
    // the raw colour image until it's ready); every other page shows as-is.
    const displaySrc = isColoringStoryPage ? (lineArtSrc ?? page?.image) : page?.image;
    return (
      <div className="absolute inset-0 bg-muted">
        {page?.image ? (
          <motion.img
            key={`${page.id}-${(displaySrc ?? "").slice(-20)}`}
            src={displaySrc}
            alt={getPageLabel()}
            crossOrigin="anonymous"
            onLoad={(e) => {
              if (page && !page.textLayout && autoLayouts[page.id] === undefined) {
                const al = computeAutoTextLayout(e.currentTarget, isRtl, page.text);
                if (al) {
                  setAutoLayouts((prev) => ({ ...prev, [page.id]: al }));
                  // Persist the auto placement (admin view) so the saved book —
                  // and therefore the printed PDF — uses the exact same layout
                  // without the admin touching anything.
                  if (editable) updatePage(page.id, { textLayout: al });
                }
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover ${isRegenThis ? "animate-pulse opacity-50" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isRegenThis ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : page?.imageLoading ? (
          <BookLoadingSkeleton type="story" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground text-sm">Generating illustration…</p>
          </div>
        )}

        {/* Draggable text on top of the spread */}
        {page && (
          <EditableTextBox
            layout={layout}
            text={page.text || ""}
            containerRef={spreadRef}
            rtl={isRtl}
            onLayoutChange={(l) => updatePage(page.id, { textLayout: l })}
            onTextChange={(t) => updatePage(page.id, { text: t })}
            onReset={() => updatePage(page.id, { textLayout: autoLayouts[page.id] })}
            onDuplicate={editable ? applyStyleToAll : undefined}
          />
        )}
      </div>
    );
  };

  const renderQuestionsSpread = () => {
    // Clean, empty parchment page (no illustration) so the discussion questions
    // are always easy to read, with a wide centered text block by default.
    const layout = migrateLayout(page?.textLayout) || makeQuestionsLayout(isRtl);
    const questionsText = (page?.questions || []).map((q) => `${q.number}. ${q.question}`).join("\n\n");
    const combinedText = page?.text || questionsText;
    return (
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(232,197,117,0.30), rgba(232,197,117,0) 70%), #f6efdf" }}>
        {page && (
          <EditableTextBox
            layout={layout}
            text={combinedText}
            containerRef={spreadRef}
            rtl={isRtl}
            onLayoutChange={(l) => updatePage(page.id, { textLayout: l })}
            onTextChange={(t) => updatePage(page.id, { text: t })}
            onReset={() => updatePage(page.id, { textLayout: makeQuestionsLayout(isRtl) })}
            onDuplicate={editable ? applyStyleToAll : undefined}
          />
        )}
      </div>
    );
  };


  // Back-cover "coming next" teaser: the generated cover for an upcoming story,
  // shown read-only (these are composited onto the printed back cover).
  const renderPreview = () => {
    const label = getPortionDisplay(page?.portion || "", lang) || page?.portion || "";
    return (
      <div className="absolute inset-0 bg-muted">
        {page?.image ? (
          <img src={page.image} alt={label} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <BookLoadingSkeleton type="story" />
        )}
        {/* Front-cover-style title band (matches the real front cover). */}
        <div className="absolute inset-x-0 top-0 px-4 pt-5 pb-12 bg-gradient-to-b from-black/55 via-black/25 to-transparent text-center" dir={dir}>
          <h1 className="font-extrabold text-white leading-[1.05] text-2xl sm:text-4xl tracking-tight" style={{ fontFamily: COVER_FONT, textShadow: COVER_TEXT_SHADOW }}>
            {label}
          </h1>
          {childName && (
            <p className="mt-1.5 text-white/90 text-sm sm:text-lg" style={{ fontFamily: COVER_FONT, textShadow: COVER_TEXT_SHADOW }}>{childName}</p>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-2">
          <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {COMING_NEXT_LABEL[lang]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Page/Spread frame — wide (2:1) for the cover wrap and board spreads;
          tall (8.5:11) for coloring pages; square for page-based 8×8 pages. */}
      <div
        ref={spreadRef}
        className={`relative w-full rounded-book overflow-hidden bg-secondary shadow-soft-lg ${
          isColoring ? "aspect-[85/110]"
            : pageType === "cover" || spreadBased ? "aspect-[2/1]"
            : "aspect-square"
        }`}
      >
        {pageType === "cover" && (isColoring ? renderColoringCover() : renderCoverSpread())}
        {pageType === "story" && renderStorySpread()}
        {pageType === "questions" && renderQuestionsSpread()}
        {pageType === "preview" && renderPreview()}

        {/* Center gutter — only on the cover wrap and board two-page spreads */}
        {((pageType === "cover" && !isColoring) || spreadBased) && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-r from-black/0 via-black/40 to-black/0" />
        )}

        {isRegenThis && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-soft-md">
              <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              <span className="text-sm font-medium text-primary">Regenerating…</span>
            </div>
          </div>
        )}

        {/* Page nav */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={safeIndex === 0}
            className="rounded-full shadow-soft-sm h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(displayPages.length - 1, p + 1))}
            disabled={safeIndex >= displayPages.length - 1}
            className="rounded-full shadow-soft-sm h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Page label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-primary">
          {getPageLabel()}
        </div>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {displayPages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentPage(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === safeIndex
                ? "bg-accent w-5"
                : p.type === "cover"
                  ? "bg-accent/30 w-2.5 hover:bg-accent/50"
                  : "bg-border w-2 hover:bg-muted-foreground/40"
            }`}
            aria-label={`Go to spread ${i + 1}`}
          />
        ))}
      </div>

      {/* Action buttons (admin only) */}
      {editable && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {pageType === "story" && (
          <Button variant="outline" size="sm" onClick={startEdit} disabled={regeneratingId !== null} className="text-xs">
            <Pencil className="w-3.5 h-3.5" /> Edit Text
          </Button>
        )}
        {pageType === "cover" && (
          <Button variant="outline" size="sm" onClick={startCoverEdit} disabled={regeneratingId !== null} className="text-xs">
            <Pencil className="w-3.5 h-3.5" /> Edit Text
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => regenImage()}
          disabled={regeneratingId !== null}
          className={`text-xs ${pageType !== "story" && pageType !== "cover" ? "col-span-2" : ""}`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Quick Regen
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openPromptEditor}
          disabled={regeneratingId !== null}
          className="text-xs"
        >
          <Wand2 className="w-3.5 h-3.5" /> Custom Prompt
        </Button>
        {pageType === "story" && page && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => deletePage(page.id)}
            disabled={regeneratingId !== null}
            className="text-xs col-span-1 sm:col-span-3 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Page
          </Button>
        )}
      </div>
      )}

      {/* Text editor */}
      {editingId !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
              <Pencil className="w-4 h-4 text-accent" /> Edit page text
            </Label>
            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="text-sm bg-card"
            placeholder="Page text…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={saveEdit}>
              <Sparkles className="w-3.5 h-3.5" /> Save text
            </Button>
          </div>
        </motion.div>
      )}

      {/* Cover text editor */}
      {coverEditOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
              <Pencil className="w-4 h-4 text-accent" /> Edit cover text
            </Label>
            <button onClick={() => setCoverEditOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Front cover title</Label>
            <Input value={coverTitleDraft} onChange={(e) => setCoverTitleDraft(e.target.value)} className="text-sm bg-card" placeholder="Book title…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Front cover subtitle</Label>
            <Input value={coverSubtitleDraft} onChange={(e) => setCoverSubtitleDraft(e.target.value)} className="text-sm bg-card" placeholder="Subtitle / tagline…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Back cover text (one line per row)</Label>
            <Textarea value={backTextDraft} onChange={(e) => setBackTextDraft(e.target.value)} rows={3} className="text-sm bg-card" placeholder={COVER_TAGLINE.join("\n")} />
            <p className="text-[11px] text-muted-foreground">The Torah Tale logo and website are kept automatically.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCoverEditOpen(false)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={saveCoverEdit}>
              <Sparkles className="w-3.5 h-3.5" /> Save text
            </Button>
          </div>
        </motion.div>
      )}

      {/* Custom prompt editor */}
      {showPromptEditor && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent" /> Image Prompt Editor
            </Label>
            <button onClick={() => setShowPromptEditor(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            className="text-xs bg-card"
            placeholder="Describe exactly how you want this illustration to look…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(false)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={() => regenImage(customPrompt)} disabled={regeneratingId !== null}>
              <Sparkles className="w-3.5 h-3.5" /> Generate with Prompt
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
