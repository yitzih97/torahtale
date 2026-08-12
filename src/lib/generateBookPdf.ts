import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_URL, getCoverTagline, getCoverHeadline, getCoverCta, getCoverChildLine, COMING_NEXT_LABEL, type BookPage } from "@/components/wizard/BookViewer";
import { BOOK_HEBREW_FONT } from "@/components/wizard/EditableTextBox";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { DEFAULT_TEXT_LAYOUT, DEFAULT_BORDER_COLOR, DEFAULT_OUTLINE_COLOR, makeDefaultLayout, makeQuestionsLayout, migrateLayout, type TextLayout } from "@/components/wizard/EditableTextBox";
import { computeAutoTextLayout } from "@/lib/analyzeImageLayout";
import { wrapText } from "@/lib/wrapText";
import { fitQuestionsLayout, buildQuestionsText } from "@/lib/fitQuestions";
import { applyLineArt } from "@/lib/lineArt";
import torahTaleLogoFull from "@/assets/brand/torah-tale-logo-full.png";
import { SERIES_SHOWCASE, SERIES_ROW_LABEL } from "@/data/seriesShowcase";
import { COVER_GOLD } from "@/lib/coverBranding";
import { localizedCoverName } from "@/lib/hebrewName";

/* Spread = 2:1 landscape sheet. Image fills one half, text composited
   per page from BookPage.textLayout. */

const SPREAD_W = 2400;
const SPREAD_H = 1200;
const HALF_W = SPREAD_W / 2;

// Coloring book: 8.5×11 PORTRAIT line-art pages (ratio 8.5:11), at the same
// ~150dpi logical scale as the other formats.
const COLOR_W = 1275;
const COLOR_H = 1650;

// Render at 2× the 1200-based canvas so BOTH the downloadable PDF and the
// Printify print slots come out at ~300 DPI (pages 2400², cover ~4800×2400)
// instead of a soft 150 DPI. Text stays crisp; the cover wrap prints sharp.
const PRINT_SCALE = 2;

/** Interior page layout for a book format:
 *   • "spread"   — board (6×6): one wide 2:1 illustration per open spread.
 *   • "portrait" — coloring (8.5×11): one tall line-art page.
 *   • "square"   — softcover/hardcover (8×8): one square page.  */
type LayoutMode = "spread" | "portrait" | "square";

/** Board (6×6) prints as wide 2:1 spreads; softcover/hardcover (8×8) print as
 *  separate square pages; coloring (8.5×11) prints as tall portrait pages. A
 *  "board" book with far more pages than the 10-spread blueprint holds was
 *  mis-flagged, so fall back to page-based square. */
function isSpreadBased(bookFormat: string, pages: BookPage[]): boolean {
  const storyCount = pages.filter((p) => p.type === "story" || !p.type).length;
  return bookFormat.startsWith("board") && storyCount <= 12;
}

function layoutMode(bookFormat: string, pages: BookPage[]): LayoutMode {
  if (isSpreadBased(bookFormat, pages)) return "spread";
  if ((bookFormat || "").startsWith("coloring")) return "portrait";
  return "square";
}

/** Interior canvas dimensions (logical px, before print scale) for a mode. */
function interiorDims(mode: LayoutMode): [number, number] {
  if (mode === "spread") return [SPREAD_W, SPREAD_H];
  if (mode === "portrait") return [COLOR_W, COLOR_H];
  return [SPREAD_H, SPREAD_H];
}

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


// Phrase-aware line wrapping (breaks at natural pauses, honors "\n") lives in a
// shared module so the renderer and the auto font-fitter stay in sync.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  return wrapText((s) => ctx.measureText(s).width, text, maxWidth);
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

/** Fill the whole canvas with the cream "paper" background + soft center glow.
 *  Used for the discussion-questions page so the questions sit on a clean,
 *  empty page and stay easy to read. */
function drawPaperFull(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.6);
  glow.addColorStop(0, "rgba(232, 197, 117, 0.30)");
  glow.addColorStop(1, "rgba(232, 197, 117, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

/** Composite a text overlay using the page's TextLayout. Coords are % of the
 *  canvas (W×H). */
const HEBREW_RE = /[֐-׿]/;

/** A caption may mix English + Hebrew (joined with a blank line). Each language
 *  needs its OWN direction (else Hebrew sentence-final punctuation lands on the
 *  wrong side) AND its own font (Hebrew → the Hebrew serif with nikud). Split any
 *  Hebrew-containing text into per-language blocks so they render as clean
 *  sections (English LTR body font, Hebrew RTL serif). Latin-only text stays one
 *  block in the box's own font. `bodyFont` is the box font used for English. */
function textSegments(text: string, rtl: boolean, align: CanvasTextAlign, bodyFont: string, baseBold: boolean) {
  if (!HEBREW_RE.test(text)) {
    return [{ dir: (rtl ? "rtl" : "ltr") as CanvasDirection, align, text, font: bodyFont, bold: baseBold }];
  }
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const heb = HEBREW_RE.test(p);
      return {
        dir: (heb ? "rtl" : "ltr") as CanvasDirection,
        // Hebrew keeps a centered layout centered, otherwise sits at its natural
        // right (reading-start) edge; English follows the box's own alignment.
        align: (heb ? (align === "center" ? "center" : "right") : align) as CanvasTextAlign,
        text: p,
        font: heb ? BOOK_HEBREW_FONT : bodyFont,
        // Hebrew always renders bold (its serif reads better heavier); English
        // follows the box weight.
        bold: heb ? true : baseBold,
      };
    });
}

