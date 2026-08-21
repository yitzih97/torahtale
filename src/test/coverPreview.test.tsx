import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckoutStep } from "@/components/wizard/CheckoutStep";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DEFAULT_BOOK_OPTIONS } from "@/components/wizard/BookOptionsStep";

/**
 * Trying another cover is a decision about the artwork, so it is made looking at
 * the artwork: the summary row shows the cover, and only the enlarged view
 * carries the reroll and the count of tries left. These two facts are the whole
 * point of that arrangement, and both are easy to undo by accident.
 */

// jsdom here runs on an opaque origin, so there is no real localStorage for the
// language provider to read.
const store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  },
  writable: true, configurable: true,
});

const shipping = { shippingMethod: "standard" } as never;

const setup = ({
  regensLeft = 2, canRegenerate = true, saved = false, canRetakePhoto = false, children = [],
}: {
  regensLeft?: number; canRegenerate?: boolean; saved?: boolean; canRetakePhoto?: boolean;
  children?: Array<{ id: string; name: string }>;
} = {}) => {
  const regenerate = vi.fn();
  const save = vi.fn();
  const onPhoto = vi.fn();
  render(
    <LanguageProvider>
      <CheckoutStep
        childName="Ari"
        torahPortion="pesach"
        artStyle="3d-pixar"
        shipping={shipping}
        bookOptions={DEFAULT_BOOK_OPTIONS}
        onPlaceOrder={() => {}}
        coverPreview={{
          url: "blob:cover.png", loading: false, error: null,
          regensLeft, canRegenerate, regenerate, save, saved, canRetakePhoto,
        }}
        coverRetake={{ children, onPhoto }}
      />
    </LanguageProvider>,
  );
  return { regenerate, save, onPhoto };
};

describe("order summary cover", () => {
  it("offers the reroll only once the cover has been opened", () => {
    const { regenerate } = setup();
    expect(screen.queryByText(/Try another/)).toBeNull();

    fireEvent.click(screen.getByLabelText("Tap to enlarge"));

    const tryAnother = screen.getByText("Try another (2 left)");
    fireEvent.click(tryAnother);
    expect(regenerate).toHaveBeenCalledTimes(1);
  });

  it("keeps the cover the customer chose", () => {
    const { save } = setup();
    fireEvent.click(screen.getByLabelText("Tap to enlarge"));
    fireEvent.click(screen.getByText("Use this cover"));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("says what a saved cover means, and stops offering to save it again", () => {
    setup({ saved: true });
    fireEvent.click(screen.getByLabelText("Tap to enlarge"));
    expect(screen.queryByText("Use this cover")).toBeNull();
    expect(screen.getByText(/Saved as your book's character/)).toBeTruthy();
    expect(screen.getByText(/drawn as this character on every page/)).toBeTruthy();
  });

  it("offers a new photo per child once the tries run out", () => {
    setup({
      regensLeft: 0, canRegenerate: false, canRetakePhoto: true,
      children: [{ id: "a", name: "Adina" }, { id: "b", name: "Ari" }],
    });
    fireEvent.click(screen.getByLabelText("Tap to enlarge"));
    expect(screen.getByText("New photo for Adina")).toBeTruthy();
    expect(screen.getByText("New photo for Ari")).toBeTruthy();
    expect(screen.queryByText(/no more tries left/)).toBeNull();
  });

  it("says why the reroll is gone when the tries and the retake are both used up", () => {
    setup({ regensLeft: 0, canRegenerate: false, canRetakePhoto: false });
    fireEvent.click(screen.getByLabelText("Tap to enlarge"));
    expect(screen.queryByText(/Try another/)).toBeNull();
    expect(screen.queryByText(/New photo for/)).toBeNull();
    expect(screen.getByText(/no more tries left/)).toBeTruthy();
  });
});
