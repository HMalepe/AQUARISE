# Aquarise — cinematic water e-commerce site

Static site (HTML + CSS + vanilla JS) with GSAP 3.15 + ScrollTrigger + Lenis 1.3, all vendored locally. No build step.

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
│   ├── hero-bottle.jpg   your sunrise bottle shot (cropped to remove the generator watermark)
│   └── fonts/            Anton + Manrope (self-hosted, SIL Open Font License)
├── MOTION_SPEC.md        every animation: trigger, start/end, scrub, ease, tuning knobs
├── PROMPTS.md            paste-ready follow-ups for Claude Code / Cursor
├── CLAUDE.md / .cursorrules   rules for the AI in your IDE
```

## Swapping in real photos and video

Every placeholder is a `.ph` block (gradient + film grain + a dashed note describing the shot). Two ways to swap:

1. **CSS variable** — add `--img:url('assets/scene-run.jpg')` to the element's `style` attribute.
2. **Element** — put an `<img>` or `<video autoplay muted loop playsinline>` inside the same `.ph`. It is auto-sized with `object-fit: cover`.

Then delete the `<span class="ph-note">`.

### Shot list (what each placeholder wants)

| Where | Shot |
|---|---|
| Hero | Current sunrise bottle shot. Re-shoot or re-generate at ≥2400px wide, no watermark. A 6–10s loop of waves around the bottle would make it a true opening shot. |
| Scene 01 · The Run | Runner on a beach road at sunrise, drinking mid-stride. Backlit, warm flare. |
| Scene 02 · The Deep Work | Designer at a sunlit desk, opening and drinking. Cool daylight. |
| Scene 03 · The Set | Athlete in a dark gym, condensation on the bottle, slow motion. Teal grade. |
| Scene 04 · Golden Hour | Friends on a rooftop, bottles clinking, someone laughing mid-sip. |
| Source cards | Cupped hands with spring water · river stones under water · droplet crowning off the cap. |
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
- [ ] Real photos/video for every `.ph`
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

Layout rhythm and motion feel inspired by a Webflow drinks template (likely a paid template). All copy, code, illustrations and imagery here are original or yours.
