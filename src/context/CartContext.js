'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('meditaj_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to sessionStorage on change
  useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem('meditaj_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (item) => {
    // SECURITY: Only allow products in the permanent cart
    if (item.type !== 'product') {
      toast.error('Clinical services are booked directly, not added to cart.');
      return;
    }

    // Check if item already exists (by ID and Type)
    const exists = cartItems.find(i => i.id === item.id && i.type === item.type);
    
    if (exists) {
      setCartItems(prev => prev.map(i => 
        (i.id === item.id && i.type === item.type) 
          ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
          : i
      ));
      toast.success(`${item.name} quantity updated`);
      return;
    }
    
    setCartItems(prev => [...prev, { ...item, quantity: item.quantity || 1 }]);
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id, type, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.type === type) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id, type) => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const clearCart = () => {
    setCartItems([]);
    sessionStorage.removeItem('meditaj_cart');
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      updateQuantity,
      removeFromCart, 
      clearCart, 
      getSubtotal,
      cartCount: cartItems.length
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
