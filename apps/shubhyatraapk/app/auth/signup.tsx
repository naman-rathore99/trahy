import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- 📧 HANDLER: SEND OTP & GO TO OTP SCREEN ---
  const handleSignupNext = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Missing Fields", "Please fill in all fields to continue.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Using your deployed Web API
      const response = await fetch("https://shubhyatra.world/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send verification code.");

      // ✅ Redirect to OTP screen with all signup data
      router.push({
        pathname: "/auth/otp",
        params: { 
            email, 
            password, 
            fullName, 
            mode: "signup" 
        }
      });

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }} 
          className="px-8"
          showsVerticalScrollIndicator={false}
        >
          
          {/* HEADER & BACK BUTTON */}
          <View className="mt-6 mb-8">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full justify-center items-center mb-6"
            >
               <Ionicons name="arrow-back" size={24} color="#FF5A1F" />
            </TouchableOpacity>
            <Text className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                Create Account
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Enter your details to verify your identity.
            </Text>
          </View>

          {/* SIGNUP FORM */}
          <View className="space-y-5">
            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Full Name</Text>
              <View className="bg-gray-50 dark:bg-[#16161E] border border-gray-100 dark:border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput 
                  value={fullName} 
                  onChangeText={setFullName} 
                  className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold" 
                  placeholder="e.g. Naman Rathore" 
                  placeholderTextColor="#6B7280" 
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Email</Text>
              <View className="bg-gray-50 dark:bg-[#16161E] border border-gray-100 dark:border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput 
                  value={email} 
                  onChangeText={setEmail} 
                  className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold" 
                  placeholder="hello@shubhyatra.world" 
                  placeholderTextColor="#6B7280" 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Password</Text>
              <View className="bg-gray-50 dark:bg-[#16161E] border border-gray-100 dark:border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword} 
                  className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold" 
                  placeholder="Minimum 6 characters" 
                  placeholderTextColor="#6B7280" 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleSignupNext} 
              disabled={loading} 
              className="bg-[#FF5A1F] h-16 rounded-2xl justify-center items-center mt-4 shadow-xl shadow-orange-500/40"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* --- 🚀 JOIN AS PARTNER BUTTON --- */}
          <View className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
            <Text className="text-center text-gray-500 dark:text-gray-400 mb-4 font-medium">
                Are you a service provider?
            </Text>
            
            <TouchableOpacity 
             onPress={() => {
              console.log("Navigating to Partner Join..."); // ✅ Add this to debug
              router.push("/partner/join"); 
            }}
              className="flex-row items-center justify-center py-5 bg-gray-900 dark:bg-gray-800 rounded-2xl border border-gray-800 shadow-md active:scale-95"
            >
              <Ionicons name="business" size={20} color="#FF5A1F" />
              <Text className="text-white font-bold ml-3 text-base">Join as a Partner</Text>
            </TouchableOpacity>
            
            <Text className="text-center text-gray-400 text-[10px] mt-4 px-6 italic">
              List your hotel or travel fleet in Mathura & Vrindavan and start your digital journey.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}