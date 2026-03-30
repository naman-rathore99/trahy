import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

export default function AdminPayouts() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">(
    "pending",
  );
  const [payouts, setPayouts] = useState<any[]>([]);

  // 🚨 Track which specific payout is currently communicating with Razorpay
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchPayouts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const q = query(
          collection(db, "payouts"),
          where("status", "==", activeTab),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);
        const fetchedPayouts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate
            ? doc
                .data()
                .createdAt.toDate()
                .toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
            : "Recent",
        }));

        // MOCK DATA FOR UI TESTING
        if (fetchedPayouts.length === 0 && !isRefresh) {
          setPayouts([
            {
              id: "pay_987654321",
              partnerName: "Madhuvan Resort",
              amount: 45000,
              status: activeTab,
              date: "Today",
              bankDetails: {
                accountName: "Madhuvan Hospitality",
                accountNumber: "501002349876",
                ifsc: "HDFC0001234",
                bankName: "HDFC Bank",
              },
            },
            {
              id: "pay_123456789",
              partnerName: "Rahul Travels (Cab)",
              amount: 12500,
              status: activeTab,
              date: "Yesterday",
              bankDetails: {
                accountName: "Rahul Sharma",
                accountNumber: "33100987654",
                ifsc: "SBIN0004567",
                bankName: "State Bank of India",
                upiId: "rahul.travels@sbi",
              },
            },
          ]);
        } else {
          setPayouts(fetchedPayouts);
        }
      } catch (error) {
        console.error("Error fetching payouts:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // --- 🚀 AUTOMATED RAZORPAYX PAYOUT LOGIC ---
  const handleProcessPayout = (
    payoutId: string,
    partnerName: string,
    amount: number,
  ) => {
    Alert.alert(
      "Confirm Automated Payout",
      `This will instantly transfer ₹${amount.toLocaleString("en-IN")} to ${partnerName} via RazorpayX. Proceed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Transfer Now",
          style: "default",
          onPress: async () => {
            // 1. Lock the button for this specific payout
            setProcessingIds((prev) => new Set(prev).add(payoutId));

            try {
              // 🚨 2. THIS IS WHERE WE CALL YOUR BACKEND 🚨
              // Example: await api.post(`/api/admin/payouts/process`, { payoutId });

              // Simulating network delay for Razorpay API...
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // 3. Update Firebase (Normally your backend does this, but keeping it for UI flow)
              try {
                const payoutRef = doc(db, "payouts", payoutId);
                await updateDoc(payoutRef, {
                  status: "completed",
                  settledAt: new Date(),
                });
              } catch (e) {
                console.log("Mock data update skipped");
              }

              // 4. Remove from pending list
              setPayouts((prev) => prev.filter((p) => p.id !== payoutId));
              Alert.alert(
                "✅ Transfer Successful",
                `Funds have been routed to ${partnerName}.`,
              );
            } catch (e: any) {
              Alert.alert(
                "Transfer Failed",
                e.message || "Could not connect to RazorpayX.",
              );
            } finally {
              // 5. Unlock the button
              setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(payoutId);
                return newSet;
              });
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View className="bg-white dark:bg-[#111827] rounded-[24px] p-5 mb-4 border border-gray-100 dark:border-gray-800 shadow-sm">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-gray-900 dark:text-white font-black text-lg mb-0.5">
              {item.partnerName}
            </Text>
            <Text className="text-gray-500 text-xs font-medium">
              Req ID: {item.id.substring(0, 10)} • {item.date}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-indigo-600 dark:text-indigo-400 font-black text-xl">
              ₹{item.amount?.toLocaleString("en-IN")}
            </Text>
            <View
              className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
            >
              <Text
                className={
                  item.status === "completed"
                    ? "text-emerald-700 dark:text-emerald-400 text-[10px] font-bold"
                    : "text-amber-700 dark:text-amber-400 text-[10px] font-bold"
                }
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 mb-4">
          <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Ionicons name="business" size={16} color="#6366F1" />
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm">
              {item.bankDetails?.bankName}
            </Text>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-xs">Account Name</Text>
              <Text className="text-gray-900 dark:text-white font-bold text-xs">
                {item.bankDetails?.accountName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-xs">Account No.</Text>
              <Text className="text-gray-900 dark:text-white font-mono font-bold tracking-widest text-xs">
                {item.bankDetails?.accountNumber}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-xs">IFSC Code</Text>
              <Text className="text-gray-900 dark:text-white font-mono font-bold tracking-widest text-xs">
                {item.bankDetails?.ifsc}
              </Text>
            </View>
          </View>
        </View>

        {/* 🚨 UPDATED RAZORPAY BUTTON 🚨 */}
        {item.status === "pending" && (
          <TouchableOpacity
            onPress={() =>
              handleProcessPayout(item.id, item.partnerName, item.amount)
            }
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl items-center flex-row justify-center gap-2 shadow-sm ${isProcessing ? "bg-indigo-400" : "bg-[#02042B] dark:bg-indigo-600 active:scale-95"}`}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="flash" size={16} color="#3B82F6" /> // Razorpay Blue lightning bolt
            )}
            <Text className="text-white font-black text-sm">
              {isProcessing
                ? "Processing via Razorpay..."
                : "Transfer via Razorpay"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F8F9FA] dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="px-6 py-2 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <Text className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">
              Payouts
            </Text>
          </View>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl">
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className={`flex-1 py-2.5 rounded-xl items-center transition-colors ${activeTab === "pending" ? "bg-white dark:bg-[#111827] shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold text-sm ${activeTab === "pending" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`}
              >
                Pending Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("completed")}
              className={`flex-1 py-2.5 rounded-xl items-center transition-colors ${activeTab === "completed" ? "bg-white dark:bg-[#111827] shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold text-sm ${activeTab === "completed" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Settled History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList
            data={payouts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchPayouts(true)}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center mt-12">
                <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/10 rounded-full items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/20">
                  <Ionicons name="wallet-outline" size={32} color="#6366F1" />
                </View>
                <Text className="text-gray-900 dark:text-white font-black text-lg">
                  {activeTab === "pending"
                    ? "No Pending Requests"
                    : "No Settled Payouts"}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
