// POST /api/payfast-notify: PayFast's Instant Transaction Notification. Logic lives in lib/notify.js so it can be tested.
import { makeNotify } from '../lib/notify.js';
import { defaultStore } from '../lib/orders.js';

export default makeNotify({ store: defaultStore() });
