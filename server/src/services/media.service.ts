import { createHash, randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../errors/app-error.js';
import type { DatabaseClient } from '../config/database.js';
import type { StorageProvider } from '../providers/storage.provider.js';

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif']);
const EXT: Record<string,string> = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif' };
const FOLDERS = new Set(['products','offers','projects','team','categories','testimonials','general']);

export class MediaService {
  constructor(private readonly db: DatabaseClient, private readonly storage: StorageProvider, private readonly maxBytes: number) {}

  async uploadImage(input: { body: Buffer; claimedMimeType?: string; originalName?: string; folder?: string; userId?: string }) {
    if (!input.body.length) throw new AppError(400, 'EMPTY_UPLOAD', 'Image file is required');
    if (input.body.length > this.maxBytes) throw new AppError(413, 'UPLOAD_TOO_LARGE', `Image must be ${Math.floor(this.maxBytes / 1024 / 1024)}MB or smaller`);

    const detected = await fileTypeFromBuffer(input.body);
    if (!detected || !ALLOWED.has(detected.mime)) throw new AppError(415, 'INVALID_IMAGE_TYPE', 'Only JPEG, PNG, WebP and GIF images are allowed');
    if (input.claimedMimeType && input.claimedMimeType !== detected.mime) throw new AppError(415, 'IMAGE_MIME_MISMATCH', 'Uploaded file content does not match its declared image type');

    const folder = input.folder && FOLDERS.has(input.folder) ? input.folder : 'general';
    const sha256 = createHash('sha256').update(input.body).digest('hex');
    const key = `${folder}/${new Date().toISOString().slice(0,7)}/${randomUUID()}.${EXT[detected.mime]}`;
    const stored = await this.storage.put({ key, body: input.body, mimeType: detected.mime });

    try {
      const result = await this.db.query<{ id: string }>(
        `INSERT INTO media_assets (storage_provider,bucket,object_key,public_url,mime_type,size_bytes,sha256,original_filename,uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [this.storage.name, stored.bucket, stored.key, stored.publicUrl ?? null, detected.mime, input.body.length, sha256, input.originalName ?? null, input.userId ?? null]
      );
      return { id: result.rows[0]!.id, key: stored.key, url: stored.publicUrl!, mimeType: detected.mime, size: input.body.length, sha256 };
    } catch (error) {
      await this.storage.delete(stored.key).catch(() => undefined);
      throw error;
    }
  }

  async deleteAsset(id: string) {
    const found = await this.db.query<{ object_key: string }>('SELECT object_key FROM media_assets WHERE id=$1 AND deleted_at IS NULL', [id]);
    if (!found.rows[0]) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    await this.storage.delete(found.rows[0].object_key);
    await this.db.query('UPDATE media_assets SET deleted_at=now() WHERE id=$1', [id]);
  }
}
