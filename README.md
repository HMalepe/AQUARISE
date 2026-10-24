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
├── index.html            one <section> per block, numbered 00–11 (09 FAQ now lives in faq.html)
├── faq.html              standalone FAQ page (same styles, nav and footer; works without JS)
├── css/styles.css        :root tokens → base → primitives → sections in page order → cart/menu → responsive → .static
├── js/main.js            Part A basics (cart, slider, menu, forms, bottles) → Part B static gate → Part C motion in DOM order
├── js/vendor/            gsap.min.js, ScrollTrigger.min.js, lenis.min.js
├── assets/
│   ├── hero-bottle.jpg   your sunrise bottle shot (cropped to remove the generator watermark); hero poster
│   ├── brand/            aquarise-logo.svg (navy), aquarise-logo-light.svg (for dark backgrounds), favicon.svg
│   ├── video/            hero, sip, waterfall — .mp4 (first) + .webm fallback + .jpg poster each
│   └── fonts/            Anton + Manrope (self-hosted, SIL Open Font License)
├── tools/footage/        the shader "studio" that renders every clip in assets/video
├── MOTION_SPEC.md        every animation: trigger, start/end, scrub, ease, tuning knobs
├── PROMPTS.md            paste-ready follow-ups for Claude Code / Cursor
├── CLAUDE.md / .cursorrules   rules for the AI in your IDE
```

## The footage

| Clip | Where it plays | What it is |
|---|---|---|
| `hero` | Hero background | 1920px. Your sunrise bottle photo, AI-upscaled 4× (Real-ESRGAN, `assets/hero-bottle-hd.jpg`) and brought to life: the sea rolls in, sand glints, bubbles rise inside the bottle, spray drifts through the light |
| `mist` | Shop stage, behind the bottle | The sunlit steam cut from the waterfall clip (the steam plume left of the falls, upscaled), slowed to 0.7× and mirrored so it loops without a jump |
| `sip` | Feature section ("Pure. Crisp. Alive.") | Real AI-generated footage (OpenArt, Seedance): the sweating woman drinks from an Aquarise bottle at sunset. Trimmed to start 1s in (the opening frames had a different colour grade), slowed to 0.85× and played forward then in reverse so it loops without a jump (~9.5s). Not rendered by tools/footage |
| `waterfall` | The SPRING knockout section | Real AI-generated footage (OpenArt, Seedance): a waterfall at sunrise. Not rendered by tools/footage |

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

Drop a real clip into `assets/video/` with the same name (for example `sip.mp4` + `sip.webm` + `sip.jpg` poster) and it replaces the old one everywhere it is used. Keep clips muted, under ~4 MB, and ideally loopable.

## Swapping in real photos and video

Every placeholder is a `.ph` block (gradient + film grain + a dashed note describing the shot). Two ways to swap:

1. **CSS variable** — add `--img:url('assets/scene-run.jpg')` to the element's `style` attribute.
2. **Element** — put an `<img>` or `<video autoplay muted loop playsinline>` inside the same `.ph`. It is auto-sized with `object-fit: cover`.

Then delete the `<span class="ph-note">`.

### Shot list (what each placeholder wants)

| Where | Shot |
|---|---|
| Hero | Now a rendered loop of the sunrise bottle shot. A real 6–10s loop of waves around the bottle at ≥1920px would beat it. |
| Product bottles | The real bottle, cut out of the sunrise photo (`assets/bottle.webp` + `.png`). Every product uses it for now; shoot a transparent packshot per size (500ml, 1L, glass…) and point each product at its own file. |


## Before launch checklist

- [ ] Replace `hello@aquarise.example` everywhere (search the repo)
- [ ] Real prices and product specs in `PRODUCTS` / `EXTRAS` in `js/main.js` (all marked `*` = placeholder)
- [ ] **Verify every claim**: stickers (BPA-free, mineral rich), recyclability, source location. Bottled-water labelling and advertising claims are regulated, so confirm each one with your supplier or lab sheet.
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
