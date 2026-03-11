import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../config/firebase";

const ALL_AMENITIES = [
  "Free WiFi",
  "AC",
  "TV",
  "Geyser",
  "Parking",
  "Pool",
  "Breakfast",
];

export default function AdminHotelEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"Details" | "Rooms">("Details");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- DATA STATES ---
  const [hotelName, setHotelName] = useState("");
  const [ownerData, setOwnerData] = useState({ name: "", id: "" });
  const [isActive, setIsActive] = useState(true);
  const [basePrice, setBasePrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // --- 🔄 FETCH HOTEL DATA ---
  useEffect(() => {
    const fetchHotelData = async () => {
      if (!id) return;
      try {
        // 1. Fetch main hotel document
        const hotelRef = doc(db, "hotels", id as string);
        const hotelSnap = await getDoc(hotelRef);

        if (hotelSnap.exists()) {
          const data = hotelSnap.data();
          setHotelName(data.name || "Unnamed Hotel");
          setOwnerData({
            name: data.ownerName || "Unknown",
            id: data.ownerId || "N/A",
          });
          setIsActive(data.status === "active");
          setBasePrice(data.price?.toString() || "");
          setLocation(data.address || "");
          setDescription(data.description || "");
          setAmenities(data.amenities || []);
        } else {
          Alert.alert("Error", "Hotel not found.");
          router.back();
        }

        // 2. Fetch Rooms subcollection
        const roomsRef = collection(db, `hotels/${id}/rooms`);
        const roomsSnap = await getDocs(roomsRef);
        setRooms(roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        Alert.alert("Error", "Failed to fetch hotel details.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

  // --- 💾 SAVE CHANGES ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const hotelRef = doc(db, "hotels", id as string);
      await updateDoc(hotelRef, {
        status: isActive ? "approved" : "pending",
        price: Number(basePrice) || 0,
        address: location,
        description: description,
        amenities: amenities,
        updatedAt: new Date(),
      });
      Alert.alert("Success", "Hotel details updated!");
    } catch (error) {
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black flex-row justify-between items-center">
          <View className="flex-row items-center gap-4">
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
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                {hotelName}
              </Text>
              <Text className="text-gray-500 text-[10px] uppercase">
                ID: {id?.slice(0, 8)}...
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#FF5A1F] px-4 py-2 rounded-lg shadow-md shadow-orange-500/30 active:opacity-70"
          >
            <View className="flex-row items-center gap-2">
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="white" />
                  <Text className="text-white font-bold text-xs">Save</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Toggle Switch (Details / Rooms) --- */}
        <View className="flex-row justify-center mt-4 mb-2">
          <View className="bg-gray-200 dark:bg-[#111827] p-1 rounded-xl flex-row border border-gray-300 dark:border-gray-800">
            <TouchableOpacity
              onPress={() => setActiveTab("Details")}
              className={`px-6 py-2 rounded-lg ${activeTab === "Details" ? "bg-white dark:bg-gray-800 shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold ${activeTab === "Details" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("Rooms")}
              className={`px-6 py-2 rounded-lg ${activeTab === "Rooms" ? "bg-white dark:bg-gray-800 shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold ${activeTab === "Rooms" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Rooms ({rooms.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          {/* ================= DETAILS TAB ================= */}
          {activeTab === "Details" && (
            <View className="gap-6 pb-10">
              {/* Status & Price Row */}
              <View className="flex-row gap-4">
                <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                    Publishing Status
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsActive(!isActive)}
                    className={`flex-row items-center justify-between p-3 rounded-xl border ${isActive ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"}`}
                  >
                    <Text
                      className={`font-bold text-xs ${isActive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                    >
                      {isActive ? "Active" : "Hidden"}
                    </Text>
                    <Ionicons
                      name={isActive ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={isActive ? "#10B981" : "#EF4444"}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                    Base Price (₹)
                  </Text>
                  <TextInput
                    value={basePrice}
                    onChangeText={setBasePrice}
                    keyboardType="number-pad"
                    className="bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-3 rounded-xl font-bold text-lg border border-gray-200 dark:border-gray-800"
                  />
                </View>
              </View>

              {/* Location */}
              <View className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                  Location
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  className="bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-4 rounded-xl font-medium border border-gray-200 dark:border-gray-800"
                />
              </View>

              {/* Description */}
              <View className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  className="bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-4 rounded-xl font-medium border border-gray-200 dark:border-gray-800 h-28"
                  textAlignVertical="top"
                />
              </View>

              {/* Amenities */}
              <View className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-3">
                  Hotel Amenities
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ALL_AMENITIES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleAmenity(item)}
                      className={`px-3 py-2 rounded-lg border ${amenities.includes(item) ? "bg-orange-50 dark:bg-[#FF5A1F]/20 border-orange-200 dark:border-[#FF5A1F]" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${amenities.includes(item) ? "text-[#FF5A1F]" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white border border-gray-300 dark:border-white">
                    <Ionicons name="add" size={14} color="black" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Owner Details (Read-only for reference) */}
              <View className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-3">
                  Owner Details
                </Text>
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
                    <Ionicons
                      name="person"
                      size={18}
                      color={isDark ? "white" : "gray"}
                    />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      {ownerData.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      ID: {ownerData.id}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================= ROOMS TAB ================= */}
          {activeTab === "Rooms" && (
            <View className="pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Room Inventory
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Manage pricing, stock, and amenities.
                  </Text>
                </View>
                <TouchableOpacity className="bg-gray-900 dark:bg-white px-4 py-2 rounded-lg flex-row items-center gap-2 active:opacity-70">
                  <Ionicons
                    name="add"
                    size={16}
                    color={isDark ? "black" : "white"}
                  />
                  <Text className="text-white dark:text-black font-bold text-xs">
                    Add Room
                  </Text>
                </TouchableOpacity>
              </View>

              {rooms.length === 0 ? (
                <View className="items-center mt-10">
                  <Ionicons
                    name="bed-outline"
                    size={48}
                    color={isDark ? "#374151" : "#D1D5DB"}
                  />
                  <Text className="text-gray-500 mt-4">
                    No rooms added yet.
                  </Text>
                </View>
              ) : (
                rooms.map((room) => (
                  <View
                    key={room.id}
                    className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden p-4 mb-4 shadow-sm dark:shadow-none"
                  >
                    <View className="flex-row justify-between mb-4">
                      <View className="flex-row gap-3">
                        <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 items-center justify-center">
                          <Ionicons
                            name="bed"
                            size={20}
                            color={isDark ? "gray" : "#9CA3AF"}
                          />
                        </View>
                        <View>
                          <Text className="text-gray-900 dark:text-white font-bold text-lg">
                            {room.name || "Standard Room"}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            Max {room.capacity || 2} Guests
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-[#EF4444] font-bold text-lg">
                          ₹{room.price || 0}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-4 flex-wrap">
                      {(room.amenities || ["AC", "TV"]).map(
                        (tag: string, i: number) => (
                          <View
                            key={i}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded"
                          >
                            <Text className="text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase">
                              {tag}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>

                    <View className="flex-row gap-3">
                      <TouchableOpacity className="flex-1 bg-gray-50 dark:bg-gray-800 h-10 rounded-lg items-center justify-center border border-gray-200 dark:border-gray-700 flex-row gap-2">
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={isDark ? "white" : "black"}
                        />
                        <Text className="text-gray-900 dark:text-white font-bold text-xs">
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-1 bg-red-50 dark:bg-red-500/10 h-10 rounded-lg items-center justify-center border border-red-200 dark:border-red-500/20 flex-row gap-2">
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />
                        <Text className="text-red-600 dark:text-red-500 font-bold text-xs">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
