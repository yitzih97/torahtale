import { describe, it, expect } from "vitest";
import {
  buildCastingPlan, describeCastingPlan, CAST_ALL_UPTO, CAST_PER_PAGE,
} from "../../supabase/functions/_shared/casting";

const kids = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
const counts = (plan: string[][]) => {
  const c: Record<string, number> = {};
  plan.flat().forEach((n) => { c[n] = (c[n] || 0) + 1; });
  return c;
};

describe("per-page casting", () => {
  it("is a no-op at or below the threshold — everyone on every page", () => {
    for (const n of [1, 2, 3, CAST_ALL_UPTO]) {
      const plan = buildCastingPlan(kids(n), 19);
      expect(plan).toHaveLength(19);
      for (const page of plan) expect(page).toEqual(kids(n));
    }
  });

  it("keeps every page within the reference budget once it kicks in", () => {
    // A page must never carry more children than CAST_PER_PAGE, or it eats the
    // attachment slots the Torah characters need.
    for (const n of [5, 6, 8, 12]) {
      for (const page of buildCastingPlan(kids(n), 19)) {
        expect(page.length).toBeLessThanOrEqual(CAST_PER_PAGE);
      }
    }
  });

  it("never repeats a child within one page", () => {
    for (const n of [5, 6, 7, 8, 11]) {
      for (const page of buildCastingPlan(kids(n), 25)) {
        expect(new Set(page).size).toBe(page.length);
      }
    }
  });

  it("spreads appearances evenly and leaves nobody out", () => {
    for (const n of [5, 6, 7, 8, 12]) {
      for (const pages of [11, 19, 39]) {
        const plan = buildCastingPlan(kids(n), pages);
        const c = counts(plan);
        expect(Object.keys(c).sort()).toEqual(kids(n).sort()); // nobody missing
        const vals = Object.values(c);
        expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("varies who is grouped together instead of fixing the same pairs", () => {
    const plan = buildCastingPlan(kids(6), 12);
    const groups = new Set(plan.map((p) => [...p].sort().join("")));
    expect(groups.size).toBeGreaterThan(2); // not just two frozen trios
  });

  it("handles the empty and degenerate cases", () => {
    expect(buildCastingPlan([], 10)).toEqual([]);
    expect(buildCastingPlan(kids(6), 0)).toEqual([]);
  });

  it("describes the plan one page per line for the story prompt", () => {
    const text = describeCastingPlan([["A", "B"], ["C", "D"]]);
    expect(text).toBe("Page 1: A, B\nPage 2: C, D");
  });
});
