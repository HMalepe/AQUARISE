// Server-side price list: the source of truth for what a customer is charged.
// Keep in sync with PRODUCTS / EXTRAS in js/main.js (those are only for display).
export const ITEMS = {
  'still-500':     { name: 'Still 500ml',               price: 18 },
  'still-1l':      { name: 'Still 1L',                  price: 29 },
  'sparkling-500': { name: 'Sparkling 500ml',           price: 24 },
  'mineral-750':   { name: 'Mineral+ 750ml',            price: 32 },
  'glass-750':     { name: 'Glass 750ml',               price: 45 },
  'ritual-24':     { name: 'Daily Ritual · 24 × 500ml', price: 289 },
  // PayFast subscriptions bill monthly at most often, so the weekly plan is 4 weekly deliveries billed monthly.
  'sub-weekly':    { name: 'Never Run Dry · weekly (4 deliveries, billed monthly)', price: 996, subscription: true },
  'sub-monthly':   { name: 'Never Run Dry · monthly',   price: 899, subscription: true }
};
export const FREE_SHIP = 350, DELIVERY_FEE = 60;