function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, layout: TextLayout, W: number, H: number, rtl = false) {
  if (!text) return;
  // layout.fontSize and padding are absolute px defined against a 1024px-wide
  // reference container (see EditableTextBox / TextLayout). Scale them by the
  // canvas width so the PDF matches the on-screen preview 1:1.
  const scale = W / 1024;
  const fontSize = layout.fontSize * scale;
  const italic = layout.italic ? "italic " : "";
  const fontStr = (family: string, bold: boolean) => `${italic}${bold ? "700" : "400"} ${fontSize}px ${family}`;
  ctx.font = fontStr(layout.fontFamily, layout.bold);
  ctx.textBaseline = "top";

  const boxX = (layout.x / 100) * W;
  const boxY = (layout.y / 100) * H;
  const boxW = (layout.width / 100) * W;
  const hasPad = layout.background || layout.border;
  const padX = (hasPad ? 18 : 6) * scale;
  const padY = (hasPad ? 14 : 4) * scale;
  const maxTextW = boxW - padX * 2;
  const lineHeight = fontSize * (layout.lineHeight ?? 1.5);

  // Wrap each language block with its own direction + font, keeping per-line
  // direction/alignment/font so both sections render correctly.
  const segments = textSegments(text, rtl, layout.align, layout.fontFamily, layout.bold);
  const rendered: { line: string; dir: CanvasDirection; align: CanvasTextAlign; font: string; bold: boolean }[] = [];
  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    ctx.direction = seg.dir;
    ctx.font = fontStr(seg.font, seg.bold);
    const wrapped = wrapLines(ctx, seg.text, maxTextW);
    if (s > 0) rendered.push({ line: "", dir: seg.dir, align: seg.align, font: seg.font, bold: seg.bold }); // spacer row
    for (const ln of wrapped) rendered.push({ line: ln, dir: seg.dir, align: seg.align, font: seg.font, bold: seg.bold });
  }

  const textH = rendered.length * lineHeight;
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
    ctx.strokeStyle = layout.borderColor ?? DEFAULT_BORDER_COLOR;
    ctx.lineWidth = 2;
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.stroke();
  }

  // Optional soft drop shadow behind the letters (mirrors the on-screen
  // textShadow). Applied to the fill pass only; cleared before the outline
  // stroke so the white border stays crisp.
  const shadow = !!layout.shadow;

  // Thin solid-white BORDER behind the letters keeps captions readable on any
  // scene without a background box (mirrors the outlineWidth stroke in
  // EditableTextBox). Skipped when a solid background box is already present
  // or the outline is set to 0.
  const outlineWidthRef = layout.outlineWidth ?? 2; // px at the 1024-ref container
  const outline = !layout.background && outlineWidthRef > 0;
  const outlineColor = layout.outlineColor ?? DEFAULT_OUTLINE_COLOR;
  const outlineLW = Math.max(1, outlineWidthRef * (fontSize / layout.fontSize));
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  const anchorFor = (align: CanvasTextAlign) =>
    align === "center" ? boxX + boxW / 2 : align === "right" ? boxX + boxW - padX : boxX + padX;
  for (let i = 0; i < rendered.length; i++) {
    const { line, dir, align, font, bold } = rendered[i];
    if (!line) continue; // spacer
    ctx.direction = dir;
    ctx.textAlign = align;
    ctx.font = fontStr(font, bold);
    const textAnchorX = anchorFor(align);
    const ly = boxY + padY + i * lineHeight;
    // Shadow pass: paint the OUTER glyph shape with a shadow enabled, then redraw
    // the crisp outline + fill on top (mirrors CSS text-shadow). Two passes — a
    // tight, dense dark halo (thickens the edge like a soft outline) and a softer
    // offset drop — keep white captions readable on any scene.
    if (shadow) {
      const drawGlyph = () => {
        if (outline) {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = outlineLW;
          ctx.strokeText(line, textAnchorX, ly);
        } else {
          ctx.fillStyle = layout.color;
          ctx.fillText(line, textAnchorX, ly);
        }
      };
      // Tight dark halo — drawn twice to build up a thicker, denser edge.
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = Math.max(2, 4 * scale);
      ctx.shadowOffsetY = 0;
      drawGlyph();
      drawGlyph();
      ctx.restore();
      // Softer offset drop for depth.
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = Math.max(3, 9 * scale);
      ctx.shadowOffsetY = 2 * scale;
      drawGlyph();
      ctx.restore();
    }
    if (outline) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineLW;
      ctx.strokeText(line, textAnchorX, ly);
    }
    ctx.fillStyle = layout.color;
    ctx.fillText(line, textAnchorX, ly);
  }
}

function drawGutter(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const midX = W / 2;
  const grad = ctx.createLinearGradient(midX - 12, 0, midX + 12, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.32)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(midX - 12, 0, 24, H);
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

/** Cover-fit an image across the full canvas (mirrors CSS object-cover, which
 *  the on-screen preview uses for story pages — full spread for board, single
 *  square page for 8×8). */
function drawFullImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const ratio = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

async function renderStorySpread(page: BookPage, _storyIdx: number, rtl: boolean, mode: LayoutMode, scale = 1): Promise<string> {
  // Caption fonts (Fredoka / Frank Ruhl) must be loaded before drawing, or the
  // canvas falls back inconsistently and pages end up in different fonts.
  await ensureBookFonts();
  // Board: 2:1 spread. 8×8: square page. Coloring: 8.5×11 portrait page.
  const [W, H] = interiorDims(mode);

  // `scale` renders at a higher backing resolution (used for print — the Printify
  // page slot is 2400², double our 1200 base) while keeping every coordinate/font
  // size in the original logical space, so nothing below needs to change.
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  // The source AI image is native-resolution (well under the print canvas
  // size) and gets stretched up via drawImage — canvas defaults to LOW-quality
  // smoothing for that resample, which reads as blur/softness. Use the best
  // available resampling filter instead.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (scale !== 1) ctx.scale(scale, scale);

  const img = await safeLoad(page.image);
  // Layout precedence: an admin-adjusted layout wins; otherwise auto-place the
  // text over the illustration's calmest area; otherwise the static default.
  let layout = migrateLayout(page.textLayout);
  if (img) {
    drawFullImage(ctx, img, W, H);
    if (!layout) layout = computeAutoTextLayout(img, rtl, page.text) || undefined;
    // Coloring interior pages are generated in full colour at 2K (crisp) and
    // converted to clean B&W line art HERE on the client — this conversion used
    // to run in the edge function but couldn't handle 2K. Do it on the drawn
    // canvas before the caption goes on top.
    if (mode === "portrait") {
      const cw = canvas.width, ch = canvas.height;
      const id = ctx.getImageData(0, 0, cw, ch);
      applyLineArt(id.data, cw, ch);
      ctx.putImageData(id, 0, 0);
    }
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(0, 0, W, H);
  }
  if (!layout) layout = makeDefaultLayout(rtl ? "right" : "left", rtl);
  // Coloring pages are line art on WHITE — the white caption default would be
  // invisible, so force dark text with no shadow and a soft cream backing box.
  if (mode === "portrait") layout = { ...layout, color: "#2b2418", shadow: false, background: true };

  if (mode === "spread") drawGutter(ctx, W, H);
  drawTextOverlay(ctx, page.text || "", layout, W, H, rtl);
  // Coloring pages are pure black-on-white line art — JPEG's block compression
  // artifacts (ringing/haloing) are especially visible on hard edges like
  // these, so export losslessly. Painted illustrations stay JPEG (smaller,
  // and JPEG's loss is imperceptible on continuous-tone art).
  return mode === "portrait" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.96);
}

