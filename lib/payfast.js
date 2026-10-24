import crypto from 'node:crypto';

const SANDBOX = process.env.PAYFAST_SANDBOX !== 'false';   // sandbox unless explicitly switched off
export const PROCESS_URL = SANDBOX ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
export const VALIDATE_URL = SANDBOX ? 'https://sandbox.payfast.co.za/eng/query/validate' : 'https://www.payfast.co.za/eng/query/validate';

// PayFast's public sandbox test merchant; replaced by the real account through Vercel environment variables.
export const config = () => ({
  merchant_id: process.env.PAYFAST_MERCHANT_ID || '10000100',
  merchant_key: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
  passphrase: process.env.PAYFAST_PASSPHRASE || (SANDBOX ? 'jt7NOE43FZPn' : '')
});

// PayFast encoding: urlencode, spaces as "+", upper-case hex escapes.
const enc = v => encodeURIComponent(String(v).trim()).replace(/%20/g, '+').replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// Signature over the fields in the order given (PayFast requires the documented field order), empty values skipped.
export function sign(fields, passphrase) {
  let str = Object.entries(fields).filter(([k, v]) => k !== 'signature' && v !== '' && v != null).map(([k, v]) => `${k}=${enc(v)}`).join('&');
  if (passphrase) str += `&passphrase=${enc(passphrase)}`;
  return crypto.createHash('md5').update(str).digest('hex');
}
