import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

export default function AdminRequestsList() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      // Fetch all "pending" join requests, newest first
      const q = query(
        collection(db, "join_requests"),
        where("status", "==", "pending"),
        orderBy("appliedAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(fetchedRequests);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      // Fallback if index isn't built yet
      if (error.message.includes("requires an index")) {
        const fallbackQ = query(
          collection(db, "join_requests"),
          where("status", "==", "pending"),
        );
        const fallbackSnap = await getDocs(fallbackQ);
        setRequests(
          fallbackSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 active:scale-95"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <View>
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
              Action Required
            </Text>
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              Partner Applications
            </Text>
          </View>
        </View>

        {/* --- LIST CONTENT --- */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FF5A1F" size="large" />
          </View>
        ) : (
          <ScrollView
            className="px-6 pt-6"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchRequests(true)}
                tintColor="#FF5A1F"
              />
            }
          >
            {requests.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <View className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="checkmark-done" size={40} color="#10B981" />
                </View>
                <Text className="text-gray-900 dark:text-white text-lg font-black">
                  You're all caught up!
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  There are no pending partner applications to review at this
                  time.
                </Text>
              </View>
            ) : (
              requests.map((req) => (
                <TouchableOpacity
                  key={req.id}
                  onPress={() =>
                    router.push({
                      pathname: "/admin/requests/[id]", // Adjust this if your filename is different!
                      params: { id: req.id },
                    })
                  }
                  className="bg-white dark:bg-[#111827] p-5 rounded-[28px] mb-4 border border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 flex-row items-center"
                >
                  <View className="w-14 h-14 bg-orange-50 dark:bg-[#FF5A1F]/10 rounded-2xl items-center justify-center border border-orange-100 dark:border-[#FF5A1F]/20 mr-4">
                    <Text className="text-xl font-black text-[#FF5A1F]">
                      {(req.businessName || req.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-gray-900 dark:text-white font-bold text-lg mb-0.5"
                      numberOfLines={1}
                    >
                      {req.businessName || req.name || "Unknown Business"}
                    </Text>
                    <Text
                      className="text-gray-500 text-xs font-medium"
                      numberOfLines={1}
                    >
                      {req.type || "Hotel / Fleet"} •{" "}
                      {req.ownerName || "Unknown Owner"}
                    </Text>
                  </View>

                  <View className="bg-red-50 dark:bg-red-900/20 w-10 h-10 rounded-full items-center justify-center ml-2 border border-red-100 dark:border-red-900/30">
                    <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View className="h-20" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
