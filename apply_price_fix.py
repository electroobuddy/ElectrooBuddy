from pathlib import Path
import sys, shutil, datetime

root = Path(sys.argv[1]) if len(sys.argv)>1 else Path.cwd()
target = root / "src/pages/admin/AdminProducts.tsx"
if not target.is_file():
    raise SystemExit(f"File not found: {target}")
text=target.read_text(encoding="utf-8")
old_tokens = ("product.price.toFixed(2)", "product.compare_at_price.toFixed(2)")
if not any(t in text for t in old_tokens):
    raise SystemExit("Expected code not found. File left unchanged; check local version.")
helper = """const formatProductPrice = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "—";
};

"""
if "const formatProductPrice =" not in text:
    marker="type Product = any;"
    if marker not in text:
        raise SystemExit("Could not find safe insertion point. File left unchanged.")
    text=text.replace(marker,marker+"\n\n"+helper,1)
text=text.replace("product.price.toFixed(2)", "formatProductPrice(product.price)")
text=text.replace("product.compare_at_price.toFixed(2)", "formatProductPrice(product.compare_at_price)")
backup = target.with_name(target.name+".bak-"+datetime.datetime.now().strftime("%Y%m%d%H%M%S"))
shutil.copy2(target,backup)
target.write_text(text,encoding="utf-8")
print(f"Patched {target}")
print(f"Backup: {backup}")
print("Run npm run build and test the admin product grid and list.")
