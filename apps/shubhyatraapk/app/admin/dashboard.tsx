import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

// --- MOCK CHART DATA (Replace with real historical data later) ---
const CHART_DATA = {
  revenue: [
    { day: "Mon", value: 12000 },
    { day: "Tue", value: 15000 },
    { day: "Wed", value: 9000 },
    { day: "Thu", value: 22000 },
    { day: "Fri", value: 18000 },
    { day: "Sat", value: 35000 },
    { day: "Sun", value: 28000 },
  ],
  users: [
    { day: "Mon", value: 12 },
    { day: "Tue", value: 18 },
    { day: "Wed", value: 8 },
    { day: "Thu", value: 25 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 45 },
    { day: "Sun", value: 38 },
  ],
  bookings: [
    { day: "Mon", value: 4 },
    { day: "Tue", value: 6 },
    { day: "Wed", value: 3 },
    { day: "Thu", value: 9 },
    { day: "Fri", value: 12 },
    { day: "Sat", value: 18 },
    { day: "Sun", value: 14 },
  ],
};

export default function AdminDashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- LIVE DATA STATES ---
  const [travelers, setTravelers] = useState<number>(0);
  const [partners, setPartners] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- REVENUE & ACTIVITY STATES ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenue, setRevenue] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // --- CHART STATE ---
  const [chartFilter, setChartFilter] = useState<
    "revenue" | "users" | "bookings"
  >("revenue");

  // 🔄 YOUR REAL-TIME LISTENERS
  useEffect(() => {
    const qUnread = query(
      collection(db, "notifications"),
      where("isRead", "==", false),
    );
    const unsubUnread = onSnapshot(qUnread, (snap) =>
      setUnreadCount(snap.docs.length),
    );

    const qTravelers = query(
      collection(db, "users"),
      where("role", "==", "user"),
    );
    const unsubTravelers = onSnapshot(qTravelers, (snap) =>
      setTravelers(snap.size),
    );

    const qPartners = query(
      collection(db, "users"),
      where("role", "==", "partner"),
    );
    const unsubPartners = onSnapshot(qPartners, (snap) =>
      setPartners(snap.size),
    );

    const qPending = query(
      collection(db, "join_requests"),
      where("status", "==", "pending"),
    );
    const unsubPending = onSnapshot(qPending, (snap) =>
      setPendingRequests(snap.size),
    );

    return () => {
      unsubUnread();
      unsubTravelers();
      unsubPartners();
      unsubPending();
    };
  }, []);

  // 🔄 REVENUE & RECENT ACTIVITY FETCHER
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      const snapshot = await getDocs(q);

      let calcRevenue = 0;
      const recent: any[] = [];

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const amount = Number(data.totalAmount || data.price || 0);

        if (
          ["confirmed", "paid", "success", "completed"].includes(
            data.status?.toLowerCase(),
          )
        ) {
          calcRevenue += amount;
        }

        if (index < 4) {
          recent.push({
            id: doc.id,
            customer: data.customer?.name || data.customerName || "Guest",
            amount: amount,
            status: data.status || "pending",
            service: data.serviceType || "hotel",
          });
        }
      });

      setRevenue(calcRevenue);
      setRecentActivity(recent);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (["confirmed", "paid", "success"].includes(s)) return "text-emerald-500";
    if (["cancelled", "failed"].includes(s)) return "text-red-500";
    return "text-amber-500";
  };

  const MENU_ITEMS = [
    {
      title: "Partners",
      route: "/admin/partners",
      icon: "briefcase",
      color: "#8B5CF6",
      desc: "Manage accounts",
    },
    {
      title: "Hotels",
      route: "/admin/hotels",
      icon: "bed",
      color: "#F59E0B",
      desc: "View inventory",
    },
    {
      title: "Fleet",
      route: "/admin/vehicles",
      icon: "car-sport",
      color: "#10B981",
      desc: "Manage vehicles",
    },
    {
      title: "Bookings",
      route: "/admin/bookings",
      icon: "calendar",
      color: "#3B82F6",
      desc: "All reservations",
    },
    {
      title: "Reviews",
      route: "/admin/reviews",
      icon: "star",
      color: "#EC4899",
      desc: "User feedback",
    },
    {
      title: "Payouts",
      route: "/admin/payouts",
      icon: "wallet",
      color: "#6366F1",
      desc: "Partner settlements",
    },
  ];

  // Helper to calculate max value for chart scaling
  const maxChartValue = Math.max(
    ...CHART_DATA[chartFilter].map((d) => d.value),
  );

  if (loading)
    return (
      <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* --- HEADER --- */}
        <View className="px-6 py-2 flex-row justify-between items-center mb-2 mt-2">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-gray-900 dark:bg-white rounded-full items-center justify-center shadow-sm">
              <Text className="text-white dark:text-gray-900 font-black text-lg">
                A
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider mb-0.5">
                Admin Console
              </Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">
                Dashboard
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)" as any)}
              className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center border border-blue-100 dark:border-blue-900/30 shadow-sm"
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color="#3B82F6"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/auth/login")}
              className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center border border-red-100 dark:border-red-900/30 shadow-sm"
            >
              <Ionicons name="power" size={18} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("./admin/notifications")}
              className="relative w-10 h-10 bg-white dark:bg-[#111827] rounded-full items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={isDark ? "white" : "black"}
              />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-[#09090B]">
                  <Text className="text-white text-[9px] font-black">
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDashboardData(true)}
              tintColor="#6366F1"
            />
          }
        >
          {/* --- 🚨 NEW: ANALYTICS & CHART SECTION 🚨 --- */}
          <View className="bg-white dark:bg-[#111827] p-5 rounded-[32px] mb-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-gray-900 dark:text-white font-black text-xl tracking-tight">
                Analytics
              </Text>

              {/* Chart Filters */}
              <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { id: "revenue", icon: "cash" },
                  { id: "users", icon: "people" },
                  { id: "bookings", icon: "calendar" },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setChartFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-md flex-row items-center gap-1 ${chartFilter === f.id ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={12}
                      color={
                        chartFilter === f.id
                          ? isDark
                            ? "white"
                            : "black"
                          : "gray"
                      }
                    />
                    <Text
                      className={`text-[10px] font-bold capitalize ${chartFilter === f.id ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
                    >
                      {f.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Highlight Metric */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                {chartFilter === "revenue"
                  ? "This Week's Earnings"
                  : chartFilter === "users"
                    ? "New Users This Week"
                    : "Total Bookings This Week"}
              </Text>
              <Text className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {chartFilter === "revenue"
                  ? `₹${CHART_DATA.revenue.reduce((a, b) => a + b.value, 0).toLocaleString("en-IN")}`
                  : CHART_DATA[chartFilter].reduce((a, b) => a + b.value, 0)}
              </Text>
            </View>

            {/* The Custom CSS Bar Chart */}
            <View className="h-32 flex-row items-end justify-between px-2">
              {CHART_DATA[chartFilter].map((item, index) => {
                // Calculate height percentage relative to max value (min 10% so empty bars still show slightly)
                const heightPercent = Math.max(
                  (item.value / maxChartValue) * 100,
                  10,
                );
                return (
                  <View key={index} className="items-center w-[12%]">
                    {/* Tooltip (shows on largest bar for effect, or could be touchable) */}
                    {item.value === maxChartValue && (
                      <View className="bg-gray-800 dark:bg-white px-2 py-1 rounded mb-2">
                        <Text className="text-white dark:text-black text-[8px] font-black">
                          {chartFilter === "revenue"
                            ? `₹${item.value / 1000}k`
                            : item.value}
                        </Text>
                      </View>
                    )}
                    {/* The Bar */}
                    <View
                      className={`w-full rounded-t-md ${item.value === maxChartValue ? "bg-indigo-600 dark:bg-indigo-500" : "bg-indigo-100 dark:bg-indigo-900/40"}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <Text className="text-gray-400 text-[10px] font-bold mt-2">
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* --- QUICK STATS --- */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm items-center">
              <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-2">
                <Ionicons name="people" size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 dark:text-white font-black text-xl">
                {travelers}
              </Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                Travelers
              </Text>
            </View>

            <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm items-center">
              <View className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full items-center justify-center mb-2">
                <Ionicons name="briefcase" size={20} color="#8B5CF6" />
              </View>
              <Text className="text-gray-900 dark:text-white font-black text-xl">
                {partners}
              </Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                Partners
              </Text>
            </View>

            <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm items-center relative">
              {pendingRequests > 0 && (
                <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              )}
              <View className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center mb-2">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
              </View>
              <Text className="text-gray-900 dark:text-white font-black text-xl">
                {pendingRequests}
              </Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                Pending
              </Text>
            </View>
          </View>

          {/* --- 🚨 UPGRADED: GRID MANAGEMENT CARDS 🚨 --- */}
          <Text className="text-gray-900 dark:text-white font-black text-xl mb-4 tracking-tight">
            System Control
          </Text>
          <View className="flex-row flex-wrap justify-between mb-6">
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route as any)}
                className="w-[48%] bg-white dark:bg-[#111827] p-5 rounded-[24px] mb-4 border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-transform"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isDark
                        ? `${item.color}20`
                        : `${item.color}15`,
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 dark:text-white font-black text-base mb-1">
                  {item.title}
                </Text>
                <Text className="text-gray-400 text-[10px] font-medium leading-tight">
                  {item.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- VIBRANT ACTION BANNERS --- */}
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity
              onPress={() => router.push("/admin/add-listing")}
              className="flex-1 bg-[#FF5A1F] p-5 rounded-[28px] shadow-lg shadow-orange-500/30 overflow-hidden relative active:scale-95"
            >
              <View className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full" />
              <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons name="add" size={24} color="white" />
              </View>
              <Text className="text-white font-black text-lg">Add Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/admin/requests")}
              className="flex-1 bg-gray-900 dark:bg-white p-5 rounded-[28px] shadow-lg shadow-gray-900/20 overflow-hidden relative active:scale-95"
            >
              <View className="absolute -right-4 -bottom-4 bg-white/5 dark:bg-black/5 w-24 h-24 rounded-full" />
              <View className="bg-white/10 dark:bg-black/5 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons
                  name="document-text"
                  size={20}
                  color={isDark ? "black" : "white"}
                />
              </View>
              <Text className="text-white dark:text-gray-900 font-black text-lg">
                Requests
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- LIVE ACTIVITY FEED --- */}
          <View className="flex-row justify-between items-center mb-4 pr-1">
            <Text className="text-gray-900 dark:text-white font-black text-xl tracking-tight">
              Live Feed
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/admin/bookings" as any)}
            >
              <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            <View className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-10">
              {recentActivity.map((activity, idx) => (
                <View
                  key={activity.id}
                  className={`p-4 flex-row items-center justify-between ${idx !== recentActivity.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""}`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl items-center justify-center border border-gray-100 dark:border-gray-800">
                      <Ionicons
                        name={activity.service === "vehicle" ? "car" : "bed"}
                        size={20}
                        color={isDark ? "white" : "black"}
                      />
                    </View>
                    <View>
                      <Text className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                        {activity.customer}
                      </Text>
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-black text-lg">
                    ₹{activity.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white dark:bg-[#111827] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 items-center justify-center mb-10">
              <View className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={28} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                No recent activity
              </Text>
              <Text className="text-gray-500 text-xs">
                New bookings will appear here instantly.
              </Text>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
