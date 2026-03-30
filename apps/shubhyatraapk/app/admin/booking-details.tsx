import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../config/firebase";

export default function AdminBookingDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- 🔄 FETCH DATA ---
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "bookings", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          let checkIn = data.checkIn || "Unknown";
          let checkOut = data.checkOut || "Unknown";
          if (checkIn.includes("T")) checkIn = checkIn.split("T")[0];
          if (checkOut.includes("T")) checkOut = checkOut.split("T")[0];

          // Format created date
          let created = "Unknown";
          if (data.createdAt) {
            const d =
              typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate()
                : new Date(data.createdAt);
            created = d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          setBooking({ id: docSnap.id, ...data, checkIn, checkOut, created });
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  // --- 🎨 DYNAMIC STATUS UI ---
  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (
      ["confirmed", "paid", "success", "checked_in", "completed"].includes(s)
    ) {
      return {
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
        icon: "checkmark-circle",
      };
    }
    if (["cancelled", "failed", "rejected"].includes(s)) {
      return {
        bg: "bg-red-500",
        text: "text-red-500",
        lightBg: "bg-red-50 dark:bg-red-900/20",
        icon: "close-circle",
      };
    }
    return {
      bg: "bg-amber-500",
      text: "text-amber-500",
      lightBg: "bg-amber-50 dark:bg-amber-900/20",
      icon: "time",
    };
  };

  // --- 📞 QUICK ACTIONS ---
  const handleCall = () => {
    if (booking?.customerPhone) Linking.openURL(`tel:${booking.customerPhone}`);
    else alert("No phone number provided.");
  };

  const handleEmail = () => {
    if (booking?.customerEmail)
      Linking.openURL(`mailto:${booking.customerEmail}`);
    else alert("No email provided.");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B] items-center justify-center">
        <Ionicons name="document-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-900 dark:text-white font-black text-xl mt-4">
          Booking Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-8 py-3 bg-indigo-500 rounded-full shadow-sm"
        >
          <Text className="text-white font-bold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = getStatusConfig(booking.status);
  const customerName =
    booking.customer?.name || booking.customerName || "Guest User";
  const propertyName =
    booking.listingName ||
    booking.hotelName ||
    booking.serviceName ||
    "Accommodation";
  const totalAmount = Number(
    booking.totalAmount || booking.price || 0,
  ).toLocaleString("en-IN");

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style="light" />

      {/* --- 🎨 DYNAMIC HEADER SECTION --- */}
      <View
        className={`${config.bg} pt-14 pb-20 px-6 rounded-b-[40px] shadow-sm`}
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/20 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg tracking-wider uppercase">
            Order Details
          </Text>
          <View className="w-10 h-10" />
        </View>

        <View className="items-center">
          <Ionicons
            name={config.icon as any}
            size={48}
            color="white"
            className="mb-2"
          />
          <Text className="text-white font-black text-2xl uppercase tracking-widest">
            {booking.status || "Pending"}
          </Text>
          <Text className="text-white/80 font-medium text-xs mt-1">
            ID: {booking.id}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 -mt-12"
        showsVerticalScrollIndicator={false}
      >
        {/* --- 👤 GUEST FLOATING CARD --- */}
        <View className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-lg shadow-black/5 border border-gray-50 dark:border-gray-800 mb-5">
          <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">
            Guest Information
          </Text>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full items-center justify-center border border-indigo-100 dark:border-indigo-900/30 mr-4">
                <Text className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {customerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-gray-900 dark:text-white font-black text-lg"
                  numberOfLines={1}
                >
                  {customerName}
                </Text>
                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                  {booking.customerEmail || "No email provided"}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCall}
                className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center border border-green-100 dark:border-green-900/30"
              >
                <Ionicons name="call" size={18} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEmail}
                className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center border border-blue-100 dark:border-blue-900/30"
              >
                <Ionicons name="mail" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- 🏨 STAY DETAILS CARD --- */}
        <View className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-5">
          <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">
            Reservation
          </Text>

          <View className="flex-row items-center mb-5">
            <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl items-center justify-center mr-4 border border-gray-100 dark:border-gray-700">
              <Ionicons
                name={booking.serviceType?.includes("vehicle") ? "car" : "bed"}
                size={20}
                color={isDark ? "white" : "#4B5563"}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-900 dark:text-white font-bold text-base"
                numberOfLines={2}
              >
                {propertyName}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5 capitalize">
                Service:{" "}
                {booking.serviceType?.replace("_", " ") || "Hotel Stay"}
              </Text>
            </View>
          </View>

          {/* Timeline UI */}
          <View className="bg-gray-50 dark:bg-[#09090B] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Check In
              </Text>
              <Text className="text-gray-900 dark:text-white font-black text-sm">
                {booking.checkIn}
              </Text>
            </View>

            <View className="px-4 items-center justify-center">
              <View className="h-[2px] w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <View className="absolute bg-gray-50 dark:bg-[#09090B] px-1">
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              </View>
            </View>

            <View className="flex-1 items-end">
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Check Out
              </Text>
              <Text className="text-gray-900 dark:text-white font-black text-sm">
                {booking.checkOut}
              </Text>
            </View>
          </View>
        </View>

        {/* --- 💳 RECEIPT / FINANCIALS --- */}
        <View className="bg-white dark:bg-[#111827] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
          <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">
            Payment Summary
          </Text>

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-600 dark:text-gray-400 font-medium text-sm">
              Booking Source
            </Text>
            <Text className="text-gray-900 dark:text-white font-bold text-sm capitalize">
              {booking.source?.replace("_", " ") || "Mobile App"}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-600 dark:text-gray-400 font-medium text-sm">
              Payment Status
            </Text>
            <View
              className={`px-2 py-0.5 rounded-md border ${config.lightBg} border-transparent`}
            >
              <Text
                className={`${config.text} text-[10px] font-bold uppercase tracking-widest`}
              >
                {booking.paymentStatus || "Pending"}
              </Text>
            </View>
          </View>

          <View className="border-t border-dashed border-gray-200 dark:border-gray-700 my-4" />

          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-gray-900 dark:text-white font-black text-lg">
                Total Amount
              </Text>
              <Text className="text-gray-400 text-[10px] font-bold mt-1">
                Booked on {booking.created}
              </Text>
            </View>
            <Text className="text-indigo-600 dark:text-indigo-400 font-black text-2xl">
              ₹{totalAmount}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
