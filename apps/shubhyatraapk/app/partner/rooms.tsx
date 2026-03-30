import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

const STATUS_COLORS: Record<
  string,
  { bg: string; icon: string; color: string }
> = {
  Available: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "checkmark-circle",
    color: "#10B981",
  },
  Occupied: {
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: "lock-closed",
    color: "#EF4444",
  },
  Cleaning: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: "construct",
    color: "#F59E0B",
  },
  Maintenance: {
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: "build",
    color: "#6B7280",
  },
};

export default function PartnerRooms() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Master Panic Switch State
  const [isPropertySoldOut, setIsPropertySoldOut] = useState(false);
  const [switchingPanic, setSwitchingPanic] = useState(false);

  // Form + Image State
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "",
    price: "",
    status: "Available",
    floor: "",
  });

  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const getToken = async () => {
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
    return currentUser?.getIdToken(true);
  };

  // 1. Fetch Rooms & Panic Switch State
  const fetchRoomsAndStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token || !auth.currentUser) return;

      // Fetch the Master Switch Status from Firestore
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().isPropertySoldOut) {
        setIsPropertySoldOut(userDoc.data().isPropertySoldOut);
      }

      // Fetch the Rooms from your API
      const res = await api.get("/api/partner/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data.rooms || []);
    } catch (e: any) {
      console.error("Fetch error:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoomsAndStatus();
  }, [fetchRoomsAndStatus]);

  // 2. Handle Master Sold Out Switch (Offline Walk-ins)
  const toggleMasterSoldOut = async (value: boolean) => {
    if (!auth.currentUser) return;
    setSwitchingPanic(true);
    setIsPropertySoldOut(value);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        isPropertySoldOut: value,
      });
      if (value) {
        Alert.alert(
          "Bookings Stopped",
          "Your property is now hidden from new travelers. Manage your walk-ins offline.",
        );
      } else {
        Alert.alert(
          "Bookings Open",
          "Your available rooms are now visible to travelers again.",
        );
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      setIsPropertySoldOut(!value); // Revert on failure
    } finally {
      setSwitchingPanic(false);
    }
  };

  // 3. Pick Image for New Room
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Allow access to photos to add a room picture.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // Landscape crop for room photos
      quality: 0.8,
    });

    if (!result.canceled) {
      setRoomImage(result.assets[0].uri);
    }
  };

  // 4. Save Room (Upload to Cloudinary, then POST to API)
  const handleAddRoom = async () => {
    if (!form.type || !form.price) {
      Alert.alert("Missing Fields", "Room type and price are required.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      let uploadedImageUrl = "";

      // Upload Image to Cloudinary First
      if (roomImage) {
        const data = new FormData();
        data.append("file", {
          uri: roomImage,
          type: "image/jpeg",
          name: `room_${Date.now()}.jpg`,
        } as any);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "");
        data.append("cloud_name", CLOUDINARY_CLOUD_NAME || "");

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: data,
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const cloudinaryResult = await cloudinaryResponse.json();
        if (cloudinaryResult.secure_url) {
          uploadedImageUrl = cloudinaryResult.secure_url;
        }
      }

      // Send Data to your Backend API
      await api.post(
        "/api/partner/rooms",
        {
          type: form.type,
          pricePerNight: Number(form.price),
          status: form.status,
          floor: form.floor,
          imageUrl: uploadedImageUrl, // 🚨 Pass the new image URL!
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Alert.alert("✅ Added", "Room added successfully.");
      setShowModal(false);
      setForm({ type: "", price: "", status: "Available", floor: "" });
      setRoomImage(null);
      fetchRoomsAndStatus();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || "Failed to add room.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "white" : "gray"}
              />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Room Manager
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle" size={32} color="#FF5A1F" />
          </TouchableOpacity>
        </View>

        {/* 🚨 MASTER PANIC SWITCH (Walk-in Management) */}
        <View className="px-6 pt-6">
          <View
            className={`p-5 rounded-2xl mb-2 flex-row items-center justify-between border ${isPropertySoldOut ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30" : "bg-white border-gray-200 dark:bg-[#111827] dark:border-gray-800"}`}
          >
            <View className="flex-1 pr-4">
              <Text
                className={`text-base font-bold ${isPropertySoldOut ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
              >
                Stop All New Bookings
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                Turn this on to hide your hotel if offline walk-ins fill up the
                rooms.
              </Text>
            </View>
            <Switch
              value={isPropertySoldOut}
              onValueChange={toggleMasterSoldOut}
              disabled={switchingPanic}
              trackColor={{ false: "#E5E7EB", true: "#EF4444" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Room List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF5A1F" size="large" />
          </View>
        ) : rooms.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 px-10">
            <Ionicons name="bed-outline" size={56} color="#D1D5DB" />
            <Text className="text-gray-400 font-bold text-lg text-center">
              No rooms added yet
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="bg-[#FF5A1F] px-6 py-3 rounded-xl mt-2"
            >
              <Text className="text-white font-bold">Add First Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={{ padding: 20 }}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            refreshing={loading}
            onRefresh={fetchRoomsAndStatus}
            renderItem={({ item }) => {
              const s = STATUS_COLORS[item.status] || STATUS_COLORS.Available;
              return (
                <View className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 shadow-sm w-[48%] overflow-hidden">
                  {/* Room Image Display */}
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="w-full h-24 rounded-xl mb-3 bg-gray-100 dark:bg-gray-800"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-24 rounded-xl mb-3 bg-gray-100 dark:bg-gray-800 items-center justify-center">
                      <Ionicons name="image-outline" size={24} color="gray" />
                    </View>
                  )}

                  <View className="flex-row justify-between items-start mb-2">
                    <Text
                      className="text-xl font-bold text-gray-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {item.floor || "—"}
                    </Text>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text
                    className="text-gray-500 text-xs font-bold uppercase mb-1"
                    numberOfLines={1}
                  >
                    {item.type}
                  </Text>
                  <Text className="text-[#FF5A1F] font-bold">
                    ₹{Number(item.pricePerNight).toLocaleString("en-IN")}
                    <Text className="text-gray-400 text-xs">/night</Text>
                  </Text>
                  <View
                    className={`mt-3 px-2 py-1 rounded-md self-start ${s.bg}`}
                  >
                    <Text
                      style={{ color: s.color }}
                      className="text-[10px] font-bold"
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* 🚨 Add Room Modal (Now with Image Upload) */}
        <Modal visible={showModal} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-[#111827] rounded-t-3xl p-6 h-[85%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Add New Room
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons
                    name="close-circle"
                    size={28}
                    color={isDark ? "white" : "gray"}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Image Upload Box */}
                <TouchableOpacity
                  onPress={pickImage}
                  className="w-full h-40 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl mb-6 items-center justify-center overflow-hidden"
                >
                  {roomImage ? (
                    <Image
                      source={{ uri: roomImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={32} color="gray" />
                      <Text className="text-gray-500 font-bold mt-2">
                        Upload Room Photo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {[
                  { key: "type", placeholder: "Room Type (e.g. Deluxe AC) *" },
                  {
                    key: "price",
                    placeholder: "Price Per Night (₹) *",
                    keyboardType: "numeric" as any,
                  },
                  {
                    key: "floor",
                    placeholder: "Room Number / Label (e.g. 101)",
                  },
                ].map(({ key, placeholder, keyboardType }) => (
                  <TextInput
                    key={key}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={form[key as keyof typeof form]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
                    keyboardType={keyboardType}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 text-gray-900 dark:text-white font-medium"
                  />
                ))}

                <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                  Current Status
                </Text>
                <View className="flex-row gap-2 mb-8 flex-wrap">
                  {Object.keys(STATUS_COLORS).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setForm((p) => ({ ...p, status: s }))}
                      className={`px-4 py-2 rounded-xl border ${form.status === s ? "bg-[#FF5A1F] border-[#FF5A1F]" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${form.status === s ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleAddRoom}
                  disabled={saving}
                  className={`py-4 rounded-xl items-center flex-row justify-center ${saving ? "bg-orange-300" : "bg-[#FF5A1F]"}`}
                >
                  {saving ? (
                    <>
                      <ActivityIndicator color="white" />
                      <Text className="text-white font-bold text-base ml-2">
                        Saving Room...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Save Room Listing
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