async function renderQuestionsSpread(page: BookPage, rtl: boolean, mode: LayoutMode, scale = 1): Promise<string> {
  await ensureBookFonts();
  // The questions page sits on a clean, empty parchment page (no illustration)
  // so the discussion text is always easy to read.
  const layout = migrateLayout(page.textLayout) || makeQuestionsLayout(rtl);
  const [W, H] = interiorDims(mode);
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  // The source AI image is native-resolution (well under the print canvas
  // size) and gets stretched up via drawImage — canvas defaults to LOW-quality
  // smoothing for that resample, which reads as blur/softness. Use the best
  // available resampling filter instead.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperFull(ctx, W, H);
  if (mode === "spread") drawGutter(ctx, W, H);
  const questions = page.questions || [];

  // Board books print as a wide 2:1 spread with a physical center fold. A single
  // block of questions would be cut down the middle by the fold, so split them
  // across the two pages of the spread (5 + 5), each column well clear of the
  // gutter. The first group goes on the page read first — the RIGHT half for a
  // right-to-left (Hebrew/Yiddish) book, the LEFT half otherwise.
  if (mode === "spread" && questions.length > 1) {
    const mid = Math.ceil(questions.length / 2);
    const firstText = buildQuestionsText(questions.slice(0, mid));
    const secondText = buildQuestionsText(questions.slice(mid));
    const leftText = rtl ? secondText : firstText;
    const rightText = rtl ? firstText : secondText;
    const HALF_PCT = 40; // % of the full 2:1 width — stays inside the 50% half
    const leftFit = fitQuestionsLayout(leftText, { ...layout, x: 6, width: HALF_PCT }, W, H, rtl);
    const rightFit = fitQuestionsLayout(rightText, { ...layout, x: 54, width: HALF_PCT }, W, H, rtl);
    // Match the two columns to a common font size so the spread reads as one set.
    const fs = Math.min(leftFit.fontSize, rightFit.fontSize);
    drawTextOverlay(ctx, leftText, { ...leftFit, fontSize: fs }, W, H, rtl);
    drawTextOverlay(ctx, rightText, { ...rightFit, fontSize: fs }, W, H, rtl);
    return canvas.toDataURL("image/jpeg", 0.96);
  }

  const formatted = questions.length ? buildQuestionsText(questions) : (page.text || "");
  const fitted = fitQuestionsLayout(formatted, layout, W, H, rtl);
  drawTextOverlay(ctx, formatted, fitted, W, H, rtl);
  return canvas.toDataURL("image/jpeg", 0.96);
}

/** Cover-fit an image into an arbitrary rounded rect (clipped), for the back-
 *  cover preview grid. */
function drawImageInRect(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export interface BackCoverPreview { label: string; url: string | null }

/* ─────────────── Cover "furniture": frame + majestic typography ───────────────
 * Draws the branded cover chrome over an already-drawn illustration, in the
 * current logical coordinate space (origin 0,0, size W×H): a navy filigree frame
 * with gold keylines + corner flourishes, the "TORAH TALE" brand, a big engraved
 * gold PARSHA title, a magenta personalized story title, and a bottom tagline.
 * Shared by the 8×8/hardcover/board wraparound and the coloring portrait cover. */


// The cover fonts are only used on the print canvas (no DOM node uses them), so
// make sure they are actually loaded before we draw or canvas silently falls back.
async function ensureBookFonts() {
  try {
    const f: any = (document as any).fonts;
    if (!f) return;
    await Promise.all([
      f.load("120px TorahTaleTitle"), f.load("70px TorahTaleTitle"),
      f.load("700 120px Cinzel"), f.load("600 40px Cinzel"),
      f.load("600 60px 'Cormorant Garamond'"), f.load("italic 500 40px 'Cormorant Garamond'"),
      // Story-caption fonts — MUST be loaded before drawing captions or the canvas
      // silently falls back (and inconsistently, page to page).
      f.load("400 40px Fredoka"), f.load("500 40px Fredoka"),
      f.load("400 40px 'Frank Ruhl Libre'"), f.load("700 40px 'Frank Ruhl Libre'"),
    ]);
    await f.ready;
    // Warm up the canvas font cache: the FIRST fillText with a freshly-loaded
    // font can still fall back (the cover never uses the Hebrew serif, so page 1's
    // Hebrew would be its first use and miss). Draw each once off-screen to prime.
    const warm = document.createElement("canvas").getContext("2d");
    if (warm) {
      for (const font of [
        "700 40px 'Frank Ruhl Libre'", "400 40px 'Frank Ruhl Libre'",
        "400 40px Fredoka", "700 40px Fredoka",
      ]) { warm.font = font; warm.fillText("אבּגְ Aa", -9999, -9999); }
    }
  } catch { /* fall back to whatever is available */ }
}

// Book-name title font for covers: the Torah Tale brand blackletter in Regular
// weight, gold-gradient engraved. Blackletter is unreadable in all-caps, so the
// parsha label keeps its natural title case (Hebrew glyphs fall back to Cinzel).
const coverTitleFont = (px: number) => `${Math.round(px)}px 'TorahTaleTitle', 'Cinzel', serif`;

function goldFill(ctx: CanvasRenderingContext2D, baselineY: number, capH: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, baselineY - capH * 0.92, 0, baselineY + capH * 0.12);
  g.addColorStop(0, "#fff6d5"); g.addColorStop(0.28, "#f6df97"); g.addColorStop(0.5, "#e7be5c");
  g.addColorStop(0.72, "#c9992f"); g.addColorStop(1, "#a9791f");
  return g;
}

