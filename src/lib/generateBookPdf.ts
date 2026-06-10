import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_TAGLINE, COVER_URL, type BookPage } from "@/components/wizard/BookViewer";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png.asset.json";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png.asset.json";

/* ────────────────────────────────────────────────────────────────────────────
   Spread-style PDF generator
   Each printed sheet = one 2:1 landscape spread that matches the on-screen
   BookViewer: full-bleed illustration, alternating text panel on one half,
   single cover spread with back (logo + tagline) + front (title + art).
   ──────────────────────────────────────────────────────────────────────────── */

const SPREAD_W = 2400;
const SPREAD_H = 1200;

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
  try {
    return await loadImage(src);
  } catch {
    return null;
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of (text || "").split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Composite a text panel onto one half of the spread. */
function drawTextPanel(
  ctx: CanvasRenderingContext2D,
  text: string,
  side: "left" | "right",
  options: { fontScale?: number } = {}
) {
  if (!text) return;
  const fontScale = options.fontScale ?? 3.2; // px → canvas px
  const halfW = SPREAD_W / 2;
  const panelMargin = 80;
  const panelW = halfW - panelMargin * 2;
  const padding = BOOK_TEXT_STYLE.padding * 2.4;
  const fontSize = BOOK_TEXT_STYLE.fontSizePx * fontScale;
  ctx.font = `${fontSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  ctx.textBaseline = "top";

  const maxTextW = panelW - padding * 2;
  const lines = wrapLines(ctx, text, maxTextW);
  const lineHeight = fontSize * BOOK_TEXT_STYLE.lineHeight;
  const textH = lines.length * lineHeight;
  const panelH = textH + padding * 2;

  const panelX = side === "left" ? panelMargin : halfW + panelMargin;
  const panelY = (SPREAD_H - panelH) / 2;

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = BOOK_TEXT_STYLE.bgColor;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, BOOK_TEXT_STYLE.borderRadius * 2);
  ctx.fill();
  ctx.restore();

  // Text
  ctx.fillStyle = BOOK_TEXT_STYLE.color;
  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], panelX + padding, panelY + padding + i * lineHeight);
  }
}

function drawGutter(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(SPREAD_W / 2 - 12, 0, SPREAD_W / 2 + 12, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.32)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(SPREAD_W / 2 - 12, 0, 24, SPREAD_H);
}

async function renderStorySpread(page: BookPage, side: "left" | "right"): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W;
  canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;

  const img = await safeLoad(page.image);
  if (img) {
    // Cover-fit across the full spread
    const ratio = Math.max(SPREAD_W / img.naturalWidth, SPREAD_H / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    ctx.drawImage(img, (SPREAD_W - dw) / 2, (SPREAD_H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#efeae0";
    ctx.fillRect(0, 0, SPREAD_W, SPREAD_H);
  }

  drawTextPanel(ctx, page.text || "", side);
  drawGutter(ctx);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderQuestionsSpread(page: BookPage): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W;
  canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;

  const img = await safeLoad(page.image);
  if (img) {
    const ratio = Math.max(SPREAD_W / img.naturalWidth, SPREAD_H / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    ctx.drawImage(img, (SPREAD_W - dw) / 2, (SPREAD_H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#efeae0";
    ctx.fillRect(0, 0, SPREAD_W, SPREAD_H);
  }

  // Build question text block on left half
  const questions = page.questions || [];
  const formatted = questions.map((q) => `${q.number}. ${q.question}`).join("\n");
  drawTextPanel(ctx, formatted, "left", { fontScale: 2.8 });
  drawGutter(ctx);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderCoverSpread(page: BookPage, childName: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W;
  canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;
  const halfW = SPREAD_W / 2;

  /* ── LEFT: back cover ── */
  // Cream background w/ subtle radial glow
  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(0, 0, halfW, SPREAD_H);
  const glow = ctx.createRadialGradient(halfW / 2, SPREAD_H * 0.32, 20, halfW / 2, SPREAD_H * 0.32, halfW * 0.7);
  glow.addColorStop(0, "rgba(232, 197, 117, 0.45)");
  glow.addColorStop(1, "rgba(232, 197, 117, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, halfW, SPREAD_H);

  // Logo (icon + wordmark)
  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon.url), safeLoad(torahTaleWordmark.url)]);
  const logoTopY = SPREAD_H * 0.16;
  if (icon) {
    const iconH = 180;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    ctx.drawImage(icon, halfW / 2 - iconW / 2, logoTopY, iconW, iconH);
  }
  if (wordmark) {
    const wmH = 110;
    const wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    ctx.drawImage(wordmark, halfW / 2 - wmW / 2, logoTopY + 200, wmW, wmH);
  }

  // Tagline
  ctx.fillStyle = "#5a4a32";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const taglineSize = 56;
  ctx.font = `italic ${taglineSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const taglineCenterY = SPREAD_H * 0.62;
  COVER_TAGLINE.forEach((line, i) => {
    ctx.fillText(line, halfW / 2, taglineCenterY + (i - (COVER_TAGLINE.length - 1) / 2) * (taglineSize * 1.35));
  });

  // URL
  ctx.fillStyle = "#b88a2a";
  ctx.font = `600 36px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), halfW / 2, SPREAD_H * 0.9);

  /* ── RIGHT: front cover ── */
  const img = await safeLoad(page.image);
  if (img) {
    const ratio = Math.max(halfW / img.naturalWidth, SPREAD_H / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    ctx.drawImage(img, halfW + (halfW - dw) / 2, (SPREAD_H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(halfW, 0, halfW, SPREAD_H);
  }

  // Title overlay band
  const bandH = SPREAD_H * 0.28;
  const bandGrad = ctx.createLinearGradient(halfW, 0, halfW, bandH);
  bandGrad.addColorStop(0, "rgba(255,255,255,0.94)");
  bandGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(halfW, 0, halfW, bandH);

  const title = page.coverTitle || `${childName}'s Torah Tale`;
  ctx.fillStyle = "#2b2418";
  ctx.font = `bold 78px 'Playfair Display', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, title, halfW - 120);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, halfW + halfW / 2, 70 + i * 90);
  });
  if (page.coverSubtitle) {
    ctx.fillStyle = "#b88a2a";
    ctx.font = `italic 42px ${BOOK_TEXT_STYLE.fontFamily}`;
    ctx.fillText(page.coverSubtitle, halfW + halfW / 2, 70 + titleLines.length * 90 + 18);
  }

  drawGutter(ctx);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Generates a printable PDF: one landscape spread per sheet.
 */
export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  _torahPortion: string
): Promise<Blob> {
  // Filter out any legacy back-cover entries — cover spread handles both sides.
  const renderable = pages.filter((p) => p.type !== "back-cover");

  // 2:1 landscape sheet. Use ~14"×7" so print suppliers can scale to spread trim.
  const pageW = 356; // mm (14")
  const pageH = 178; // mm (7")
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageW, pageH] });

  // Track story page index for alternating side
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
      const side: "left" | "right" = storyIdx % 2 === 0 ? "left" : "right";
      storyIdx += 1;
      dataUrl = await renderStorySpread(page, side);
    }
    try {
      pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, pageH);
    } catch {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, pageW, pageH, "F");
    }
  }

  return pdf.output("blob");
}
