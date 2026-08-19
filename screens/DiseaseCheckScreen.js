import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONT_SIZES } from "../constants/colors";

export default function DiseaseCheckScreen() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!picked.canceled) {
      setImage(picked.assets[0].uri);
      setResult(null);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    setResult(null);
    // TODO: send `image` to your disease-detection model / API here.
    // Keep the "low confidence -> ask an expert" fallback — never let the
    // model invent a treatment it isn't confident about.
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        crop: "Pomegranate",
        confidence: 62,
        note: "Confidence is below the safe threshold. Please consult an agricultural expert before applying any treatment.",
      });
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>📸 Crop Disease Check</Text>
      <Text style={styles.subtitle}>Take or upload a clear photo of the affected leaf/fruit</Text>

      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <Text style={styles.uploadText}>📷 Tap to choose a photo</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !image && styles.buttonDisabled]}
        onPress={analyze}
        disabled={!image || analyzing}
      >
        <Text style={styles.buttonText}>{analyzing ? "Analyzing..." : "🔍 Check My Crop"}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Crop: {result.crop}</Text>
          <Text style={styles.resultLine}>Confidence: {result.confidence}%</Text>
          <Text style={styles.warning}>⚠️ {result.note}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20 },
  uploadBox: {
    height: 200,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.lightGreenCard,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  uploadText: { color: COLORS.gray, fontSize: FONT_SIZES.body },
  preview: { width: "100%", height: "100%" },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: COLORS.gray },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  resultBox: {
    backgroundColor: COLORS.goldTint,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
  },
  resultTitle: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginBottom: 6 },
  resultLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginBottom: 6 },
  warning: { color: "#8A5B00", fontSize: FONT_SIZES.small, fontStyle: "italic" },
});
