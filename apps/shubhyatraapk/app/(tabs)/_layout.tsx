import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Platform, View } from "react-native";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Helper for consistent icon rendering
  const renderTabIcon = (name: any, focused: boolean) => {
    return (
      <View className="items-center justify-center gap-1">
        <Ionicons
          name={name}
          size={24}
          color={focused ? "#FF5A1F" : isDark ? "#9CA3AF" : "#6B7280"}
        />
        {/* Active Indicator Dot */}
        {focused && <View className="w-1.5 h-1.5 bg-[#FF5A1F] rounded-full" />}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          marginBottom: 6,
          marginTop: -2,
        },
        tabBarActiveTintColor: "#FF5A1F",
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090B" : "#FFFFFF",
          borderTopColor: isDark ? "#1F2937" : "#F3F4F6",
          height: Platform.OS === "ios" ? 90 : 70,
          elevation: 0,
          borderTopWidth: 1,
          paddingTop: 8,
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) =>
            renderTabIcon(focused ? "home" : "home-outline", focused),
        }}
      />

      {/* 2. RIDES */}
      <Tabs.Screen
        name="vehicle"
        options={{
          title: "Rides",
          tabBarIcon: ({ focused }) =>
            renderTabIcon(focused ? "car-sport" : "car-sport-outline", focused),
        }}
      />

      {/* 3. CENTER BUTTON (Float) */}
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarLabelStyle: { display: "none" },
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                top: -24,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#FF5A1F",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#FF5A1F",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6,
                borderWidth: 4,
                borderColor: isDark ? "#09090B" : "#FFFFFF",
              }}
            >
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }}
      />

      {/* 4. TRIPS */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Trips",
          tabBarIcon: ({ focused }) =>
            renderTabIcon(focused ? "ticket" : "ticket-outline", focused),
        }}
      />

      {/* 5. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) =>
            renderTabIcon(focused ? "person" : "person-outline", focused),
        }}
      />
    </Tabs>
  );
}
