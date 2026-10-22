# Aquarise — cinematic water e-commerce site

Static site (HTML + CSS + vanilla JS) with GSAP 3.15 + ScrollTrigger + Lenis 1.3, all vendored locally. No build step.
Branding (logo, sun-and-wave mark, "Pure natural spring water") is traced from the Aquarise logo into SVG. All moving footage is original, rendered from GLSL shaders in `tools/footage/`.

## Run

```bash
npx serve .
# or: python3 -m http.server 8080
```

Open the printed URL. Opening `index.html` straight from disk also works, but serve it so fonts and paths behave like production.

## Structure

```
aquarise-site/
├── index.html            one <section> per block, numbered 00–11
├── css/styles.css        :root tokens → base → primitives → sections in page order → cart/menu → responsive → .static
├── js/main.js            Part A basics (cart, slider, menu, forms, bottles) → Part B static gate → Part C motion in DOM order
├── js/vendor/            gsap.min.js, ScrollTrigger.min.js, lenis.min.js
├── assets/
│   ├── hero-bottle.jpg   your sunrise bottle shot (cropped to remove the generator watermark); hero poster
│   ├── brand/            aquarise-logo.svg (navy), aquarise-logo-light.svg (for dark backgrounds), favicon.svg
│   ├── video/            hero, heat, condensation, drop, stones, waterfall — .mp4 (first) + .webm fallback + .jpg poster each
│   └── fonts/            Anton + Manrope (self-hosted, SIL Open Font License)
├── tools/footage/        the shader "studio" that renders every clip in assets/video
├── MOTION_SPEC.md        every animation: trigger, start/end, scrub, ease, tuning knobs
├── PROMPTS.md            paste-ready follow-ups for Claude Code / Cursor
├── CLAUDE.md / .cursorrules   rules for the AI in your IDE
```

## The footage

| Clip | Where it plays | What it is |
|---|---|---|
| `hero` | Hero background | Your sunrise bottle photo brought to life: the sea rolls in, sand glints, bubbles rise inside the bottle, spray drifts through the light |
| `heat` | Scene 01 · The Heat | Real AI-generated footage (OpenArt, Seedance 2.5): a woman in profile at sunset, sweat dripping from her chin. Not rendered by tools/footage — re-running `render.mjs` without arguments would overwrite it, so render other films by name |
| `condensation` | Scene 02 · The Craving, Source card "The Seal" | A cold bottle fogged over; drops slide down and clear streaks through to the sunrise |
| `drop` | Scene 03 · The First Drop, Join background | One drop hits still water at sunrise: crown, rebound jet, rings |
| `stones` | Scene 04 · The Relief, Source card "The Stone" | Looking down through a clear stream at river stones, caustics moving over them |
| `waterfall` | The SPRING knockout section, Source card "The Spring" | Real AI-generated footage (OpenArt, Seedance): a waterfall at sunrise. Not rendered by tools/footage |

Every clip is an 8-second seamless loop, 1280×720 (hero 1024×728), 30fps, roughly 0.2–0.9 MB each. They play only while on screen.

### Re-render or tweak the footage

```bash
npm i -D playwright            # once (uses your installed Chrome/Chromium); ffmpeg must be on PATH
node tools/footage/render.mjs                  # all clips → assets/video/
node tools/footage/render.mjs heat waterfall   # just these
node tools/footage/render.mjs heat --stills 1,4,6 --out /tmp/stills   # test frames as PNG
```

To preview live, serve the folder and open `/tools/footage/studio.html`, then click a film. Each film is one GLSL `scene()` function in `tools/footage/films.js`, with comments for what each layer does. Brand colours are baked in (navy `#285483`, sun `#FFD946`).

### Swapping in real footage

Drop a real clip into `assets/video/` with the same name (`heat.mp4` + `heat.webm` + `heat.jpg` poster) and it replaces the rendered one everywhere it is used. Keep clips muted, under ~4 MB, and ideally loopable. Good real-world replacements: a runner or labourer with sweat on their face in hard sun (heat), condensation on an actual Aquarise bottle (condensation), a macro drop splash (drop), your actual spring source (waterfall, stones).

## Swapping in real photos and video

Every placeholder is a `.ph` block (gradient + film grain + a dashed note describing the shot). Two ways to swap:

1. **CSS variable** — add `--img:url('assets/scene-run.jpg')` to the element's `style` attribute.
2. **Element** — put an `<img>` or `<video autoplay muted loop playsinline>` inside the same `.ph`. It is auto-sized with `object-fit: cover`.

Then delete the `<span class="ph-note">`.

### Shot list (what each placeholder wants)

| Where | Shot |
|---|---|
| Hero | Now a rendered loop of the sunrise bottle shot. A real 6–10s loop of waves around the bottle at ≥1920px would beat it. |
| Scenes 01–04 | Rendered thirst film (heat → craving → first drop → relief). Real people drinking Aquarise would add warmth: a runner at sunrise, someone in a hot gym, friends on a rooftop. |
| Source cards | Rendered clips. Real alternatives: cupped hands with spring water · river stones under water · droplet crowning off the cap. |
| Product bottles | The SVG bottles are original placeholders. Swap for transparent PNG/WebP packshots inside each `.bottle`. The liquid wave is optional after that. |

Scenes look best as 1920×1080+ video (H.264/WebM, under ~4 MB each, muted).

## Before launch checklist

- [ ] Replace `hello@aquarise.example` everywhere (search the repo)
- [ ] Real prices and product specs in `PRODUCTS` / `EXTRAS` in `js/main.js` (all marked `*` = placeholder)
- [ ] **Verify every claim**: comparison table, stickers (BPA-free, mineral rich), recyclability, source location. Bottled-water labelling and advertising claims are regulated, so confirm each one with your supplier or lab sheet.
- [ ] Wire checkout (Shopify Storefront / Yoco / PayFast / Stripe) — `PROMPTS.md #3`
- [ ] Wire the newsletter form — `PROMPTS.md #3`
- [ ] Social links in the footer
- [ ] OG tags + `assets/og.jpg` (1200×630), favicon, canonical URL — `PROMPTS.md #8`
- [ ] Real photos/video for every `.ph` (optional now: every one has a rendered clip)
- [ ] Confirm the spring-source line in the SPRING section (`[Confirm source details]`)
- [ ] Privacy policy, terms, shipping & returns pages (POPIA)

## Accessibility and fallbacks

- `prefers-reduced-motion: reduce` **or** GSAP failing to load → `html.static`: no loader, no pinning, every water layer is shown as a normal stacked section, all content readable.
- Without JS the loader and letterbox never show (they need `html.js`). A CSS safety timer also hides them after 5s.
- The cart, slider, menu, FAQ (`<details>`) and forms all work in static mode.
- Focus rings on all interactive elements; Escape closes the cart and menu; the cart drawer and menu have `aria-hidden` state.

## Deploy

**Vercel**: `npx vercel` in this folder (framework preset "Other", no build command, output dir `.`).
**Netlify**: drag the folder onto app.netlify.com/drop, or `npx netlify deploy --prod --dir .`.

## Credits

Layout rhythm and motion feel inspired by a Webflow drinks template (likely a paid template). All copy, code, illustrations and imagery here are original or yours. The video clips are rendered from original shaders in `tools/footage/` (no stock footage), so there is nothing to license.
