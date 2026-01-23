import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { syncUserWithBackend } from "../../service/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please enter email and password");
    setLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await syncUserWithBackend({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "User",
      });

      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Login Failed", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 pt-10 pb-6">
            <View className="w-16 h-16 bg-orange-50 rounded-2xl items-center justify-center mb-6 border border-orange-100 shadow-sm">
              <Feather name="map-pin" size={32} color="#FF5A1F" />
            </View>
            <Text className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </Text>
            <Text className="text-gray-500 text-lg mt-2 leading-6">
              Sign in to manage your bookings.
            </Text>
          </View>

          <View className="px-8 space-y-5">
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Email
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#FF5A1F]">
                <Feather name="mail" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-gray-900 font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Password
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Feather name="lock" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-gray-900 font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full py-4 rounded-2xl shadow-xl shadow-orange-500/20 mt-2 flex-row justify-center items-center ${loading ? "bg-gray-400" : "bg-[#FF5A1F]"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="px-8 flex-row justify-center mt-8 mb-10">
            <Text className="text-gray-500 font-medium">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text className="text-[#FF5A1F] font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ✅ ADDED BACK: Sticky Bottom "Join as Partner" Button */}
        <View className="bg-gray-50 p-4 border-t border-gray-200 items-center">
          <TouchableOpacity
            onPress={() => router.push("/partner/apply")}
            className="flex-row items-center space-x-2 opacity-80"
          >
            <Text className="text-gray-600 font-medium text-xs">
              Own a hotel or vehicle?
            </Text>
            <Text className="text-gray-900 font-bold text-xs underline">
              Join as Partner
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
