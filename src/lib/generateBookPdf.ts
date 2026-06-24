import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_TAGLINE, COVER_URL, type BookPage } from "@/components/wizard/BookViewer";
import { DEFAULT_TEXT_LAYOUT, makeDefaultLayout, type TextLayout } from "@/components/wizard/EditableTextBox";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png";

/* Spread = 2:1 landscape sheet. Image fills one half, text composited
   per page from BookPage.textLayout. */

const SPREAD_W = 2400;
const SPREAD_H = 1200;
const HALF_W = SPREAD_W / 2;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function safeLoad(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try { return await loadImage(src); } catch { return null; }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of (text || "").split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw the cream "paper" half background. */
function drawPaperHalf(ctx: CanvasRenderingContext2D, side: "left" | "right") {
  const x = side === "left" ? 0 : HALF_W;
  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(x, 0, HALF_W, SPREAD_H);
  const glow = ctx.createRadialGradient(x + HALF_W / 2, SPREAD_H / 2, 40, x + HALF_W / 2, SPREAD_H / 2, HALF_W * 0.7);
  glow.addColorStop(0, "rgba(232, 197, 117, 0.35)");
  glow.addColorStop(1, "rgba(232, 197, 117, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, 0, HALF_W, SPREAD_H);
}

/** Composite a text overlay using the page's TextLayout. Coords are % of spread. */
function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, layout: TextLayout) {
  if (!text) return;
  // layout.fontSize and padding are absolute px defined against a 1024px-wide
  // reference container (see EditableTextBox / TextLayout). Scale them by the
  // same factor to the 2400px canvas so the PDF matches the on-screen preview
  // 1:1. (Previously this used a 600px reference, which made PDF text ~1.7x too
  // large.)
  const scale = SPREAD_W / 1024;
  const fontSize = layout.fontSize * scale;
  const weight = layout.bold ? "700" : "400";
  const italic = layout.italic ? "italic " : "";
  ctx.font = `${italic}${weight} ${fontSize}px ${layout.fontFamily}`;
  ctx.textBaseline = "top";

  const boxX = (layout.x / 100) * SPREAD_W;
  const boxY = (layout.y / 100) * SPREAD_H;
  const boxW = (layout.width / 100) * SPREAD_W;
  const hasPad = layout.background || layout.border;
  const padX = (hasPad ? 18 : 6) * scale;
  const padY = (hasPad ? 14 : 4) * scale;
  const maxTextW = boxW - padX * 2;
  const lines = wrapLines(ctx, text, maxTextW);
  const lineHeight = fontSize * 1.5;
  const textH = lines.length * lineHeight;
  const boxH = textH + padY * 2;

  if (layout.background) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.14)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "rgba(252, 247, 236, 0.94)";
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.fill();
    ctx.restore();
  }
  if (layout.border) {
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 2;
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.stroke();
  }

  ctx.fillStyle = layout.color;
  ctx.textAlign = layout.align;
  let textAnchorX = boxX + padX;
  if (layout.align === "center") textAnchorX = boxX + boxW / 2;
  else if (layout.align === "right") textAnchorX = boxX + boxW - padX;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textAnchorX, boxY + padY + i * lineHeight);
  }
}

function drawGutter(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(HALF_W - 12, 0, HALF_W + 12, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.32)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(HALF_W - 12, 0, 24, SPREAD_H);
}

/** Cover-fit an image onto one half, CLIPPED to that half so a non-square
 *  image (e.g. a wide cover) can never bleed across the gutter onto the other
 *  page. Mirrors CSS object-cover, which the on-screen preview uses. */
function drawHalfImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, halfX: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(halfX, 0, HALF_W, SPREAD_H);
  ctx.clip();
  const ratio = Math.max(HALF_W / img.naturalWidth, SPREAD_H / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, halfX + (HALF_W - dw) / 2, (SPREAD_H - dh) / 2, dw, dh);
  ctx.restore();
}

