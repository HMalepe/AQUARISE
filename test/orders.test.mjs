import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../lib/orders.js';

const ENV = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc' };
const stub = (responder) => {
  const calls = [];
  const fetch = async (url, init = {}) => { calls.push({ url, ...init }); const r = responder(url, init); return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.body ?? [], text: async () => JSON.stringify(r.body ?? []) }; };
  return { calls, fetch };
};

test('is disabled when the Supabase env is missing', () => {
  assert.equal(createStore({}, async () => {}).enabled, false);
  assert.equal(createStore({ SUPABASE_URL: ENV.SUPABASE_URL }, async () => {}).enabled, false);
});

test('refuses a non-https Supabase URL', () => {
  assert.throws(() => createStore({ ...ENV, SUPABASE_URL: 'http://proj.supabase.co' }, async () => {}));
});

test('insertOrder POSTs the order to /rest/v1/orders with the service key', async () => {
  const { calls, fetch } = stub(() => ({ status: 201, body: [] }));
  const store = createStore(ENV, fetch);
  assert.equal(store.enabled, true);
  await store.insertOrder({ ref: 'AQ1', status: 'pending', amount_cents: 100 });
  assert.equal(calls[0].url, 'https://proj.supabase.co/rest/v1/orders');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers.apikey, 'sb_secret_abc');
  assert.equal(calls[0].headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].body), { ref: 'AQ1', status: 'pending', amount_cents: 100 });
});

test('new-format secret keys are sent as apikey only; legacy JWT keys also as Bearer', async () => {
  const a = stub(() => ({ body: [] }));
  await createStore(ENV, a.fetch).getOrder('AQ1');
  assert.equal(a.calls[0].headers.authorization, undefined);
  const b = stub(() => ({ body: [] }));
  await createStore({ ...ENV, SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOi.payload.sig' }, b.fetch).getOrder('AQ1');
  assert.equal(b.calls[0].headers.authorization, 'Bearer eyJhbGciOi.payload.sig');
});

test('a failing write throws, and the error never contains the key', async () => {
  const { fetch } = stub(() => ({ ok: false, status: 500, body: { message: 'boom' } }));
  const store = createStore(ENV, fetch);
  await assert.rejects(store.insertOrder({ ref: 'AQ1' }), err => { assert.doesNotMatch(String(err.message), /sb_secret/); return true; });
});

test('getOrder queries by ref (URL-encoded) and returns the row or null', async () => {
  const hit = stub(() => ({ body: [{ ref: 'AQ1', status: 'pending' }] }));
  assert.deepEqual(await createStore(ENV, hit.fetch).getOrder('AQ1'), { ref: 'AQ1', status: 'pending' });
  const miss = stub(() => ({ body: [] }));
  assert.equal(await createStore(ENV, miss.fetch).getOrder('nope'), null);
  const evil = stub(() => ({ body: [] }));
  await createStore(ENV, evil.fetch).getOrder('x&status=eq.paid');
  assert.equal(new URL(evil.calls[0].url).searchParams.get('ref'), 'eq.x&status=eq.paid');
  assert.equal(new URL(evil.calls[0].url).searchParams.get('status'), null);
});

test('recordEvent is insert-or-ignore on (order_ref, pf_payment_id) and reports whether it was new', async () => {
  const fresh = stub(() => ({ status: 201, body: [{ id: 1 }] }));
  assert.equal(await createStore(ENV, fresh.fetch).recordEvent({ order_ref: 'AQ1', pf_payment_id: '9' }), true);
  const c = fresh.calls[0];
  assert.match(c.url, /\/rest\/v1\/order_events\?on_conflict=order_ref%2Cpf_payment_id$|on_conflict=order_ref,pf_payment_id$/);
  assert.match(c.headers.prefer, /resolution=ignore-duplicates/);
  assert.match(c.headers.prefer, /return=representation/);
  const dup = stub(() => ({ status: 201, body: [] }));
  assert.equal(await createStore(ENV, dup.fetch).recordEvent({ order_ref: 'AQ1', pf_payment_id: '9' }), false);
});

test('updateOrder PATCHes only the matching ref', async () => {
  const { calls, fetch } = stub(() => ({ body: [] }));
  await createStore(ENV, fetch).updateOrder('AQ1', { status: 'paid' });
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(new URL(calls[0].url).searchParams.get('ref'), 'eq.AQ1');
  assert.deepEqual(JSON.parse(calls[0].body), { status: 'paid' });
});
