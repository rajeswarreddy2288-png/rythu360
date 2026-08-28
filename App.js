import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import VoiceAssistantScreen from "./screens/VoiceAssistantScreen";
import WeatherScreen from "./screens/WeatherScreen";
import MyFarmsScreen from "./screens/MyFarmsScreen";
import FarmCropsScreen from "./screens/FarmCropsScreen";
import CropCalendarScreen from "./screens/CropCalendarScreen";
import CropPlanScreen from "./screens/CropPlanScreen";
import MandiPricesScreen from "./screens/MandiPricesScreen";
import SchemesScreen from "./screens/SchemesScreen";
import DiseaseCheckScreen from "./screens/DiseaseCheckScreen";
import ProfitCalculatorScreen from "./screens/ProfitCalculatorScreen";
import FarmDiaryScreen from "./screens/FarmDiaryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import CartScreen from "./screens/CartScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import MyOrdersScreen from "./screens/MyOrdersScreen";
import SellerDashboardScreen from "./screens/SellerDashboardScreen";
import AdminScreen from "./screens/AdminScreen";
import LoginScreen from "./screens/LoginScreen";
import { CartProvider } from "./CartContext";
import { COLORS } from "./constants/colors";
import { supabase } from "./supabase";

const Tab = createBottomTabNavigator();
const FarmStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: "🌾",
  Voice: "🎙️",
  Weather: "⛅",
  "My Farms": "🚜",
  Calendar: "📅",
  "Crop Plan": "🌱",
  "Mandi Prices": "📈",
  Market: "🛒",
  Schemes: "🏛️",
  "Disease Check": "📸",
  Profit: "💰",
  Diary: "📔",
  Profile: "👤",
  Admin: "🛡️",
};

function LogoutButton() {
  return (
    <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ marginRight: 16 }}>
      <Text style={{ color: COLORS.white, fontWeight: "600" }}>Log Out</Text>
    </TouchableOpacity>
  );
}

// A small stack so tapping a farm can push into its crop list,
// while still living inside the "My Farms" tab.
function MyFarmsStack() {
  return (
    <FarmStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primaryDeepGreen },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <FarmStack.Screen name="Farms List" component={MyFarmsScreen} options={{ title: "My Farms" }} />
      <FarmStack.Screen name="Farm Crops" component={FarmCropsScreen} options={{ title: "Crops" }} />
    </FarmStack.Navigator>
  );
}

// Stack for the marketplace flow: browse -> product detail -> cart -> checkout,
// plus order history and seller dashboard, all inside the "Market" tab.
function MarketplaceStack() {
  return (
    <MarketStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primaryDeepGreen },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <MarketStack.Screen name="Marketplace" component={MarketplaceScreen} />
      <MarketStack.Screen name="Product Detail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <MarketStack.Screen name="Cart" component={CartScreen} />
      <MarketStack.Screen name="Checkout" component={CheckoutScreen} />
      <MarketStack.Screen name="My Orders" component={MyOrdersScreen} />
      <MarketStack.Screen name="Seller Dashboard" component={SellerDashboardScreen} options={{ title: "Seller" }} />
    </MarketStack.Navigator>
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
    <CartProvider>
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
            tabBarScrollEnabled: true,
            tabBarItemStyle: { width: 80 },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Rythu360" }} />
          <Tab.Screen name="Voice" component={VoiceAssistantScreen} options={{ title: "Voice Assistant" }} />
          <Tab.Screen name="Weather" component={WeatherScreen} />
          <Tab.Screen name="My Farms" component={MyFarmsStack} options={{ headerShown: false }} />
          <Tab.Screen name="Calendar" component={CropCalendarScreen} />
          <Tab.Screen name="Crop Plan" component={CropPlanScreen} />
          <Tab.Screen name="Mandi Prices" component={MandiPricesScreen} />
          <Tab.Screen name="Market" component={MarketplaceStack} options={{ headerShown: false }} />
          <Tab.Screen name="Schemes" component={SchemesScreen} />
          <Tab.Screen name="Disease Check" component={DiseaseCheckScreen} />
          <Tab.Screen name="Profit" component={ProfitCalculatorScreen} />
          <Tab.Screen name="Diary" component={FarmDiaryScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="Admin" component={AdminScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}