async function renderStorySpread(page: BookPage, storyIdx: number): Promise<string> {
  // Same alternating side rule as BookViewer: text-on-left for even story idx
  const textOnLeft = storyIdx % 2 === 0;
  const imageOnLeft = !textOnLeft;
  const layout = page.textLayout || makeDefaultLayout(textOnLeft ? "left" : "right");

  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W; canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;

  // Paper half (text side)
  drawPaperHalf(ctx, textOnLeft ? "left" : "right");

  // Image half (1:1 square fills the half exactly)
  const img = await safeLoad(page.image);
  const halfX = imageOnLeft ? 0 : HALF_W;
  if (img) {
    drawHalfImage(ctx, img, halfX);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(halfX, 0, HALF_W, SPREAD_H);
  }

  drawGutter(ctx);
  drawTextOverlay(ctx, page.text || "", layout);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderQuestionsSpread(page: BookPage): Promise<string> {
  const layout = page.textLayout || makeDefaultLayout("left");
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W; canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;
  // Image on right
  drawPaperHalf(ctx, "left");
  const img = await safeLoad(page.image);
  if (img) {
    drawHalfImage(ctx, img, HALF_W);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(HALF_W, 0, HALF_W, SPREAD_H);
  }
  drawGutter(ctx);
  const questions = page.questions || [];
  const formatted = page.text || questions.map((q) => `${q.number}. ${q.question}`).join("\n\n");
  drawTextOverlay(ctx, formatted, layout);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderCoverSpread(page: BookPage, childName: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W; canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;
  drawPaperHalf(ctx, "left");

  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon), safeLoad(torahTaleWordmark)]);
  const logoTopY = SPREAD_H * 0.16;
  if (icon) {
    const iconH = 180;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    ctx.drawImage(icon, HALF_W / 2 - iconW / 2, logoTopY, iconW, iconH);
  }
  if (wordmark) {
    const wmH = 110;
    const wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    ctx.drawImage(wordmark, HALF_W / 2 - wmW / 2, logoTopY + 200, wmW, wmH);
  }
  ctx.fillStyle = "#5a4a32";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tSize = 56;
  ctx.font = `italic ${tSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const cy = SPREAD_H * 0.62;
  const taglineLines = page.backCoverText && page.backCoverText.trim()
    ? page.backCoverText.split("\n").map((l) => l.trim()).filter(Boolean)
    : COVER_TAGLINE;
  taglineLines.forEach((line, i) => {
    ctx.fillText(line, HALF_W / 2, cy + (i - (taglineLines.length - 1) / 2) * (tSize * 1.35));
  });
  ctx.fillStyle = "#b88a2a";
  ctx.font = `600 36px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), HALF_W / 2, SPREAD_H * 0.9);

  const img = await safeLoad(page.image);
  if (img) {
    drawHalfImage(ctx, img, HALF_W);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(HALF_W, 0, HALF_W, SPREAD_H);
  }
  const bandH = SPREAD_H * 0.28;
  const bandGrad = ctx.createLinearGradient(HALF_W, 0, HALF_W, bandH);
  bandGrad.addColorStop(0, "rgba(255,255,255,0.94)");
  bandGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(HALF_W, 0, HALF_W, bandH);

  const title = page.coverTitle || `${childName}'s Torah Tale`;
  ctx.fillStyle = "#2b2418";
  ctx.font = `bold 78px 'Playfair Display', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, title, HALF_W - 120);
  titleLines.forEach((line, i) => ctx.fillText(line, HALF_W + HALF_W / 2, 70 + i * 90));
  if (page.coverSubtitle) {
    ctx.fillStyle = "#b88a2a";
    ctx.font = `italic 42px ${BOOK_TEXT_STYLE.fontFamily}`;
    ctx.fillText(page.coverSubtitle, HALF_W + HALF_W / 2, 70 + titleLines.length * 90 + 18);
  }
  drawGutter(ctx);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  _torahPortion: string
): Promise<Blob> {
  const renderable = pages.filter((p) => p.type !== "back-cover");
  const pageW = 356; // mm (14")
  const pageH = 178; // mm (7")
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageW, pageH] });

  let storyIdx = 0;
  for (let i = 0; i < renderable.length; i++) {
    const page = renderable[i];
    if (i > 0) pdf.addPage([pageW, pageH], "landscape");
    let dataUrl: string;
    if (page.type === "cover") {
      dataUrl = await renderCoverSpread(page, childName);
    } else if (page.type === "questions") {
      dataUrl = await renderQuestionsSpread(page);
    } else {
      dataUrl = await renderStorySpread(page, storyIdx);
      storyIdx += 1;
    }
    try {
      pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, pageH);
    } catch {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, pageW, pageH, "F");
    }
  }
  // expose default for any callers that need it
  void DEFAULT_TEXT_LAYOUT;
  return pdf.output("blob");
}
