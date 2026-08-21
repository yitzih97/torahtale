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
 * client-side (cover wrap + each page with its caption text baked in - the same
 * images the PDF/preview use), upload them one at a time through the edge
 * function, then place the order from the returned Printify image ids.
 *
 * This replaces the old path that shipped the raw, text-free stored images and a
 * square front-only cover (which printed blank-of-text pages and a mis-arranged
 * cover). Uploading per image keeps each request small enough for the function.
 *
 * Deliberately NOT written in terms of prepareBook: this path places the order
 * in the same edge-function call that builds the product, which is one fewer
 * round trip and is the path every single-book order has gone through. The
 * render + upload loop is duplicated in prepareBook - change both together.
 */
export interface PrintifyBookInput {
  bookId: string;
  pages: BookPage[];
  childName: string;
  coverChildName?: string;
  torahPortion: string;
  bookFormat: string;
  lang?: "en" | "he" | "yi";
  rtl?: boolean;
}

/**
 * Render + upload one book's print images and build its Printify PRODUCT,
 * without placing an order. Shared by the single and batch paths - the single
 * path places the order in the same call, the batch path collects the line and
 * places one order for all of them.
 */
async function prepareBook(
  b: PrintifyBookInput,
  onProgress?: (done: number, total: number) => void,
): Promise<{ ok: true; line: PrintifyLine } | { ok: false; error: string }> {
  let images: string[];
  try {
    images = await renderPrintImages(
      b.pages, b.childName, b.torahPortion, b.rtl ?? false, b.bookFormat, b.lang ?? "en", b.coverChildName,
    );
  } catch (e: any) {
    return { ok: false, error: `Could not render print images: ${e?.message || e}` };
  }
  if (!images.length) return { ok: false, error: "No printable pages were rendered." };

  const imageIds: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const ext = images[i].startsWith("data:image/png") ? "png" : "jpg";
    const fileName = i === 0 ? `cover.${ext}` : `page-${i}.${ext}`;
    const { data, error } = await supabase.functions.invoke("printify-submit", {
      body: { action: "upload-image", dataUrl: images[i], fileName },
    });
    const msg = await readFnError(error, data);
    if (msg) return { ok: false, error: `Image ${i + 1}/${images.length} upload failed: ${msg}` };
    if (!data?.id) return { ok: false, error: `Image ${i + 1}/${images.length} returned no id.` };
    imageIds.push(data.id);
    onProgress?.(i + 1, images.length);
  }

  const { data, error } = await supabase.functions.invoke("printify-submit", {
    body: { action: "submit-order", bookId: b.bookId, imageIds, prepareOnly: true },
  });
  const msg = await readFnError(error, data);
  if (msg) return { ok: false, error: msg };
  if (!data?.productId || !data?.variantId) return { ok: false, error: "Printify returned no product for this book." };
  return {
    ok: true,
    line: { bookId: b.bookId, productId: String(data.productId), variantId: Number(data.variantId), quantity: Number(data.quantity) || 1 },
  };
}

interface PrintifyLine {
  bookId: string;
  productId: string;
  variantId: number;
  quantity: number;
}

/**
 * Submit a whole batch - a Parsha Series month, say - as ONE Printify order.
 *
 * Every book still needs its own product (its own artwork), so each is prepared
 * in turn; the order at the end carries them as separate line items, which is
 * what makes them arrive in a single box instead of four. Books minted together
 * share a shipmentBatchId (see release-subscription-books) and one address.
 *
 * If ANY book fails to prepare, no order is placed at all: a partial batch would
 * ship some of the month and silently drop the rest.
 */
export async function submitBatchToPrintify(opts: {
  books: PrintifyBookInput[];
  onProgress?: (bookIndex: number, bookCount: number, done: number, total: number) => void;
}): Promise<PrintifySubmitResult & { books?: number }> {
  const { books, onProgress } = opts;
  if (!books.length) return { success: false, error: "No books to submit." };
  if (books.length === 1) {
    return submitBookToPrintify({ ...books[0], onProgress: (d, t) => onProgress?.(0, 1, d, t) });
  }

  const lines: PrintifyLine[] = [];
  for (let i = 0; i < books.length; i++) {
    const res = await prepareBook(books[i], (d, t) => onProgress?.(i, books.length, d, t));
    if (res.ok === false) {
      return { success: false, error: `Book ${i + 1}/${books.length}: ${res.error}` };
    }
    lines.push(res.line);
  }

  const { data, error } = await supabase.functions.invoke("printify-submit", {
    body: { action: "submit-batch", lines },
  });
  const msg = await readFnError(error, data);
  if (msg) return { success: false, error: msg };
  return { success: true, orderId: data?.orderId, books: data?.books };
}

export async function submitBookToPrintify(opts: {
  bookId: string;
  pages: BookPage[];
  childName: string;
  /** Child name in the book's script for the cover (Hebrew/Yiddish). Optional. */
  coverChildName?: string;
  torahPortion: string;
  bookFormat: string;
  lang?: "en" | "he" | "yi";
  rtl?: boolean;
  onProgress?: (done: number, total: number) => void;
}): Promise<PrintifySubmitResult> {
  const { bookId, pages, childName, coverChildName, torahPortion, bookFormat, lang = "en", rtl = false, onProgress } = opts;

  // The back-cover "coming next" teasers are generated WITH the book (they live
  // on the pages as "preview" entries), so renderPrintImages reads them directly.
  let images: string[];
  try {
    images = await renderPrintImages(pages, childName, torahPortion, rtl, bookFormat, lang, coverChildName);
  } catch (e: any) {
    return { success: false, error: `Could not render print images: ${e?.message || e}` };
  }
  if (!images.length) return { success: false, error: "No printable pages were rendered." };

  const imageIds: string[] = [];
  for (let i = 0; i < images.length; i++) {
    // Coloring interior pages render as lossless PNG (see renderStorySpread in
    // generateBookPdf.ts) - the extension must match the actual encoding, not
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
