// POST /api/payfast-notify  — PayFast's Instant Transaction Notification (ITN).
// Verifies the signature and confirms the payment with PayFast before treating it as paid.
import { VALIDATE_URL, config, sign } from '../lib/payfast.js';

const readBody = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = typeof req.body === 'string' ? req.body : (req.body && Object.keys(req.body).length ? new URLSearchParams(req.body).toString() : await readBody(req));
  const data = Object.fromEntries(new URLSearchParams(raw));
  const { passphrase } = config();
  const signatureOk = sign(data, passphrase) === data.signature;
  let validOk = false;
  try {
    const paramString = raw.split('&signature=')[0];
    const r = await fetch(VALIDATE_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: paramString });
    validOk = (await r.text()).trim() === 'VALID';
  } catch (e) { console.error('payfast validate failed', e); }
  const paid = signatureOk && validOk && data.payment_status === 'COMPLETE';
  // TODO when going live: save the order (Supabase / Google Sheet), email the customer and the team, book the courier.
  res.status(200).end();   // acknowledge after checks: Vercel may stop the function once it has responded
  console.log(JSON.stringify({ itn: data.m_payment_id, status: data.payment_status, amount: data.amount_gross, signatureOk, validOk, paid, email: data.email_address }));
}
