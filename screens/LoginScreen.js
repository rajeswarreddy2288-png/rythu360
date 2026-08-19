import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      Alert.alert(isSignUp ? "Could not sign up" : "Could not log in", error.message);
    }
    // No need to navigate manually — App.js listens for auth state
    // changes and will switch to the main app automatically.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌾</Text>
      <Text style={styles.title}>Rythu360</Text>
      <Text style={styles.subtitle}>{isSignUp ? "Create your account" : "Welcome back"}</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Log In"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)} style={{ marginTop: 20 }}>
        <Text style={styles.switchText}>
          {isSignUp ? "Already have an account? Log In" : "New here? Create an account"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 4 },
  title: {
    fontSize: FONT_SIZES.h1,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.darkGreenText,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 30,
  },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginBottom: 4, fontWeight: "600" },
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
    marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  switchText: { color: COLORS.primaryDeepGreen, textAlign: "center", fontSize: FONT_SIZES.small },
});