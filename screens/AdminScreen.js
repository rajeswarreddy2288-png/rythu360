import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

// Simple email-based admin check. Only accounts logged in with this email
// can see/use the admin screen. Add more emails to this list if needed.
const ADMIN_EMAILS = ["rajeswarreddy2288@gmail.com"];

export default function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
    if (!error) setSellers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const admin = user && ADMIN_EMAILS.includes(user.email);
      setIsAdmin(admin);

      if (admin) loadSellers();
    };
    checkAdmin();
  }, [loadSellers]);

  const approveSeller = async (id) => {
    const { error } = await supabase.from("sellers").update({ is_approved: true }).eq("id", id);
    if (error) {
      Alert.alert("Could not approve", error.message);
    } else {
      loadSellers();
    }
  };

  const revokeSeller = async (id) => {
    Alert.alert("Revoke approval?", "This seller's products will no longer be visible in the Marketplace.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("sellers").update({ is_approved: false }).eq("id", id);
          if (!error) loadSellers();
        },
      },
    ]);
  };

  if (isAdmin === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Text style={styles.deniedTitle}>🔒 Admin Access Only</Text>
        <Text style={styles.deniedText}>This screen is restricted to the app administrator.</Text>
      </View>
    );
  }

  const pending = sellers.filter((s) => !s.is_approved);
  const approved = sellers.filter((s) => s.is_approved);

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>🛡️ Admin Dashboard</Text>
        <Text style={styles.subtitle}>Review and approve seller shop registrations</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={[
            { type: "header", title: `⏳ Pending Approval (${pending.length})` },
            ...pending.map((s) => ({ type: "seller", ...s, pending: true })),
            { type: "header", title: `✅ Approved Sellers (${approved.length})` },
            ...approved.map((s) => ({ type: "seller", ...s, pending: false })),
          ]}
          keyExtractor={(item, index) => item.id || `header-${index}`}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return <Text style={styles.sectionHeader}>{item.title}</Text>;
            }
            return (
              <View style={styles.sellerCard}>
                <Text style={styles.shopName}>{item.shop_name}</Text>
                <Text style={styles.sellerLine}>Owner: {item.owner_name || "—"}</Text>
                <Text style={styles.sellerLine}>License: {item.license_number || "Not provided"}</Text>
                <Text style={styles.sellerLine}>Phone: {item.phone || "—"}</Text>
                <Text style={styles.sellerLine}>
                  {item.village}{item.village && item.district ? ", " : ""}{item.district}
                </Text>

                {item.pending ? (
                  <TouchableOpacity style={styles.approveButton} onPress={() => approveSeller(item.id)}>
                    <Text style={styles.approveButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.revokeButton} onPress={() => revokeSeller(item.id)}>
                    <Text style={styles.revokeButtonText}>Revoke Approval</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 10 },
  deniedTitle: { fontSize: FONT_SIZES.h2, fontWeight: "700", color: COLORS.primaryDeepGreen, marginBottom: 8 },
  deniedText: { color: COLORS.gray, fontSize: FONT_SIZES.small, textAlign: "center" },
  sectionHeader: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    marginTop: 16,
    marginBottom: 10,
  },
  sellerCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  shopName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  sellerLine: { color: COLORS.darkGreenText, fontSize: 12, marginTop: 2 },
  approveButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  approveButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.small },
  revokeButton: {
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  revokeButtonText: { color: "#B3261E", fontWeight: "700", fontSize: FONT_SIZES.small },
});