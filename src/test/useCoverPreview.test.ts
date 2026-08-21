import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

/**
 * The re-roll allowance is the part of the cover preview that costs real money,
 * so its arithmetic is worth pinning down: two rolls per cover, a new photo buys
 * a fresh set, and that trade may be made exactly once.
 */

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));

const store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  },
  writable: true, configurable: true,
});

const { useCoverPreview } = await import("@/hooks/useCoverPreview");

const inputs = (photo: string) => ({
  referenceImage: photo,
  childName: "Ari",
  age: "5",
  torahPortion: "pesach",
  artStyle: "3d-pixar",
  childRefs: [{ name: "Ari", age: "5", gender: "boy", photoUrl: photo }],
});

let n = 0;
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  n = 0;
  invoke.mockReset();
  invoke.mockImplementation(async () => ({ data: { imageUrl: `cover-${++n}.png` }, error: null }));
});

describe("useCoverPreview", () => {
  it("gives two re-rolls, then offers the one photo retake", async () => {
    const { result } = renderHook(() => useCoverPreview(inputs("data:image/jpeg;base64,AAAA")));
    await waitFor(() => expect(result.current.url).toBe("cover-1.png"));
    expect(result.current.regensLeft).toBe(2);
    expect(result.current.canRetakePhoto).toBe(false);

    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.url).toBe("cover-2.png"));
    expect(result.current.regensLeft).toBe(1);

    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.url).toBe("cover-3.png"));
    expect(result.current.regensLeft).toBe(0);
    expect(result.current.canRegenerate).toBe(false);
    expect(result.current.canRetakePhoto).toBe(true);

    // A third roll is not available, whatever the UI does.
    act(() => result.current.regenerate());
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it("counts the saved cover as chosen, and a new photo retires it", async () => {
    const first = "data:image/jpeg;base64,AAAA";
    const { result, rerender } = renderHook((p: string) => useCoverPreview(inputs(p)), {
      initialProps: first,
    });
    await waitFor(() => expect(result.current.url).toBe("cover-1.png"));

    act(() => { result.current.save(); });
    await waitFor(() => expect(result.current.saved).toBe(true));

    rerender("data:image/jpeg;base64,BBBBBB");
    await waitFor(() => expect(result.current.url).toBe("cover-2.png"));
    // A cover of the old photo cannot stand as the character of the new one.
    expect(result.current.saved).toBe(false);
    expect(result.current.regensLeft).toBe(2);
  });

  it("allows the photo-for-rolls trade exactly once", async () => {
    const { result, rerender } = renderHook((p: string) => useCoverPreview(inputs(p)), {
      initialProps: "data:image/jpeg;base64,AAAA",
    });
    await waitFor(() => expect(result.current.url).toBe("cover-1.png"));
    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.regensLeft).toBe(1));
    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.regensLeft).toBe(0));
    expect(result.current.canRetakePhoto).toBe(true);

    act(() => { result.current.noteRetake(); });
    rerender("data:image/jpeg;base64,BBBBBB");
    await waitFor(() => expect(result.current.regensLeft).toBe(2));

    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.regensLeft).toBe(1));
    act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.regensLeft).toBe(0));
    // The trade is spent - the second time round it is not on offer.
    expect(result.current.canRetakePhoto).toBe(false);
  });
});
