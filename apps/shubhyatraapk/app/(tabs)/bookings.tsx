import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define what our database booking looks like
interface Booking {
  id: string;
  listingName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
  serviceType: string;
  createdAt: any;
  extras?: any; // To show if they booked a cab!
}

export default function CustomerBookings() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH LIVE DATA ---
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        return;
      }

      const bookingsRef = collection(db, "bookings");

      // 🚨 NOTE: If Firebase throws an error in your terminal, it will give you a URL.
      // Click that URL to automatically create the Index required for this query!
      const q = query(
        bookingsRef,
        where("customer.userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const fetchedBookings = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Booking[];

          setBookings(fetchedBookings);
          setLoading(false);
        },
        (error) => {
          console.error("❌ FIRESTORE INDEX ERROR:", error.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // --- 2. UI HELPER FUNCTIONS ---
  const getStatusDisplay = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pending"))
      return {
        label: "Pending",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
        icon: "time",
      };
    if (s.includes("confirm") || s.includes("paid") || s.includes("success"))
      return {
        label: "Confirmed",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: "checkmark-circle",
      };
    if (s.includes("fail") || s.includes("cancel"))
      return {
        label: "Cancelled",
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
        icon: "close-circle",
      };
    return {
      label: status,
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
      icon: "information-circle",
    };
  };

  // 🚨 REPLACED DATE-FNS WITH NATIVE JAVASCRIPT 🚨
  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // --- 3. RENDER INDIVIDUAL TRIP CARD ---
  const renderTripCard = ({ item }: { item: Booking }) => {
    const statusData = getStatusDisplay(item.status);
    const hasExtras = item.extras?.needCab || item.extras?.vehicleId;

    return (
      <TouchableOpacity className="bg-white dark:bg-[#111827] rounded-[24px] mb-5 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        {/* Header: Status & Price */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/20">
          <View
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${statusData.bg}`}
          >
            <Ionicons
              name={statusData.icon as any}
              size={14}
              className={statusData.text}
            />
            <Text
              className={`text-xs font-black uppercase tracking-wider ${statusData.text}`}
            >
              {statusData.label}
            </Text>
          </View>
          <Text className="text-gray-900 dark:text-white font-black text-lg tracking-tight">
            ₹{item.totalAmount?.toLocaleString("en-IN") || 0}
          </Text>
        </View>

        {/* Body: Details */}
        <View className="p-5">
          <View className="flex-row gap-4">
            <View className="w-14 h-14 bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/20 rounded-2xl items-center justify-center border border-[#FF5A1F]/20">
              <Ionicons
                name={item.serviceType === "hotel_stay" ? "bed" : "car"}
                size={24}
                color="#FF5A1F"
              />
            </View>
            <View className="flex-1 justify-center">
              <Text
                className="font-black text-gray-900 dark:text-white text-lg leading-tight mb-1"
                numberOfLines={2}
              >
                {item.listingName}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Booking ID: {item.id.substring(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Dates Box */}
          <View className="flex-row mt-5 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                Check In
              </Text>
              <Text className="text-gray-900 dark:text-white font-bold">
                {formatDate(item.checkIn)}
              </Text>
            </View>
            <View className="w-[1px] bg-gray-200 dark:bg-gray-700 mx-4" />
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                Check Out
              </Text>
              <Text className="text-gray-900 dark:text-white font-bold">
                {formatDate(item.checkOut)}
              </Text>
            </View>
          </View>

          {/* Extras Tag */}
          {hasExtras && (
            <View className="flex-row items-center gap-2 mt-4">
              <Ionicons name="sparkles" size={14} color="#10B981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                Includes Travel Extras (Cab/Rental)
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
              My Itinerary
            </Text>
            <Text className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">
              Trips
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF5A1F" />
          </View>
        ) : bookings.length === 0 ? (
          // Empty State
          <View className="flex-1 justify-center items-center px-8 pb-20">
            <View className="w-32 h-32 bg-orange-50 dark:bg-orange-900/10 rounded-full items-center justify-center mb-6 border-8 border-white dark:border-[#111827] shadow-xl">
              <Ionicons
                name="airplane"
                size={48}
                color="#FF5A1F"
                style={{ transform: [{ rotate: "-45deg" }] }}
              />
            </View>
            <Text className="text-gray-900 dark:text-white text-2xl font-black text-center tracking-tight mb-2">
              No trips booked yet
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed max-w-[260px]">
              Time to dust off your bags and start planning your next great
              spiritual adventure.
            </Text>
            <TouchableOpacity className="mt-8 bg-[#FF5A1F] px-8 py-4 rounded-full shadow-lg shadow-orange-500/30">
              <Text className="text-white font-black">
                Explore Destinations
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Filled List
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 100,
              paddingTop: 10,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={renderTripCard}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
