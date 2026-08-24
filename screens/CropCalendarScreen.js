import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";

// Generic, crop-agnostic milestones based on days since sowing. These are
// general good-practice checkpoints, not a substitute for crop-specific
// agronomic advice — framed as reminders to check/consider, not instructions.
const MILESTONES = [
  { day: 7, title: "Check germination", detail: "Walk the field and check that seeds/seedlings have come up evenly." },
  { day: 15, title: "First growth check", detail: "Look for early pest or disease signs and general plant vigor." },
  { day: 25, title: "Consider first fertilizer dose", detail: "Many crops benefit from an early nutrient top-up around this stage — check what's right for your crop." },
  { day: 40, title: "Watch for pests/disease", detail: "Mid-growth is a common window for pest and disease pressure — inspect closely." },
  { day: 55, title: "Irrigation & weeding check", detail: "Review water needs and clear competing weeds." },
  { day: 75, title: "Flowering/fruiting check", detail: "Monitor flowering or fruit set; consider a second nutrient dose if appropriate." },
  { day: 100, title: "Pre-harvest check", detail: "Start watching for readiness signs specific to your crop." },
];

function computeMilestoneDates(sowingDateStr) {
  const sowingDate = new Date(sowingDateStr);
  return MILESTONES.map((m) => {
    const date = new Date(sowingDate);
    date.setDate(date.getDate() + m.day);
    return { ...m, date };
  });
}

export default function CropCalendarScreen() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null); // crop id currently being scheduled

  const loadCrops = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("crops")
      .select("*, farms(farm_name)")
      .eq("user_id", user.id)
      .order("sowing_date", { ascending: false });

    if (!error) setCrops(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const enableReminders = async (crop) => {
    Alert.alert(
      "Phone reminders coming soon",
      "Real phone notifications need a full installable version of the app (not this testing version). For now, check this Calendar tab regularly to see upcoming milestones for your crops."
    );
  };

  const daysSinceSowing = (sowingDateStr) => {
    const diff = Date.now() - new Date(sowingDateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>📅 Crop Calendar</Text>
      <Text style={styles.subtitle}>
        General stage-based reminders from your crops' sowing dates. These are common checkpoints, not
        crop-specific instructions — adjust based on your own crop and local conditions.
      </Text>

      {crops.length === 0 ? (
        <Text style={styles.empty}>
          No crops yet. Add crops under "My Farms" first, and their calendars will appear here.
        </Text>
      ) : (
        crops.map((crop) => {
          const days = daysSinceSowing(crop.sowing_date);
          const milestones = computeMilestoneDates(crop.sowing_date);

          return (
            <View key={crop.id} style={styles.cropCard}>
              <Text style={styles.cropName}>
                {crop.crop_name} {crop.farms?.farm_name ? `— ${crop.farms.farm_name}` : ""}
              </Text>
              <Text style={styles.cropMeta}>
                Sown {crop.sowing_date} • Day {days} • Stage: {crop.growth_stage}
              </Text>

              <TouchableOpacity style={styles.reminderButton} onPress={() => enableReminders(crop)}>
                <Text style={styles.reminderButtonText}>🔔 About Phone Reminders</Text>
              </TouchableOpacity>

              <View style={styles.timeline}>
                {milestones.map((m) => {
                  const isPast = m.date < new Date();
                  return (
                    <View key={m.title} style={styles.milestoneRow}>
                      <View style={[styles.dot, isPast && styles.dotPast]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.milestoneTitle, isPast && styles.textPast]}>
                          Day {m.day}: {m.title}
                        </Text>
                        <Text style={[styles.milestoneDetail, isPast && styles.textPast]}>{m.detail}</Text>
                        <Text style={styles.milestoneDate}>
                          {m.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20, lineHeight: 18 },
  empty: { color: COLORS.gray, textAlign: "center", marginTop: 20 },
  cropCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cropName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  cropMeta: { color: COLORS.gray, fontSize: 11, marginTop: 2, marginBottom: 12 },
  reminderButton: {
    backgroundColor: COLORS.harvestGold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  reminderButtonText: { color: COLORS.darkGreenText, fontWeight: "700", fontSize: FONT_SIZES.small },
  timeline: { marginTop: 6 },
  milestoneRow: { flexDirection: "row", marginBottom: 14 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryDeepGreen,
    marginRight: 10,
    marginTop: 4,
  },
  dotPast: { backgroundColor: COLORS.lightGreenCard },
  milestoneTitle: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  milestoneDetail: { color: COLORS.darkGreenText, fontSize: 12, marginTop: 2, lineHeight: 16 },
  milestoneDate: { color: COLORS.gray, fontSize: 11, marginTop: 3 },
  textPast: { color: COLORS.gray },
});