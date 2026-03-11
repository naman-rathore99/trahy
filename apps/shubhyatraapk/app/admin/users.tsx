import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminUsers() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // --- 🔄 FIRESTORE INTEGRATION ---
  useEffect(() => {
    // Only fetch standard users (not partners or admins)
    const q = query(collection(db, "users"), where("role", "==", "user"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName || data.name || "Unknown User",
            email: data.email || "No Email",
            phone: data.phone || "", // Used for the "Call" button
            image: data.profileImage || data.avatarUrl || null,
            // Assuming these might be calculated later, setting safe defaults
            spent: data.totalSpent
              ? `₹${data.totalSpent.toLocaleString()}`
              : "₹0",
            lastTrip: data.lastTripLocation
              ? `${data.lastTripLocation}`
              : "No trips yet",
            verified: data.isEmailVerified || data.verified || false,
          };
        });

        // Sort alphabetically by name
        fetchedUsers.sort((a, b) => a.name.localeCompare(b.name));

        setUsers(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // --- 🔍 LOCAL SEARCH FILTER ---
  const filteredUsers = users.filter((u) => {
    const queryLower = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(queryLower) ||
      u.email.toLowerCase().includes(queryLower)
    );
  });

  // --- 📞 ACTION HANDLERS ---
  const handleCall = (phone: string) => {
    if (!phone) {
      alert("No phone number registered for this user.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

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
        {/* --- Header --- */}
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
                Travelers
              </Text>
              <Text className="text-gray-500 text-xs">
                Customer profiles & history
              </Text>
            </View>
          </View>
          <View className="bg-gray-100 dark:bg-[#111827] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            <Text className="text-gray-900 dark:text-white font-bold text-xs">
              Total: {filteredUsers.length}
            </Text>
          </View>
        </View>

        <View className="flex-1 px-6 pt-6">
          {/* --- 🔍 Search Bar --- */}
          <View className="flex-row items-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 mb-6 shadow-sm dark:shadow-none">
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              placeholder="Search by name or email..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
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
          ) : filteredUsers.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons
                name="people-outline"
                size={64}
                color={isDark ? "#374151" : "#D1D5DB"}
              />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No travelers found.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredUsers.map((user) => (
                <View
                  key={user.id}
                  className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-gray-200 dark:border-gray-800 mb-4 shadow-sm dark:shadow-none"
                >
                  {/* Top Row: Avatar + Info + Verified */}
                  <View className="flex-row items-start justify-between mb-6">
                    <View className="flex-row gap-3 flex-1 pr-2">
                      {/* Avatar Logic: Image or Initials */}
                      {user.image ? (
                        <Image
                          source={{ uri: user.image }}
                          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
                        />
                      ) : (
                        <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
                          <Text className="text-gray-600 dark:text-gray-400 font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1">
                        <Text
                          className="text-gray-900 dark:text-white font-bold text-lg"
                          numberOfLines={1}
                        >
                          {user.name}
                        </Text>
                        <Text
                          className="text-gray-500 text-xs"
                          numberOfLines={1}
                        >
                          {user.email}
                        </Text>
                      </View>
                    </View>

                    {/* Verified Badge */}
                    {user.verified && (
                      <View className="bg-green-50 dark:bg-green-500/10 p-1.5 rounded-full border border-green-200 dark:border-green-500/20">
                        <Ionicons
                          name="checkmark-sharp"
                          size={14}
                          color="#10B981"
                        />
                      </View>
                    )}
                  </View>

                  {/* Stats Grid */}
                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1 bg-gray-50 dark:bg-black/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Ionicons
                          name="wallet-outline"
                          size={12}
                          color={isDark ? "gray" : "#6B7280"}
                        />
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase">
                          Spent
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-bold text-lg">
                        {user.spent}
                      </Text>
                    </View>

                    <View className="flex-1 bg-gray-50 dark:bg-black/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={isDark ? "gray" : "#6B7280"}
                        />
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase">
                          Last Trip
                        </Text>
                      </View>
                      <Text
                        className="text-gray-900 dark:text-white font-bold text-xs mt-1"
                        numberOfLines={1}
                      >
                        {user.lastTrip}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleCall(user.phone)}
                      className="flex-1 bg-gray-100 dark:bg-[#1F2937] h-12 rounded-xl flex-row items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 active:scale-95"
                    >
                      <Ionicons
                        name="call"
                        size={16}
                        color={isDark ? "white" : "black"}
                      />
                      <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        Call
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      // Make this active when you build the user detail screen
                      // onPress={() => router.push(`/admin/users/${user.id}`)}
                      className="flex-1 bg-[#FF5A1F] h-12 rounded-xl flex-row items-center justify-center gap-2 shadow-sm shadow-orange-500/20 active:scale-95"
                    >
                      <Text className="text-white font-bold text-sm">
                        View Profile
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View className="h-10" />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
