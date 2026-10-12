from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
ROUTES = ROOT / 'server' / 'src' / 'routes'

PASS = []
FAIL = []

def check(name: str, ok: bool, detail: str = '') -> None:
    (PASS if ok else FAIL).append((name, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}{(': ' + detail) if detail else ''}")

def normalize_path(path: str) -> str:
    path = path.split('?', 1)[0]
    path = re.sub(r'/:[^/]+', '/:param', path)
    path = re.sub(r'//+', '/', path)
    return path.rstrip('/') or '/'

def extract_template(src: str, start: int):
    quote = src[start]
    if quote in "'\"":
        i = start + 1
        out = []
        while i < len(src):
            c = src[i]
            if c == '\\':
                if i + 1 < len(src): out.append(src[i+1]); i += 2; continue
            if c == quote:
                return ''.join(out), i + 1
            out.append(c); i += 1
        return None, start
    if quote != '`':
        return None, start
    i = start + 1
    out = []
    while i < len(src):
        c = src[i]
        if c == '\\':
            if i + 1 < len(src): out.append(src[i+1]); i += 2; continue
        if c == '`':
            return ''.join(out), i + 1
        if c == '$' and i + 1 < len(src) and src[i+1] == '{':
            j = i + 2; depth = 1; expr = []
            in_str = None
            while j < len(src) and depth:
                d = src[j]
                if in_str:
                    if d == '\\':
                        if j + 1 < len(src): expr.extend([d, src[j+1]]); j += 2; continue
                    if d == in_str: in_str = None
                    expr.append(d); j += 1; continue
                if d in "'\"`": in_str = d; expr.append(d); j += 1; continue
                if d == '{': depth += 1
                elif d == '}':
                    depth -= 1
                    if depth == 0: break
                expr.append(d); j += 1
            expr_text = ''.join(expr)
            # Query-only interpolation such as ${status ? `?status=...` : ''} does not change route identity.
            if '?' not in expr_text or out and out[-1].endswith('/'):
                out.append(':param')
            i = j + 1
            continue
        out.append(c); i += 1
    return None, start

def call_slice(src: str, open_paren: int) -> str:
    depth = 0; i = open_paren; in_str = None
    while i < len(src):
        c = src[i]
        if in_str:
            if c == '\\': i += 2; continue
            if c == in_str: in_str = None
            i += 1; continue
        if c in "'\"`": in_str = c; i += 1; continue
        if c == '(': depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0: return src[open_paren:i+1]
        i += 1
    return src[open_paren:]

def frontend_api_calls():
    calls = []
    for p in SRC.rglob('*'):
        if not p.is_file() or p.suffix not in {'.ts', '.tsx'} or '__tests__' in p.parts:
            continue
        text = p.read_text(encoding='utf-8', errors='ignore')
        pos = 0
        while True:
            idx = text.find('nativeApiFetch', pos)
            if idx < 0: break
            op = text.find('(', idx)
            if op < 0: break
            j = op + 1
            while j < len(text) and text[j].isspace(): j += 1
            if j >= len(text) or text[j] not in "'\"`": pos = op + 1; continue
            path, _ = extract_template(text, j)
            if path is None: pos = op + 1; continue
            call = call_slice(text, op)
            method_match = re.search(r"method\s*:\s*['\"]([A-Z]+)['\"]", call)
            method = method_match.group(1) if method_match else 'GET'
            calls.append((method, normalize_path(path), p.relative_to(ROOT).as_posix()))
            pos = op + len(call)
    return calls

def server_routes():
    routes = set()
    for p in ROUTES.glob('*.ts'):
        text = p.read_text(encoding='utf-8', errors='ignore')
        for m in re.finditer(r"\b(?:r|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]", text):
            routes.add((m.group(1).upper(), normalize_path(m.group(2))))
    return routes

calls = frontend_api_calls()
routes = server_routes()
unmatched = sorted({(m, p, f) for m, p, f in calls if (m, p) not in routes})
check('Frontend API calls map to Express route inventory', not unmatched,
      f'{len(calls)} calls checked, {len(unmatched)} unmatched' + (f' -> {unmatched[:8]}' if unmatched else ''))

# No runtime Supabase or backend migration switches.
prod_text = '\n'.join(
    p.read_text(encoding='utf-8', errors='ignore')
    for p in SRC.rglob('*') if p.is_file() and p.suffix in {'.ts', '.tsx'} and '__tests__' not in p.parts
)
check('No runtime Supabase imports/calls', not re.search(r'@supabase/|createClient\s*\(|supabase\.(?:from|rpc|functions|auth|storage)', prod_text))
check('No migration-era VITE backend switches', not re.search(r'VITE_[A-Z0-9_]*BACKEND', prod_text))
check('No production dummy/mock business data markers', not re.search(r'DummyAnimatedCounter|COUNTER_DATA|dummy data for demonstration|mock business data|fixture business data', prod_text, re.I))

# Retired static business-data files must not survive as fallback authority.
retired = ['src/data/services.ts','src/data/team.ts','src/data/projects.ts','src/data/testimonials.ts']
check('Retired static business fallback files removed', all(not (ROOT / x).exists() for x in retired), ', '.join(retired))

# Contact authority should flow from site settings on secondary customer surfaces.
contact_files = [
    'src/pages/Privacy.tsx', 'src/pages/Terms.tsx', 'src/pages/OrderSuccess.tsx',
    'src/pages/BookingForm.tsx', 'src/components/ServiceCard.tsx',
    'src/pages/user/UserOrders.tsx', 'src/utils/generateBookingInvoice.ts'
]
missing_site_settings = []
for rel in contact_files:
    text = (ROOT / rel).read_text(encoding='utf-8', errors='ignore')
    if not ('useSiteSettings' in text or 'getSiteSettingsCached' in text):
        missing_site_settings.append(rel)
check('Customer contact/receipt surfaces use API-backed site settings', not missing_site_settings,
      f'{len(contact_files)} checked' + (f', missing: {missing_site_settings}' if missing_site_settings else ''))

# Shared API client and query/session boundaries.
api_client = (ROOT / 'src/lib/apiClient.ts').read_text(encoding='utf-8', errors='ignore')
check('Shared API client owns fetch transport', 'fetch(' in api_client and 'nativeApiFetch' in api_client)
query_client = (ROOT / 'src/lib/queryClient.ts').read_text(encoding='utf-8', errors='ignore')
check('Unified TanStack Query client present', 'new QueryClient' in query_client)
auth_hook = (ROOT / 'src/hooks/useAuth.tsx').read_text(encoding='utf-8', errors='ignore')
check('Auth boundaries clear private query cache', 'clearPrivateQueryCache' in auth_hook or 'clearPrivate' in auth_hook or 'queryClient.removeQueries' in auth_hook)

# Integration suite inventory from FAPI-16.
integration_dir = ROOT / 'src/lib/__tests__/integration'
test_files = list(integration_dir.glob('*.test.ts')) + list(integration_dir.glob('*.test.tsx'))
test_count = 0
for p in test_files:
    test_count += len(re.findall(r'\b(?:it|test)\s*\(', p.read_text(encoding='utf-8', errors='ignore')))
check('Frontend/API integration suite retained', len(test_files) >= 6 and test_count >= 20,
      f'{len(test_files)} suites / {test_count} tests')

# Final scripts contract.
pkg = json.loads((ROOT / 'package.json').read_text())
scripts = pkg.get('scripts', {})
check('FAPI-17 audit script registered', scripts.get('audit:fapi17') == 'python tool/fapi17_final_frontend_api_certification.py')
check('Final certification command registered', 'certify:fapi17' in scripts)

print(f'\nFAPI-17 FINAL FRONTEND API CERTIFICATION: {len(PASS)}/{len(PASS)+len(FAIL)} PASS')
if FAIL:
    raise SystemExit(1)
