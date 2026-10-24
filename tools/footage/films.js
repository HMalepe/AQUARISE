/* Procedural films for the Aquarise site. Each film is a GLSL `scene(frag, t)` returning linear-ish RGB.
   frag is in pixels with a top-left origin. `loop` is the clip length in seconds; `blend` cross-fades the
   last N seconds into the first frames so non-periodic motion still loops seamlessly.
   Brand: navy #285483, sun #FFD946. */
window.FILMS = {};

/* ── HERO · the Aquarise sunrise shot brought to life: sea rolling in, glinting sand, bubbles rising in the bottle ── */
FILMS.hero = {
  w: 1920, h: 1366, fps: 30, loop: 8, blend: 0,   // full HD; all coordinates below are in the photo's 1024×728 space
  textures: async ({ img }) => [await img('../../assets/hero-bottle-hd.jpg')],   // Real-ESRGAN 4× upscale of the photo
  frag: `
const vec3 SUN = vec3(1., .851, .275);
float box(vec2 p, vec2 c, vec2 b, float r){ vec2 q = abs(p - c) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float bottle(vec2 p){ return min(box(p, vec2(506., 420.), vec2(93., 302.), 64.), box(p, vec2(508., 62.), vec2(42., 54.), 10.)); }
const vec2 SRC = vec2(1024., 728.);
vec3 img(vec2 p){ return texture(uTex0, p / SRC).rgb; }
vec3 scene(vec2 frag, float t){
  frag *= SRC / uRes;
  float w = TAU / uLoop;
  float sd = bottle(frag);
  float outside = smoothstep(-3., 5., sd);
  float y = frag.y;
  // sea and wet sand roll toward the camera
  float A = mix(.5, 3.6, smoothstep(160., 700., y));
  float n = noise(vec2(frag.x * .006, y * .01));
  vec2 d = vec2(A * .55 * sin(frag.x * .018 + y * .025 - w * t + n * 3.),
                A * sin(y * .042 - w * 2. * t + n * 4.));
  // inside the bottle: water refracts and shimmers
  vec2 di = vec2(1.3 * sin(y * .05 + w * 3. * t) + .6 * sin(y * .11 - w * 2. * t), 0.) * smoothstep(150., 170., y);
  vec3 c = img(frag + mix(di * smoothstep(0., 18., -sd), d * smoothstep(0., 28., sd), outside));
  float band = pow(.5 + .5 * sin(y * .022 - w * t + noise(vec2(frag.x * .004, y * .01)) * 5.), 7.);
  c += c * band * .28 * smoothstep(180., 420., y) * (1. - smoothstep(560., 728., y)) * outside;
  // water line inside the bottle catches the light
  float wl = 151. + 1.2 * sin(frag.x * .05 + w * 2. * t);
  c += vec3(1., .95, .8) * exp(-pow((y - wl) / 1.6, 2.)) * .35 * (1. - outside) * smoothstep(420., 440., frag.x) * smoothstep(592., 572., frag.x);
  // bubbles rising through the bottle
  for (int i = 0; i < 14; i++) {
    float fi = float(i), h1 = hash12(vec2(fi, 1.)), h2 = hash12(vec2(fi, 2.));
    float sp = h1 > .5 ? 2. : 1.;
    float ph = fract(t / uLoop * sp + h2);
    vec2 bc = vec2(mix(438., 572., hash12(vec2(fi, 3.))) + 5. * sin(ph * 12. + fi), mix(705., 165., ph));
    float r = mix(1.8, 4.2, hash12(vec2(fi, 4.))) * (.7 + .5 * ph);
    float l = length(frag - bc);
    float ring = smoothstep(1.2, 0., abs(l - r)) * .55 + smoothstep(r * .5, 0., length(frag - bc + vec2(r * .35, r * .35))) * .7;
    c += vec3(1., .97, .9) * ring * (1. - outside) * smoothstep(165., 185., bc.y);
  }
  // sand glints twinkle
  vec2 cell = floor(frag / 6.), cc = (cell + .5) * 6. + (hash22(cell) - .5) * 4.;
  float lum = dot(img(cc), vec3(.3, .55, .15));
  float h = hash12(cell);
  float tw = pow(max(sin(w * floor(1. + h * 3.) * t + h * TAU), 0.), 18.);
  vec2 q = frag - cc;
  float star = exp(-dot(q, q) / 1.6) + (exp(-abs(q.x) * .45) * exp(-q.y * q.y * 1.5) + exp(-abs(q.y) * .45) * exp(-q.x * q.x * 1.5)) * .35;
  c += vec3(1., .93, .78) * star * tw * smoothstep(.62, .78, lum) * step(.55, h) * smoothstep(470., 600., y) * outside * 1.4;
  // the sun breathes behind the cap; anamorphic streak
  vec2 sc = vec2(492., 92.);
  float glow = exp(-length(frag - sc) / 170.);
  c += vec3(1., .78, .45) * glow * (.1 + .05 * sin(w * t));
  c += vec3(1., .85, .6) * exp(-abs(y - sc.y) / 5.) * exp(-abs(frag.x - sc.x) / 420.) * (.07 + .03 * sin(w * 2. * t + 1.));
  // drifting spray in the light, out of focus
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    vec2 b = vec2(hash12(vec2(fi, 7.)), hash12(vec2(fi, 8.))) * SRC;
    b += vec2(46. * sin(w * t + fi), 28. * sin(w * 2. * t + fi * 1.7) - 20. * sin(w * t));
    float r = mix(5., 15., hash12(vec2(fi, 9.)));
    c += vec3(1., .9, .72) * smoothstep(r, r * .6, length(frag - b)) * .13 * (.6 + .4 * sin(w * t + fi));
  }
  return c;
}`
};

