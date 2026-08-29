import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { product, quantity }
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select("*, products(*, sellers(shop_name, village, is_approved))")
      .eq("user_id", user.id);

    if (!error && data) {
      const loaded = data
        .filter((row) => row.products) // skip rows whose product may have been deleted
        .map((row) => ({ product: row.products, quantity: row.quantity }));
      setItems(loaded);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCart();

    // Reload the cart whenever the login state changes (e.g. after logout/login)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadCart();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadCart]);

  const addToCart = async (product, quantity) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = items.find((i) => i.product.id === product.id);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      setItems((prev) => prev.map((i) => (i.product.id === product.id ? { ...i, quantity: newQuantity } : i)));
      await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("user_id", user.id)
        .eq("product_id", product.id);
    } else {
      setItems((prev) => [...prev, { product, quantity }]);
      await supabase.from("cart_items").insert([{ user_id: user.id, product_id: product.id, quantity }]);
    }
  };

  const removeFromCart = async (productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cart_items").update({ quantity }).eq("user_id", user.id).eq("product_id", productId);
    }
  };

  const clearCart = async () => {
    setItems([]);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}