// One line of engraved gold caps (deep shadow → dark bevel → gold face → highlight).
function engravedLine(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, font: string, capH: number) {
  ctx.save();
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillText(text, cx + 3, y + 4);
  ctx.fillStyle = "#5b3d0e"; ctx.fillText(text, cx, y + 2);
  ctx.fillStyle = goldFill(ctx, y, capH);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillText(text, cx, y);
  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(1, capH * 0.012); ctx.strokeStyle = "rgba(255,250,225,0.5)"; ctx.strokeText(text, cx, y);
  ctx.restore();
}

const letterSpace = (s: string, n = 2) => s.split("").join(" ".repeat(n));

// Centered ornament:  ·——❦——·
function coverFlourish(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - 16, y); ctx.moveTo(cx + 16, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
  ctx.font = "22px 'Cormorant Garamond', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("❦", cx, y);
  ctx.beginPath(); ctx.arc(cx - w / 2, y, 2.6, 0, 7); ctx.arc(cx + w / 2, y, 2.6, 0, 7); ctx.fill();
  ctx.restore();
}

function cornerFiligree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, s); ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.moveTo(s * 0.28, s); ctx.quadraticCurveTo(s * 0.28, s * 0.28, s, s * 0.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.1); ctx.quadraticCurveTo(s * 0.82, 0, s * 0.92, s * 0.22);
  ctx.quadraticCurveTo(s * 0.7, s * 0.2, s * 0.55, s * 0.1); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

/** Draw the branded frame + typography for a W×H cover at the current origin. The
 *  caller must have already drawn the illustration. */
function drawCoverFurniture(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  opts: { brand?: string; parsha: string; title?: string; childLine?: string; tagline?: string; rtl?: boolean },
) {
  const gold = COVER_GOLD, U = W; // size unit
  const dir: CanvasDirection = opts.rtl ? "rtl" : "ltr";

  // Legibility scrims: darken the top (title area) and soften the bottom (tagline).
  let g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, "rgba(8,14,30,0.82)"); g.addColorStop(0.55, "rgba(8,14,30,0.32)"); g.addColorStop(1, "rgba(8,14,30,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
  g = ctx.createLinearGradient(0, H * 0.82, 0, H);
  g.addColorStop(0, "rgba(8,14,30,0)"); g.addColorStop(1, "rgba(8,14,30,0.72)");
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.82, W, H * 0.18);

  // (No decorative frame — the cover runs clean to the edge.)
  const m = Math.round(U * 0.028), bw = Math.round(U * 0.02);
  ctx.direction = dir;
  const top = m + bw;
  // Brand.
  if (opts.brand) {
    ctx.save(); ctx.fillStyle = gold; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${Math.round(U * 0.028)}px 'Cinzel', serif`;
    ctx.fillText(letterSpace(opts.brand.toUpperCase(), 2), W / 2, top + U * 0.062);
    coverFlourish(ctx, W / 2, top + U * 0.084, U * 0.15, gold);
    ctx.restore();
  }
  // Parsha (book name) — big engraved gold blackletter, fit + wrap to ≤2 lines.
  const maxTW = W * 0.82;
  const fit = (t: string, base: number) => {
    let f = base; ctx.font = coverTitleFont(f);
    while (ctx.measureText(t).width > maxTW && f > U * 0.05) { f -= 4; ctx.font = coverTitleFont(f); }
    return f;
  };
  const words = (opts.parsha || "").split(" ");
  let l1 = opts.parsha || "", l2 = "";
  let fs = fit(l1, U * 0.125);
  if (fs < U * 0.08 && words.length > 1) {
    l1 = words.slice(0, -1).join(" "); l2 = words.slice(-1).join(" ");
    fs = Math.min(fit(l1, U * 0.125), fit(l2, U * 0.125));
  }
  const tFont = coverTitleFont(fs);
  // Anchor the title's TOP (not its baseline) at a print-safe margin from the
  // cover edge. Short parsha names use a big font whose glyph tops would
  // otherwise land in the hardcover wrap/trim zone and get cut off; positioning
  // by the top keeps EVERY title size safely inside the printed cover.
  let ty = U * 0.09 + fs;
  engravedLine(ctx, l1, W / 2, ty, tFont, fs);
  if (l2) { ty += fs * 1.02; engravedLine(ctx, l2, W / 2, ty, tFont, fs); }

  // Personalized title (no divider rule — it crowded/overlapped the "With <name>"
  // subtitle, so the flourish under the parsha title was removed).
  if (opts.title) {
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    // Split a bilingual personalized title into its language lines so English and
    // Hebrew each render on ONE compact line, in the right font + direction —
    // keeps the title small and near the top instead of sprawling over faces.
    const titleLines = opts.title.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean);
    const baseM = Math.round(U * 0.052);
    let my = ty + U * 0.045 + U * 0.038;
    for (const raw of titleLines) {
      const heb = HEBREW_RE.test(raw);
      const fam = heb ? BOOK_HEBREW_FONT : "'Cormorant Garamond', serif";
      let mf = baseM; ctx.font = `600 ${mf}px ${fam}`;
      while (ctx.measureText(raw).width > W * 0.8 && mf > U * 0.024) { mf -= 2; ctx.font = `600 ${mf}px ${fam}`; }
      ctx.direction = heb ? "rtl" : "ltr";
      // Golden letters (same gold as the parsha title), with a soft dark shadow
      // for legibility over the illustration.
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillStyle = goldFill(ctx, my, mf);
      ctx.fillText(raw, W / 2, my);
      ctx.shadowColor = "transparent";
      my += mf * 1.14;
    }
    ctx.direction = "ltr";
    if (opts.childLine) {
      const cfs = Math.round(U * 0.026);
      ctx.font = `italic 500 ${cfs}px 'Cormorant Garamond', serif`;
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "rgba(255,240,214,0.95)"; ctx.fillText(opts.childLine, W / 2, my + U * 0.004);
    }
    ctx.restore();
  }
  // Bottom tagline.
  if (opts.tagline) {
    ctx.save(); ctx.fillStyle = gold; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `italic 500 ${Math.round(U * 0.03)}px 'Cormorant Garamond', serif`;
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillText(opts.tagline, W / 2, H - (m + bw) - U * 0.052);
    ctx.shadowColor = "transparent";
    coverFlourish(ctx, W / 2, H - (m + bw) - U * 0.03, U * 0.17, gold);
    ctx.restore();
  }
  ctx.direction = "ltr";
}

/** Draw one "coming next" teaser thumbnail styled like the real branded front
 *  cover — navy keyline frame, engraved gold parsha title, magenta child line —
 *  instead of a plain white text band. Shared by the bound-book back cover and
 *  the coloring-book back matter so both match the front cover. */
function drawMiniCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  label: string,
  childName: string,
  x: number, y: number, size: number,
  rtl: boolean,
  lang: "en" | "he" | "yi" = "en",
) {
  const r = Math.max(8, size * 0.06);
  ctx.fillStyle = "#efe7d3";
  roundedRect(ctx, x, y, size, size, r); ctx.fill();
  if (img) drawImageInRect(ctx, img, x, y, size, size, r);

  ctx.save();
  roundedRect(ctx, x, y, size, size, r); ctx.clip();
  // Top scrim for title legibility over the illustration.
  const g = ctx.createLinearGradient(x, y, x, y + size * 0.6);
  g.addColorStop(0, "rgba(8,14,30,0.78)"); g.addColorStop(0.6, "rgba(8,14,30,0.18)"); g.addColorStop(1, "rgba(8,14,30,0)");
  ctx.fillStyle = g; ctx.fillRect(x, y, size, size * 0.6);
  // No decorative frame — the mini cover runs clean to the edge, matching the
  // current front cover (drawCoverFurniture). Parsha title in flat gold
  // blackletter (no engrave/drop shadow), ≤2 lines.
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const fs = Math.round(size * 0.1);
  ctx.font = coverTitleFont(fs);
  const lines = wrapLines(ctx, label || "", size - size * 0.12).slice(0, 2);
  let ty = y + size * 0.12 + fs;
  for (const ln of lines) { ctx.fillStyle = goldFill(ctx, ty, fs); ctx.fillText(ln, x + size / 2, ty); ty += fs * 1.1; }
  // Child line — "with [name]" in gold italic, localized to the book language.
  if (childName) {
    const cfs = Math.round(size * 0.07);
    ctx.font = `italic 600 ${cfs}px 'Cormorant Garamond', serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.fillStyle = goldFill(ctx, ty + cfs * 0.15, cfs);
    ctx.fillText(getCoverChildLine(childName, lang) || "", x + size / 2, ty + cfs * 0.15);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.30)"; ctx.lineWidth = 2;
  roundedRect(ctx, x, y, size, size, r); ctx.stroke();
}

