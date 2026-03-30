import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../config/firebase"; // 🚨 Adjust path

export default function AdminHotels() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 🔄 LIVE FETCH INVENTORY ---
  useEffect(() => {
    const q = query(collection(db, "hotels"));

    // We use onSnapshot so if a partner adds a hotel, it pops up live!
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedHotels = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Default to false if the field doesn't exist yet
        isSoldOut: doc.data().isSoldOut || false,
        status: doc.data().status || "pending",
      }));
      setHotels(fetchedHotels);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- ⚡ TOGGLE SOLD OUT STATUS ---
  const toggleSoldOut = async (
    hotelId: string,
    currentStatus: boolean,
    hotelName: string,
  ) => {
    const newStatus = !currentStatus;

    Alert.alert(
      newStatus ? "Mark as Sold Out?" : "Open for Bookings?",
      newStatus
        ? `This will instantly hide ${hotelName} from travelers.`
        : `Travelers will be able to book ${hotelName} again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: newStatus ? "Lock Hotel" : "Open Hotel",
          style: newStatus ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "hotels", hotelId), {
                isSoldOut: newStatus,
                updatedAt: new Date().toISOString(),
              });
            } catch (error) {
              Alert.alert("Error", "Could not update hotel status.");
            }
          },
        },
      ],
    );
  };

  // --- ✅ APPROVE PENDING HOTEL ---
  const approveHotel = async (hotelId: string) => {
    try {
      await updateDoc(doc(db, "hotels", hotelId), { status: "approved" });
    } catch (error) {
      Alert.alert("Error", "Could not approve hotel.");
    }
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({ item: h }: { item: any }) => (
    <View className="bg-white dark:bg-[#111827] p-5 rounded-[24px] mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-4">
          <Text
            className="text-gray-900 dark:text-white font-black text-lg tracking-tight mb-1"
            numberOfLines={1}
          >
            {h.name || "Unnamed Property"}
          </Text>
          <Text className="text-gray-500 text-xs font-medium">
            Partner: {h.ownerName || h.ownerEmail || "Unknown"}
          </Text>
        </View>

        {/* Status Badge */}
        {h.status === "pending" ? (
          <View className="bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-md">
            <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
              Pending
            </Text>
          </View>
        ) : h.isSoldOut ? (
          <View className="bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-md">
            <Text className="text-red-600 dark:text-red-400 text-[10px] font-bold uppercase">
              Sold Out
            </Text>
          </View>
        ) : (
          <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md">
            <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
              Active
            </Text>
          </View>
        )}
      </View>

      {/* Admin Controls */}
      <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {/* Sold Out Toggle (Only show if approved) */}
        {h.status === "approved" ? (
          <View className="flex-row items-center gap-3">
            <Switch
              value={h.isSoldOut}
              onValueChange={() => toggleSoldOut(h.id, h.isSoldOut, h.name)}
              trackColor={{
                false: isDark ? "#374151" : "#E5E7EB",
                true: "#EF4444",
              }}
              thumbColor={"#FFFFFF"}
            />
            <Text
              className={`text-xs font-bold ${h.isSoldOut ? "text-red-500" : "text-gray-500"}`}
            >
              {h.isSoldOut ? "LOCKED" : "TAKING BOOKINGS"}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => approveHotel(h.id)}
            className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30"
          >
            <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              Approve Property
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
          <Ionicons
            name="pencil"
            size={14}
            color={isDark ? "white" : "black"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className="px-6 py-2 flex-row justify-between items-center mb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">
            Inventory
          </Text>
        </View>

        {/* Search */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 h-12 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search properties or partners..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            />
          </View>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" className="mt-10" />
        ) : (
          <FlatList
            data={filteredHotels}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
