# Aquarise site — rules for AI assistants

## Stack
- Static HTML + CSS + vanilla JS. GSAP 3 + ScrollTrigger + Lenis, vendored in `js/vendor/`. No build step, no framework (unless porting via PROMPTS.md #2).
- Fonts are self-hosted in `assets/fonts/` (Anton display, Manrope body). Don't add Google Fonts links.
- `MOTION_SPEC.md` is the source of truth for animation. Update it whenever you change motion.

## Structure rules
- `index.html`: one `<section>` per block, keep the numbered comments (00–11).
- `css/styles.css`: order is tokens → base → primitives → sections in page order → cart/menu → responsive → `.static`. New sections go in page order.
- `js/main.js`: Part A basics (work without GSAP) → Part B static gate (`return`) → Part C motion blocks **in DOM order**. Pinned sections must be created in the order they appear on the page. Keep `ScrollTrigger.sort()` and the refreshes at the end.

## Colour
- Use tokens only (`var(--abyss)`, `--deep`, `--tide`, `--wave`, `--aqua`, `--mist`, `--foam`, `--sun`, `--coral`, `--ink`). Don't add raw hex values in sections; add a token first.

## Motion gotchas
- Never hide content with CSS start states. Set start states with `gsap.set` or `fromTo` so static mode and no-JS still show everything.
- When an element's start state was set earlier by another tween (e.g. the intro), use `fromTo` with explicit values and `immediateRender: false` inside scrubbed timelines. A plain `.to()`/`.from()` records the wrong start value.
- Water floods use `makeWave(el, dir)` and tween `.p`. Don't animate `clip-path` on those elements any other way.
- Any element with z-indexed children stacked under another layer needs `isolation: isolate` (see `.scene`).
- Pinned durations: function values + `invalidateOnRefresh: true`. Size pinned focus elements in `svh`.
- Every new animation needs a `.static` fallback that shows the final state.

## Content
- No fabricated reviews or testimonials. Claims (BPA-free, minerals, comparison table) are placeholders until the owner confirms them.
- Prices are ZAR placeholders, marked `*`.

## Test before saying done
- Widths: 390×844 and 1280×800 (also 1440+). No horizontal scroll: `document.documentElement.scrollWidth - innerWidth === 0`.
- Zero console errors.
- Emulate `prefers-reduced-motion: reduce`: page must render fully in `.static` with no loader.
- Scroll through each pinned section (hero, tides, scenes) and check text is never clipped.
