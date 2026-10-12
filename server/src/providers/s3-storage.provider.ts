import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { AppEnv } from '../config/env.js';
import type { StoredObject, StorageProvider, StoragePutInput } from './storage.provider.js';
import { DisabledStorageProvider } from './disabled-storage.provider.js';

function encodeKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

export class S3CompatibleStorageProvider implements StorageProvider {
  readonly name = 's3-compatible';
  private readonly client: S3Client;

  constructor(private readonly env: AppEnv) {
    this.client = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }

  async put(input: StoragePutInput): Promise<StoredObject> {
    const result = await this.client.send(new PutObjectCommand({
      Bucket: this.env.STORAGE_BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.mimeType,
      CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
    }));
    return {
      key: input.key,
      bucket: this.env.STORAGE_BUCKET,
      size: input.body.byteLength,
      mimeType: input.mimeType,
      ...(result.ETag ? { etag: result.ETag.replaceAll('"', '') } : {}),
      publicUrl: this.getPublicUrl(input.key),
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.env.STORAGE_BUCKET, Key: key }));
  }

  async head(key: string) {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.env.STORAGE_BUCKET, Key: key }));
      return { exists: true, ...(result.ContentLength !== undefined ? { size: result.ContentLength } : {}), ...(result.ContentType ? { mimeType: result.ContentType } : {}), ...(result.ETag ? { etag: result.ETag.replaceAll('"', '') } : {}) };
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return { exists: false };
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, '')}/${encodeKey(key)}`;
  }
}

export function createStorageProvider(env: AppEnv): StorageProvider {
  if (!env.STORAGE_ENABLED) return new DisabledStorageProvider();
  if (env.STORAGE_DRIVER !== 's3') throw new Error(`Unsupported STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
  return new S3CompatibleStorageProvider(env);
}