/** Draw one "series" showcase tile — a rounded square collection image with the
 *  series name on a gold scrim along the bottom. Unlike drawMiniCover these are
 *  marketing thumbnails for OTHER series, so there's no personalized child line. */
function drawSeriesTile(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  label: string,
  x: number, y: number, size: number,
  rtl: boolean,
) {
  const r = Math.max(8, size * 0.06);
  ctx.fillStyle = "#efe7d3";
  roundedRect(ctx, x, y, size, size, r); ctx.fill();
  if (img) drawImageInRect(ctx, img, x, y, size, size, r);

  ctx.save();
  roundedRect(ctx, x, y, size, size, r); ctx.clip();
  // Bottom scrim so the series name stays legible over the illustration.
  const g = ctx.createLinearGradient(x, y + size * 0.42, x, y + size);
  g.addColorStop(0, "rgba(8,14,30,0)"); g.addColorStop(1, "rgba(8,14,30,0.85)");
  ctx.fillStyle = g; ctx.fillRect(x, y + size * 0.42, size, size * 0.58);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const fs = Math.round(size * 0.11);
  ctx.font = coverTitleFont(fs);
  const lines = wrapLines(ctx, label || "", size - size * 0.12).slice(0, 2);
  let ty = y + size - size * 0.1 - (lines.length - 1) * fs * 1.05;
  for (const ln of lines) { ctx.fillStyle = goldFill(ctx, ty, fs); ctx.fillText(ln, x + size / 2, ty); ty += fs * 1.05; }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.30)"; ctx.lineWidth = 2;
  roundedRect(ctx, x, y, size, size, r); ctx.stroke();
}

