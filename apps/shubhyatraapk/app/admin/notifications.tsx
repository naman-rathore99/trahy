import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    writeBatch,
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
import { db } from "../../config/firebase"; // 🚨 Adjust path

export default function AdminNotifications() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 🔄 LIVE FETCH NOTIFICATIONS ---
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "New Alert",
          message: data.message || "You have a new notification.",
          isRead: data.isRead || false,
          type: data.type || "info", // 'booking', 'user', 'system'
          time: data.createdAt?.toDate
            ? data.createdAt
                .toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
        };
      });
      setNotifications(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- ✉️ MARK AS READ ---
  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  // --- 📬 MARK ALL AS READ ---
  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => markAsRead(item.id)}
      className={`p-4 border-b border-gray-100 dark:border-gray-800 flex-row gap-4 ${
        item.isRead
          ? "bg-white dark:bg-[#09090B]"
          : "bg-indigo-50/50 dark:bg-indigo-900/10"
      }`}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${
          item.type === "booking"
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : "bg-indigo-100 dark:bg-indigo-900/30"
        }`}
      >
        <Ionicons
          name={item.type === "booking" ? "calendar" : "notifications"}
          size={20}
          color={item.type === "booking" ? "#10B981" : "#6366F1"}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className={`text-sm ${item.isRead ? "font-bold text-gray-900 dark:text-white" : "font-black text-indigo-900 dark:text-indigo-100"}`}
          >
            {item.title}
          </Text>
          <Text className="text-[10px] text-gray-500 font-bold">
            {item.time}
          </Text>
        </View>
        <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5">
          {item.message}
        </Text>
      </View>
      {/* Red Dot for Unread */}
      {!item.isRead && (
        <View className="w-2 h-2 rounded-full bg-red-500 mt-2" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-50 dark:bg-[#111827] rounded-full items-center justify-center border border-gray-100 dark:border-gray-800"
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              Notifications
            </Text>
          </View>
          <TouchableOpacity onPress={markAllAsRead}>
            <Ionicons name="checkmark-done-circle" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color="#9CA3AF"
                />
                <Text className="text-gray-900 dark:text-white font-black text-lg mt-4">
                  All caught up!
                </Text>
                <Text className="text-gray-500 text-center mt-2 text-sm">
                  You have no new notifications right now.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
