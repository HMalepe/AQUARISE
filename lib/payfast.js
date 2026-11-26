import crypto from 'node:crypto';

// Production (Vercel's production deployment) always takes real money, and only with the account's own keys.
// Previews and local runs use PayFast's sandbox. Production never falls back to the public test merchant.
const ON_PRODUCTION = process.env.VERCEL_ENV === 'production';
const SANDBOX = ON_PRODUCTION ? false : process.env.PAYFAST_SANDBOX !== 'false';
export const PROCESS_URL = SANDBOX ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
export const VALIDATE_URL = SANDBOX ? 'https://sandbox.payfast.co.za/eng/query/validate' : 'https://www.payfast.co.za/eng/query/validate';

// PayFast's public sandbox test merchant: used for local and preview runs only.
const TEST = { merchant_id: '10000100', merchant_key: '46f0cd694581a', passphrase: 'jt7NOE43FZPn' };

export class PayfastConfigError extends Error {}

// Throws on production unless all three keys are set, so a missing variable can never send a customer to the test merchant.
export const config = () => {
  if (ON_PRODUCTION) {
    const merchant_id = process.env.PAYFAST_MERCHANT_ID, merchant_key = process.env.PAYFAST_MERCHANT_KEY, passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!merchant_id || !merchant_key || !passphrase) throw new PayfastConfigError('PayFast keys are not set on production');
    return { merchant_id, merchant_key, passphrase };
  }
  return {
    merchant_id: process.env.PAYFAST_MERCHANT_ID || TEST.merchant_id,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY || TEST.merchant_key,
    passphrase: process.env.PAYFAST_PASSPHRASE || (SANDBOX ? TEST.passphrase : '')
  };
};

// PayFast encoding: urlencode, spaces as "+", upper-case hex escapes.
const enc = v => encodeURIComponent(String(v).trim()).replace(/%20/g, '+').replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// Signature over the fields in the order given (PayFast requires the documented field order), empty values skipped.
export function sign(fields, passphrase) {
  let str = Object.entries(fields).filter(([k, v]) => k !== 'signature' && v !== '' && v != null).map(([k, v]) => `${k}=${enc(v)}`).join('&');
  if (passphrase) str += `&passphrase=${enc(passphrase)}`;
  return crypto.createHash('md5').update(str).digest('hex');
}
