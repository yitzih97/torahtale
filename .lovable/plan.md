

## Plan: Add Image References to Book Templates

### What We're Building
Adding the ability to upload a **reference image** for each page slot (Cover, Pages 1-8, Back Cover) in the Templates tab. These reference images will be sent to the AI image generator alongside the text prompt, ensuring all books for the same story produce visually consistent illustrations — regardless of the child's name, age, or gender.

### How It Works

**Admin Side (Templates Tab)**
- Each page slot (Cover, Page 1-8, Back Cover) gets an **"Upload Reference Image"** button below the Image Prompt field
- Uploaded images are stored in the `site-images` bucket with keys like `template-ref/{portion}/{page-slot}.png`
- The reference image URL is saved to `site_settings` with category `book-templates` and key `{portion}:{slot}:reference-image`
- A thumbnail preview of the current reference image is shown when one exists, with a delete button

**Generation Side (Edge Function)**
- `generate-image/index.ts` already loads all `book-templates` settings — it will now also look for `{portion}:{slot}:reference-image`
- When a reference image URL is found, it gets fetched and injected into the Gemini API call as an inline image part, with a prompt instruction like: "Use the attached reference image as a SCENE and COMPOSITION guide. Reproduce the same scene layout, background elements, and overall composition, but adapt the child character to match the specified name, age, gender, and character sheet."
- This sits alongside the existing `characterSheet` (child appearance) and `referenceImage` (child photo) logic — it's a separate "scene reference" concept

### Changes

| File | Change |
|------|--------|
| `src/components/admin/AdminCMS.tsx` | Add upload/preview/delete for reference images in each page slot of `BookTemplatesTab`. Store URL in `site_settings` as `{portion}:{slot}:reference-image` |
| `supabase/functions/generate-image/index.ts` | Load `reference-image` template setting for the current portion+page, fetch it, and inject as a scene reference image part into the Gemini API call |
| `supabase/functions/generate-story/index.ts` | No changes needed — story text generation is unaffected |

### Technical Details

- Reuses the existing `site-images` public bucket for storage
- Reuses the existing `onSave` pattern in AdminCMS for persisting the URL to `site_settings`
- The reference image is injected as a **third** image context (after character sheet and child photo), with distinct instructions telling the AI to match the scene composition but adapt the character
- Template variables `{childName}`, `{age}`, `{gender}` etc. continue to work in the text prompt, ensuring per-child customization while the reference image locks down the visual style and scene layout

