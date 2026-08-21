# Blog artwork

The collection art in `public/blog/categories/` is original 3D illustration, not
stock and not a screenshot. It replaced the 256×256 wizard tiles that were being
scaled up to 520px in an article - which is what made the blog look cheap.

## The rule

**The children who front the home-page gallery are the presenters in every
image we generate.** A reader who meets Moshe and Rivka on the home page should
meet the same two children in the blog. Their portraits live in
`src/assets/gallery/kid-*.jpg` and are passed to the image model as character
references, so the faces stay the same rather than being reinvented per image.

| File | Child | Look |
|---|---|---|
| `kid-moshe.jpg` | boy | dark wavy hair, colourful knitted kippah, light blue shirt |
| `kid-rivka.jpg` | girl | long brown wavy hair, navy bow, navy floral dress |
| `kid-dovid.jpg` | boy | red curly hair, light blue knitted kippah |
| `kid-chaya.jpg` | girl | brown curly hair, sparkly headband, teal top |

(`kid-yehuda`, `kid-shmuel`, `kid-esther`, `kid-ari`, `kid-devorah`, `kid-noa`
are available too - vary the pairing so the same two children don't front every
image.)

## Generating

Model: **nano_banana_2**, 3:2, `resolution: "2k"`, with the two chosen kid
portraits attached as `medias` (role `image`). Then downscale into the repo:

```bash
sips -Z 1100 -s format jpeg -s formatOptions 82 out.png \
  --out public/blog/categories/<collection>.jpg
```

1100px wide is roughly 2× the 520px the figure renders at, which is enough for a
retina screen without shipping a 300KB+ image.

## Non-negotiables in every prompt

These are correctness, not taste:

- **Girls wear no kippah and no head covering.** Long sleeves, dress below the
  knee. Boys wear a kippah and long sleeves.
- **No depiction of God, and no depiction of nevi'im or other holy figures** -
  the children are the only people in frame.
- **No text, letters or lettering anywhere**, including on book pages and
  scrolls, which is where an image model produces garbled pseudo-Hebrew. Say it
  explicitly and say it twice; ask for pictures-only pages.
- Warm cream / honey-gold / deep navy palette, soft cinematic light, to sit with
  the rest of the site.

## The six prompts

Kept verbatim so a regeneration lands in the same world rather than a new one.

- **torah** - Moshe + Rivka sitting on a rug in a cozy home library of leather-bound seforim, leaning over a large open illustrated storybook, late-afternoon golden light through a window.
- **neviim** - Dovid + Chaya on a grassy hilltop in ancient Eretz Yisrael at golden sunrise, storybook open between them, terraced hills, olive trees, the walls and towers of an ancient walled city on the horizon.
- **ketuvim** - Rivka + Dovid on a smooth rock beside a quiet stream in a green valley at golden hour, storybook across their laps, a small wooden harp on the grass, sheep grazing behind.
- **megillot** - Chaya + Moshe kneeling on a woven rug unrolling a large decorative parchment scroll covered only in painted pictures and ornamental borders, in a warm palace hall with carved arches, hanging lanterns, embroidered cushions, a bowl of wheat sheaves.
- **holiday** - Moshe + Rivka at a festive white-linen Yom Tov table, storybook open, silver tray of pomegranates, apples and honey, two tall silver candlesticks glowing, deep blue evening sky through the window.
- **educational** - Chaya + Dovid on a sunny tree-lined street: she drops a coin into a small decorated tzedakah box he holds up, a paper grocery bag of fruit beside them.
