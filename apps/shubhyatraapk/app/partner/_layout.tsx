import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

export default function PartnerLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? "#09090B" : "#FFFFFF",
            borderTopColor: isDark ? "#1F2937" : "#F3F4F6",
            paddingBottom: 5,
            height: 60,
          },
          tabBarActiveTintColor: "#FF5A1F",
          tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        }}
      >
        {/* 🌟 VISIBLE TABS */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Ionicons name="pie-chart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="business" size={24} color={color} />
            ),
          }}
        />

        {/* 👻 HIDDEN SUB-SCREENS (Keeps navbar active, but hides tab icon) */}
        <Tabs.Screen name="join" options={{ href: null }} />
        <Tabs.Screen name="booking-details" options={{ href: null }} />
        <Tabs.Screen name="fleet" options={{ href: null }} />
        <Tabs.Screen name="rooms" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="documents" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}
