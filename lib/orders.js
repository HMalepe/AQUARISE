// Order storage on Supabase, via its REST API with the service-role key. Server-side only.
// Tables: orders, order_events (supabase/migrations). No dependencies: plain fetch.

export function createStore(env = process.env, fetchImpl = globalThis.fetch) {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { enabled: false };
  const base = new URL(url);
  if (base.protocol !== 'https:') throw new Error('SUPABASE_URL must be an https URL');

  const baseHeaders = { apikey: key, 'content-type': 'application/json' };
  if (!key.startsWith('sb_secret_')) baseHeaders.authorization = `Bearer ${key}`;   // legacy JWT keys also go in Authorization

  async function rest(table, { method = 'GET', params, body, prefer } = {}) {
    const u = new URL(`/rest/v1/${table}`, base);
    for (const [k, v] of Object.entries(params ?? {})) u.searchParams.set(k, v);
    const res = await fetchImpl(u.toString(), {
      method,
      headers: prefer ? { ...baseHeaders, prefer } : { ...baseHeaders },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Supabase ${method} ${table} failed (${res.status})`);   // never include the key or response body
    return res;
  }

  return {
    enabled: true,
    async insertOrder(order) { await rest('orders', { method: 'POST', body: order, prefer: 'return=minimal' }); },
    async getOrder(ref) {
      const rows = await (await rest('orders', { params: { ref: `eq.${ref}`, select: '*', limit: '1' } })).json();
      return rows[0] ?? null;
    },
    // Insert-or-ignore on (order_ref, pf_payment_id). Resolves true if the event was new.
    async recordEvent(event) {
      const res = await rest('order_events', { method: 'POST', params: { on_conflict: 'order_ref,pf_payment_id' }, body: event, prefer: 'resolution=ignore-duplicates,return=representation' });
      return (await res.json()).length > 0;
    },
    async updateOrder(ref, patch) { await rest('orders', { method: 'PATCH', params: { ref: `eq.${ref}` }, body: patch, prefer: 'return=minimal' }); }
  };
}

// For the Vercel functions: a bad Supabase config disables storage (and live mode then fails closed) instead of crashing on import.
export function defaultStore() {
  try { return createStore(); } catch (e) { console.error('orders: ' + e.message); return { enabled: false }; }
}
