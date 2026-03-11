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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput, // 🚨 NEW: Added TextInput import
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

// Tell Expo how to handle notifications when the app is open
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

  // 🚨 NEW: Search State
  const [searchQuery, setSearchQuery] = useState("");

  const isInitialLoad = useRef(true);
  const notifiedIds = useRef(new Set());
  const [sound, setSound] = useState<Audio.Sound>();

  // PUSH NOTIFICATION REGISTRATION LOGIC
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
        if (finalStatus !== "granted") {
          console.log("Failed to get push token for push notification!");
          return;
        }

        try {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          const token = tokenData.data;

          await updateDoc(doc(db, "users", user!.uid), {
            expoPushToken: token,
          });
        } catch (error) {
          console.error("Error generating/saving push token:", error);
        }
      } else {
        console.log("Must use physical device for Push Notifications");
      }
    }

    registerForPushNotificationsAsync();
  }, [user]);

  // Cleanup audio
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

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
      else setErrorMsg(res.data.error || "Failed to load bookings");
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

  // In-App Audio & Alert Listener
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
              } catch (e) {
                console.log("Could not play sound", e);
              }

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

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (Number(b.totalAmount) || 0),
    0,
  );

  // 🚨 NEW: Filter Logic for the Search Bar
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
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] z-10">
          <View>
            <Text className="text-[#FF5A1F] text-[10px] font-black uppercase tracking-widest mb-1">
              Partner Portal
            </Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-black">
              {user?.displayName?.split(" ")[0] || "Partner"} 👋
            </Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <TouchableOpacity
              onPress={() => fetchBookings(true)}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
            >
              <Ionicons name="refresh" size={20} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)" as any)}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
            >
              <Ionicons name="repeat" size={20} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/partner/notifications" as any)}
              className="bg-white dark:bg-gray-800 p-2 rounded-full relative border border-gray-200 dark:border-gray-700"
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={iconColor}
              />
              {unreadCount > 0 && (
                <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
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
            <View className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex-row items-center justify-between">
              <Text className="text-red-600 dark:text-red-300 text-xs flex-1 mr-3">
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

          <View className="px-6 mt-6 flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white dark:bg-[#111827] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
              <View className="p-2.5 rounded-xl self-start mb-4 bg-green-100 dark:bg-green-900/30">
                <Ionicons name="wallet" size={22} color="#10B981" />
              </View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </Text>
              <Text className="text-gray-500 text-xs font-bold">
                Recent Revenue
              </Text>
            </View>
            <View className="w-[48%] bg-white dark:bg-[#111827] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
              <View className="p-2.5 rounded-xl self-start mb-4 bg-blue-100 dark:bg-blue-900/30">
                <Ionicons name="log-in" size={22} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {bookings.length}
              </Text>
              <Text className="text-gray-500 text-xs font-bold">
                Recent Bookings
              </Text>
            </View>
          </View>

          <View
            className={`mx-6 p-5 rounded-3xl border flex-row items-center justify-between shadow-sm ${isHotelOnline ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30" : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"}`}
          >
            <View className="flex-row items-center gap-3">
              <View
                className={`w-3 h-3 rounded-full ${isHotelOnline ? "bg-green-500" : "bg-red-500"}`}
              />
              <View>
                <Text
                  className={`font-bold text-lg ${isHotelOnline ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                >
                  {isHotelOnline ? "Hotel is Online" : "Hotel is Offline"}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {isHotelOnline
                    ? "Taking instant bookings."
                    : "Hidden from search results."}
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

          {/* 🚨 NEW: Search Bar UI */}
          <View className="px-6 mt-6 mb-2">
            <View className="flex-row items-center bg-white dark:bg-[#111827] px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search guest, phone, or hotel..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-gray-900 dark:text-white text-sm"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="px-6 mt-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-gray-900 dark:text-white">
                ⚡ Confirmed Bookings
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#FF5A1F" className="my-6" />
            ) : filteredBookings.length === 0 && !errorMsg ? (
              <View className="items-center py-10">
                <Ionicons
                  name={searchQuery ? "search-outline" : "calendar-outline"}
                  size={40}
                  color="#9CA3AF"
                />
                <Text className="text-gray-500 italic text-center mt-3">
                  {searchQuery
                    ? "No bookings match your search."
                    : "No confirmed bookings right now."}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    onPress={() => fetchBookings(true)}
                    className="mt-4 bg-[#FF5A1F] px-6 py-2.5 rounded-xl"
                  >
                    <Text className="text-white font-bold text-sm">
                      Refresh
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // 🚨 NEW: Map over filteredBookings instead of raw bookings
              filteredBookings.map((booking) => (
                <View
                  key={booking.id}
                  className="mb-4 bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  <View className="bg-green-50 dark:bg-green-900/20 px-4 py-2 flex-row justify-between items-center border-b border-green-100 dark:border-green-900/30">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#10B981"
                      />
                      <Text className="text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                        Confirmed & Paid
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs font-bold">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg">
                        {booking.customerName ||
                          booking.customer?.name ||
                          "Guest"}
                      </Text>
                      <Text className="font-black text-lg text-green-600">
                        ₹{booking.totalAmount}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons
                        name={booking.serviceType === "hotel" ? "bed" : "car"}
                        size={14}
                        color="#6B7280"
                      />
                      <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {booking.listingName}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs mb-4">
                      Check In: {booking.checkIn} • Check Out:{" "}
                      {booking.checkOut}
                    </Text>
                    <View className="flex-row gap-2 mt-2">
                      <TouchableOpacity className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center justify-center">
                        <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm">
                          View Details
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleCall(
                            booking.customerPhone || booking.customer?.phone,
                          )
                        }
                        className="bg-[#10B981] py-3 px-6 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
                      >
                        <Ionicons name="call" size={16} color="white" />
                        <Text className="text-white font-bold text-sm">
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
