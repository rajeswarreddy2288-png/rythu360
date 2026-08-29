import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [productIds, setProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProductIds(new Set());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("wishlist_items").select("product_id").eq("user_id", user.id);

    if (!error && data) {
      setProductIds(new Set(data.map((row) => row.product_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadWishlist();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadWishlist]);

  const isWishlisted = (productId) => productIds.has(productId);

  const toggleWishlist = async (productId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (productIds.has(productId)) {
      setProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      setProductIds((prev) => new Set(prev).add(productId));
      await supabase.from("wishlist_items").insert([{ user_id: user.id, product_id: productId }]);
    }
  };

  return (
    <WishlistContext.Provider value={{ productIds, isWishlisted, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}