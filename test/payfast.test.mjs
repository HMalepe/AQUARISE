import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, sign, siteUrl } from '../lib/payfast.js';

const LIVE = { PAYFAST_SANDBOX: 'false', PAYFAST_MERCHANT_ID: '123', PAYFAST_MERCHANT_KEY: 'k', PAYFAST_PASSPHRASE: 'p' };

test('sandbox is the default and uses PayFast public test credentials', () => {
  const c = loadConfig({});
  assert.equal(c.sandbox, true);
  assert.equal(c.merchant_id, '10000100');
  assert.match(c.processUrl, /sandbox\.payfast\.co\.za/);
  assert.match(c.validateUrl, /sandbox\.payfast\.co\.za/);
});

test('anything other than the exact string "false" stays in sandbox', () => {
  for (const v of [undefined, '', 'FALSE', '0', 'no', 'true']) {
    assert.equal(loadConfig({ PAYFAST_SANDBOX: v }).sandbox, true, String(v));
  }
});

test('live mode uses the live endpoints and the configured credentials', () => {
  const c = loadConfig(LIVE);
  assert.equal(c.sandbox, false);
  assert.match(c.processUrl, /^https:\/\/www\.payfast\.co\.za\//);
  assert.deepEqual([c.merchant_id, c.merchant_key, c.passphrase], ['123', 'k', 'p']);
});

test('live mode refuses to start without every credential, including the passphrase', () => {
  for (const missing of ['PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE']) {
    const env = { ...LIVE, [missing]: '' };
    assert.throws(() => loadConfig(env), new RegExp(missing), missing);
    const env2 = { ...LIVE }; delete env2[missing];
    assert.throws(() => loadConfig(env2), new RegExp(missing), missing);
  }
});

test('live mode never falls back to the public sandbox credentials', () => {
  assert.throws(() => loadConfig({ PAYFAST_SANDBOX: 'false' }));
});

test('sign() is PayFast-style: ordered, urlencoded, passphrase appended, empty values skipped', () => {
  const a = sign({ b: 'x y', a: '1', empty: '' }, 'pw');
  const b = sign({ b: 'x y', a: '1' }, 'pw');
  assert.equal(a, b);
  assert.notEqual(sign({ a: '1', b: 'x y' }, 'pw'), a);   // order matters
  assert.notEqual(sign({ b: 'x y', a: '1' }, 'other'), a); // passphrase matters
});

test('siteUrl() is a fixed origin, defaulting to production and overridable by SITE_URL', () => {
  assert.equal(siteUrl({}), 'https://aquarise.co.za');
  assert.equal(siteUrl({ SITE_URL: 'https://preview.example.com/' }), 'https://preview.example.com');
});

test('siteUrl() rejects a non-https origin', () => {
  assert.throws(() => siteUrl({ SITE_URL: 'javascript:alert(1)' }));
  assert.throws(() => siteUrl({ SITE_URL: 'http://evil.example' }));
});