/* ── WATERFALL · a spring falls into a mossy gorge, sun shafts cut through the mist ── */
FILMS.waterfall = {
  w: 1280, h: 720, fps: 30, loop: 8, blend: 2,
  frag: `
const vec3 SUN = vec3(1., .851, .275);
float ridged(vec2 p){ float a = .5, s = 0.; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { float n = 1. - abs(noise(p) * 2. - 1.); s += a * n * n; p = m * p * 1.05; a *= .5; } return s; }
float rockH(vec2 p){ return ridged(p * vec2(5., 9.)) * .7 + noise(vec2(p.x * 40., p.y * 3.)) * .25 + fbm(p * 2.) * .5; }
vec3 rock(vec2 p, float lightK, float mossK){
  float e = .002, h = rockH(p);
  vec3 n = normalize(vec3((h - rockH(p + vec2(e, 0))) / e * .012, (h - rockH(p + vec2(0, e))) / e * .012, 1.));
  float lam = clamp(dot(n, normalize(vec3(-.7, -.8, .5))), 0., 1.);
  float moss = smoothstep(.48, .66, fbm(p * 6. + 3.1) + n.y * .15);
  vec3 base = mix(vec3(.07, .08, .09), vec3(.22, .22, .21), h * .8);
  base = mix(base, mix(vec3(.10, .20, .07), vec3(.30, .45, .14), lam), moss * mossK);
  return base * (.25 + 1.1 * lam * lightK);
}
float fallMask(vec2 uv, float t, float x0, float x1, float y0, float y1, float spread){
  float s = clamp((uv.y - y0) / (y1 - y0), 0., 1.);
  float fray = (fbm3(vec2(uv.y * 14. - t * 2.4, x0 * 9.)) - .5) * .03 * (.3 + s);
  float l = x0 - spread * s * s + fray, r = x1 + spread * s * s - fray;
  return smoothstep(l, l + .008, uv.x) * smoothstep(r, r - .008, uv.x) * smoothstep(y0 - .006, y0 + .006, uv.y) * step(uv.y, y1);
}
vec4 water(vec2 uv, float t, float x0, float y0, float speed){
  float s = max(uv.y - y0, 0.);
  float v = pow(s, .75) * 3.4 - t * speed;
  float streak = fbm(vec2(uv.x * 140. + x0 * 30., v * 1.1));
  float streak2 = noise(vec2(uv.x * 380., v * 3.));
  float clump = fbm3(vec2(uv.x * 26., v * 2.6));
  float w = streak * .7 + streak2 * .25 + clump * .45 + s * .9 - .35;
  float foam = smoothstep(.35, .75, w);
  vec3 c = mix(vec3(.16, .36, .40), vec3(.95, .98, .99), foam);
  c += SUN * .22 * smoothstep(.8, 1., streak2) * smoothstep(.4, 0., s);
  return vec4(c, mix(.55, 1., foam));
}
vec3 scene(vec2 frag, float t){
  vec2 uv = frag / uRes; float a = uRes.x / uRes.y; vec2 p = vec2(uv.x * a, uv.y);
  float ridge = .12 + .05 * fbm(vec2(uv.x * 5., 1.3)) + .05 * smoothstep(.35, 0., abs(uv.x - .5));
  vec3 c = mix(vec3(.62, .80, .92), vec3(1., .88, .64), smoothstep(.0, .18, uv.y));
  c += SUN * .6 * exp(-length((uv - vec2(.22, .05)) * vec2(a, 1.)) * 5.);
  // back wall
  vec3 rk = rock(p, 1., 1.);
  float near = exp(-pow((uv.x - .5) / .15, 2.));
  rk *= mix(1., .55, near);
  rk += vec3(.08, .12, .12) * near * smoothstep(.7, .95, noise(vec2(uv.x * 140., uv.y * 22. - t * 3.5)));
  c = mix(c, rk, smoothstep(ridge - .004, ridge + .004, uv.y));
  // trees/ferns on the rim
  float side = smoothstep(.07, .2, abs(uv.x - .5));
  float canopy = ridge + .004 - side * (.035 + .05 * fbm(vec2(uv.x * 16., 4.)) + .025 * noise(vec2(uv.x * 70., 1.)));
  vec3 leaf = mix(vec3(.04, .10, .04), vec3(.30, .42, .12), smoothstep(.45, .8, fbm(p * vec2(70., 40.))));
  leaf += SUN * .25 * smoothstep(.02, 0., uv.y - canopy) * smoothstep(.6, .2, uv.x);
  c = mix(c, leaf, smoothstep(canopy - .003, canopy + .003, uv.y) * smoothstep(ridge + .03, ridge - .01, uv.y) * side);
  float horizon = .77;
  // falls
  float m1 = fallMask(uv, t, .415, .585, ridge - .01, horizon + .02, .07);
  vec4 w1 = water(uv, t, .415, ridge, 2.);
  c = mix(c, w1.rgb, m1 * w1.a);
  float lipY = ridge + .004;
  float lip = exp(-pow((uv.y - lipY) / .006, 2.)) * smoothstep(.405, .43, uv.x) * smoothstep(.595, .57, uv.x);
  c += vec3(.6, .7, .65) * lip * (.4 + .6 * noise(vec2(uv.x * 90. - t * 5., 2.)));
  float y2 = ridge + .03 + .02 * fbm(vec2(.74 * 5., 1.3));
  float m2 = fallMask(uv, t, .735, .752, y2, horizon + .01, .02);
  vec4 w2 = water(uv, t, .735, y2, 1.6);
  c = mix(c, w2.rgb, m2 * w2.a * .85);
  // plunge pool
  if (uv.y > horizon) {
    float d = (uv.y - horizon) / (1. - horizon);
    float z = 1. / (d + .06);
    vec2 wp = vec2((uv.x - .5) * z * 2., z);
    float rip = fbm(vec2(wp.x * 2.6, wp.y * 2.4 + t * 1.5));
    float rip2 = noise(vec2(wp.x * 8., wp.y * 7. + t * 2.8));
    vec3 pool = mix(vec3(.03, .13, .15), vec3(.06, .25, .27), d);
    float off = (rip - .5) * .06;
    pool += vec3(.75, .88, .9) * exp(-pow((uv.x - .5 + off) / .09, 2.)) * (.3 + .55 * rip2) * (1. - d * .7);
    pool += vec3(.5, .6, .55) * exp(-pow((uv.x - .743 + off) / .012, 2.)) * .5 * (1. - d);
    pool += rk * .25 * (1. - d);
    pool += SUN * .4 * smoothstep(.8, .96, rip2) * smoothstep(.35, 1., rip);
    float foamDrift = smoothstep(.6, .8, fbm(vec2(wp.x * 1.6, wp.y * 1.1 + t * .55)));
    pool = mix(pool, vec3(.85, .92, .93), foamDrift * .5 * (1. - d * .6));
    c = mix(c, pool, smoothstep(horizon, horizon + .004, uv.y));
  }
  // gorge side walls (foreground, in shade)
  float lw = .13 + .06 * fbm(vec2(uv.y * 5., 2.)) + .08 * smoothstep(.5, 1., uv.y);
  float rw = .88 - .05 * fbm(vec2(uv.y * 5., 7.)) - .1 * smoothstep(.55, 1., uv.y);
  vec3 wall = rock(p * 1.4 + 4., .55, 1.3) * .75;
  c = mix(c, wall, smoothstep(lw + .003, lw - .003, uv.x));
  c = mix(c, wall, smoothstep(rw - .003, rw + .003, uv.x));
  // churn at the base
  vec2 bp = vec2((uv.x - .5) * a, uv.y - horizon);
  float base = exp(-dot(bp * vec2(2.4, 8.), bp * vec2(2.4, 8.)));
  float churn = fbm(vec2(abs(bp.x) * 9. - t * .7, bp.y * 14. + t * 1.4));
  c = mix(c, vec3(.95, .97, .98), smoothstep(.35, .7, churn * (.45 + base)) * base * 1.25);
  // mist
  float mist = fbm(vec2(p.x * 2.2 - t * .04, p.y * 2.4 + t * .3));
  float mistMask = exp(-pow((uv.y - horizon + .06) / .2, 2.)) * exp(-pow((uv.x - .5) / .36, 2.));
  c = mix(c, vec3(.86, .92, .93), clamp(mist * mistMask * 1.15, 0., .8));
  c = mix(c, vec3(.75, .82, .85), .12 * smoothstep(.4, 1., uv.y));
  // sun shafts
  vec2 dv = uv - vec2(.12, -.3); float ang = atan(dv.y, dv.x);
  float shafts = smoothstep(.5, .85, fbm(vec2(ang * 16., t * .1))) * smoothstep(.25, .9, length(dv));
  c += SUN * shafts * (.08 + .38 * mistMask) * smoothstep(1.3, .4, uv.x + uv.y * .4);
  // spray
  vec2 g = frag / 6.; vec2 id = floor(g); vec2 o = hash22(id);
  float ph = fract(o.x + t * (.35 + o.y * .5));
  vec2 sp2 = (id + vec2(o.x, 1. - ph)) * 6.;
  c += vec3(.9) * smoothstep(1.5, .2, length(frag - sp2)) * step(.9, hash12(id + 7.)) * base * 2. * (1. - ph);
  return c;
}`
};

