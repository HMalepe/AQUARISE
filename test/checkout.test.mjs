import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCheckout } from '../lib/checkout.js';
import { sign } from '../lib/payfast.js';
import { MemoryStore, call, LIVE_ENV } from './helpers.mjs';

const mk = (env = {}, store = new MemoryStore()) => ({ store, handler: makeCheckout({ env, store, log() {} }) });
const cart = { 'still-500': 2 };   // R36 + R60 delivery = R96

test('rejects non-POST', async () => {
  const { handler } = mk();
  assert.equal((await call(handler, { method: 'GET' })).status, 405);
});

test('a malformed JSON string body is a 400, not an unhandled throw', async () => {
  const { handler } = mk();
  const r = await call(handler, { body: '{not json' });
  assert.equal(r.status, 400);
  assert.ok(r.json.error);
});

test('an empty cart is a 400', async () => {
  const { handler } = mk();
  assert.equal((await call(handler, { body: { cart: {} } })).status, 400);
});

test('callback URLs come from SITE_URL, never from the Host header', async () => {
  const { handler } = mk({ SITE_URL: 'https://shop.example.com' });
  const r = await call(handler, { headers: { host: 'evil.example', 'x-forwarded-proto': 'http' }, body: { cart } });
  assert.equal(r.status, 200);
  for (const k of ['return_url', 'cancel_url', 'notify_url']) {
    assert.match(r.json.fields[k], /^https:\/\/shop\.example\.com\//, k);
    assert.doesNotMatch(r.json.fields[k], /evil/, k);
  }
});

test('the signed amount is the server-side total and the signature verifies', async () => {
  const { handler } = mk();
  const r = await call(handler, { body: { cart } });
  assert.equal(r.json.fields.amount, '96.00');
  const { signature, ...rest } = r.json.fields;
  assert.equal(signature, sign(rest, 'jt7NOE43FZPn'));     // sandbox passphrase
});

test('stores a pending order matching what was signed', async () => {
  const { handler, store } = mk();
  const r = await call(handler, { body: { cart, buyer: { email: 'a@b.co', name: 'Ann' } } });
  const order = store.orders.get(r.json.fields.m_payment_id);
  assert.equal(order.status, 'pending');
  assert.equal(order.amount_cents, 9600);
  assert.equal(order.currency, 'ZAR');
  assert.equal(order.is_subscription, false);
  assert.equal(order.buyer_email, 'a@b.co');
  assert.deepEqual(order.items, [{ id: 'still-500', name: 'Still 500ml', qty: 2, unitCents: 1800 }]);
});

test('subscriptions carry the recurring fields and are stored as subscriptions', async () => {
  const { handler, store } = mk();
  const r = await call(handler, { body: { cart: { 'sub-monthly': 1 } } });
  assert.equal(r.json.fields.recurring_amount, '899.00');
  assert.equal(store.orders.get(r.json.fields.m_payment_id).is_subscription, true);
});

test('order refs are unique even when created in the same millisecond', async () => {
  const { handler } = mk({}, new MemoryStore());
  const refs = new Set();
  for (let i = 0; i < 200; i++) refs.add((await call(handler, { body: { cart } })).json.fields.m_payment_id);
  assert.equal(refs.size, 200);
});

test('if the store is enabled but fails, checkout fails closed with 503 and returns no payment form', async () => {
  const { handler, store } = mk();
  store.failing = true;
  const r = await call(handler, { body: { cart } });
  assert.equal(r.status, 503);
  assert.equal(r.json.fields, undefined);
});

test('live mode without a working order store fails closed', async () => {
  const store = new MemoryStore(); store.enabled = false;
  const { handler } = mk(LIVE_ENV, store);
  const r = await call(handler, { body: { cart } });
  assert.equal(r.status, 503);
  assert.equal(r.json.fields, undefined);
});

test('sandbox mode without a store still works, so the demo keeps running', async () => {
  const store = new MemoryStore(); store.enabled = false;
  const { handler } = mk({}, store);
  assert.equal((await call(handler, { body: { cart } })).status, 200);
});

test('live mode with missing PayFast credentials is a 503 that does not leak config', async () => {
  const { handler } = mk({ ...LIVE_ENV, PAYFAST_PASSPHRASE: '' });
  const r = await call(handler, { body: { cart } });
  assert.equal(r.status, 503);
  assert.doesNotMatch(JSON.stringify(r.json), /PASSPHRASE|555|key/i);
});

test('buyer fields are length-limited and prototype keys in the cart do not reach the signature', async () => {
  const { handler } = mk();
  const r = await call(handler, { body: { cart: { constructor: 1, 'still-500': 1 }, buyer: { name: 'x'.repeat(500), email: 'y'.repeat(500) } } });
  assert.equal(r.status, 200);
  assert.equal(r.json.fields.name_first.length, 100);
  assert.equal(r.json.fields.email_address.length, 100);
  assert.equal(r.json.fields.amount, '78.00');     // 18 + 60 delivery, constructor ignored
});
