import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS, FONT_SIZES } from "../constants/colors";

// Informational only — always verify current details on the official portal
// before applying. Eligibility rules and amounts can change.
const SCHEMES = [
  {
    name: "PM-KISAN (Income Support)",
    teluguName: "పీఎం-కిసాన్ (ఆదాయ మద్దతు)",
    benefit: "₹6,000 per year, paid in 3 installments of ₹2,000 via direct bank transfer.",
    eligibility: "Landholding farmer families (small, marginal, and large). Excludes income-tax payers, government pensioners above ₹10,000/month, and certain other high-income categories.",
    apply: "Register at pmkisan.gov.in → Farmers Corner → New Farmer Registration, or visit your nearest Common Service Centre.",
    url: "https://pmkisan.gov.in",
  },
  {
    name: "PMFBY (Crop Insurance)",
    teluguName: "పీఎంఎఫ్‌బీవై (పంట బీమా)",
    benefit: "Insurance against crop loss from drought, flood, pests, disease, and other natural calamities. Farmer pays a small premium (about 1.5–5% depending on season/crop); government covers the rest.",
    eligibility: "Farmers growing notified crops in notified areas, both loanee and non-loanee.",
    apply: "Apply through your bank, Common Service Centre, or the official PMFBY portal, usually before the season's cut-off date.",
    url: "https://pmfby.gov.in",
  },
  {
    name: "Kisan Credit Card (KCC)",
    teluguName: "కిసాన్ క్రెడిట్ కార్డ్",
    benefit: "Revolving credit line for seeds, fertilizer, pesticides, irrigation, and allied activities like dairy/fisheries, at low effective interest (around 4% with timely repayment).",
    eligibility: "Farmers, tenant farmers, and sharecroppers with proof of cultivation.",
    apply: "Apply at any nationalized bank, regional rural bank, or cooperative bank branch with land records.",
    url: "https://www.myscheme.gov.in/schemes/kcc",
  },
  {
    name: "PM Kisan Maan-Dhan Yojana (Pension)",
    teluguName: "పీఎం కిసాన్ మాన్-ధన్ యోజన (పింఛను)",
    benefit: "₹3,000/month pension after age 60. Government matches your monthly contribution (₹55–200 depending on entry age).",
    eligibility: "Small and marginal farmers aged 18–40 at the time of enrollment.",
    apply: "Enroll through Common Service Centres with Aadhaar and bank account details.",
    url: "https://maandhan.in",
  },
  {
    name: "e-NAM (National Agriculture Market)",
    teluguName: "ఈ-నామ్ (జాతీయ వ్యవసాయ మార్కెట్)",
    benefit: "Online, pan-India platform to sell produce at competitive prices, removing local middlemen and connecting to buyers across states.",
    eligibility: "Farmers registered with a participating mandi.",
    apply: "Register at your local mandi under e-NAM, or through the e-NAM mobile app.",
    url: "https://www.enam.gov.in",
  },
  {
    name: "Soil Health Card",
    teluguName: "నేల ఆరోగ్య కార్డు",
    benefit: "Free soil testing (12 parameters) with recommendations on the right crops and exact fertilizer dosage for your land. Free re-test every 2 years.",
    eligibility: "All farmers.",
    apply: "Apply through your local Krishi Vigyan Kendra (KVK) or agriculture department office.",
    url: "https://soilhealth.dac.gov.in",
  },
];

export default function SchemesScreen() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🏛️ Government Schemes</Text>
      <Text style={styles.subtitle}>
        Major central government schemes for farmers. Tap a scheme for details. Always confirm current
        eligibility and amounts on the official portal before applying.
      </Text>

      {SCHEMES.map((scheme, index) => (
        <TouchableOpacity key={scheme.name} style={styles.card} onPress={() => toggleExpand(index)} activeOpacity={0.8}>
          <Text style={styles.schemeName}>{scheme.name}</Text>
          <Text style={styles.schemeTelugu}>{scheme.teluguName}</Text>

          {expandedIndex === index && (
            <View style={styles.details}>
              <Text style={styles.detailLabel}>Benefit</Text>
              <Text style={styles.detailText}>{scheme.benefit}</Text>

              <Text style={styles.detailLabel}>Who can apply</Text>
              <Text style={styles.detailText}>{scheme.eligibility}</Text>

              <Text style={styles.detailLabel}>How to apply</Text>
              <Text style={styles.detailText}>{scheme.apply}</Text>

              <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(scheme.url)}>
                <Text style={styles.linkButtonText}>Open Official Portal →</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.tapHint}>{expandedIndex === index ? "Tap to collapse ▲" : "Tap for details ▼"}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.disclaimer}>
        This is general information, not official advice. Eligibility rules, amounts, and application steps can
        change — always verify on the official government portal linked above before applying, and consult your
        local agriculture office for help.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20, lineHeight: 18 },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  schemeName: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body },
  schemeTelugu: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 2 },
  tapHint: { color: COLORS.harvestGold, fontSize: 11, marginTop: 8, fontWeight: "600" },
  details: { marginTop: 12 },
  detailLabel: {
    fontWeight: "700",
    color: COLORS.primaryDeepGreen,
    fontSize: 11,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 3,
  },
  detailText: { color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, lineHeight: 18 },
  linkButton: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 14,
  },
  linkButtonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.small },
  disclaimer: { color: COLORS.gray, fontSize: 11, marginTop: 10, fontStyle: "italic", lineHeight: 16 },
});