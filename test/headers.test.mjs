import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'));
const rule = src => Object.fromEntries((config.headers.find(h => h.source === src)?.headers ?? []).map(h => [h.key, h.value]));
const site = rule('/(.*)');
const csp = site['Content-Security-Policy'] ?? '';
const dir = name => csp.split(';').map(s => s.trim()).find(s => s.startsWith(name + ' ')) ?? '';

test('every page gets the baseline security headers', () => {
  assert.equal(site['X-Content-Type-Options'], 'nosniff');
  assert.match(site['Referrer-Policy'], /strict-origin/);
  assert.match(site['Permissions-Policy'], /camera=\(\)/);
  assert.ok(csp, 'Content-Security-Policy present');
});

test('CSP blocks framing, plugins and base-tag tricks', () => {
  assert.equal(dir('frame-ancestors'), "frame-ancestors 'none'");
  assert.equal(dir('object-src'), "object-src 'none'");
  assert.equal(dir('base-uri'), "base-uri 'self'");
  assert.equal(dir('default-src'), "default-src 'self'");
});

test('CSP only lets forms post to this site and PayFast', () => {
  assert.equal(dir('form-action'), "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za");
});

test('script-src has no unsafe-inline or unsafe-eval and allowlists every inline script by hash', () => {
  const scripts = dir('script-src');
  assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval/);
  const pages = readdirSync(root).filter(f => f.endsWith('.html'));
  assert.ok(pages.length >= 7);
  for (const page of pages) {
    const html = readFileSync(new URL(page, root), 'utf8');
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const hash = `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`;
      assert.ok(scripts.includes(hash), `${page}: inline script hash ${hash} missing from CSP; update vercel.json`);
    }
  }
});

test('API responses are never cached', () => {
  assert.match(rule('/api/(.*)')['Cache-Control'], /no-store/);
});
