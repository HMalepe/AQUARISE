import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart } from '../lib/cart.js';

test('prices a normal cart from the server catalogue, in cents', () => {
  const r = priceCart({ cart: { 'still-500': 2, 'still-1l': 1 } });
  assert.equal(r.error, undefined);
  assert.equal(r.goodsCents, 6500);          // 2*18 + 29 = 65
  assert.equal(r.deliveryCents, 6000);       // under free-shipping threshold
  assert.equal(r.totalCents, 12500);
});

test('delivery is free at or above the threshold', () => {
  const r = priceCart({ cart: { 'ritual-24': 2 } });   // 578
  assert.equal(r.deliveryCents, 0);
  assert.equal(r.totalCents, 57800);
});

test('rejects prototype-chain keys instead of producing a NaN amount', () => {
  for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const r = priceCart({ cart: Object.fromEntries([[key, 1]]) });
    assert.match(r.error, /empty/i, key);
    assert.equal(r.totalCents, undefined, key);
  }
});

test('ignores unknown ids, zero, negative, fractional-to-zero and over-limit quantities', () => {
  assert.match(priceCart({ cart: { nope: 1 } }).error, /empty/i);
  assert.match(priceCart({ cart: { 'still-500': 0 } }).error, /empty/i);
  assert.match(priceCart({ cart: { 'still-500': -3 } }).error, /empty/i);
  assert.match(priceCart({ cart: { 'still-500': 0.4 } }).error, /empty/i);
  assert.match(priceCart({ cart: { 'still-500': 100 } }).error, /empty/i);
  assert.match(priceCart({ cart: { 'still-500': 'abc' } }).error, /empty/i);
});

test('a missing, null or non-object cart is an empty cart, not a crash', () => {
  for (const body of [{}, { cart: null }, { cart: 'x' }, { cart: 5 }, null, undefined]) {
    assert.match(priceCart(body).error, /empty/i);
  }
});

test('a subscription must check out alone and at quantity 1', () => {
  assert.match(priceCart({ cart: { 'sub-monthly': 1, 'still-500': 1 } }).error, /on their own/i);
  assert.match(priceCart({ cart: { 'sub-monthly': 2 } }).error, /on their own/i);
  assert.match(priceCart({ cart: { 'sub-monthly': 1, 'sub-weekly': 1 } }).error, /on their own/i);
  const ok = priceCart({ cart: { 'sub-monthly': 1 } });
  assert.equal(ok.isSubscription, true);
  assert.equal(ok.deliveryCents, 0);
  assert.equal(ok.totalCents, 89900);
});

test('returns line details for storage', () => {
  const r = priceCart({ cart: { 'still-500': 3 } });
  assert.deepEqual(r.lines, [{ id: 'still-500', name: 'Still 500ml', qty: 3, unitCents: 1800 }]);
});
