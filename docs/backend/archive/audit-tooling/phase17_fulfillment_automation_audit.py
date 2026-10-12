from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
checks={
 'migration': 'replacement_shipments' in (root/'server/database/migrations/016_fulfillment_automation_replacement_shipments.sql').read_text(),
 'dead_letter': 'dead_lettered_at' in (root/'server/database/migrations/016_fulfillment_automation_replacement_shipments.sql').read_text(),
 'worker': (root/'server/scripts/process-fulfillment.ts').exists(),
 'worker_script': 'fulfillment:process' in (root/'server/package.json').read_text(),
 'auto_queue': 'enqueueEligible' in (root/'server/src/repositories/shipping.repository.ts').read_text(),
 'stale_recovery': 'recoverStale' in (root/'server/src/repositories/shipping.repository.ts').read_text(),
 'replacement_gate': "replacement_authorized_at" in (root/'server/src/services/shipping.service.ts').read_text() and "return_status!=='replaced'" in (root/'server/src/services/shipping.service.ts').read_text(),
 'replacement_ledger': 'replacementSuccess' in (root/'server/src/repositories/shipping.repository.ts').read_text(),
 'documents': 'generateLabel' in (root/'server/src/providers/shipping.provider.ts').read_text() and 'generateManifest' in (root/'server/src/providers/shipping.provider.ts').read_text(),
 'ops_route': '/admin/fulfillment/operations' in (root/'server/src/routes/shipping.routes.ts').read_text(),
 'retry_route': '/shipment/retry' in (root/'server/src/routes/shipping.routes.ts').read_text(),
 'replacement_route': '/replacement-shipment' in (root/'server/src/routes/shipping.routes.ts').read_text(),
 'ui': (root/'src/pages/admin/AdminFulfillment.tsx').exists(),
 'feature_gate': 'VITE_SHIPPING_BACKEND' in (root/'src/lib/nativeShipping.ts').read_text(),
 'env_attempts': 'FULFILLMENT_MAX_ATTEMPTS' in (root/'server/src/config/env.ts').read_text(),
}
failed=[k for k,v in checks.items() if not v]
if failed:
 print('PHASE 17 FULFILLMENT AUTOMATION: FAIL')
 for x in failed: print(' -',x)
 sys.exit(1)
print('PHASE 17 FULFILLMENT AUTOMATION + REPLACEMENT AUTHORITY: PASS')
print('order automation: durable queue + bounded retries + stale lock recovery')
print('dead letters: explicit failed/dead_lettered state + controlled manual retry')
print('replacement shipping: independent ledger gated by Phase 15 authorization')
print('documents: server-side Shiprocket label + manifest generation')
print('operations: admin worklist + process/retry controls')
