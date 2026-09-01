import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { friendlyAuthError } from "../authErrors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // 10-digit Indian mobile number

export default function LoginScreen({ onForgotPassword }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Check your email", "Please enter a valid email address.");
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return false;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        Alert.alert("Missing name", "Please enter your full name.");
        return false;
      }
      if (!phone.trim() || !PHONE_REGEX.test(phone.trim())) {
        Alert.alert("Check your phone number", "Please enter a valid 10-digit mobile number.");
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert("Passwords don't match", "Please make sure both passwords are the same.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoading(false);
        Alert.alert("Could not sign up", friendlyAuthError(error));
        return;
      }

      // Create the farmer profile right away so it exists from account
      // creation, not only when the user later visits the Profile tab.
      const newUser = data?.user;
      if (newUser) {
        const { error: profileError } = await supabase.from("farmer_profiles").upsert(
          {
            id: newUser.id,
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
          { onConflict: "id" }
        );
        // Don't block signup on this — profile can still be completed later
        // from the Profile tab if this fails for any reason.
        if (profileError) {
          console.log("Profile creation on signup failed:", profileError.message);
        }
      }

      setLoading(false);
      // No manual navigation needed — App.js listens for the auth session
      // change and switches to the main app automatically.
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setLoading(false);

      if (error) {
        Alert.alert("Could not log in", friendlyAuthError(error));
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.emoji}>🌾</Text>
      <Text style={styles.title}>Rythu360</Text>
      <Text style={styles.subtitle}>{isSignUp ? "Create your account" : "Welcome back"}</Text>

      {isSignUp && (
        <>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Rajesh Reddy"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </>
      )}

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

      {isSignUp && (
        <>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
          />
        </>
      )}

      {!isSignUp && (
        <TouchableOpacity onPress={onForgotPassword} style={{ alignSelf: "flex-end", marginTop: 8 }}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Log In"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)} style={{ marginTop: 20 }} disabled={loading}>
        <Text style={styles.switchText}>
          {isSignUp ? "Already have an account? Log In" : "New here? Create an account"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
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
    marginBottom: 20,
  },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginBottom: 4, marginTop: 12, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZES.body,
  },
  forgotText: { color: COLORS.harvestGold, fontSize: FONT_SIZES.small, fontWeight: "600" },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  switchText: { color: COLORS.primaryDeepGreen, textAlign: "center", fontSize: FONT_SIZES.small },
});