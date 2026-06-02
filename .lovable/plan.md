## Changes

### 1. Localized parashah display (English capitalized, Hebrew in Hebrew)

The `books.torah_portion` column stores a slug (e.g. `"bereishit"`). Currently dashboard surfaces render the raw slug ("bereishit"), and `getPortionLabel` returns both English+Hebrew joined ("Parshas Bereishis / פרשת בראשית"). We'll add a language-aware lookup that returns only the relevant variant — already capitalized in English, and the Hebrew `sub` for Hebrew/Yiddish.

In `src/components/wizard/TorahPortions.ts`, add:
```ts
export const getPortionDisplay = (value: string, lang: "en" | "he" | "yi") => {
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  if (!found) return value;
  return lang === "en" ? found.label : found.sub;
};
```

Update the dashboard book surfaces to use it via `useLanguage()`:
- `src/components/dashboard/BookCard.tsx` — title (line 89) and image alt (77)
- `src/components/dashboard/BookDetailDialog.tsx` — DialogTitle (64), Portion stat (35), image alt (55)
- `src/components/dashboard/BookTimeline.tsx` — slot label (33)

### 2. Default subscription parashah → 3 weeks ahead

In `src/components/wizard/TorahPortions.ts`, `getUpcomingParsha()` currently skips 2 weeks (`+ daysUntilSat + 14`). Change to skip 3 weeks (`+ daysUntilSat + 21`) so new joiners auto-select the parashah 3 Shabbatos out, giving proper production/shipping lead time.

## Out of scope
No DB migration — slug storage stays as-is; this is purely a display/default-selection change.