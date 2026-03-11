import { db } from "@/config/firebase";
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
              // 1. Update the application document
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

  // --- 🎨 STATUS BADGE STYLING ---
  const getStatusBadge = (status: string = "pending") => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400";
      default:
        return "bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400";
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  if (!request) return null;

  const businessName =
    request.businessName || request.name || "Unknown Business";
  const statusClasses = getStatusBadge(request.status);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 dark:bg-gray-900 p-2.5 rounded-full border border-gray-200 dark:border-gray-800 active:scale-95"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <View>
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              Review Application
            </Text>
            <Text className="text-gray-500 text-xs">ID: {id}</Text>
          </View>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* --- MAIN CARD --- */}
          <View className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 mb-6 shadow-sm dark:shadow-none">
            {/* Top Profile Section */}
            <View className="flex-row items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <View className="w-16 h-16 bg-orange-100 dark:bg-[#FF5A1F]/20 rounded-2xl items-center justify-center border border-orange-200 dark:border-[#FF5A1F]/30">
                <Text className="text-2xl font-black text-[#FF5A1F]">
                  {businessName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-gray-900 dark:text-white text-xl font-bold mb-1"
                  numberOfLines={2}
                >
                  {businessName}
                </Text>
                <View className="flex-row self-start">
                  <View
                    className={`px-3 py-1 rounded-md border ${statusClasses.split(" text-")[0]}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${statusClasses.split(" text-")[1]}`}
                    >
                      {request.status || "PENDING"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Details List (Restored Location & Type with colorful icons) */}
            <View className="gap-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl items-center justify-center border border-blue-100 dark:border-blue-900/30">
                  <Ionicons name="person" size={18} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Owner Name
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.ownerName || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl items-center justify-center border border-purple-100 dark:border-purple-900/30">
                  <Ionicons name="briefcase" size={18} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Partner Type
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.type || "Hotel / Fleet"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl items-center justify-center border border-red-100 dark:border-red-900/30">
                  <Ionicons name="location" size={18} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Location
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.address || request.location || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl items-center justify-center border border-orange-100 dark:border-orange-900/30">
                  <Ionicons name="mail" size={18} color="#F97316" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Email Address
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.email || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl items-center justify-center border border-green-100 dark:border-green-900/30">
                  <Ionicons name="call" size={18} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Phone Number
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.phone || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center border border-gray-200 dark:border-gray-700">
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={isDark ? "#D1D5DB" : "#4B5563"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-0.5">
                    Applied Date
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {request.appliedAt?.toDate
                      ? request.appliedAt.toDate().toLocaleDateString()
                      : "Recently"}
                  </Text>
                </View>
              </View>
            </View>

            {/* --- DOCUMENTS SECTION --- */}
            <View className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Text className="text-gray-900 dark:text-white font-black text-lg mb-4">
                Verification Documents
              </Text>

              <TouchableOpacity
                onPress={() =>
                  request.idProofUrl
                    ? Linking.openURL(request.idProofUrl)
                    : Alert.alert("No File", "No document was uploaded.")
                }
                className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 active:scale-95"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-red-100 dark:bg-red-500/20 p-2.5 rounded-xl">
                    <Ionicons name="document-text" size={24} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      ID_Proof_Document.pdf
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                      Tap to view securely
                    </Text>
                  </View>
                </View>
                <Ionicons name="download-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-6" />
        </ScrollView>

        {/* --- ACTION FOOTER --- */}
        {request.status === "pending" && (
          <View className="p-6 bg-white dark:bg-[#09090B] border-t border-gray-100 dark:border-gray-900 flex-row gap-4 shadow-2xl dark:shadow-none">
            <TouchableOpacity
              disabled={processing}
              onPress={() => handleAction("rejected")}
              className="flex-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 h-14 rounded-2xl items-center justify-center active:scale-95"
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
              className="flex-1 bg-[#FF5A1F] h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95"
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Approve Partner
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
