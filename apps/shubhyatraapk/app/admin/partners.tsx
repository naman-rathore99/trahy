import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminPartnersDirectory() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [partners, setPartners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // --- 🔄 FIRESTORE INTEGRATION ---
  useEffect(() => {
    // ✅ FIX: Pulling actual partner data directly from the "hotels" collection
    const q = query(collection(db, "hotels"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPartners = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            hotelName: data.name || "Unknown Hotel",
            owner: data.ownerName || "Unknown Owner",
            email: data.ownerEmail || "N/A",
            ownerId: data.ownerId || "N/A",
            location: data.city || data.location || "N/A",
            status: data.status || "pending",
            type: "Hotel Partner", // Tagging them as hotel owners
          };
        });
        setPartners(fetchedPartners);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching partners:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // --- 🔍 LOCAL SEARCH FILTER ---
  const filteredPartners = partners.filter((p) => {
    const queryLower = searchQuery.toLowerCase();
    return (
      p.hotelName.toLowerCase().includes(queryLower) ||
      p.owner.toLowerCase().includes(queryLower) ||
      p.email.toLowerCase().includes(queryLower) ||
      p.location.toLowerCase().includes(queryLower)
    );
  });

  // --- DYNAMIC STATUS STYLING ---
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "active":
        return {
          bg: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",
          text: "text-green-600 dark:text-green-500",
        };
      case "rejected":
        return {
          bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
          text: "text-red-600 dark:text-red-500",
        };
      default: // pending
        return {
          bg: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20",
          text: "text-yellow-600 dark:text-yellow-500",
        };
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black">
          <TouchableOpacity
            onPress={() => router.back()}
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
              Partner Directory
            </Text>
            <Text className="text-gray-500 text-xs">
              {filteredPartners.length} partners found
            </Text>
          </View>
        </View>

        <View className="px-6 pt-6 flex-1">
          {/* --- 🔍 Search Bar --- */}
          <View className="flex-row items-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 mb-6 shadow-sm dark:shadow-none">
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              placeholder="Search by business, owner, email, location..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FF5A1F" className="mt-10" />
          ) : filteredPartners.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons
                name="search-outline"
                size={64}
                color={isDark ? "#374151" : "#D1D5DB"}
              />
              <Text className="text-gray-500 mt-4">
                No partners match your search.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredPartners.map((partner) => {
                const statusStyle = getStatusStyles(partner.status);

                return (
                  <TouchableOpacity
                    key={partner.id}
                    // ✅ Navigates to the Hotel Editor since this is where their data lives
                    onPress={() =>
                      router.push(`/admin/hotels/${partner.id}` as any)
                    }
                    className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl mb-4 shadow-sm dark:shadow-none active:scale-95"
                  >
                    {/* Card Header */}
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row gap-3 flex-1 pr-2">
                        <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
                          <Text className="font-bold text-gray-600 dark:text-gray-400 text-lg uppercase">
                            {partner.hotelName.charAt(0)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-gray-900 dark:text-white font-bold text-lg"
                            numberOfLines={1}
                          >
                            {partner.hotelName}
                          </Text>
                          <Text className="text-gray-500 dark:text-gray-400 text-xs">
                            {partner.type}
                          </Text>
                        </View>
                      </View>

                      {/* Dynamic Status Badge */}
                      <View
                        className={`px-2 py-1 rounded-md border ${statusStyle.bg}`}
                      >
                        <Text
                          className={`text-[10px] font-bold uppercase ${statusStyle.text}`}
                        >
                          {partner.status}
                        </Text>
                      </View>
                    </View>

                    {/* ✅ Mapped to Hotel Data (Owner, Email, Location) */}
                    <View className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-4 border border-gray-100 dark:border-gray-800/50">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons
                          name="person"
                          size={16}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text className="text-gray-600 dark:text-gray-400 text-xs">
                          Owner: {partner.owner}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons
                          name="mail"
                          size={16}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                          className="text-gray-600 dark:text-gray-400 text-xs"
                          numberOfLines={1}
                        >
                          {partner.email}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons
                          name="location"
                          size={16}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                          className="text-gray-600 dark:text-gray-400 text-xs"
                          numberOfLines={1}
                        >
                          {partner.location}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="finger-print"
                          size={16}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text className="text-gray-600 dark:text-gray-400 text-xs">
                          ID: {partner.ownerId?.substring(0, 8)}...
                        </Text>
                      </View>
                    </View>

                    <View className="w-full bg-[#FF5A1F] h-10 rounded-lg items-center justify-center shadow-sm shadow-orange-500/20">
                      <Text className="text-white font-bold text-sm">
                        View Partner Profile
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View className="h-10" />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