/* ── HEAT · a face in profile against a blazing sun; sweat beads, runs down the nose and drips ── */
(() => {
  const TILT = 7 * Math.PI / 180, PIV = [900, 400];
  const tf = ([x, y]) => { const dx = x - PIV[0], dy = y - PIV[1];
    return [PIV[0] + dx * Math.cos(TILT) - dy * Math.sin(TILT), PIV[1] + dx * Math.sin(TILT) + dy * Math.cos(TILT)]; };
  // Catmull-Rom → cubic Bézier path through points
  const smooth = (pts, closed) => {
    const P = pts.map(tf), n = P.length, at = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + (closed ? 'Z' : '');
  };
  const FRONT = [[770, 66], [738, 116], [714, 186], [705, 238], [716, 268], [690, 318], [663, 350], [676, 367], [700, 372], [698, 391],
    [689, 404], [702, 414], [693, 427], [706, 445], [717, 457], [704, 488], [713, 515], [750, 535], [796, 548], [802, 596], [818, 650], [770, 700], [690, 760]];
  const BACK = [[1300, 760], [1250, 690], [1120, 645], [1078, 590], [1092, 520], [1150, 410], [1152, 260], [1102, 128], [1000, 52], [880, 36]];
  const HAIR = [[1094, 515], [1150, 410], [1152, 260], [1102, 128], [1000, 52], [880, 36], [790, 58], [748, 104]];
  const HEAD = smooth([...FRONT, ...BACK], true);
  const RUN_NOSE = smooth(FRONT.slice(1, 7), false);                    // forehead → nose tip
  const RUN_JAW = smooth(FRONT.slice(9, 17), false);                   // upper lip → under the chin
  const svgPath = d => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'path'); e.setAttribute('d', d); return e; };
  const LOOP = 8;
  // a drop: forms at s0, trembles, runs along the path (stick-slip), hangs at the end, then falls
  const DROPS = [
    { path: 'nose', start: 0, r: 12, from: .1, inset: .3 },
    { path: 'jaw', start: 3.6, r: 10, from: .05, inset: .3 },
    { path: 'nose', start: 5.2, r: 8.5, from: .24, inset: .3 }
  ];
  const BEADS = [[.04, 5], [.12, 6.5], [.17, 4.2], [.215, 5.6], [.3, 4], [.37, 5.2]]; // static beads on the brow (fraction along nose path, radius)
  FILMS.heat = {
    w: 1280, h: 720, fps: 30, loop: LOOP, blend: 1.5,
    textures: async ({ canvas }) => {
      const sharp = canvas(1280, 720), soft = canvas(1280, 720), p = new Path2D(HEAD);
      // short curly hair: seeded bumps along the crown and back of the head
      const hair = svgPath(smooth(HAIR, false)), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.appendChild(hair); document.body.appendChild(svg);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const curls = [];
      for (let s = 0, L = hair.getTotalLength(); s < L; s += 7) {
        const a = hair.getPointAtLength(s), b = hair.getPointAtLength(Math.min(L, s + 1));
        const tx = b.x - a.x, ty = b.y - a.y, m = Math.hypot(tx, ty) || 1, o = 2 + rnd() * 9;
        curls.push([a.x - ty / m * o, a.y + tx / m * o, 7 + rnd() * 9]);
      }
      for (const [cv, blur] of [[sharp, 0], [soft, 20]]) {
        const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 1280, 720);
        x.filter = blur ? `blur(${blur}px)` : 'none'; x.fillStyle = '#fff'; x.fill(p);
        for (const [cx, cy, r] of curls) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }
      }
      return [sharp, soft];
    },
    setup: async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); document.body.appendChild(svg);
      const paths = { nose: svgPath(RUN_NOSE), jaw: svgPath(RUN_JAW) };
      Object.values(paths).forEach(e => svg.appendChild(e));
      return { paths, len: { nose: paths.nose.getTotalLength(), jaw: paths.jaw.getTotalLength() } };
    },
    uniforms: (t, X) => {
      const drops = [], trail = [];
      const pt = (name, f, inset, r) => {
        const L = X.len[name], s = Math.max(0, Math.min(1, f)) * L, a = X.paths[name].getPointAtLength(s), b = X.paths[name].getPointAtLength(Math.min(L, s + 2));
        let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
        return [a.x + ty * r * inset, a.y - tx * r * inset];
      };
      for (const D of DROPS) {
        const u = (((t - D.start) % LOOP) + LOOP) % LOOP / LOOP; // 0..1 lifecycle
        const grow = Math.min(1, u / .18), slideU = Math.max(0, Math.min(1, (u - .3) / .42));
        // stick-slip: eased progress with little pauses
        const slide = Math.pow(slideU, 1.6) + .025 * Math.sin(slideU * Math.PI * 5) * slideU * (1 - slideU);
        let f = D.from + (1 - D.from) * Math.max(0, Math.min(1, slide));
        let [x, y] = pt(D.path, f, D.inset, D.r);
        let r = D.r * (.35 + .65 * grow) * (1 + .25 * slideU), elong = 1 + .35 * slideU, a = 1;
        if (u > .72) { // hang, swell, fall
          const hang = Math.min(1, (u - .72) / .1), fall = Math.max(0, (u - .82) / .18);
          r *= 1 + .25 * hang; elong = 1.3 + .4 * hang - .5 * fall;
          y += r * .5 * hang + 1400 * fall * fall; x -= 30 * fall; a = 1 - Math.max(0, fall - .7) / .3;
        }
        y += .6 * Math.sin(t * 9 + D.start) * (u < .3 ? 1 : 0);
        drops.push(x, y, r, a > 0 ? elong : 0); // w = elongation (0 hides the drop)
        // wet trail behind the drop
        const s0 = D.from, s1 = f, fade = u < .3 ? 0 : u < .82 ? 1 : Math.max(0, 1 - (u - .82) / .18 * 1.2);
        for (let k = 0; k < 8; k++) {
          const ff = s0 + (s1 - s0) * k / 7, [px, py] = pt(D.path, ff, D.inset * .9, D.r);
          trail.push(px, py, 2.2 + 1.6 * (k / 7), (s1 - s0 > .01 ? fade * (.25 + .75 * k / 7) : 0));
        }
      }
      for (const [f, r] of BEADS) { const [x, y] = pt('nose', f, .3, r); drops.push(x, y + .4 * Math.sin(t * 7 + f * 40), r * (1 + .06 * Math.sin(t * Math.PI / 2 + f * 30)), 1); }
      return { uDrops: drops, uTrail: trail };
    },
    frag: `
uniform vec4 uDrops[9];
uniform vec4 uTrail[24];
const vec3 SUN = vec3(1., .851, .275);
const vec2 SUNP = vec2(470., 350.);
vec3 sky(vec2 p, float t){
  vec2 hz = vec2(noise(vec2(p.x * .018, p.y * .03 + t * 1.3)) - .5, noise(vec2(p.x * .022 + 9., p.y * .026 + t * 1.1)) - .5);
  float heat = mix(.6, 1.8, smoothstep(250., 650., p.y));
  vec2 q = p + hz * 9. * heat;
  float y = q.y / uRes.y;
  vec3 c = mix(vec3(.32, .09, .05), vec3(.93, .42, .14), smoothstep(.0, .55, y));
  c = mix(c, vec3(1., .78, .3), smoothstep(.45, .8, y));
  float d = length(q - SUNP);
  c += vec3(1., .55, .2) * exp(-d / 260.) * .9;
  c += SUN * exp(-d / 120.) * .8;
  c = mix(c, mix(vec3(1., .98, .88), SUN * 1.05, smoothstep(60., 172., d)), smoothstep(172., 166., d));
  // dunes
  float dune = 600. + 26. * sin(q.x * .006 + 1.) + 14. * sin(q.x * .017 + 2.) + 8. * fbm(vec2(q.x * .01, 1.));
  vec3 sand = mix(vec3(.42, .16, .06), vec3(.18, .06, .03), smoothstep(dune, 720., q.y));
  sand += vec3(1., .6, .25) * .5 * smoothstep(dune + 6., dune, q.y);
  c = mix(c, sand, smoothstep(dune - 1.5, dune + 1.5, q.y));
  return c;
}
float faceAt(vec2 p){ return texture(uTex0, p / uRes).r; }
vec3 face(vec2 p, float t, out float m){
  m = faceAt(p);
  float b = texture(uTex1, p / uRes).r;
  float e = 3.;
  vec2 g = vec2(texture(uTex1, (p + vec2(e, 0)) / uRes).r - texture(uTex1, (p - vec2(e, 0)) / uRes).r,
                texture(uTex1, (p + vec2(0, e)) / uRes).r - texture(uTex1, (p - vec2(0, e)) / uRes).r);
  vec2 n = -normalize(g + 1e-5);
  vec2 toSun = normalize(SUNP - p);
  float facing = max(dot(n, toSun), 0.);
  float rim = (1. - smoothstep(.5, .8, b)) * pow(facing, 1.4);
  float thin = (1. - smoothstep(.55, .78, b));
  vec3 c = vec3(.07, .035, .025) + vec3(.09, .04, .02) * fbm(p * .02);
  c += vec3(1., .45, .16) * thin * .22 * facing;               // light bleeding through thin skin (nose, lips)
  c += mix(vec3(1., .5, .18), SUN, rim) * rim * 1.15;
  float film = smoothstep(.45, .75, fbm(vec2(p.x * .05, p.y * .012 - t * .02)));
  c += vec3(1., .7, .35) * film * (1. - smoothstep(.5, .95, b)) * facing * .35;
  // sweat sheen: glints in the lit zone
  vec2 cell = floor(p / 3.);
  float tw = pow(max(sin(TAU * (t / 4. + hash12(cell * 1.7))), 0.), 24.);
  c += vec3(1., .95, .75) * step(.93, hash12(cell)) * tw * (1. - smoothstep(.5, .9, b)) * facing * 1.4;
  return c;
}
vec3 world(vec2 p, float t){ float m; vec3 f = face(p, t, m); return mix(sky(p, t), f, m); }
vec3 scene(vec2 frag, float t){
  vec3 c = world(frag, t);
  // wet trails
  for (int i = 0; i < 23; i++) {
    vec4 a = uTrail[i], b = uTrail[i + 1];
    if (a.w <= 0. || b.w <= 0. || i % 8 == 7) continue;
    vec2 pa = frag - a.xy, ba = b.xy - a.xy; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-3), 0., 1.);
    float d = length(pa - ba * h), w = mix(a.z, b.z, h);
    c += vec3(1., .85, .5) * smoothstep(w, w * .2, d) * mix(a.w, b.w, h) * .8;
  }
  // drops: little lenses that flip the sun-lit world behind them
  for (int i = 0; i < 9; i++) {
    vec4 D = uDrops[i];
    if (D.w <= 0.) continue;
    vec2 q = (frag - D.xy) / D.z; q.y /= D.w;
    q.y += .25 * max(q.y, 0.) * (D.w - 1.);
    float L = length(q);
    if (L > 1.15) continue;
    float aa = smoothstep(1., 1. - 2.5 / D.z, L);
    vec3 refr = world(D.xy - q * D.z * 2.4, t);
    vec3 dc = refr * (.55 + .45 * smoothstep(1., .3, L));
    dc *= mix(1., .35, smoothstep(.55, 1., L));
    vec2 hl = normalize(SUNP - D.xy) * .45;
    dc += vec3(1., .97, .85) * exp(-dot(q - hl, q - hl) * 26.) * 1.6;
    dc += vec3(1., .7, .3) * exp(-dot(q + hl * 1.2, q + hl * 1.2) * 14.) * .5;
    c = mix(c, dc, aa);
  }
  return c;
}`
  };
})();

