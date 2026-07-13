/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useApp } from "./AppContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { currentUser } = useApp();
  const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;

  // Track the user ID that the items state currently belongs to
  const [cartUserId, setCartUserId] = useState(currentUserId);
  const [items, setItems] = useState(() => {
    try {
      const session = localStorage.getItem("glowskin-currentuser");
      const user = session ? JSON.parse(session) : null;
      const key = user
        ? `glowskin-cart-${user._id || user.id}`
        : "glowskin-cart-guest";
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Adjust state during render when the current user changes (login/logout/switch)
  if (currentUserId !== cartUserId) {
    setCartUserId(currentUserId);

    let loadedCart = [];
    if (currentUserId) {
      // User logged in!
      const userKey = `glowskin-cart-${currentUserId}`;
      try {
        const saved = localStorage.getItem(userKey);
        loadedCart = saved ? JSON.parse(saved) : [];
      } catch (err) {
        console.error("Lỗi đọc giỏ hàng user:", err);
      }

      // Merge current items (which are guest items) into user's cart
      const mergedCart = [...loadedCart];
      items.forEach((guestItem) => {
        const existingIndex = mergedCart.findIndex((item) => item.id === guestItem.id);
        if (existingIndex > -1) {
          mergedCart[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      });

      loadedCart = mergedCart;
      localStorage.setItem(userKey, JSON.stringify(loadedCart));
      localStorage.removeItem("glowskin-cart-guest");
    } else {
      // User logged out! Clear items and guest cart
      loadedCart = [];
      localStorage.removeItem("glowskin-cart-guest");
    }

    setItems(loadedCart);
  }

  const addToCart = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, { ...product, quantity }];
      }
      const key = currentUser
        ? `glowskin-cart-${currentUser._id || currentUser.id}`
        : "glowskin-cart-guest";
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      const key = currentUser
        ? `glowskin-cart-${currentUser._id || currentUser.id}`
        : "glowskin-cart-guest";
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      const key = currentUser
        ? `glowskin-cart-${currentUser._id || currentUser.id}`
        : "glowskin-cart-guest";
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [currentUser, removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    const key = currentUser
      ? `glowskin-cart-${currentUser._id || currentUser.id}`
      : "glowskin-cart-guest";
    localStorage.removeItem(key);
  }, [currentUser]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isCartOpen,
      setIsCartOpen,
    }),
    [items, totalItems, totalPrice, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, setIsCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
