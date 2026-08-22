import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { COLORS, FONT_SIZES } from "../constants/colors";

// Get a free key at https://openweathermap.org/api
const OPENWEATHER_API_KEY = "a6d9ce2a04a26b411146edc48225fe08";

export default function WeatherScreen() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [placeName, setPlaceName] = useState("");

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission is needed to show weather for your farm.");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const currentData = await currentRes.json();

      if (currentData.cod && currentData.cod !== 200) {
        throw new Error(currentData.message || "Could not fetch weather");
      }

      setCurrent(currentData);
      setPlaceName(currentData.name || "Your location");

      // 5-day forecast (returns data every 3 hours; we'll pick midday entries)
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const forecastData = await forecastRes.json();

      if (forecastData.list) {
        const daily = forecastData.list.filter((item) => item.dt_txt.includes("12:00:00"));
        setForecast(daily.slice(0, 5));
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong fetching weather.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const getCropWarning = (temp, humidity, windSpeed) => {
    if (temp > 40) return "🔴 Extreme heat — protect crops from heat stress, irrigate early morning.";
    if (humidity > 85) return "🟡 High humidity — watch for fungal disease risk.";
    if (windSpeed > 10) return "🟡 Strong winds — secure young plants and check for damage.";
    return "🟢 Conditions look normal for most crops today.";
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
        <Text style={{ marginTop: 10, color: COLORS.gray }}>Fetching weather for your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeather}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>⛅ Weather</Text>
      <Text style={styles.subtitle}>{placeName}</Text>

      {current && (
        <View style={styles.currentCard}>
          <Text style={styles.temp}>{Math.round(current.main.temp)}°C</Text>
          <Text style={styles.description}>{current.weather[0].description}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>{current.main.humidity}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statValue}>{current.wind.speed} m/s</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Feels like</Text>
              <Text style={styles.statValue}>{Math.round(current.main.feels_like)}°C</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {getCropWarning(current.main.temp, current.main.humidity, current.wind.speed)}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.forecastTitle}>📅 5-Day Forecast</Text>
      {forecast.map((day, index) => (
        <View key={index} style={styles.forecastCard}>
          <Text style={styles.forecastDate}>
            {new Date(day.dt_txt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </Text>
          <Text style={styles.forecastTemp}>{Math.round(day.main.temp)}°C</Text>
          <Text style={styles.forecastDesc}>{day.weather[0].description}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.refreshButton} onPress={loadWeather}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20 },
  errorText: { color: COLORS.darkGreenText, textAlign: "center", fontSize: FONT_SIZES.body, marginBottom: 16 },
  retryButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: { color: COLORS.white, fontWeight: "700" },
  currentCard: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  temp: { fontSize: 48, fontWeight: "700", color: COLORS.primaryDeepGreen },
  description: { fontSize: FONT_SIZES.body, color: COLORS.darkGreenText, textTransform: "capitalize", marginTop: 4 },
  statsRow: { flexDirection: "row", marginTop: 16, gap: 20 },
  statBox: { alignItems: "center" },
  statLabel: { fontSize: 11, color: COLORS.gray },
  statValue: { fontSize: FONT_SIZES.body, fontWeight: "700", color: COLORS.darkGreenText, marginTop: 2 },
  warningBox: {
    backgroundColor: COLORS.goldTint,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    width: "100%",
  },
  warningText: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, textAlign: "center" },
  forecastTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    marginTop: 30,
    marginBottom: 10,
  },
  forecastCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  forecastDate: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, fontWeight: "600", flex: 1 },
  forecastTemp: { fontSize: FONT_SIZES.body, fontWeight: "700", color: COLORS.primaryDeepGreen, flex: 1, textAlign: "center" },
  forecastDesc: { fontSize: 11, color: COLORS.gray, flex: 1, textAlign: "right", textTransform: "capitalize" },
  refreshButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  refreshButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
});