import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";

const STATUS_COLORS: Record<
  string,
  { bg: string; icon: string; color: string }
> = {
  Available: { bg: "bg-green-100", icon: "checkmark-circle", color: "#10B981" },
  Occupied: { bg: "bg-red-100", icon: "lock-closed", color: "#EF4444" },
  Cleaning: { bg: "bg-orange-100", icon: "construct", color: "#F59E0B" },
  Maintenance: { bg: "bg-gray-100", icon: "build", color: "#6B7280" },
};

export default function PartnerRooms() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "",
    price: "",
    status: "Available",
    floor: "",
  });

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

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const res = await api.get("/api/partner/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data.rooms || []);
    } catch (e: any) {
      console.error("Rooms fetch error:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleAddRoom = async () => {
    if (!form.type || !form.price) {
      Alert.alert("Missing Fields", "Room type and price are required.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      await api.post(
        "/api/partner/rooms",
        {
          type: form.type,
          pricePerNight: Number(form.price),
          status: form.status,
          floor: form.floor,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Alert.alert("✅ Added", "Room added successfully.");
      setShowModal(false);
      setForm({ type: "", price: "", status: "Available", floor: "" });
      fetchRooms();
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
              className="bg-[#FF5A1F] px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">Add First Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20 }}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            refreshing={loading}
            onRefresh={fetchRooms}
            renderItem={({ item }) => {
              const s = STATUS_COLORS[item.status] || STATUS_COLORS.Available;
              return (
                <View className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 shadow-sm w-[48%]">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">
                      {item.floor || "—"}
                    </Text>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text className="text-gray-500 text-xs font-bold uppercase mb-1">
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

        {/* Add Room Modal */}
        <Modal visible={showModal} transparent animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-[#111827] rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Add New Room
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? "white" : "gray"}
                  />
                </TouchableOpacity>
              </View>

              {[
                { key: "type", placeholder: "Room Type (e.g. Deluxe AC) *" },
                {
                  key: "price",
                  placeholder: "Price Per Night (₹) *",
                  keyboardType: "numeric" as any,
                },
                { key: "floor", placeholder: "Floor / Room Number" },
              ].map(({ key, placeholder, keyboardType }) => (
                <TextInput
                  key={key}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={form[key as keyof typeof form]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
                  keyboardType={keyboardType}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 mb-3 text-gray-900 dark:text-white"
                />
              ))}

              {/* Status Picker */}
              <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                Status
              </Text>
              <View className="flex-row gap-2 mb-6 flex-wrap">
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
                className={`py-4 rounded-xl items-center ${saving ? "bg-orange-300" : "bg-[#FF5A1F]"}`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Add Room
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
