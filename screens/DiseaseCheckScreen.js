import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

// Get a free key at https://admin.kindwise.com/signup (100 free credits on signup)
const CROP_HEALTH_API_KEY = "dxPX4cGaeD97WZ8Gmvb2K7cQQsabbdznQMhIQJV52w25mADvZE";

// Below this confidence, we don't show the diagnosis as reliable —
// we tell the farmer to consult an expert instead. This protects against
// the app confidently naming the wrong disease.
const CONFIDENCE_THRESHOLD = 0.4;

// A small reference library so the app stays useful even when the AI can't
// confidently identify a crop from the photo. Not exhaustive — just the most
// common issues farmers are likely to see, to help with visual comparison.
const COMMON_DISEASES = {
  pomegranate: [
    { name: "Bacterial Blight", symptoms: "Dark water-soaked spots on leaves, fruit, and stems; cracked fruit." },
    { name: "Fruit Borer", symptoms: "Small holes in fruit with visible frass (insect waste); premature fruit drop." },
    { name: "Wilt", symptoms: "Yellowing and wilting of leaves, often starting on one side of the plant." },
  ],
  tomato: [
    { name: "Early Blight", symptoms: "Dark concentric rings on older leaves, yellowing around the spots." },
    { name: "Late Blight", symptoms: "Water-soaked patches on leaves that turn brown/black rapidly, white mold underneath." },
    { name: "Leaf Curl Virus", symptoms: "Upward curling and yellowing of leaves, stunted growth." },
  ],
  rice: [
    { name: "Blast", symptoms: "Diamond-shaped grey lesions with brown borders on leaves." },
    { name: "Bacterial Leaf Blight", symptoms: "Yellow to white stripes along leaf veins, drying from the tip." },
    { name: "Brown Spot", symptoms: "Small oval brown spots scattered across leaves and grains." },
  ],
  wheat: [
    { name: "Rust (Yellow/Brown/Black)", symptoms: "Orange, brown, or black powdery pustules on leaves and stems." },
    { name: "Powdery Mildew", symptoms: "White powdery coating on leaves, especially in humid conditions." },
    { name: "Karnal Bunt", symptoms: "Grains partially replaced by black powdery fungal mass with a foul smell." },
  ],
  cotton: [
    { name: "Bollworm", symptoms: "Holes in bolls, frass visible; damaged squares and flowers." },
    { name: "Leaf Curl Virus", symptoms: "Upward curling of leaves, thickened veins, stunted growth." },
    { name: "Bacterial Blight", symptoms: "Angular water-soaked spots on leaves, later turning brown." },
  ],
  onion: [
    { name: "Purple Blotch", symptoms: "Purple-brown lesions with concentric rings on leaves." },
    { name: "Thrips", symptoms: "Silvery streaks on leaves, curling and distorted growth." },
    { name: "Downy Mildew", symptoms: "Pale yellow patches on leaves with grey-purple fuzzy growth underneath." },
  ],
  potato: [
    { name: "Late Blight", symptoms: "Water-soaked dark patches on leaves, white mold underneath in humid weather." },
    { name: "Early Blight", symptoms: "Dark concentric rings (target-like) on older leaves." },
    { name: "Common Scab", symptoms: "Rough, corky patches on tuber skin." },
  ],
};

function findCommonDiseases(cropInput) {
  const key = cropInput.trim().toLowerCase();
  return COMMON_DISEASES[key] || null;
}

