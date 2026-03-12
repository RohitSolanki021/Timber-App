import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
// import { apiService } from '../apiService';
import { apiProxy } from '../apiProxy';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getItemQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const refreshCart = async () => {
    try {
      const items = await apiProxy.getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number) => {
    await apiProxy.addToCart(productId, quantity);
    await refreshCart();
  };

  const removeFromCart = async (productId: string) => {
    await apiProxy.removeFromCart(productId);
    await refreshCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
    } else {
      await apiProxy.addToCart(productId, quantity);
      await refreshCart();
    }
  };

  const getItemQuantity = (productId: string) => {
    const item = cartItems.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