async function renderCoverSpread(
  page: BookPage,
  childName: string,
  parshaLabel: string,
  scale = 1,
  bookFormat = "",
  previews: BackCoverPreview[] = [],
  lang: "en" | "he" | "yi" = "en",
  localizedChildName?: string,
): Promise<string> {
  await ensureBookFonts();
  // The name to print on the cover in the book's own script (Hebrew/Yiddish
  // books show the child's name in Hebrew letters; English keeps it as typed).
  const coverChild = localizedCoverName(childName, lang, localizedChildName);
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W * scale; canvas.height = SPREAD_H * scale;
  const ctx = canvas.getContext("2d")!;
  // The source AI image is native-resolution (well under the print canvas
  // size) and gets stretched up via drawImage — canvas defaults to LOW-quality
  // smoothing for that resample, which reads as blur/softness. Use the best
  // available resampling filter instead.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (scale !== 1) ctx.scale(scale, scale);
  // Hebrew/Yiddish cover text renders RTL; the site URL stays LTR (a domain).
  const rtl = lang !== "en";
  const rtlDir: CanvasDirection = rtl ? "rtl" : "ltr";
  // A right-to-left book opens from the other side, so the wrap is FLIPPED
  // (mirrored, not rotated): the front illustration sits on the LEFT half and the
  // back panel on the RIGHT half — English's back-cover side becomes the Hebrew
  // front cover, and vice-versa. Everything stays upright.
  const backX = rtl ? HALF_W : 0;
  const frontX = rtl ? 0 : HALF_W;
  drawPaperHalf(ctx, rtl ? "right" : "left");

  // ── BACK COVER: a clean cream panel with the brand lockup pulled toward the
  // center, then TWO rows of big teasers filling the width — "coming next"
  // personalized covers on top and a taste of our other weekly series below —
  // and the subscribe CTA + URL. The teaser imagery sells the subscription, so
  // there's no paragraph blurb. ──
  const BW = HALF_W;                              // back cover = BW × SPREAD_H square
  const cx = backX + BW / 2;
  const padX = 64;

  // Brand logo — nudged DOWN from the very top so it sits closer to the gold
  // flourish + series headline (a tighter, more central lockup).
  const logo = await safeLoad(torahTaleLogoFull);
  if (logo) {
    const logoH = 200;
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    ctx.drawImage(logo, cx - logoW / 2, 74, logoW, logoH);
  }

  // Gold flourish + series headline — flat gold (no engrave/shadow) so it stays
  // crisp and sharp.
  coverFlourish(ctx, cx, 314, BW * 0.26, COVER_GOLD);
  ctx.direction = rtlDir;
  {
    ctx.save();
    const hSize = 48;
    ctx.font = coverTitleFont(hSize); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = goldFill(ctx, 374, hSize);
    ctx.fillText(getCoverHeadline(lang), cx, 374);
    ctx.restore();
  }

  // Big square teasers fill the width, 4 across, gutter-to-gutter.
  const tgap = 20;
  const thumb = Math.floor((BW - padX * 2 - 3 * tgap) / 4); // ≈ 253
  const rowW = 4 * thumb + 3 * tgap;
  const rowX = cx - rowW / 2;

  // Row 1 — "Coming next" personalized mini front covers (empty until generated).
  ctx.direction = rtlDir;
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#8a7452";
  ctx.font = `600 18px 'Inter', sans-serif`;
  ctx.fillText(letterSpace((COMING_NEXT_LABEL[lang] || COMING_NEXT_LABEL.en).toUpperCase(), 2), cx, 430);
  const previewImgs = await Promise.all(previews.slice(0, 4).map((p) => (p.url ? safeLoad(p.url) : Promise.resolve(null))));
  const row1Y = 446;
  for (let i = 0; i < 4; i++) {
    const tx = rowX + i * (thumb + tgap);
    drawMiniCover(ctx, previewImgs[i], previews[i]?.label || "", coverChild, tx, row1Y, thumb, rtl, lang);
  }

  // Row 2 — a taste of our other weekly series (Yamim Tovim, Middos, …).
  const row2LabelY = row1Y + thumb + 42;
  ctx.direction = rtlDir;
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#8a7452";
  ctx.font = `600 18px 'Inter', sans-serif`;
  ctx.fillText(letterSpace((SERIES_ROW_LABEL[lang] || SERIES_ROW_LABEL.en).toUpperCase(), 2), cx, row2LabelY);
  const seriesImgs = await Promise.all(SERIES_SHOWCASE.map((s) => safeLoad(s.image)));
  const row2Y = row2LabelY + 16;
  for (let i = 0; i < 4; i++) {
    const tx = rowX + i * (thumb + tgap);
    drawSeriesTile(ctx, seriesImgs[i], SERIES_SHOWCASE[i].label[lang] || SERIES_SHOWCASE[i].label.en, tx, row2Y, thumb, rtl);
  }

  // CTA + site URL (a domain → always LTR).
  const ctaY = row2Y + thumb + 56;
  ctx.direction = rtlDir;
  ctx.textAlign = "center";
  ctx.fillStyle = "#5a4a32";
  ctx.font = `italic 30px ${BOOK_TEXT_STYLE.fontFamily}`;
  ctx.fillText(getCoverCta(lang), cx, ctaY);
  ctx.direction = "ltr";
  ctx.fillStyle = "#b88a2a";
  ctx.font = `700 40px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), cx, ctaY + 48);

  // ── FRONT COVER: illustration + Parsha name + child (right half LTR, left
  // half for a mirrored RTL wrap). ──
  const img = await safeLoad(page.image);
  if (img) {
    drawHalfImage(ctx, img, frontX);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(frontX, 0, HALF_W, SPREAD_H);
  }
  // Front cover chrome: navy filigree frame, "Torah Tale" brand, big gold PARSHA
  // title, a gold "With [kids]" subtitle, and a bottom tagline — drawn over the
  // illustration.
  ctx.save();
  ctx.translate(frontX, 0);
  drawCoverFurniture(ctx, HALF_W, SPREAD_H, {
    parsha: parshaLabel,
    title: getCoverChildLine(childName, lang, localizedChildName),
    rtl,
  });
  ctx.restore();
  drawGutter(ctx, SPREAD_W, SPREAD_H);

  // ── SPINE — width tracks the physical book thickness so the fold lands right:
  // board books are thick, hardcover medium, softcover very thin. ──
  const spineFrac = bookFormat.startsWith("board") ? 0.045 : bookFormat.startsWith("hardcover") ? 0.025 : 0.012;
  const spineW = SPREAD_W * spineFrac;
  const spineX = HALF_W - spineW / 2;
  ctx.fillStyle = "#efe7d3";
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  const spineShade = ctx.createLinearGradient(spineX, 0, spineX + spineW, 0);
  spineShade.addColorStop(0, "rgba(0,0,0,0.16)");
  spineShade.addColorStop(0.5, "rgba(0,0,0,0)");
  spineShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = spineShade;
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  // Only letter the spine when it's physically wide enough to read.
  if (spineW >= 60) {
    const spineText = [parshaLabel, coverChild].filter(Boolean).join("  ·  ");
    ctx.save();
    ctx.translate(HALF_W, SPREAD_H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.direction = rtlDir;
    ctx.fillStyle = "#2b2418";
    ctx.font = `600 ${Math.min(40, spineW * 0.5)}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spineText, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.96);
}

/** Coloring-book cover: a single 8.5×11 PORTRAIT front cover — the line-art
 *  cover image full-bleed with the book name + kids in white over a dark top
 *  gradient. Coloring books aren't perfect-bound, so there's no wraparound
 *  back/spine like the 8×8 books. */
async function renderPortraitCover(
  page: BookPage,
  childName: string,
  parshaLabel: string,
  scale = 1,
  lang: "en" | "he" | "yi" = "en",
  localizedChildName?: string,
): Promise<string> {
  await ensureBookFonts();
  const W = COLOR_W, H = COLOR_H;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  // The source AI image is native-resolution (well under the print canvas
  // size) and gets stretched up via drawImage — canvas defaults to LOW-quality
  // smoothing for that resample, which reads as blur/softness. Use the best
  // available resampling filter instead.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (scale !== 1) ctx.scale(scale, scale);
  const rtl = lang !== "en";

  const img = await safeLoad(page.image);
  if (img) drawFullImage(ctx, img, W, H);
  else { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H); }

  // Same branded chrome as the bound books. Coloring covers show the localized
  // parsha name (gold) + the kids' names (magenta) rather than the story's
  // generated bilingual title.
  drawCoverFurniture(ctx, W, H, {
    parsha: parshaLabel,
    title: getCoverChildLine(childName, lang, localizedChildName),
    rtl,
  });
  return canvas.toDataURL("image/jpeg", 0.96);
}

