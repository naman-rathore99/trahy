import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
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
import { auth } from "../../config/firebase";

export default function PartnerWallet() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    pendingSettlement: 0,
    bonus: 0,
  });
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    upiId: "",
  });

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
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
      if (!currentUser) return;
      const token = await currentUser.getIdToken(true);
      const res = await api.get("/api/partner/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.stats || {});
      setBankDetails(res.data.bankDetails || null);
    } catch (e: any) {
      console.error("Wallet fetch error:", e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleSaveBankDetails = async () => {
    if (
      !form.accountName ||
      !form.accountNumber ||
      !form.ifsc ||
      !form.bankName
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      await api.post("/api/partner/wallet", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("✅ Saved", "Bank details saved successfully.");
      setShowBankForm(false);
      fetchWallet();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "Failed to save bank details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = () => {
    if (!bankDetails) {
      Alert.alert("No Bank Details", "Please add your bank details first.");
      return;
    }
    Alert.alert(
      "Withdraw Request",
      `Your payout of ₹${stats.pendingSettlement.toLocaleString("en-IN")} will be processed to ${bankDetails.bankName} within 24 hours.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            Alert.alert("Initiated", "Withdrawal request submitted!"),
        },
      ],
    );
  };

  if (loading)
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#09090B] items-center justify-center">
        <ActivityIndicator color="#FF5A1F" size="large" />
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            My Wallet
          </Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View className="bg-[#FF5A1F] p-6 rounded-3xl mb-6 shadow-lg overflow-hidden relative">
            <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <View className="absolute top-20 -left-10 w-20 h-20 bg-white/10 rounded-full" />
            <Text className="text-white/80 font-medium mb-1">
              Total Earnings
            </Text>
            <Text className="text-white text-4xl font-bold mb-1">
              ₹{stats.totalEarnings.toLocaleString("en-IN")}
            </Text>
            <Text className="text-white/70 text-xs mb-6">
              {stats.totalBookings} confirmed bookings
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handleWithdraw}
                className="flex-1 bg-white py-3 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
              >
                <Ionicons name="cash-outline" size={18} color="#FF5A1F" />
                <Text className="text-[#FF5A1F] font-bold">Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowBankForm(!showBankForm)}
                className="flex-1 bg-black/20 py-3 rounded-xl items-center border border-white/30 flex-row justify-center gap-2"
              >
                <Ionicons name="card-outline" size={18} color="white" />
                <Text className="text-white font-bold">
                  {bankDetails ? "Bank Info" : "Add Bank"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Text className="text-gray-500 text-xs mb-1">
                Pending Settlement
              </Text>
              <Text className="text-orange-500 font-black text-lg">
                ₹{stats.pendingSettlement.toLocaleString("en-IN")}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Text className="text-gray-500 text-xs mb-1">Bonus</Text>
              <Text className="text-green-600 font-black text-lg">
                ₹{(stats.bonus || 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Bank Details */}
          {bankDetails && !showBankForm && (
            <View className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="font-bold text-gray-900 dark:text-white text-lg">
                  Bank Account
                </Text>
                <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                  <Text className="text-green-700 dark:text-green-400 text-xs font-bold">
                    Locked 🔒
                  </Text>
                </View>
              </View>
              {[
                { label: "Account Name", value: bankDetails.accountName },
                {
                  label: "Account Number",
                  value: `••••${bankDetails.accountNumber?.slice(-4)}`,
                },
                { label: "IFSC Code", value: bankDetails.ifsc },
                { label: "Bank", value: bankDetails.bankName },
                { label: "UPI ID", value: bankDetails.upiId || "Not added" },
              ].map(({ label, value }) => (
                <View
                  key={label}
                  className="flex-row justify-between py-2 border-b border-gray-50 dark:border-gray-800"
                >
                  <Text className="text-gray-500 text-sm">{label}</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm">
                    {value}
                  </Text>
                </View>
              ))}
              <Text className="text-gray-400 text-xs mt-3 text-center">
                Contact support to update bank details
              </Text>
            </View>
          )}

          {/* Bank Form */}
          {(!bankDetails || showBankForm) && (
            <View className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
              <Text className="font-bold text-gray-900 dark:text-white text-lg mb-4">
                {bankDetails ? "Bank Details (Locked)" : "Add Bank Details"}
              </Text>
              {bankDetails ? (
                <Text className="text-gray-500 text-sm text-center py-4">
                  Bank details are locked. Contact support to change.
                </Text>
              ) : (
                <>
                  {[
                    {
                      key: "accountName",
                      placeholder: "Account Holder Name *",
                    },
                    {
                      key: "accountNumber",
                      placeholder: "Account Number *",
                      keyboardType: "numeric" as any,
                    },
                    { key: "ifsc", placeholder: "IFSC Code *" },
                    { key: "bankName", placeholder: "Bank Name *" },
                    { key: "upiId", placeholder: "UPI ID (Optional)" },
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
                  <TouchableOpacity
                    onPress={handleSaveBankDetails}
                    disabled={saving}
                    className={`py-4 rounded-xl items-center ${saving ? "bg-orange-300" : "bg-[#FF5A1F]"}`}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        Save Bank Details
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text className="text-gray-400 text-xs text-center mt-3">
                    ⚠️ Bank details cannot be changed once saved.
                  </Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
