import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

// Simple email-based admin check. Only accounts logged in with this email
// can see/use the admin screen. Add more emails to this list if needed.
const ADMIN_EMAILS = ["rajeswarreddy2288@gmail.com"];

export default function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats"); // "stats" | "sellers" | "users" | "products"
  const [stats, setStats] = useState(null);

  // --- Users/Farmers tab state ---
  const [farmers, setFarmers] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  // --- Products tab state ---
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  const loadSellers = useCallback(async () => {
    const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
    if (!error) setSellers(data);
  }, []);

  const loadStats = useCallback(async () => {
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

  const loadFarmers = useCallback(async () => {
    setFarmersLoading(true);
    setFarmersError(null);
    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setFarmersError(error.message);
    } else {
      setFarmers(data || []);
    }
    setFarmersLoading(false);
  }, []);

  const loadAllProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*, sellers(shop_name, is_approved)")
      .order("created_at", { ascending: false });

    if (error) {
      setProductsError(error.message);
    } else {
      setAllProducts(data || []);
    }
    setProductsLoading(false);
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

  // Lazy-load Users/Products data only the first time their tab is opened
  useEffect(() => {
    if (activeTab === "users" && farmers.length === 0 && !farmersLoading) {
      loadFarmers();
    }
    if (activeTab === "products" && allProducts.length === 0 && !productsLoading) {
      loadAllProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const approveSeller = async (id) => {
    const { error } = await supabase.from("sellers").update({ is_approved: true }).eq("id", id);
    if (error) {
      Alert.alert("Could not approve", error.message);
    } else {
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

  const deleteProduct = (product) => {
    Alert.alert(
      "Delete this product?",
      `"${product.name}" will be permanently removed from the marketplace. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("products").delete().eq("id", product.id);
            if (error) {
              Alert.alert("Could not delete", error.message);
            } else {
              setAllProducts((prev) => prev.filter((p) => p.id !== product.id));
              loadStats();
            }
          },
        },
      ]
    );
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

  const filteredFarmers = farmers.filter((f) => {
    const q = userSearch.toLowerCase();
    if (!q) return true;
    return (
      (f.full_name || "").toLowerCase().includes(q) ||
      (f.phone || "").toLowerCase().includes(q) ||
      (f.village || "").toLowerCase().includes(q) ||
      (f.district || "").toLowerCase().includes(q)
    );
  });

  const filteredProducts = allProducts.filter((p) => {
    const q = productSearch.toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.sellers?.shop_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>🛡️ Admin Dashboard</Text>
        <Text style={styles.subtitle}>Overview, sellers, users, and products</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {[
            { key: "stats", label: "📊 Stats" },
            { key: "sellers", label: `🏪 Sellers${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { key: "users", label: "👨‍🌾 Users" },
            { key: "products", label: "📦 Products" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
      ) : activeTab === "sellers" ? (
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
      ) : activeTab === "users" ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <TextInput
              style={styles.searchInput}
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search by name, phone, village, district..."
            />
          </View>

          {farmersLoading ? (
            <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
          ) : farmersError ? (
            <View style={{ padding: 20 }}>
              <Text style={styles.errorText}>Could not load farmers: {farmersError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFarmers}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredFarmers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, paddingTop: 10 }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {farmers.length === 0 ? "No farmers registered yet." : "No farmers match your search."}
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <Text style={styles.userName}>{item.full_name || "Unnamed farmer"}</Text>
                  <Text style={styles.userLine}>📞 {item.phone || "Not provided"}</Text>
                  <Text style={styles.userLine}>
                    📍 {[item.village, item.mandal, item.district, item.state].filter(Boolean).join(", ") || "Location not set"}
                  </Text>
                  <Text style={styles.userDate}>
                    Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "—"}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <TextInput
              style={styles.searchInput}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholder="Search by product, category, shop..."
            />
          </View>

          {productsLoading ? (
            <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
          ) : productsError ? (
            <View style={{ padding: 20 }}>
              <Text style={styles.errorText}>Could not load products: {productsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAllProducts}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, paddingTop: 10 }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {allProducts.length === 0 ? "No products listed yet." : "No products match your search."}
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productLine}>
                        {item.category || "No category"} • ₹{item.price} • Stock: {item.stock}
                      </Text>
                      <Text style={styles.productLine}>
                        {item.sellers?.shop_name || "Unknown shop"} •{" "}
                        {item.sellers?.is_approved ? "✅ Approved seller" : "⏳ Pending seller"}
                      </Text>
                      <Text style={styles.productDate}>
                        Listed: {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "—"}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(item)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
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
  tabRow: { flexDirection: "row", marginTop: 14, marginBottom: 4 },
  tabButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
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
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.small,
  },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  errorText: { color: "#B3261E", fontSize: FONT_SIZES.small, marginBottom: 10 },
  retryButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.small },
  userCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  userName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  userLine: { color: COLORS.darkGreenText, fontSize: 12, marginTop: 3 },
  userDate: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
  productCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  productName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  productLine: { color: COLORS.darkGreenText, fontSize: 12, marginTop: 3 },
  productDate: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
  deleteButton: {
    backgroundColor: "#FDECEA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  deleteButtonText: { color: "#B3261E", fontWeight: "700", fontSize: 11 },
});