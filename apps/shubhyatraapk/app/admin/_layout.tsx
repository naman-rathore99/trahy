import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Platform, View } from "react-native";

export default function AdminLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🎨 Fixed Icon Renderer: Perfectly centered with flush top indicator
  const renderIcon = (name: any, focused: boolean, activeColor: string) => (
    <View className="items-center justify-center h-full w-16">
      {focused && (
        <View
          className="absolute top-0 w-8 h-1 rounded-b-md"
          style={{ backgroundColor: activeColor }}
        />
      )}
      <Ionicons
        name={name}
        size={24}
        color={focused ? activeColor : isDark ? "#6B7280" : "#9CA3AF"}
      />
    </View>
  );

  const THEME_COLOR = "#10B981";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopColor: isDark ? "#1F2937" : "#F3F4F6",
          height: Platform.OS === "ios" ? 85 : 65,
          elevation: 0,
          borderTopWidth: 1,
        },
      }}
    >
      {/* --- ✅ THE ONLY REAL TABS --- */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIcon(focused ? "grid" : "grid-outline", focused, THEME_COLOR),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIcon(
              focused ? "document-text" : "document-text-outline",
              focused,
              THEME_COLOR,
            ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIcon(
              focused ? "calendar" : "calendar-outline",
              focused,
              THEME_COLOR,
            ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIcon(
              focused ? "people" : "people-outline",
              focused,
              THEME_COLOR,
            ),
        }}
      />

      {/* --- 🚨 THE KILL LIST (HIDES THE MESS) --- */}
      {/* If you add any new files to the admin folder, add them here! */}
      <Tabs.Screen name="partners" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="fleet" options={{ href: null }} />
      <Tabs.Screen name="add-listing" options={{ href: null }} />
      <Tabs.Screen name="request-details" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="hotels" options={{ href: null }} />
      <Tabs.Screen name="hotels/index" options={{ href: null }} />
      <Tabs.Screen name="hotels/[id]" options={{ href: null }} />
      <Tabs.Screen name="requests/[id]" options={{ href: null }} />
      <Tabs.Screen name="[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="payouts" options={{ href: null }} />
      <Tabs.Screen name="booking-details" options={{ href: null }} />
    </Tabs>
  );
}
