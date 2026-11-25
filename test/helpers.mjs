// Test helpers: an in-memory store with the same interface as lib/orders.js, and a minimal req/res.
import { sign } from '../lib/payfast.js';

export class MemoryStore {
  enabled = true;
  failing = false;
  orders = new Map();
  events = [];
  #guard() { if (this.failing) throw new Error('store down'); }
  async insertOrder(o) {
    this.#guard();
    if (this.orders.has(o.ref)) throw new Error('duplicate ref');
    this.orders.set(o.ref, { status: 'pending', paid_at: null, ...o });
  }
  async getOrder(ref) { this.#guard(); return this.orders.get(ref) ?? null; }
  async recordEvent(e) {
    this.#guard();
    if (this.events.some(x => x.order_ref === e.order_ref && x.pf_payment_id === e.pf_payment_id)) return false;
    this.events.push(e); return true;
  }
  async updateOrder(ref, patch) { this.#guard(); Object.assign(this.orders.get(ref), patch); }
}

export async function call(handler, { method = 'POST', headers = { host: 'attacker.example' }, body } = {}) {
  let status = 200, json, ended = false;
  const res = {
    status(c) { status = c; return this; },
    json(o) { json = o; ended = true; return this; },
    end() { ended = true; return this; },
  };
  await handler({ method, headers, body }, res);
  return { status, json, ended };
}

export const SANDBOX_ENV = {};
export const LIVE_ENV = {
  PAYFAST_SANDBOX: 'false', PAYFAST_MERCHANT_ID: '555', PAYFAST_MERCHANT_KEY: 'key', PAYFAST_PASSPHRASE: 'pass',
  SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test',
};

// Build an ITN body the way PayFast does: ordered fields, signature last.
export function itn(fields, passphrase) {
  const ordered = {
    m_payment_id: 'AQTEST', pf_payment_id: '1001', payment_status: 'COMPLETE', item_name: 'Aquarise order',
    amount_gross: '78.00', amount_fee: '-2.00', amount_net: '76.00',
    name_first: 'Buyer', email_address: 'buyer@example.com', merchant_id: '10000100', ...fields,
  };
  const signature = sign(ordered, passphrase);
  return new URLSearchParams({ ...ordered, signature }).toString();
}
