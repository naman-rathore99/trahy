import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

// Define Types for Safety
type StatItem = {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  color: string;
  bg: string;
  dot?: boolean;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- LIVE DATA STATES ---
  const [travelers, setTravelers] = useState<number>(0);
  const [partners, setPartners] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);

  // --- 🔄 API INTEGRATION (REAL-TIME COUNTERS) ---
  useEffect(() => {
    // 1. Count normal users (Travelers)
    const qTravelers = query(
      collection(db, "users"),
      where("role", "==", "user"),
    );
    const unsubTravelers = onSnapshot(qTravelers, (snap) =>
      setTravelers(snap.size),
    );

    // 2. Count approved Partners
    const qPartners = query(
      collection(db, "users"),
      where("role", "==", "partner"),
    );
    const unsubPartners = onSnapshot(qPartners, (snap) =>
      setPartners(snap.size),
    );

    // 3. Count Pending Partner Applications
    const qPending = query(
      collection(db, "join_requests"),
      where("status", "==", "pending"),
    );
    const unsubPending = onSnapshot(qPending, (snap) =>
      setPendingRequests(snap.size),
    );

    // Cleanup listeners when you leave the dashboard
    return () => {
      unsubTravelers();
      unsubPartners();
      unsubPending();
    };
  }, []);

  // --- DYNAMIC STATS ARRAY ---
  const STATS: StatItem[] = [
    {
      label: "Travelers",
      value: travelers,
      sub: "Total Registered",
      icon: "people",
      color: "#3B82F6",
      bg: "bg-blue-500",
    },
    {
      label: "Partners",
      value: partners,
      sub: "Active Accounts",
      icon: "briefcase",
      color: "#8B5CF6",
      bg: "bg-purple-500",
    },
    {
      label: "Revenue",
      value: `₹${revenue}`,
      sub: "Total Earnings",
      icon: "wallet",
      color: "#10B981",
      bg: "bg-green-500",
    },
    {
      label: "Alerts",
      value: pendingRequests,
      sub: "Pending Reviews",
      icon: "notifications",
      color: "#F59E0B",
      bg: "bg-orange-500",
      dot: pendingRequests > 0,
    },
  ];

  const MENU_ITEMS = [
    {
      title: "Partners",
      route: "/admin/partners",
      icon: "briefcase-outline",
      color: "#8B5CF6",
    },
    {
      title: "Hotels",
      route: "/admin/hotels",
      icon: "bed-outline",
      color: "#F59E0B",
    },
    {
      title: "Fleet",
      route: "/admin/vehicles",
      icon: "car-sport-outline",
      color: "#10B981",
    },
    {
      title: "Bookings",
      route: "/admin/bookings",
      icon: "calendar-outline",
      color: "#3B82F6",
    },
    {
      title: "Reviews",
      route: "/admin/reviews",
      icon: "star-outline",
      color: "#EC4899",
    },
    {
      title: "Users",
      route: "/admin/users",
      icon: "people-outline",
      color: "#6366F1",
    },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <View>
            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">
              Admin Console
            </Text>
            <Text className="text-gray-900 dark:text-white text-xl font-bold">
              Dashboard
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)" as any)}
              className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700"
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/auth/login")}
              className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-full border border-red-100 dark:border-red-900/50"
            >
              <Ionicons name="power" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between mb-6">
            {STATS.map((stat, index) => (
              <View
                key={index}
                className="w-[48%] bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4 shadow-sm relative overflow-hidden"
              >
                <View
                  className={`absolute right-[-10] top-[-10] w-16 h-16 rounded-full opacity-10 ${stat.bg}`}
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View
                    className="p-2 rounded-xl bg-opacity-10"
                    style={{ backgroundColor: stat.color + "15" }}
                  >
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color={stat.color}
                    />
                  </View>
                  {/* ✅ The red dot now only shows if there are pending alerts */}
                  {stat.dot === true && (
                    <View className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  )}
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stat.value}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                  {stat.label}
                </Text>
                <View className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Text className="text-gray-400 dark:text-gray-600 text-[10px]">
                    {stat.sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4 ml-1">
            Quick Actions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8 pl-1"
          >
            <TouchableOpacity
              onPress={() => router.push("/admin/add-listing")}
              className="bg-[#FF5A1F] p-4 rounded-2xl mr-4 w-40 shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons name="add" size={24} color="white" />
              </View>
              <Text className="text-white font-bold text-base">
                Add Listing
              </Text>
              <Text className="text-white/80 text-xs mt-1">
                New Hotel / Car
              </Text>
            </TouchableOpacity>

            {/* ✅ Button updates dynamically based on pending requests */}
            <TouchableOpacity
              onPress={() => router.push("/admin/requests")}
              className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mr-4 w-40 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none active:scale-95"
            >
              <View className="bg-gray-100 dark:bg-gray-800 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons
                  name="documents-outline"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">
                Requests
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {pendingRequests > 0
                  ? `${pendingRequests} Pending`
                  : "All Clear"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Modules Grid */}
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4 ml-1">
            Modules
          </Text>
          <View className="bg-white dark:bg-[#111827] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <View className="flex-row flex-wrap justify-between">
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(item.route as any)}
                  className="w-[31%] items-center mb-6 active:opacity-70"
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2 shadow-sm"
                    style={{ backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.color}
                    />
                  </View>
                  <Text className="text-gray-600 dark:text-gray-400 font-medium text-xs text-center">
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
