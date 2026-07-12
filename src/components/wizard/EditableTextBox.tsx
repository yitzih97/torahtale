import { useEffect, useRef, useState, type RefObject } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Copy, Italic, RotateCcw, Sparkles, Square, SquareDashed, Type, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

export interface TextLayout {
  x: number;          // % from left of container (top-left anchor)
  y: number;          // % from top of container
  width: number;      // % of container width
  fontFamily: string;
  fontSize: number;   // px at 1024-ref container
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  background: boolean;
  border: boolean;
  /** Width (px) of the outline stroked around the letters. 0 = off. */
  outlineWidth?: number;
  /** Colour of the letter outline stroke (defaults to white). */
  outlineColor?: string;
  /** Colour of the box border stroke (defaults to translucent black). */
  borderColor?: string;
  /** Drop a soft shadow behind the text for extra pop / readability. */
  shadow?: boolean;
  /** Line spacing multiplier (defaults to 1.5). Higher = airier — used to make
   *  the discussion-questions page more readable and fill the page. */
  lineHeight?: number;
}

export const DEFAULT_FONT_FAMILY = "'Inter', system-ui, sans-serif";

/** Fonts that were the baked-in default before Inter. Existing books whose
 *  captions still carry one of these (i.e. the user never picked a font) are
 *  auto-upgraded to the new default by {@link migrateLayout}. */
const LEGACY_DEFAULT_FONTS = [
  "'Cormorant Garamond', 'Georgia', serif",
];

export const DEFAULT_OUTLINE_COLOR = "#ffffff";
export const DEFAULT_BORDER_COLOR = "rgba(0,0,0,0.25)";

export const DEFAULT_TEXT_LAYOUT: TextLayout = {
  x: 6,
  y: 9,
  width: 42,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: 20,
  color: "#ffffff",
  align: "left",
  // Captions are BOLD WHITE with a soft drop shadow by default so they stay
  // readable on any scene — no outline, no cream box. Outline/background/border
  // remain toggleable from the toolbar for special cases.
  bold: true,
  italic: false,
  background: false,
  border: false,
  outlineWidth: 0,
  outlineColor: DEFAULT_OUTLINE_COLOR,
  borderColor: DEFAULT_BORDER_COLOR,
  shadow: true,
};

/** Bring a stored layout up to the current defaults. Books created before Inter
 *  became the default carry the old Cormorant fontFamily inside their saved
 *  `textLayout`; swap it for the new default so existing books pick up Inter
 *  too (a font the user explicitly chose is left untouched). Also backfills
 *  newer optional fields so older layouts render consistently. */
export function migrateLayout<T extends TextLayout | undefined>(layout: T): T {
  if (!layout) return layout;
  const fontFamily = LEGACY_DEFAULT_FONTS.includes(layout.fontFamily)
    ? DEFAULT_FONT_FAMILY
    : layout.fontFamily;
  return { ...layout, fontFamily };
}

// A thin, crisp WHITE BORDER is stroked around caption text (paint-order
// renders it UNDER the fill so letterforms stay solid). Width comes from
// layout.outlineWidth (px, adjustable in the toolbar; 0 disables it) and is
// mirrored in the PDF renderer (generateBookPdf drawTextOverlay).

