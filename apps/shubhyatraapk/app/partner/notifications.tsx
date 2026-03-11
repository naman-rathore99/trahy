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
  where,
  writeBatch,
} from "firebase/firestore";
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
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function PartnerNotifications() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { isRead: true });
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.isRead)
        .forEach((n) =>
          batch.update(doc(db, "notifications", n.id), { isRead: true }),
        );
      await batch.commit();
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
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
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Text className="text-xs text-[#FF5A1F] font-bold">
                  {unreadCount} unread
                </Text>
              )}
            </View>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl"
            >
              <Text className="text-gray-600 dark:text-gray-300 text-xs font-bold">
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF5A1F" size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Ionicons
              name="notifications-off-outline"
              size={56}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 font-bold text-lg">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-sm text-center px-10">
              You'll be notified here when guests make bookings.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="px-6 mt-4 gap-3">
              {notifications.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => markAsRead(notif.id)}
                  className={`p-4 rounded-2xl border ${
                    notif.isRead
                      ? "bg-white dark:bg-[#111827] border-gray-100 dark:border-gray-800"
                      : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30"
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className={`p-2.5 rounded-xl ${
                        notif.isRead
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-[#FF5A1F]"
                      }`}
                    >
                      <Ionicons
                        name={
                          notif.type === "new_booking"
                            ? "calendar"
                            : "notifications"
                        }
                        size={20}
                        color={notif.isRead ? "#9CA3AF" : "white"}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <Text
                          className={`font-bold text-sm flex-1 mr-2 ${
                            notif.isRead
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {notif.title}
                        </Text>
                        {!notif.isRead && (
                          <View className="w-2 h-2 bg-[#FF5A1F] rounded-full mt-1" />
                        )}
                      </View>
                      <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                        {notif.message}
                      </Text>
                      <Text className="text-gray-400 text-[10px] mt-2 font-medium">
                        {formatTime(notif.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
