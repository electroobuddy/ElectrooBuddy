#!/usr/bin/env python3
"""Dependency-free post-patch source guard. Run from repository root."""
from pathlib import Path
import sys

root = Path.cwd()
files = {
    'payments': root/'server/src/services/payment.service.ts',
    'cart': root/'server/src/repositories/cart.repository.ts',
    'booking': root/'server/src/routes/booking.routes.ts',
    'auth': root/'server/src/middleware/auth.ts',
}
missing = [str(p) for p in files.values() if not p.is_file()]
if missing:
    sys.exit('Missing repository files: '+', '.join(missing))
source = {k:p.read_text(encoding='utf-8') for k,p in files.items()}
checks = {
    'captured payment required': "payment.status!=='captured' || payment.captured!==true" in source['payments'],
    'reconciliation captured-only': "p.status==='captured' && p.captured===true" in source['payments'],
    'cart product first': source['cart'].find('const lookup=await tx.query(`SELECT product_id FROM cart_items') < source['cart'].find('const p=await this.lockProduct(lookup.rows[0].product_id,tx)') < source['cart'].find('const row=await tx.query(`SELECT c.id,c.product_id') and 'const lookup=await tx.query(`SELECT product_id FROM cart_items' in source['cart'],
    'cart owner scoped': 'WHERE c.user_id=$1' in source['cart'],
    'admin booking role guard': "requireRole('admin')" in source['booking'],
    'technician role guard': "requireRole('technician')" in source['booking'],
    'booking still authenticated until guest flow designed': "r.post('/bookings',auth,requirePermission('bookings:write'),c.create)" in source['booking'],
    'server-side session role reload': 'getActiveSessionRoles' in source['auth'],
}
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' ' + name)
if not all(checks.values()):
    sys.exit(1)
print('Static source checks passed. This is not a runtime or concurrency test.')
