import { AppError } from '../errors/app-error.js';
import type { StorageProvider, StoragePutInput } from './storage.provider.js';
export class DisabledStorageProvider implements StorageProvider {
  readonly name='disabled';
  private fail(): never { throw new AppError(503,'STORAGE_NOT_CONFIGURED','Object storage is not configured'); }
  async put(_input: StoragePutInput){ return this.fail(); }
  async delete(_key:string){ return this.fail(); }
  async head(_key:string){ return this.fail(); }
  getPublicUrl(_key:string){ return this.fail(); }
}
