import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
        Alert.alert("Error", "Please enter your email address.");
        return;
    }
    setLoading(true);

    try {
        // CALL YOUR DEPLOYED WEB API
        const response = await fetch("https://shubhyatra.world/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to send code");

        // Navigate to OTP Screen (Reset Mode)
        router.push({
            pathname: "/auth/otp",
            params: { email, mode: "reset" }
        });

    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B] px-6">
      <StatusBar style="dark" />
      <TouchableOpacity onPress={() => router.back()} className="mt-6 w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full justify-center items-center">
         <Ionicons name="arrow-back" size={24} color="gray" />
      </TouchableOpacity>

      <View className="mt-8 mb-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password?</Text>
        <Text className="text-gray-500 mt-2">Enter your email to receive a verification code.</Text>
      </View>

      <View>
          <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Email Address</Text>
          <TextInput 
              value={email} onChangeText={setEmail}
              placeholder="hello@example.com" placeholderTextColor="#9CA3AF"
              keyboardType="email-address" autoCapitalize="none"
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl text-gray-900 dark:text-white"
          />
      </View>

      <TouchableOpacity onPress={handleSendCode} disabled={loading} className="bg-[#FF5A1F] h-14 rounded-2xl justify-center items-center mt-8 shadow-lg shadow-orange-500/20">
         {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Send Code</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}