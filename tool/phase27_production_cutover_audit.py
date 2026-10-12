from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; passed=[]
def check(name,cond,detail=''):
    (passed if cond else errors).append((name,detail))

vercel=json.loads((ROOT/'vercel.json').read_text())
check('vercel_install_uses_npm_ci',vercel.get('installCommand')=='npm ci',str(vercel.get('installCommand')))
rewrites=json.dumps(vercel.get('rewrites',[]))
check('spa_rewrite_excludes_api','(?!api|' in rewrites,rewrites)
headers=json.dumps(vercel.get('headers',[]))
check('csp_allows_same_origin_api',"connect-src 'self'" in headers)
check('api_proxy_exists',(ROOT/'api/v1/[...path].ts').exists())
proxy=(ROOT/'api/v1/[...path].ts').read_text() if (ROOT/'api/v1/[...path].ts').exists() else ''
check('proxy_requires_api_origin','process.env.API_ORIGIN' in proxy)
check('proxy_https_in_production',"API_ORIGIN must use https in production" in proxy)
check('proxy_body_limit','12 * 1024 * 1024' in proxy)
check('proxy_preserves_set_cookie','getSetCookie' in proxy and "set-cookie" in proxy)
check('proxy_does_not_forward_host',"'host'" in proxy and 'HOP_BY_HOP' in proxy)

client=(ROOT/'src/lib/apiClient.ts').read_text()
check('frontend_defaults_same_origin_proxy',"VITE_API_BASE_URL || '/api/v1'" in client)
check('frontend_no_required_external_api_error','VITE_API_BASE_URL is required' not in client)
env=(ROOT/'.env.example').read_text()
check('frontend_env_same_origin','VITE_API_BASE_URL=/api/v1' in env)
check('legacy_backend_flags_removed', not re.search(r'VITE_[A-Z_]*BACKEND=', env))
check('api_origin_not_vite','VITE_API_ORIGIN' not in env)

server_env=(ROOT/'server/.env.example').read_text()
check('server_env_has_neon','DATABASE_URL=' in server_env and 'MIGRATION_DATABASE_URL=' in server_env)
check('server_env_has_explicit_cors','CORS_ORIGINS=' in server_env)
check('server_env_has_public_api_url','PUBLIC_API_URL=' in server_env)
check('server_env_has_webhook_secrets','RAZORPAY_WEBHOOK_SECRET=' in server_env and 'SHIPROCKET_WEBHOOK_TOKEN=' in server_env)
server_loader=(ROOT/'server/src/config/env.ts').read_text()
check('production_requires_https_urls','production PUBLIC_APP_URL and PUBLIC_API_URL must use non-local HTTPS URLs' in server_loader)
check('production_requires_db_ssl','DB_SSL must be true in production' in server_loader)
check('production_requires_trust_proxy','TRUST_PROXY must be at least 1 in production' in server_loader)
check('production_rejects_placeholder_jwt','JWT_ACCESS_SECRET still looks like a placeholder' in server_loader)
check('production_requires_https_cors','production CORS_ORIGINS must contain only non-local HTTPS origins' in server_loader)

pkg=json.loads((ROOT/'package.json').read_text())
check('phase27_audit_command',pkg.get('scripts',{}).get('audit:backend-phase27')=='python tool/phase27_production_cutover_audit.py')
check('phase27_live_command','certify:production:cutover' in pkg.get('scripts',{}))

# Secret hygiene across deployable frontend/config files.
secret_patterns=[r'postgres(?:ql)?://[^\s<]+:[^\s@<]+@',r'RAZORPAY_KEY_SECRET\s*=\s*\S+',r'FIREBASE_PRIVATE_KEY\s*=\s*-----BEGIN']
for rel in ['src','.env.example','vercel.json','api']:
    p=ROOT/rel
    files=[p] if p.is_file() else list(p.rglob('*')) if p.exists() else []
    for f in files:
        if not f.is_file() or f.suffix.lower() not in {'.ts','.tsx','.js','.json','.env','.example',''}: continue
        try:t=f.read_text(errors='ignore')
        except:continue
        for pat in secret_patterns:
            if re.search(pat,t): errors.append(('frontend_secret_hygiene',str(f.relative_to(ROOT))))

print('=== Phase 27 Production Cutover Audit ===')
for n,d in passed: print(f'PASS: {n}' + (f' — {d}' if d else ''))
for n,d in errors: print(f'FAIL: {n}' + (f' — {d}' if d else ''))
if errors:
    print(f'PHASE 27 PRODUCTION CUTOVER AUDIT: FAIL ({len(errors)})')
    sys.exit(1)
print(f'PHASE 27 PRODUCTION CUTOVER AUDIT: PASS ({len(passed)} checks)')
