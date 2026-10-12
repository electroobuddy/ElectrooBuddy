#!/usr/bin/env python3
"""Read-only A6 source configuration audit. Run from repository root."""
from pathlib import Path
import json, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
failures=[]
def check(label, condition, detail):
    print(f"{'PASS' if condition else 'FAIL'}  {label}: {detail}")
    if not condition: failures.append(label)
def read(p):
    f=root/p
    if not f.is_file(): failures.append(f'Missing {p}');print('FAIL  Missing',p);return ''
    return f.read_text(encoding='utf-8')
try:
    v=json.loads(read('vercel.json'))
except Exception as e:
    print('FAIL  vercel.json parse:',e);sys.exit(2)
proxy=read('api/v1/[...path].ts')
vite=read('vite.config.ts')
env=read('server/src/config/env.ts')
app=read('server/src/app.ts')
check('Vercel API function', 'API_ORIGIN' in proxy and '/api/v1/' in proxy, 'Proxy entrypoint and API_ORIGIN reference')
check('Proxy HTTPS in production', "url.protocol !== 'https:'" in proxy, 'Reject non-HTTPS upstream')
check('Proxy request size bound', '12 * 1024 * 1024' in proxy, '12 MiB request cap')
check('Frontend production build', v.get('buildCommand')=='npm run build' and v.get('outputDirectory')=='dist', 'Vite build and dist output')
check('SPA route fallback', any(x.get('destination')=='/index.html' for x in v.get('rewrites',[])), 'SPA rewrite')
check('Vite dev proxy', "proxy:" in vite and '/api/v1' in vite, 'Development API routing; requires local Express on port 3001')
check('Production URL validation', "production PUBLIC_APP_URL and PUBLIC_API_URL" in env, 'Server validates HTTPS app/API URLs')
check('Webhook raw body', "express.raw({ type: 'application/json'" in app, 'Raw Razorpay/fulfillment body')
check('Server env template', (root/'server/.env.example').is_file(), 'Server configuration template')
print(f'\nResult: {len(failures)} issue(s). Static checks only; no deployment accessed.')
sys.exit(1 if failures else 0)
