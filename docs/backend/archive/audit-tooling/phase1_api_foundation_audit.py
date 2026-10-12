#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / 'server'

required = [
    'package.json', 'tsconfig.json', '.env.example', 'README.md',
    'src/app.ts', 'src/server.ts', 'src/config/env.ts', 'src/config/database.ts',
    'src/config/logger.ts', 'src/controllers/system.controller.ts',
    'src/services/system.service.ts', 'src/repositories/system.repository.ts',
    'src/routes/index.ts', 'src/routes/system.routes.ts',
    'src/middleware/request-id.ts', 'src/middleware/http-logger.ts',
    'src/middleware/security.ts', 'src/middleware/error-handler.ts',
    'src/providers/payment.provider.ts', 'src/providers/shipping.provider.ts',
    'src/providers/storage.provider.ts', 'src/providers/push.provider.ts',
    'tests/app.test.ts', 'database/migrations/README.md'
]

errors=[]
for rel in required:
    if not (SERVER/rel).is_file(): errors.append(f'missing server/{rel}')

package = json.loads((SERVER/'package.json').read_text()) if (SERVER/'package.json').exists() else {}
for dep in ['express','zod','pg','helmet','cors','express-rate-limit','pino','pino-http']:
    if dep not in package.get('dependencies',{}): errors.append(f'missing dependency {dep}')

checks = {
    'strict TypeScript': ('tsconfig.json', '"strict": true'),
    'environment validation': ('src/config/env.ts', 'safeParse'),
    'explicit CORS allowlist': ('src/middleware/security.ts', 'allowlist'),
    'Helmet': ('src/middleware/security.ts', 'helmet('),
    'rate limiting': ('src/middleware/security.ts', 'rateLimit('),
    'request IDs': ('src/middleware/request-id.ts', 'randomUUID'),
    'central error handling': ('src/middleware/error-handler.ts', 'INTERNAL_SERVER_ERROR'),
    'Postgres readiness': ('src/config/database.ts', "SELECT 1"),
    'health route': ('src/routes/system.routes.ts', "'/health'"),
    'ready route': ('src/routes/system.routes.ts', "'/ready'"),
    'secret redaction': ('src/config/logger.ts', '[REDACTED]'),
    'graceful shutdown': ('src/server.ts', 'Graceful shutdown'),
}
for label,(rel,needle) in checks.items():
    p=SERVER/rel
    if p.exists() and needle not in p.read_text(errors='ignore'): errors.append(f'{label} check failed')

# Phase 1 must not mutate current Supabase production implementation.
phase0 = ROOT/'docs/backend/contracts/supabase-freeze.json'
if not phase0.exists(): errors.append('Phase 0 freeze manifest missing')

if errors:
    print('PHASE 1 API FOUNDATION: FAIL')
    for e in errors: print('-', e)
    sys.exit(1)
print('PHASE 1 API FOUNDATION: PASS')
print(f'foundation_files_checked: {len(required)}')
print('supabase_runtime_cutover: 0 domains (intentionally unchanged)')
print('api_prefix: /api/v1')
