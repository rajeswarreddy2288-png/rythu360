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
import { supabase } from "../supabase";

export default function FarmDiaryScreen() {
  const [crop, setCrop] = useState("");
  const [expenses, setExpenses] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("farm_diary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Could not load entries", error.message);
    } else {
      setEntries(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = async () => {
    if (!crop) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    const { error } = await supabase
      .from("farm_diary")
      .insert([{ crop, expenses: parseFloat(expenses) || 0, user_id: user.id }]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not save entry", error.message);
      return;
    }

    setCrop("");
    setExpenses("");
    loadEntries(); // refresh the list from the database
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>📔 Farm Diary</Text>
        <Text style={styles.subtitle}>Log each crop cycle to compare prediction vs. reality later</Text>

        <Text style={styles.label}>Crop</Text>
        <TextInput style={styles.input} value={crop} onChangeText={setCrop} placeholder="e.g. Pomegranate" />

        <Text style={styles.label}>Expenses so far (₹)</Text>
        <TextInput
          style={styles.input}
          value={expenses}
          onChangeText={setExpenses}
          keyboardType="numeric"
          placeholder="e.g. 45000"
        />

        <TouchableOpacity style={styles.button} onPress={addEntry} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : "+ Add Entry"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet — add your first crop above.</Text>}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <Text style={styles.entryCrop}>{item.crop}</Text>
              <Text style={styles.entryLine}>Expenses: ₹{Number(item.expenses).toLocaleString("en-IN")}</Text>
              <Text style={styles.entryDate}>
                {new Date(item.created_at).toLocaleDateString("en-IN")}
              </Text>
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
    marginTop: 20,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  entryCard: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  entryCrop: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  entryLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 4 },
  entryDate: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
});