/** Coloring books have no printed back cover, so the LAST page doubles as the
 *  back matter: the Torah Tale logo, up to 10 discussion questions, the
 *  subscribe invitation, and the 4 "coming next" teaser thumbnails — everything
 *  that would otherwise live on a back cover. 8.5×11 portrait. */
async function renderColoringBackMatter(
  page: BookPage,
  childName: string,
  previews: BackCoverPreview[],
  lang: "en" | "he" | "yi",
  scale = 1,
  localizedChildName?: string,
): Promise<string> {
  const W = COLOR_W, H = COLOR_H;
  const rtl = lang !== "en";
  const coverChild = localizedCoverName(childName, lang, localizedChildName);
  // The branded teaser thumbnails use canvas-only fonts (Cinzel/Cormorant), so
  // make sure they're loaded before drawing or the canvas silently falls back.
  await ensureBookFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  // The source AI image is native-resolution (well under the print canvas
  // size) and gets stretched up via drawImage — canvas defaults to LOW-quality
  // smoothing for that resample, which reads as blur/softness. Use the best
  // available resampling filter instead.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperFull(ctx, W, H);
  const padX = W * 0.08;
  let y = H * 0.035;

  // ── Combined brand logo (single lockup: book icon on top of the wordmark) +
  //    series headline, centered. ──
  const logo = await safeLoad(torahTaleLogoFull);
  if (logo) {
    const logoH = 165, logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    ctx.drawImage(logo, W / 2 - logoW / 2, y, logoW, logoH);
    y += logoH + 14;
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const hf = 30;
    engravedLine(ctx, getCoverHeadline(lang), W / 2, y + hf, coverTitleFont(hf), hf);
    y += hf + 24;
    ctx.textBaseline = "top";
  }

  // ── Up to 10 discussion questions ──
  const allQ = (page.questions && page.questions.length)
    ? page.questions.map((q) => `${q.number}. ${q.question}`)
    : (page.text || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const questions = allQ.slice(0, 10);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.textBaseline = "top";
  const anchorX = rtl ? W - padX : padX;
  ctx.fillStyle = "#b88a2a";
  ctx.font = `bold 38px 'Playfair Display', serif`;
  const questionsHeader = lang === "he" ? "שאלות לדיון" : lang === "yi" ? "פֿראגן צום רעדן" : "Questions to Talk About";
  ctx.fillText(questionsHeader, anchorX, y);
  y += 54;
  ctx.fillStyle = "#2b2418";
  const qf = 27;
  ctx.font = `${qf}px ${BOOK_TEXT_STYLE.fontFamily}`;
  for (const q of questions) {
    for (const ln of wrapLines(ctx, q, W - padX * 2)) { ctx.fillText(ln, anchorX, y); y += qf * 1.32; }
    y += 5;
  }

  // ── Subscribe invitation (localized → RTL); URL stays LTR ──
  y = Math.max(y + 18, H * 0.66);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = "#5a4a32";
  const tSize = 32;
  ctx.font = `italic ${tSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const taglineLines = page.backCoverText && page.backCoverText.trim()
    ? page.backCoverText.split("\n").map((l) => l.trim()).filter(Boolean)
    : getCoverTagline(lang);
  taglineLines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * (tSize * 1.3)));
  y += taglineLines.length * (tSize * 1.3) + 22;

  // ── "Coming next" teaser thumbnails (mini front covers) ──
  const previewImgs = await Promise.all(previews.slice(0, 4).map((p) => (p.url ? safeLoad(p.url) : Promise.resolve(null))));
  const thumb = 235, tgap = 22;
  const rowW = 4 * thumb + 3 * tgap;
  const rowX = W / 2 - rowW / 2;
  for (let i = 0; i < 4; i++) {
    const tx = rowX + i * (thumb + tgap);
    drawMiniCover(ctx, previewImgs[i], previews[i]?.label || "", coverChild, tx, y, thumb, rtl, lang);
  }
  y += thumb + 26;

  // ── CTA + site URL ──
  const urlY = Math.min(y + 30, H - 40);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = "#5a4a32";
  ctx.font = `italic 24px ${BOOK_TEXT_STYLE.fontFamily}`;
  ctx.fillText(getCoverCta(lang), W / 2, urlY - 34);
  ctx.direction = "ltr";
  ctx.fillStyle = "#b88a2a";
  ctx.font = `700 28px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), W / 2, urlY);

  return canvas.toDataURL("image/jpeg", 0.96);
}

/**
 * Composite the print-ready images for Printify, in the exact order of the
 * blueprint's print placeholders: [cover-wrap, page_1, page_2, …]. These are
 * the SAME fully-rendered images the PDF/preview use — the cover is a 2:1
 * wraparound (back + spine + front, with the title baked on) and every interior
 * page has its caption text composited in. printify-submit uploads these instead
 * of the raw, text-free stored illustrations (which was why printed books came
 * out with no text and a mis-arranged cover).
 *
 * The discussion-questions page is rendered as its own clean page (matching the
 * on-screen PDF), filling the trailing interior slot — earlier it was composited
 * onto the last story illustration, which overlapped the art.
 */
/** Pull the back-cover teasers from the generated "preview" pages (each carries
 *  an upcoming `portion` + its generated cover `image`). Label is derived from
 *  the portion so it follows the book's language. */
function backCoverPreviews(pages: BookPage[], lang: "en" | "he" | "yi"): BackCoverPreview[] {
  return pages
    .filter((p) => p.type === "preview")
    .slice(0, 4)
    .map((p) => ({ label: getPortionDisplay(p.portion || "", lang) || p.portion || "", url: p.image }));
}

