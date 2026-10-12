#!/usr/bin/env python3
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'server/database/migrations/001_baseline.sql'
MANIFEST = ROOT / 'server/database/contracts/schema-manifest.json'
SUPA = ROOT / 'supabase/migrations'

errors=[]
if not BASE.exists(): errors.append('missing 001_baseline.sql')
if not MANIFEST.exists(): errors.append('missing schema-manifest.json')
if errors:
    print('\n'.join('FAIL '+x for x in errors)); sys.exit(1)

sql=BASE.read_text(encoding='utf-8')
manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
source_sql_migrations=len(list(SUPA.glob('*.sql')))
source_artifacts=len([p for p in SUPA.iterdir() if p.is_file()])
if source_sql_migrations != 77: errors.append(f'Supabase SQL migration freeze changed: {source_sql_migrations} != 77')
if source_artifacts != 78: errors.append(f'Supabase migration-directory artifact freeze changed: {source_artifacts} != 78')

created=set(re.findall(r'CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)\s*\(', sql, re.I))
for table in manifest['tables']:
    if table not in created: errors.append(f'missing portable table: {table}')
if len(manifest['tables']) != 46: errors.append('portable application table manifest must contain 46 tables')

for forbidden in [r'\bauth\.users\b', r'\bauth\.uid\s*\(', r'CREATE\s+POLICY', r'ENABLE\s+ROW\s+LEVEL\s+SECURITY', r'\bservice_role\b']:
    if re.search(forbidden, sql, re.I): errors.append(f'Supabase coupling in baseline: {forbidden}')

required=[
 'uq_bookings_user_request','uq_subscription_orders_user_request','uq_orders_user_checkout_request',
 'uq_active_full_refund_per_order','uq_benefit_usage_booking_type','uq_fulfillment_event_key',
 'accepted_quantity <= quantity','restocked_quantity <= accepted_quantity','refunded_amount <= total_amount',
 'CHECK (quantity > 0)','CHECK (inventory_quantity >= 0)'
]
for token in required:
    if token not in sql: errors.append(f'missing integrity invariant: {token}')

if sql.count('(') != sql.count(')'): errors.append('unbalanced parentheses in baseline')
if sql.count('$$') % 2: errors.append('unbalanced dollar quoting in baseline')
if not sql.lstrip().startswith('-- ElectrooBuddy portable PostgreSQL baseline'): errors.append('unexpected baseline header')
if 'BEGIN;' not in sql or 'COMMIT;' not in sql: errors.append('baseline must be transactional')

for required_file in [
 'docs/backend/PHASE2_PORTABLE_POSTGRES_BASELINE.md',
 'docs/backend/FINANCIAL_CONCURRENCY_RULES.md',
 'docs/backend/NEON_DATABASE_SETUP.md',
 'docs/backend/SUPABASE_TO_POSTGRES_DATA_MAP.md',
 'server/scripts/db-migrate.ts','server/scripts/db-status.ts','server/scripts/db-verify.ts'
]:
    if not (ROOT / required_file).exists(): errors.append(f'missing Phase 2 artifact: {required_file}')

if errors:
    for e in errors: print('FAIL', e)
    sys.exit(1)
print('PHASE 2 PORTABLE POSTGRES BASELINE: PASS')
print(f'source_supabase_migration_artifacts: {source_artifacts}')
print(f'source_supabase_sql_migrations: {source_sql_migrations}')
print(f'portable_application_tables: {len(manifest["tables"])}')
print(f'schema_tables_including_migration_ledger: {len(created)}')
print('supabase_runtime_cutover: 0 domains')
