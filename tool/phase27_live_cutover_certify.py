import os,sys,json,urllib.request,urllib.error
checks=[]
def add(status,name,detail=''): checks.append((status,name,detail))
def get(url):
    req=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'ElectrooBuddy-Phase27-Certifier'})
    with urllib.request.urlopen(req,timeout=20) as r:
        return r.status,dict(r.headers),r.read().decode('utf-8','replace')
frontend=(os.getenv('PHASE27_FRONTEND_URL') or '').rstrip('/')
api=(os.getenv('PHASE27_API_ORIGIN') or '').rstrip('/')
if not frontend or not api:
    print('PHASE 27 LIVE CUTOVER: BLOCKED — set PHASE27_FRONTEND_URL and PHASE27_API_ORIGIN.')
    sys.exit(2)
if not frontend.startswith('https://') or not api.startswith('https://'):
    add('FAIL','https_required','Both production URLs must use https')
for name,url,expect_proxy in [
    ('frontend_proxy_health',frontend+'/api/v1/health',True),
    ('frontend_proxy_ready',frontend+'/api/v1/ready',True),
    ('direct_api_health',api+'/api/v1/health',False),
    ('direct_api_ready',api+'/api/v1/ready',False),
]:
    try:
        status,headers,body=get(url)
        payload=json.loads(body)
        ok=status==200 and payload.get('success') is True
        if expect_proxy:
            ok=ok and headers.get('x-electroobuddy-proxy')=='vercel'
        add('PASS' if ok else 'FAIL',name,f'{status}; proxy={headers.get("x-electroobuddy-proxy","none")}')
    except Exception as e:add('FAIL',name,str(e))
# SPA deep-link must resolve without swallowing API.
try:
    status,headers,body=get(frontend+'/products')
    add('PASS' if status==200 else 'FAIL','spa_deep_link',str(status))
except Exception as e:add('FAIL','spa_deep_link',str(e))
print('=== Phase 27 Live Production Cutover Certification ===')
for s,n,d in checks: print(f'{s}: {n}' + (f' — {d}' if d else ''))
f=[x for x in checks if x[0]=='FAIL']
if f:
    print(f'PHASE 27 LIVE CUTOVER: FAIL ({len(f)})');sys.exit(1)
print('PHASE 27 LIVE CUTOVER: PASS')
