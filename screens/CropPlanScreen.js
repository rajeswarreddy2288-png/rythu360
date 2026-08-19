import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

// TODO: Replace this with a real ML/backend call once your price-prediction
// API is ready. For now this is a simple placeholder so the UI is testable.
function estimateRisk({ acres, budget, crop }) {
  const acresNum = parseFloat(acres) || 1;
  const budgetNum = parseFloat(budget) || 0;

  const perAcreCost = 40000; // placeholder assumption
  const estInvestment = acresNum * perAcreCost;
  const priceLow = 17,
    priceHigh = 23;
  const yieldLow = 6,
    yieldHigh = 9; // tonnes/acre placeholder

  const revenueLow = acresNum * yieldLow * 1000 * priceLow;
  const revenueHigh = acresNum * yieldHigh * 1000 * priceHigh;
  const profitLow = revenueLow - estInvestment;
  const profitHigh = revenueHigh - estInvestment;
  const breakEvenPrice = estInvestment / (acresNum * yieldLow * 1000);

  return {
    crop: crop || "Pomegranate",
    estInvestment,
    revenueLow,
    revenueHigh,
    profitLow,
    profitHigh,
    breakEvenPrice: breakEvenPrice.toFixed(1),
    priceRisk: budgetNum > estInvestment ? "🟢 Low" : "🟡 Medium",
  };
}

export default function CropPlanScreen() {
  const [location, setLocation] = useState("");
  const [acres, setAcres] = useState("");
  const [budget, setBudget] = useState("");
  const [crop, setCrop] = useState("");
  const [result, setResult] = useState(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🌱 Should I Plant?</Text>
      <Text style={styles.subtitle}>Enter your farm details to get a risk & profit estimate</Text>

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Kadapa" />

      <Text style={styles.label}>Land (acres)</Text>
      <TextInput style={styles.input} value={acres} onChangeText={setAcres} keyboardType="numeric" placeholder="e.g. 3" />

      <Text style={styles.label}>Budget (₹)</Text>
      <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="e.g. 200000" />

      <Text style={styles.label}>Crop</Text>
      <TextInput style={styles.input} value={crop} onChangeText={setCrop} placeholder="e.g. Pomegranate" />

      <TouchableOpacity style={styles.button} onPress={() => setResult(estimateRisk({ acres, budget, crop }))}>
        <Text style={styles.buttonText}>📊 Get Risk Report</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>📊 Crop Risk Report — {result.crop}</Text>
          <Text style={styles.resultLine}>Estimated investment: ₹{result.estInvestment.toLocaleString("en-IN")}</Text>
          <Text style={styles.resultLine}>
            Estimated revenue: ₹{result.revenueLow.toLocaleString("en-IN")} – ₹{result.revenueHigh.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.resultLine}>
            Estimated profit: ₹{result.profitLow.toLocaleString("en-IN")} – ₹{result.profitHigh.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.resultLine}>Break-even price: ₹{result.breakEvenPrice}/kg</Text>
          <Text style={styles.resultLine}>Price risk: {result.priceRisk}</Text>
          <Text style={styles.disclaimer}>
            These are rough placeholder estimates. Connect a real price-prediction backend for
            accurate numbers.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20 },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
  },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  resultBox: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
  },
  resultTitle: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginBottom: 8 },
  resultLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginBottom: 4 },
  disclaimer: { color: COLORS.gray, fontSize: 11, marginTop: 10, fontStyle: "italic" },
});
