import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

export default function PartnerBookingDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setErrorMsg("No booking ID provided.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        // Fetch the specific booking directly from Firestore
        const docRef = doc(db, "bookings", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorMsg("Booking not found.");
        }
      } catch (e: any) {
        setErrorMsg("Failed to load booking details.");
        console.error("Error fetching booking details:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCall = () => {
    const phone = booking?.customerPhone || booking?.customer?.phone;
    if (!phone) return Alert.alert("No phone number available.");
    Linking.openURL(`tel:${phone}`);
  };

  // 🚨 NEW: Actual Database Update for Check-In
  const handleCheckIn = () => {
    Alert.alert(
      "Confirm Check-In",
      "Are you sure you want to mark this guest as checked in?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsUpdating(true);
            try {
              const docRef = doc(db, "bookings", id);
              await updateDoc(docRef, {
                status: "checked_in",
                checkedInAt: new Date().toISOString(),
              });

              // Update local state so UI changes immediately
              setBooking((prev: any) => ({ ...prev, status: "checked_in" }));
              Alert.alert("Success", "Guest has been checked in.");
            } catch (error) {
              Alert.alert(
                "Error",
                "Could not check in guest. Please try again.",
              );
              console.error("Check-in error:", error);
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading)
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#09090B] items-center justify-center">
        <ActivityIndicator color="#FF5A1F" size="large" />
      </View>
    );

  if (errorMsg || !booking)
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#09090B] items-center justify-center px-10 gap-4">
        <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
        <Text className="text-gray-700 dark:text-gray-300 font-bold text-center">
          {errorMsg || "Booking not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#FF5A1F] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="light" />

      {/* Hero Header */}
      <View className="h-72 bg-gray-900 relative">
        <Image
          source={{
            uri:
              booking.imageUrl ||
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000",
          }}
          className="w-full h-full opacity-60"
          resizeMode="cover"
        />
        <SafeAreaView className="absolute top-0 left-0 right-0 p-6 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/30 rounded-full items-center justify-center border border-white/20"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
        <View className="absolute bottom-16 left-6 bg-green-500 px-3 py-1 rounded-lg">
          <Text className="text-white font-bold text-xs uppercase tracking-wider">
            {booking.status}
          </Text>
        </View>
        <Text className="absolute bottom-6 left-6 text-white text-3xl font-bold shadow-sm shadow-black/50">
          {booking.serviceName || booking.listingName || "Hotel Stay"}
        </Text>
      </View>

      {/* Content Sheet */}
      <View className="flex-1 bg-white dark:bg-[#09090B] -mt-6 rounded-t-[30px] px-6 pt-8 shadow-2xl">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Booking ID + Amount */}
          <View className="flex-row justify-between items-start mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
            <View>
              <Text className="text-gray-500 text-xs uppercase mb-1">
                Booking ID
              </Text>
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                #{booking.id?.slice(-6).toUpperCase()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-500 text-xs uppercase mb-1">
                Total Amount
              </Text>
              <Text className="text-[#FF5A1F] text-2xl font-bold">
                ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Guest Card */}
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">
            Guest Details
          </Text>
          <View className="bg-gray-50 dark:bg-[#1F2937] p-4 rounded-2xl flex-row items-center border border-gray-100 dark:border-gray-800 mb-8">
            <View className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
              <Ionicons
                name="person"
                size={24}
                color={isDark ? "white" : "black"}
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-lg">
                {booking.customer?.name || booking.customerName || "Guest"}
              </Text>
              <Text className="text-gray-500 text-xs">
                {booking.customer?.email ||
                  booking.customerEmail ||
                  "No email provided"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCall}
              className="w-10 h-10 bg-[#FF5A1F] rounded-full items-center justify-center shadow-lg"
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Trip Details */}
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">
            Trip Details
          </Text>
          <View className="bg-gray-50 dark:bg-[#1F2937] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 gap-5">
            {[
              {
                icon: "calendar",
                color: "#FF5A1F",
                bg: "bg-orange-100 dark:bg-orange-900/30",
                label: "Check-In",
                value: booking.checkIn,
              },
              {
                icon: "calendar-outline",
                color: "#6366F1",
                bg: "bg-indigo-100 dark:bg-indigo-900/30",
                label: "Check-Out",
                value: booking.checkOut,
              },
              {
                icon: "people",
                color: "#3B82F6",
                bg: "bg-blue-100 dark:bg-blue-900/30",
                label: "Guests",
                value: `${booking.guests || 1} guests`,
              },
              {
                icon: "card",
                color: "#10B981",
                bg: "bg-green-100 dark:bg-green-900/30",
                label: "Payment",
                value:
                  booking.paymentStatus === "paid"
                    ? "✅ Paid Online"
                    : "Pending",
              },
            ].map(({ icon, color, bg, label, value }) => (
              <View key={label} className="flex-row items-center gap-4">
                <View
                  className={`w-10 h-10 ${bg} rounded-xl items-center justify-center`}
                >
                  <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View>
                  <Text className="text-gray-500 text-xs font-bold uppercase mb-0.5">
                    {label}
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {value || "—"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Action Button (Only show if not already checked in) */}
      {booking.status !== "checked_in" && booking.status !== "completed" && (
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={handleCheckIn}
            disabled={isUpdating}
            className={`w-full h-16 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-orange-500/30 ${isUpdating ? "bg-orange-300" : "bg-[#FF5A1F]"}`}
          >
            {isUpdating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="key" size={22} color="white" />
                <Text className="text-white font-bold text-lg tracking-wide">
                  CHECK-IN GUEST
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
