// Prices a cart on the server from lib/catalogue.js. Money is integer cents throughout.
import { ITEMS, FREE_SHIP, DELIVERY_FEE } from './catalogue.js';

export function priceCart(body) {
  const raw = body && typeof body === 'object' ? body.cart : null;
  const cart = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const lines = Object.entries(cart)
    .map(([id, q]) => ({ id, qty: Math.floor(Number(q)), item: Object.hasOwn(ITEMS, id) ? ITEMS[id] : undefined }))
    .filter(l => l.item && l.qty > 0 && l.qty <= 99);
  if (!lines.length) return { error: 'Your cart is empty.' };

  const subs = lines.filter(l => l.item.subscription);
  if (subs.length && (lines.length > 1 || subs[0].qty > 1))
    return { error: 'Subscriptions check out on their own. Remove other items, then try again.' };

  const goodsCents = lines.reduce((t, l) => t + Math.round(l.item.price * 100) * l.qty, 0);
  const deliveryCents = subs.length || goodsCents >= FREE_SHIP * 100 ? 0 : DELIVERY_FEE * 100;
  return {
    lines: lines.map(l => ({ id: l.id, name: l.item.name, qty: l.qty, unitCents: Math.round(l.item.price * 100) })),
    goodsCents,
    deliveryCents,
    totalCents: goodsCents + deliveryCents,
    isSubscription: subs.length > 0
  };
}
