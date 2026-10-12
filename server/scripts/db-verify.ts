import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sql = await readFile(resolve(process.cwd(), 'database/migrations/001_baseline.sql'), 'utf8');
const expected = [
  'users','user_roles','profiles','services','team_members','testimonials','projects','contact_messages','newsletter_subscribers',
  'product_categories','products','technicians','subscription_plans','subscription_orders','user_subscriptions','bookings',
  'booking_notifications','subscription_benefits_usage','coupons','shipping_zones','shipping_rates','tax_slabs','offers','offer_services',
  'offer_products','cart_items','shipping_addresses','orders','order_items','product_reviews','wishlist','fulfillment_jobs',
  'fulfillment_events','order_refunds','order_returns','order_return_items','return_events','notifications','notification_preferences',
  'push_subscriptions','notification_logs','site_settings','shipping_settings','audit_logs','rate_limit_tracker','public_form_rate_limits'
];

const failures: string[] = [];
for (const table of expected) {
  if (!new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+${table}\\s*\\(`, 'i').test(sql)) failures.push(`missing table ${table}`);
}
for (const forbidden of ['auth.users', 'auth.uid()', 'CREATE POLICY', 'ENABLE ROW LEVEL SECURITY', 'service_role', 'anon', 'authenticated']) {
  if (sql.includes(forbidden)) failures.push(`Provider-specific coupling remains: ${forbidden}`);
}
for (const invariant of [
  'uq_orders_user_checkout_request','uq_subscription_orders_user_request','uq_active_full_refund_per_order',
  'uq_benefit_usage_booking_type','uq_fulfillment_event_key','restocked_quantity <= accepted_quantity',
  'accepted_quantity <= quantity','refunded_amount <= total_amount'
]) {
  if (!sql.includes(invariant)) failures.push(`missing financial invariant ${invariant}`);
}

if (failures.length) {
  failures.forEach((failure) => process.stderr.write(`FAIL ${failure}\n`));
  process.exit(1);
}
process.stdout.write(`PORTABLE POSTGRES BASELINE: PASS\napplication_tables: ${expected.length}\n`);
