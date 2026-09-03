import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { useWishlist } from "../WishlistContext";

export default function WishlistScreen({ navigation }) {
  const { productIds, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlistedProducts = useCallback(async () => {
    setLoading(true);
    const ids = Array.from(productIds);

    console.log("[WISHLIST DEBUG] WishlistScreen — saved product ids:", ids);

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*, sellers(shop_name, village, is_approved)")
      .in("id", ids);

    console.log(
      "[WISHLIST DEBUG] WishlistScreen — products query returned:",
      data?.length,
      "of",
      ids.length,
      "requested. error:",
      error
    );
    if (data) {
      console.log(
        "[WISHLIST DEBUG] WishlistScreen — returned product ids:",
        data.map((p) => p.id)
      );
    }

    if (!error) setProducts(data || []);
    setLoading(false);
  }, [productIds]);

  useEffect(() => {
    loadWishlistedProducts();
    const unsubscribe = navigation.addListener("focus", loadWishlistedProducts);
    return unsubscribe;
  }, [loadWishlistedProducts, navigation]);

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>❤️ Wishlist</Text>
        <Text style={styles.subtitle}>Products you've saved for later</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 20 }}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No saved products yet. Tap the ❤️ on any product in the Marketplace to save it here.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate("Product Detail", { product: item })}
            >
              <View style={styles.imageWrapper}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 32 }}>🧴</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.heartButton} onPress={() => toggleWishlist(item.id)}>
                  <Text style={styles.heartIcon}>❤️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              <Text style={styles.productSeller} numberOfLines={1}>
                {item.sellers?.shop_name}
              </Text>
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
  imageWrapper: { position: "relative" },
  productImage: { height: 70, borderRadius: 8, marginBottom: 8, width: "100%" },
  imagePlaceholder: {
    height: 70,
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  heartButton: { position: "absolute", top: 4, right: 4 },
  heartIcon: { fontSize: 16 },
  productName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: 13, minHeight: 32 },
  productPrice: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginTop: 4 },
  productSeller: { color: COLORS.gray, fontSize: 10, marginTop: 4 },
});