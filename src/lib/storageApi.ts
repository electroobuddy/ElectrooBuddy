import { nativeApiFetch } from '@/lib/apiClient';
export const storageBackend = 'express';
export async function uploadAdminImage(file: File, folder: string): Promise<{ url: string; id?: string; key?: string }> {
  const form = new FormData(); form.append('file', file); form.append('folder', folder);
  return nativeApiFetch<{ url: string; id?: string; key?: string }>('/admin/media/images', { method: 'POST', body: form });
}
