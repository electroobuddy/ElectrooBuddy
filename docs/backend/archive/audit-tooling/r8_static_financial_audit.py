from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
issues=[]
for p in (root/"src").rglob("*"):
    if not p.is_file() or p.suffix not in {".ts",".tsx"}: continue
    t=p.read_text(errors="ignore")
    if '.from("orders").update(' in t or '.from("orders").delete(' in t:
        issues.append(f"direct order mutation: {p.relative_to(root)}")
    if '.from("order_refunds").insert(' in t or '.from("order_returns").insert(' in t:
        issues.append(f"direct financial workflow insert: {p.relative_to(root)}")
    if '.ilike("phone"' in t or '.ilike("email"' in t:
        if "bookings" in t: issues.append(f"public-style booking lookup candidate: {p.relative_to(root)}")
required=[
"supabase/functions/create-commerce-checkout/index.ts","supabase/functions/verify-commerce-payment/index.ts",
"supabase/functions/request-order-refund/index.ts","supabase/functions/process-return-resolution/index.ts",
"supabase/functions/process-fulfillment-queue/index.ts",
"supabase/migrations/20261001_r8_financial_state_machine_certification.sql"]
for x in required:
    if not (root/x).exists(): issues.append(f"missing: {x}")
print("R8 static financial audit")
print("PASS" if not issues else "FAIL")
for x in issues: print("-",x)
sys.exit(1 if issues else 0)
