from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
scan_files=[]
for base in ['src','public','server/src']:
    p=ROOT/base
    if p.exists(): scan_files += [x for x in p.rglob('*') if x.is_file() and x.suffix.lower() in {'.ts','.tsx','.js','.jsx','.json','.html','.css'}]
for rel in ['package.json','package-lock.json','vite.config.ts','vercel.json','index.html','.env.example','server/package.json','server/.env.example']:
    p=ROOT/rel
    if p.exists(): scan_files.append(p)
patterns=[
    (re.compile(r'@supabase/',re.I),'Supabase package dependency/import'),
    (re.compile(r'VITE_SUPABASE|SUPABASE_URL|SUPABASE_KEY|SUPABASE_ANON|SUPABASE_SERVICE',re.I),'Supabase environment variable'),
    (re.compile(r'https?://[^\\s\"\']*supabase\\.co|wss://[^\\s\"\']*supabase\\.co',re.I),'Supabase network endpoint'),
    (re.compile(r'createClient\s*\(',re.I),'provider client constructor'),
]
fail=[]
for f in sorted(set(scan_files)):
    try: text=f.read_text(encoding='utf-8')
    except UnicodeDecodeError: continue
    for rx,label in patterns:
        if rx.search(text): fail.append((f.relative_to(ROOT),label))
# Structural leftovers that should not ship in production
for rel in ['src/integrations/supabase','supabase','deno.json','deno.lock','tsconfig.deno.json','run_rpc_migration.sql','server/scripts/import-supabase-users.ts']:
    if (ROOT/rel).exists(): fail.append((Path(rel),'obsolete provider infrastructure still present'))
# package lock must not contain vendor family
lock=(ROOT/'package-lock.json').read_text(encoding='utf-8')
if '@supabase/' in lock.lower(): fail.append((Path('package-lock.json'),'Supabase transitive package remains'))
if fail:
    print('PHASE 24 ZERO-SUPABASE PRODUCTION AUDIT: FAIL')
    for f,label in fail: print(f' - {f}: {label}')
    sys.exit(1)
print('PHASE 24 ZERO-SUPABASE PRODUCTION AUDIT: PASS')
print(f' - scanned production files: {len(set(scan_files))}')
print(' - Supabase packages/imports: 0')
print(' - Supabase env variables/endpoints: 0')
print(' - Supabase runtime infrastructure: 0')
