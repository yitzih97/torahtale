

## Plan: Per-Page Book Template Editor + Fix Input Focus Bug

### Problem
1. Admin has no way to control the narrative text and image prompts per page, per Torah portion. Currently the AI generates freely with only a system prompt.
2. Typing in admin settings fields causes the input to lose focus after each keystroke because `SettingField` and `ModelSelect` are defined as components **inside** the `AdminCMS` render function — React treats them as new component types on every re-render, unmounting and remounting the inputs.

---

### 1. Fix Input Focus Jumping (All Admin Settings)

**File:** `src/components/admin/AdminCMS.tsx`

- Extract `SettingField` and `ModelSelect` from inside `AdminCMS()` to standalone components defined **outside** the function, accepting all needed props explicitly
- This prevents React from recreating the component identity on each keystroke

---

### 2. Add "Book Templates" Tab to Admin CMS

**File:** `src/components/admin/AdminCMS.tsx`

Add an 8th tab: **"Templates"** (icon: `BookOpen`)

UI structure:
- **Portion selector**: dropdown listing all entries from `TORAH_PORTIONS` (grouped by category)
- **Page editor grid**: once a portion is selected, show 10-12 editable slots:
  - **Cover** — text template + image prompt template
  - **Pages 1–8** (or however many) — text narrative template + image prompt template
  - **Back Cover** — synopsis template + image prompt template
- Each slot has two `Textarea` fields with placeholder variables documented: `{childName}`, `{age}`, `{gender}`, `{artStyle}`, `{language}`
- A **Save** button per page slot, storing to `site_settings` with:
  - Category: `book-templates`
  - Key format: `{portionValue}:page-{N}:text` and `{portionValue}:page-{N}:image-prompt`
- A **"Copy from another portion"** dropdown to duplicate templates across portions
- Empty templates = AI generates freely (current behavior, as fallback)

**Storage:** Uses existing `site_settings` table. The `book-templates` category is already blocked from non-admin reads by current RLS policy (only `website` and `branding` are public).

---

### 3. Edge Functions Read Templates

**File:** `supabase/functions/generate-story/index.ts`

- After loading `site_settings`, also fetch rows where `category = 'book-templates'` and key starts with the current `torahPortion`
- If page-level text templates exist, include them in the user prompt as guidance: "For page N, the narrative should follow this template: ..."
- If no templates exist for a portion, fall back to current free-generation behavior

**File:** `supabase/functions/generate-image/index.ts`

- Similarly load `{portion}:page-{N}:image-prompt` from `site_settings`
- If a custom image prompt template exists, use it (with variable substitution) instead of the auto-generated prompt
- Fall back to current behavior if no template is set

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminCMS.tsx` | Extract SettingField/ModelSelect outside component; add "Templates" tab with per-portion per-page prompt editor |
| `supabase/functions/generate-story/index.ts` | Load and apply book-template text templates per page |
| `supabase/functions/generate-image/index.ts` | Load and apply book-template image prompt templates per page |

