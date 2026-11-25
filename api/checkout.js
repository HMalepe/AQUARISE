// POST /api/checkout. Logic lives in lib/checkout.js so it can be tested.
import { makeCheckout } from '../lib/checkout.js';
import { defaultStore } from '../lib/orders.js';

export default makeCheckout({ store: defaultStore() });
