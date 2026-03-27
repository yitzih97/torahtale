import JSZip from "jszip";
import type { TextStyle } from "@/components/wizard/DraggableText";

export interface BookPage {
  type?: string;
  image?: string | null;
  text?: string;
  textStyle?: TextStyle;
}

/**
 * Load an image URL/data-URL into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Composite text overlay onto an image using an offscreen canvas,
 * matching the DraggableText rendering exactly.
 */
async function compositeImageWithText(
  imageSrc: string,
  text: string,
  style: TextStyle
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw base image
  ctx.drawImage(img, 0, 0);

  if (!text) {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
  }

  // Calculate text position/size in canvas pixels
  // The style uses percentages relative to the container and px font sizes
  // We need to scale from the display size (assume 4:3 aspect ~800px wide) to actual image pixels
  const displayWidth = 800; // approximate display container width
  const scale = canvas.width / displayWidth;

  const x = (style.x / 100) * canvas.width;
  const y = (style.y / 100) * canvas.height;
  const boxWidth = (style.width / 100) * canvas.width;
  const fontSize = style.fontSize * scale;

  // Set font
  const fontFamily = style.fontFamily || "'Georgia', serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = style.textAlign || "center";
  ctx.textBaseline = "middle";

  // Word-wrap text
  const maxWidth = boxWidth - 20 * scale; // padding
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    const words = para.split(" ");
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

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;
  const padding = 12 * scale;

  // Draw background rectangle
  if (style.bgOpacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${style.bgOpacity})`;
    const bgX = x - boxWidth / 2;
    const bgY = y - totalTextHeight / 2 - padding;
    const bgH = totalTextHeight + padding * 2;
    const radius = 8 * scale;
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, boxWidth, bgH, radius);
    ctx.fill();
  }

  // Draw text lines
  ctx.fillStyle = style.color || "#ffffff";
  let textX = x;
  if (style.textAlign === "left") textX = x - boxWidth / 2 + padding;
  else if (style.textAlign === "right") textX = x + boxWidth / 2 - padding;

  const startY = y - totalTextHeight / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textX, startY + i * lineHeight);
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
}

/**
 * Generate a ZIP file containing all book page images as JPEGs,
 * with text overlays composited onto story pages.
 */
export async function generateBookZip(
  pages: BookPage[],
  childName: string,
  orderNumber?: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(
    `${orderNumber || "book"}-${childName || "images"}`.replace(/\s+/g, "-").toLowerCase()
  )!;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.image) continue;

    let filename: string;
    if (i === 0) {
      filename = "cover-front.jpg";
    } else if (i === pages.length - 1) {
      filename = "cover-back.jpg";
    } else {
      filename = `page-${String(i).padStart(2, "0")}.jpg`;
    }

    try {
      let blob: Blob;
      // Composite text overlay for story pages that have text + textStyle
      if (page.type === "story" && page.text && page.textStyle) {
        blob = await compositeImageWithText(page.image, page.text, page.textStyle);
      } else {
        // Cover/back-cover or pages without text: export raw image
        const res = await fetch(page.image);
        blob = await res.blob();
      }
      folder.file(filename, blob);
    } catch (err) {
      console.error(`Failed to add ${filename} to zip:`, err);
    }
  }

  return zip.generateAsync({ type: "blob" });
}
