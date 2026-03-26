

## Plan: Story Depth, Dashboard Book Viewing Fix, and Text Box Resizing/Alignment

### Three Issues to Fix

---

### 1. Richer Torah Stories (Story Prompt Enhancement)

**Problem**: The generated stories only dedicate 1-2 pages to the actual Torah content (e.g. the plagues of Egypt). The child appears in the story but the Torah events themselves are underdeveloped.

**Fix**: Update `supabase/functions/generate-story/index.ts` — modify the system prompt and user prompt to emphasize that the Torah story events (plagues, miracles, key scenes) must be depicted across most pages, not just mentioned briefly. The child should be embedded IN those events, witnessing and participating in them.

Key prompt changes:
- System prompt: Add instruction that "the majority of story pages must depict the actual Torah events in vivid detail — the child witnesses and participates in the key scenes"
- User prompt: Add explicit requirement like "At least 70% of the pages must show specific events from the Torah portion (e.g. for Va'era, show individual plagues). The child should be present IN those scenes, not just hearing about them."

---

### 2. Dashboard Books Not Loading (Data Persistence Bug)

**Problem**: Books show a loading state or empty pages in the dashboard viewer. The `pages_data` saved to the database likely still contains `imageLoading: true` and `image: null` from the initial save, and the post-generation update uses `setBookPages` inside a callback which creates a race condition with `savedBookId`.

**Root cause analysis**:
- Line 328-351: Initial save happens with `image: null, imageLoading: true` on all pages
- Lines 422-440: Post-generation save uses `setBookPages` callback + `savedBookId` — but `savedBookId` may not be set yet if the save happens asynchronously
- The `BookViewerModal` in the dashboard shows images from `pages_data` — if those are null, nothing displays

**Fix in `src/components/CreationWizard.tsx`**:
- After `Promise.all` completes for image generation, collect the final pages directly (not via state setter callback) and persist them to DB synchronously
- Use a ref for `savedBookId` to avoid stale closure issues
- Ensure `imageLoading` is always `false` and images are populated before saving

**Fix in `src/pages/Dashboard.tsx`**:
- Add a safety check: if `pages_data` exists but pages have `imageLoading: true` or null images, show a "Book still generating" message instead of blank/loading forever

---

### 3. Text Box Resizing and Alignment Controls

**Problem**: The draggable text overlay only supports repositioning and styling. Users want to resize the text box width and choose text alignment (center, LTR, RTL).

**Fix in `src/components/wizard/DraggableText.tsx`**:

Add two new properties to `TextStyle`:
```ts
width: number;      // percentage 20-100
textAlign: "center" | "left" | "right";
```

Changes:
- Add `width` to `TextStyle` interface and `DEFAULT_TEXT_STYLE` (default: 80%)
- Add `textAlign` to `TextStyle` (default: "center")
- Add resize handles (left and right edges of the text box) that allow horizontal stretching
- Add alignment buttons to the floating toolbar (left/center/right icons)
- Apply `textAlign` and `width` to the text container's inline styles
- The resize handle uses the same drag pattern as the position drag, but only modifies width

Toolbar additions:
- Three alignment buttons: Left (LTR), Center, Right (RTL) — using `AlignLeft`, `AlignCenter`, `AlignRight` icons from lucide
- Width shown as a small label next to the resize area

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-story/index.ts` | Enhance prompts for Torah story depth |
| `src/components/CreationWizard.tsx` | Fix post-generation DB save race condition |
| `src/pages/Dashboard.tsx` | Add fallback for incomplete page data |
| `src/components/wizard/DraggableText.tsx` | Add width resizing + text alignment controls |

