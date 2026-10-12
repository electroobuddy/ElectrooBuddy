export type StorageVisibility = 'public' | 'private';

export interface StoredObject {
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  etag?: string;
  publicUrl?: string;
}

export interface StoragePutInput {
  key: string;
  body: Uint8Array;
  mimeType: string;
  cacheControl?: string;
  visibility?: StorageVisibility;
}

export interface StorageProvider {
  readonly name: string;
  put(input: StoragePutInput): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  head(key: string): Promise<{ exists: boolean; size?: number; mimeType?: string; etag?: string }>;
  getPublicUrl(key: string): string;
}
