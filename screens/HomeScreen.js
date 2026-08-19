import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

const FEATURES = [
  {
    key: "Crop Plan",
    emoji: "🌱",
    telugu: "ఏ పంట వేస్తే ఎక్కువ లాభం వస్తుందో తెలుసా?",
    english: "Know which crop could give you better returns before you plant.",
    bg: COLORS.lightGreenCard,
  },
  {
    key: "Disease Check",
    emoji: "📸",
    telugu: "మీ పంటకు వచ్చిన వ్యాధి ఏంటో తెలియడంలేదా?",
    english: "Take a photo. Let Rythu360 help identify the problem.",
    bg: COLORS.offWhite,
  },
  {
    key: "Profit",
    emoji: "💰",
    telugu: "పంట వేస్తే లాభమా? నష్టమా?",
    english: "Estimate your investment, revenue and risk before planting.",
    bg: COLORS.goldTint,
  },
  {
    key: "Diary",
    emoji: "📔",
    telugu: "మీ పంట ప్రయాణం ట్రాక్ చేయండి",
    english: "Track expenses, yield, and results for every crop cycle.",
    bg: COLORS.lightGreenCard,
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌾</Text>
        <Text style={styles.heroTelugu}>రైతు కోసం 360° పరిష్కారం</Text>
        <Text style={styles.heroEnglish}>360° Solutions for Every Farmer</Text>
        <Text style={styles.heroTag}>Rythu360 — మీ పంటకు అన్నలా తోడు</Text>
      </View>

      {FEATURES.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.card, { backgroundColor: f.bg }]}
          onPress={() => navigation.navigate(f.key)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>{f.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTelugu}>{f.telugu}</Text>
            <Text style={styles.cardEnglish}>{f.english}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.ctaBox}>
        <Text style={styles.ctaTelugu}>మీ పంట ప్రయాణం... ఇక Rythu360తో!</Text>
        <Text style={styles.ctaEnglish}>Your farming journey starts with Rythu360.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  hero: {
    backgroundColor: COLORS.offWhite,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTelugu: {
    fontSize: FONT_SIZES.h2,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    textAlign: "center",
  },
  heroEnglish: {
    fontSize: FONT_SIZES.body,
    color: COLORS.darkGreenText,
    marginTop: 4,
    textAlign: "center",
  },
  heroTag: {
    fontSize: FONT_SIZES.small,
    color: COLORS.gray,
    marginTop: 10,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
  },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  cardTelugu: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
  },
  cardEnglish: {
    fontSize: FONT_SIZES.small,
    color: COLORS.darkGreenText,
    marginTop: 4,
  },
  ctaBox: {
    backgroundColor: COLORS.primaryDeepGreen,
    marginHorizontal: 16,
    marginTop: 26,
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaTelugu: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body, textAlign: "center" },
  ctaEnglish: { color: COLORS.white, fontSize: FONT_SIZES.small, marginTop: 6, textAlign: "center" },
});
