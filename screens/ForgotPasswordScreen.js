import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as Linking from "expo-linking";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { friendlyAuthError } from "../authErrors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetEmail = async () => {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Check your email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const redirectTo = Linking.createURL("reset-password");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);

    if (error) {
      Alert.alert("Could not send reset email", friendlyAuthError(error));
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emoji}>📩</Text>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a password reset link to {email}. Open it on this phone to set a new password.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.emoji}>🔑</Text>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={sendResetEmail} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }} disabled={loading}>
        <Text style={styles.backText}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite, paddingHorizontal: 28 },
  center: { justifyContent: "center" },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 4 },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen, textAlign: "center" },
  subtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.darkGreenText,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZES.body,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  backText: { color: COLORS.primaryDeepGreen, textAlign: "center", fontSize: FONT_SIZES.small, fontWeight: "600" },
});