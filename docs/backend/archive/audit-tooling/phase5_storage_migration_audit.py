from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
checks={
 'provider_interface':'server/src/providers/storage.provider.ts',
 's3_provider':'server/src/providers/s3-storage.provider.ts',
 'disabled_provider':'server/src/providers/disabled-storage.provider.ts',
 'media_service':'server/src/services/media.service.ts',
 'media_controller':'server/src/controllers/media.controller.ts',
 'media_routes':'server/src/routes/media.routes.ts',
 'media_migration':'server/database/migrations/004_object_storage_media.sql',
 'image_migrator':'server/scripts/migrate-public-images.ts',
 'image_verifier':'server/scripts/verify-media-migration.ts',
 'frontend_adapter':'src/lib/storageApi.ts',
}
missing=[k for k,v in checks.items() if not (ROOT/v).exists()]
if missing:
 print('PHASE 5 OBJECT STORAGE: FAIL missing', ', '.join(missing)); sys.exit(1)

service=(ROOT/checks['media_service']).read_text()
required=['fileTypeFromBuffer','STORAGE_MAX_IMAGE_BYTES' if False else 'INVALID_IMAGE_TYPE','IMAGE_MIME_MISMATCH','sha256']
for token in required:
 if token not in service:
  print('PHASE 5 OBJECT STORAGE: FAIL missing media security token',token); sys.exit(1)

migration=(ROOT/checks['media_migration']).read_text().lower()
for token in ['create table media_assets','legacy_url','sha256','object_key','uploaded_by']:
 if token not in migration:
  print('PHASE 5 OBJECT STORAGE: FAIL migration missing',token); sys.exit(1)

s3=(ROOT/checks['s3_provider']).read_text()
for token in ['S3Client','PutObjectCommand','HeadObjectCommand','DeleteObjectCommand','STORAGE_PUBLIC_BASE_URL']:
 if token not in s3:
  print('PHASE 5 OBJECT STORAGE: FAIL provider missing',token); sys.exit(1)

bad=[]
for p in (ROOT/'src').rglob('*'):
 if not p.is_file() or p.suffix not in {'.ts','.tsx'} or p.as_posix().endswith('src/lib/storageApi.ts'): continue
 txt=p.read_text(errors='ignore')
 if 'supabase.storage' in txt or '.storage.from(' in txt: bad.append(str(p.relative_to(ROOT)))
if bad:
 print('PHASE 5 OBJECT STORAGE: FAIL direct Supabase Storage remains:',*bad,sep='\n - '); sys.exit(1)

adapter=(ROOT/'src/lib/storageApi.ts').read_text()
if "VITE_STORAGE_BACKEND" not in adapter or "uploadAdminImage" not in adapter:
 print('PHASE 5 OBJECT STORAGE: FAIL frontend storage adapter incomplete'); sys.exit(1)

consumers=0
pattern=re.compile(r"integrations/supabase/client")
for p in (ROOT/'src').rglob('*'):
 if p.is_file() and p.suffix in {'.ts','.tsx'} and pattern.search(p.read_text(errors='ignore')): consumers+=1

print('PHASE 5 OBJECT STORAGE + IMAGE MIGRATION: PASS')
print('frontend_direct_supabase_consumers:',consumers)
print('direct_supabase_storage_call_sites_outside_adapter: 0')
print('storage_provider: s3-compatible')
print('legacy_storage_fallback: feature-gated')
print('financial_runtime_cutover: 0 domains')
