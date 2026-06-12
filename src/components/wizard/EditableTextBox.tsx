import { useEffect, useRef, useState, type RefObject } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, RotateCcw, Square, SquareDashed, Type, X } from "lucide-react";
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
}

export const DEFAULT_FONT_FAMILY = "'Cormorant Garamond', 'Georgia', serif";

export const DEFAULT_TEXT_LAYOUT: TextLayout = {
  x: 52,
  y: 12,
  width: 44,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: 19,
  color: "#2b2418",
  align: "left",
  bold: false,
  italic: false,
  background: true,
  border: false,
};

export const FONT_OPTIONS = [
  { label: "Cormorant", value: "'Cormorant Garamond', 'Georgia', serif" },
  { label: "Playfair", value: "'Playfair Display', 'Georgia', serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Frank Ruhl", value: "'Frank Ruhl Libre', 'Georgia', serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export const COLOR_SWATCHES = ["#2b2418", "#ffffff", "#fcf7ec", "#b88a2a", "#1a1a1a", "#7a1818"];

export function makeDefaultLayout(side: "left" | "right", rtl = false): TextLayout {
  // Image fills the opposite half; text sits centered on this side.
  const onLeft = side === "left";
  return {
    ...DEFAULT_TEXT_LAYOUT,
    x: onLeft ? 4 : 52,
    width: 44,
    align: rtl ? "right" : "left",
  };
}

interface Props {
  layout: TextLayout;
  text: string;
  containerRef: RefObject<HTMLElement>;
  onLayoutChange: (l: TextLayout) => void;
  onTextChange: (t: string) => void;
  onReset?: () => void;
}

export const EditableTextBox = ({ layout, text, containerRef, onLayoutChange, onTextChange, onReset }: Props) => {
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
      onLayoutChange({
        ...layout,
        width: Math.max(15, Math.min(98 - layout.x, orig.width + dxPct)),
      });
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
          lineHeight: 1.5,
          padding: layout.background || layout.border ? "14px 18px" : "4px 6px",
          background: layout.background ? "rgba(252, 247, 236, 0.94)" : "transparent",
          borderRadius: 14,
          border: selected
            ? "2px dashed hsl(var(--gold))"
            : layout.border
              ? "1px solid rgba(0,0,0,0.25)"
              : "2px dashed transparent",
          backdropFilter: layout.background ? "blur(6px)" : undefined,
          cursor: editing ? "text" : "move",
          userSelect: editing ? "text" : "none",
          touchAction: "none",
          zIndex: selected ? 30 : 20,
          boxShadow: layout.background ? "0 4px 14px rgba(0,0,0,0.12)" : undefined,
        }}
      >
        {editing ? (
          <textarea
            autoFocus
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

          <Toggle size="sm" pressed={layout.background} onPressedChange={(p) => onLayoutChange({ ...layout, background: p })} aria-label="Background">
            <Square className="w-3.5 h-3.5" />
          </Toggle>
          <Toggle size="sm" pressed={layout.border} onPressedChange={(p) => onLayoutChange({ ...layout, border: p })} aria-label="Border">
            <SquareDashed className="w-3.5 h-3.5" />
          </Toggle>

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
