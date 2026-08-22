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

const GROWTH_STAGES = ["Planted", "Growing", "Flowering", "Fruiting", "Ready to Harvest", "Harvested"];

export default function FarmCropsScreen({ route }) {
  const { farmId, farmName } = route.params;

  const [cropName, setCropName] = useState("");
  const [variety, setVariety] = useState("");
  const [acreage, setAcreage] = useState("");
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crops")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Could not load crops", error.message);
    } else {
      setCrops(data);
    }
    setLoading(false);
  }, [farmId]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const addCrop = async () => {
    if (!cropName) {
      Alert.alert("Missing info", "Please enter a crop name.");
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    const { error } = await supabase.from("crops").insert([
      {
        farm_id: farmId,
        user_id: user.id,
        crop_name: cropName,
        variety,
        acreage: parseFloat(acreage) || null,
        sowing_date: new Date().toISOString().slice(0, 10),
      },
    ]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not save crop", error.message);
      return;
    }

    setCropName("");
    setVariety("");
    setAcreage("");
    setShowForm(false);
    loadCrops();
  };

  const updateStage = async (cropId, newStage) => {
    const { error } = await supabase.from("crops").update({ growth_stage: newStage }).eq("id", cropId);
    if (error) {
      Alert.alert("Could not update", error.message);
    } else {
      loadCrops();
    }
  };

  const deleteCrop = async (id) => {
    const { error } = await supabase.from("crops").delete().eq("id", id);
    if (error) {
      Alert.alert("Could not delete", error.message);
    } else {
      setCrops((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>🌱 {farmName}</Text>
        <Text style={styles.subtitle}>Crops on this farm</Text>

        <TouchableOpacity style={styles.addToggle} onPress={() => setShowForm((prev) => !prev)}>
          <Text style={styles.addToggleText}>{showForm ? "Cancel" : "+ Add a Crop"}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.label}>Crop Name</Text>
            <TextInput style={styles.input} value={cropName} onChangeText={setCropName} placeholder="e.g. Pomegranate" />

            <Text style={styles.label}>Variety</Text>
            <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="e.g. Bhagwa" />

            <Text style={styles.label}>Acreage</Text>
            <TextInput style={styles.input} value={acreage} onChangeText={setAcreage} keyboardType="numeric" placeholder="e.g. 2" />

            <TouchableOpacity style={styles.button} onPress={addCrop} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Crop"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>No crops yet — add your first crop above.</Text>}
          renderItem={({ item }) => (
            <View style={styles.cropCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>{item.crop_name}</Text>
                  {item.variety ? <Text style={styles.cropLine}>Variety: {item.variety}</Text> : null}
                  {item.acreage ? <Text style={styles.cropLine}>{item.acreage} acres</Text> : null}
                  <Text style={styles.cropLine}>Sown: {item.sowing_date}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteCrop(item.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.stageLabel}>Growth Stage:</Text>
              <View style={styles.stageRow}>
                {GROWTH_STAGES.map((stage) => (
                  <TouchableOpacity
                    key={stage}
                    style={[styles.stagePill, item.growth_stage === stage && styles.stagePillActive]}
                    onPress={() => updateStage(item.id, stage)}
                  >
                    <Text
                      style={[styles.stagePillText, item.growth_stage === stage && styles.stagePillTextActive]}
                    >
                      {stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  addToggle: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  addToggleText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.small },
  form: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
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
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  cropCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cropName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  cropLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 2 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 },
  deleteButtonText: { color: COLORS.gray, fontSize: 16, fontWeight: "700" },
  stageLabel: { fontSize: 11, color: COLORS.gray, marginTop: 10, marginBottom: 6, fontWeight: "600" },
  stageRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  stagePill: {
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  stagePillActive: { backgroundColor: COLORS.primaryDeepGreen, borderColor: COLORS.primaryDeepGreen },
  stagePillText: { fontSize: 11, color: COLORS.darkGreenText },
  stagePillTextActive: { color: COLORS.white, fontWeight: "700" },
});