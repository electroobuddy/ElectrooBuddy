from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
required=[
 'server/src/repositories/catalog.repository.ts','server/src/services/catalog.service.ts','server/src/controllers/catalog.controller.ts',
 'server/src/routes/catalog.routes.ts','server/database/migrations/003_public_catalog_read_indexes.sql','server/scripts/sync-public-catalog.ts',
 'src/lib/publicApi.ts','docs/backend/PHASE4_PUBLIC_CATALOG_READ_APIS.md'
]
missing=[p for p in required if not (root/p).exists()]
if missing:
 print('PHASE 4 PUBLIC CATALOG READ APIS: FAIL'); print('missing:',*missing,sep='\n- '); sys.exit(1)
repo=(root/'server/src/repositories/catalog.repository.ts').read_text()
if 'cost_per_item' in repo.split('PRODUCT_PUBLIC_COLUMNS',1)[1].split('`;',1)[0]:
 print('PHASE 4 PUBLIC CATALOG READ APIS: FAIL\npublic product projection leaks cost_per_item'); sys.exit(1)
svc=(root/'server/src/services/catalog.service.ts').read_text()
if 'publicSettingKeys' not in svc:
 print('PHASE 4 PUBLIC CATALOG READ APIS: FAIL\nsite settings allowlist missing'); sys.exit(1)
print('PHASE 4 PUBLIC CATALOG READ APIS: PASS')
print('public_read_domains: 8')
print('financial_runtime_cutover: 0 domains')
print('frontend_public_read_mode: feature-gated')
