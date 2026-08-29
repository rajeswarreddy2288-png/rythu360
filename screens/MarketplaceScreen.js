import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { useWishlist } from "../WishlistContext";

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { isWishlisted, toggleWishlist } = useWishlist();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, sellers(shop_name, village, is_approved)")
      .order("created_at", { ascending: false });

    if (!error) {
      // Only show products from approved sellers
      const approved = (data || []).filter((p) => p.sellers?.is_approved);

      // Pull all reviews once and compute each product's average rating client-side
      const { data: reviews } = await supabase.from("reviews").select("product_id, rating");
      const ratingsByProduct = {};
      (reviews || []).forEach((r) => {
        if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = [];
        ratingsByProduct[r.product_id].push(r.rating);
      });

      const withRatings = approved.map((p) => {
        const ratings = ratingsByProduct[p.id] || [];
        const avg = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
        return { ...p, avgRating: avg, reviewCount: ratings.length };
      });

      setProducts(withRatings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
    const unsubscribe = navigation.addListener("focus", loadProducts);
    return unsubscribe;
  }, [loadProducts, navigation]);

  // Build the category list dynamically from whatever sellers have actually
  // entered, so it always reflects real data rather than a fixed guess.
  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category?.trim()).filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category?.trim() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <Text style={styles.title}>🛒 Marketplace</Text>
        <Text style={styles.subtitle}>Products from verified local agri-shops</Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
        />

        {categories.length > 1 && (
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            ⚠️ Demo marketplace — sellers shown here are for testing. Cash on Delivery only; no real payment
            processing is set up yet.
          </Text>
        </View>

        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
          <Text style={styles.cartButtonText}>🛍️ View Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.wishlistButton} onPress={() => navigation.navigate("Wishlist")}>
          <Text style={styles.wishlistButtonText}>❤️ View Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sellerLink} onPress={() => navigation.navigate("Seller Dashboard")}>
          <Text style={styles.sellerLinkText}>Are you a seller? Register your shop →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No products listed yet. Once sellers register and add products, they'll appear here.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate("Product Detail", { product: item })}
            >
              <TouchableOpacity style={styles.heartButton} onPress={() => toggleWishlist(item)}>
                <Text style={{ fontSize: 16 }}>{isWishlisted(item.id) ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>

              <View style={styles.imagePlaceholder}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 32 }}>🧴</Text>
                )}
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              {item.avgRating !== null && (
                <Text style={styles.ratingText}>
                  ⭐ {item.avgRating.toFixed(1)} ({item.reviewCount})
                </Text>
              )}
              <Text style={styles.productSeller} numberOfLines={1}>
                {item.sellers?.shop_name} • {item.sellers?.village}
              </Text>
              <Text style={styles.productStock}>{item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 12 },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
    marginBottom: 12,
  },
  noticeBox: { backgroundColor: COLORS.goldTint, borderRadius: 10, padding: 10, marginBottom: 12 },
  categoryChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: COLORS.primaryDeepGreen, borderColor: COLORS.primaryDeepGreen },
  categoryChipText: { fontSize: 12, color: COLORS.darkGreenText, fontWeight: "600" },
  categoryChipTextActive: { color: COLORS.white },
  noticeText: { fontSize: 11, color: "#8A5B00", lineHeight: 15 },
  cartButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  cartButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.small },
  sellerLink: { alignItems: "center", paddingVertical: 6 },
  sellerLinkText: { color: COLORS.harvestGold, fontSize: 12, fontWeight: "600" },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20, width: "100%" },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 70,
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: "100%" },
  productName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: 13, minHeight: 32 },
  productPrice: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginTop: 4 },
  productSeller: { color: COLORS.gray, fontSize: 10, marginTop: 4 },
  productStock: { color: COLORS.gray, fontSize: 10, marginTop: 2 },
  ratingText: { color: "#B8860B", fontSize: 11, marginTop: 2, fontWeight: "600" },
});