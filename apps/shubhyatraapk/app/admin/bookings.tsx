import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase"; // 🚨 Adjust path if needed

// --- 🗓️ HELPER: TIMEZONE SAFE DATES (Starts from Today, goes forward 30 days) ---
const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const generateDates = () => {
  const dates = [];
  dates.push({
    fullDate: null,
    dayName: "All",
    monthName: "",
    dayNum: "∞",
    dbFormat: "ALL",
  });

  const today = new Date();
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    dates.push({
      fullDate: d,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
      dayNum: d.getDate().toString(),
      dbFormat: `${year}-${month}-${day}`,
    });
  }
  return dates;
};

// --- 🎨 UI BADGES HELPERS ---
const getStatusUI = (status: string) => {
  const s = status.toLowerCase();
  if (
    s === "confirmed" ||
    s === "paid" ||
    s === "success" ||
    s === "checked_in" ||
    s === "completed"
  ) {
    return {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "Success",
    };
  }
  if (s === "cancelled" || s === "failed" || s === "rejected") {
    return {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      label: "Cancelled",
    };
  }
  return {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    label: "Pending",
  };
};

export default function AdminBookings() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const STATUS_OPTIONS = ["All", "Pending", "Success", "Cancelled"];

  // Date States & Refs
  const weekDates = generateDates();
  // 🚨 Default to Today
  const [selectedDate, setSelectedDate] = useState(getLocalTodayString());
  const calendarRef = useRef<FlatList>(null);

  // --- ⏱️ DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- 🔄 FETCH DATA ---
  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const snapshot = await getDocs(q);

      const fetchedBookings = snapshot.docs.map((doc) => {
        const data = doc.data();

        let createdDateObj = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === "function") {
            createdDateObj = data.createdAt.toDate();
          } else {
            createdDateObj = new Date(data.createdAt);
          }
        }

        const timeString = createdDateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        let filterDate = "";
        if (data.checkIn) {
          filterDate = String(data.checkIn).trim().split("T")[0];
        } else {
          const y = createdDateObj.getFullYear();
          const m = String(createdDateObj.getMonth() + 1).padStart(2, "0");
          const d = String(createdDateObj.getDate()).padStart(2, "0");
          filterDate = `${y}-${m}-${d}`;
        }

        return {
          id: doc.id,
          listing:
            data.listingName ||
            data.hotelName ||
            data.serviceName ||
            "Accommodation",
          customer:
            data.customer?.name ||
            data.customerName ||
            data.customerEmail ||
            "Guest",
          status: data.status || "pending",
          time: timeString,
          filterDate: filterDate,
        };
      });

      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(false);
  }, [fetchBookings]);

  // --- 🔍 APPLY FILTERS ---
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = selectedDate === "ALL" || b.filterDate === selectedDate;

    const queryLower = debouncedSearch.toLowerCase();
    const matchesSearch =
      !debouncedSearch ||
      b.customer.toLowerCase().includes(queryLower) ||
      b.listing.toLowerCase().includes(queryLower) ||
      b.id.toLowerCase().includes(queryLower);

    const badgeLabel = getStatusUI(b.status).label;
    const matchesStatus = statusFilter === "All" || badgeLabel === statusFilter;

    if (debouncedSearch.length > 0) {
      return matchesSearch && matchesStatus;
    }

    return matchesDate && matchesSearch && matchesStatus;
  });
  // --- 렌 RENDER ITEM (UPGRADED CARD) ---
  const renderItem = ({ item: b }: { item: any }) => {
    const badge = getStatusUI(b.status);

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/admin/booking-details" as any,
            params: { id: b.id },
          })
        }
        className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl mb-4 shadow-sm active:scale-95"
      >
        {/* Top Row: Customer Info & Status */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-3 flex-row items-center gap-3">
            <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
              <Text className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {b.customer.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-900 dark:text-white font-bold text-lg"
                numberOfLines={1}
              >
                {b.customer}
              </Text>
              <Text className="text-gray-500 text-[10px] mt-0.5 uppercase tracking-wider font-bold">
                ID: {b.id.substring(0, 8)}
              </Text>
            </View>
          </View>
          <View
            className={`px-2.5 py-1 rounded-md border border-transparent ${badge.bg}`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${badge.text}`}
            >
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Middle Row: Property & Price */}
        <View className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-4">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <Ionicons
              name={b.serviceType?.includes("vehicle") ? "car" : "bed"}
              size={18}
              color="#6366F1"
            />
            <Text
              className="text-gray-700 dark:text-gray-300 font-medium text-sm"
              numberOfLines={1}
            >
              {b.listing}
            </Text>
          </View>
          <Text className="text-gray-900 dark:text-white font-black text-base">
            ₹{Number(b.amount).toLocaleString("en-IN")}
          </Text>
        </View>

        {/* Bottom Row: Dates & Action */}
        <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
          <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            {b.checkIn} → {b.checkOut}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-indigo-500 font-bold text-xs">Details</Text>
            <Ionicons name="chevron-forward" size={12} color="#6366F1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* --- HEADER --- */}
        <View className="px-6 py-2 flex-row justify-between items-center mb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">
            Master Console
          </Text>
          <TouchableOpacity
            onPress={() => fetchBookings(true)}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>

        {/* --- 🔍 SEARCH BAR --- */}
        <View className="px-6 mb-3">
          <View className="flex-row items-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 h-12 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search by name, hotel, or ID..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- 🚥 STATUS FILTERS --- */}
        <View className="pl-6 mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full border mr-2 shadow-sm ${
                  statusFilter === status
                    ? "bg-indigo-500 border-indigo-500"
                    : "bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-800"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    statusFilter === status
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* --- 🗓️ HORIZONTAL DATE PICKER --- */}
        {!debouncedSearch && (
          <View className="mb-6">
            <FlatList
              ref={calendarRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={weekDates}
              keyExtractor={(item) => item.dbFormat}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              renderItem={({ item }) => {
                const isActive = selectedDate === item.dbFormat;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedDate(item.dbFormat)}
                    className={`w-16 h-[88px] rounded-[20px] items-center justify-center shadow-sm border ${
                      isActive
                        ? "bg-indigo-500 border-indigo-500"
                        : "bg-white dark:bg-[#111827] border-gray-100 dark:border-gray-800"
                    }`}
                  >
                    {item.monthName ? (
                      <Text
                        className={`text-[9px] font-bold uppercase mb-0.5 ${isActive ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        {item.monthName}
                      </Text>
                    ) : null}
                    <Text
                      className={`text-xs font-bold mb-1 ${
                        isActive
                          ? "text-indigo-100"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {item.dayName}
                    </Text>
                    <Text
                      className={`text-xl font-black ${
                        isActive
                          ? "text-white"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* --- LIST TITLE --- */}
        <View className="px-6 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              {debouncedSearch
                ? "Search Results"
                : selectedDate === "ALL"
                  ? "All Bookings"
                  : "Daily Schedule"}
            </Text>
            <View className="bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                {filteredBookings.length}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500">
            {debouncedSearch ? "All dates" : selectedDate}
          </Text>
        </View>

        {/* --- 🚀 FLATLIST --- */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchBookings(true)}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center mt-12">
                <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/10 rounded-full items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/20">
                  <Ionicons
                    name={debouncedSearch ? "search-outline" : "calendar-clear"}
                    size={32}
                    color="#6366F1"
                  />
                </View>
                <Text className="text-gray-900 dark:text-white font-black text-lg">
                  {debouncedSearch ? "No matches found" : "No bookings found"}
                </Text>
                <Text className="text-gray-500 text-center mt-2 text-sm max-w-[200px]">
                  {debouncedSearch
                    ? "Try adjusting your search or status filters."
                    : "No bookings for this date with the current filter."}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
