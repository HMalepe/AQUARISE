// POST /api/checkout  { cart: { id: qty }, buyer?: { email, name } }
// Prices are recalculated here from lib/catalogue.js, never trusted from the browser. The order is stored as
// "pending" before the signed PayFast form is returned, so the notify handler can verify the paid amount against it.
import { randomBytes } from 'node:crypto';
import { priceCart } from './cart.js';
import { loadConfig, siteUrl, sign } from './payfast.js';

const UNAVAILABLE = 'Checkout is temporarily unavailable. WhatsApp or email hello@aquarise.co.za to order.';
const str = (v, n) => String(v ?? '').trim().slice(0, n);

export function makeCheckout({ env = process.env, store, log = console.error } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return res.status(400).json({ error: 'Invalid request.' }); }

    const priced = priceCart(body);
    if (priced.error) return res.status(400).json({ error: priced.error });

    let cfg, origin;
    try { cfg = loadConfig(env); origin = siteUrl(env); }
    catch (e) { log('checkout config error: ' + e.message); return res.status(503).json({ error: UNAVAILABLE }); }
    if (!store.enabled && !cfg.sandbox) { log('checkout: order store not configured'); return res.status(503).json({ error: UNAVAILABLE }); }

    const ref = 'AQ' + randomBytes(6).toString('hex').toUpperCase();
    const buyer = body.buyer && typeof body.buyer === 'object' ? body.buyer : {};
    const total = (priced.totalCents / 100).toFixed(2);

    if (store.enabled) {
      try {
        await store.insertOrder({
          ref, status: 'pending', amount_cents: priced.totalCents, currency: 'ZAR', items: priced.lines,
          is_subscription: priced.isSubscription, buyer_name: str(buyer.name, 100) || null, buyer_email: str(buyer.email, 100) || null
        });
      } catch (e) { log('checkout: could not store order: ' + e.message); return res.status(503).json({ error: UNAVAILABLE }); }
    }

    const summary = priced.lines.map(l => `${l.qty}× ${l.name}`).join(', ') + (priced.deliveryCents ? `, delivery R${priced.deliveryCents / 100}` : '');
    // Field order matters for the signature: it follows PayFast's documented order.
    const fields = {
      merchant_id: cfg.merchant_id, merchant_key: cfg.merchant_key,
      return_url: `${origin}/order-success.html?ref=${ref}`,
      cancel_url: `${origin}/order-cancelled.html`,
      notify_url: `${origin}/api/payfast-notify`,
      name_first: str(buyer.name, 100),
      email_address: str(buyer.email, 100),
      m_payment_id: ref,
      amount: total,
      item_name: (priced.isSubscription ? priced.lines[0].name : `Aquarise order ${ref}`).slice(0, 100),
      item_description: summary.slice(0, 255)
    };
    if (priced.isSubscription) Object.assign(fields, { subscription_type: '1', recurring_amount: total, frequency: '3', cycles: '0' });   // monthly, until cancelled
    fields.signature = sign(fields, cfg.passphrase);
    res.status(200).json({ action: cfg.processUrl, fields });
  };
}
