import type { TextLayout } from "@/components/wizard/EditableTextBox";

/** Build the questions-page text so BOTH languages of each question carry the
 *  SAME number. A bilingual question stores English + Hebrew joined by a blank
 *  line; we split them and prefix each with "N." so the list numbers correctly
 *  in English AND Hebrew. Blocks are separated by blank lines so the renderer
 *  gives each its own direction (Hebrew RTL, English LTR). */
export function buildQuestionsText(questions: { number: number; question: string }[]): string {
  const out: string[] = [];
  questions.forEach((q, i) => {
    const n = q.number || i + 1;
    const parts = String(q.question || "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) out.push(`${n}. ${part}`);
  });
  return out.join("\n\n");
}

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
export function fitQuestionsLayout(
  text: string, base: TextLayout, W: number, H: number, _rtl: boolean,
  /** Fraction of the page height reserved above the list (for a heading). */
  topInsetPct = 0,
): TextLayout {
  const listAlign: TextLayout["align"] = "center"; // questions are centered
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = document.createElement("canvas").getContext("2d"); } catch { /* ignore */ }
  if (!ctx) return { ...base, align: listAlign };

  const scale = W / 1024;
  const maxTextW = (base.width / 100) * W - 6 * scale * 2;
  const topPct = Math.max(base.y, topInsetPct);
  const bottomMarginPct = 6;
  const availH = H - (topPct / 100) * H - (bottomMarginPct / 100) * H;
  const weight = base.bold ? "700" : "400";
  const lineHeight = 1.45;
  let fontSize = 9;
  let lines = 0;
  for (let fsRef = 24; fsRef >= 9; fsRef--) {
    const fs = fsRef * scale;
    ctx.font = `${weight} ${fs}px ${base.fontFamily}`;
    lines = wrapCount(ctx, text, maxTextW);
    if (lines * fs * lineHeight <= availH) { fontSize = fsRef; break; }
    fontSize = fsRef; // keep the last measured size if nothing fits
  }
  // Centre the finished block in the space that is left, instead of pinning it
  // to the top - ten short questions used to sit high with a wide empty band
  // under them.
  const blockH = lines * fontSize * scale * lineHeight;
  const slackPct = Math.max(0, ((availH - blockH) / H) * 100);
  const y = topPct + slackPct / 2;
  return { ...base, y, fontSize, lineHeight, align: listAlign };
}
