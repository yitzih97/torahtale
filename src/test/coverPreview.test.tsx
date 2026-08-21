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

const setup = ({ regensLeft = 2, canRegenerate = true } = {}) => {
  const regenerate = vi.fn();
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
          regensLeft, canRegenerate, regenerate,
        }}
      />
    </LanguageProvider>,
  );
  return { regenerate };
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

  it("says why the reroll is gone when the tries are used up", () => {
    setup({ regensLeft: 0, canRegenerate: false });
    fireEvent.click(screen.getByLabelText("Tap to enlarge"));
    expect(screen.queryByText(/Try another/)).toBeNull();
    expect(screen.getByText(/no more tries left/)).toBeTruthy();
  });
});
