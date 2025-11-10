import { useCartContext } from '@/components/providers/CartProvider';

export function useCart() {
  return useCartContext();
}