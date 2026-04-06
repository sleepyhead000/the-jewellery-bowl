"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export interface CartVariant {
  id: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  attributes: Record<string, string>;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: CartVariant;
  product: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (variantId: string, quantity = 1): Promise<boolean> => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    if (res.ok) {
      await refresh();
      return true;
    }
    return false;
  }, [refresh]);

  const updateQuantity = useCallback(async (variantId: string, quantity: number) => {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (variantId: string) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    await refresh();
  }, [refresh]);

  const clearCart = useCallback(async () => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems([]);
    setTotal(0);
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext value={{
      items,
      total,
      count,
      loading,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
