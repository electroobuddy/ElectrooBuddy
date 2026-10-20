import { loadEnv } from '../src/config/env.js';
import { createDatabaseClient } from '../src/config/database.js';
import pino from 'pino';

const env = loadEnv();
const logger = pino({ level: 'silent' });
const db = createDatabaseClient(env, logger);

const products = [
  {
    name: 'QA Test LED Bulb 9W',
    slug: 'qa-test-led-bulb-9w',
    description: 'E2E test product. Warm white 9W LED bulb. Safe to delete after testing.',
    price: 150,
    category: 'Lighting',
    sku: 'QA-LED-9W',
  },
  {
    name: 'QA Test Fan Regulator',
    slug: 'qa-test-fan-regulator',
    description: 'E2E test product. Stepless fan regulator. Safe to delete after testing.',
    price: 250,
    category: 'Accessories',
    sku: 'QA-FAN-REG',
  },
];

for (const p of products) {
  const r = await db.query(
    `INSERT INTO products (name, slug, description, short_description, sku, price, inventory_quantity, track_inventory, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,50,false,true)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [p.name, p.slug, p.description, 'QA test product', p.sku, p.price]
  );
  console.log(r.rows[0] ? `inserted ${p.slug} id=${r.rows[0].id}` : `already existed ${p.slug}`);
}

await db.close();
