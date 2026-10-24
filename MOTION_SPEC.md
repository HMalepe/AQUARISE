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
| Video | Every `video[data-video]` plays only while within 200px of the viewport (IntersectionObserver, A11) and pauses otherwise. `preload="none"` flips to `auto` on first play. Reduced motion: never plays, posters only.  |

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

### 4. Bottle packshot
Every `.bottle` gets the real Aquarise bottle (`assets/bottle.webp` / `.png`, cut out of the sunrise photo) with a drop shadow. It moves only through the slider and splash animations below; no per-frame work.

### 5. Parallax float
`[data-speed]`: `y = speed·180 → −speed·180` px across its section, scrubbed (`scrub: true`).

### 5a. Water-fill CTAs
Every `.pill` fills with water on hover/focus: a wave-topped aqua body (`::before`, inset `-45% -15% -10%`) rises `translateY(105% → 0)`, .75s `ease-out`; its crest sits above the button so the fill is always complete, then sloshes gently (border-radius swap, 2.4s). Text turns ink (foam on the aqua Daily Ritual card, where the fill is `--wave`).

### 5b. Shine
`.shine::after`: a white glint sweeps across a pill every 3.2s (CSS). Static mode stops it.

### 6. Splash (retired)
`splash(host)`: 14 droplets fly from the pool line (`power2.out` up, then `power2.in` down and fade).

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
Background is `assets/video/hero.mp4` (8s seamless loop, 1920×1366, rendered from `assets/hero-bottle-hd.jpg`, a Real-ESRGAN 4× upscale of the photo, which is also the poster). Same `.hero-img` class, so the intro push-in and the pinned scale still apply.
Trigger `.hero`, `top top` → `+= 2.4 × innerHeight`, `scrub: true` (no extra lag: Lenis already smooths the scroll, and any scrub lag let the lens drift up with the unpinning hero, so SPRING dropped ~100px at the hand-off).
| Timeline pos | Tween |
|---|---|
| 0 → .3 | `.hl-1` `yPercent −70`, fade out; `.hl-2` (from .04) `yPercent −40`, fade out |
| 0 → .1 | meta fade (`fromTo`, `immediateRender:false`) |
| 0 → .42 | `.hero-media` `scale 1.2`, `yPercent −6` |
| .08 → .18 | `.hero-offer` (button only) rises `y 60 → 0`, fades in; pops `scale .8 → 1` `back.out(2)` at .11 |
| .4 → .48 | offer lifts away `y −40`, fades |
| .42 → .92 | gentle push into the bottle: `.hero-media` `scale → 1.5`, `sine.inOut` |
| .46 → .86 | `.hero-dim` fades to `.9`, `sine.inOut` |
| .52 → 1 | **fisheye lens**: `.hero-portal` mask `--r 0% → 160%` (soft-edged circle, solid core at 78% of the radius, centred on the bottle at 50% 46%), `power2.inOut`. Inside it the SPRING frame (canvas + word) **zooms in** from `scale .55` to 1 at a constant log rate (`scale = e^z`, `z: ln .55 → 0`, linear), and its blur clears 4px → 0 over the first .3 |
| end | no hold (.01): SPRING's own zoom takes over at the same scroll position |
Start states (`.hero-dim`, the lens `--r`/visibility, the inner scale/blur) are `.set` at 0 inside the timeline so scrubbing back always restores them. The portal paints SPRING's live video frame every tick while visible, so the hand-off matches on every pass.
**Seamless hand-off**: `.spring` gets `margin-top: −heroHeight` (re-measured on `refreshInit`), so the spring stage sits exactly where the hero is when its pin releases. `.spring` is shown/hidden by the hero timeline's own scrub-smoothed progress (`> .999`), not the raw scroll position, so a fast scroll can never swap sections before the lens has finished (or, going up, started closing).
Also: pointer ripple canvas (ellipse rings, 70ms throttle, auto-drop every 50 frames), active only while the hero is on screen.
The old water flood ("Drawn from the deep") and the 02 Tides section were removed.

### 02 Spring — pinned knockout
Trigger `.spring-stage`, `top top` → `+= 1.8 × innerHeight`, `scrub: 1`, `invalidateOnRefresh`.
- The waterfall video plays behind `.spring-mask`, an abyss layer with white text in `mix-blend-mode: multiply`, so the video only shows through the letters of SPRING.
- `transform-origin` is the centre of the **I**'s stem: measured from on-screen rects (I centre − word left, word height / 2) divided by the current scale, on every `refreshInit`. The old `offsetLeft` maths used the wrong parent and aimed above and beside the I, so the fly-through went dark and snapped bright at the end.
| Timeline pos | Tween |
|---|---|
| 0 → 1.04 | `.spring-word` zoom continues the hero lens with no restart: `scale = exp(.6·p + (ln 48 − .6)·p³)`, `p` linear. It starts at the lens' exit zoom rate (.6 = ln(1/.55) per zoom phase) and accelerates to 48× through the I's stem. `scrub: true`, same as the hero |
| 0 → 1 | video `filter brightness(1.25) saturate(1.15) → normal` (letters read brighter while small) |
| 0 / 1.04 | mask `set autoAlpha 1` at 0 (so rewinding always restores it), then `autoAlpha 1 → 0` (it is already fully inside the white stem, so nothing visibly changes) |
| 1.06 | logo, kicker, title, line rise `y 50 → 0`, stagger .07 |
| end | hold .3 |
Below it, `.marquee`: two identical runs of text + logo marks, CSS `translateX(0 → −50%)`, 30s linear, infinite. Track has `padding-right` = `gap` so the halfway point is exact.

