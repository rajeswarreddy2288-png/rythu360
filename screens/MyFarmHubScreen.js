import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

const MENU_ITEMS = [
  { label: "My Crops", emoji: "🌾", screen: "Farms List" },
  { label: "Crop Calendar", emoji: "📅", screen: "Farm Calendar" },
  { label: "Crop Plan", emoji: "📋", screen: "Farm Crop Plan" },
  { label: "Crop Doctor", emoji: "📷", screen: "Farm Disease Check" },
  { label: "Farm Diary", emoji: "📔", screen: "Farm Diary Entry" },
  { label: "Profit Calculator", emoji: "💰", screen: "Farm Profit" },
  { label: "Weather", emoji: "🌦️", screen: "Farm Weather" },
  { label: "Mandi Prices", emoji: "💰", screen: "Farm Mandi Prices" },
  { label: "Government Schemes", emoji: "🏛️", screen: "Farm Schemes" },
];

export default function MyFarmHubScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🌾 My Farm</Text>
      <Text style={styles.subtitle}>Everything for managing your farm and crops</Text>

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.menuRow}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.menuEmoji}>{item.emoji}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}
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
});