/* ── CONDENSATION · a cold bottle fogged over; drops slide down and clear streaks through to the sunrise ── */
FILMS.condensation = {
  w: 1280, h: 720, fps: 30, loop: 8, blend: 0,
  textures: async ({ img, canvas }) => {
    const src = await img('../../assets/hero-bottle.jpg');
    const make = blur => { const c = canvas(1280, 720), x = c.getContext('2d');
      x.filter = `blur(${blur}px) saturate(1.15)`;
      x.drawImage(src, 40, 0, 944, 531, -60, -40, 1400, 800); return c; }; // crop the warm sky and sea
    return [make(2), make(30), make(10)];
  },
  frag: `
vec3 bg(vec2 uv, float sharp){ return mix(texture(uTex1, uv).rgb, mix(texture(uTex2, uv).rgb, texture(uTex0, uv).rgb, sharp), sharp > 0. ? 1. : 0.); }
// sliding drop for column id: returns centre (px) and radius; phase is periodic in the loop
vec3 slider(float col, float t, float cw){
  float h = hash12(vec2(col, 3.1));
  if (h < .45) return vec3(-999.);
  float speed = h > .8 ? 2. : 1.;
  float ph = fract(t / uLoop * speed + hash12(vec2(col, 9.7)));
  float y = mix(-.12, 1.7, ph + .035 * sin(ph * 40. + col) * (1. - ph)) * uRes.y;
  float x = (col + .5) * cw + sin(y * .018 + col) * cw * .12 + (hash12(vec2(col, 1.3)) - .5) * cw * .4;
  float r = mix(9., 17., hash12(vec2(col, 5.5)));
  return vec3(x, y, r);
}
vec3 scene(vec2 frag, float t){
  vec2 uv = frag / uRes;
  float cw = 64.;
  float col = floor(frag.x / cw);
  float clear = 0.; vec2 off = vec2(0); float lens = 0.; vec2 lensC = vec2(0); float lensR = 1.;
  // sliding drops and their trails (check neighbour columns, drops wobble sideways)
  for (float k = -1.; k <= 1.; k++) {
    vec3 d = slider(col + k, t, cw);
    if (d.x < -900.) continue;
    // trail: a channel above the drop, the path's x follows the same wobble
    float ty = frag.y;
    float tx = (col + k + .5) * cw + sin(ty * .018 + col + k) * cw * .12 + (hash12(vec2(col + k, 1.3)) - .5) * cw * .4;
    float above = d.y - ty;
    if (above > 0.) {
      float w = d.z * .75 * (1. - .35 * smoothstep(0., 500., above));
      float tr = smoothstep(w, w * .5, abs(frag.x - tx)) * exp(-above / 420.);
      clear = max(clear, tr);
      // beads left behind in the trail
      vec2 bc = vec2(tx, (floor(ty / 26.) + .5) * 26.);
      float br = 2.5 + 3. * hash12(vec2(col + k, floor(ty / 26.)));
      float bl = length(frag - bc);
      if (bl < br && hash12(vec2(floor(ty / 26.), col + k + 4.)) > .35 && above > 30.) { lens = 1.; lensC = bc; lensR = br; }
    }
    vec2 q = frag - d.xy; q.y *= .82 + .18 * step(0., q.y);
    if (length(q) < d.z) { lens = 2.; lensC = d.xy; lensR = d.z; }
  }
  // static beads: three sizes of droplets scattered over the fog
  for (int L = 0; L < 3; L++) {
    float cs = L == 0 ? 46. : L == 1 ? 20. : 9.;
    vec2 g = frag / cs, id = floor(g);
    vec2 o = hash22(id + float(L) * 17.);
    float r = cs * (L == 0 ? mix(.12, .36, o.y) : mix(.15, .32, o.x));
    float keep = hash12(id * 1.3 + float(L) * 5.) < (L == 0 ? .55 : .8) ? 1. : 0.;
    vec2 c = (id + .25 + .5 * o) * cs;
    // beads disappear where a drop has wiped the glass
    if (keep > 0. && length(frag - c) < r && clear < .3 && lens < .5) { lens = 1.; lensC = c; lensR = r; }
  }
  vec3 fogCol = bg(uv, 0.);
  fogCol = mix(fogCol, vec3(dot(fogCol, vec3(.33))) * vec3(.95, 1., 1.05), .35) * 1.04 + .08;
  vec3 c = mix(fogCol, bg(uv, .4), clear);
  if (lens > .5) {
    vec2 q = (frag - lensC) / lensR; float l = length(q);
    vec2 look = (lensC - q * lensR * (lens > 1.5 ? 7. : 4.)) / uRes;   // drops act as tiny inverted lenses
    vec3 dc = bg(look, 1.) * 1.08;
    dc *= mix(1., .25, smoothstep(.55, 1., l));                       // dark rim from total internal reflection
    dc += vec3(1.) * exp(-dot(q - vec2(-.35, -.4), q - vec2(-.35, -.4)) * 18.) * .9;
    dc += vec3(1., .9, .7) * exp(-dot(q - vec2(.2, .55), q - vec2(.2, .55)) * 10.) * .25;
    c = mix(c, dc, smoothstep(1., 1. - 2. / lensR, l));
  }
  return c;
}`
};

