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
import { Feather } from "@expo/vector-icons";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { syncUserWithBackend } from "../../service/api";

// List of Cities for the Dropdown
const CITIES = [
  "Mathura",
  "Vrindavan",
  "Gokul",
  "Govardhan",
  "Barsana",
  "Nandgaon",
];

export default function SignUpScreen() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // ✅ Added Phone
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Mathura");

  // UI State
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🛡️ VALIDATION LOGIC
  const validateInputs = () => {
    // 1. Check Empty Fields
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !city) {
      Alert.alert("Missing Details", "Please fill in all fields.");
      return false;
    }

    // 2. Validate Email Format (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    // 3. Validate Phone Number (10 Digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit mobile number.",
      );
      return false;
    }

    // 4. Validate Password Strength
    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long.",
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    // Run Validation First
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const auth = getAuth();

      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Update Display Name locally
      await updateProfile(user, { displayName: name });

      // 3. ✅ SYNC WITH BACKEND (Now sending Phone & City)
      await syncUserWithBackend({
        uid: user.uid,
        email: user.email || "",
        displayName: name,
        phone: phone, // Saving Phone
        city: city, // Saving City
      });

      // 4. Success -> Go Home
      router.replace("/(tabs)/home");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/email-already-in-use")
        msg = "That email is already registered.";
      Alert.alert("Registration Failed", msg);
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
          {/* Header */}
          <View className="px-8 pt-6 pb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mb-6 border border-gray-100"
            >
              <Feather name="arrow-left" size={22} color="black" />
            </TouchableOpacity>
            <Text className="text-3xl font-extrabold text-gray-900">
              Create Account
            </Text>
            <Text className="text-gray-500 text-lg mt-2">
              Start your journey with us.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="px-8 space-y-5">
            {/* Name Input */}
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Full Name
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Feather name="user" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 ml-3 text-gray-900 font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Email Address
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Feather name="mail" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 ml-3 text-gray-900 font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* ✅ NEW: Phone Input */}
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Mobile Number
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Feather name="phone" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10} // Limits typing to 10 chars
                  className="flex-1 ml-3 text-gray-900 font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Location / City Picker */}
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Preferred Location
              </Text>
              <TouchableOpacity
                onPress={() => setShowCityPicker(!showCityPicker)}
                className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 justify-between"
              >
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={20} color="#FF5A1F" />
                  <Text className="ml-3 text-gray-900 font-medium text-base">
                    {city}
                  </Text>
                </View>
                <Feather name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {showCityPicker && (
                <View className="bg-white border border-gray-200 rounded-2xl mt-1 overflow-hidden shadow-lg z-50">
                  {CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setCity(c);
                        setShowCityPicker(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100 bg-gray-50 active:bg-orange-50"
                    >
                      <Text
                        className={`text-base ${city === c ? "text-[#FF5A1F] font-bold" : "text-gray-700"}`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Password Input */}
            <View className="space-y-2">
              <Text className="text-gray-900 font-bold ml-1 text-sm">
                Password
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Feather name="lock" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Create a password"
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

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className={`w-full py-4 rounded-2xl shadow-xl shadow-orange-500/20 mt-4 items-center justify-center ${loading ? "bg-gray-400" : "bg-[#FF5A1F]"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="px-8 flex-row justify-center mt-8 mb-24">
            <Text className="text-gray-500 font-medium">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text className="text-[#FF5A1F] font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Partner Sign Up Link */}
          <View className="absolute bottom-10 left-0 right-0 items-center z-10">
            <TouchableOpacity
              onPress={() => router.push("/partner/apply")}
              className="flex-row items-center bg-gray-900 px-5 py-3 rounded-full shadow-lg"
            >
              <Feather name="briefcase" size={16} color="white" />
              <Text className="text-white font-bold ml-2 text-sm">
                Sign up as a Partner
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