export default function DiseaseCheckScreen() {
  const [image, setImage] = useState(null); // preview URI
  const [imageBase64, setImageBase64] = useState(null); // actual data sent to the API
  const [cropNameInput, setCropNameInput] = useState(""); // optional: tell the API what crop this is
  const [manualCropFallback, setManualCropFallback] = useState("");
  const [fallbackDiseases, setFallbackDiseases] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!picked.canceled) {
      setImage(picked.assets[0].uri);
      setImageBase64(picked.assets[0].base64);
      setResult(null);
      setErrorMsg(null);
      setFallbackDiseases(null);
      setManualCropFallback("");
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (!picked.canceled) {
      setImage(picked.assets[0].uri);
      setImageBase64(picked.assets[0].base64);
      setResult(null);
      setErrorMsg(null);
      setFallbackDiseases(null);
      setManualCropFallback("");
    }
  };

  const analyze = async () => {
    if (!imageBase64) {
      setErrorMsg("Could not read this photo. Please try picking it again.");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const url = "https://crop.kindwise.com/api/v1/identification?details=treatment,description,symptoms,severity";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": CROP_HEALTH_API_KEY,
        },
        body: JSON.stringify({ images: [imageBase64] }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Server did not return valid data. Raw response: ${responseText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Server error (${response.status}). Please try again.`);
      }

      const cropSuggestions = data.result?.crop?.suggestions || [];
      const diseaseSuggestions = data.result?.disease?.suggestions || [];

      const topCrop = cropSuggestions[0];
      const topDisease = diseaseSuggestions[0];

      // Some responses include "healthy" itself as a disease-like suggestion
      // with its own confidence score, rather than simply omitting a disease.
      const diseaseIsHealthyLabel = topDisease?.name?.toLowerCase().includes("healthy");

      const diagnosis = {
        cropName: topCrop ? topCrop.name : cropNameInput.trim() || "Unknown crop",
        cropConfidence: topCrop ? topCrop.probability : 0,
        cropWasTyped: !topCrop && !!cropNameInput.trim(),
        cropUnclear: !topCrop || topCrop.probability < 0.3,
        diseaseName: topDisease ? topDisease.name : null,
        diseaseConfidence: topDisease ? topDisease.probability : 0,
        isHealthy: !topDisease || diseaseIsHealthyLabel,
        treatment: topDisease?.details?.treatment || null,
        description: topDisease?.details?.description || null,
        symptoms: topDisease?.details?.symptoms || null,
        severity: topDisease?.details?.severity || null,
      };

      setResult(diagnosis);

      // Save to history so the farmer can track past checks
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("disease_checks").insert([
          {
            user_id: user.id,
            crop_name: diagnosis.cropName,
            disease_name: diagnosis.diseaseName,
            confidence: diagnosis.diseaseConfidence,
            is_healthy: diagnosis.isHealthy,
          },
        ]);
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please check your internet connection and try again.");
    }

    setAnalyzing(false);
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

      <Text style={styles.label}>Crop name (optional, for your own record)</Text>
      <TextInput
        style={styles.input}
        value={cropNameInput}
        onChangeText={setCropNameInput}
        placeholder="e.g. pomegranate, tomato, rice, wheat"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryButtonText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !image && styles.buttonDisabled]}
        onPress={analyze}
        disabled={!image || analyzing}
      >
        <Text style={styles.buttonText}>{analyzing ? "Analyzing..." : "🔍 Check My Crop"}</Text>
      </TouchableOpacity>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>
            Crop: {result.cropName}
            {result.cropWasTyped ? " (as you entered)" : ` (${Math.round(result.cropConfidence * 100)}% match)`}
          </Text>

          {result.cropConfidence < 0.3 && !result.cropWasTyped && (
            <View>
              <Text style={styles.lowConfidenceNote}>
                Low confidence on crop identification — for a clearer result next time, fill the frame with a single
                leaf or fruit in good daylight.
              </Text>

              <Text style={styles.label}>Not right? Tell us your crop to see common diseases:</Text>
              <TextInput
                style={styles.input}
                value={manualCropFallback}
                onChangeText={setManualCropFallback}
                placeholder="e.g. pomegranate, tomato, rice, wheat"
              />
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setFallbackDiseases(findCommonDiseases(manualCropFallback))}
                disabled={!manualCropFallback.trim()}
              >
                <Text style={styles.secondaryActionText}>Show Common Diseases for This Crop</Text>
              </TouchableOpacity>

              {fallbackDiseases === null && manualCropFallback.trim() ? null : fallbackDiseases &&
              fallbackDiseases.length > 0 ? (
                fallbackDiseases.map((d) => (
                  <View key={d.name} style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>{d.name}</Text>
                    <Text style={styles.infoText}>{d.symptoms}</Text>
                  </View>
                ))
              ) : fallbackDiseases !== null ? (
                <Text style={styles.resultLine}>
                  We don't have a reference list for that crop yet. Please consult a local agricultural expert.
                </Text>
              ) : null}
            </View>
          )}

          {result.isHealthy ? (
            <Text style={styles.healthyText}>✅ No significant disease detected — crop looks healthy.</Text>
          ) : (
            <>
              <Text style={styles.diseaseTitle}>{result.diseaseName}</Text>
              <Text style={styles.resultLine}>Confidence: {Math.round(result.diseaseConfidence * 100)}%</Text>

              {result.severity && <Text style={styles.resultLine}>Severity: {result.severity}</Text>}

              {result.symptoms && (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Symptoms</Text>
                  <Text style={styles.infoText}>{result.symptoms}</Text>
                </View>
              )}

              {result.description && (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>About this issue</Text>
                  <Text style={styles.infoText}>{result.description}</Text>
                </View>
              )}

              {result.treatment && (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>General Treatment Guidance</Text>
                  <Text style={styles.infoText}>{result.treatment}</Text>
                </View>
              )}

              {result.diseaseConfidence < CONFIDENCE_THRESHOLD ? (
                <Text style={styles.warning}>
                  ⚠️ Confidence is low — this may not be the correct diagnosis. Please confirm with an agricultural
                  expert before applying any treatment.
                </Text>
              ) : (
                <Text style={styles.warning}>
                  ⚠️ This is an AI estimate, not a certain diagnosis. Confirm with a local agricultural expert before
                  buying or applying any treatment, and always follow the product label instructions.
                </Text>
              )}
            </>
          )}
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
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginTop: 14, marginBottom: 4, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: { color: COLORS.primaryDeepGreen, fontWeight: "600", fontSize: FONT_SIZES.small },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: COLORS.gray },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  errorBox: {
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  errorText: { color: "#B3261E", fontSize: FONT_SIZES.small },
  resultBox: {
    backgroundColor: COLORS.goldTint,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
  },
  resultTitle: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginBottom: 6 },
  diseaseTitle: { fontWeight: "700", color: "#8A5B00", fontSize: FONT_SIZES.body, marginBottom: 4 },
  resultLine: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginBottom: 6 },
  infoBlock: { marginTop: 10 },
  infoLabel: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: 11, marginBottom: 3, textTransform: "uppercase" },
  infoText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, lineHeight: 18 },
  healthyText: { color: COLORS.primaryDeepGreen, fontWeight: "600", fontSize: FONT_SIZES.body },
  warning: { color: "#8A5B00", fontSize: FONT_SIZES.small, fontStyle: "italic", marginTop: 10 },
  lowConfidenceNote: { color: "#8A5B00", fontSize: FONT_SIZES.small, marginBottom: 10, fontStyle: "italic" },
  secondaryActionButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryActionText: { color: COLORS.white, fontWeight: "600", fontSize: FONT_SIZES.small },
});