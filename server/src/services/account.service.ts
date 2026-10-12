import { AppError } from '../errors/app-error.js';
import type { AccountRepository } from '../repositories/account.repository.js';

export class AccountService {
  constructor(private readonly repo: AccountRepository) {}
  async getProfile(userId: string) {
    const profile = await this.repo.getProfile(userId);
    if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found');
    return profile;
  }
  updateProfile(userId: string, input: { fullName?: string | null; phone?: string | null; address?: string | null }) { return this.repo.upsertProfile(userId, input); }
  listAddresses(userId: string) { return this.repo.listAddresses(userId); }
  createAddress(userId: string, input: unknown) { return this.repo.createAddress(userId, input); }
  async updateAddress(userId: string, id: string, input: unknown) {
    const value = await this.repo.updateAddress(userId, id, input);
    if (!value) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    return value;
  }
  async deleteAddress(userId: string, id: string) {
    if (!await this.repo.deleteAddress(userId, id)) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    return { deleted: true };
  }
  async setDefaultAddress(userId: string, id: string) {
    const value = await this.repo.setDefaultAddress(userId, id);
    if (!value) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    return value;
  }
}
