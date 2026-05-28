## Goal

Add a "Master Book Rules" textarea at the top of the **Templates** tab in Admin → CMS. Whatever the admin writes here is injected into **every** story-page and image-prompt generation, on top of the per-page templates and the master system prompt. It acts as universal guidance for the whole book (e.g. "always end pages on a question", "never depict women's hair", "keep sentences under 12 words").

## UI

In `src/components/admin/AdminCMS.tsx` → `BookTemplatesTab`, render a new panel **above** the portion selector:

- Header: "Master Book Rules" with a `ScrollText` icon
- One-line helper: "Applied to every page of every book."
- `Textarea` (8 rows), placeholder showing example rules
- Save button with the same `savingKey` spinner pattern other fields use
- Stored under `category: "book-templates"`, `key: "master-rules"` (no portion prefix → global)

Loads on mount via a small `useEffect` query — `book-templates` rows where `key = 'master-rules'`.

## Wiring into generation

Both edge functions already fetch `category=in.(prompts,ai,book-templates)`, so no extra fetch is needed.

**`supabase/functions/generate-story/index.ts`**
- After loading settings, pull `masterRules = settings.find(s => s.category==='book-templates' && s.key==='master-rules')?.value`
- When building `templateGuidance`, prepend a `MASTER BOOK RULES (apply to every page):\n${masterRules}` block if non-empty. Substitute the same `{childName}`, `{age}`, `{gender}`, `{artStyle}`, `{language}`, `{torahPortion}` variables.

**`supabase/functions/generate-image/index.ts`**
- Same lookup. Append the rules (with variable substitution) to every page's final image prompt so the constraints flow into the illustration model too.

## Skip-list (intentionally out of scope)

- Per-portion master overrides (single global is enough; can add later under `${portion}:master-rules` using the same code path)
- Bilingual EN/HE split (one rule body, same effect both languages)
- Versioning / history

## Files touched

- `src/components/admin/AdminCMS.tsx` — new panel in `BookTemplatesTab`
- `supabase/functions/generate-story/index.ts` — read + inject master rules
- `supabase/functions/generate-image/index.ts` — read + inject master rules

No DB schema changes — `site_settings` already exists and supports the new key.