export const FONT_OPTIONS = [
  { label: "Cormorant", value: "'Cormorant Garamond', 'Georgia', serif" },
  { label: "Playfair", value: "'Playfair Display', 'Georgia', serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Frank Ruhl", value: "'Frank Ruhl Libre', 'Georgia', serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export const COLOR_SWATCHES = ["#2b2418", "#ffffff", "#fcf7ec", "#b88a2a", "#1a1a1a", "#7a1818"];

export function makeDefaultLayout(side: "left" | "right", rtl = false): TextLayout {
  // The illustration spans the full spread; text rests over the open sky on the
  // chosen side (left for LTR, right for RTL), near the top like the hero.
  const onLeft = side === "left";
  return {
    ...DEFAULT_TEXT_LAYOUT,
    x: onLeft ? 6 : 52,
    y: 9,
    width: 42,
    align: rtl ? "right" : "left",
  };
}

// The discussion-questions page renders on a clean, empty parchment background
// (no illustration), so the text gets the whole page: a wide, centered block
// that is comfortably readable rather than crammed into a corner of the art.
export function makeQuestionsLayout(rtl = false): TextLayout {
  return {
    ...DEFAULT_TEXT_LAYOUT,
    x: 10,
    y: 8,
    width: 80,
    align: rtl ? "right" : "left",
    // The questions page is a clean cream parchment (no illustration), so the
    // white caption default would be invisible — keep it dark with no shadow.
    color: "#2b2418",
    shadow: false,
    // Airier line spacing so the questions breathe and fill the whole page.
    lineHeight: 2.3,
  };
}

interface Props {
  layout: TextLayout;
  text: string;
  containerRef: RefObject<HTMLElement>;
  onLayoutChange: (l: TextLayout) => void;
  onTextChange: (t: string) => void;
  onReset?: () => void;
  /** Apply THIS box's styling (font, colours, outline, shadow, alignment — not
   *  its position) to every page's caption. Shown as the "Apply to all" button. */
  onDuplicate?: (l: TextLayout) => void;
  /** The book's text direction. RTL (Hebrew/Yiddish) needs an explicit paragraph
   *  direction so sentence-final punctuation (. , ? !) lands at the correct end. */
  rtl?: boolean;
}

export const EditableTextBox = ({ layout, text, containerRef, onLayoutChange, onTextChange, onReset, onDuplicate, rtl = false }: Props) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(false);
  const [editing, setEditing] = useState(false);
  const dragRef = useRef<{ mode: "move" | "resize" | null; startX: number; startY: number; orig: TextLayout } | null>(null);

  // Click-outside deselect
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (boxRef.current.contains(e.target as Node)) return;
      // Allow clicks on toolbar (sibling element with [data-text-toolbar])
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-text-toolbar]")) return;
      setSelected(false);
      setEditing(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onPointerDown = (e: React.PointerEvent, mode: "move" | "resize") => {
    if (editing) return;
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...layout } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const orig = dragRef.current.orig;
    if (dragRef.current.mode === "move") {
      onLayoutChange({
        ...layout,
        x: Math.max(0, Math.min(100 - layout.width, orig.x + dxPct)),
        y: Math.max(0, Math.min(95, orig.y + dyPct)),
      });
    } else {
      // Corner handle = proportional scale: the box widens AND the type grows
      // with it, so dragging out makes the whole caption bigger (font stays
      // clamped to the toolbar's 10–48px range).
      const newWidth = Math.max(15, Math.min(98 - orig.x, orig.width + dxPct));
      const ratio = orig.width > 0 ? newWidth / orig.width : 1;
      const newFontSize = Math.max(10, Math.min(48, Math.round(orig.fontSize * ratio)));
      onLayoutChange({ ...layout, width: newWidth, fontSize: newFontSize });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const fontWeight = layout.bold ? 700 : 400;
  const fontStyle = layout.italic ? "italic" : "normal";

  return (
    <>
      <div
        ref={boxRef}
        dir={rtl ? "rtl" : "ltr"}
        onPointerDown={(e) => onPointerDown(e, "move")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => { e.stopPropagation(); setSelected(true); }}
        onDoubleClick={(e) => { e.stopPropagation(); setSelected(true); setEditing(true); }}
        style={{
          position: "absolute",
          left: `${layout.x}%`,
          top: `${layout.y}%`,
          width: `${layout.width}%`,
          fontFamily: layout.fontFamily,
          fontSize: `${layout.fontSize}px`,
          color: layout.color,
          textAlign: layout.align,
          fontWeight,
          fontStyle,
          lineHeight: layout.lineHeight ?? 1.5,
          padding: layout.background || layout.border ? "14px 18px" : "4px 6px",
          background: layout.background ? "rgba(252, 247, 236, 0.94)" : "transparent",
          borderRadius: 14,
          border: selected
            ? "2px dashed hsl(var(--gold))"
            : layout.border
              ? `1px solid ${layout.borderColor ?? DEFAULT_BORDER_COLOR}`
              : "2px dashed transparent",
          backdropFilter: layout.background ? "blur(6px)" : undefined,
          cursor: editing ? "text" : "move",
          userSelect: editing ? "text" : "none",
          touchAction: "none",
          zIndex: selected ? 30 : 20,
          boxShadow: layout.background ? "0 4px 14px rgba(0,0,0,0.12)" : undefined,
          // Optional soft drop shadow behind the letters for extra pop.
          textShadow: layout.shadow ? "0 2px 6px rgba(0,0,0,0.55)" : undefined,
          // Thin outline keeps the caption readable on any scene (skipped when a
          // solid background box already guarantees contrast, or while editing).
          WebkitTextStroke: editing || layout.background || !(layout.outlineWidth ?? 2)
            ? undefined
            : `${layout.outlineWidth ?? 2}px ${layout.outlineColor ?? DEFAULT_OUTLINE_COLOR}`,
          paintOrder: "stroke fill",
        }}
      >
        {editing ? (
          <textarea
            autoFocus
            dir={rtl ? "rtl" : "ltr"}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              minHeight: `${layout.fontSize * 4}px`,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "vertical",
              font: "inherit",
              lineHeight: "inherit",
              color: "inherit",
              textAlign: layout.align,
            }}
          />
        ) : (
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text || "Double-click to edit"}</div>
        )}

        {selected && !editing && (
          <div
            onPointerDown={(e) => onPointerDown(e, "resize")}
            style={{
              position: "absolute",
              right: -8,
              bottom: -8,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: "hsl(var(--gold))",
              border: "2px solid white",
              cursor: "nwse-resize",
              touchAction: "none",
            }}
          />
        )}
      </div>

      {selected && (
        <div
          data-text-toolbar
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/95 backdrop-blur-md p-2 shadow-soft-lg"
          style={{
            left: `${Math.min(Math.max(layout.x, 1), 60)}%`,
            top: `calc(${layout.y}% - 56px)`,
            maxWidth: "min(92%, 560px)",
          }}
        >
          <select
            value={layout.fontFamily}
            onChange={(e) => onLayoutChange({ ...layout, fontFamily: e.target.value })}
            className="h-7 rounded-md border border-border bg-background px-1 text-xs"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 px-1 w-28">
            <Type className="w-3 h-3 text-muted-foreground" />
            <Slider
              value={[layout.fontSize]}
              min={10}
              max={48}
              step={1}
              onValueChange={([v]) => onLayoutChange({ ...layout, fontSize: v })}
            />
          </div>

          <div className="flex items-center gap-1 px-1 w-32" title="Outline width & colour">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Outline</span>
            <Slider
              value={[layout.outlineWidth ?? 2]}
              min={0}
              max={8}
              step={0.5}
              onValueChange={([v]) => onLayoutChange({ ...layout, outlineWidth: v })}
            />
            <input
              type="color"
              value={layout.outlineColor ?? DEFAULT_OUTLINE_COLOR}
              onChange={(e) => onLayoutChange({ ...layout, outlineColor: e.target.value })}
              className="h-7 w-6 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
              aria-label="Outline color"
              title="Outline color"
            />
          </div>

          <input
            type="color"
            value={layout.color}
            onChange={(e) => onLayoutChange({ ...layout, color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
            aria-label="Text color"
          />
          <div className="flex items-center gap-0.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => onLayoutChange({ ...layout, color: c })}
                style={{ background: c }}
                className="h-5 w-5 rounded-full border border-border"
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <Toggle size="sm" pressed={layout.bold} onPressedChange={(p) => onLayoutChange({ ...layout, bold: p })} aria-label="Bold">
            <Bold className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle size="sm" pressed={layout.italic} onPressedChange={(p) => onLayoutChange({ ...layout, italic: p })} aria-label="Italic">
            <Italic className="w-3.5 h-3.5" />
          </Toggle>

          <Toggle size="sm" pressed={layout.align === "left"} onPressedChange={() => onLayoutChange({ ...layout, align: "left" })} aria-label="Left">
            <AlignLeft className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle size="sm" pressed={layout.align === "center"} onPressedChange={() => onLayoutChange({ ...layout, align: "center" })} aria-label="Center">
            <AlignCenter className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle size="sm" pressed={layout.align === "right"} onPressedChange={() => onLayoutChange({ ...layout, align: "right" })} aria-label="Right">
            <AlignRight className="w-3.5 h-3.5" />
          </Toggle>

          <Toggle size="sm" pressed={layout.shadow ?? false} onPressedChange={(p) => onLayoutChange({ ...layout, shadow: p })} aria-label="Text shadow" title="Text shadow">
            <Sparkles className="w-3.5 h-3.5" />
          </Toggle>

          <Toggle size="sm" pressed={layout.background} onPressedChange={(p) => onLayoutChange({ ...layout, background: p })} aria-label="Background">
            <Square className="w-3.5 h-3.5" />
          </Toggle>
          <div className="flex items-center gap-0.5">
            <Toggle size="sm" pressed={layout.border} onPressedChange={(p) => onLayoutChange({ ...layout, border: p })} aria-label="Border">
              <SquareDashed className="w-3.5 h-3.5" />
            </Toggle>
            <input
              type="color"
              value={layout.borderColor ?? "#000000"}
              onChange={(e) => onLayoutChange({ ...layout, borderColor: e.target.value, border: true })}
              className="h-7 w-6 cursor-pointer rounded border border-border bg-transparent p-0"
              aria-label="Border color"
              title="Border color"
            />
          </div>

          {onDuplicate && (
            <Button size="sm" variant="ghost" onClick={() => onDuplicate(layout)} className="h-7 px-2 text-xs" title="Apply this text style to every page">
              <Copy className="w-3 h-3" /> Apply to all
            </Button>
          )}
          {onReset && (
            <Button size="sm" variant="ghost" onClick={onReset} className="h-7 px-2 text-xs">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setSelected(false)} className="h-7 w-7" aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </>
  );
};
