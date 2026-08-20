import { supabase } from "@/integrations/supabase/client";
import { generateId } from "@/lib/utils";

/**
 * "Order again" — put the customer straight on the checkout summary with the
 * same book and the same kids, so a repeat order is a confirm rather than a
 * re-run of the whole wizard.
 *
 * The original book row is NOT reused. handlePlaceOrder flips whatever
 * `savedBookId` points at to "awaiting_payment", so pointing it at a delivered
 * book would rewrite the record of an order the customer already received. A
 * reorder therefore COPIES the row — same story_data recipe and, where they
 * exist, the same generated pages, so a reprint is the identical book rather
 * than a fresh generation that would draw the child slightly differently.
 */
export async function startReorder(book: any, userId: string): Promise<boolean> {
  const sd = (book?.story_data as any) || {};
  const shippingData = (book?.shipping_data as any) || {};

  const { data: copy, error } = await supabase
    .from("books")
    .insert({
      user_id: userId,
      child_name: book.child_name,
      torah_portion: book.torah_portion,
      art_style: book.art_style,
      language: book.language,
      // Pre-payment: handlePlaceOrder moves it to awaiting_payment on confirm.
      status: "draft",
      story_data: { ...sd, reorderOf: book.id },
      pages_data: book.pages_data ?? null,
    } as any)
    .select("id")
    .single();
  if (error || !copy) {
    console.error("Reorder: could not copy the book", error);
    return false;
  }

  const info: any[] = Array.isArray(sd.childrenInfo) ? sd.childrenInfo : [];
  const children = (info.length ? info : [{ name: book.child_name }]).map((c) => ({
    id: generateId(),
    name: c?.name || book.child_name || "",
    name_he: c?.name_he ?? null,
    name_yi: c?.name_yi ?? null,
    age: c?.age || "",
    gender: c?.gender || "",
    photo: null,
    photoPreview: c?.photoUrl || null,
    photoOriginalSrc: null,
    photoNeedsCrop: false,
    description: c?.description || "",
    characterPreview: null,
    savedChildId: c?.savedChildId ?? null,
    existingPhotoUrl: c?.photoUrl || null,
    role: c?.role || "child",
  }));

  const state = {
    // 11 is the combined shipping + order-summary step: the last window before
    // Place Order. Everything behind it is already answered by the copy.
    step: 11,
    planType: "single",
    selectedPlan: "once",
    bookOptionsChosenEarly: true,
    savedBookId: copy.id,
    data: {
      children,
      torahPortion: book.torah_portion || "",
      artStyle: book.art_style || "3d-pixar",
      language: book.language || "english",
      pageCount: sd.pageCount ?? 20,
      narrativeStyle: sd.narrativeStyle ?? null,
    },
    shipping: shippingData && Object.keys(shippingData).length ? shippingData : undefined,
    bookOptions: sd.bookOptions || shippingData.bookOptions || undefined,
    quantity: 1,
    activeSectionId: "wizard-step-11",
  };

  try {
    localStorage.setItem("torahtale_wizard_state", JSON.stringify(state));
  } catch {
    return false; // no state means the wizard would open on step 1 with nothing
  }
  return true;
}
