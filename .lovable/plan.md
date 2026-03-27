

## Plan: Enhanced Admin Controls + Printify Integration

### Overview
Expand the admin CMS with more website text editing fields, image upload capability (alongside AI generation), AI model selection dropdowns, logo/favicon management, and a new Printify print-on-demand integration section.

---

### 1. Expand Website Content Editor

Add more editable text fields to the "Content" tab in `AdminCMS.tsx`:

- Hero headline templates (per slide — 10 slides)
- Hero description text (per slide)
- How It Works step titles and descriptions
- Testimonial names, quotes, and locations
- Footer text
- Navbar brand name and CTA button text
- Auth page text (sign-in/sign-up subtitles)
- Success step text

These all use the existing `site_settings` table with `category: "website"` — no DB changes needed.

Update frontend components (`HeroSection`, `HowItWorks`, `TestimonialsSection`, `CTASection`, `Navbar`, `Footer`, `Auth`) to read from `useSiteSettings` hook with fallback defaults.

### 2. Image Upload Option (alongside AI generation)

In the Images tab, add an "Upload Image" button next to "Regenerate" for each site image. This lets the admin upload a custom photo/logo directly instead of AI-generating it.

- Upload goes to the existing `site-images` storage bucket
- Updates `site_assets` table with the uploaded URL and `status: "ready"`
- Add an `uploadImage` mutation to `useSiteAssets` hook

### 3. Logo / Favicon Management

Add a new "Branding" section (or sub-section in Content/Images) with:
- Upload site logo (stored in `site-images` bucket as `logo.png`)
- Upload favicon (stored as `favicon.ico` or `favicon.png`)
- Navbar and `<head>` read from `site_assets` with fallback to current static assets

### 4. AI Model Selection Dropdown

Replace the plain text input for "Story Generation Model" and add proper dropdowns listing all available Lovable AI models:
- `google/gemini-2.5-pro`
- `google/gemini-2.5-flash`
- `google/gemini-3-flash-preview`
- `google/gemini-3.1-pro-preview`
- `openai/gpt-5`
- `openai/gpt-5-mini`
- etc.

Add separate dropdowns for:
- **Story text model** (for generating story content)
- **Image generation model** (for book illustrations)
- **Site image generation model** (for admin image regen)

These save to `site_settings` with `category: "ai"`.

Update edge functions to read the selected model from settings.

### 5. Printify Integration Section

Add a new "Printify" tab in the admin CMS for print-on-demand automation.

**Database**: Add settings in `site_settings` for:
- `integrations/printify-api-key` — stored as a secret
- `integrations/printify-shop-id`
- `integrations/printify-product-template-id` (blueprint)
- `integrations/printify-enabled` (true/false toggle)

**New edge function**: `supabase/functions/printify-submit/index.ts`
- Triggered when a book status changes to "ordered"
- Sends the book PDF (or page images) to Printify's API
- Creates a product + publishes + creates an order
- Updates the book record with Printify order ID and status

**Admin UI** (new "Printify" tab):
- API Key input (saved as secret via `add_secret` tool)
- Shop ID input
- Product blueprint/template selector
- Enable/disable toggle
- Test connection button
- Order history log showing Printify sync status per book

**Auto-fulfillment flow**:
1. User completes checkout → book status = "ordered"
2. Edge function or DB trigger fires → sends to Printify
3. Printify prints + ships → webhook updates status to "shipped"

**Webhook endpoint**: `supabase/functions/printify-webhook/index.ts`
- Receives Printify order status updates
- Updates book status (printing → shipped → delivered)

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/printify-submit/index.ts` | Submit orders to Printify API |
| `supabase/functions/printify-webhook/index.ts` | Receive Printify status webhooks |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/AdminCMS.tsx` | Add Content fields, Upload button, Model dropdowns, Branding section, Printify tab |
| `src/hooks/useSiteAssets.ts` | Add `uploadImage` mutation |
| `src/hooks/useSiteSettings.ts` | No changes needed (already generic) |
| `src/components/HeroSection.tsx` | Read slide text from site_settings |
| `src/components/HowItWorks.tsx` | Read step text from site_settings |
| `src/components/TestimonialsSection.tsx` | Read testimonials from site_settings |
| `src/components/CTASection.tsx` | Read headline/subtext from site_settings |
| `src/components/Navbar.tsx` | Read logo from site_assets, brand name from site_settings |
| `src/components/Footer.tsx` | Read footer text from site_settings |
| `supabase/functions/admin-generate-image/index.ts` | Read selected image model from site_settings |
| `supabase/functions/generate-story/index.ts` | Read selected story model from site_settings (already partially done) |
| `supabase/functions/generate-image/index.ts` | Read selected image model from site_settings |

### Secrets Needed
- `PRINTIFY_API_KEY` — will be requested from the user via `add_secret` tool during implementation

