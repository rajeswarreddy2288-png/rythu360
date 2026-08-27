import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, sellers(shop_name, village, is_approved)")
      .order("created_at", { ascending: false });

    if (!error) {
      // Only show products from approved sellers
      const approved = (data || []).filter((p) => p.sellers?.is_approved);
      setProducts(approved);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
    const unsubscribe = navigation.addListener("focus", loadProducts);
    return unsubscribe;
  }, [loadProducts, navigation]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

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

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            ⚠️ Demo marketplace — sellers shown here are for testing. Cash on Delivery only; no real payment
            processing is set up yet.
          </Text>
        </View>

        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
          <Text style={styles.cartButtonText}>🛍️ View Cart</Text>
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
              <View style={styles.imagePlaceholder}>
                <Text style={{ fontSize: 32 }}>🧴</Text>
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>₹{item.price}</Text>
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
  },
  productName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: 13, minHeight: 32 },
  productPrice: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginTop: 4 },
  productSeller: { color: COLORS.gray, fontSize: 10, marginTop: 4 },
  productStock: { color: COLORS.gray, fontSize: 10, marginTop: 2 },
});