import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch, // 🚨 NEW: Added Switch import
  Text,
  TouchableOpacity,
  View,
  Appearance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useColorScheme } from "nativewind"; // 🚨 NEW: For real theme toggling

export default function PartnerSettings() {
  const router = useRouter();
  const { user } = useAuth();

  // 🚨 NEW: Extract toggleColorScheme to actually change the app's theme
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Handle Logout
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const MENU_ITEMS = [
    {
      icon: "wallet-outline",
      label: "Bank & Payouts",
      desc: "Manage your bank account",
      route: "/partner/wallet",
    },
    {
      icon: "business-outline",
      label: "Business Profile",
      desc: "Hotel/Fleet details",
      route: "/partner/profile",
    },
    {
      icon: "notifications-outline",
      label: "Notification Settings",
      desc: "Trips & Check-ins",
      route: "/partner/notifications",
    },
    {
      icon: "shield-checkmark-outline",
      label: "Documents",
      desc: "KYC & Licenses",
      route: "/partner/documents",
    },
    {
      icon: "headset-outline",
      label: "Partner Support",
      desc: "Get help 24/7",
      route: "/partner/support",
    },
  ];

  return (
    <View className="flex-1 bg-[#F4F7F9] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "white" : "gray"}
            />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
            Partner Settings
          </Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View className="flex-row items-center bg-white dark:bg-[#111827] p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 mb-8 shadow-sm">
            <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-[#FF5A1F] text-2xl font-black">
                  {user?.displayName?.charAt(0).toUpperCase() || "P"}
                </Text>
              )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-gray-900 dark:text-white text-lg font-black">
                {user?.displayName || "Partner"}
              </Text>
              <Text className="text-gray-500 text-xs mb-2 font-medium">
                {user?.email}
              </Text>
              <View className="flex-row">
                <View className="bg-green-50 dark:bg-green-500/20 px-2 py-1 rounded-md flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                  <Text className="text-green-700 dark:text-green-500 text-[10px] font-black uppercase tracking-wider">
                    Verified Partner
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Group */}
          <Text className="text-gray-900 dark:text-white font-black text-lg mb-4 ml-2">
            General
          </Text>
          <View className="bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm mb-6">
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  item.route
                    ? router.push(item.route as any)
                    : Alert.alert("Coming Soon")
                }
                className={`flex-row items-center p-5 ${index !== MENU_ITEMS.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""}`}
              >
                <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800/50 rounded-full items-center justify-center">
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isDark ? "#9CA3AF" : "#4B5563"}
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-gray-900 dark:text-white font-bold text-sm">
                    {item.label}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5 font-medium">
                    {item.desc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>

          {/* 🚨 NEW: Theme Toggle Card */}
          <Text className="text-gray-900 dark:text-white font-black text-lg mb-4 ml-2">
            Appearance
          </Text>
          <View className="bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm mb-8 flex-row items-center justify-between p-5">
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800/50 rounded-full items-center justify-center">
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={20}
                  color={isDark ? "#60A5FA" : "#F59E0B"}
                />
              </View>
              <View>
                <Text className="text-gray-900 dark:text-white font-bold text-sm">
                  Theme
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5 font-medium">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(newValue) => {
                // 🚨 Forcibly tell NativeWind AND the Operating System to change
                toggleColorScheme();
                Appearance.setColorScheme(newValue ? "dark" : "light");
              }}
              trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Switch to Traveler Mode */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            className="bg-gray-900 dark:bg-white p-5 rounded-[24px] flex-row items-center justify-between mb-4 shadow-sm"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 bg-gray-800 dark:bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="airplane" size={20} color="#FF5A1F" />
              </View>
              <View>
                <Text className="text-white dark:text-gray-900 font-black text-base">
                  Switch to Traveler Mode
                </Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-0.5">
                  Book trips for yourself
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "black" : "gray"}
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-5 rounded-[24px] flex-row justify-center items-center mb-10"
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#EF4444"
              style={{ marginRight: 8 }}
            />
            <Text className="text-red-600 font-bold text-sm">Log Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-xs mb-10 font-bold tracking-widest uppercase">
            Partner App v1.0.2
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
