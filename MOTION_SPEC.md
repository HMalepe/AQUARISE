# Aquarise — Motion spec

The source of truth for every animation. If you port to Next.js or another stack, rebuild against this file, not against memory of how it "felt".

## Global

| Setting | Value |
|---|---|
| Smooth scroll | Lenis `lerp: .09`, `smoothWheel: true`, driven by `gsap.ticker` (`lagSmoothing(0)`) |
| ScrollTrigger | `config({ ignoreMobileResize: true })`, `ScrollTrigger.sort()` after all triggers, refresh after `document.fonts.ready` and `window.load` |
| Signature eases | `expo.out` (entrances), `expo.inOut` (curtains), `power2.inOut` (water floods), `none` (scrubbed parallax) |
| Units | Sections use `svh`; pinned durations are functions of `innerHeight` with `invalidateOnRefresh: true` |
| Static mode | `html.static` when reduced motion is on or GSAP is missing; JS returns before any motion code |
| Video | Every `video[data-video]` plays only while within 200px of the viewport (IntersectionObserver, A11) and pauses otherwise. `preload="none"` flips to `auto` on first play. Reduced motion: never plays, posters only. The pinned film's clips are driven by C7 instead (see 04). |

## Reusable primitives

### 1. Wave clip (the core water effect)
`makeWave(el, dir, { amp, freq })` returns an object with `p` (0→1). Tween `p` with GSAP. A single `gsap.ticker` callback redraws a `clip-path: polygon()` with 33 points along a wobbling edge.

- `dir`: `bottom` (water rises), `top` (water pours down), `left`, `right` (water sweeps across)
- Edge position: `p * (100 + 2·amp) − amp` percent, so `p=0` is fully hidden and `p=1` is fully covered
- Wobble: two summed sines over the edge, time-animated (`t·0.32` and `t·0.47` cycles/s). Amplitude swells mid-flow: `amp · (0.35 + 0.65·sin(π·p))`
- At `p=0` or `p=1` the clip-path is written once and the element is skipped (no per-frame cost)
- Knobs: `amp` (edge height in %, default 6), `freq` (number of crests across the edge, default 1.2)

### 2. Masked word rise
`[data-split]` → `span.w > span.wi` per word. `.wi` goes `yPercent 118 → 0`, `expo.out`, 1.2s, stagger 0.07, trigger `top 88%`, once.

### 3. Fade-up
`[data-fade]`: `y 40 → 0`, `autoAlpha 0 → 1`, `expo.out`, 1.1s, trigger `top 90%`, once.

### 4. SVG bottle with live liquid
Each `.bottle[data-liquid][data-level]` gets an SVG body. The liquid surface is a path rebuilt each frame from two sines (amplitudes 3.2 and 1.8 units). The liquid group is counter-rotated by the bottle's rotation, so the water stays level while the bottle tilts. Only bottles in view (IntersectionObserver) update.

### 5. Parallax float
`[data-speed]`: `y = speed·180 → −speed·180` px across its section, scrubbed (`scrub: true`).

### 6. Splash
`splash(host)`: 14 droplets fly from the pool line (`power2.out` up, then `power2.in` down and fade).

### 7. Clip reveal + drift
`.src-media` `clipPath inset(100% 0 0 0) → inset(0)`, 1.4s `expo.out`; inner `.ph` `scale 1.3 → 1`; `.drift` `yPercent −6 → 6` scrubbed.

## Section choreography

### 00 Loader → letterbox → hero intro (timeline, not scrolled)
| t (s) | What |
|---|---|
| 0.2 | Counter 0→100 and loader water `p 0→1` (bottom), 1.8s `power2.inOut` |
| 0.2 | Logo sun rises over the wave: `.lm-sun` `y 95 → 0`, 1.7s `power3.out`, clipped at the wave line (`#sunClip`) |
| 1.35 | Sun rays `scale .2 → 1`, fade in, `back.out(2.4)`, `svgOrigin 374 192` (sun centre in logo units) |
| 2.15 | Loader slides up `yPercent −100`, 1.1s `expo.inOut`, then `display:none` |
| 2.5 | Hero image `scale 1.3 → 1`, 2.4s `expo.out` |
| 2.7 | Letterbox bars `scaleY 1 → 0`, 1.4s `expo.inOut` |
| 2.95 | Title words rise (stagger 0.07), pill pops `back.out(2)`, nav and meta fade down/up |
| end | `lenis.start()` (scroll is locked during the intro) |

### 01 Hero — pinned
Background is `assets/video/hero.mp4` (8s seamless loop, poster = the original photo). Same `.hero-img` class, so the intro push-in and the pinned scale still apply.
Trigger `.hero`, `top top` → `+=130%`, `scrub: 1`.
| Timeline pos | Tween |
|---|---|
| 0 → .45 | `.hl-1` `yPercent −70`, fade out |
| .06 → .51 | `.hl-2` `yPercent −40`, fade out |
| 0 → .2 | meta fade (`fromTo`, `immediateRender:false`) |
| 0 → 1 | `.hero-media` `scale 1.2`, `yPercent −6` |
| .38 → 1 | **Water rises from the bottom** (`.hero-flood` wave `p 0→1`, `power1.in`, amp 7) |
| .7 → 1 | "Drawn from the deep…" rises in |
Also: pointer ripple canvas (ellipse rings, 70ms throttle, auto-drop every 50 frames), active only while the hero is on screen.

