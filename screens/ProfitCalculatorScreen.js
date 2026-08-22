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

export default function ProfitCalculatorScreen() {
  const [investment, setInvestment] = useState("");
  const [expectedYield, setExpectedYield] = useState(""); // in kg
  const [pricePerKg, setPricePerKg] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pastCalcs, setPastCalcs] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);

  const loadPastCalcs = useCallback(async () => {
    setLoadingPast(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingPast(false);
      return;
    }

    const { data, error } = await supabase
      .from("profit_calculations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setPastCalcs(data);
    setLoadingPast(false);
  }, []);

  useEffect(() => {
    loadPastCalcs();
  }, [loadPastCalcs]);

  const calculate = async () => {
    const inv = parseFloat(investment) || 0;
    const yieldKg = parseFloat(expectedYield) || 0;
    const price = parseFloat(pricePerKg) || 0;
    const revenue = yieldKg * price;
    const profit = revenue - inv;

    const calcResult = {
      revenue,
      profit,
      status: profit >= 0 ? "Profit ✅" : "Loss ⚠️",
    };
    setResult(calcResult);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    const { error } = await supabase.from("profit_calculations").insert([
      {
        user_id: user.id,
        investment: inv,
        expected_yield: yieldKg,
        price_per_kg: price,
        revenue,
        profit,
      },
    ]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not save calculation", error.message);
    } else {
      loadPastCalcs();
    }
  };

  const deleteCalc = async (id) => {
    const { error } = await supabase.from("profit_calculations").delete().eq("id", id);
    if (error) {
      Alert.alert("Could not delete", error.message);
    } else {
      setPastCalcs((prev) => prev.filter((c) => c.id !== id));
    }
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

      <TouchableOpacity style={styles.button} onPress={calculate} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Calculate"}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLine}>Estimated revenue: ₹{result.revenue.toLocaleString("en-IN")}</Text>
          <Text style={styles.resultLine}>Estimated profit/loss: ₹{result.profit.toLocaleString("en-IN")}</Text>
          <Text style={styles.status}>{result.status}</Text>
        </View>
      )}

      <Text style={styles.historyTitle}>📜 Past Calculations</Text>
      {loadingPast ? (
        <ActivityIndicator color={COLORS.primaryDeepGreen} style={{ marginTop: 10 }} />
      ) : pastCalcs.length === 0 ? (
        <Text style={styles.empty}>No past calculations yet.</Text>
      ) : (
        pastCalcs.map((c) => (
          <View key={c.id} style={styles.historyCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLine}>
                  Revenue: ₹{Number(c.revenue).toLocaleString("en-IN")} • Profit: ₹
                  {Number(c.profit).toLocaleString("en-IN")}
                </Text>
                <Text style={styles.historyDate}>{new Date(c.created_at).toLocaleDateString("en-IN")}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteCalc(c.id)} style={styles.deleteButton}>
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
  historyLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  historyDate: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  deleteButtonText: { color: COLORS.gray, fontSize: 16, fontWeight: "700" },
});