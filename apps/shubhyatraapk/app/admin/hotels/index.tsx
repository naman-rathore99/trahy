import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../config/firebase";

export default function AdminHotels() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"approved" | "Pending">(
    "approved",
  );

  // --- 🔄 FIRESTORE INTEGRATION ---
  useEffect(() => {
    setLoading(true);

    // Query hotels based on the selected tab (e.g., status == 'approved' or 'pending')
    const q = query(
      collection(db, "hotels"),
      where("status", "==", activeTab.toLowerCase()),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedHotels = snapshot.docs.map((doc) => {
          const data = doc.data();

          // ✅ FIX: Determine correct price by checking pricePerNight first, falling back to price
          const displayPrice = data.pricePerNight
            ? data.pricePerNight
            : data.price;

          return {
            id: doc.id,
            name: data.name || "Unknown Hotel",
            address: data.address || "No Address Provided",
            owner: data.ownerName || "Unknown Owner",
            ownerId: data.ownerId?.substring(0, 6) || "N/A",
            // ✅ FIX: Use the resolved displayPrice
            price: displayPrice ? `₹${displayPrice}` : "Pricing N/A",
            status: data.status || "pending",
          };
        });

        setHotels(fetchedHotels);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching hotels:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [activeTab]);

  // --- SAFE BACK NAVIGATION ---
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/admin/dashboard" as any);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleBack}
              className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full border border-gray-200 dark:border-gray-800"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <View>
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Manage Hotels
              </Text>
              <Text className="text-gray-500 text-xs">
                {hotels.length} {activeTab.toLowerCase()} listings found
              </Text>
            </View>
          </View>

          {/* INTERACTIVE FILTER TABS */}
          <View className="flex-row gap-2 bg-gray-100 dark:bg-[#111827] p-1 rounded-lg border border-gray-200 dark:border-gray-800">
            <TouchableOpacity
              onPress={() => setActiveTab("approved")}
              className={`${activeTab === "approved" ? "bg-green-100 dark:bg-green-500/20 shadow-sm" : ""} px-3 py-1 rounded-md`}
            >
              <Text
                className={`${activeTab === "approved" ? "text-green-600 dark:text-green-500" : "text-gray-500"} text-xs font-bold`}
              >
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("Pending")}
              className={`${activeTab === "Pending" ? "bg-yellow-100 dark:bg-yellow-500/20 shadow-sm" : ""} px-3 py-1 rounded-md`}
            >
              <Text
                className={`${activeTab === "Pending" ? "text-yellow-600 dark:text-yellow-500" : "text-gray-500"} text-xs font-bold`}
              >
                Pending
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#FF5A1F" className="mt-10" />
          ) : hotels.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons
                name="bed-outline"
                size={64}
                color={isDark ? "#374151" : "#D1D5DB"}
              />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No {activeTab.toLowerCase()} hotels
              </Text>
            </View>
          ) : (
            hotels.map((h) => (
              <View
                key={h.id}
                className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6 shadow-sm dark:shadow-none"
              >
                {/* Top Bar */}
                <View className="bg-gray-50 dark:bg-[#0f1218] p-4 flex-row justify-between items-start border-b border-gray-100 dark:border-transparent">
                  <View className="flex-1 pr-2">
                    <Text
                      className="text-gray-900 dark:text-white font-bold text-lg"
                      numberOfLines={1}
                    >
                      {h.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#EF4444"
                      />
                      <Text
                        className="text-gray-500 dark:text-gray-400 text-xs ml-1"
                        numberOfLines={1}
                      >
                        {h.address}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {h.price}
                    </Text>
                    <Text className="text-gray-500 text-[10px]">per night</Text>
                  </View>
                </View>

                {/* Body & Action */}
                <View className="p-4">
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center border border-blue-100 dark:border-blue-900/50">
                      <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                        {h.owner.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {h.owner}
                      </Text>
                      <Text className="text-gray-500 text-[10px]">
                        Owner ID: #{h.ownerId}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push(`/admin/hotels/${h.id}` as any)}
                    className="bg-gray-900 dark:bg-white py-3 rounded-xl items-center shadow-md dark:shadow-none active:scale-95"
                  >
                    <Text className="text-white dark:text-black font-bold text-sm">
                      Manage Hotel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
