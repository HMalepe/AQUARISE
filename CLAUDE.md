# Aquarise site — rules for AI assistants

## Stack
- Static HTML + CSS + vanilla JS. GSAP 3 + ScrollTrigger + Lenis, vendored in `js/vendor/`. No build step, no framework (unless porting via PROMPTS.md #2).
- Fonts are self-hosted in `assets/fonts/` (Anton display, Manrope body). Don't add Google Fonts links.
- Type rules: Anton (weight 400 only) is for big statement headlines (hero, SPRING, section titles, product names, card titles, marquee). Buttons, prices, tabs, labels, footer headings and small UI use Manrope 600–800. `font-synthesis: none` is on, so never ask Anton for another weight. No text under 13px.
- Logo: the `#aq-mark` / `#aq-word` symbols in the sprite at the top of `index.html` (traced from the real logo). Use `<svg><use href="#aq-mark"/></svg>`; colour with `--mark-sun`, `--mark-wave` and `color`. Don't redraw it.
- Video: clips live in `assets/video/` as `.webm` + `.mp4` + `.jpg` poster, rendered by `tools/footage/` (see README). Every `<video>` is `muted loop playsinline`, has `data-video` (so it only plays on screen) and a poster.
- `MOTION_SPEC.md` is the source of truth for animation. Update it whenever you change motion.

## Structure rules
- `index.html`: one `<section>` per block, keep the numbered comments (00–11).
- `css/styles.css`: order is tokens → base → primitives → sections in page order → cart/menu → responsive → `.static`. New sections go in page order.
- `js/main.js`: Part A basics (work without GSAP) → Part B static gate (`return`) → Part C motion blocks **in DOM order**. Pinned sections must be created in the order they appear on the page. Keep `ScrollTrigger.sort()` and the refreshes at the end.

## Colour
- Use tokens only (`var(--abyss)`, `--deep`, `--tide`, `--wave`, `--aqua`, `--mist`, `--foam`, `--sun`, `--coral`, `--ink`, brand `--lemon`, `--navy`). Don't add raw hex values in sections; add a token first.

## Motion gotchas
- Never hide content with CSS start states. Set start states with `gsap.set` or `fromTo` so static mode and no-JS still show everything.
- When an element's start state was set earlier by another tween (e.g. the intro), use `fromTo` with explicit values and `immediateRender: false` inside scrubbed timelines. A plain `.to()`/`.from()` records the wrong start value.
- Animate only `transform` and `opacity`. Water reveals are a wave-edged layer moved with transform (static CSS mask for the wave). No animated clip-path, mask, filter/blur or box-shadow on large elements. One exception: the hero lens is a `clip-path: circle()` on `.hero-portal` (a scaled wrapper with a counter-scaled picture jittered by ~.5px per frame); its soft rim is a small transform-scaled ring. Run `node tools/perf/flick.mjs` after motion changes (see README).
- Any element with z-indexed children stacked under another layer needs `isolation: isolate` (see `.scene`).
- Pinned durations: function values + `invalidateOnRefresh: true`. Size pinned focus elements in `svh`.
- Every new animation needs a `.static` fallback that shows the final state.

## Content
- No fabricated reviews or testimonials. Claims (BPA-free, minerals, recyclability) are placeholders until the owner confirms them.
- Prices are ZAR placeholders, marked `*`.

## Test before saying done
- Widths: 390×844 and 1280×800 (also 1440+). No horizontal scroll: `document.documentElement.scrollWidth - innerWidth === 0`.
- Zero console errors.
- Emulate `prefers-reduced-motion: reduce`: page must render fully in `.static` with no loader.
- Scroll through each pinned section (hero, spring, feature) and check text is never clipped.