### 03 Feature
One scrubbed timeline, trigger `.feature`, `top 80%` → `center 55%`, `scrub: .6` (the copy writes itself in as you scroll, and reverses on the way back):
| Timeline pos | Tween |
|---|---|
| 0 → 1 | `.feature-visual` opens `clip-path inset(14% 18% round 48px) → inset(0 round 20px)`; the `sip` clip inside eases `scale 1.25 → 1` |
| .08 → | heading words rise `yPercent 120 → 0`, `rotate 7° → 0`, stagger .14 |
| .4 → | the lead paragraph, split into `.lw` words, comes up one word at a time: `opacity .1 → 1`, `y 12 → 0`, `blur 6px → 0`, stagger .025 |
| .72 → | pills pop `y 34`, `scale .85 → 1`, `back.out(2)`, stagger .07; their icons spin in `rotate −120° → 0`, `scale 0 → 1` |
Then "ALIVE." (`.shimmer-word`) runs a slow lemon highlight sweep every 5s (CSS). The feature is excluded from the generic C4 reveals.

### 05 Shop
- Arch heading: `#archPath` `d` morphs from curved (`Q 500 −10`) to flat, scrubbed `top 90%` → `top 30%`
- Stage: the HD bottle packshot (cut from a Real-ESRGAN 4× upscale) backlit by `.stage-glow` (warm radial, like the photo's sunrise), on `.stage-floor` (glossy line + sheen) with a flipped, masked reflection (`.b-reflect`) and a contact shadow
- Behind the bottle, `.stage-mist` plays `mist` (the sunlit steam cropped from the waterfall clip, 0.7× speed, forward-then-reverse ~14s loop) with `mix-blend-mode: screen` and a radial mask, so only the glowing steam and rays show
- Entrance (`top 75%`, once): glow and mist `autoAlpha 0 → 1`, `scale .8 → 1`, 1.6s `expo.out`; bottle `y 80 → 0`, fades in, 1.4s `expo.out` at .1
- Slide change: outgoing glides out `xPercent ∓70`, `rotate ∓5°`, fades, .55s `power2.in`; incoming glides in from the other side, 1s `expo.out` at .3; glow re-brightens `.55 → 1`; name `yPercent 105 → 0`; desc and price fade at .3

### 06 Bundles
Scroll (each card, `top 85%`, once):
- Card fills with water from the bottom (`p 0→1`, 1.6s `power2.out`), children fade up from .35
- Bottles drop in from `y −160` with `rotate −22° / 8° / 24°`, `bounce.out`, stagger .12, at .55
- Price counts up R0 → R289 / R249 (1.4s `power3.out`); the Weekly/Monthly toggle pops `scale .6 → 1` `back.out(2.5)`
Hover (fine pointers only):
- 3D tilt toward the cursor (`rotationX ±5°`, `rotationY ±6°`, `quickTo` .6s, perspective 1000) plus a soft-light glare that follows the pointer (`--mx/--my`)
- The bottle trio fans out (outer bottles `rotate ∓9°`, middle lifts) and the button is magnetic (`x/y` follow the pointer ×.3/.4)
Click: bottles hop (`y −26` yoyo, stagger .06) and a lemon "+1 in your cart" floats up from the button. Switching Weekly/Monthly springs the price `scale .7 → 1`, `back.out(3)`.

### 09 FAQ (faq.html) / 10 Join
Word rises and fade-ups only. The join button uses the shared water-fill hover (5a). 

### 11 Footer
`.foot-mark` (the traced Aquarise wordmark, SVG) `yPercent 100 → 0`, scrubbed from `top bottom` to `bottom bottom`, rising behind two drifting wave strips.

## Tuning knobs

| Want | Change |
|---|---|
| Choppier water edges | raise `amp` in `makeWave` calls |
| More crests | raise `freq` (1.2 default) |
| Slower film | the `.8` multiplier in C7's `end` (and `scrub` for more/less lag) |
| Snappier smoothing | Lenis `lerp` up (.12) |
| Shorter intro | counter duration 1.8 → 1.2 |
| Longer/shorter fly-through | `innerHeight * 1.8` in C5; final `scale` 48 (must stay big enough for the I's stem to cover the screen) |
| Faster marquee | `animation` duration on `.marquee-track` (30s) |
| Footage look | edit the GLSL in `tools/footage/films.js`, re-render (see README) |
