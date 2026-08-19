import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

export default function ProfitCalculatorScreen() {
  const [investment, setInvestment] = useState("");
  const [expectedYield, setExpectedYield] = useState(""); // in kg
  const [pricePerKg, setPricePerKg] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const inv = parseFloat(investment) || 0;
    const yieldKg = parseFloat(expectedYield) || 0;
    const price = parseFloat(pricePerKg) || 0;
    const revenue = yieldKg * price;
    const profit = revenue - inv;

    setResult({
      revenue,
      profit,
      status: profit >= 0 ? "Profit ✅" : "Loss ⚠️",
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>💰 Profit / Loss Calculator</Text>
      <Text style={styles.subtitle}>Estimate before you invest</Text>

      <Text style={styles.label}>Total investment (₹)</Text>
      <TextInput style={styles.input} value={investment} onChangeText={setInvestment} keyboardType="numeric" placeholder="e.g. 120000" />

      <Text style={styles.label}>Expected yield (kg)</Text>
      <TextInput style={styles.input} value={expectedYield} onChangeText={setExpectedYield} keyboardType="numeric" placeholder="e.g. 6000" />

      <Text style={styles.label}>Expected price (₹/kg)</Text>
      <TextInput style={styles.input} value={pricePerKg} onChangeText={setPricePerKg} keyboardType="numeric" placeholder="e.g. 20" />

      <TouchableOpacity style={styles.button} onPress={calculate}>
        <Text style={styles.buttonText}>Calculate</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLine}>Estimated revenue: ₹{result.revenue.toLocaleString("en-IN")}</Text>
          <Text style={styles.resultLine}>Estimated profit/loss: ₹{result.profit.toLocaleString("en-IN")}</Text>
          <Text style={styles.status}>{result.status}</Text>
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
    backgroundColor: COLORS.harvestGold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: COLORS.darkGreenText, fontWeight: "700", fontSize: FONT_SIZES.body },
  resultBox: {
    backgroundColor: COLORS.goldTint,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
  },
  resultLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginBottom: 6 },
  status: { fontWeight: "700", fontSize: FONT_SIZES.body, color: COLORS.primaryDeepGreen, marginTop: 4 },
});
