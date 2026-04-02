import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// PUSH NOTIFICATION IMPORTS
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { auth, db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PartnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "white" : "#1F2937";

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHotelOnline, setIsHotelOnline] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isInitialLoad = useRef(true);
  const notifiedIds = useRef(new Set());
  const [sound, setSound] = useState<Audio.Sound>();

  // --- PUSH NOTIFICATIONS ---
  useEffect(() => {
    if (!user) return;
    async function registerForPushNotificationsAsync() {
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF5A1F",
        });
      }
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;
        try {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          await updateDoc(doc(db, "users", user!.uid), {
            expoPushToken: tokenData.data,
          });
        } catch (error) {
          console.error("Error generating push token:", error);
        }
      }
    }
    registerForPushNotificationsAsync();
  }, [user]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- FETCH DATA ---
  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setErrorMsg(null);

      const currentUser = await new Promise<any>((resolve) => {
        if (auth.currentUser !== null) return resolve(auth.currentUser);
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

      if (res.data.success) {
        setBookings(res.data.bookings);
      } else {
        setErrorMsg(res.data.error || "Failed to load bookings");
      }
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error || error.message || "Request failed",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- LIVE ALERTS ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", user!.uid),
      where("isRead", "==", false),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
      if (isInitialLoad.current) {
        snapshot.docs.forEach((doc) => notifiedIds.current.add(doc.id));
        isInitialLoad.current = false;
      } else {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const newNotif = change.doc.data();
            const notifId = change.doc.id;
            if (!notifiedIds.current.has(notifId)) {
              notifiedIds.current.add(notifId);
              try {
                const { sound: newSound } = await Audio.Sound.createAsync(
                  require("../../assets/notification.mp3"),
                );
                setSound(newSound);
                await newSound.playAsync();
              } catch (e) {}
              fetchBookings(true);
              Alert.alert(
                "🎉 New Booking!",
                newNotif.message || "You just received a new booking.",
                [
                  { text: "Dismiss", style: "cancel" },
                  {
                    text: "View",
                    onPress: () => router.push("/partner/notifications" as any),
                  },
                ],
              );
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, [user, fetchBookings]);

  const handleHotelToggle = async (newValue: boolean) => {
    setIsHotelOnline(newValue);
    setToggleLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      await api.patch(
        "/api/partner/inventory",
        { type: "hotel", isAvailable: newValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      setIsHotelOnline(!newValue);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (!phone) return Alert.alert("No phone number provided.");
    Linking.openURL(`tel:${phone}`);
  };

  // 🚨 DATA CALCULATION FOR CHARTS & STATS
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (Number(b.totalAmount) || 0),
    0,
  );

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dayStr: d.toLocaleDateString("en-US", { weekday: "short" }), // "Mon", "Tue"
        fullDate: d.toDateString(),
        rawAmount: 0,
      };
    });

    bookings.forEach((b) => {
      if (b.createdAt) {
        const bDate = new Date(b.createdAt).toDateString();
        const dayMatch = last7Days.find((d) => d.fullDate === bDate);
        if (
          dayMatch &&
          ["confirmed", "paid", "success", "completed"].includes(
            (b.status || "").toLowerCase(),
          )
        ) {
          dayMatch.rawAmount += Number(b.totalAmount) || 0;
        }
      }
    });

    const maxRev = Math.max(...last7Days.map((d) => d.rawAmount), 1);
    return last7Days.map((d) => ({
      ...d,
      heightPercent:
        maxRev <= 1 && d.rawAmount === 0
          ? 5
          : Math.max((d.rawAmount / maxRev) * 100, 5),
    }));
  }, [bookings]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const queryStr = searchQuery.toLowerCase();
    const guestName = (
      booking.customerName ||
      booking.customer?.name ||
      "Guest"
    ).toLowerCase();
    const listing = (booking.listingName || "").toLowerCase();
    const phone = (
      booking.customerPhone ||
      booking.customer?.phone ||
      ""
    ).toLowerCase();
    return (
      guestName.includes(queryStr) ||
      listing.includes(queryStr) ||
      phone.includes(queryStr)
    );
  });

  return (
    <View className="flex-1 bg-[#F4F7F9] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] z-10 shadow-sm">
          <View>
            <Text className="text-[#FF5A1F] text-[10px] font-black uppercase tracking-widest mb-1">
              Partner Portal
            </Text>
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              {user?.displayName?.split(" ")[0] || "Partner"} 👋
            </Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <TouchableOpacity
              onPress={() => fetchBookings(true)}
              className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-100 dark:border-gray-700"
            >
              <Ionicons name="refresh" size={18} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/partner/notifications" as any)}
              className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full relative border border-gray-100 dark:border-gray-700"
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={iconColor}
              />
              {unreadCount > 0 && (
                <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#111827]" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBookings(true)}
              tintColor="#FF5A1F"
              colors={["#FF5A1F"]}
            />
          }
        >
          {errorMsg && (
            <View className="mx-6 mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex-row items-center justify-between">
              <Text className="text-red-600 dark:text-red-300 text-xs flex-1 mr-3 font-bold">
                {errorMsg}
              </Text>
              <TouchableOpacity
                onPress={() => fetchBookings(true)}
                className="bg-red-600 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-bold text-xs">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- SAAS HIGHLIGHTS GRID (2x2) --- */}
          <View className="px-6 mt-6 flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white dark:bg-[#111827] p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Ionicons name="wallet" size={16} color="#9CA3AF" />
                <View className="bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                  <Text className="text-[9px] font-black text-green-600">
                    Total
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Gross Revenue
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-[#111827] p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Ionicons name="calendar" size={16} color="#9CA3AF" />
                <View className="bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                  <Text className="text-[9px] font-black text-blue-600">
                    Active
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {bookings.length}
              </Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Total Bookings
              </Text>
            </View>
          </View>

          {/* --- 7-DAY REVENUE CHART --- */}
          <View className="mx-6 bg-white dark:bg-[#111827] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-base font-black text-gray-900 dark:text-white mb-0.5">
                  Revenue Trend
                </Text>
                <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Last 7 Days
                </Text>
              </View>
            </View>

            {/* Native CSS-Style Bar Chart */}
            <View className="h-32 flex-row items-end justify-between">
              {chartData.map((d, i) => (
                <View
                  key={i}
                  className="items-center w-[12%] h-full justify-end"
                >
                  {/* Tooltip for largest bar */}
                  {d.heightPercent === 100 && d.rawAmount > 0 && (
                    <View className="absolute -top-6 bg-gray-900 dark:bg-white px-2 py-1 rounded shadow-sm z-10 items-center">
                      <Text className="text-white dark:text-black text-[8px] font-black">
                        ₹
                        {d.rawAmount >= 1000
                          ? `${(d.rawAmount / 1000).toFixed(1)}k`
                          : d.rawAmount}
                      </Text>
                    </View>
                  )}
                  <View
                    className={`w-full rounded-t-md transition-all ${d.heightPercent === 100 && d.rawAmount > 0 ? "bg-[#FF5A1F]" : "bg-orange-100 dark:bg-orange-900/30"}`}
                    style={{ height: `${d.heightPercent}%` }}
                  />
                  <Text className="text-[9px] font-bold text-gray-400 mt-2">
                    {d.dayStr}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* --- HOTEL STATUS TOGGLE --- */}
          <View
            className={`mx-6 p-5 mb-6 rounded-[24px] border flex-row items-center justify-between shadow-sm ${isHotelOnline ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30" : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"}`}
          >
            <View className="flex-row items-center gap-3">
              <View
                className={`w-3 h-3 rounded-full ${isHotelOnline ? "bg-green-500 shadow-sm shadow-green-500" : "bg-red-500"}`}
              />
              <View>
                <Text
                  className={`font-black text-base ${isHotelOnline ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                >
                  {isHotelOnline ? "Listing is Online" : "Listing is Offline"}
                </Text>
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isHotelOnline ? "text-green-600/70 dark:text-green-500/70" : "text-red-600/70 dark:text-red-500/70"}`}
                >
                  {isHotelOnline
                    ? "Taking instant bookings"
                    : "Hidden from search"}
                </Text>
              </View>
            </View>
            <Switch
              value={isHotelOnline}
              onValueChange={handleHotelToggle}
              disabled={toggleLoading}
              trackColor={{ false: "#FCA5A5", true: "#10B981" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* --- SEARCH BAR --- */}
          <View className="px-6 mb-4">
            <View className="flex-row items-center bg-white dark:bg-[#111827] px-4 py-3.5 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-sm">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search guest, phone, or hotel..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-gray-900 dark:text-white text-sm font-medium"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  className="ml-2 p-1"
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* --- RECENT BOOKINGS FEED --- */}
          <View className="px-6 mt-2 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                ⚡ Recent Bookings
              </Text>
              {filteredBookings.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push("/bookings" as any)}
                >
                  <Text className="text-[#FF5A1F] font-bold text-xs">
                    View All ➔
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator color="#FF5A1F" className="my-6" />
            ) : filteredBookings.length === 0 && !errorMsg ? (
              <View className="items-center py-12 bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <Ionicons
                  name={searchQuery ? "search-outline" : "calendar-outline"}
                  size={40}
                  color="#9CA3AF"
                />
                <Text className="text-gray-500 font-bold text-sm mt-3">
                  {searchQuery
                    ? "No bookings match your search."
                    : "No confirmed bookings yet."}
                </Text>
              </View>
            ) : (
              filteredBookings.slice(0, 5).map((booking) => (
                <View
                  key={booking.id}
                  className="mb-4 bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  <View className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 flex-row justify-between items-center border-b border-gray-100 dark:border-gray-800">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#10B981"
                      />
                      <Text className="text-gray-900 dark:text-gray-300 text-[10px] font-black uppercase tracking-wider">
                        Confirmed
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-[10px] font-bold">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-gray-900 dark:text-white font-black text-lg">
                        {booking.customerName ||
                          booking.customer?.name ||
                          "Guest"}
                      </Text>
                      <Text className="font-black text-lg text-[#FF5A1F]">
                        ₹{booking.totalAmount}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2 mb-2">
                      <Ionicons
                        name={booking.serviceType === "hotel" ? "bed" : "car"}
                        size={14}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-600 dark:text-gray-400 text-xs font-bold">
                        {booking.listingName}
                      </Text>
                    </View>

                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-5">
                      In: {booking.checkIn} • Out: {booking.checkOut}
                    </Text>

                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() =>
                          router.push(`/booking/${booking.id}` as any)
                        }
                        className="flex-1 bg-gray-100 dark:bg-gray-800 py-3.5 rounded-xl items-center justify-center border border-gray-200 dark:border-gray-700"
                      >
                        <Text className="text-gray-900 dark:text-white font-bold text-xs">
                          View Details
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleCall(
                            booking.customerPhone || booking.customer?.phone,
                          )
                        }
                        className="bg-[#111827] dark:bg-white py-3.5 px-6 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
                      >
                        <Ionicons
                          name="call"
                          size={14}
                          color={isDark ? "black" : "white"}
                        />
                        <Text className="text-white dark:text-black font-bold text-xs">
                          Call Guest
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
