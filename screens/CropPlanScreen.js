import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

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
  const [saving, setSaving] = useState(false);
  const [pastPlans, setPastPlans] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);

  const loadPastPlans = useCallback(async () => {
    setLoadingPast(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingPast(false);
      return;
    }

    const { data, error } = await supabase
      .from("crop_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setPastPlans(data);
    setLoadingPast(false);
  }, []);

  useEffect(() => {
    loadPastPlans();
  }, [loadPastPlans]);

  const handleGetReport = async () => {
    const report = estimateRisk({ acres, budget, crop });
    setResult(report);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    const { error } = await supabase.from("crop_plans").insert([
      {
        user_id: user.id,
        crop: report.crop,
        location,
        acres: parseFloat(acres) || null,
        budget: parseFloat(budget) || null,
        est_investment: report.estInvestment,
        est_profit_low: report.profitLow,
        est_profit_high: report.profitHigh,
        break_even_price: parseFloat(report.breakEvenPrice),
      },
    ]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not save report", error.message);
    } else {
      loadPastPlans(); // refresh history list
    }
  };

  const deletePlan = async (id) => {
    const { error } = await supabase.from("crop_plans").delete().eq("id", id);
    if (error) {
      Alert.alert("Could not delete", error.message);
    } else {
      setPastPlans((prev) => prev.filter((p) => p.id !== id));
    }
  };

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

      <TouchableOpacity style={styles.button} onPress={handleGetReport} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "📊 Get Risk Report"}</Text>
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

      <Text style={styles.historyTitle}>📜 Past Reports</Text>
      {loadingPast ? (
        <ActivityIndicator color={COLORS.primaryDeepGreen} style={{ marginTop: 10 }} />
      ) : pastPlans.length === 0 ? (
        <Text style={styles.empty}>No past reports yet.</Text>
      ) : (
        pastPlans.map((p) => (
          <View key={p.id} style={styles.historyCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyCrop}>
                  {p.crop} {p.location ? `— ${p.location}` : ""}
                </Text>
                <Text style={styles.historyLine}>
                  Profit est.: ₹{Number(p.est_profit_low).toLocaleString("en-IN")} – ₹
                  {Number(p.est_profit_high).toLocaleString("en-IN")}
                </Text>
                <Text style={styles.historyDate}>{new Date(p.created_at).toLocaleDateString("en-IN")}</Text>
              </View>
              <TouchableOpacity onPress={() => deletePlan(p.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
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
  historyTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    marginTop: 30,
    marginBottom: 10,
  },
  empty: { color: COLORS.gray, fontSize: FONT_SIZES.small },
  historyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  historyCrop: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.small },
  historyLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 4 },
  historyDate: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  deleteButtonText: { color: COLORS.gray, fontSize: 16, fontWeight: "700" },
});