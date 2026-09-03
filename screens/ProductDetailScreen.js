import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { useCart } from "../CartContext";
import { useWishlist } from "../WishlistContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : [];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert("Added to cart", `${quantity} × ${product.name} added.`, [
      { text: "Keep browsing", onPress: () => navigation.goBack() },
      { text: "Go to cart", onPress: () => navigation.navigate("Cart") },
    ]);
  };

  const onScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.galleryWrapper}>
        {gallery.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {gallery.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.mainImage} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.mainImagePlaceholder}>
            <Text style={{ fontSize: 60 }}>🧴</Text>
          </View>
        )}

        {/* Clearly visible wishlist heart — top-right of the gallery, large
            touch target, sits on a solid circular background so it's visible
            against any product photo. Reuses the existing WishlistContext. */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => toggleWishlist(product.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.heartIcon}>{isWishlisted(product.id) ? "❤️" : "♡"}</Text>
        </TouchableOpacity>

        {gallery.length > 1 && (
          <View style={styles.dotsRow}>
            {gallery.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      {gallery.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {gallery.map((url, index) => (
            <TouchableOpacity key={index} onPress={() => setActiveIndex(index)}>
              <Image
                source={{ uri: url }}
                style={[styles.thumb, index === activeIndex && styles.thumbActive]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{product.name}</Text>
          <TouchableOpacity
            onPress={() => toggleWishlist(product.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.heartIconSmall}>
              {isWishlisted(product.id) ? "❤️ Wishlisted" : "♡ Add to Wishlist"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>₹{product.price}</Text>
        {product.avgRating != null && (
          <Text style={styles.rating}>
            ⭐ {product.avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
          </Text>
        )}
        <Text style={styles.seller}>
          Sold by: {product.sellers?.shop_name} • {product.sellers?.village}
        </Text>
        <Text style={styles.stock}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</Text>

        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addButton, product.stock <= 0 && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <Text style={styles.addButtonText}>🛒 Add to Cart</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Demo marketplace — this is for testing the app flow. Follow product label instructions for any real
          agricultural product, and confirm suitability with a local expert before use.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  galleryWrapper: { width: SCREEN_WIDTH, height: 280, backgroundColor: COLORS.lightGreenCard, position: "relative" },
  mainImage: { width: SCREEN_WIDTH, height: 280 },
  mainImagePlaceholder: { width: SCREEN_WIDTH, height: 280, justifyContent: "center", alignItems: "center" },
  heartButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  heartIcon: { fontSize: 22, color: "#D6336C" },
  heartIconSmall: { fontSize: 13, color: "#D6336C", fontWeight: "700" },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { backgroundColor: COLORS.white, width: 18 },
  thumbStrip: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.white },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: COLORS.primaryDeepGreen },
  content: { padding: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { flex: 1, fontSize: FONT_SIZES.h2, fontWeight: "700", color: COLORS.primaryDeepGreen, marginRight: 10 },
  price: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.darkGreenText, marginTop: 6 },
  rating: { color: "#B8860B", fontSize: FONT_SIZES.small, marginTop: 4, fontWeight: "600" },
  seller: { color: COLORS.gray, fontSize: FONT_SIZES.small, marginTop: 6 },
  stock: { color: COLORS.gray, fontSize: FONT_SIZES.small, marginTop: 2 },
  description: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 14, lineHeight: 18 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 24, gap: 20 },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.lightGreenCard,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: { fontSize: 22, color: COLORS.primaryDeepGreen, fontWeight: "700" },
  qtyValue: { fontSize: FONT_SIZES.h2, fontWeight: "700", color: COLORS.darkGreenText },
  addButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  addButtonDisabled: { backgroundColor: COLORS.gray },
  addButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  disclaimer: { color: COLORS.gray, fontSize: 11, marginTop: 16, fontStyle: "italic", lineHeight: 15, marginBottom: 20 },
});