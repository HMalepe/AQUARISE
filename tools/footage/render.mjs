/* Renders the procedural films in films.js to looping MP4 + WebM clips and JPG posters.
   Usage (from the repo root):
     node tools/footage/render.mjs                    # every film → assets/video/
     node tools/footage/render.mjs waterfall heat     # just these
     node tools/footage/render.mjs heat --stills 0,3,6 --out /tmp/stills   # PNG test frames, no video
   Needs ffmpeg on PATH and Playwright (npm i -D playwright, or a global install). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const stills = flag('--stills', null);
const outDir = path.resolve(flag('--out', path.join(ROOT, 'assets/video')));
const crf = flag('--crf', '25');
const only = args;

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(path.join(process.execPath, '../../lib/node_modules/playwright/index.mjs'))); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.error('  [page]', m.text()); });
page.on('pageerror', e => console.error('  [page]', e.message));
await page.goto(`http://127.0.0.1:${port}/tools/footage/studio.html`);
const names = only.length ? only : await page.evaluate(() => Object.keys(window.FILMS));
fs.mkdirSync(outDir, { recursive: true });

for (const name of names) {
  const film = await page.evaluate(n => window.loadFilm(n), name);
  const frames = Math.round(film.loop * film.fps);
  const t0 = Date.now();
  if (stills) {
    for (const s of stills.split(',').map(Number)) {
      const b64 = await page.evaluate(t => window.renderFrame(t, 'image/png'), s);
      fs.writeFileSync(path.join(outDir, `${name}-${s}.png`), Buffer.from(b64, 'base64'));
    }
    console.log(`${name}: stills in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    continue;
  }
  const mp4 = path.join(outDir, `${name}.mp4`);
  const webm = mp4.replace(/\.mp4$/, '.webm');
  // one pass, two encodes: H.264 MP4 (Safari, everything) and VP9 WebM (smaller, Chromium/Firefox)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(film.fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4,
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(+crf + 10), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', webm],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate(t => window.renderFrame(t, 'image/jpeg'), i / film.fps);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i === 0) fs.writeFileSync(path.join(outDir, `${name}.jpg`), buf);
    if (i % 30 === 0) process.stdout.write(`\r${name}: ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  // smaller poster
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(outDir, `${name}.jpg`), '-q:v', '6', path.join(outDir, `${name}-poster.jpg`)]).on('close', r));
  fs.renameSync(path.join(outDir, `${name}-poster.jpg`), path.join(outDir, `${name}.jpg`));
  console.log(`\r${name}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s → mp4 ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB, webm ${(fs.statSync(webm).size / 1e6).toFixed(2)} MB`);
}
await browser.close();
server.close();
