import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";

// Existing screens — all reused as-is, nothing rebuilt
import HomeScreen from "./screens/HomeScreen";
import VoiceAssistantScreen from "./screens/VoiceAssistantScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
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
import WishlistScreen from "./screens/WishlistScreen";
import AdminScreen from "./screens/AdminScreen";
import LoginScreen from "./screens/LoginScreen";

// New: menu-only "hub" screens for My Farm and Profile tabs (no business logic,
// just navigation menus pointing at the existing screens above)
import MyFarmHubScreen from "./screens/MyFarmHubScreen";
import ProfileHubScreen from "./screens/ProfileHubScreen";

import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { COLORS } from "./constants/colors";
import { supabase } from "./supabase";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();
const FarmStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: "🏠",
  Shop: "🛒",
  "My Farm": "🌾",
  Orders: "📦",
  Profile: "👤",
};

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primaryDeepGreen },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: "700" },
};

function LogoutButton() {
  return (
    <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ marginRight: 16 }}>
      <Text style={{ color: COLORS.white, fontWeight: "600" }}>Log Out</Text>
    </TouchableOpacity>
  );
}

// --- Home tab: Home + Voice + Notifications (unchanged screens) ---
function HomeTabStack() {
  return (
    <HomeStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: "Rythu360" }} />
      <HomeStack.Screen name="Voice" component={VoiceAssistantScreen} options={{ title: "Voice Assistant" }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

// --- Shop tab: existing marketplace flow, unchanged ---
function ShopTabStack() {
  return (
    <ShopStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
      <ShopStack.Screen name="Marketplace" component={MarketplaceScreen} />
      <ShopStack.Screen name="Product Detail" component={ProductDetailScreen} options={{ title: "Product" }} />
      <ShopStack.Screen name="Cart" component={CartScreen} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} />
      <ShopStack.Screen name="My Orders" component={MyOrdersScreen} />
      <ShopStack.Screen name="Wishlist" component={WishlistScreen} />
      <ShopStack.Screen name="Seller Dashboard" component={SellerDashboardScreen} options={{ title: "Seller" }} />
    </ShopStack.Navigator>
  );
}

// --- My Farm tab: new hub menu + all existing farming screens (renamed routes
// to avoid clashing with Shop's routes, components themselves are unchanged) ---
function MyFarmTabStack() {
  return (
    <FarmStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
      <FarmStack.Screen name="My Farm Hub" component={MyFarmHubScreen} options={{ title: "My Farm" }} />
      <FarmStack.Screen name="Farms List" component={MyFarmsScreen} options={{ title: "My Crops" }} />
      <FarmStack.Screen name="Farm Crops" component={FarmCropsScreen} options={{ title: "Crops" }} />
      <FarmStack.Screen name="Farm Calendar" component={CropCalendarScreen} options={{ title: "Crop Calendar" }} />
      <FarmStack.Screen name="Farm Crop Plan" component={CropPlanScreen} options={{ title: "Crop Plan" }} />
      <FarmStack.Screen name="Farm Disease Check" component={DiseaseCheckScreen} options={{ title: "Crop Doctor" }} />
      <FarmStack.Screen name="Farm Diary Entry" component={FarmDiaryScreen} options={{ title: "Farm Diary" }} />
      <FarmStack.Screen name="Farm Profit" component={ProfitCalculatorScreen} options={{ title: "Profit Calculator" }} />
      <FarmStack.Screen name="Farm Weather" component={WeatherScreen} options={{ title: "Weather" }} />
      <FarmStack.Screen name="Farm Mandi Prices" component={MandiPricesScreen} options={{ title: "Mandi Prices" }} />
      <FarmStack.Screen name="Farm Schemes" component={SchemesScreen} options={{ title: "Government Schemes" }} />
    </FarmStack.Navigator>
  );
}

// --- Orders tab: existing MyOrdersScreen, unchanged ---
function OrdersTabStack() {
  return (
    <OrdersStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
      <OrdersStack.Screen name="My Orders Main" component={MyOrdersScreen} options={{ title: "Orders" }} />
    </OrdersStack.Navigator>
  );
}

// --- Profile tab: new hub menu + existing ProfileScreen + Admin (moved here
// from its old standalone tab) ---
function ProfileTabStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
      <ProfileStack.Screen name="Profile Hub" component={ProfileHubScreen} options={{ title: "Profile" }} />
      <ProfileStack.Screen name="My Profile Details" component={ProfileScreen} options={{ title: "My Profile" }} />
      <ProfileStack.Screen name="Profile Admin" component={AdminScreen} options={{ title: "Admin Dashboard" }} />
    </ProfileStack.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

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
      <WishlistProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: COLORS.primaryDeepGreen,
              tabBarInactiveTintColor: COLORS.gray,
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
              tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
              tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 6 },
            })}
          >
            <Tab.Screen name="Home" component={HomeTabStack} />
            <Tab.Screen name="Shop" component={ShopTabStack} />
            <Tab.Screen name="My Farm" component={MyFarmTabStack} />
            <Tab.Screen name="Orders" component={OrdersTabStack} />
            <Tab.Screen name="Profile" component={ProfileTabStack} />
          </Tab.Navigator>
        </NavigationContainer>
      </WishlistProvider>
    </CartProvider>
  );
}