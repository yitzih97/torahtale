

## Plan: Regenerate Images for Chareidi Audience + Admin Content Management System

### Part 1: Image Regeneration

**Problem**: The current static images (hero scenes, gallery covers, hero characters) may not accurately depict Chareidi children with peyos, yarmulkes, tzitzis, and modest clothing.

**Approach**: Create an admin-triggered image regeneration system rather than replacing 150+ static files manually.

**Steps**:

1. **Create a `site_images` storage bucket** in Supabase to store regenerated images.

2. **Create a `site_assets` database table** to track which images have been regenerated and store their URLs:
   - `id`, `asset_key` (e.g. "hero-scene-1"), `image_url`, `prompt_used`, `status`, `created_at`

3. **Create an `admin-generate-image` edge function** that:
   - Accepts an asset key and prompt
   - Calls the Gemini image generation API with Chareidi-specific prompts (boys with peyos/yarmulke/tzitzis, girls in modest long-sleeved dresses)
   - Uploads result to the `site_images` bucket
   - Updates the `site_assets` table

4. **Update image-consuming components** (`BookFlipAnimation`, `GallerySection`, `HeroSection`) to check `site_assets` for overrides before falling back to static assets.

5. **Add "Regenerate Images" section in Admin Settings tab** with:
   - List of all key site images with thumbnails
   - Edit prompt per image
   - "Regenerate" button per image and "Regenerate All" batch button
   - Progress indicators

**Key images to regenerate** (prioritized):
- 10 hero background scenes (hero-scene-1 through 10)
- 2 hero characters (hero-boy, hero-girl)
- 3 gallery cover images (story-noach, story-beshalach, story-bereishit)

Gallery book pages (120+) can be regenerated over time via the admin tool.

---

### Part 2: Admin Content Management System

**Problem**: Currently all website text, AI prompts, and settings are hardcoded. Admin needs to edit them without code changes.

**Steps**:

1. **Create a `site_settings` database table**:
   - `id`, `category` (e.g. "prompts", "website", "pricing"), `key`, `value` (text), `updated_at`, `updated_by`
   - RLS: only admins can read/write

2. **Create a `useSiteSettings` hook** that fetches settings and provides fallback defaults.

3. **Expand the Admin Settings tab** with sub-sections:

   **a. Master Prompts** (editable text areas):
   - Story generation system prompt
   - Story generation user prompt template
   - Image generation prompt template
   - Character preview prompt template

   **b. Website Content** (editable fields):
   - Hero badge text, CTA button text
   - Section headings and descriptions
   - Testimonial names and quotes
   - Pricing labels

   **c. AI Agent Settings**:
   - Default AI model selection
   - Temperature setting
   - Page count defaults
   - Art style options list

   **d. Pricing & Plans**:
   - Weekly/Monthly/Yearly subscription prices
   - One-time purchase price
   - Discount percentage display

4. **Update edge functions** (`generate-story`, `generate-image`, `generate-character-preview`) to read master prompts from `site_settings` table, falling back to hardcoded defaults if not set.

5. **Update frontend components** to read website copy from `site_settings` via the hook, falling back to current hardcoded values.

---

### Database Changes

```sql
-- site_assets table for image overrides
CREATE TABLE public.site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text UNIQUE NOT NULL,
  image_url text,
  prompt_used text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- site_settings table for CMS
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  UNIQUE(category, key)
);

-- RLS: admin-only
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD site_assets" ON public.site_assets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read site_assets" ON public.site_assets FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can CRUD site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT TO public
  USING (true);
```

### Files to Change/Create

| File | Change |
|------|--------|
| Migration SQL | Create `site_assets` and `site_settings` tables |
| `supabase/functions/admin-generate-image/index.ts` | New edge function for admin image regen |
| `src/hooks/useSiteSettings.ts` | New hook to fetch/cache site settings |
| `src/hooks/useSiteAssets.ts` | New hook to fetch image overrides |
| `src/pages/Admin.tsx` | Expand Settings tab with Prompts, Content, Images, AI sections |
| `src/components/3d/BookFlipAnimation.tsx` | Use image overrides from site_assets |
| `src/components/GallerySection.tsx` | Use image overrides from site_assets |
| `src/components/HeroSection.tsx` | Use site_settings for copy |
| `supabase/functions/generate-story/index.ts` | Read prompts from site_settings |
| `supabase/functions/generate-image/index.ts` | Read prompts from site_settings |
| `supabase/functions/generate-character-preview/index.ts` | Read prompts from site_settings |
| Storage bucket | Create `site-images` bucket |