### 02 Tides — pinned (water from four directions)
Trigger `.tides`, `top top` → `+= 3.4 × innerHeight`, `scrub: 1`.
| Step | At | Flood from | Layer colour | Word |
|---|---|---|---|---|
| intro fades | .1 | — | deep | "Four tides. One bottle." |
| 1 | .25 | **left** | deep tide blue | SOURCE |
| 2 | 1.25 | **right** | wave blue | STONE |
| 3 | 2.25 | **top** (pour) | sunrise gradient | BALANCE |
| 4 | 3.25 | **bottom** (rise) | foam | YOU |
Each step: wave `p 0→1` over .85 (`power1.inOut`, amp 7); word `yPercent 35→0, scale 1.18→1`; label + line fade in at +.4; previous layer's copy shrinks to .88 and dims. Progress bar scales across the whole timeline. Hold .35 at the end.

### 03 Feature
- Bottle `rotate −20° → 16°`, `y 70 → −70`, scrubbed across the section; liquid counter-rotates (stays level)
- Stickers `scale 0 → 1`, `back.out(2.2)`, stagger .12, trigger `top 70%`, once
- Stickers and droplets: `[data-speed]` parallax
- Foam-to-abyss wave seam at the top (CSS mask)

### 04 Scenes — pinned film ("The Thirst")
Trigger `.scenes`, `top top` → `+= scenes × innerHeight`, `scrub: 1`.
| Scene | Clip | At | Washes in from | Inner video | Previous scene |
|---|---|---|---|---|---|
| 01 The Heat | `heat` | 0 | — | `scale 1.15→1` | — |
| 02 The Craving | `condensation` | 1.1 | **right** | `scale 1.28→1` | `scale .9`, `xPercent −8` |
| 03 The First Drop | `drop` | 2.2 | **top** | same | `scale .9`, `yPercent 8` |
| 04 The Relief | `stones` | 3.3 | **left** | same | `scale .9`, `xPercent 8` |
Subtitle and meta fade in at +.55. Each scene has its own letterbox bars and `isolation: isolate` (important: otherwise z-indexed children leak above later scenes). Dots track the scene whose wave is past .5.
Playback: only the active scene and the one currently washing in (wave `0 < p < 1`) play; the rest pause. An IntersectionObserver on `.scenes` pauses all four once the section leaves the screen.

### 04b Spring — pinned knockout
Trigger `.spring-stage`, `top top` → `+= 1.8 × innerHeight`, `scrub: 1`, `invalidateOnRefresh`.
- The waterfall video plays behind `.spring-mask`, an abyss layer with white text in `mix-blend-mode: multiply`, so the video only shows through the letters of SPRING.
- `transform-origin` is the centre of the **I** (measured with `offsetLeft/Top` on every `refreshInit`, so it ignores the current scale).
| Timeline pos | Tween |
|---|---|
| .12 → 1.12 | `.spring-word` `scale 1 → 48`, `power3.in` — the camera flies through the I's stem |
| .12 → 1.07 | video `filter brightness(1.9) saturate(1.25) → normal` (letters read brighter while small) |
| 1.04 | mask `autoAlpha 1 → 0` (it is already fully inside the white stem, so nothing visibly changes) |
| 1.06 | logo, kicker, title, line rise `y 50 → 0`, stagger .07 |
| end | hold .3 |
Below it, `.marquee`: two identical runs of text + logo marks, CSS `translateX(0 → −50%)`, 30s linear, infinite. Track has `padding-right` = `gap` so the halfway point is exact.

### 05 Shop
- Arch heading: `#archPath` `d` morphs from curved (`Q 500 −10`) to flat, scrubbed `top 90%` → `top 30%`
- First bottle rises out of the pool `yPercent 110 → 0`, 1.4s `expo.out`, then splash
- Slide change: outgoing bottle sinks (`yPercent 110`, rotate `±12°`, .6s `power3.in`); incoming rises from `yPercent 110` with opposite tilt, 1.1s `expo.out` at .45; splash at .75; name `yPercent 105 → 0`; desc and price fade at .3
- Pool: two masked wave strips drifting in opposite directions (CSS)

### 06 Bundles
- Each card fills with water from the bottom (`p 0→1`, 1.6s `power2.out`, trigger `top 85%`, once), children fade up from .35

### 07 Compare
- `.us-fill` sized to the Aquarise column on every `refreshInit`; wave `p 0→1` scrubbed `top 70%` → `bottom 55%` (amp 4, freq .6)
- Rows slide in `x −30 → 0`, stagger .1, once

### 08 Source
Primitive 7, batched with stagger .14; text fades up after .3.

### 08 Source cards
Each `.ph` now holds a looping clip (waterfall, stones, condensation); the clip reveal and drift above apply unchanged.

### 09 FAQ / 10 Join
Word rises and fade-ups only. The join button fills with a curved water shape on hover (CSS). Join has the `drop` clip behind it at .55 opacity under an abyss gradient.

### 11 Footer
`.foot-mark` (the traced Aquarise wordmark, SVG) `yPercent 100 → 0`, scrubbed from `top bottom` to `bottom bottom`, rising behind two drifting wave strips.

## Tuning knobs

| Want | Change |
|---|---|
| Choppier water edges | raise `amp` in `makeWave` calls (hero 7, tides 7, scenes 8) |
| More crests | raise `freq` (1.2 default) |
| Longer tides sequence | `innerHeight * 3.4` in C5 |
| Slower film | `innerHeight * scenes.length` in C7 |
| Snappier smoothing | Lenis `lerp` up (.12) |
| Shorter intro | counter duration 1.8 → 1.2 |
| Bottle slosh | the sine amplitudes 3.2 / 1.8 in `renderBottle` |
| Longer/shorter fly-through | `innerHeight * 1.8` in C7b; final `scale` 48 (must stay big enough for the I's stem to cover the screen) |
| Faster marquee | `animation` duration on `.marquee-track` (30s) |
| Footage look | edit the GLSL in `tools/footage/films.js`, re-render (see README) |
