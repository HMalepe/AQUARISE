import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeNotify, payfastValidate } from '../lib/notify.js';
import { MemoryStore, call, itn, LIVE_ENV } from './helpers.mjs';

const SANDBOX_PASS = 'jt7NOE43FZPn';
const order = (over = {}) => ({ ref: 'AQTEST', status: 'pending', amount_cents: 7800, currency: 'ZAR', items: [], is_subscription: false, buyer_name: 'Buyer', buyer_email: 'buyer@example.com', ...over });
const setup = ({ env = {}, validate = async () => true, orders = [order()] } = {}) => {
  const store = new MemoryStore();
  for (const o of orders) store.orders.set(o.ref, o);
  const logs = [];
  const handler = makeNotify({ env, store, validate, log: (...a) => logs.push(a.join(' ')) });
  return { store, handler, logs };
};
const send = (handler, fields = {}, pass = SANDBOX_PASS) => call(handler, { body: itn(fields, pass) });

test('rejects non-POST', async () => {
  const { handler } = setup();
  assert.equal((await call(handler, { method: 'GET' })).status, 405);
});

test('happy path: valid signature, PayFast confirms, amount matches -> order is paid', async () => {
  const { handler, store } = setup();
  const r = await send(handler);
  assert.equal(r.status, 200);
  const o = store.orders.get('AQTEST');
  assert.equal(o.status, 'paid');
  assert.ok(o.paid_at);
  assert.equal(store.events.length, 1);
  assert.equal(store.events[0].verified, true);
  assert.equal(store.events[0].pf_payment_id, '1001');
});

test('a bad signature changes nothing', async () => {
  const { handler, store } = setup();
  const r = await send(handler, {}, 'wrong-passphrase');
  assert.equal(r.status, 400);
  assert.equal(store.orders.get('AQTEST').status, 'pending');
  assert.equal(store.events.length, 0);
});

test('a missing signature changes nothing', async () => {
  const { handler, store } = setup();
  const body = new URLSearchParams(itn({}, SANDBOX_PASS)); body.delete('signature');
  const r = await call(handler, { body: body.toString() });
  assert.equal(r.status, 400);
  assert.equal(store.orders.get('AQTEST').status, 'pending');
});

test('if PayFast does not confirm the ITN as VALID, nothing is paid', async () => {
  const { handler, store } = setup({ validate: async () => false });
  const r = await send(handler);
  assert.equal(r.status, 400);
  assert.equal(store.orders.get('AQTEST').status, 'pending');
});

test('an amount that differs from the stored order is flagged for review and NOT paid', async () => {
  const { handler, store } = setup();
  await send(handler, { amount_gross: '1.00' });
  assert.equal(store.orders.get('AQTEST').status, 'review');
  assert.equal(store.events[0].verified, false);
  assert.match(store.events[0].note, /amount/i);
});

test('an ITN for a different merchant is ignored', async () => {
  const { handler, store } = setup();
  const r = await send(handler, { merchant_id: '99999999' });
  assert.equal(r.status, 400);
  assert.equal(store.orders.get('AQTEST').status, 'pending');
  assert.equal(store.events.length, 0);
});

test('an unknown order ref is acknowledged but creates nothing', async () => {
  const { handler, store } = setup({ orders: [] });
  const r = await send(handler);
  assert.equal(r.status, 200);
  assert.equal(store.orders.size, 0);
  assert.equal(store.events.length, 0);
});

test('a duplicate ITN is idempotent', async () => {
  const { handler, store } = setup();
  await send(handler);
  const paidAt = store.orders.get('AQTEST').paid_at;
  const r = await send(handler);
  assert.equal(r.status, 200);
  assert.equal(store.events.length, 1);
  assert.equal(store.orders.get('AQTEST').paid_at, paidAt);
});

test('a later recurring subscription payment (new pf_payment_id) is recorded and the order stays paid', async () => {
  const { handler, store } = setup({ orders: [order({ is_subscription: true, amount_cents: 89900 })] });
  await send(handler, { amount_gross: '899.00', pf_payment_id: '2001' });
  await send(handler, { amount_gross: '899.00', pf_payment_id: '2002' });
  assert.equal(store.events.length, 2);
  assert.equal(store.orders.get('AQTEST').status, 'paid');
});

test('FAILED or CANCELLED on a pending order marks it failed; PENDING changes nothing', async () => {
  for (const [status, expected] of [['FAILED', 'failed'], ['CANCELLED', 'failed'], ['PENDING', 'pending']]) {
    const { handler, store } = setup();
    await send(handler, { payment_status: status });
    assert.equal(store.orders.get('AQTEST').status, expected, status);
  }
});

test('a paid order is never downgraded by a later failure notice', async () => {
  const { handler, store } = setup();
  await send(handler);
  await send(handler, { payment_status: 'FAILED', pf_payment_id: '1002' });
  assert.equal(store.orders.get('AQTEST').status, 'paid');
});

test('if the store is down, respond 500 so PayFast retries the ITN', async () => {
  const { handler, store } = setup();
  store.failing = true;
  assert.equal((await send(handler)).status, 500);
});

test('live mode without an order store responds 503 so PayFast retries', async () => {
  const store = new MemoryStore(); store.enabled = false;
  const handler = makeNotify({ env: LIVE_ENV, store, validate: async () => true, log() {} });
  const r = await call(handler, { body: itn({ merchant_id: '555' }, 'pass') });
  assert.equal(r.status, 503);
});

test('live mode uses the live credentials to verify', async () => {
  const { handler, store } = setup({ env: LIVE_ENV });
  const r = await call(handler, { body: itn({ merchant_id: '555' }, 'pass') });
  assert.equal(r.status, 200);
  assert.equal(store.orders.get('AQTEST').status, 'paid');
});

test('logs never contain the buyer email, name or signature', async () => {
  const { handler, logs } = setup();
  await send(handler);
  await send(handler, { amount_gross: '1.00', pf_payment_id: '1003' });
  await send(handler, {}, 'wrong');
  const all = logs.join('\n');
  assert.ok(logs.length > 0);
  assert.doesNotMatch(all, /buyer@example\.com/);
  assert.doesNotMatch(all, /Buyer/);
  assert.doesNotMatch(all, /[0-9a-f]{32}/);
});

test('payfastValidate posts the params (without the signature) and returns true only on VALID', async () => {
  const seen = [];
  const mkFetch = text => async (url, init) => { seen.push({ url, init }); return { text: async () => text }; };
  const raw = 'a=1&b=2&signature=abc';
  assert.equal(await payfastValidate(raw, 'https://v.example/validate', mkFetch('VALID\n')), true);
  assert.equal(seen[0].url, 'https://v.example/validate');
  assert.equal(seen[0].init.body, 'a=1&b=2');
  assert.equal(await payfastValidate(raw, 'https://v.example/validate', mkFetch('INVALID')), false);
  assert.equal(await payfastValidate(raw, 'https://v.example/validate', async () => { throw new Error('net'); }), false);
});
