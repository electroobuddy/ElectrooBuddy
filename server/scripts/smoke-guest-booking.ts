// One-off smoke test for POST /public/bookings (guest flow). Safe output: prints only ids/statuses.
import { loadEnv } from '../src/config/env.js';
import { createDatabaseClient } from '../src/config/database.js';
import { pino } from 'pino';

const env = loadEnv();
const db = createDatabaseClient(env, pino({ level: 'silent' }));
const svc = (await db.query(`SELECT id, title FROM services WHERE book_now_enabled = true ORDER BY sort_order LIMIT 1`)).rows[0];
await db.close();
if (!svc) { console.error('No bookable service found'); process.exit(1); }

const base = `${process.env.SMOKE_API || 'http://localhost:3001'}${env.API_PREFIX}`;
const ist = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 86400000));
const phone = '9000000' + String(Math.floor(Math.random() * 900) + 100);
const sharedRequestId = crypto.randomUUID();

const payload = (over = {}) => ({
  requestId: sharedRequestId,
  serviceId: svc.id,
  name: 'Smoke Guest',
  phone,
  email: null,
  address: '42 Test Smoke Street, QA Colony, Hyderabad 500001',
  preferredDate: ist,
  preferredTime: '11:00',
  description: null,
  website: '',
  formTs: Date.now() - 5000,
  captchaToken: null,
  ...over,
});

async function post(label, body) {
  const r = await fetch(`${base}/public/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => null);
  console.log(label, '→', r.status, JSON.stringify({ id: j?.data?.id, status: j?.data?.status, code: j?.error?.code, idem: j?.data?.idempotent, token: j?.data?.tracking_token ? 'present' : (j?.data?.id ? 'absent' : 'n/a') }));
  return { status: r.status, body: j };
}

// 1. fresh guest booking → 201 + tracking token
const first = await post('valid         ', payload());
// 2. exact retry (same phone + requestId) → idempotent replay of same id
const again = await post('idempotent    ', payload());
// 3. same phone+service+date, new requestId → 409 duplicate
await post('duplicate     ', payload({ requestId: crypto.randomUUID() }));
// 4. honeypot filled → fake success with random id, no DB row
const honeypot = await post('honeypot      ', payload({ website: 'http://spam.example', requestId: crypto.randomUUID() }));
// 5. instant bot submit (formTs=now) → fake success
const fast = await post('too-fast      ', payload({ formTs: Date.now(), requestId: crypto.randomUUID() }));
console.log('idempotent same id:', again.body?.data?.id === first.body?.data?.id);
console.log('honeypot fabricated (differs from real):', honeypot.body?.data?.id !== first.body?.data?.id);
console.log('too-fast fabricated:', fast.body?.data?.tracking_token == null);
