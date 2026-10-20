// Smoke test for POST /public/bookings (guest flow). Safe output: prints only ids/statuses.
// Requires the dev API on localhost:3001. Each scenario uses a fresh phone to stay under the per-phone caps.
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
const newPhone = () => '9' + String(Math.floor(Math.random() * 900000000) + 100000000);

const payload = (over: Record<string, unknown> = {}) => ({
  requestId: crypto.randomUUID(),
  serviceId: svc.id,
  name: 'Smoke Guest',
  phone: newPhone(),
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

let ipSeq = 0;
// trust proxy=1 → req.ip follows X-Forwarded-For. Rotate per scenario so the 5/15min limiter can't mask results.
const nextIp = () => `10.9.${ipSeq >> 8 & 255}.${ipSeq++ & 255}`;

async function post(label: string, body: unknown, ip = nextIp()) {
  const r = await fetch(`${base}/public/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => null)) as any;
  const out = { id: j?.data?.id, status: j?.data?.status, code: j?.error?.code, fields: j?.error?.fields, idem: j?.data?.idempotent, token: j?.data?.tracking_token ? 'present' : 'absent' };
  console.log(label.padEnd(15), '→', r.status, JSON.stringify(out));
  return { status: r.status, body: j };
}

const legacy = await fetch(`${base}/guest/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextIp() }, body: JSON.stringify(payload()) });
console.log('legacy route    →', legacy.status, '(expect 404 — old endpoint must be gone)');

const reqId = crypto.randomUUID();
const phone = newPhone();
const first = await post('valid         ', payload({ requestId: reqId, phone }));
const again = await post('retry-same-id ', payload({ requestId: reqId, phone }));
await post('duplicate     ', payload({ phone, requestId: crypto.randomUUID() }));
await post('honeypot      ', payload({ website: 'http://spam.example', requestId: crypto.randomUUID() }));
await post('too-fast      ', payload({ formTs: Date.now(), requestId: crypto.randomUUID() }));
await post('stale formTs  ', payload({ formTs: Date.now() - 3 * 60 * 60 * 1000, requestId: crypto.randomUUID() }));
await post('bad time      ', payload({ preferredTime: '24:99', requestId: crypto.randomUUID() }));
await post('email present ', payload({ email: 'Smoke.Guest@Example.com', requestId: crypto.randomUUID() }));
await post('custom svc    ', payload({ serviceId: null, isCustomService: true, customServiceDemand: 'Replace the old MCB board and add two new light points in the kitchen', requestId: crypto.randomUUID() }));

// Same-IP burst: limiter default is 5/15min, so request #6 from one IP must be 429.
const burstIp = nextIp();
for (let i = 0; i < 6; i++) await post(`burst #${i + 1}    `, payload({ requestId: crypto.randomUUID() }), burstIp);

console.log('retry same id + re-derived token:', again.body?.data?.id === first.body?.data?.id && !!again.body?.data?.tracking_token);
