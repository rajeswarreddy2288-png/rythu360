import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { useCart } from "../CartContext";
import { supabase } from "../supabase";

export default function CheckoutScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please enter your delivery address and phone number.");
      return;
    }

    setPlacing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPlacing(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    // Group items by seller — each seller gets a separate order
    const bySeller = {};
    items.forEach((item) => {
      const sellerId = item.product.seller_id;
      if (!bySeller[sellerId]) bySeller[sellerId] = [];
      bySeller[sellerId].push(item);
    });

    try {
      for (const sellerId of Object.keys(bySeller)) {
        const sellerItems = bySeller[sellerId];
        const sellerTotal = sellerItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              user_id: user.id,
              seller_id: sellerId,
              status: "Placed",
              total: sellerTotal,
              delivery_address: address,
              delivery_phone: phone,
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItemsPayload = sellerItems.map((i) => ({
          order_id: order.id,
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
        if (itemsError) throw itemsError;
      }

      clearCart();
      Alert.alert("Order placed!", "Your order has been placed (Cash on Delivery). Track it under My Orders.", [
        { text: "OK", onPress: () => navigation.navigate("My Orders") },
      ]);
    } catch (err) {
      Alert.alert("Could not place order", err.message);
    }

    setPlacing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.sectionTitle}>Order Summary</Text>
      {items.map((item) => (
        <View key={item.product.id} style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {item.quantity} × {item.product.name}
          </Text>
          <Text style={styles.summaryText}>₹{item.product.price * item.quantity}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{total.toLocaleString("en-IN")}</Text>
      </View>

      <Text style={styles.sectionTitle}>Delivery Details</Text>
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={address}
        onChangeText={setAddress}
        placeholder="House/village, mandal, district, pincode"
        multiline
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
      />

      <View style={styles.paymentBox}>
        <Text style={styles.paymentTitle}>💵 Payment: Cash on Delivery</Text>
        <Text style={styles.paymentNote}>
          Online payment isn't set up yet in this demo — pay the seller directly when your order arrives.
        </Text>
      </View>

      <TouchableOpacity style={styles.placeOrderButton} onPress={placeOrder} disabled={placing}>
        <Text style={styles.placeOrderText}>{placing ? "Placing order..." : "Place Order"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen, marginBottom: 16 },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    marginTop: 20,
    marginBottom: 10,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  divider: { height: 1, backgroundColor: COLORS.lightGreenCard, marginVertical: 8 },
  totalLabel: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.body },
  totalValue: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginTop: 10, marginBottom: 4, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
  },
  paymentBox: { backgroundColor: COLORS.goldTint, borderRadius: 10, padding: 14, marginTop: 20 },
  paymentTitle: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  paymentNote: { color: "#8A5B00", fontSize: 11, marginTop: 4, lineHeight: 15 },
  placeOrderButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  placeOrderText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
});