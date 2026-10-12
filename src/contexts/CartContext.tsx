import { logger } from '@/lib/logger';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { nativeCart, type NativeCartLine } from '@/lib/cartApi';
import { nativeApiErrorMessage } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface CartItem extends NativeCartLine {}
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  main_image_url?: string;
  installation_charge?: number;
}

interface Ctx {
  items: CartItem[];
  addToCart: (p: CartProduct, q: number, i?: boolean) => Promise<void>;
  removeFromCart: (cartLineId: string) => Promise<void>;
  updateQuantity: (cartLineId: string, q: number) => Promise<void>;
  toggleInstallation: (cartLineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
  mutating: boolean;
}

const C = createContext<Ctx | undefined>(undefined);
export const useCart = () => {
  const c = useContext(C);
  if (!c) throw new Error('useCart must be used within CartProvider');
  return c;
};

const GUEST_CART_KEY = 'cart';
const clampQuantity = (q: number) => Math.max(1, Math.min(99, Math.trunc(q)));

function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is CartItem => Boolean(x && typeof x.id === 'string' && typeof x.product_id === 'string' && Number.isFinite(Number(x.quantity))));
  } catch {
    localStorage.removeItem(GUEST_CART_KEY);
    return [];
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const loadGeneration = useRef(0);
  const identityRef = useRef<string | null>(user?.id ?? null);
  identityRef.current = user?.id ?? null;
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());

  const saveGuest = (updater: CartItem[] | ((current: CartItem[]) => CartItem[])) => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
      return next;
    });
  };

  const load = async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const guest = readGuestCart();
        const next = guest.length
          ? await nativeCart.merge(guest.map(x => ({ productId: x.product_id, quantity: clampQuantity(x.quantity), installationService: x.installation_service })))
          : await nativeCart.list();
        if (generation !== loadGeneration.current) return;
        setItems(next);
        if (guest.length) localStorage.removeItem(GUEST_CART_KEY);
      } else {
        if (generation !== loadGeneration.current) return;
        setItems(readGuestCart());
      }
    } catch (e) {
      if (generation !== loadGeneration.current) return;
      logger.error('Error loading cart', e);
      setItems(user ? [] : readGuestCart());
      setError(nativeApiErrorMessage(e, 'Unable to load your cart.'));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  useEffect(() => {
    // Immediately clear the previous account's in-memory cart before loading the new identity.
    setItems(user ? [] : readGuestCart());
    setError(null);
    void load();
  }, [user?.id]);

  const runServerMutation = async (task: () => Promise<CartItem[]>) => {
    const identity = identityRef.current;
    let result: CartItem[] | undefined;
    let failure: unknown;
    const operation = mutationQueue.current.then(async () => {
      setMutating(true);
      try {
        result = await task();
        if (identityRef.current === identity) {
          setItems(result);
          setError(null);
        }
      } catch (e) {
        failure = e;
        if (identityRef.current === identity) setError(nativeApiErrorMessage(e, 'Unable to update your cart.'));
      } finally {
        setMutating(false);
      }
    });
    mutationQueue.current = operation.catch(() => undefined);
    await operation;
    if (failure) throw failure;
    return result ?? [];
  };

  const addToCart = async (p: CartProduct, q: number, inst = false) => {
    const quantity = clampQuantity(q);
    try {
      if (user) {
        await runServerMutation(() => nativeCart.add(p.id, quantity, inst));
      } else {
        saveGuest(current => {
          const idx = current.findIndex(x => x.product_id === p.id && x.installation_service === inst);
          const next = [...current];
          if (idx >= 0) next[idx] = { ...next[idx], quantity: clampQuantity(next[idx].quantity + quantity) };
          else next.push({ id: crypto.randomUUID(), product_id: p.id, product_name: p.name, product_slug: p.slug, product_image: p.main_image_url, price: p.price, quantity, installation_service: inst, installation_charge: inst ? (p.installation_charge || 0) : 0, original_installation_charge: p.installation_charge || 0 });
          return next;
        });
      }
      toast.success(`${quantity} x ${p.name} added to cart`);
    } catch (e) {
      logger.error('Add cart failed', e);
      toast.error(nativeApiErrorMessage(e, 'Failed to add to cart'));
      throw e;
    }
  };

  const removeFromCart = async (cartLineId: string) => {
    try {
      if (user) await runServerMutation(() => nativeCart.remove(cartLineId));
      else saveGuest(current => current.filter(x => x.id !== cartLineId));
      toast.success('Item removed from cart');
    } catch (e) {
      toast.error(nativeApiErrorMessage(e, 'Failed to remove item'));
      throw e;
    }
  };

  const updateQuantity = async (cartLineId: string, q: number) => {
    const quantity = clampQuantity(q);
    try {
      if (user) await runServerMutation(() => nativeCart.quantity(cartLineId, quantity));
      else saveGuest(current => current.map(x => x.id === cartLineId ? { ...x, quantity } : x));
    } catch (e) {
      toast.error(nativeApiErrorMessage(e, 'Failed to update quantity'));
      throw e;
    }
  };

  const toggleInstallation = async (cartLineId: string) => {
    try {
      if (user) await runServerMutation(() => nativeCart.toggle(cartLineId));
      else saveGuest(current => current.map(x => x.id === cartLineId ? { ...x, installation_service: !x.installation_service, installation_charge: !x.installation_service ? (x.original_installation_charge || x.installation_charge || 0) : 0, original_installation_charge: x.original_installation_charge || x.installation_charge } : x));
    } catch (e) {
      toast.error(nativeApiErrorMessage(e, 'Failed to update installation option'));
      throw e;
    }
  };

  const clearCart = async () => {
    try {
      if (user) await runServerMutation(() => nativeCart.clear());
      else { setItems([]); localStorage.removeItem(GUEST_CART_KEY); }
      toast.success('Cart cleared');
    } catch (e) {
      toast.error(nativeApiErrorMessage(e, 'Failed to clear cart'));
      throw e;
    }
  };

  const total = items.reduce((s, x) => s + x.price * x.quantity + x.installation_charge * x.quantity, 0);
  const itemCount = items.reduce((s, x) => s + x.quantity, 0);

  return <C.Provider value={{ items, addToCart, removeFromCart, updateQuantity, toggleInstallation, clearCart, refreshCart: load, total, itemCount, loading, error, mutating }}>{children}</C.Provider>;
};
