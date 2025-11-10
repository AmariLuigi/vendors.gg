'use client';

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { CartItem, CartState, CartUpdateRequest } from '@/lib/types/cart';

interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (listingId: string, quantity: number) => Promise<void>;
  removeItem: (listingId: string) => Promise<void>;
  clear: () => Promise<void>;
  cartCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function reducer(state: CartState, next: CartState): CartState {
  return next;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/cart', { cache: 'no-store', credentials: 'include' });
        const json = await res.json();
        if (mounted) dispatch({ items: json.items || [], updatedAt: json.updatedAt });
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const callApi = async (payload: CartUpdateRequest) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    const json = await res.json();
    if (res.ok) {
      dispatch({ items: json.items || [], updatedAt: json.updatedAt });
    } else {
      // keep state unchanged on error
      console.error('Cart API error', json?.error || res.statusText);
    }
  };

  const addItem = async (item: CartItem) => {
    await callApi({ action: 'add', item });
  };

  const updateItem = async (listingId: string, quantity: number) => {
    await callApi({ action: 'update', listingId, quantity });
  };

  const removeItem = async (listingId: string) => {
    await callApi({ action: 'remove', listingId });
  };

  const clear = async () => {
    await callApi({ action: 'clear' });
  };

  const totals = useMemo(() => {
    const count = state.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const amount = state.items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    return { count, amount };
  }, [state.items]);

  const value: CartContextValue = {
    state,
    addItem,
    updateItem,
    removeItem,
    clear,
    cartCount: totals.count,
    totalAmount: totals.amount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}