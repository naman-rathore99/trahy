import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { email, password, fullName, mode } = params;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Only show password field after all 6 digits are entered
  const otpComplete = code.every((d) => d !== "");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Handle paste
    if (text.length === 6 && /^\d{6}$/.test(text)) {
      const newCode = text.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      Keyboard.dismiss();
      return;
    }

    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && digit) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = code.join("");
    if (enteredOtp.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const response = await fetch(
          "https://shubhyatra.world/api/auth/signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              name: fullName,
              role: "user",
              otp: enteredOtp,
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Signup Failed");
        await signInWithEmailAndPassword(
          auth,
          email as string,
          password as string,
        );
        Alert.alert("Success", "Account created!", [
          { text: "Start", onPress: () => router.replace("/(tabs)") },
        ]);
      } else if (mode === "reset") {
        if (!resetPasswordInput) {
          Alert.alert("Error", "Please enter your new password.");
          setLoading(false);
          return;
        }
        const response = await fetch(
          "https://shubhyatra.world/api/auth/reset-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              otp: enteredOtp,
              password: resetPasswordInput,
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Reset Failed");
        Alert.alert("Success", "Password updated!", [
          { text: "Login", onPress: () => router.replace("/auth/login") },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B] px-6">
      <StatusBar style="dark" />
      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-6 w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full justify-center items-center"
      >
        <Ionicons name="arrow-back" size={24} color="gray" />
      </TouchableOpacity>

      <View className="mt-8 items-center">
        <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="mail-open" size={40} color="#FF5A1F" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Verify Your Email
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-8">
          Enter the 6-digit code sent to {email}
        </Text>
      </View>

      {/* OTP Boxes */}
      <View className="flex-row justify-between mt-10 px-2">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            className={`w-12 h-14 border rounded-xl text-center text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 ${
              digit
                ? "border-[#FF5A1F]" // ✅ Filled — orange border
                : "border-gray-300 dark:border-gray-700" // Empty — gray border
            }`}
          />
        ))}
      </View>

      {/* ✅ New Password field — only shown after all 6 OTP digits are entered */}
      {mode === "reset" && otpComplete && (
        <View className="mt-8">
          <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">
            New Password
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex-row items-center px-4">
            <TextInput
              value={resetPasswordInput}
              onChangeText={setResetPasswordInput}
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-4 text-gray-900 dark:text-white"
            />
            {/* ✅ Show/hide password toggle */}
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="pl-2"
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={handleVerify}
        disabled={loading}
        className="bg-[#FF5A1F] h-14 rounded-2xl justify-center items-center mt-10 shadow-lg shadow-orange-500/20"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">
            {mode === "reset" ? "Reset Password" : "Verify & Sign Up"}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
