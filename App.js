import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import CropPlanScreen from "./screens/CropPlanScreen";
import DiseaseCheckScreen from "./screens/DiseaseCheckScreen";
import ProfitCalculatorScreen from "./screens/ProfitCalculatorScreen";
import FarmDiaryScreen from "./screens/FarmDiaryScreen";
import LoginScreen from "./screens/LoginScreen";
import { COLORS } from "./constants/colors";
import { supabase } from "./supabase";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "🌾",
  "Crop Plan": "🌱",
  "Disease Check": "📸",
  Profit: "💰",
  Diary: "📔",
};

function LogoutButton() {
  return (
    <TouchableOpacity
      onPress={() => supabase.auth.signOut()}
      style={{ marginRight: 16 }}
    >
      <Text style={{ color: COLORS.white, fontWeight: "600" }}>Log Out</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in from a previous visit
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    // Listen for login/logout events and update the app automatically
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.offWhite }}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: COLORS.primaryDeepGreen },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "700" },
          headerRight: () => <LogoutButton />,
          tabBarActiveTintColor: COLORS.primaryDeepGreen,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Rythu360" }} />
        <Tab.Screen name="Crop Plan" component={CropPlanScreen} />
        <Tab.Screen name="Disease Check" component={DiseaseCheckScreen} />
        <Tab.Screen name="Profit" component={ProfitCalculatorScreen} />
        <Tab.Screen name="Diary" component={FarmDiaryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}