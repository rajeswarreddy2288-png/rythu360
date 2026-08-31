import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

const ADMIN_EMAILS = ["rajeswarreddy2288@gmail.com"];

export default function ProfileHubScreen({ navigation }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(!!user && ADMIN_EMAILS.includes(user.email));
    });
  }, []);

  const comingSoon = (label) => Alert.alert(label, "This section is coming soon.");

  const MENU_ITEMS = [
    { label: "My Profile", emoji: "👤", action: () => navigation.navigate("My Profile Details") },
    { label: "Wishlist", emoji: "❤️", action: () => navigation.navigate("Shop", { screen: "Wishlist" }) },
    { label: "My Orders", emoji: "📦", action: () => navigation.navigate("Orders") },
    { label: "Notifications", emoji: "🔔", action: () => navigation.navigate("Home", { screen: "Notifications" }) },
    { label: "My Farms", emoji: "🌾", action: () => navigation.navigate("My Farm") },
    { label: "Seller Dashboard", emoji: "🏪", action: () => navigation.navigate("Shop", { screen: "Seller Dashboard" }) },
    ...(isAdmin ? [{ label: "Admin Dashboard", emoji: "🛡️", action: () => navigation.navigate("Profile Admin") }] : []),
    { label: "Settings", emoji: "⚙️", action: () => comingSoon("Settings") },
    { label: "Help & Support", emoji: "❓", action: () => comingSoon("Help & Support") },
  ];

  const handleLogout = () => {
    Alert.alert("Log out?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.subtitle}>Manage your account and access all your info</Text>

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item.label} style={styles.menuRow} onPress={item.action}>
          <Text style={styles.menuEmoji}>{item.emoji}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
        <Text style={styles.menuEmoji}>🚪</Text>
        <Text style={styles.logoutLabel}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  menuEmoji: { fontSize: 22, marginRight: 14 },
  menuLabel: { flex: 1, fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.body },
  arrow: { fontSize: 16, color: COLORS.primaryDeepGreen },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  logoutLabel: { fontWeight: "700", color: "#B3261E", fontSize: FONT_SIZES.body },
});