export async function renderPrintImages(
  pages: BookPage[],
  childName: string,
  torahPortion: string,
  rtl = false,
  bookFormat = "",
  lang: "en" | "he" | "yi" = "en",
  localizedChildName?: string,
): Promise<string[]> {
  const parshaLabel = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  const mode = layoutMode(bookFormat, pages);
  const cover = pages.find((p) => p.type === "cover");
  const previews = backCoverPreviews(pages, lang);
  let coverImg: string | null = null;
  if (cover) coverImg = await (mode === "portrait"
    ? renderPortraitCover(cover, childName, parshaLabel, PRINT_SCALE, lang, localizedChildName)
    : renderCoverSpread(cover, childName, parshaLabel, PRINT_SCALE, bookFormat, previews, lang, localizedChildName));

  // Interior pages, in natural reading order (story 1…N, then discussion).
  const interior: string[] = [];
  const questionsPage = pages.find((p) => p.type === "questions");
  // Each Printify blueprint has a fixed interior capacity (Cover + N PAGES).
  // The discussion-questions page must take the LAST interior slot, so cap the
  // story pages to leave room for it — dropping the trailing story page(s) when
  // a book was generated with too many (older/subscription books). This is what
  // keeps the order within the blueprint's slot count so submit doesn't fail.
  const interiorCapacity = bookFormat.startsWith("hardcover") ? 24
    : bookFormat.startsWith("board") ? 10
    : bookFormat.startsWith("coloring") ? 24
    : 20; // softcover
  const maxStories = Math.max(1, interiorCapacity - (questionsPage ? 1 : 0));
  const stories = pages.filter((p) => p.type === "story" || !p.type).slice(0, maxStories);
  for (let i = 0; i < stories.length; i++) {
    interior.push(await renderStorySpread(stories[i], i, rtl, mode, PRINT_SCALE));
  }
  // The discussion questions get their OWN page — matching the on-screen PDF.
  // Bound 8×8/board books have a trailing interior page slot for it (Printify was
  // leaving that page blank while the questions were composited onto the last
  // story illustration, overlapping the art). Coloring books get a dedicated
  // back-matter page instead (they have no back cover for the teasers).
  if (questionsPage) {
    interior.push(mode === "portrait"
      ? await renderColoringBackMatter(questionsPage, childName, previews, lang, PRINT_SCALE, localizedChildName)
      : await renderQuestionsSpread(questionsPage, rtl, mode, PRINT_SCALE));
  }

  // Right-to-left (Hebrew/Yiddish) books open from the other side, so the book is
  // FLIPPED (not rotated — every page stays upright): the interior page order is
  // reversed, and the cover wrap is laid out mirrored (front on the left half,
  // back on the right) by renderCoverSpread. English's back-cover side becomes
  // the Hebrew front, and vice-versa.
  const ordered = rtl ? [...interior].reverse() : interior;
  const final: string[] = [];
  if (coverImg) final.push(coverImg);
  final.push(...ordered);
  return final;
}

export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  torahPortion: string,
  rtl = false,
  bookFormat = "",
  lang: "en" | "he" | "yi" = "en",
  localizedChildName?: string,
): Promise<Blob> {
  // Cover text: Parsha name is the hero (big), kids are the co-stars (small),
  // mirroring the on-screen BookViewer.
  const parshaLabel = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  // Board (6×6) → wide 2:1 spreads. Softcover/Hardcover (8×8) → square pages.
  // Coloring (8.5×11) → tall portrait line-art pages with a portrait front cover.
  const mode = layoutMode(bookFormat, pages);
  const pdfPreviews = backCoverPreviews(pages, lang);
  const renderable = pages.filter((p) => p.type !== "back-cover" && p.type !== "preview");
  const WIDE: [number, number] = [356, 178]; // mm — 2:1 cover/spread
  const SQUARE: [number, number] = [178, 178]; // mm — single 8×8 page
  const LETTER: [number, number] = [215.9, 279.4]; // mm — 8.5×11 portrait coloring page
  const interior: [number, number] = mode === "spread" ? WIDE : mode === "portrait" ? LETTER : SQUARE;
  // Bound 8×8/board books have a wide wraparound cover; the coloring book has a
  // single portrait front cover the same size as its pages.
  const coverFmt: [number, number] = mode === "portrait" ? LETTER : WIDE;

  const pdf = new jsPDF({
    orientation: coverFmt[0] >= coverFmt[1] ? "landscape" : "portrait",
    unit: "mm",
    format: coverFmt,
  });

  // Render the cover and the interior pages (natural reading order) separately,
  // so an RTL book can reverse the interiors (see renderPrintImages) — the cover
  // stays first (mirrored), then the reversed pages. Nothing is rotated.
  const coverPage = renderable.find((p) => p.type === "cover");
  const interiorPages = renderable.filter((p) => p.type !== "cover");

  const coverEntry = coverPage
    ? {
        dataUrl: mode === "portrait"
          ? await renderPortraitCover(coverPage, childName, parshaLabel, PRINT_SCALE, lang, localizedChildName)
          : await renderCoverSpread(coverPage, childName, parshaLabel, PRINT_SCALE, bookFormat, pdfPreviews, lang, localizedChildName),
        fmt: coverFmt,
      }
    : null;

  let storyIdx = 0;
  const interiorEntries: { dataUrl: string; fmt: [number, number] }[] = [];
  for (const page of interiorPages) {
    let dataUrl: string;
    if (page.type === "questions") {
      // Coloring books have no back cover — the questions page becomes the back
      // matter (logo + up to 10 questions + subscribe + teaser thumbnails).
      dataUrl = mode === "portrait"
        ? await renderColoringBackMatter(page, childName, pdfPreviews, lang, PRINT_SCALE, localizedChildName)
        : await renderQuestionsSpread(page, rtl, mode, PRINT_SCALE);
    } else {
      dataUrl = await renderStorySpread(page, storyIdx, rtl, mode, PRINT_SCALE);
      storyIdx += 1;
    }
    interiorEntries.push({ dataUrl, fmt: interior });
  }

  // RTL: flip the book — reverse the interior order (the cover is already laid
  // out mirrored). Pages stay upright; nothing is rotated.
  const orderedInterior = rtl ? [...interiorEntries].reverse() : interiorEntries;
  const entries = [...(coverEntry ? [coverEntry] : []), ...orderedInterior];

  for (let i = 0; i < entries.length; i++) {
    const { fmt, dataUrl } = entries[i];
    if (i > 0) pdf.addPage(fmt, fmt[0] >= fmt[1] ? "landscape" : "portrait");
    try {
      // Coloring interior pages are exported as PNG (see renderStorySpread) —
      // jsPDF needs the format arg to match the actual encoding, not just the
      // page type.
      const imgFormat = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(dataUrl, imgFormat, 0, 0, fmt[0], fmt[1]);
    } catch {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, fmt[0], fmt[1], "F");
    }
  }
  // expose default for any callers that need it
  void DEFAULT_TEXT_LAYOUT;
  return pdf.output("blob");
}
