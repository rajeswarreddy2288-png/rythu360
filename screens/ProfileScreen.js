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

export default function ProfileScreen() {
  const [fullName, setFullName] = useState("");
  const [village, setVillage] = useState("");
  const [mandal, setMandal] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      Alert.alert("Could not load profile", error.message);
    } else if (data) {
      setFullName(data.full_name || "");
      setVillage(data.village || "");
      setMandal(data.mandal || "");
      setDistrict(data.district || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    // upsert = create the profile row if it doesn't exist yet, otherwise update it
    const { error } = await supabase.from("farmer_profiles").upsert({
      id: user.id,
      full_name: fullName,
      village,
      mandal,
      district,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Could not save profile", error.message);
    } else {
      Alert.alert("Saved", "Your profile has been updated.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>👤 My Profile</Text>
      <Text style={styles.subtitle}>{email}</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Rajesh Reddy" />

      <Text style={styles.label}>Village</Text>
      <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="e.g. Yerraguntla" />

      <Text style={styles.label}>Mandal</Text>
      <TextInput style={styles.input} value={mandal} onChangeText={setMandal} placeholder="e.g. Kadapa" />

      <Text style={styles.label}>District</Text>
      <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. YSR Kadapa" />

      <TouchableOpacity style={styles.button} onPress={saveProfile} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>
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
});