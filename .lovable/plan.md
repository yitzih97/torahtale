

## Plan: Customize All Text for Ultra-Orthodox (Chareidi) Audience

### Overview
Update all user-facing text, prompts, and AI generation instructions to speak naturally to an ultra-Orthodox / Chareidi audience. This means using familiar Yiddish-inflected terms (e.g., "kinderlach" not "children," "Tatty/Mommy" not "Dad/Mom"), referencing yeshiva/Bais Yaakov culture, and ensuring AI prompts enforce strict tznius and hashkafah standards.

---

### 1. AI Story Generation Prompts (`supabase/functions/generate-story/index.ts`)

Update the system prompt and user prompt:
- Replace "children's book author who specializes in Jewish stories" with language like "storyteller for frum Yiddishe kinderlach in the Chareidi community"
- Add explicit instructions:
  - Boys always wear a yarmulke, tzitzis, and peyos
  - Girls wear long sleeves, long skirts, no pants, hair down (no head covering for girls who are unmarried)
  - Use Chareidi terminology: Tatty, Mommy, Rebbe, Morah, davening, bentching, learning, Shabbos (not Shabbat), Hashem (never "God"), sefer/seforim, beis medrash
  - Stories should reference daily frum life: davening Shacharis, learning in cheder/yeshiva/Bais Yaakov, making brachos, Shabbos table, zemiros
  - Moral lessons should reference middos tovos, yiras Shamayim, kibud av va'em, emes, chesed
  - No mention of TV, movies, secular entertainment, or non-tznius activities
- Update the dedication default to use "With love and brachos"

### 2. Image Generation Prompts (`supabase/functions/generate-image/index.ts`)

- Update the default image prompt to specify: "boys with peyos, yarmulke, and tzitzis visible; girls in long modest dresses with long sleeves and long skirts"
- Add: "Orthodox Jewish setting — no modern secular elements visible"

### 3. Character Preview Prompts (`supabase/functions/generate-character-preview/index.ts`)

- Update gender-specific details:
  - Boy: "wearing a yarmulke/kippah with visible peyos (sidelocks), tzitzis, and modest clothing"
  - Girl: "modest dress with long sleeves and long skirt, no head covering, tznius appearance"

### 4. Homepage — Hero Section (`src/components/HeroSection.tsx`)

- Badge: "AI-Powered Torah Storytelling" → "AI-Powered Torah Stories for Frum Kinderlach"
- Button: keep "Begin the Journey"
- Social proof: "frum families" → "Chareidi mishpachos"
- Price line: keep as-is

### 5. Homepage — How It Works (`src/components/HowItWorks.tsx`)

- Step 1: "Tell Us About Your Child" stays, description: "Share their name, age, and a photo. They become the hero of a timeless Torah adventure."
- Step 2: "AI Creates the Sefer" stays, description update: "...all tznius, age-appropriate, and aligned with Chareidi hashkafah."
- Step 3: "Delivered to Your Door" stays, description: "A gorgeous hardcover arrives — a personalized sefer your mishpacha will treasure l'doros."

### 6. Homepage — Testimonials (`src/components/TestimonialsSection.tsx`)

- Update reviewer names/locations to more Chareidi-typical:
  - "Talia Ben-Ami" → "Chaya Leah Friedman"
  - "Avi Rosenberg" stays (fine)
  - "Racheli Katz" → "Rivky Weinberg"
- Update testimonial text to use Chareidi language: "Leil Shabbos" → keep, add "the kinderlach," "our Shabbos tish," "mamash a kiddush Hashem," etc.
- Section subtitle: keep "Treasured L'Doros"

### 7. Homepage — CTA Section (`src/components/CTASection.tsx`)

- "Every Child Deserves to Be Part of the Story" → "Every Yiddishe Kind Deserves to Be Part of the Story"
- Subtext: "Powered by AI. Printed with ahavas Yisrael." — keep as-is

### 8. Footer (`src/components/Footer.tsx`)

- "Made with ahavas Yisrael" — keep
- "Powered by AI · Inspired by Torah" — keep

### 9. Navbar (`src/components/Navbar.tsx`)

- "Create a Story" → "Create a Sefer" (button text)

### 10. Auth Page (`src/pages/Auth.tsx`)

- "Sign in to manage your Torah tales" → "Sign in to manage your seforim"
- "Join us to create personalized Torah stories" → "Join us to create personalized Torah seforim for your kinderlach"

### 11. Checkout (`src/components/wizard/CheckoutStep.tsx`)

- "A new Torah adventure every Shabbos" — keep
- "4 books/month — best value for families" → "4 seforim/month — best value for mishpachos"
- "Full year of stories — biggest savings" → "Full year of seforim — biggest savings"
- Placeholder name on card: "Rachel Goldberg" — keep

### 12. Success Step (`src/components/wizard/SuccessStep.tsx`)

- "Mazel Tov!" — keep
- "personalized Torah sefer is being printed" — keep

### 13. Shipping Form (`src/components/wizard/ShippingForm.tsx`)

- "We'll deliver this treasure right to your door." — keep (fine)

### 14. Book Options (`src/components/wizard/BookOptionsStep.tsx`)

- No changes needed — generic enough

### 15. Dashboard (`src/pages/Dashboard.tsx`)

- Spot-check for any "children" → "kinderlach" or "family" → "mishpacha" references in visible text

### Files to Change

| File | Scope |
|------|-------|
| `supabase/functions/generate-story/index.ts` | System + user prompt Chareidi customization |
| `supabase/functions/generate-image/index.ts` | Image prompt tznius details (peyos, tzitzis) |
| `supabase/functions/generate-character-preview/index.ts` | Character prompt update |
| `src/components/HeroSection.tsx` | Badge text, social proof text |
| `src/components/HowItWorks.tsx` | Step descriptions |
| `src/components/TestimonialsSection.tsx` | Names, review text |
| `src/components/CTASection.tsx` | Headline text |
| `src/components/Navbar.tsx` | Button text |
| `src/pages/Auth.tsx` | Subtitle text |
| `src/components/wizard/CheckoutStep.tsx` | Plan descriptions |

