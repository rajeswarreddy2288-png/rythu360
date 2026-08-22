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

export default function MyFarmsScreen({ navigation }) {
  const [farmName, setFarmName] = useState("");
  const [area, setArea] = useState("");
  const [village, setVillage] = useState("");
  const [soilType, setSoilType] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadFarms = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Could not load farms", error.message);
    } else {
      setFarms(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFarms();
    const unsubscribe = navigation.addListener("focus", loadFarms);
    return unsubscribe;
  }, [loadFarms, navigation]);

  const addFarm = async () => {
    if (!farmName) {
      Alert.alert("Missing info", "Please enter a farm name.");
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

    const { error } = await supabase.from("farms").insert([
      {
        user_id: user.id,
        farm_name: farmName,
        area_acres: parseFloat(area) || null,
        village,
        soil_type: soilType,
        water_source: waterSource,
      },
    ]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not save farm", error.message);
      return;
    }

    setFarmName("");
    setArea("");
    setVillage("");
    setSoilType("");
    setWaterSource("");
    setShowForm(false);
    loadFarms();
  };

  const deleteFarm = async (id) => {
    Alert.alert("Delete farm?", "This will also delete all crops linked to this farm.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("farms").delete().eq("id", id);
          if (error) {
            Alert.alert("Could not delete", error.message);
          } else {
            setFarms((prev) => prev.filter((f) => f.id !== id));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.title}>🚜 My Farms</Text>
        <Text style={styles.subtitle}>Manage your farms and track crops on each one</Text>

        <TouchableOpacity style={styles.addToggle} onPress={() => setShowForm((prev) => !prev)}>
          <Text style={styles.addToggleText}>{showForm ? "Cancel" : "+ Add a New Farm"}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.label}>Farm Name</Text>
            <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} placeholder="e.g. North Field" />

            <Text style={styles.label}>Area (acres)</Text>
            <TextInput style={styles.input} value={area} onChangeText={setArea} keyboardType="numeric" placeholder="e.g. 3" />

            <Text style={styles.label}>Village</Text>
            <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="e.g. Yerraguntla" />

            <Text style={styles.label}>Soil Type</Text>
            <TextInput style={styles.input} value={soilType} onChangeText={setSoilType} placeholder="e.g. Red soil" />

            <Text style={styles.label}>Water Source</Text>
            <TextInput style={styles.input} value={waterSource} onChangeText={setWaterSource} placeholder="e.g. Borewell" />

            <TouchableOpacity style={styles.button} onPress={addFarm} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Farm"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={farms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>No farms yet — add your first farm above.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.farmCard}
              onPress={() => navigation.navigate("Farm Crops", { farmId: item.id, farmName: item.farm_name })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.farmName}>🌾 {item.farm_name}</Text>
                  {item.area_acres ? <Text style={styles.farmLine}>{item.area_acres} acres</Text> : null}
                  {item.village ? <Text style={styles.farmLine}>{item.village}</Text> : null}
                  {item.soil_type ? <Text style={styles.farmLine}>Soil: {item.soil_type}</Text> : null}
                  {item.water_source ? <Text style={styles.farmLine}>Water: {item.water_source}</Text> : null}
                  <Text style={styles.tapHint}>Tap to view crops →</Text>
                </View>
                <TouchableOpacity onPress={() => deleteFarm(item.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
  farmCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  farmName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  farmLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 2 },
  tapHint: { color: COLORS.harvestGold, fontSize: 11, marginTop: 6, fontWeight: "600" },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 },
  deleteButtonText: { color: COLORS.gray, fontSize: 16, fontWeight: "700" },
});