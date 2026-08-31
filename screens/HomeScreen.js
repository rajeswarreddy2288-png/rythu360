import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

const CATEGORIES = [
  { name: "Seeds", emoji: "🌱" },
  { name: "Fertilizer", emoji: "🧪" },
  { name: "Pesticides", emoji: "💊" },
  { name: "Fungicides", emoji: "🌿" },
  { name: "Herbicides", emoji: "🌾" },
  { name: "Equipment", emoji: "🚜" },
];

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("");
  const [myCrops, setMyCrops] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("farmer_profiles")
      .select("village")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.village) setVillage(profile.village);

    const { data: crops } = await supabase
      .from("crops")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    setMyCrops(crops || []);

    const { data: products } = await supabase
      .from("products")
      .select("*, sellers(shop_name, is_approved)")
      .order("created_at", { ascending: false })
      .limit(6);
    setRecommended((products || []).filter((p) => p.sellers?.is_approved));
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [loadData, navigation]);

  const daysSinceSowing = (sowingDateStr) => {
    if (!sowingDateStr) return null;
    const diff = Date.now() - new Date(sowingDateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const goToMarketSearch = () => {
    navigation.navigate("Shop", { screen: "Marketplace", params: { initialSearch: search } });
  };

  const goToCategory = (category) => {
    navigation.navigate("Shop", { screen: "Marketplace", params: { initialCategory: category } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌾 Rythu360</Text>
        <Text style={styles.deliverTo}>📍 Deliver to: {village || "Set your village in Profile"}</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, crops & problems..."
            placeholderTextColor={COLORS.gray}
            onSubmitEditing={goToMarketSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={goToMarketSearch}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.name} style={styles.categoryTile} onPress={() => goToCategory(cat.name)}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryLabel}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>🌾 My Crops</Text>
        <TouchableOpacity onPress={() => navigation.navigate("My Farm")}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      {myCrops.length === 0 ? (
        <TouchableOpacity style={styles.emptyCropsCard} onPress={() => navigation.navigate("My Farm")}>
          <Text style={styles.emptyCropsText}>+ Add your first crop to track it here</Text>
        </TouchableOpacity>
      ) : (
        myCrops.map((crop) => {
          const days = daysSinceSowing(crop.sowing_date);
          return (
            <View key={crop.id} style={styles.cropRow}>
              <Text style={styles.cropName}>{crop.crop_name}</Text>
              <Text style={styles.cropMeta}>
                {days !== null ? `Day ${days}` : ""} • {crop.growth_stage}
              </Text>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.doctorCard} onPress={() => navigation.navigate("My Farm", { screen: "Farm Disease Check" })}>
        <Text style={styles.doctorEmoji}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorTitle}>Crop Doctor</Text>
          <Text style={styles.doctorSubtitle}>Upload a crop photo for an AI health check</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.quickLinksRow}>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("My Farm", { screen: "Farm Weather" })}>
          <Text style={styles.quickLinkEmoji}>🌦️</Text>
          <Text style={styles.quickLinkLabel}>Weather</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("My Farm", { screen: "Farm Mandi Prices" })}>
          <Text style={styles.quickLinkEmoji}>💰</Text>
          <Text style={styles.quickLinkLabel}>Mandi Prices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("Home", { screen: "Voice" })}>
          <Text style={styles.quickLinkEmoji}>🎙️</Text>
          <Text style={styles.quickLinkLabel}>Voice Help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>⭐ Recommended For You</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Shop")}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productRow}>
        {recommended.length === 0 ? (
          <Text style={styles.emptyProductsText}>No products yet — check back soon.</Text>
        ) : (
          recommended.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productTile}
              onPress={() => navigation.navigate("Shop", { screen: "Product Detail", params: { product: p } })}
            >
              <View style={styles.productImageWrap}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.productImage} />
                ) : (
                  <Text style={{ fontSize: 28 }}>🧴</Text>
                )}
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={styles.productPrice}>₹{p.price}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.ctaBox}>
        <Text style={styles.ctaTelugu}>మీ పంట ప్రయాణం... ఇక Rythu360తో!</Text>
        <Text style={styles.ctaEnglish}>Your farming journey starts with Rythu360.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  header: { backgroundColor: COLORS.primaryDeepGreen, padding: 20, paddingBottom: 24 },
  headerTitle: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.white },
  deliverTo: { color: "rgba(255,255,255,0.85)", fontSize: FONT_SIZES.small, marginTop: 6 },
  searchRow: { flexDirection: "row", marginTop: 14, gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.small,
  },
  searchButton: {
    backgroundColor: COLORS.harvestGold,
    width: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 20,
  },
  seeAll: { color: COLORS.harvestGold, fontSize: 12, fontWeight: "600" },
  categoryRow: { paddingLeft: 20 },
  categoryTile: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    width: 80,
  },
  categoryEmoji: { fontSize: 26, marginBottom: 6 },
  categoryLabel: { fontSize: 11, color: COLORS.darkGreenText, fontWeight: "600", textAlign: "center" },
  emptyCropsCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  emptyCropsText: { color: COLORS.primaryDeepGreen, fontWeight: "600", fontSize: FONT_SIZES.small },
  cropRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  cropName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  cropMeta: { color: COLORS.gray, fontSize: 11 },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.goldTint,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
  },
  doctorEmoji: { fontSize: 30, marginRight: 14 },
  doctorTitle: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.body },
  doctorSubtitle: { color: COLORS.darkGreenText, fontSize: 11, marginTop: 2 },
  arrow: { fontSize: 18, color: COLORS.primaryDeepGreen },
  quickLinksRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 16, gap: 10 },
  quickLink: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  quickLinkEmoji: { fontSize: 22, marginBottom: 4 },
  quickLinkLabel: { fontSize: 11, color: COLORS.darkGreenText, fontWeight: "600" },
  productRow: { paddingLeft: 20 },
  emptyProductsText: { color: COLORS.gray, fontSize: FONT_SIZES.small, paddingRight: 20 },
  productTile: {
    width: 120,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
  },
  productImageWrap: {
    height: 60,
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: "100%" },
  productName: { fontSize: 11, fontWeight: "700", color: COLORS.darkGreenText, minHeight: 28 },
  productPrice: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDeepGreen, marginTop: 2 },
  ctaBox: {
    backgroundColor: COLORS.primaryDeepGreen,
    marginHorizontal: 20,
    marginTop: 26,
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaTelugu: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body, textAlign: "center" },
  ctaEnglish: { color: COLORS.white, fontSize: FONT_SIZES.small, marginTop: 6, textAlign: "center" },
});