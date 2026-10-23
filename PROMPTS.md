# Paste-ready prompts for Claude Code / Cursor

Open this folder in your IDE first so the assistant reads `CLAUDE.md` / `.cursorrules`. Then paste one at a time.

---

## 1 · Real photos and video
```
I've added real footage/photos to assets/: [list files]. Each rendered clip in assets/video/ (hero, heat,
condensation, drop, stones, waterfall) can be replaced by a real one with the same name: give me .webm + .mp4 +
a .jpg poster, muted, under ~4 MB. Keep the existing <video data-video muted loop playsinline poster> markup so
on-screen-only playback and reduced motion still work. Photos go in <img loading="lazy" decoding="async" width height>
with WebP + JPG via <picture>. Keep the .ph wrapper so the grain overlay and drift animations still work.
Use a separate transparent packshot per product (each size/variant) instead of the shared assets/bottle.webp, but keep the sink/rise/splash animation.
Test at 390px and 1280px, no console errors, reduced-motion still works.
```

## 2 · Port to Next.js (App Router)
```
Port this site to Next.js 15 App Router + TypeScript. Use MOTION_SPEC.md as the source of truth for every animation.
- Lenis in a client <SmoothScroll> provider (lenis/react), synced to ScrollTrigger and gsap.ticker.
- Each section is a component; motion lives in useGSAP from @gsap/react with scope refs and automatic cleanup.
- Port makeWave() into a hook (useWaveClip) with a shared ticker; port the packshot bottle into <Bottle src />.
- Cart state in a Zustand store persisted to localStorage; products in /data/products.ts.
- Fonts via next/font/local from assets/fonts. Images via next/image.
- Keep the .static fallback: if prefers-reduced-motion, skip all GSAP setup and render final states.
Verify each pinned sequence matches the step tables in MOTION_SPEC.md.
```

## 3 · Checkout, cart and newsletter wiring
```
Wire the commerce: [choose one] Shopify Storefront API cart + checkout / Yoco payments / PayFast / Stripe Checkout.
Map PRODUCTS and EXTRAS in js/main.js to real product/variant IDs. The subscription card needs recurring billing
(Shopify Subscriptions / Stripe subscriptions). Replace the "Checkout not connected" toast with a redirect to the
hosted checkout. Prices must come from the platform, not hardcoded.
Also wire the newsletter form to [Klaviyo / Mailchimp / Resend audience] with a serverless function
(Vercel /api/subscribe), honeypot field, and a success/error state in .form-msg.
```

## 4 · Main feature: subscription builder
```
Build a "Build your case" subscription page: choose bottle size and still/sparkling mix with sliders (a 24-slot crate
fills with bottles as you choose), pick weekly/fortnightly/monthly, see the price update live, then add to cart.
Use the same wave-clip water fill for the crate and the existing design tokens. Mobile first. Add a .static fallback.
```

## 5 · Markdown blog / journal
```
Add a /journal section: Markdown posts in /content/journal with frontmatter (title, date, cover, excerpt).
Build an index page with cards that use the .src-card clip reveal, and a post template with masked word-rise
headings. Static generation, no CMS. Add 3 placeholder posts about hydration habits (no medical claims).
```

## 6 · Motion tuning pass
```
Tune the motion against MOTION_SPEC.md: make the tides sequence feel heavier (slower ease on the floods, slightly
bigger amp), give the scene transitions a subtle horizontal motion blur via a CSS filter that peaks mid-wave,
and add a soft fade-out of section headings as they leave the top of the viewport. Update MOTION_SPEC.md with
every changed value.
```

## 7 · Performance pass
```
Run a performance pass: Lighthouse mobile ≥ 90. Lazy-init each section's ScrollTriggers, pause the wave ticker
and bubble/caustic CSS animations for sections that are off screen (IntersectionObserver toggling a .paused class),
reduce clip-path polygon points on low-end devices (navigator.hardwareConcurrency <= 4), compress media, preload the
hero image, and make sure there's no layout shift from the loader. Report before/after numbers.
```

## 8 · SEO and social
```
Add SEO: title/description per page, Open Graph + Twitter tags with a 1200x630 assets/og.jpg, favicon set,
canonical URL, robots.txt, sitemap.xml, and Product + Organization JSON-LD (prices from the product data,
availability, brand Aquarise). Make sure all headings form a logical outline and every image has alt text.
```
