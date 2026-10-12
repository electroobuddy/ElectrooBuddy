from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
targets=[
 'src/lib/apiClient.ts','src/lib/apiContracts.ts','src/lib/nativeOrders.ts','src/lib/nativeRefunds.ts','src/lib/nativeReturns.ts',
 'src/lib/nativeCheckout.ts','src/lib/nativePayment.ts','src/lib/nativeBooking.ts','src/lib/nativeTechnician.ts','src/lib/nativeNotifications.ts',
 'src/lib/nativeSubscriptions.ts','src/lib/nativeAdminOperations.ts','src/lib/nativeCatalogAdmin.ts','src/lib/nativeShipping.ts'
]
issues=[]
for rel in targets:
 p=root/rel
 if not p.exists(): issues.append(f'MISSING {rel}'); continue
 text=p.read_text(encoding='utf-8')
 if re.search(r'\bany\b',text): issues.append(f'ANY {rel}')
 if rel.startswith('src/lib/native') and rel!='src/lib/nativePayment.ts' and 'nativeApiFetch<' not in text:
  issues.append(f'UNTYPED_FETCH {rel}')
contracts=(root/'src/lib/apiContracts.ts').read_text(encoding='utf-8')
required=['NativeOrder','NativeRefund','NativeReturn','NativeBooking','NativeTechnician','NativeNotification','NativeCheckoutResult','NativeAuthSession']
for name in required:
 if not re.search(rf'\b(?:interface|type)\s+{name}\b',contracts): issues.append(f'MISSING_CONTRACT {name}')
print(f'FAPI-2 typed-contract targets: {len(targets)}')
if issues:
 print('FAPI-2: FAIL')
 for i in issues: print(' -',i)
 sys.exit(1)
print('FAPI-2: PASS')
print('Targeted default-any occurrences: 0')
