import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Minus, Plus, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export interface TextStyle {
  x: number;       // percentage 0-100
  y: number;       // percentage 0-100
  fontSize: number; // px
  color: string;
  fontFamily: string;
  bgOpacity: number; // 0-1
  width: number;     // percentage 20-100
  textAlign: "center" | "left" | "right";
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  x: 50,
  y: 85,
  fontSize: 16,
  color: "#ffffff",
  fontFamily: "'Georgia', serif",
  bgOpacity: 0.6,
  width: 80,
  textAlign: "center",
};

const FONT_OPTIONS = [
  { label: "Serif", value: "'Georgia', serif" },
  { label: "Sans", value: "'Inter', sans-serif" },
  { label: "Handwritten", value: "'Comic Sans MS', cursive" },
  { label: "Mono", value: "'Courier New', monospace" },
];

const COLOR_PRESETS = [
  "#ffffff", "#000000", "#1a1a2e", "#f5e6ca",
  "#d4a574", "#2d5016", "#8b1a1a", "#1a3a5c",
];

interface Props {
  text: string;
  style: TextStyle;
  onChange: (style: TextStyle) => void;
  onTextChange: (text: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DraggableText = ({ text, style, onChange, onTextChange, containerRef }: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStart = useRef({ clientX: 0, startWidth: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = { x: clientX, y: clientY, startX: style.x, startY: style.y };
    setIsDragging(true);
    setShowToolbar(true);
  }, [isEditing, style.x, style.y, containerRef]);

  // Drag handler
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      
      const dx = ((clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((clientY - dragStart.current.y) / rect.height) * 100;
      
      const newX = Math.max(5, Math.min(95, dragStart.current.startX + dx));
      const newY = Math.max(5, Math.min(95, dragStart.current.startY + dy));
      
      onChange({ ...style, x: newX, y: newY });
    };
    
    const handleUp = () => setIsDragging(false);
    
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, style, onChange, containerRef]);

  // Resize handler
  const handleResizeStart = useCallback((side: "left" | "right", e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    resizeStart.current = { clientX, startWidth: style.width };
    setIsResizing(side);
  }, [style.width]);

  useEffect(() => {
    if (!isResizing) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const dx = ((clientX - resizeStart.current.clientX) / rect.width) * 100;
      
      let newWidth: number;
      if (isResizing === "right") {
        newWidth = resizeStart.current.startWidth + dx * 2; // *2 because centered
      } else {
        newWidth = resizeStart.current.startWidth - dx * 2;
      }
      newWidth = Math.max(20, Math.min(100, newWidth));
      onChange({ ...style, width: newWidth });
    };
    
    const handleUp = () => setIsResizing(null);
    
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isResizing, style, onChange, containerRef]);

  return (
    <>
      {/* Draggable text block */}
      <div
        ref={textRef}
        className={`absolute select-none ${isDragging ? "cursor-grabbing z-30" : "cursor-grab z-20"} ${showToolbar ? "ring-2 ring-accent/50 rounded-lg" : ""}`}
        style={{
          left: `${style.x}%`,
          top: `${style.y}%`,
          transform: "translate(-50%, -50%)",
          width: `${style.width}%`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          setShowToolbar(true);
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {/* Left resize handle */}
        {showToolbar && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-accent/80 rounded-full cursor-ew-resize z-40 hover:bg-accent"
            onMouseDown={(e) => handleResizeStart("left", e)}
            onTouchStart={(e) => handleResizeStart("left", e)}
          />
        )}

        <div
          className="px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: `rgba(0,0,0,${style.bgOpacity})`,
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            color: style.color,
            lineHeight: 1.4,
            textAlign: style.textAlign,
            direction: style.textAlign === "right" ? "rtl" : "ltr",
          }}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => { if (e.key === "Escape") setIsEditing(false); }}
              className="bg-transparent border-none outline-none resize-none w-full min-w-[120px]"
              style={{ font: "inherit", color: "inherit", textAlign: style.textAlign }}
              rows={2}
            />
          ) : (
            <p className="whitespace-pre-wrap">{text || "Double-click to edit"}</p>
          )}
        </div>

        {/* Right resize handle */}
        {showToolbar && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-accent/80 rounded-full cursor-ew-resize z-40 hover:bg-accent"
            onMouseDown={(e) => handleResizeStart("right", e)}
            onTouchStart={(e) => handleResizeStart("right", e)}
          />
        )}
      </div>

      {/* Floating toolbar */}
      {showToolbar && !isDragging && !isResizing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-lg p-2 flex items-center gap-2 flex-wrap justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Text alignment */}
          <div className="flex items-center gap-0.5">
            {([
              { align: "left" as const, Icon: AlignLeft, label: "LTR" },
              { align: "center" as const, Icon: AlignCenter, label: "Center" },
              { align: "right" as const, Icon: AlignRight, label: "RTL" },
            ]).map(({ align, Icon }) => (
              <button
                key={align}
                onClick={() => onChange({ ...style, textAlign: align })}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${style.textAlign === align ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Font size */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange({ ...style, fontSize: Math.max(10, style.fontSize - 2) })}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-muted-foreground w-6 text-center">{style.fontSize}</span>
            <button
              onClick={() => onChange({ ...style, fontSize: Math.min(36, style.fontSize + 2) })}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Font family */}
          <select
            value={style.fontFamily}
            onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
            className="text-[10px] bg-muted rounded px-1.5 py-1 border-none outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <div className="w-px h-5 bg-border" />

          {/* Colors */}
          <div className="flex gap-0.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...style, color: c })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${style.color === c ? "border-accent scale-110" : "border-border/50"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* BG opacity */}
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={100}
              value={style.bgOpacity * 100}
              onChange={(e) => onChange({ ...style, bgOpacity: Number(e.target.value) / 100 })}
              className="w-12 h-1 accent-accent"
            />
          </div>

          {/* Close */}
          <button
            onClick={() => setShowToolbar(false)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </>
  );
};
