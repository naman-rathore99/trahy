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

// 🚨 Check this path! If your file is app/admin/request-details.tsx, it should be "../../config/firebase"
import { db } from "../../../config/firebase";

export default function AdminRequestDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 🚨 SAFE ID PARSING: Handles undefined or array params from Expo Router
  const safeId = Array.isArray(id) ? id[0] : id;

  // --- 🔄 FETCH DATA ---
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!safeId) return;
      try {
        const docRef = doc(db, "join_requests", safeId);
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
  }, [safeId]);

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
              await updateDoc(doc(db, "join_requests", safeId as string), {
                status,
              });

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
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-700 dark:text-green-400",
          border: "border-green-200 dark:border-green-800/50",
        };
      case "rejected":
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-800/50",
        };
      default:
        return {
          bg: "bg-orange-100 dark:bg-orange-900/30",
          text: "text-orange-700 dark:text-orange-400",
          border: "border-orange-200 dark:border-orange-800/50",
        };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#09090B] justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  // 🚨 FIX: Never return null in Expo Router. Return an empty View instead to prevent Splash Screen freezing.
  if (!request) {
    return <View className="flex-1 bg-gray-50 dark:bg-[#09090B]" />;
  }

  const businessName =
    request.businessName || request.name || "Unknown Business";
  const badge = getStatusBadge(request.status);
  const displayId = safeId ? safeId.slice(0, 8).toUpperCase() : "LOADING";

  // Array to map out the details cleanly
  const DETAILS = [
    {
      icon: "person",
      color: "#3B82F6",
      label: "Owner Name",
      value: request.ownerName || "N/A",
    },
    {
      icon: "mail",
      color: "#F97316",
      label: "Email Address",
      value: request.email || "N/A",
    },
    {
      icon: "call",
      color: "#10B981",
      label: "Phone Number",
      value: request.phone || "N/A",
    },
    {
      icon: "calendar",
      color: "#6366F1",
      label: "Applied Date",
      value: request.appliedAt?.toDate
        ? request.appliedAt.toDate().toLocaleDateString()
        : "Just now",
    },
  ];

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
              App ID: {displayId}...
            </Text>
            <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
              Review Application
            </Text>
          </View>
        </View>

        <ScrollView
          className="px-6 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* --- HERO CARD --- */}
          <View className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[32px] p-6 mb-8 shadow-sm items-center">
            <View className="w-20 h-20 bg-orange-50 dark:bg-[#FF5A1F]/10 rounded-full items-center justify-center mb-4 border border-orange-100 dark:border-[#FF5A1F]/20">
              <Text className="text-3xl font-black text-[#FF5A1F]">
                {businessName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              className="text-gray-900 dark:text-white text-2xl font-black tracking-tight mb-3 text-center"
              numberOfLines={2}
            >
              {businessName}
            </Text>
            <View
              className={`px-4 py-1.5 rounded-xl border ${badge.bg} ${badge.border}`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${badge.text}`}
              >
                {request.status || "PENDING"}
              </Text>
            </View>
          </View>

          {/* --- DETAILS LIST --- */}
          <Text className="text-gray-900 dark:text-white font-black text-xl mb-4 ml-2 tracking-tight">
            Applicant Details
          </Text>
          <View className="bg-white dark:bg-[#111827] rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
            {DETAILS.map((detail, index) => (
              <View
                key={index}
                className={`flex-row items-center justify-between p-4 ${
                  index !== DETAILS.length - 1
                    ? "border-b border-gray-50 dark:border-gray-800/50"
                    : ""
                }`}
              >
                <View className="flex-row items-center gap-4 flex-1 pr-4">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: isDark
                        ? `${detail.color}15`
                        : `${detail.color}10`,
                    }}
                  >
                    <Ionicons
                      name={detail.icon as any}
                      size={20}
                      color={detail.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                      {detail.label}
                    </Text>
                    <Text
                      className="text-gray-900 dark:text-white font-bold text-base"
                      numberOfLines={1}
                    >
                      {detail.value}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* --- DOCUMENTS SECTION --- */}
          <Text className="text-gray-900 dark:text-white font-black text-xl mb-4 ml-2 tracking-tight">
            Verification File
          </Text>
          <TouchableOpacity
            onPress={() =>
              request.idProofUrl
                ? Linking.openURL(request.idProofUrl)
                : Alert.alert("No File", "No document was uploaded.")
            }
            className="flex-row items-center justify-between bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[28px] p-4 shadow-sm active:scale-95"
          >
            <View className="flex-row items-center gap-4">
              <View className="bg-red-50 dark:bg-red-900/20 w-14 h-14 rounded-2xl items-center justify-center border border-red-100 dark:border-red-900/30">
                <Ionicons name="document-text" size={24} color="#EF4444" />
              </View>
              <View>
                <Text className="text-gray-900 dark:text-white font-bold text-base">
                  ID_Proof_Document
                </Text>
                <Text className="text-gray-500 text-xs font-medium mt-0.5">
                  Tap to view securely
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-2">
              <Ionicons
                name="download-outline"
                size={18}
                color={isDark ? "white" : "gray"}
              />
            </View>
          </TouchableOpacity>
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
              className="flex-[1.5] bg-[#FF5A1F] h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95"
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
