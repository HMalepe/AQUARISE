import crypto from 'node:crypto';

// Sandbox is the default. Live PayFast is used only when PAYFAST_SANDBOX is exactly "false",
// and live mode refuses to run without every credential (including the passphrase).
// The passphrase is what makes the signature unforgeable: merchant_id and merchant_key are sent to the browser.
const SANDBOX_DEFAULTS = { merchant_id: '10000100', merchant_key: '46f0cd694581a', passphrase: 'jt7NOE43FZPn' };   // PayFast's published test merchant

export function loadConfig(env = process.env) {
  const sandbox = env.PAYFAST_SANDBOX !== 'false';
  const host = sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
  const urls = { processUrl: `https://${host}/eng/process`, validateUrl: `https://${host}/eng/query/validate` };
  if (sandbox) {
    return { sandbox, ...urls,
      merchant_id: env.PAYFAST_MERCHANT_ID || SANDBOX_DEFAULTS.merchant_id,
      merchant_key: env.PAYFAST_MERCHANT_KEY || SANDBOX_DEFAULTS.merchant_key,
      passphrase: env.PAYFAST_PASSPHRASE || SANDBOX_DEFAULTS.passphrase };
  }
  for (const name of ['PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE'])
    if (!env[name]) throw new Error(`${name} is required when PAYFAST_SANDBOX=false`);
  return { sandbox, ...urls, merchant_id: env.PAYFAST_MERCHANT_ID, merchant_key: env.PAYFAST_MERCHANT_KEY, passphrase: env.PAYFAST_PASSPHRASE };
}

// Fixed public origin for PayFast callbacks. Never derived from request headers.
export function siteUrl(env = process.env) {
  const u = new URL(env.SITE_URL || 'https://aquarise.co.za');
  if (u.protocol !== 'https:') throw new Error('SITE_URL must be an https URL');
  return u.origin;
}

// PayFast encoding: urlencode, spaces as "+", upper-case hex escapes.
const enc = v => encodeURIComponent(String(v).trim()).replace(/%20/g, '+').replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// Signature over the fields in the order given (PayFast requires the documented field order), empty values skipped.
export function sign(fields, passphrase) {
  let str = Object.entries(fields).filter(([k, v]) => k !== 'signature' && v !== '' && v != null).map(([k, v]) => `${k}=${enc(v)}`).join('&');
  if (passphrase) str += `&passphrase=${enc(passphrase)}`;
  return crypto.createHash('md5').update(str).digest('hex');
}
