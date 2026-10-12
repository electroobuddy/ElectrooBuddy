import { nativeApiFetch } from './apiClient';

export interface NativeCartLine {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image?: string | null;
  price: number;
  quantity: number;
  installation_service: boolean;
  installation_charge: number;
  original_installation_charge?: number;
  track_inventory?: boolean;
  inventory_quantity?: number;
  allow_backorder?: boolean;
}

export interface CartMergeItem {
  productId: string;
  quantity: number;
  installationService: boolean;
}

export interface NativeWishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  main_image_url: string | null;
  track_inventory: boolean;
  inventory_quantity: number;
}

export interface NativeWishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: NativeWishlistProduct;
}

export const nativeCart = {
  list: () => nativeApiFetch<NativeCartLine[]>('/cart'),
  add: (productId: string, quantity: number, installationService = false) =>
    nativeApiFetch<NativeCartLine[]>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity, installationService }) }),
  quantity: (id: string, quantity: number) =>
    nativeApiFetch<NativeCartLine[]>(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  toggle: (id: string) => nativeApiFetch<NativeCartLine[]>(`/cart/items/${id}/toggle-installation`, { method: 'POST' }),
  remove: (id: string) => nativeApiFetch<NativeCartLine[]>(`/cart/items/${id}`, { method: 'DELETE' }),
  clear: () => nativeApiFetch<NativeCartLine[]>('/cart', { method: 'DELETE' }),
  merge: (items: CartMergeItem[]) => nativeApiFetch<NativeCartLine[]>('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) }),
};

export const nativeWishlist = {
  list: () => nativeApiFetch<NativeWishlistItem[]>('/wishlist'),
  add: (id: string) => nativeApiFetch<NativeWishlistItem[]>(`/wishlist/${id}`, { method: 'POST' }),
  remove: (id: string) => nativeApiFetch<NativeWishlistItem[]>(`/wishlist/${id}`, { method: 'DELETE' }),
};
