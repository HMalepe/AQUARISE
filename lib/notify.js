// PayFast Instant Transaction Notification (ITN). An order is marked paid only if:
// the signature verifies, PayFast confirms the ITN server-to-server, the merchant is ours,
// and the paid amount equals the amount stored when the order was created.
import { timingSafeEqual } from 'node:crypto';
import { loadConfig, sign } from './payfast.js';

export async function payfastValidate(raw, url, fetchImpl = globalThis.fetch) {
  try {
    const paramString = raw.split('&signature=')[0];
    const r = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: paramString });
    return (await r.text()).trim() === 'VALID';
  } catch { return false; }
}

const readStream = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });
const bodyString = async req => typeof req.body === 'string' ? req.body
  : (req.body && Object.keys(req.body).length ? new URLSearchParams(req.body).toString() : await readStream(req));
const toCents = s => /^\d+(\.\d{1,2})?$/.test(s ?? '') ? Math.round(parseFloat(s) * 100) : NaN;
const sameHex = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function makeNotify({ env = process.env, store, validate, log = console.log } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    let cfg;
    try { cfg = loadConfig(env); } catch (e) { log('itn: config error ' + e.message); return res.status(503).end(); }
    if (!store.enabled && !cfg.sandbox) { log('itn: order store not configured'); return res.status(503).end(); }   // 5xx makes PayFast retry

    const raw = await bodyString(req);
    const data = Object.fromEntries(new URLSearchParams(raw));
    const ref = data.m_payment_id;

    // Never log buyer details or the signature.
    const reject = reason => { log(JSON.stringify({ itn: ref ?? null, rejected: reason })); return res.status(400).end(); };

    if (!sameHex(sign(data, cfg.passphrase), data.signature)) return reject('bad signature');
    if (!ref || !data.pf_payment_id) return reject('missing ids');
    if (data.merchant_id !== cfg.merchant_id) return reject('merchant mismatch');
    const confirmed = await (validate ?? ((r, c) => payfastValidate(r, c.validateUrl)))(raw, cfg);
    if (!confirmed) return reject('payfast did not confirm');

    if (!store.enabled) { log(JSON.stringify({ itn: ref, status: data.payment_status, note: 'verified, not recorded (sandbox, no store)' })); return res.status(200).end(); }

    try {
      const order = await store.getOrder(ref);
      if (!order) { log(JSON.stringify({ itn: ref, note: 'unknown order ref' })); return res.status(200).end(); }

      const grossCents = toCents(data.amount_gross);
      const amountOk = grossCents === order.amount_cents;
      const status = data.payment_status;
      const isNew = await store.recordEvent({
        order_ref: ref, pf_payment_id: data.pf_payment_id, payment_status: status,
        amount_gross_cents: Number.isFinite(grossCents) ? grossCents : null,
        verified: amountOk, note: amountOk ? null : 'amount does not match order'
      });

      if (isNew && order.status !== 'paid') {
        if (!amountOk) await store.updateOrder(ref, { status: 'review' });
        else if (status === 'COMPLETE') await store.updateOrder(ref, { status: 'paid', paid_at: new Date().toISOString() });
        else if ((status === 'FAILED' || status === 'CANCELLED') && order.status === 'pending') await store.updateOrder(ref, { status: 'failed' });
      }
      log(JSON.stringify({ itn: ref, status, amountOk, duplicate: !isNew }));
      return res.status(200).end();
    } catch (e) {
      log(JSON.stringify({ itn: ref, error: e.message }));
      return res.status(500).end();   // PayFast retries on non-200
    }
  };
}
