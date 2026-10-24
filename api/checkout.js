// POST /api/checkout  { cart: { id: qty }, buyer?: { email, name } }
// Prices are recalculated here from lib/catalogue.js, never trusted from the browser. Returns the signed PayFast form.
import { ITEMS, FREE_SHIP, DELIVERY_FEE } from '../lib/catalogue.js';
import { PROCESS_URL, config, sign } from '../lib/payfast.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const cart = body.cart || {};
  const lines = Object.entries(cart)
    .map(([id, q]) => ({ id, q: Math.floor(Number(q)), item: ITEMS[id] }))
    .filter(l => l.item && l.q > 0 && l.q <= 99);
  if (!lines.length) return res.status(400).json({ error: 'Your cart is empty.' });

  const subs = lines.filter(l => l.item.subscription);
  if (subs.length && (lines.length > 1 || subs[0].q > 1))
    return res.status(400).json({ error: 'Subscriptions check out on their own. Remove other items, then try again.' });

  const goods = lines.reduce((t, l) => t + l.item.price * l.q, 0);
  const delivery = subs.length || goods >= FREE_SHIP ? 0 : DELIVERY_FEE;
  const total = (goods + delivery).toFixed(2);
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
  const ref = 'AQ' + Date.now().toString(36).toUpperCase();
  const { merchant_id, merchant_key, passphrase } = config();
  const summary = lines.map(l => `${l.q}× ${l.item.name}`).join(', ') + (delivery ? `, delivery R${delivery}` : '');
  const buyer = body.buyer || {};

  // Field order matters for the signature: it follows PayFast's documented order.
  const fields = {
    merchant_id, merchant_key,
    return_url: `${origin}/order-success.html?ref=${ref}`,
    cancel_url: `${origin}/order-cancelled.html`,
    notify_url: `${origin}/api/payfast-notify`,
    name_first: (buyer.name || '').slice(0, 100),
    email_address: (buyer.email || '').slice(0, 100),
    m_payment_id: ref,
    amount: total,
    item_name: (subs.length ? subs[0].item.name : `Aquarise order ${ref}`).slice(0, 100),
    item_description: summary.slice(0, 255)
  };
  if (subs.length) Object.assign(fields, { subscription_type: '1', recurring_amount: total, frequency: '3', cycles: '0' });   // monthly, until cancelled
  fields.signature = sign(fields, passphrase);
  res.status(200).json({ action: PROCESS_URL, fields });
}
