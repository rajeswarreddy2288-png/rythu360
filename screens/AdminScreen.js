import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { notify } from "../notify";

// Simple email-based admin check. Only accounts logged in with this email
// can see/use the admin screen. Add more emails to this list if needed.
const ADMIN_EMAILS = ["rajeswarreddy2288@gmail.com"];

export default function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats"); // "stats" | "sellers"
  const [stats, setStats] = useState(null);

  const loadSellers = useCallback(async () => {
    const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
    if (!error) setSellers(data);
  }, []);

  const loadStats = useCallback(async () => {
    // Run these counts in parallel for speed
    const [
      { count: farmerCount },
      { count: sellerCount },
      { count: approvedSellerCount },
      { count: productCount },
      { count: orderCount },
      { count: deliveredCount },
      { count: pendingCount },
      { count: cancelledCount },
      { data: orderTotals },
      { count: reviewCount },
    ] = await Promise.all([
      supabase.from("farmer_profiles").select("*", { count: "exact", head: true }),
      supabase.from("sellers").select("*", { count: "exact", head: true }),
      supabase.from("sellers").select("*", { count: "exact", head: true }).eq("is_approved", true),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "Delivered"),
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["Placed", "Seller Accepted", "Preparing", "Out for Delivery"]),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "Cancelled"),
      supabase.from("orders").select("total").neq("status", "Cancelled"),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
    ]);

    const totalSales = (orderTotals || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    setStats({
      farmerCount: farmerCount || 0,
      sellerCount: sellerCount || 0,
      approvedSellerCount: approvedSellerCount || 0,
      productCount: productCount || 0,
      orderCount: orderCount || 0,
      deliveredCount: deliveredCount || 0,
      pendingCount: pendingCount || 0,
      cancelledCount: cancelledCount || 0,
      totalSales,
      reviewCount: reviewCount || 0,
    });
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const admin = user && ADMIN_EMAILS.includes(user.email);
      setIsAdmin(admin);

      if (admin) {
        setLoading(true);
        await Promise.all([loadSellers(), loadStats()]);
        setLoading(false);
      }
    };
    checkAdmin();
  }, [loadSellers, loadStats]);

  const approveSeller = async (id) => {
    const { error } = await supabase.from("sellers").update({ is_approved: true }).eq("id", id);
    if (error) {
      Alert.alert("Could not approve", error.message);
    } else {
      const seller = sellers.find((s) => s.id === id);
      if (seller?.user_id) {
        notify(seller.user_id, "Shop Approved! ✅", `Your shop "${seller.shop_name}" is now live on the marketplace.`);
      }
      loadSellers();
      loadStats();
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
          if (!error) {
            loadSellers();
            loadStats();
          }
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
        <Text style={styles.subtitle}>Overview and seller management</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "stats" && styles.tabButtonActive]}
            onPress={() => setActiveTab("stats")}
          >
            <Text style={[styles.tabButtonText, activeTab === "stats" && styles.tabButtonTextActive]}>
              📊 Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "sellers" && styles.tabButtonActive]}
            onPress={() => setActiveTab("sellers")}
          >
            <Text style={[styles.tabButtonText, activeTab === "sellers" && styles.tabButtonTextActive]}>
              🏪 Sellers {pending.length > 0 ? `(${pending.length} pending)` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : activeTab === "stats" ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>
          <View style={styles.statsGrid}>
            <StatCard label="Farmers" value={stats?.farmerCount} icon="👨‍🌾" />
            <StatCard label="Sellers" value={stats?.sellerCount} icon="🏪" />
            <StatCard label="Approved Sellers" value={stats?.approvedSellerCount} icon="✅" />
            <StatCard label="Products Listed" value={stats?.productCount} icon="📦" />
          </View>

          <Text style={styles.sectionHeader}>Orders</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Orders" value={stats?.orderCount} icon="🛒" />
            <StatCard label="Pending" value={stats?.pendingCount} icon="⏳" color={COLORS.harvestGold} />
            <StatCard label="Delivered" value={stats?.deliveredCount} icon="✅" color={COLORS.primaryDeepGreen} />
            <StatCard label="Cancelled" value={stats?.cancelledCount} icon="✕" color="#B3261E" />
          </View>

          <Text style={styles.sectionHeader}>Sales & Reviews</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Sales" value={`₹${(stats?.totalSales || 0).toLocaleString("en-IN")}`} icon="💰" wide />
            <StatCard label="Reviews Submitted" value={stats?.reviewCount} icon="⭐" wide />
          </View>
        </ScrollView>
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

function StatCard({ label, value, icon, color, wide }) {
  return (
    <View style={[styles.statCard, wide && styles.statCardWide]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  tabRow: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 4 },
  tabButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabButtonActive: { backgroundColor: COLORS.primaryDeepGreen, borderColor: COLORS.primaryDeepGreen },
  tabButtonText: { color: COLORS.darkGreenText, fontWeight: "700", fontSize: 12 },
  tabButtonTextActive: { color: COLORS.white },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4, marginBottom: 6 },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  statCardWide: { width: "100%" },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: FONT_SIZES.h2, fontWeight: "700", color: COLORS.primaryDeepGreen },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: "center" },
});