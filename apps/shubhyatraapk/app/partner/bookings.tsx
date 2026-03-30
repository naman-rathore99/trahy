import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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
import { auth, db } from "../../config/firebase";

// --- 🗓️ TIMEZONE SAFE DATES (Starts from Today, goes forward 30 days) ---
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

const getStatusUI = (status: string) => {
  const s = status?.toLowerCase();
  if (["confirmed", "paid", "checked_in", "success", "completed"].includes(s))
    return {
      bg: "#DCFCE7",
      text: "#15803D",
      border: "#BBF7D0",
      label: "Success",
    };
  if (["pending_payment", "pending"].includes(s))
    return {
      bg: "#FEF9C3",
      text: "#A16207",
      border: "#FDE68A",
      label: "Pending",
    };
  if (["cancelled", "failed", "rejected"].includes(s))
    return {
      bg: "#FEE2E2",
      text: "#DC2626",
      border: "#FECACA",
      label: "Cancelled",
    };
  return {
    bg: "#F3F4F6",
    text: "#6B7280",
    border: "#E5E7EB",
    label: "Unknown",
  };
};

export default function PartnerBookings() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const STATUS_OPTIONS = ["All", "Pending", "Success", "Cancelled"];

  const weekDates = generateDates();
  const [selectedDate, setSelectedDate] = useState(getLocalTodayString());
  const calendarRef = useRef<FlatList>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMsg("Not logged in.");
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "bookings"),
        where("partnerId", "==", currentUser.uid),
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
            "My Property",
          customer:
            data.customer?.name ||
            data.customerName ||
            data.customerEmail ||
            "Guest",
          status: data.status || "pending",
          time: timeString,
          filterDate: filterDate,
          amount: data.totalAmount || data.price || 0,
          serviceType: data.serviceType || "hotel",
        };
      });

      setBookings(fetchedBookings);
    } catch (error: any) {
      if (error.message.includes("requires an index")) {
        setErrorMsg("Database index building... Check terminal for the link.");
      } else {
        setErrorMsg("Failed to load bookings.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) => {
    const matchesDate = selectedDate === "ALL" || b.filterDate === selectedDate;
    const queryLower = debouncedSearch.toLowerCase();
    const guestName = (b.customer || "Guest").toLowerCase();
    const matchesSearch =
      !debouncedSearch ||
      guestName.includes(queryLower) ||
      b.listing.toLowerCase().includes(queryLower) ||
      b.id.toLowerCase().includes(queryLower);

    const badgeLabel = getStatusUI(b.status).label;
    const matchesStatus = statusFilter === "All" || badgeLabel === statusFilter;

    if (debouncedSearch.length > 0) return matchesSearch && matchesStatus;
    return matchesDate && matchesSearch && matchesStatus;
  });

  const renderItem = ({ item: b }: { item: any }) => {
    const colors = getStatusUI(b.status);

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/partner/booking-details",
            params: { id: b.id },
          })
        }
        className="bg-white dark:bg-[#1F2937] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl mb-4 shadow-sm active:scale-95"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-3">
            <Text
              className="text-gray-900 dark:text-white font-bold text-lg"
              numberOfLines={1}
            >
              {b.customer}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5">
              ID: {b.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          <View
            className="px-2.5 py-1 rounded-md border"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            <Text
              style={{ color: colors.text }}
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              {colors.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={b.serviceType?.includes("vehicle") ? "car" : "bed"}
              size={18}
              color="#6B7280"
            />
            <Text
              className="text-gray-700 dark:text-gray-300 font-medium text-sm max-w-[150px]"
              numberOfLines={1}
            >
              {b.listing}
            </Text>
          </View>
          <Text className="text-gray-900 dark:text-white font-bold text-base">
            ₹{Number(b.amount).toLocaleString("en-IN")}
          </Text>
        </View>

        <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
          <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold">
            {selectedDate === "ALL" ? b.filterDate : b.time}
          </Text>
          <Text className="text-emerald-500 font-bold text-xs">
            View Details →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="px-6 py-2 flex-row justify-between items-center mb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">
            My Bookings
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

        <View className="px-6 mb-3">
          <View className="flex-row items-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 h-12 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search guests or booking ID..."
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
                className={`px-4 py-1.5 rounded-full border mr-2 shadow-sm ${statusFilter === status ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-800"}`}
              >
                <Text
                  className={`text-xs font-bold ${statusFilter === status ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
                    className={`w-16 h-[88px] rounded-[20px] items-center justify-center shadow-sm border ${isActive ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-[#111827] border-gray-100 dark:border-gray-800"}`}
                  >
                    {item.monthName ? (
                      <Text
                        className={`text-[9px] font-bold uppercase mb-0.5 ${isActive ? "text-emerald-200" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        {item.monthName}
                      </Text>
                    ) : null}
                    <Text
                      className={`text-xs font-bold mb-1 ${isActive ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {item.dayName}
                    </Text>
                    <Text
                      className={`text-xl font-black ${isActive ? "text-white" : "text-gray-900 dark:text-white"}`}
                    >
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        <View className="px-6 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              {debouncedSearch
                ? "Search Results"
                : selectedDate === "ALL"
                  ? "All Bookings"
                  : "Daily Schedule"}
            </Text>
            <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {filteredBookings.length}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500">
            {debouncedSearch ? "All dates" : selectedDate}
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#10B981" />
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
                tintColor="#10B981"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center mt-12">
                {errorMsg ? (
                  <Text className="text-red-500 text-center px-6">
                    {errorMsg}
                  </Text>
                ) : (
                  <>
                    <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/20">
                      <Ionicons
                        name={
                          debouncedSearch ? "search-outline" : "calendar-clear"
                        }
                        size={32}
                        color="#10B981"
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-black text-lg">
                      {debouncedSearch ? "No matches found" : "No bookings yet"}
                    </Text>
                    <Text className="text-gray-500 text-center mt-2 text-sm max-w-[200px]">
                      {debouncedSearch
                        ? "Try adjusting your search terms."
                        : "You have no guests scheduled for this date/status."}
                    </Text>
                  </>
                )}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