/* ── DROP · a single drop falls into still water at sunrise: impact, rebound jet, rings ── */
FILMS.drop = {
  w: 1280, h: 720, fps: 30, loop: 8, blend: 0,
  frag: `
const vec3 SUN = vec3(1., .851, .275);
const vec3 SUNDIR = normalize(vec3(-.25, .09, 1.));
const vec2 C = vec2(0., .95);
const float PERIOD = 4., IMPACT = 1.2;
vec3 skyCol(vec3 d){
  float y = max(d.y, 0.);
  vec3 c = mix(vec3(1., .78, .52), vec3(.36, .55, .78), pow(y, .5));
  float s = max(dot(d, SUNDIR), 0.);
  c += SUN * pow(s, 400.) * 3. + vec3(1., .7, .4) * pow(s, 12.) * .5;
  return c;
}
float ripple(vec2 xz, float t){
  float h = 0.;
  for (int k = -2; k <= 1; k++) {
    float tau = t - (float(k) * PERIOD + IMPACT);
    tau = mod(tau + PERIOD * 4., PERIOD * 2.) - .001;
    if (tau < 0. || tau > PERIOD * 1.6) continue;
    float r = length(xz - C);
    float front = .32 * tau + .03;
    float env = smoothstep(front + .02, front - .2, r) * exp(-tau * .5) * exp(-r * 1.6);
    h += .012 * env * sin(60. * (r - .32 * tau));
  }
  return h;
}
float heightAt(vec2 xz, float t){
  float amb = (noise(xz * vec2(1.3, 2.2) + vec2(0., t * .35)) - .5) * .02 + (noise(xz * 5. - vec2(t * .5, 0.)) - .5) * .004;
  return ripple(xz, t) * 1. + amb;
}
// ray–sphere distance, -1 on a miss
float sphI(vec3 ro, vec3 rd, vec3 c, float r){ vec3 oc = ro - c; float b = dot(oc, rd), q = dot(oc, oc) - r * r, h = b * b - q; return h < 0. ? -1. : -b - sqrt(h); }
vec3 waterCol(vec3 ro, vec3 rd, float t, out float hitT){
  hitT = -ro.y / rd.y;
  vec3 p = ro + rd * hitT;
  float e = .004, h = heightAt(p.xz, t);
  vec3 n = normalize(vec3(h - heightAt(p.xz + vec2(e, 0), t), e, h - heightAt(p.xz + vec2(0, e), t)));
  vec3 r = reflect(rd, n);
  float fres = .04 + .96 * pow(1. - max(dot(-rd, n), 0.), 5.);
  vec3 body = mix(vec3(.02, .14, .2), vec3(.05, .3, .36), smoothstep(.0, .25, n.x * .5 + .1));
  vec3 c = mix(body, skyCol(r), fres);
  c += SUN * pow(max(dot(r, SUNDIR), 0.), 600.) * 4.;
  float far = smoothstep(4., 30., hitT);
  return mix(c, skyCol(normalize(vec3(rd.x, .02, rd.z))), far * .85);
}
vec3 scene(vec2 frag, float t){
  vec2 uv = (frag - .5 * uRes) / uRes.y; uv.y = -uv.y;
  vec3 ro = vec3(0., .2, 0.);
  vec3 fw = normalize(vec3(0., -.1, 1.)), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.5 + rt * uv.x + up * uv.y);
  vec3 c; float hitT = 1e9;
  if (rd.y < 0.) c = waterCol(ro, rd, t, hitT); else c = skyCol(rd);
  // the falling drop and the rebound jet
  float tau = mod(t - IMPACT + PERIOD, PERIOD);  // time since the last impact
  float fallT = PERIOD - tau;                      // time until the next impact
  vec3 base = vec3(C.x, 0., C.y);
  float best = 1e9; vec3 bn = vec3(0); float hit = 0.;
  if (fallT < .45) {
    float y = 4.9 * fallT * fallT + .02;
    float d = sphI(ro, rd, base + vec3(0, y, 0), .02);
    if (d > 0. && d < best) { best = d; bn = normalize(ro + rd * d - base - vec3(0, y, 0)); hit = 1.; }
  }
  if (tau > .05 && tau < .75) {
    float k = (tau - .05) / .7;
    float jh = .15 * sin(3.14159 * min(k * 1.25, 1.)) * (1. - smoothstep(.75, 1., k));
    float jr = mix(.018, .009, k);
    for (int j = 0; j < 9; j++) {   // a tapered, slightly beaded column of water
      float fj = float(j) / 8.;
      vec3 sc = base + vec3(0, jh * fj, 0);
      float sr = mix(jr * 2.2, jr, fj) * (1. + .12 * sin(fj * 9. + k * 14.));
      float d = sphI(ro, rd, sc, sr);
      if (d > 0. && d < best) { best = d; bn = normalize(ro + rd * d - sc); hit = 1.; }
    }
    if (k > .45) {   // a bead pinches off the top of the jet
      float by = .15 * sin(3.14159 * .56) + (k - .45) * .16 - 4.9 * pow(max(k - .55, 0.) * .7, 2.);
      float d2 = sphI(ro, rd, base + vec3(0, by + .028, 0), .013);
      if (d2 > 0. && d2 < best) { best = d2; bn = normalize(ro + rd * d2 - base - vec3(0, by + .028, 0)); hit = 1.; }
    }
  }
  // a crown of tiny splash beads right at impact
  if (tau < .35) {
    for (int i = 0; i < 12; i++) {
      float a = float(i) / 12. * 6.2832 + .3;
      float s = tau / .35;
      vec3 bp = base + vec3(cos(a) * .07 * (.4 + s), .055 * sin(3.14159 * s) * (.6 + .4 * hash12(vec2(float(i), 2.))), sin(a) * .07 * (.4 + s));
      float d = sphI(ro, rd, bp, .0065 * (1. - s * .6));
      if (d > 0. && d < best) { best = d; bn = normalize(ro + rd * d - bp); hit = 1.; }
    }
  }
  if (hit > 0. && best < hitT) {
    vec3 refr = refract(rd, bn, .75);
    float fres = .08 + .92 * pow(1. - max(dot(-rd, bn), 0.), 4.);
    vec3 inner = refr.y < 0. ? mix(vec3(.05, .25, .3), skyCol(reflect(refr, vec3(0, 1, 0))), .5) : skyCol(refr);
    vec3 dc = mix(inner * .9, skyCol(reflect(rd, bn)), fres);
    dc += SUN * pow(max(dot(reflect(rd, bn), SUNDIR), 0.), 80.) * 2.5;
    c = dc;
  }
  // soft depth of field haze toward the horizon
  return c;
}`
};

