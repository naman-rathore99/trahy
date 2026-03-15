import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();

  // --- STATES ---
  // Note: In a real app, you would hook isDarkMode up to your NativeWind/Theme Context!
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // --- HANDLERS ---
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    // TODO: Add your logic here to actually switch the app's theme using NativeWind/Tailwind
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your trips and data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Call your Firebase delete account function here
            console.log("Account deleted");
            // router.replace("/auth/login");
          },
        },
      ],
    );
  };

  // --- REUSABLE COMPONENT FOR SETTING ROWS ---
  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    isDestructive = false,
    rightElement,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800`}
    >
      <View className="flex-row items-center flex-1 pr-4">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDestructive ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-800"}`}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isDestructive ? "#EF4444" : "#9CA3AF"}
          />
        </View>
        <View>
          <Text
            className={`font-bold text-base ${isDestructive ? "text-red-500" : "text-gray-900 dark:text-white"}`}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>

      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={20} color="gray" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* --- HEADER --- */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full justify-center items-center mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="gray" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* --- SECTION 1: PREFERENCES --- */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 ml-2">
          App Preferences
        </Text>
        <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800 mb-6">
          <SettingRow
            icon="moon"
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
                thumbColor={"#ffffff"}
              />
            }
          />
          <SettingRow
            icon="notifications"
            title="Push Notifications"
            subtitle="Get updates on your bookings"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={(val) => setNotifications(val)}
                trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
                thumbColor={"#ffffff"}
              />
            }
          />
          <SettingRow
            icon="globe-outline"
            title="Language"
            subtitle="English (US)"
            onPress={() => console.log("Language clicked")}
          />
        </View>

        {/* --- SECTION 2: ACCOUNT & BILLING --- */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2">
          Account & Billing
        </Text>
        <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800 mb-6">
          <SettingRow
            icon="card"
            title="Payment Methods"
            subtitle="Manage your saved cards and UPI"
            onPress={() => console.log("Payments clicked")}
          />
          <SettingRow
            icon="cloud-download"
            title="Downloads & Invoices"
            subtitle="View downloaded receipts and tickets"
            onPress={() => console.log("Downloads clicked")}
          />
          <SettingRow
            icon="person"
            title="Personal Information"
            subtitle="Update your name, email, and phone"
            onPress={() => console.log("Personal Info clicked")}
          />
        </View>

        {/* --- SECTION 3: SUPPORT & LEGAL --- */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2">
          Support & Legal
        </Text>
        <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800 mb-6">
          <SettingRow
            icon="help-buoy"
            title="Help Center"
            onPress={() => console.log("Help Center clicked")}
          />
          <SettingRow
            icon="shield-checkmark"
            title="Privacy Policy"
            onPress={() => console.log("Privacy clicked")}
          />
          <SettingRow
            icon="document-text"
            title="Terms of Service"
            onPress={() => console.log("Terms clicked")}
          />
        </View>

        {/* --- SECTION 4: DANGER ZONE --- */}
        <Text className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 ml-2">
          Danger Zone
        </Text>
        <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-red-100 dark:border-red-900/30 mb-12">
          <SettingRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently remove your data"
            isDestructive={true}
            onPress={handleDeleteAccount}
            rightElement={<View />} // Empty view hides the chevron
          />
        </View>

        <Text className="text-center text-gray-400 text-xs mb-10">
          Shubh Yatra v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
