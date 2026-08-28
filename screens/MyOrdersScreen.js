import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

const STATUS_COLORS = {
  Placed: COLORS.harvestGold,
  "Seller Accepted": "#3B82F6",
  Preparing: "#3B82F6",
  "Out for Delivery": "#8B5CF6",
  Delivered: COLORS.primaryDeepGreen,
  Cancelled: "#B3261E",
};

// Once a seller starts preparing or the order is out for delivery, it's too
// late for the farmer to self-cancel — they'd need to contact the seller directly.
const CANCELLABLE_STATUSES = ["Placed", "Seller Accepted"];

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), sellers(shop_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const unsubscribe = navigation.addListener("focus", loadOrders);
    return unsubscribe;
  }, [loadOrders, navigation]);

  const cancelOrder = async (orderId) => {
    Alert.alert("Cancel this order?", "This cannot be undone.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("orders").update({ status: "Cancelled" }).eq("id", orderId);
          if (error) {
            Alert.alert("Could not cancel order", error.message);
          } else {
            loadOrders();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>📦 My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet — visit the Marketplace to shop.</Text>}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.sellerName}>{item.sellers?.shop_name || "Seller"}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || COLORS.gray }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            {item.order_items?.map((oi) => (
              <Text key={oi.id} style={styles.itemLine}>
                {oi.quantity} × {oi.product_name} — ₹{oi.price * oi.quantity}
              </Text>
            ))}

            <View style={styles.orderFooter}>
              <Text style={styles.totalText}>Total: ₹{Number(item.total).toLocaleString("en-IN")}</Text>
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString("en-IN")}</Text>
            </View>

            {CANCELLABLE_STATUSES.includes(item.status) && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => cancelOrder(item.id)}>
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  orderCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sellerName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.small },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  itemLine: { color: COLORS.darkGreenText, fontSize: 12, marginBottom: 2 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  totalText: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  dateText: { color: COLORS.gray, fontSize: 11 },
  cancelButton: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: { color: "#B3261E", fontWeight: "700", fontSize: 12 },
});