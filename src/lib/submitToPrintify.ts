import { supabase } from "@/integrations/supabase/client";
import { renderPrintImages } from "@/lib/generateBookPdf";
import type { BookPage } from "@/components/wizard/BookViewer";

export interface PrintifySubmitResult {
  success: boolean;
  error?: string;
  duplicate?: boolean;
  orderId?: string;
}

/** supabase.functions.invoke returns a FunctionsHttpError for a non-2xx; the real
 *  message the edge function threw lives in the JSON response body, so read it
 *  back. Returns "" when there was no error. */
async function readFnError(error: any, data: any): Promise<string> {
  if (error) {
    let msg = error?.message || "Request failed";
    try {
      const ctx = error?.context;
      const body = ctx && typeof ctx.json === "function" ? await ctx.json() : undefined;
      if (body?.error) msg = body.error;
    } catch { /* keep msg */ }
    return msg;
  }
  if (data && data.success === false) return data.error || "Unknown error";
  return "";
}

/**
 * Submit a book to Printify the RIGHT way: render the print-ready images
 * client-side (cover wrap + each page with its caption text baked in — the same
 * images the PDF/preview use), upload them one at a time through the edge
 * function, then place the order from the returned Printify image ids.
 *
 * This replaces the old path that shipped the raw, text-free stored images and a
 * square front-only cover (which printed blank-of-text pages and a mis-arranged
 * cover). Uploading per image keeps each request small enough for the function.
 */
export async function submitBookToPrintify(opts: {
  bookId: string;
  pages: BookPage[];
  childName: string;
  torahPortion: string;
  bookFormat: string;
  lang?: "en" | "he" | "yi";
  rtl?: boolean;
  onProgress?: (done: number, total: number) => void;
}): Promise<PrintifySubmitResult> {
  const { bookId, pages, childName, torahPortion, bookFormat, lang = "en", rtl = false, onProgress } = opts;

  // The back-cover "coming next" teasers are generated WITH the book (they live
  // on the pages as "preview" entries), so renderPrintImages reads them directly.
  let images: string[];
  try {
    images = await renderPrintImages(pages, childName, torahPortion, rtl, bookFormat, lang);
  } catch (e: any) {
    return { success: false, error: `Could not render print images: ${e?.message || e}` };
  }
  if (!images.length) return { success: false, error: "No printable pages were rendered." };

  const imageIds: string[] = [];
  for (let i = 0; i < images.length; i++) {
    // Coloring interior pages render as lossless PNG (see renderStorySpread in
    // generateBookPdf.ts) — the extension must match the actual encoding, not
    // just assume JPEG, since Printify may use it to decide how to decode the
    // upload.
    const ext = images[i].startsWith("data:image/png") ? "png" : "jpg";
    const fileName = i === 0 ? `cover.${ext}` : `page-${i}.${ext}`;
    const { data, error } = await supabase.functions.invoke("printify-submit", {
      body: { action: "upload-image", dataUrl: images[i], fileName },
    });
    const msg = await readFnError(error, data);
    if (msg) return { success: false, error: `Image ${i + 1}/${images.length} upload failed: ${msg}` };
    if (!data?.id) return { success: false, error: `Image ${i + 1}/${images.length} returned no id.` };
    imageIds.push(data.id);
    onProgress?.(i + 1, images.length);
  }

  const { data, error } = await supabase.functions.invoke("printify-submit", {
    body: { action: "submit-order", bookId, imageIds },
  });
  const msg = await readFnError(error, data);
  if (msg) return { success: false, error: msg };
  return { success: true, duplicate: data?.duplicate, orderId: data?.orderId };
}
