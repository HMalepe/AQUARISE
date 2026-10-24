/* Performance budget check: fast mouse-wheel flicks from top to bottom and back, measuring every frame.
   Usage (from the repo root):  node tools/perf/flick.mjs            # budget 50ms per frame
                                PERF_BUDGET=33 node tools/perf/flick.mjs
   Run it on a normal laptop with a GPU (headless CI boxes without one are ~2–4× slower). Exits 1 if over budget. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUDGET = +(process.env.PERF_BUDGET || 50), PASSES = 3;
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(path.join(process.execPath, '../../lib/node_modules/playwright/index.mjs'))); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`http://127.0.0.1:${server.address().port}/`); await p.waitForTimeout(5500); await p.mouse.move(700, 450);
await p.evaluate(() => { window.__f = []; let last = performance.now(); const f = t => { __f.push([t - last, scrollY]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
let worstAll = 0;
for (let k = 0; k < PASSES; k++) for (const d of [1, -1]) {
  await p.evaluate(() => { __f.length = 0; });
  for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, d * 400); await p.waitForTimeout(16); }
  await p.waitForTimeout(3500);
  const budget = BUDGET; const f = await p.evaluate(() => __f), over = f.filter(x => x[0] > budget), worst = f.reduce((m, x) => x[0] > m[0] ? x : m, [0, 0]);
  worstAll = Math.max(worstAll, worst[0]);
  console.log(`${d > 0 ? 'down' : 'up  '} pass ${k + 1}: worst ${worst[0].toFixed(0)}ms at y=${Math.round(worst[1])}, frames over ${BUDGET}ms: ${over.length}`);
}
await b.close(); server.close();
console.log(worstAll > BUDGET ? `FAIL: worst frame ${worstAll.toFixed(0)}ms > ${BUDGET}ms budget` : `PASS: every frame within ${BUDGET}ms`);
process.exit(worstAll > BUDGET ? 1 : 0);
