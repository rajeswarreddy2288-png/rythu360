import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

// Public sample key provided by data.gov.in for light/testing use.
// No personal registration needed. Limited to ~10 records per request.
const DATA_GOV_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

export default function MandiPricesScreen() {
  const [commodity, setCommodity] = useState("Tomato");
  const [state, setState] = useState("Andhra Pradesh");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searched, setSearched] = useState(false);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const buildUrl = (includeState) =>
        `https://api.data.gov.in/resource/${RESOURCE_ID}` +
        `?api-key=${DATA_GOV_API_KEY}&format=json&limit=10` +
        `&filters[commodity]=${encodeURIComponent(commodity.trim())}` +
        (includeState && state.trim() ? `&filters[state]=${encodeURIComponent(state.trim())}` : "");

      // First try with state filter (if provided)
      let res = await fetch(buildUrl(true));
      let data = await res.json();
      let foundRecords = data.records || [];

      // If nothing found and a state was given, retry without the state
      // filter — state names in this dataset must match an exact spelling
      // (e.g. "Keralam" not "Kerala"), so a mismatch shouldn't dead-end the search.
      if (foundRecords.length === 0 && state.trim()) {
        res = await fetch(buildUrl(false));
        data = await res.json();
        foundRecords = data.records || [];
        if (foundRecords.length > 0) {
          setErrorMsg(
            `No results for "${state}" specifically — showing results from all states instead. State names must match the government database's exact spelling.`
          );
        }
      }

      setRecords(foundRecords);
    } catch (err) {
      setErrorMsg("Could not fetch mandi prices. Please check your internet connection and try again.");
      setRecords([]);
    }

    setLoading(false);
  }, [commodity, state]);

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>📈 Mandi Prices</Text>
        <Text style={styles.subtitle}>Search real market prices from Indian mandis</Text>

        <Text style={styles.label}>Commodity</Text>
        <TextInput style={styles.input} value={commodity} onChangeText={setCommodity} placeholder="e.g. Tomato, Onion, Pomegranate" />

        <Text style={styles.label}>State (optional)</Text>
        <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="e.g. Andhra Pradesh" />

        <TouchableOpacity style={styles.button} onPress={fetchPrices} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Searching..." : "🔍 Search Prices"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          ListHeaderComponent={
            errorMsg && records.length > 0 ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>{errorMsg}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>
                {errorMsg && records.length === 0
                  ? errorMsg
                  : `No results found for "${commodity}"${state ? ` in ${state}` : ""}. Try a different commodity name, e.g. Onion, Potato, Tomato, Wheat.`}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.priceCard}>
              <Text style={styles.marketName}>{item.market || "Unknown market"}</Text>
              <Text style={styles.locationLine}>
                {item.district}, {item.state}
              </Text>
              <View style={styles.priceRow}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <Text style={styles.priceValue}>₹{item.min_price}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <Text style={styles.priceValue}>₹{item.max_price}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Modal</Text>
                  <Text style={[styles.priceValue, { color: COLORS.primaryDeepGreen }]}>₹{item.modal_price}</Text>
                </View>
              </View>
              <Text style={styles.dateLine}>{item.arrival_date}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 16 },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginTop: 10, marginBottom: 4, fontWeight: "600" },
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
    marginTop: 16,
    marginBottom: 10,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  noticeBox: {
    backgroundColor: COLORS.goldTint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, textAlign: "center" },
  errorText: { color: COLORS.darkGreenText, textAlign: "center", marginTop: 30, paddingHorizontal: 20 },
  priceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  marketName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  locationLine: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  priceBox: { alignItems: "center", flex: 1 },
  priceLabel: { fontSize: 11, color: COLORS.gray },
  priceValue: { fontSize: FONT_SIZES.body, fontWeight: "700", color: COLORS.darkGreenText, marginTop: 2 },
  dateLine: { fontSize: 11, color: COLORS.gray, marginTop: 8, textAlign: "right" },
});