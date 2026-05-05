import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiService } from '../apiService';

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  business_name?: string;
  email: string;
  phone: string;
  approval_status: string;
  pricing_type: number;
  address?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  selectedCustomer: Customer | null;
  isLoading: boolean;
  updatingItems: Set<string>;
  notification: { message: string; type: 'success' | 'error' } | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getItemQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomerState] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  const refreshCart = async () => {
    if (!selectedCustomer) {
      setCartItems([]);
      return;
    }
    try {
      const data = await apiService.getCart(selectedCustomer.id);
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
    }
  };

  const setSelectedCustomer = (customer: Customer | null) => {
    setSelectedCustomerState(customer);
    if (customer) {
      localStorage.setItem('sales_selected_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('sales_selected_customer');
      setCartItems([]);
    }
  };

  useEffect(() => {
    // Load selected customer from localStorage
    const stored = localStorage.getItem('sales_selected_customer');
    if (stored) {
      try {
        const customer = JSON.parse(stored);
        setSelectedCustomerState(customer);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setIsLoading(true);
      refreshCart().finally(() => setIsLoading(false));
    }
  }, [selectedCustomer]);

  const addToCart = async (productId: string, quantity: number) => {
    if (!selectedCustomer) {
      showNotification('Please select a customer first', 'error');
      return;
    }
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await apiService.addToCart(productId, quantity, selectedCustomer.id);
      await refreshCart();
      showNotification('Added to cart');
    } catch (error) {
      showNotification('Failed to add item', 'error');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!selectedCustomer) return;
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await apiService.removeFromCart(productId, selectedCustomer.id);
      await refreshCart();
      showNotification('Removed from cart');
    } catch (error) {
      showNotification('Failed to remove item', 'error');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    if (!selectedCustomer) return;
    
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await apiService.addToCart(productId, quantity, selectedCustomer.id);
      await refreshCart();
    } catch (error) {
      showNotification('Failed to update quantity', 'error');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const clearCart = async () => {
    if (!selectedCustomer) return;
    try {
      await apiService.clearCart(selectedCustomer.id);
      setCartItems([]);
      showNotification('Cart cleared');
    } catch (error) {
      showNotification('Failed to clear cart', 'error');
    }
  };

  const getItemQuantity = (productId: string) => {
    const item = cartItems.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        selectedCustomer,
        isLoading,
        updatingItems,
        notification,
        setSelectedCustomer,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        refreshCart,
        clearCart,
        showNotification,
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
