

## Plan: Generate Real 3D Pixar-Style Book Images with Story Text

### What We're Doing
Replace all 30 static placeholder images (10 covers + 20 interior pages) in the Gallery & Reviews section with AI-generated 3D Pixar-style illustrations that include story text embedded in each image. We'll use the Nano Banana 2 model (`google/gemini-3.1-flash-image-preview`) via a script to generate all images and store them as real assets.

### Approach

**Phase 1: Generate 30 images using AI script**

Use the `lovable_ai.py` script to generate 30 images (3 per story x 10 stories). Each prompt will:
- Specify 3D Pixar/CGI style with warm lighting, soft shadows, expressive characters
- Feature the specific child character (Rivka, Yehuda, Chaya, etc.) dressed in modest Orthodox Jewish clothing (boys with kippah/tzitzis, girls in long modest dresses)
- Include story text overlaid as part of the book page layout (like a real children's book page)
- Depict the specific Torah scene for that page

For each story, the 3 images will be:
1. **Cover** — title page with story name and character
2. **Page 2** — mid-story scene with narrative text
3. **Page 3** — climax/conclusion scene with narrative text

**Phase 2: Replace asset files**

Overwrite all 30 existing image files in `src/assets/` with the AI-generated versions:
- 10 cover images (`torah-garden-eden.jpg`, `noah-page1.jpg`, etc.)
- 20 interior pages (`story1-page2.jpg`, `story1-page3.jpg`, etc.)

**Phase 3: No code changes needed**

Since we're replacing files at the same paths, the `GalleryReviewsSection.tsx` imports remain unchanged.

### Image Generation Details

Each image prompt will follow this pattern:
```
A 3D Pixar-style children's book page illustration. Scene: [specific Torah scene]. 
Character: [child name], an Orthodox Jewish [boy/girl] wearing [modest clothing]. 
Story text elegantly embedded on the page: "[2-3 sentence story text]". 
Warm lighting, soft shadows, vibrant colors, magical atmosphere. 
Safe for children. No real text artifacts.
```

**10 Stories x 3 images each = 30 total images**

| # | Story | Child | Scenes |
|---|-------|-------|--------|
| 1 | Gan Eden | Rivka (girl) | Garden, naming animals, leaving Gan Eden |
| 2 | Noach's Teivah | Yehuda (boy) | Building ark, animals boarding, rainbow |
| 3 | Tower of Bavel | Chaya (girl) | Tower building, confusion, scattering |
| 4 | Avraham & Stars | Shmuel (boy) | Journey, counting stars, promise |
| 5 | Yosef's Coat | Esther (girl) | Receiving coat, dreams, reunion |
| 6 | Baby Moshe | Ari (boy) | Basket on Nile, discovery, palace |
| 7 | Krias Yam Suf | Devorah (girl) | Trapped at sea, splitting, singing |
| 8 | Matan Torah | Moshe (boy) | Har Sinai, thunder/lightning, luchos |
| 9 | Dovid & Golyas | Dovid (boy) | Facing giant, slingshot, victory |
| 10 | Yonah & the Dag | Noa (girl) | Ship, inside fish, Nineveh |

### Technical Notes
- Model: `google/gemini-3.1-flash-image-preview` (Nano Banana 2)
- Output: PNG files converted/saved as JPG replacements in `src/assets/`
- Each image will have story text baked into the illustration itself
- Generation will be batched with delays to avoid rate limiting

