/* ==========================================================================
   AQUARISE — main.js
   Part A: basics that work in every mode (cart, slider, menu, forms, bottles, videos)
   Part B: early return into .static if reduced motion / GSAP missing
   Part C: motion blocks in DOM order (loader → hero → spring → feature →
           shop → bundles → footer)
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const html = document.documentElement;
  let lenis = null;          // set in Part C
  let animateSlide = null;   // set in Part C (slider motion hook)

  /* ── A1 · catalogue (placeholder prices in ZAR — confirm before launch) ── */
  const PRODUCTS = [
    { id: 'still-500',     name: 'Still 500ml',     price: 18, color: '#3FB8E8', level: .2,  label: '#0E5A8A', desc: 'The everyday bottle. Cold, clean and quietly mineral.' },
    { id: 'still-1l',      name: 'Still 1L',        price: 29, color: '#7FD3F7', level: .16, label: '#0E5A8A', desc: 'For long days, long drives and longer meetings.' },
    { id: 'sparkling-500', name: 'Sparkling 500ml', price: 24, color: '#CFF3FF', accent: '#F6B26B', level: .22, label: '#0E5A8A', desc: 'Sparkling Sunrise — a fine, lively bubble for warm afternoons.' },
    { id: 'mineral-750',   name: 'Mineral+ 750ml',  price: 32, color: '#1C8FC4', level: .18, label: '#E8F6FB', desc: 'Higher natural mineral content, made for after the set.' },
    { id: 'glass-750',     name: 'Glass 750ml',     price: 45, color: '#9BE1FF', level: .2,  label: '#0E5A8A', desc: 'The dinner-table edition, in returnable glass.' }
  ];
  const EXTRAS = {
    'ritual-24':   { name: 'Daily Ritual · 24 × 500ml', price: 289, color: '#9BE1FF' },
    'sub-weekly':  { name: 'Never Run Dry · weekly (billed monthly)', price: 996, color: '#1C8FC4' },
    'sub-monthly': { name: 'Never Run Dry · monthly',   price: 899, color: '#1C8FC4' }
  };
  const FREE_SHIP = 350;
  const item = id => PRODUCTS.find(p => p.id === id) || EXTRAS[id];
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ── A2 · bottle: the real Aquarise packshot (cut out of the sunrise photo) ── */
  function buildBottle(el) {
    if (el.dataset.built) return;
    el.dataset.built = '1';
    const pic = '<picture><source srcset="assets/bottle.webp" type="image/webp"><img src="assets/bottle.png" alt="" width="368" height="1400" loading="eager" decoding="async" draggable="false"></picture>';
    el.innerHTML = pic + '<img class="b-reflect" src="assets/bottle.webp" alt="" width="368" height="1400" loading="eager" decoding="async" draggable="false">';   // reflection, shown on the shop stage only
  }

  /* ── A3 · bubbles inside water layers ── */
  $$('[data-bubbles]').forEach(box => {
    const n = +box.dataset.bubbles || 12;
    for (let i = 0; i < n; i++) {
      const s = rand(4, 16), b = document.createElement('i');
      b.style.cssText = `left:${rand(0, 100)}%;width:${s}px;height:${s}px;animation-duration:${rand(6, 14)}s;animation-delay:${-rand(0, 14)}s;--sway:${rand(-40, 40)}px`;
      box.appendChild(b);
    }
  });

  /* ── A4 · product slider ── */
  const slider = $('[data-slider]');
  const sl = { i: 0, els: [] };
  if (slider) {
    const wrap = $('[data-slide-bottles]', slider), tabs = $('[data-slide-tabs]', slider);
    PRODUCTS.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'bottle'; d.dataset.liquid = p.color; d.dataset.level = p.level; d.dataset.labelColor = p.label;
      d.setAttribute('role', 'img'); d.setAttribute('aria-label', `Aquarise ${p.name}`);
      if (i) d.hidden = true;
      wrap.appendChild(d); sl.els.push(d);
      const t = document.createElement('button');
      t.type = 'button'; t.setAttribute('role', 'tab'); t.textContent = p.name; t.setAttribute('aria-selected', i === 0);
      t.addEventListener('click', () => showSlide(i, i > sl.i ? 1 : -1));
      tabs.appendChild(t);
    });
    $('[data-slide-prev]', slider).addEventListener('click', () => showSlide(sl.i - 1, -1));
    $('[data-slide-next]', slider).addEventListener('click', () => showSlide(sl.i + 1, 1));
    $('[data-slide-add]', slider).addEventListener('click', () => addToCart(PRODUCTS[sl.i].id));
    setSlideText(0);
  }
  function setSlideText(i) {
    const p = PRODUCTS[i];
    $('[data-slide-name]').textContent = p.name;
    $('[data-slide-desc]').textContent = p.desc;
    $('[data-slide-price]').textContent = `R${p.price}*`;
    $$('[data-slide-tabs] button').forEach((b, j) => b.setAttribute('aria-selected', i === j));
  }
  function showSlide(n, dir) {
    const len = PRODUCTS.length;
    n = (n + len) % len;
    if (n === sl.i) return;
    const prev = sl.els[sl.i], next = sl.els[n];
    sl.i = n;
    setSlideText(n);
    if (animateSlide) animateSlide(prev, next, dir);
    else { prev.hidden = true; next.hidden = false; }
  }

  // build every bottle on the page (slider ones included)
  $$('.bottle').forEach(buildBottle);

  /* ── A5 · subscription toggle ── */
  $$('input[name="freq"]').forEach(r => r.addEventListener('change', () => {
    const monthly = r.value === 'monthly' && r.checked;
    const btn = $('[data-sub-btn]'), price = $('[data-sub-price]');
    btn.dataset.add = monthly ? 'sub-monthly' : 'sub-weekly';
    const note = $('[data-sub-note]'); if (note) note.textContent = monthly ? 'You’re saving ~R100 a month' : 'Billed R996 a month · go monthly and save ~R100';
    price.innerHTML = monthly ? '<span>R899</span><small>/month*</small>' : '<span>R249</span><small>/week*</small>';
    if (window.gsap) gsap.fromTo(price, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power3.out' });
  }));

  /* ── A6 · cart (localStorage is a convenience; swap for Shopify/Stripe cart later) ── */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('aquarise-cart') || '{}') || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem('aquarise-cart', JSON.stringify(cart)); } catch (e) {} };
  const countEl = $('[data-cart-count]');
  function renderCart() {
    const list = $('[data-cart-items]');
    const ids = Object.keys(cart).filter(id => cart[id] > 0 && item(id));
    let total = 0, count = 0;
    list.innerHTML = ids.length ? '' : '<li class="cart-empty">Your cart is dry. Add something cold.</li>';
    ids.forEach(id => {
      const p = item(id), q = cart[id];
      total += p.price * q; count += q;
      const li = document.createElement('li');
      li.innerHTML = `<div class="bottle" data-liquid="${p.color}" data-level=".2"></div>
        <div><div class="ci-name">${p.name}</div><div class="ci-price">R${p.price} each</div></div>
        <div class="qty"><button type="button" data-qty="${id}" data-d="-1" aria-label="Remove one ${p.name}">−</button><span>${q}</span><button type="button" data-qty="${id}" data-d="1" aria-label="Add one ${p.name}">+</button></div>`;
      list.appendChild(li);
      buildBottle($('.bottle', li));
    });
    countEl.textContent = count;
    $('[data-cart-total]').textContent = `R${total}`;
    const left = Math.max(0, FREE_SHIP - total);
    $('[data-ship-msg]').textContent = left ? `Add R${left} for free delivery` : 'You’ve unlocked free delivery';
    $('[data-ship-bar]').style.width = Math.min(100, total / FREE_SHIP * 100) + '%';
  }
  const toastEl = $('[data-toast]');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function addToCart(id) {
    const p = item(id); if (!p) return;
    cart[id] = (cart[id] || 0) + 1; save(); renderCart();
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    toast(`${p.name} added to cart`);
  }
  // PayFast: the server prices the cart and signs the form (api/checkout.js); we just post it to PayFast.
  async function checkout(btn) {
    if (!Object.keys(cart).length) return toast('Your cart is empty');
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Opening PayFast…';
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cart }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.action) throw new Error(d.error || 'offline');
      const f = document.createElement('form'); f.method = 'POST'; f.action = d.action;
      for (const [k, v] of Object.entries(d.fields)) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); }
      document.body.appendChild(f); f.submit();
    } catch (e) {
      toast(e.message === 'offline' || e.name === 'TypeError' ? 'Checkout is offline right now — WhatsApp or email hello@aquarise.co.za to order' : e.message);
      btn.disabled = false; btn.textContent = label;
    }
  }
  function setCart(open) {
    html.classList.toggle('cart-open', open);
    $('.cart').setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  renderCart();

  /* ── A7 · menu ── */
  const menuBtn = $('[data-menu-toggle]');
  function setMenu(open) {
    html.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('#menu').setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }

  /* ── A8 · delegated clicks: cart, qty, menu, anchors ── */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-add],[data-qty],[data-cart-open],[data-cart-close],[data-menu-toggle],[data-checkout],a[href^="#"]');
    if (!t) return;
    if (t.matches('[data-add]')) return addToCart(t.dataset.add);
    if (t.matches('[data-qty]')) { const id = t.dataset.qty; cart[id] = Math.max(0, (cart[id] || 0) + (+t.dataset.d)); if (!cart[id]) delete cart[id]; save(); return renderCart(); }
    if (t.matches('[data-cart-open]')) return setCart(true);
    if (t.matches('[data-cart-close]')) return setCart(false);
    if (t.matches('[data-menu-toggle]')) return setMenu(!html.classList.contains('menu-open'));
    if (t.matches('[data-checkout]')) return checkout(t);
    const href = t.getAttribute('href');
    if (href.length > 1) {
      const target = $(href); if (!target) return;
      e.preventDefault();
      if (html.classList.contains('menu-open')) setMenu(false);
      // jump straight there: no smooth scroll through the pinned scenes in between (they settle in their end state)
      const dest = href === '#shop' ? $('.slide-name-wrap') : target, off = href === '#shop' ? -($('.nav').offsetHeight + 6) : 0;   // Shop lands on the product itself
      const go = () => { if (lenis) lenis.scrollTo(dest, { immediate: true, force: true, offset: off }); else scrollTo(0, dest.getBoundingClientRect().top + scrollY + off); window.ScrollTrigger && ScrollTrigger.update(); };
      if (window.gsap && !html.classList.contains('static')) gsap.timeline().to('.jump-veil', { autoAlpha: 1, duration: .18 }).add(go).to('.jump-veil', { autoAlpha: 0, duration: .35, delay: .05 });
      else go();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setCart(false); setMenu(false); } });

  /* ── A9 · newsletter (TODO: POST to Mailchimp/Klaviyo/Resend — PROMPTS.md #3) ── */
  const form = $('[data-newsletter]');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const v = form.email.value.trim(), msg = $('.form-msg', form);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.textContent = 'That email doesn’t look right.'; form.email.focus(); return; }
    msg.textContent = 'You’re in. Watch your inbox.'; form.reset();
  });

  /* ── A10 · nav background + year ── */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());

  /* ── A11 · videos: play only while on screen; reduced motion keeps the posters ── */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduce && !!(window.gsap && window.ScrollTrigger);
  const playV = v => { if (v.preload === 'none') v.preload = 'auto'; const pr = v.play(); pr && pr.catch(() => {}); };
  const videos = $$('video[data-video]').filter(v => !v.matches('.spring-video'));   // the waterfall pair is driven by the dive (C3)
  if (!motion) { const sv = $('.spring-video'); reduce ? sv.pause() : playV(sv); }
  if (reduce) videos.forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
  else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? (e.target.dataset.hold || playV(e.target)) : e.target.pause()), { rootMargin: '25% 0px' });
    videos.forEach(v => vio.observe(v));
  }

  /* ── B · STATIC MODE GATE ── */
  if (!motion) {
    html.classList.add('static');
    return;
  }

  /* ── C0 · setup ── */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, smoothWheel: true, syncTouch: false, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(500, 33);   // one heavy frame no longer makes the scrub jump to catch up
  }

  // word splitter for masked rises
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' ');
  });

  /* ── C2 · LOADER → letterbox opens → hero intro ── */
  const heroWords = $$('.hero-title .wi');
  gsap.set(heroWords, { yPercent: 118 });
  gsap.set('.hero-pill', { scale: 0 });
  gsap.set('[data-hero-meta]', { autoAlpha: 0, y: 20 });
  gsap.set('.nav', { autoAlpha: 0, y: -20 });
  gsap.set('.hero-img', { scale: 1.3 });
  gsap.set('.lm-sun', { y: 95 });
  gsap.set('.lm-rays', { scale: .2, autoAlpha: 0, svgOrigin: '374 192' });
  lenis && lenis.stop();
  const counter = { v: 0 }, num = $('.loader-num');
  gsap.timeline({ delay: .2 })
    .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } })
    .fromTo('.loader-water', { yPercent: 100 }, { yPercent: 0, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to('.lm-sun', { y: 0, duration: 1.7, ease: 'power3.out' }, 0)                 // the sun rises over the wave: AQUA·RISE
    .to('.lm-rays', { scale: 1, autoAlpha: 1, duration: .7, ease: 'back.out(2.4)' }, 1.15)
    .to('.loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.15')
    .set('.loader', { display: 'none' })
    .to('.hero-img', { scale: 1, duration: 2.4, ease: 'expo.out' }, '-=.75')
    .to('.lb-top, .lb-bot', { scaleY: 0, duration: 1.4, ease: 'expo.inOut' }, '<.2')
    .to(heroWords, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .07 }, '<.25')
    .to('.hero-pill', { scale: 1, duration: .9, ease: 'back.out(2)' }, '<.45')
    .to('.nav', { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out' }, '<')
    .to('[data-hero-meta]', { autoAlpha: 1, y: 0, duration: .9, stagger: .1, ease: 'expo.out' }, '<.1')
    .add(() => { lenis && lenis.start(); });

  /* ── C3 · HERO pinned scroll: title parts, image pushes in, the offer rises ── */
  // Then the camera dives into the bottle and a portal opens onto SPRING's first frame. SPRING is pulled up under
  // the hero (negative margin) and stays invisible until the hero lets go, so the hand-off has no scroll at all.
  const hero = $('.hero'), spring = $('.spring');
  const tuckSpring = () => { spring.style.marginTop = -hero.offsetHeight + 'px'; };
  tuckSpring();
  ScrollTrigger.addEventListener('refreshInit', tuckSpring);
  gsap.set(spring, { autoAlpha: 0 });
  // The dive is a fisheye lens: a soft-edged circle opens from the bottle's centre while the SPRING frame inside
  // it starts magnified and settles (scale .55 → 1) and the outside dims, like light bending through the bottle.
  // The circle (.lens, static mask) grows with transform; the picture inside (.lens-in) is counter-scaled around the same
  // centre so it stays put. Both are composited and written at full precision, so k × 1/k is exactly 1 on screen:
  // GSAP rounds scale to 4 decimals, which at k ≈ .04 left a ~1px wobble. No clip-path (that repainted every frame).
  const lens = $('.hero-portal'), lensEl = $('.lens'), lensIn = $('.lens-in'), lensC = { p: 0 };
  // Once the circle's solid part (78% of its radius) covers the farthest screen corner, the circle is swapped for a plain
  // full-screen box (.lens-open: no mask, no scale): the picture lands on the same pixels and the huge masked layer is gone.
  let lensOpen = false;
  const lensDraw = () => {
    const k = Math.max(lensC.p, .04), vmax = Math.max(innerWidth, innerHeight);
    const open = k * 1.1 * vmax * .78 >= Math.hypot(innerWidth / 2, innerHeight * .54) + 2;
    if (open !== lensOpen) { lensOpen = open; lens.classList.toggle('lens-open', open); }
    if (open) { lensEl.style.transform = lensIn.style.transform = ''; return; }
    lensEl.style.transform = `scale(${k})`; lensIn.style.transform = `scale(${1 / k})`;
  };
  // One continuous zoom from the lens into SPRING: both are driven in log space so the zoom *rate* leaving the lens equals the
  // rate entering SPRING (ZOOM_RATE per unit of each timeline's zoom phase), then SPRING accelerates through the I.
  const ZOOM_FROM = Math.log(.55), ZOOM_RATE = -ZOOM_FROM, lensZoom = { z: ZOOM_FROM };
  // SPRING is revealed by the hero timeline's progress. Both pinned timelines use scrub: true (Lenis already smooths the
  // scroll), so that progress is exactly the pin position: no scrub lag can leave the lens on screen after the hero unpins
  // (that made SPRING drop ~100px at the hand-off), and the two zooms meet at the same frame.
  const zoomEls = $$('.hero-portal .spring-word, .hero-portal-frame, .lens-vig');
  zoomEls.forEach(e => { e.style.transform = `scale(${Math.exp(ZOOM_FROM)})`; });
  let heroP = 0, diving = false;
  const showSpring = tl => {
    heroP = tl.progress(); gsap.set(spring, { autoAlpha: heroP > .999 ? 1 : 0 }); syncFalls();
    if (diving !== heroP > .42) { diving = !diving; hero.classList.toggle('is-diving', diving); }   // ripple blend layer off during the dive
  };
  const heroLayers = on => gsap.set('.hero-media, .lens, .lens-in, .hero-portal-frame, .lens-vig', { willChange: on ? 'transform' : 'auto' });
  gsap.timeline({ onUpdate() { showSpring(this); }, scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + innerHeight * 2.4, pin: true, scrub: true, invalidateOnRefresh: true, fastScrollEnd: true, onToggle: st => heroLayers(st.isActive),
      onRefresh: lensDraw } })
    .to('.hl-1', { yPercent: -70, autoAlpha: 0, ease: 'none', duration: .26 }, 0)
    .to('.hl-2', { yPercent: -40, autoAlpha: 0, ease: 'none', duration: .26 }, .04)
    .fromTo('[data-hero-meta]', { autoAlpha: 1 }, { autoAlpha: 0, duration: .1, immediateRender: false }, 0)
    .to('.hero-media', { scale: 1.2, yPercent: -6, ease: 'none', duration: .42 }, 0)
    .fromTo('.hero-offer', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .1, ease: 'power2.out' }, .08)   // offer rises as the title lifts
    .fromTo('.hero-offer-btn', { scale: .8 }, { scale: 1, duration: .08, ease: 'back.out(2)' }, .11)
    .to('.hero-offer', { y: -40, autoAlpha: 0, duration: .08, ease: 'power1.in' }, .4)                               // ...holds, then the dive
    // start states live in the timeline so scrubbing back always restores them
    .set('.hero-dim', { autoAlpha: 0 }, 0)
    .set(lens, { autoAlpha: 0 }, 0)
    .set(lensC, { p: 0 }, 0)
    .set('.hero-portal .spring-word, .hero-portal-frame, .lens-vig', { autoAlpha: .55 }, 0)
    .add(lensDraw, 0)
    .set(lensZoom, { z: ZOOM_FROM }, 0)
    .add(() => { const t = `scale(${Math.exp(lensZoom.z)})`; zoomEls.forEach(e => { e.style.transform = t; }); }, 0)
    .to('.hero-media', { scale: 1.5, yPercent: -3, ease: 'sine.inOut', duration: .5 }, .42)                        // gentle push into the bottle
    .to('.hero-dim', { autoAlpha: .9, ease: 'sine.inOut', duration: .4 }, .46)                                      // the light drains
    .set(lens, { autoAlpha: .001 }, .42)   // on screen but invisible: the portal clip is already playing when the lens opens
    .set(lens, { autoAlpha: 1 }, .52)
    .to(lensC, { p: 1, ease: 'power2.inOut', duration: .44, onUpdate: lensDraw }, .52)                                          // the lens opens small → full
    .to('.hero-portal .spring-word, .hero-portal-frame, .lens-vig', { autoAlpha: 1, ease: 'power1.out', duration: .3 }, .52)   // opacity, not blur: blur on a full-screen layer drops frames
    .to(lensZoom, { z: 0, ease: 'none', duration: .48, onUpdate: () => { const t = `scale(${Math.exp(lensZoom.z)})`; zoomEls.forEach(e => { e.style.transform = t; }); } }, .52)   // constant-rate push forward into the hand-off
    .fromTo('.lens-vig', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', duration: .2, immediateRender: false }, .8)   // edges brighten gradually to match SPRING
    .to({}, { duration: .01 });   // no hold: SPRING's own zoom takes over at the same moment
  // Video budget: one clip decoding at a time through the dive.
  //   hero clip  plays until .50 (behind a ~90% dim by then), resumes below .46
  //   portal     plays .42 → .999 (the lens is open .52 → 1)
  //   SPRING     plays from .999 (the frame it becomes visible); the portal pauses in the same call
  // Both waterfalls are synced to 0 once while both are hidden (.30–.40). Near the hand-off the hidden one is kept
  // paused a moment ahead of the visible one (a seek on a hidden clip is harmless), so swapping shows the same frame.
  // play() is never re-issued while pending, and nothing seeks a clip that is on screen.
  const pv = $('.hero-portal-frame'), vid = $('.spring-video'), heroVid = $('.hero-img');
  const want = (v, on) => {
    if (on) {
      if (!v.paused || v._pending) return;
      v._pending = true; const pr = v.play();
      pr ? pr.then(() => { v._pending = false; }, () => { v._pending = false; }) : (v._pending = false);
    } else if (!v.paused || v._pending) v.pause();
  };
  let springOn = true, synced = false, heroHeld = false, springP = 0, lastSeek = 0;
  const shadow = (hidden, src) => {   // park the hidden clip just ahead of the visible one
    const now = performance.now(), d = src.duration;
    if (!d || hidden.seeking || now - lastSeek < 250 || Math.abs(hidden.currentTime - src.currentTime) < .25) return;
    lastSeek = now; hidden.currentTime = (src.currentTime + .15) % d;
  };
  function syncFalls() {   // hoisted: the hero timeline can call it on creation
    const p = heroP;
    if (!heroHeld && p > .5) { heroHeld = true; heroVid.dataset.hold = 1; want(heroVid, false); }
    else if (heroHeld && p < .46) { heroHeld = false; delete heroVid.dataset.hold; reduce || want(heroVid, true); }
    if (p < .3) synced = false;
    else if (!synced && p < .4) { synced = true; want(pv, false); want(vid, false); pv.currentTime = vid.currentTime = 0; }
    want(pv, springOn && p >= .42 && p < .999);
    want(vid, springOn && p >= .999);
  }
  gsap.ticker.add(() => {
    if (!springOn) return;
    if (heroP > .9 && heroP < .999) shadow(vid, pv);          // SPRING still hidden: keep it on the portal's frame
    else if (heroP >= .999 && springP < .15) shadow(pv, vid); // the hero is under SPRING: keep the portal ready for a scroll back
  });
  ScrollTrigger.create({ trigger: '.spring', start: 'top bottom', end: 'bottom top', onToggle: st => { springOn = st.isActive; syncFalls(); } });

  // pointer ripples on the hero water
  (() => {
    const cv = $('.hero-ripples'), ctx = cv.getContext('2d'), hero = $('.hero');
    let w = 0, h = 0, active = true, last = 0, auto = 0, moved = -1e9, shown = true;
    const rings = [];
    const size = () => { const d = Math.min(devicePixelRatio || 1, 1.5); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    hero.addEventListener('pointermove', e => {
      const now = performance.now(); moved = now; if (now - last < 70) return; last = now;
      const r = cv.getBoundingClientRect(); rings.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 3, a: .5 });
    });
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; } });
    gsap.ticker.add(() => {
      if (!active || heroP > .3) rings.length = 0;   // nothing to see once the scroll is under way
      // idle drops only while the hero sits at rest (or the pointer moved in the last 1.5s)
      else if ((heroP < .02 || performance.now() - moved < 1500) && ++auto % 50 === 0) rings.push({ x: rand(.15, .85) * w, y: rand(.72, .95) * h, r: 2, a: .35 });
      // an empty canvas is hidden, so its screen-blend layer costs nothing over the playing video
      if (shown !== !!rings.length) { shown = !shown; cv.style.visibility = shown ? '' : 'hidden'; if (!shown) ctx.clearRect(0, 0, w, h); }
      if (!rings.length) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i]; g.r += 1.5; g.a *= .972;
        if (g.a < .02) { rings.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,255,255,${g.a})`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * .36, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${g.a * .5})`;
        ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r * .6, g.r * .6 * .36, 0, 0, Math.PI * 2); ctx.stroke();
      }
    });
  })();

  /* ── C4 · generic reveals: masked word rise + fade-ups (skip the hero title) ── */
  $$('[data-split]').forEach(el => {
    if (el.closest('.hero, .feature')) return;   // these two run their own choreography
    gsap.fromTo($$('.wi', el), { yPercent: 118 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-fade]').forEach(el => {
    gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ── C5 · SPRING pinned: the waterfall plays inside the word, then the camera flies through the I ── */
  const sWord = $('.spring-stage .spring-word'), sI = $('.spring-i'), sMask = $('.spring-stage .spring-mask'), springZoom = { p: 0 };
  // Zoom origin = centre of the I's stem, in the word's own (unscaled) box. Measured from on-screen rects divided by the
  // current scale, so it is right at any scroll position (offsetLeft was relative to the wrong parent and missed the I).
  const springOrigin = () => {
    const sc = +gsap.getProperty(sWord, 'scale') || 1, rw = sWord.getBoundingClientRect(), ri = sI.getBoundingClientRect();
    sWord.style.transformOrigin = `${(ri.left + ri.width / 2 - rw.left) / sc}px ${(rw.height / 2) / sc}px`;
  };
  springOrigin();
  ScrollTrigger.addEventListener('refreshInit', springOrigin);
  // picks up the lens' zoom rate, then accelerates to 48×
  const springScale = p => Math.exp(ZOOM_RATE * p + (Math.log(48) - ZOOM_RATE) * p ** 3);
  let pHide = 0, pHi = 1;   // progress where the scale passes 10× (bisection; the curve only rises)
  for (let i = 0; i < 30; i++) { const m = (pHide + pHi) / 2; springScale(m) < 10 ? pHide = m : pHi = m; }
  const wordLayer = on => { sWord.style.willChange = on ? 'transform' : 'auto'; };
  wordLayer(true);   // the page starts above SPRING, which zooms right after the hero
  gsap.timeline({ scrollTrigger: { trigger: '.spring-stage', start: 'top top', end: () => '+=' + innerHeight * 1.8, pin: true, scrub: true, invalidateOnRefresh: true, fastScrollEnd: true,
      onToggle: st => wordLayer(st.isActive || st.progress === 0) } })
    .fromTo(springZoom, { p: 0 }, { p: 1, ease: 'none', duration: 1.04, onUpdate: () => { springP = springZoom.p; gsap.set(sWord, { scale: Math.min(springScale(springZoom.p), springScale(Math.min(1, pHide + .08))) }); } }, 0)
    // the word is never drawn past ~10×: from there the mask fades out over .08 while the waterfall itself carries the push
    .fromTo(sMask, { opacity: 1 }, { opacity: 0, ease: 'none', duration: .08, immediateRender: false }, pHide * 1.04)
    .fromTo('.spring-video', { scale: 1 }, { scale: 1.12, ease: 'none', duration: 1.04 - pHide * 1.04, immediateRender: false }, pHide * 1.04)
    .fromTo('.spring-stage .spring-glow', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'power2.in', duration: 1 }, 0)
    .set('.spring-stage .spring-mask', { autoAlpha: 1 }, 0)                         // pinned in the timeline so rewinding always restores it
    .fromTo(sMask, { visibility: 'inherit' }, { visibility: 'hidden', duration: .001, immediateRender: false }, 1.04)   // already transparent: just drop it from rendering
    .fromTo('.spring-copy > *', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .32, stagger: .07, ease: 'power2.out' }, 1.06)
    .to({}, { duration: .05 });   // barely any hold: the feature follows straight on

  /* ── C6 · FEATURE: the copy writes itself in as you scroll, the clip opens up beside it ── */
  const lead = $('.feature-lead');
  lead.innerHTML = lead.textContent.trim().split(/\s+/).map(w => `<span class="lw">${esc(w)}</span>`).join(' ');
  // Picture first, then each headline word, the paragraph word by word, then the pills one at a time. Desktop pins the
  // section for ~4 screens so it plays in place; phones (section taller than the screen) scroll it through, same order.
  // One timeline unit = one beat: 1 picture, 2 PURE, 3 CRISP, 4 ALIVE, 5 paragraph + pills (~.63 screen each on desktop).
  // Each beat fills ~85% of its slot, so there is always something moving under the scroll.
  const featureSeq = st => gsap.timeline({ scrollTrigger: st })
    .fromTo('.feature-visual', { scale: .68 }, { scale: 1, ease: 'power1.inOut', duration: .85 }, 0)
    .fromTo('.feature-video', { scale: 1.45 }, { scale: 1, ease: 'power1.inOut', duration: .85 }, 0)
    .fromTo('.feature .h-xl .wi', { yPercent: 120 }, { yPercent: 0, ease: 'power2.out', duration: .85, stagger: 1 }, 1)
    .fromTo('.feature .lw', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, ease: 'power1.out', duration: .15, stagger: .02 }, 4)
    .fromTo('.pills li', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, ease: 'power3.out', duration: .25, stagger: .1 }, 4.4)
    .fromTo('.pills li svg', { rotate: -90, scale: .4 }, { rotate: 0, scale: 1, ease: 'power3.out', duration: .25, stagger: .1 }, 4.45)
    .to({}, { duration: .05 });
  gsap.matchMedia()
    .add('(min-width: 961px) and (min-height: 600px)', () => { featureSeq({ trigger: '.feature', start: 'top top', end: () => '+=' + innerHeight * 3.2, pin: true, scrub: true, invalidateOnRefresh: true, fastScrollEnd: true }); })
    .add('(max-width: 960px), (max-height: 599px)', () => { featureSeq({ trigger: '.feature', start: 'top 85%', end: 'bottom 45%', scrub: true, invalidateOnRefresh: true }); });
  // ALIVE. keeps a slow shimmer once it has landed
  $$('.feature .h-xl .wi').forEach((w, i) => w.classList.add('shimmer-word', 'sw-' + i));   // PURE aqua, CRISP ice-white, ALIVE lemon, one after another

  $$('[data-speed]').forEach(el => {
    const s = parseFloat(el.dataset.speed) || 0;
    gsap.fromTo(el, { y: () => s * 180 }, { y: () => -s * 180, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });

  /* ── C8 · SHOP: arch straightens; the bottle glides on a sunlit stage ── */
  gsap.fromTo('#archPath', { attr: { d: 'M 80 230 Q 500 -10 920 230' } }, { attr: { d: 'M 40 205 Q 500 205 960 205' }, ease: 'none', scrollTrigger: { trigger: '.arch', start: 'top 90%', end: 'top 30%', scrub: true } });
  const stage = $('.slide-stage');
  gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 75%', once: true } })
    .fromTo('.stage-glow, .stage-mist', { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: 1.6, ease: 'expo.out' })
    .fromTo(sl.els[0], { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out' }, .1);
  let sliding = null;
  animateSlide = (prev, next, dir) => {
    if (sliding) sliding.progress(1);
    next.hidden = false;
    sliding = gsap.timeline({ onComplete: () => { prev.hidden = true; gsap.set(prev, { clearProps: 'all' }); sliding = null; } })
      .to(prev, { xPercent: -dir * 70, autoAlpha: 0, rotate: -dir * 5, duration: .55, ease: 'power2.in' }, 0)
      .fromTo(next, { xPercent: dir * 70, autoAlpha: 0, rotate: dir * 5 }, { xPercent: 0, autoAlpha: 1, rotate: 0, duration: 1, ease: 'expo.out' }, .3)
      .fromTo('.stage-glow', { autoAlpha: .55 }, { autoAlpha: 1, duration: .9, ease: 'power2.out' }, .3)
      .fromTo('[data-slide-name]', { yPercent: 105 }, { yPercent: 0, duration: .9, ease: 'expo.out' }, .2)
      .fromTo('[data-slide-desc], .slide-buy', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .06 }, .3);
  };

  // Range navigation: auto-advances every 5s while on screen; a trackpad side-swipe (horizontal wheel) or a finger swipe
  // changes product; any interaction restarts the 5s countdown so it never moves right after you did.
  (() => {
    const shop = $('.slider'), stage = $('.slide-stage'); let onScreen = false, timer = null;
    const tick = () => { if (onScreen && !document.hidden && !html.classList.contains('cart-open')) showSlide(sl.i + 1, 1); };
    const restart = () => { clearInterval(timer); timer = setInterval(tick, 5000); };
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting && e.intersectionRatio > .5; restart(); }, { threshold: [0, .5, 1] }).observe(stage);
    shop.addEventListener('click', e => { if (e.target.closest('button')) restart(); });
    // trackpad: two-finger swipe left = next, right = previous (one product per gesture)
    let acc = 0, locked = false, lockT;
    shop.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // vertical scrolling is left to the page
      e.preventDefault();                                      // stops the browser's back/forward swipe here
      if (locked) { clearTimeout(lockT); lockT = setTimeout(() => { locked = false; acc = 0; }, 180); return; }
      acc += e.deltaX;
      if (Math.abs(acc) > 40) {
        const d = acc > 0 ? 1 : -1; showSlide(sl.i + d, d); restart();
        locked = true; acc = 0; clearTimeout(lockT); lockT = setTimeout(() => { locked = false; }, 450);
      }
    }, { passive: false });
    // touch: horizontal swipe on the stage
    let x0 = null, y0 = 0;
    stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { const d = dx < 0 ? 1 : -1; showSlide(sl.i + d, d); restart(); }
    }, { passive: true });
    restart();
  })();

  /* ── C9 · BUNDLES: cards fill with water, bottles drop in, prices count up; tilt, glare and perk chips on hover ── */
  ScrollTrigger.create({ trigger: '.shop', start: 'top bottom', once: true, onEnter: () => $$('.bundle img').forEach(i => i.decode && i.decode().catch(() => {})) });
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('[data-reveal-wave]').forEach((card, ci) => {
    const cover = document.createElement('i'); cover.className = 'reveal-cover'; card.appendChild(cover);
    const kids = [...card.children].filter(c => !c.matches('.bundle-glare, .reveal-cover'));
    const count = $('[data-count]', card);
    const tl = gsap.timeline({ delay: ci * .12, scrollTrigger: { trigger: card, start: 'top 80%', once: true } })   // cards side by side don't all start on one frame
      .fromTo(cover, { yPercent: 0 }, { yPercent: -105, duration: 1.6, ease: 'power2.out' })
      .fromTo(kids, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .08 }, .35);
    const trio = $$('.bundle-bottles .bottle', card), freq = $('.freq', card);
    if (trio.length) tl.fromTo(trio, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', stagger: .1 }, .5);   // calm rise, no bounce
    if (freq) tl.fromTo(freq, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out' }, .7);
    if (count) {   // price counts up from zero
      const n = { v: 0 }, end = +count.dataset.count; let shownV = -1;
      tl.to(n, { v: end, duration: 1.4, ease: 'power3.out', onUpdate: () => { const v = Math.round(n.v); if (v !== shownV && count.isConnected) { shownV = v; count.textContent = 'R' + v; } } }, .7);
    }
  });
  if (canHover) $$('[data-tilt]').forEach(card => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
    gsap.set(card, { transformPerspective: 1000 });
    let r = null;
    card.addEventListener('pointerenter', () => { r = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', e => {
      if (!r) r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      rx((.5 - y) * 4); ry((x - .5) * 5);   // subtle depth, not a wobble
      card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); r = null; });
    // magnetic button
    const btn = $('.pill', card), bx = gsap.quickTo(btn, 'x', { duration: .4, ease: 'power3' }), by = gsap.quickTo(btn, 'y', { duration: .4, ease: 'power3' });
    let br = null; btn.addEventListener('pointerenter', () => { br = btn.getBoundingClientRect(); });
    btn.addEventListener('pointermove', e => { const r = br || (br = btn.getBoundingClientRect()); bx((e.clientX - r.left - r.width / 2) * .3); by((e.clientY - r.top - r.height / 2) * .4); });
    btn.addEventListener('pointerleave', () => { bx(0); by(0); br = null; });
  });
  // adding a bundle: the bottles jump and a "+1" floats up from the button
  $$('.bundle [data-add]').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.bundle');
    const trio = $$('.bundle-bottles .bottle', card);
    if (trio.length) gsap.fromTo(trio, { y: 0 }, { y: -8, duration: .35, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: .05 });
    const tag = document.createElement('span'); tag.className = 'plus-one'; tag.textContent = '+1 in your cart';
    btn.after(tag);
    gsap.fromTo(tag, { y: 0, autoAlpha: 0 }, { y: -50, autoAlpha: 1, duration: .6, ease: 'power3.out' });
    gsap.to(tag, { autoAlpha: 0, y: -100, duration: .5, delay: 1, onComplete: () => tag.remove() });
  }));

  /* ── C12 · FOOTER: wordmark rises out of the water ── */
  gsap.fromTo('.foot-mark', { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot-mark-wrap', start: 'top bottom', end: 'bottom bottom', scrub: true,
    onToggle: st => { $('.foot-mark').style.willChange = st.isActive ? 'transform' : 'auto'; } } });   // no lag: at the very bottom of the page the word is fully up

  /* ── C12b · switch blend/blur layers off in sections more than a screen away ── */
  const perfIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('perf-off', !e.isIntersecting)), { rootMargin: '25% 0px' });
  ['.hero', '.spring', '.feature', '.promise', '.shop', '.bundles', '.join', '.footer'].forEach(sel => { const el = $(sel); el && perfIO.observe(el); });

  /* ── C13 · ordering + refresh ── */
  ScrollTrigger.sort();
  // one refresh, once fonts and media sizes are final (the loader holds the scroll until then); a reload starts at the hero
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }));
  Promise.all([document.fonts ? document.fonts.ready : 0, loaded]).then(() => {
    scrollTo(0, 0); lenis && lenis.scrollTo(0, { immediate: true }); ScrollTrigger.refresh();
    $$('.bottle img').forEach(i => i.decode && i.decode().catch(() => {}));   // decode the packshots now, not when the shop scrolls in
  });
})();
