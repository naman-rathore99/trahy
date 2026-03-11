import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { auth } from "../../config/firebase";

const TABS = ["Upcoming", "Completed", "Cancelled"];

const STATUS_MAP: Record<string, string[]> = {
  Upcoming: ["confirmed", "paid", "pending_payment"],
  Completed: ["completed", "checked_out"],
  Cancelled: ["cancelled", "failed"],
};

export default function PartnerBookings() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setErrorMsg(null);

      const currentUser = await new Promise<any>((resolve) => {
        if (auth.currentUser !== null) {
          resolve(auth.currentUser);
          return;
        }
        const unsubscribe = auth.onAuthStateChanged((u) => {
          unsubscribe();
          resolve(u);
        });
      });

      if (!currentUser) {
        setErrorMsg("Not logged in.");
        return;
      }

      const token = await currentUser.getIdToken(true);
      const res = await api.get("/api/partner/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) setBookings(res.data.bookings);
      else setErrorMsg(res.data.error || "Failed to load");
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) =>
    STATUS_MAP[activeTab]?.includes(b.status?.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (["confirmed", "paid"].includes(s))
      return { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" };
    if (["pending_payment"].includes(s))
      return { bg: "#FEF9C3", text: "#A16207", border: "#FDE68A" };
    if (["cancelled", "failed"].includes(s))
      return { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" };
    return { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
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
          <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            Guest Bookings
          </Text>
          <TouchableOpacity
            onPress={() => fetchBookings(true)}
            className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isDark ? "white" : "#374151"}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="px-6 mt-4 mb-2">
          <View className="flex-row bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === tab ? "bg-white dark:bg-[#1F2937] shadow-sm" : ""}`}
              >
                <Text
                  className={`font-bold text-xs ${activeTab === tab ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF5A1F" size="large" />
          </View>
        ) : (
          <ScrollView
            className="px-6 py-4"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchBookings(true)}
                tintColor="#FF5A1F"
                colors={["#FF5A1F"]}
              />
            }
          >
            {errorMsg ? (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-4 flex-row justify-between items-center">
                <Text className="text-red-600 text-xs flex-1 mr-3">
                  {errorMsg}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchBookings(true)}
                  className="bg-red-600 px-3 py-2 rounded-xl"
                >
                  <Text className="text-white font-bold text-xs">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredBookings.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-400 font-bold mt-4">
                  No {activeTab.toLowerCase()} bookings
                </Text>
              </View>
            ) : (
              filteredBookings.map((booking) => {
                const colors = getStatusColor(booking.status);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    onPress={() =>
                      router.push("/partner/booking-details" as any)
                    }
                    className="bg-white dark:bg-[#1F2937] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl mb-4 shadow-sm"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1 mr-3">
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">
                          {booking.customer?.name ||
                            booking.customerName ||
                            "Guest"}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {booking.checkIn} → {booking.checkOut}
                        </Text>
                      </View>
                      <View
                        className="px-2.5 py-1 rounded-md border"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{ color: colors.text }}
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          {booking.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-4">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name={
                            booking.serviceType?.includes("vehicle")
                              ? "car"
                              : "bed"
                          }
                          size={18}
                          color="#6B7280"
                        />
                        <Text className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          {booking.listingName}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-bold text-base">
                        ₹{booking.totalAmount}
                      </Text>
                    </View>

                    <TouchableOpacity className="w-full py-3 items-center border-t border-gray-100 dark:border-gray-800">
                      <Text className="text-blue-500 font-bold text-sm">
                        View Details →
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
            <View className="h-20" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
