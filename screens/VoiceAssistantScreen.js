import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { COLORS, FONT_SIZES } from "../constants/colors";

// Get a free key at https://indus.sarvam.ai (no credit card needed)
const SARVAM_API_KEY = "sk_soxkmr19_JBGejuU3QuVH5n97BzhZIDL9";

// Very small keyword-based assistant so the app can answer common farmer
// questions without needing a full conversational AI backend. This is
// intentionally simple — it recognizes a few common intents from the
// transcribed Telugu/English text and points to the right part of the app.
function getAssistantReply(transcript) {
  const text = transcript.toLowerCase();

  if (text.includes("weather") || text.includes("వాతావరణం") || text.includes("వర్షం")) {
    return "వాతావరణం చూడటానికి Weather ట్యాబ్‌కి వెళ్ళండి. (Go to the Weather tab to check today's forecast.)";
  }
  if (text.includes("price") || text.includes("ధర") || text.includes("మార్కెట్") || text.includes("mandi")) {
    return "పంట ధరల కోసం Mandi Prices ట్యాబ్‌కి వెళ్ళండి. (Go to the Mandi Prices tab to check today's rates.)";
  }
  if (text.includes("disease") || text.includes("వ్యాధి") || text.includes("పురుగు")) {
    return "పంట వ్యాధిని తనిఖీ చేయడానికి Disease Check ట్యాబ్‌కి వెళ్ళి ఫోటో తీయండి. (Go to Disease Check and take a photo.)";
  }
  if (text.includes("scheme") || text.includes("పథకం") || text.includes("ప్రభుత్వ")) {
    return "ప్రభుత్వ పథకాల కోసం Schemes ట్యాబ్‌ని చూడండి. (Check the Schemes tab for government scheme details.)";
  }
  if (text.includes("profit") || text.includes("లాభం") || text.includes("నష్టం")) {
    return "లాభం లెక్కించడానికి Profit ట్యాబ్‌ని ఉపయోగించండి. (Use the Profit tab to calculate your expected profit or loss.)";
  }

  return "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి వాతావరణం, ధరలు, వ్యాధి, పథకాలు లేదా లాభం గురించి అడగండి. (Sorry, I didn't understand. Try asking about weather, prices, disease, schemes, or profit.)";
}

export default function VoiceAssistantScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow microphone access to use voice input.");
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setTranscript("");
      setReply("");
    } catch (err) {
      Alert.alert("Could not start recording", err.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Build a multipart form upload with the recorded audio file
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "recording.m4a",
        type: "audio/x-m4a",
      });
      formData.append("model", "saaras:v3");
      formData.append("language_code", "te-IN");

      const response = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": SARVAM_API_KEY,
        },
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Unexpected response: ${responseText.slice(0, 150)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || "Could not transcribe audio.");
      }

      const heard = data.transcript || "";
      setTranscript(heard);

      if (heard) {
        setReply(getAssistantReply(heard));
      } else {
        setReply("వినిపించలేదు, మళ్ళీ ప్రయత్నించండి. (Could not hear anything, please try again.)");
      }
    } catch (err) {
      Alert.alert("Could not process recording", err.message);
    }

    setTranscribing(false);
  };

  const speakReply = () => {
    if (!reply) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(reply, {
      language: "te-IN",
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, alignItems: "center" }}>
      <Text style={styles.title}>🎙️ వాయిస్ అసిస్టెంట్</Text>
      <Text style={styles.subtitle}>Voice Assistant — speak your question in Telugu</Text>

      <TouchableOpacity
        style={[styles.micButton, isRecording && styles.micButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={transcribing}
      >
        <Text style={styles.micIcon}>{isRecording ? "⏹️" : "🎙️"}</Text>
      </TouchableOpacity>

      <Text style={styles.micHint}>
        {transcribing ? "వింటున్నాను... (Processing...)" : isRecording ? "Tap to stop" : "Tap and speak"}
      </Text>

      {transcribing && <ActivityIndicator color={COLORS.primaryDeepGreen} style={{ marginTop: 16 }} />}

      {transcript ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>మీరు చెప్పింది (You said):</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>

          <Text style={styles.resultLabel}>సమాధానం (Answer):</Text>
          <Text style={styles.replyText}>{reply}</Text>

          <TouchableOpacity style={styles.listenButton} onPress={speakReply}>
            <Text style={styles.listenButtonText}>{speaking ? "⏹️ Stop" : "🔊 వినండి (Listen)"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        This assistant recognizes a few common topics (weather, prices, disease, schemes, profit) and points you to
        the right screen. For detailed answers, use those screens directly.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen, textAlign: "center" },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 30, textAlign: "center" },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryDeepGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonActive: { backgroundColor: "#B3261E" },
  micIcon: { fontSize: 40 },
  micHint: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 14, fontWeight: "600" },
  resultBox: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
    width: "100%",
  },
  resultLabel: {
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    fontSize: 11,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 4,
  },
  transcriptText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.body },
  replyText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.body, lineHeight: 20 },
  listenButton: {
    backgroundColor: COLORS.harvestGold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 16,
  },
  listenButtonText: { color: COLORS.darkGreenText, fontWeight: "700", fontSize: FONT_SIZES.small },
  disclaimer: { color: COLORS.gray, fontSize: 11, marginTop: 30, fontStyle: "italic", textAlign: "center" },
});