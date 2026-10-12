from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; passed=[]
def check(name, cond, detail=''):
    (passed if cond else errors).append((name,detail))

env=(ROOT/'.env.example').read_text(errors='ignore')
check('frontend API base remains configured','VITE_API_BASE_URL=/api/v1' in env)
check('legacy backend env flags removed',not re.search(r'VITE_[A-Z_]*BACKEND=',env))

runtime_files=[]
for base in ['src','scripts']:
    p=ROOT/base
    if p.exists(): runtime_files += [f for f in p.rglob('*') if f.is_file() and f.suffix in {'.ts','.tsx','.js','.jsx'}]
runtime='\n'.join(f.read_text(errors='ignore') for f in runtime_files)
check('runtime has no backend selection env flags',not re.search(r'VITE_[A-Z_]*BACKEND',runtime))
check('runtime has no nativeReady migration gates',not re.search(r'\bnative[A-Za-z0-9_]*Ready\b',runtime))
check('runtime has no Supabase client calls',not re.search(r'\bsupabase\s*\.\s*(?:from|auth|storage|rpc|functions|channel)\b',runtime,re.S))

readme=(ROOT/'README.md').read_text(errors='ignore')
server_readme=(ROOT/'server/README.md').read_text(errors='ignore')
project=(ROOT/'PROJECT_REFERENCE.md').read_text(errors='ignore')
check('active README describes sole Express backend','sole runtime backend' not in readme or 'Express' in readme)
check('server README says Supabase bridge retired','Supabase import/cutover bridge has been retired' in server_readme)
check('project reference says no backend selection flag','no backend-selection feature flag' in project)

legacy=ROOT/'docs/backend/archive/legacy-cutover'
check('legacy cutover archive exists',legacy.exists())
check('phase3-21 docs archived',sum(1 for _ in legacy.glob('PHASE*_*.md')) >= 20)
check('legacy push guide archive exists',(ROOT/'docs/archive/legacy-supabase-guides').exists())

phase27=(ROOT/'tool/phase27_production_cutover_audit.py').read_text(errors='ignore')
check('phase27 no longer requires shipping backend flag','shipping_backend_explicit' not in phase27 and 'legacy_backend_flags_removed' in phase27)

print('=== FAPI-13 Migration Residue Audit ===')
for n,d in passed: print(f'PASS: {n}' + (f' — {d}' if d else ''))
for n,d in errors: print(f'FAIL: {n}' + (f' — {d}' if d else ''))
if errors:
    print(f'FAPI-13: FAIL ({len(errors)} failures)')
    sys.exit(1)
print(f'FAPI-13: PASS ({len(passed)}/{len(passed)} checks)')
