/* ==========================================================================
   AQUARISE — main.js
   Part A: basics that work in every mode (cart, slider, menu, forms, bottles)
   Part B: early return into .static if reduced motion / GSAP missing
   Part C: motion blocks in DOM order (loader → hero → tides → feature →
           scenes → shop → bundles → compare → source → footer)
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
    { id: 'mineral-750',   name: 'Mineral+ 750ml',  price: 32, color: '#1C8FC4', level: .18, label: '#E8F6FB', desc: 'Higher natural mineral content for after the set. [Confirm spec]' },
    { id: 'glass-750',     name: 'Glass 750ml',     price: 45, color: '#9BE1FF', level: .2,  label: '#0E5A8A', desc: 'The dinner-table edition in returnable glass. [Confirm]' }
  ];
  const EXTRAS = {
    'ritual-24':   { name: 'Daily Ritual · 24 × 500ml', price: 289, color: '#9BE1FF' },
    'sub-weekly':  { name: 'Never Run Dry · weekly',    price: 249, color: '#1C8FC4' },
    'sub-monthly': { name: 'Never Run Dry · monthly',   price: 899, color: '#1C8FC4' }
  };
  const FREE_SHIP = 350;
  const item = id => PRODUCTS.find(p => p.id === id) || EXTRAS[id];
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ── A2 · SVG bottle builder (original illustration; swap for packshots later) ── */
  const BODY = 'M46 48 V58 C46 74 14 82 14 112 V368 Q14 392 38 392 H82 Q106 392 106 368 V112 C106 82 74 74 74 58 V48 Z';
  let bid = 0;
  const bottles = [];
  function buildBottle(el) {
    if (el.dataset.built) return;
    el.dataset.built = '1';
    const id = 'aqb' + (++bid);
    const color = el.dataset.liquid || '#3FB8E8';
    const labelColor = el.dataset.labelColor || '#0E5A8A';
    const label = el.dataset.label || 'Aquarise';
    el.innerHTML = `<svg viewBox="0 0 120 400" aria-hidden="true">
      <defs>
        <clipPath id="${id}c"><path d="${BODY}"/></clipPath>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".55"/><stop offset="1" stop-color="${color}" stop-opacity=".95"/></linearGradient>
        <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset=".2" stop-color="#fff" stop-opacity=".38"/><stop offset=".36" stop-color="#fff" stop-opacity=".03"/><stop offset=".86" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
      </defs>
      <path d="${BODY}" fill="rgba(255,255,255,.07)"/>
      <g clip-path="url(#${id}c)"><g class="b-liquid"><path class="b-wave" fill="url(#${id}g)"/></g></g>
      <path d="${BODY}" fill="url(#${id}s)" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/>
      <path d="M20 342 H100 M20 354 H100" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>
      <text class="b-label" x="60" y="244" text-anchor="middle" transform="rotate(-90 60 244)" fill="${labelColor}">${label}</text>
      <rect x="40" y="6" width="40" height="42" rx="6" fill="#E9EEF2"/>
      <path d="M45 13V44M51 13V44M57 13V44M63 13V44M69 13V44M75 13V44" stroke="#B5C1CB" stroke-width="1.3"/>
    </svg>`;
    const b = {
      el, wave: $('.b-wave', el), liquid: $('.b-liquid', el),
      surface: 62 + (parseFloat(el.dataset.level) || .2) * 300,
      seed: Math.random() * 10, rot: 0, visible: true
    };
    bottles.push(b);
    renderBottle(b, 0);
    return b;
  }
  function renderBottle(b, t) {
    const s = b.surface, k = t + b.seed;
    let d = 'M-140 560 L-140 ' + s.toFixed(1);
    for (let x = -140; x <= 260; x += 10) {
      const y = s + 3.2 * Math.sin(x * .06 + k * 2.2) + 1.8 * Math.sin(x * .11 - k * 1.6);
      d += ` L${x} ${y.toFixed(1)}`;
    }
    b.wave.setAttribute('d', d + ' L260 560 Z');
    b.liquid.setAttribute('transform', `rotate(${(-b.rot).toFixed(2)} 60 250)`);
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
    slider.style.setProperty('--c', p.accent || (p.color === '#1C8FC4' ? '#3FB8E8' : p.color));
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
    price.innerHTML = monthly ? 'R899<small>/month*</small>' : 'R249<small>/week*</small>';
  }));

  /* ── A6 · cart (localStorage is a convenience; swap for Shopify/Stripe cart later) ── */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('aquarise-cart') || '{}') || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem('aquarise-cart', JSON.stringify(cart)); } catch (e) {} };
  const countEl = $('[data-cart-count]');
  function renderCart() {
    for (let i = bottles.length - 1; i >= 0; i--) if (!bottles[i].el.isConnected) bottles.splice(i, 1);
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
    if (t.matches('[data-checkout]')) return toast('Checkout not connected yet — see PROMPTS.md #3');
    const href = t.getAttribute('href');
    if (href.length > 1) {
      const target = $(href); if (!target) return;
      e.preventDefault();
      if (html.classList.contains('menu-open')) setMenu(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.6 }); else target.scrollIntoView({ behavior: 'smooth' });
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

  /* ── B · STATIC MODE GATE ── */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    html.classList.add('static');
    return;
  }

  /* ── C0 · setup ── */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // word splitter for masked rises
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' ');
  });

  /* ── C1 · WAVE CLIP primitive: a wobbling water edge that floods an element from a side ── */
  const waves = [];
  function makeWave(el, dir, o = {}) {
    const w = { el, dir, p: 0, amp: o.amp ?? 6, freq: o.freq ?? 1.2, state: null };
    waves.push(w); drawWave(w, 0); return w;
  }
  function wavePoly(dir, p, t, amp, freq) {
    const A = amp * (.35 + .65 * Math.sin(Math.PI * Math.min(Math.max(p, 0), 1)));
    const base = p * (100 + amp * 2) - amp;
    const wob = u => A * (.62 * Math.sin((u * freq + t * .32) * Math.PI * 2) + .38 * Math.sin((u * freq * 1.9 - t * .47) * Math.PI * 2 + 1.3));
    const n = 32, pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, e = wob(u);
      if (dir === 'bottom') pts.push(`${(u * 100).toFixed(2)}% ${(100 - base + e).toFixed(2)}%`);
      else if (dir === 'top') pts.push(`${(u * 100).toFixed(2)}% ${(base + e).toFixed(2)}%`);
      else if (dir === 'left') pts.push(`${(base + e).toFixed(2)}% ${(u * 100).toFixed(2)}%`);
      else pts.push(`${(100 - base + e).toFixed(2)}% ${(u * 100).toFixed(2)}%`);
    }
    const caps = { bottom: ['0% 100%', '100% 100%'], top: ['0% 0%', '100% 0%'], left: ['0% 0%', '0% 100%'], right: ['100% 0%', '100% 100%'] }[dir];
    return `polygon(${caps[0]}, ${pts.join(', ')}, ${caps[1]})`;
  }
  function drawWave(w, t) {
    if (w.p <= 0) { if (w.state !== 0) { w.el.style.clipPath = wavePoly(w.dir, 0, 0, w.amp, w.freq); w.state = 0; } return; }
    if (w.p >= 1) { if (w.state !== 1) { w.el.style.clipPath = 'none'; w.state = 1; } return; }
    w.state = 'm'; w.el.style.clipPath = wavePoly(w.dir, w.p, t, w.amp, w.freq);
  }

  // one ticker for every water surface + bottle liquid
  const io = new IntersectionObserver(es => es.forEach(e => { const b = bottles.find(x => x.el === e.target); if (b) b.visible = e.isIntersecting; }));
  const watch = b => io.observe(b.el);
  bottles.forEach(watch);
  const _push = bottles.push.bind(bottles);
  bottles.push = b => { _push(b); watch(b); return bottles.length; };
  gsap.ticker.add(time => {
    for (const w of waves) drawWave(w, time);
    for (const b of bottles) if (b.visible && b.el.isConnected) renderBottle(b, time);
  });

  /* ── C2 · LOADER → letterbox opens → hero intro ── */
  const loaderWave = makeWave($('.loader-water'), 'bottom', { amp: 5 });
  const heroWords = $$('.hero-title .wi');
  gsap.set(heroWords, { yPercent: 118 });
  gsap.set('.hero-pill', { scale: 0 });
  gsap.set('[data-hero-meta]', { autoAlpha: 0, y: 20 });
  gsap.set('.nav', { autoAlpha: 0, y: -20 });
  gsap.set('.hero-img', { scale: 1.3 });
  lenis && lenis.stop();
  const counter = { v: 0 }, num = $('.loader-num');
  gsap.timeline({ delay: .2 })
    .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } })
    .to(loaderWave, { p: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to('.loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.15')
    .set('.loader', { display: 'none' })
    .to('.hero-img', { scale: 1, duration: 2.4, ease: 'expo.out' }, '-=.75')
    .to('.lb-top, .lb-bot', { scaleY: 0, duration: 1.4, ease: 'expo.inOut' }, '<.2')
    .to(heroWords, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .07 }, '<.25')
    .to('.hero-pill', { scale: 1, duration: .9, ease: 'back.out(2)' }, '<.45')
    .to('.nav', { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out' }, '<')
    .to('[data-hero-meta]', { autoAlpha: 1, y: 0, duration: .9, stagger: .1, ease: 'expo.out' }, '<.1')
    .add(() => { lenis && lenis.start(); });

  /* ── C3 · HERO pinned scroll: title parts, image pushes in, water floods up ── */
  const heroFlood = makeWave($('.hero-flood'), 'bottom', { amp: 7 });
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=130%', pin: true, scrub: 1, invalidateOnRefresh: true } })
    .to('.hl-1', { yPercent: -70, autoAlpha: 0, ease: 'none', duration: .45 }, 0)
    .to('.hl-2', { yPercent: -40, autoAlpha: 0, ease: 'none', duration: .45 }, .06)
    .fromTo('[data-hero-meta]', { autoAlpha: 1 }, { autoAlpha: 0, duration: .2, immediateRender: false }, 0)
    .to('.hero-media', { scale: 1.2, yPercent: -6, ease: 'none', duration: 1 }, 0)
    .to(heroFlood, { p: 1, ease: 'power1.in', duration: .62 }, .38)
    .fromTo('.hero-flood-line', { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .3, ease: 'power2.out' }, .7);

  // pointer ripples on the hero water
  (() => {
    const cv = $('.hero-ripples'), ctx = cv.getContext('2d'), hero = $('.hero');
    let w = 0, h = 0, active = true, last = 0, auto = 0;
    const rings = [];
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    hero.addEventListener('pointermove', e => {
      const now = performance.now(); if (now - last < 70) return; last = now;
      const r = cv.getBoundingClientRect(); rings.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 3, a: .5 });
    });
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; } });
    gsap.ticker.add(() => {
      if (!active) return;
      if (++auto % 50 === 0) rings.push({ x: rand(.15, .85) * w, y: rand(.72, .95) * h, r: 2, a: .35 });
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
    if (el.closest('.hero')) return;
    gsap.fromTo($$('.wi', el), { yPercent: 118 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-fade]').forEach(el => {
    gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ── C5 · TIDES pinned: four floods from left, right, top, bottom ── */
  const tideWaves = $$('.tide').map(el => makeWave(el, el.dataset.wave, { amp: 7 }));
  const tt = gsap.timeline({ scrollTrigger: { trigger: '.tides', start: 'top top', end: () => '+=' + innerHeight * 3.4, pin: true, scrub: 1, invalidateOnRefresh: true } });
  tt.fromTo('.tides-intro', { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: .9, duration: .5 }, .1);
  tideWaves.forEach((w, i) => {
    const at = .25 + i, el = w.el;
    tt.to(w, { p: 1, duration: .85, ease: 'power1.inOut' }, at)
      .fromTo($('.tide-word', el), { yPercent: 35, scale: 1.18 }, { yPercent: 0, scale: 1, duration: .95, ease: 'power2.out' }, at)
      .fromTo($$('.tide-no, .tide-copy p', el), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .4, stagger: .1 }, at + .4);
    if (i > 0) tt.to($('.tide-copy', tideWaves[i - 1].el), { scale: .88, autoAlpha: .25, duration: .8 }, at);
  });
  tt.to({}, { duration: .35 });
  tt.fromTo('.tides-progress i', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: tt.duration() }, 0);

  /* ── C6 · FEATURE: tilting bottle whose water stays level, stickers pop, parallax ── */
  const fb = bottles.find(b => b.el.classList.contains('feature-bottle'));
  gsap.fromTo('.feature-bottle', { rotate: -20, y: 70 }, {
    rotate: 16, y: -70, ease: 'none',
    scrollTrigger: { trigger: '.feature', start: 'top bottom', end: 'bottom top', scrub: 1 },
    onUpdate() { if (fb) fb.rot = gsap.getProperty('.feature-bottle', 'rotation'); }
  });
  gsap.fromTo('.sticker', { scale: 0 }, { scale: 1, duration: .9, ease: 'back.out(2.2)', stagger: .12, scrollTrigger: { trigger: '.feature-visual', start: 'top 70%', once: true } });
  $$('[data-speed]').forEach(el => {
    const s = parseFloat(el.dataset.speed) || 0;
    gsap.fromTo(el, { y: () => s * 180 }, { y: () => -s * 180, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });

  /* ── C7 · SCENES pinned film: each scene washes in from a new direction ── */
  const scenes = $$('.scene'), dots = $$('.scene-dots i');
  const sceneWaves = scenes.map((s, i) => i ? makeWave(s, s.dataset.dir, { amp: 8, freq: 1 }) : null);
  dots[0] && dots[0].classList.add('on');
  const stl = gsap.timeline({ scrollTrigger: {
    trigger: '.scenes', start: 'top top', end: () => '+=' + innerHeight * scenes.length, pin: true, scrub: 1, invalidateOnRefresh: true,
    onUpdate() { let a = 0; sceneWaves.forEach((w, i) => { if (w && w.p > .5) a = i; }); dots.forEach((d, i) => d.classList.toggle('on', i === a)); }
  } });
  scenes.forEach((s, i) => {
    const ph = $('.scene-ph', s);
    if (!i) { stl.fromTo(ph, { scale: 1.15 }, { scale: 1, duration: 1.2, ease: 'none' }, 0); return; }
    const at = i * 1.1, dir = s.dataset.dir, prevPh = $('.scene-ph', scenes[i - 1]);
    stl.to(sceneWaves[i], { p: 1, duration: .9, ease: 'power2.inOut' }, at)
      .fromTo(ph, { scale: 1.28 }, { scale: 1, duration: 1.3, ease: 'none' }, at)
      .fromTo($$('.scene-sub, .scene-meta', s), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .3, stagger: .05 }, at + .55)
      .to(prevPh, { scale: .9, xPercent: dir === 'right' ? -8 : dir === 'left' ? 8 : 0, yPercent: dir === 'top' ? 8 : 0, duration: .9, ease: 'power2.inOut' }, at);
  });
  stl.to({}, { duration: .3 });

  /* ── C8 · SHOP: arch straightens; bottles sink/rise through the pool ── */
  gsap.fromTo('#archPath', { attr: { d: 'M 80 230 Q 500 -10 920 230' } }, { attr: { d: 'M 40 205 Q 500 205 960 205' }, ease: 'none', scrollTrigger: { trigger: '.arch', start: 'top 90%', end: 'top 30%', scrub: 1 } });
  const stage = $('.slide-stage');
  gsap.fromTo(sl.els[0], { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: stage, start: 'top 75%', once: true }, onComplete: () => splash(stage) });
  function splash(host) {
    const r = host.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('i');
      d.className = 'drop'; d.style.cssText = `left:50%;bottom:9%;width:${rand(6, 14)}px;height:${rand(6, 14)}px;z-index:4`;
      host.appendChild(d);
      const x = rand(-r.width * .18, r.width * .18), up = rand(80, 220);
      gsap.timeline({ onComplete: () => d.remove() })
        .to(d, { x, y: -up, duration: rand(.45, .7), ease: 'power2.out' })
        .to(d, { y: 40, autoAlpha: 0, duration: .5, ease: 'power2.in' });
    }
  }
  let sliding = null;
  animateSlide = (prev, next, dir) => {
    if (sliding) sliding.progress(1);
    next.hidden = false;
    sliding = gsap.timeline({ onComplete: () => { prev.hidden = true; sliding = null; } })
      .to(prev, { yPercent: 110, rotate: dir * -12, duration: .6, ease: 'power3.in' }, 0)
      .fromTo(next, { yPercent: 110, rotate: dir * 12 }, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out' }, .45)
      .add(() => splash(stage), .75)
      .fromTo('[data-slide-name]', { yPercent: 105 }, { yPercent: 0, duration: .9, ease: 'expo.out' }, .2)
      .fromTo('[data-slide-desc], .slide-buy', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .06 }, .3);
  };

  /* ── C9 · BUNDLES: cards fill with water; glass pours on scroll ── */
  $$('[data-reveal-wave]').forEach(card => {
    const w = makeWave(card, 'bottom', { amp: 6 });
    gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true } })
      .to(w, { p: 1, duration: 1.6, ease: 'power2.out' })
      .fromTo(card.children, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .08 }, .35);
  });
  gsap.timeline({ scrollTrigger: { trigger: '.wide', start: 'top 80%', end: 'bottom 45%', scrub: 1 } })
    .fromTo('.pour-stream', { scaleY: 0 }, { scaleY: 1, duration: .25, ease: 'none' })
    .fromTo('.glass-fill', { scaleY: 0 }, { scaleY: 1, duration: .65, ease: 'none' }, .15)
    .to('.pour-stream', { scaleY: 0, transformOrigin: 'bottom', duration: .15, ease: 'none' }, .85);

  /* ── C10 · COMPARE: Aquarise column floods from the bottom ── */
  const usFill = $('.us-fill');
  const placeFill = () => {
    const th = $('.cmp thead .us'), table = $('.cmp');
    Object.assign(usFill.style, { left: table.offsetLeft + th.offsetLeft + 'px', width: th.offsetWidth + 'px', top: table.offsetTop + 'px', height: table.offsetHeight + 'px' });
  };
  placeFill();
  ScrollTrigger.addEventListener('refreshInit', placeFill);
  const fillWave = makeWave(usFill, 'bottom', { amp: 4, freq: .6 });
  gsap.to(fillWave, { p: 1, ease: 'none', scrollTrigger: { trigger: '.table-wrap', start: 'top 70%', end: 'bottom 55%', scrub: 1 } });
  gsap.fromTo('.cmp tbody tr', { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.cmp', start: 'top 75%', once: true } });

  /* ── C11 · SOURCE: clip reveals + image drift ── */
  gsap.set('.src-media', { clipPath: 'inset(100% 0% 0% 0%)' });
  ScrollTrigger.batch('.src-card', {
    start: 'top 85%', once: true,
    onEnter: batch => {
      gsap.to(batch.map(c => $('.src-media', c)), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', stagger: .14 });
      gsap.fromTo(batch.map(c => $('.ph', c)), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: .14 });
      gsap.fromTo(batch.flatMap(c => $$('h3, p', c)), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .06, delay: .3 });
    }
  });
  $$('.drift').forEach(el => gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ── C12 · FOOTER: wordmark rises out of the water ── */
  gsap.fromTo('.foot-mark', { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot-mark-wrap', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });

  /* ── C13 · ordering + refresh ── */
  ScrollTrigger.sort();
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
