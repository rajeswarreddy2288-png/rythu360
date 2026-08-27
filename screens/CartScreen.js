import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { useCart } from "../CartContext";

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, total } = useCart();

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>🛍️ Your Cart</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty. Browse the marketplace to add items.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price} each</Text>
            </View>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate("Checkout")}>
            <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  itemPrice: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 10 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.lightGreenCard,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: { fontSize: 16, color: COLORS.primaryDeepGreen, fontWeight: "700" },
  qtyValue: { fontWeight: "700", color: COLORS.darkGreenText, minWidth: 16, textAlign: "center" },
  removeButton: { paddingHorizontal: 6 },
  removeButtonText: { color: COLORS.gray, fontSize: 16 },
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGreenCard,
    padding: 20,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontSize: FONT_SIZES.body, color: COLORS.darkGreenText },
  totalValue: { fontSize: FONT_SIZES.h2, fontWeight: "700", color: COLORS.primaryDeepGreen },
  checkoutButton: { backgroundColor: COLORS.primaryDeepGreen, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  checkoutButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
});