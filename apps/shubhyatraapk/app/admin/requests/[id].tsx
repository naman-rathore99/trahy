import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../config/firebase"; // Adjust path if needed

export default function AdminRequestDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // --- 🔄 FETCH DATA ---
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "join_requests", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert("Error", "Request not found");
          router.back();
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id]);

  // --- ⚙️ HANDLE APPROVE / REJECT ---
  const handleAction = (status: "approved" | "rejected") => {
    Alert.alert(
      status.toUpperCase(),
      `Are you sure you want to mark this application as ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: status === "rejected" ? "destructive" : "default",
          onPress: async () => {
            setProcessing(true);
            try {
              // 1. Update the applicati  on document
              await updateDoc(doc(db, "join_requests", id as string), {
                status: status,
              });
              // 2. If approved, update the actual User's role to 'partner'
              if (status === "approved" && request?.uid) {
                await updateDoc(doc(db, "users", request.uid), {
                  role: "partner",
                });
              }

              Alert.alert("Success", `Application has been ${status}.`);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to update application status.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  if (!request) return null;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black flex-row items-center gap-4">
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
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            Review Application
          </Text>
        </View>

        <ScrollView className="p-6">
          <View className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6 shadow-sm dark:shadow-none">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 pr-4">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                  {request.businessName || "Unknown Business"}
                </Text>
                <Text className="text-gray-500 text-xs uppercase tracking-widest">
                  Application #{id}
                </Text>
              </View>
              <View className="bg-blue-100 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
                <Text className="text-blue-600 dark:text-blue-500 text-xs font-bold uppercase">
                  {request.status || "PENDING"}
                </Text>
              </View>
            </View>

            {/* Details List */}
            <View className="gap-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg items-center justify-center border border-gray-100 dark:border-gray-700">
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={isDark ? "gray" : "#6B7280"}
                  />
                </View>
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    Owner Name
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {request.ownerName || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg items-center justify-center border border-gray-100 dark:border-gray-700">
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={isDark ? "gray" : "#6B7280"}
                  />
                </View>
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    Email Address
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {request.email || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg items-center justify-center border border-gray-100 dark:border-gray-700">
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={isDark ? "gray" : "#6B7280"}
                  />
                </View>
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    Phone Number
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {request.phone || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg items-center justify-center border border-gray-100 dark:border-gray-700">
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={isDark ? "gray" : "#6B7280"}
                  />
                </View>
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    Applied Date
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {request.appliedAt?.toDate
                      ? request.appliedAt.toDate().toLocaleDateString()
                      : "Just now"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Documents Section */}
            <View className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Text className="text-gray-900 dark:text-white font-bold mb-4">
                Submitted Documents
              </Text>
              <TouchableOpacity
                onPress={() =>
                  request.idProofUrl
                    ? Linking.openURL(request.idProofUrl)
                    : Alert.alert("No File", "No document uploaded.")
                }
                className="flex-row items-center gap-2"
              >
                <Ionicons name="link" size={18} color="#EF4444" />
                <Text className="text-[#EF4444] font-bold text-sm underline">
                  View ID Proof
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Action Footer (Only show if still pending) */}
        {request.status === "pending" && (
          <View className="p-6 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-900 flex-row gap-4 shadow-lg dark:shadow-none">
            <TouchableOpacity
              disabled={processing}
              onPress={() => handleAction("rejected")}
              className="flex-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 h-14 rounded-2xl items-center justify-center"
            >
              {processing ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text className="text-red-600 dark:text-red-500 font-bold text-lg">
                  Reject
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={processing}
              onPress={() => handleAction("approved")}
              className="flex-1 bg-green-600 dark:bg-white h-14 rounded-2xl items-center justify-center shadow-lg shadow-green-600/30 dark:shadow-none"
            >
              {processing ? (
                <ActivityIndicator color={isDark ? "black" : "white"} />
              ) : (
                <Text className="text-white dark:text-black font-bold text-lg">
                  Approve
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
