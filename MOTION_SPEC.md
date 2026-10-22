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
| 2.15 | Loader slides up `yPercent −100`, 1.1s `expo.inOut`, then `display:none` |
| 2.5 | Hero image `scale 1.3 → 1`, 2.4s `expo.out` |
| 2.7 | Letterbox bars `scaleY 1 → 0`, 1.4s `expo.inOut` |
| 2.95 | Title words rise (stagger 0.07), pill pops `back.out(2)`, nav and meta fade down/up |
| end | `lenis.start()` (scroll is locked during the intro) |

### 01 Hero — pinned
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

### 04 Scenes — pinned film
Trigger `.scenes`, `top top` → `+= scenes × innerHeight`, `scrub: 1`.
| Scene | At | Washes in from | Inner image | Previous scene |
|---|---|---|---|---|
| 01 The Run | 0 | — | `scale 1.15→1` | — |
| 02 Deep Work | 1.1 | **right** | `scale 1.28→1` | `scale .9`, `xPercent −8` |
| 03 The Set | 2.2 | **top** | same | `scale .9`, `yPercent 8` |
| 04 Golden Hour | 3.3 | **left** | same | `scale .9`, `xPercent 8` |
Subtitle and meta fade in at +.55. Each scene has its own letterbox bars and `isolation: isolate` (important: otherwise z-indexed children leak above later scenes). Dots track the scene whose wave is past .5.

### 05 Shop
- Arch heading: `#archPath` `d` morphs from curved (`Q 500 −10`) to flat, scrubbed `top 90%` → `top 30%`
- First bottle rises out of the pool `yPercent 110 → 0`, 1.4s `expo.out`, then splash
- Slide change: outgoing bottle sinks (`yPercent 110`, rotate `±12°`, .6s `power3.in`); incoming rises from `yPercent 110` with opposite tilt, 1.1s `expo.out` at .45; splash at .75; name `yPercent 105 → 0`; desc and price fade at .3
- Pool: two masked wave strips drifting in opposite directions (CSS)

### 06 Bundles
- Each card fills with water from the bottom (`p 0→1`, 1.6s `power2.out`, trigger `top 85%`, once), children fade up from .35
- Wide card pour, scrubbed `top 80%` → `bottom 45%`: stream `scaleY 0→1` (0–.25), glass fill `scaleY 0→1` (.15–.8), stream drains from the top (.85–1)

### 07 Compare
- `.us-fill` sized to the Aquarise column on every `refreshInit`; wave `p 0→1` scrubbed `top 70%` → `bottom 55%` (amp 4, freq .6)
- Rows slide in `x −30 → 0`, stagger .1, once

### 08 Source
Primitive 7, batched with stagger .14; text fades up after .3.

### 09 FAQ / 10 Join
Word rises and fade-ups only. The join button fills with a curved water shape on hover (CSS).

### 11 Footer
`.foot-mark` `yPercent 100 → 0`, scrubbed from `top bottom` to `bottom bottom`, rising behind two drifting wave strips.

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
