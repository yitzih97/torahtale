import type { TextLayout } from "@/components/wizard/EditableTextBox";

/** Word-wrap `text` to `maxWidth` using the measuring ctx (mirrors the PDF
 *  renderer's wrapLines so edit + print agree). Preserves explicit newlines. */
function wrapCount(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
  let lines = 0;
  for (const para of (text || "").split("\n")) {
    if (!para.trim()) { lines += 1; continue; }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines += 1; line = word; }
      else line = test;
    }
    if (line) lines += 1;
  }
  return lines;
}

/**
 * Shrink the questions font + line spacing so ALL the questions fit inside the
 * page height instead of overflowing off the bottom. Works in the layout's
 * 1024px reference space via an offscreen canvas, so the returned `fontSize`
 * (reference px) is identical for the on-screen editor and the PDF renderer.
 *
 * `W`/`H` are the logical page dimensions (e.g. 1200×1200 for an 8×8 square).
 */
export function fitQuestionsLayout(text: string, base: TextLayout, W: number, H: number, rtl: boolean): TextLayout {
  const listAlign: TextLayout["align"] = rtl ? "right" : "left";
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = document.createElement("canvas").getContext("2d"); } catch { /* ignore */ }
  if (!ctx) return { ...base, align: listAlign };

  const scale = W / 1024;
  const maxTextW = (base.width / 100) * W - 6 * scale * 2;
  const availH = H - (base.y / 100) * H - H * 0.06; // top offset + bottom margin
  const weight = base.bold ? "700" : "400";
  const lineHeight = 1.45;
  let fontSize = 9;
  for (let fsRef = 24; fsRef >= 9; fsRef--) {
    const fs = fsRef * scale;
    ctx.font = `${weight} ${fs}px ${base.fontFamily}`;
    if (wrapCount(ctx, text, maxTextW) * fs * lineHeight <= availH) { fontSize = fsRef; break; }
  }
  return { ...base, fontSize, lineHeight, align: listAlign };
}
