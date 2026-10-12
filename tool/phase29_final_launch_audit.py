from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok,detail=''): checks.append((name,bool(ok),detail))

def text(p): return p.read_text(encoding='utf-8') if p.exists() else ''

pkg=json.loads(text(ROOT/'package.json'))
spkg=json.loads(text(ROOT/'server/package.json'))
manifest=json.loads(text(ROOT/'server/database/contracts/migration-checksums.json'))

check('phase29 live certifier exists',(ROOT/'server/scripts/phase29-launch-certify.ts').exists())
check('phase29 windows runner exists',(ROOT/'tool/phase29_launch_certify.ps1').exists())
check('phase29 runbook exists',(ROOT/'docs/backend/PHASE29_FINAL_LAUNCH_CERTIFICATION.md').exists())
check('phase29 go-no-go template exists',(ROOT/'PHASE29_GO_NO_GO_REPORT.md').exists())
check('root audit script wired',pkg.get('scripts',{}).get('audit:backend-phase29')=='python tool/phase29_final_launch_audit.py')
check('root final launch script wired','phase29:live' in pkg.get('scripts',{}).get('certify:launch',''))
check('server live launch script wired','phase29-launch-certify.ts' in spkg.get('scripts',{}).get('phase29:live',''))
check('migration count remains 22',manifest.get('count')==22 and len(manifest.get('migrations',[]))==22)

live=text(ROOT/'server/scripts/phase29-launch-certify.ts')
for token,label in [
 ('migration_chain_immutable','migration checksum gate'),
 ('worker_freshness','worker freshness gate'),
 ('worker_failures_24h','worker failure gate'),
 ('backup_evidence','backup evidence gate'),
 ('restore_drill_evidence','restore evidence gate'),
 ('forged_razorpay_webhook_rejected','Razorpay forged webhook gate'),
 ('forged_shiprocket_webhook_rejected','Shiprocket forged webhook gate'),
 ('x-electroobuddy-proxy','Vercel proxy header gate'),
 ('PHASE29_REQUIRED_PROVIDERS','required provider gate'),
]: check(label,token in live)

worker_names=['checkout-expiry','payment-reconciliation','refund-reconciliation','shipment-sync','fulfillment-queue','notification-delivery','subscription-reconciliation']
for name in worker_names: check(f'worker {name} included',name in live)

app=text(ROOT/'server/src/app.ts')
check('Razorpay webhook uses raw body',"/webhooks/razorpay" in app and 'express.raw' in app)
check('fulfillment webhook uses raw body',"/webhooks/fulfillment" in app and 'express.raw' in app)
pay=text(ROOT/'server/src/providers/razorpay-payment.provider.ts')
ship=text(ROOT/'server/src/services/shipping.service.ts')
check('Razorpay webhook constant-time signature validation','timingSafeEqual' in pay and 'RAZORPAY_WEBHOOK_SECRET' in pay)
check('Shiprocket webhook constant-time token validation','timingSafeEqual' in ship and 'SHIPROCKET_WEBHOOK_TOKEN' in ship)

env=text(ROOT/'server/src/config/env.ts')
for key in ['DATABASE_URL','DB_SSL','JWT_ACCESS_SECRET','RAZORPAY_WEBHOOK_SECRET','SHIPROCKET_WEBHOOK_TOKEN','FIREBASE_PRIVATE_KEY','OPS_ALERT_WEBHOOK_URL']:
    check(f'production env contract {key}',key in env)
check('production HTTPS fail-fast','production PUBLIC_APP_URL and PUBLIC_API_URL must use non-local HTTPS URLs' in env)
check('production SMTP fail-fast',"production AUTH_DELIVERY_MODE must be smtp" in env)

vercel=text(ROOT/'vercel.json')
proxy=text(ROOT/'api/v1/[...path].ts')
check('same-origin API proxy configured',(ROOT/'api/v1/[...path].ts').exists() and '(?!api|' in vercel)
check('proxy requires API_ORIGIN','API_ORIGIN' in proxy)
check('proxy marks responses','x-electroobuddy-proxy' in proxy)

for old in ['@supabase/supabase-js','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY']:
    check(f'zero Supabase runtime residue: {old}',old not in text(ROOT/'package.json') and old not in text(ROOT/'.env.example'))

failed=[x for x in checks if not x[1]]
for name,ok,detail in checks: print(('PASS' if ok else 'FAIL'),name,detail)
print(f'PHASE 29 STATIC LAUNCH READINESS: {len(checks)-len(failed)}/{len(checks)} checks PASS')
if failed: sys.exit(1)
print('PHASE 29 FINAL LAUNCH READINESS: PASS')
