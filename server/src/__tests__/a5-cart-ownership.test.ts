import { describe, it, expect, vi } from 'vitest';
import { CartService } from '../services/cart.service.js';

describe('A5 cart ownership propagation', () => {
  it('lists only by current session user ID', async () => {
    const repo = { listCart: vi.fn().mockResolvedValue([]) };
    await new CartService(repo as any).list('user-a');
    expect(repo.listCart).toHaveBeenCalledWith('user-a');
  });
  it('passes user ID to cart line update and deletion', async () => {
    const repo = {
      setQuantity: vi.fn().mockResolvedValue({ kind: 'ok' }),
      deleteItem: vi.fn().mockResolvedValue(true),
      listCart: vi.fn().mockResolvedValue([]),
    };
    const cart = new CartService(repo as any);
    await cart.quantity('user-a', 'line-b', 2);
    await cart.remove('user-a', 'line-b');
    expect(repo.setQuantity).toHaveBeenCalledWith('user-a', 'line-b', 2);
    expect(repo.deleteItem).toHaveBeenCalledWith('user-a', 'line-b');
  });
  it('rejects missing or non-owned cart lines', async () => {
    const repo = { deleteItem: vi.fn().mockResolvedValue(false) };
    await expect(new CartService(repo as any).remove('user-a', 'line-b'))
      .rejects.toMatchObject({ statusCode: 404, code: 'CART_ITEM_NOT_FOUND' });
  });
});