/* ── STONES · looking down through a clear stream at river stones, caustics dancing over them ── */
FILMS.stones = {
  w: 1280, h: 720, fps: 30, loop: 8, blend: 2,
  frag: `
const vec3 SUN = vec3(1., .851, .275);
vec2 pebbles(vec2 p, float seed){  // x: dome height, y: id
  vec2 i = floor(p), f = fract(p); float best = 0., id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y), cell = i + g + seed;
    vec2 c = g + .28 + .44 * hash22(cell) - f;
    float an = hash12(cell + 3.) * 6.2832; c = mat2(cos(an), -sin(an), sin(an), cos(an)) * c;
    vec2 rad = vec2(.5, .5 * mix(.6, .95, hash12(cell + 5.))) * mix(.78, 1.08, hash12(cell + 7.));
    float d = length(c / rad);
    float h = d < 1. ? pow(1. - d * d, .55) * mix(.7, 1., hash12(cell + 9.)) : 0.;
    if (h > best) { best = h; id = hash12(cell); }
  }
  return vec2(best, id);
}
vec2 bed(vec2 p){ vec2 a = pebbles(p, 0.); vec2 b = pebbles(p * 2.1 + 3.7, 11.); b.x *= .45; return a.x > b.x ? a : b; }
float caustic(vec2 p, float t){
  float c = 0.;
  for (int k = 0; k < 2; k++) {
    vec2 q = p * (1. + float(k) * .7) + vec2(t * .35, t * .12 * (float(k) * 2. - 1.));
    q += vec2(fbm3(q * .6 + t * .2), fbm3(q * .6 + 4. - t * .17)) * 1.6;
    float n = noise(q * 1.7);
    c += pow(1. - abs(n * 2. - 1.), 9.);
  }
  return c;
}
vec3 scene(vec2 frag, float t){
  vec2 uv = frag / uRes; float a = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * a, uv.y) * 4.2;
  vec2 flow = vec2(fbm3(p * .7 + vec2(t * .5, 0.)), fbm3(p * .7 + vec2(7., t * .2))) - .5;
  vec2 sp = p + flow * .2;
  vec2 s = bed(sp); float h = s.x, e = .006;
  vec3 n = normalize(vec3(h - bed(sp + vec2(e, 0)).x, h - bed(sp + vec2(0, e)).x, e * 2.2));
  float lam = clamp(dot(n, normalize(vec3(-.5, -.6, .65))), 0., 1.);
  vec3 pal[6]; pal[0] = vec3(.50, .49, .46); pal[1] = vec3(.36, .37, .40); pal[2] = vec3(.58, .48, .36);
  pal[3] = vec3(.24, .23, .23); pal[4] = vec3(.70, .67, .60); pal[5] = vec3(.45, .38, .32);
  vec3 base = pal[int(floor(s.y * 6.))];
  base *= .8 + .35 * fbm(sp * 11. + s.y * 30.);
  base += vec3(.12) * smoothstep(.75, .9, noise(sp * 30. + s.y * 9.));                // quartz flecks
  vec3 stone = base * (.3 + .95 * lam) + vec3(.9, .95, 1.) * pow(max(dot(reflect(vec3(0, 0, -1), n), normalize(vec3(-.5, -.6, .65))), 0.), 30.) * .25;
  vec3 sand = vec3(.36, .31, .24) * (.6 + .5 * fbm(sp * 25.));
  vec3 c = mix(sand * .55, stone, smoothstep(.0, .05, h));
  c *= mix(.5, 1., smoothstep(0., .25, h));                                          // contact shadow in the gaps
  c *= vec3(.66, .9, .93);                                                            // water absorbs reds
  float cs = caustic(p * .9 + flow * .5, t);
  c += mix(vec3(.65, .95, 1.), SUN, .4) * cs * .2 * (.4 + .7 * lam);
  c += vec3(1., .97, .88) * pow(noise(p * 7. + flow * 6. + t * .7), 18.) * 2.;
  c = mix(c, vec3(.1, .3, .33), .12);
  return c;
}`
};
