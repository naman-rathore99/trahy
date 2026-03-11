import {
  RecaptchaModal,
  RecaptchaModalHandle,
} from "@/components/RecaptchaModal";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const recaptchaVerifier = useRef<RecaptchaModalHandle>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW: Password Toggle State

  // Input States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [phoneStep, setPhoneStep] = useState<"INPUT" | "OTP">("INPUT");

  // Google Auth (Temp IDs)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "347936045558-dk127i6v56vst7mll3nph2m6q7o8019j.apps.googleusercontent.com",
    webClientId:
      "347936045558-1p0dnv26t02dihp9vptsc88o8n4m9nfe.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).then((res) =>
        checkUserRoleAndRedirect(res.user),
      );
    }
  }, [response]);

  const checkUserRoleAndRedirect = async (user: any) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email || "",
          role: "user",
          createdAt: serverTimestamp(),
        });
      }
      const role = userDoc.exists() ? userDoc.data().role : "user";
      router.replace(role === "admin" ? "/admin/dashboard" : "/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Redirect failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill all fields");
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await checkUserRoleAndRedirect(res.user);
    } catch (e) {
      Alert.alert("Login Failed", "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <RecaptchaModal
        ref={recaptchaVerifier}
        onVerify={() => {}}
        onCancel={() => setLoading(false)}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              justifyContent: "center",
            }}
          >
            {/* BRANDING */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 bg-[#FF5A1F] rounded-3xl items-center justify-center shadow-2xl shadow-orange-500/50 rotate-6">
                <Ionicons name="airplane" size={40} color="white" />
              </View>
              <Text className="text-4xl font-black mt-6 text-gray-900 dark:text-white tracking-tighter">
                Shubh Yatra
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 font-medium">
                Your journey begins here
              </Text>
            </View>

            <View className="space-y-4">
              {authMode === "EMAIL" ? (
                <>
                  {/* EMAIL INPUT */}
                  <View className="bg-gray-50 dark:bg-[#16161E] flex-row items-center px-3 py-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold"
                      autoCapitalize="none"
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  {/* PASSWORD INPUT WITH TOGGLE */}
                  <View className="bg-gray-50 dark:bg-[#16161E] flex-row items-center px-3 py-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <TextInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold"
                      placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* ✅ RESTORED: FORGOT PASSWORD */}
                  <TouchableOpacity
                    onPress={() => router.push("/auth/forgot-password")}
                    className="self-end mt-2 mb-2"
                  >
                    <Text className="text-[#FF5A1F] font-bold text-sm">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleEmailLogin}
                    disabled={loading}
                    className="bg-[#FF5A1F] py-5 rounded-2xl items-center shadow-lg shadow-orange-500/40"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        Sign In
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {phoneStep === "INPUT" ? (
                    <>
                      <View className="bg-gray-50 dark:bg-[#16161E] flex-row items-center px-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="#9CA3AF"
                        />
                        <TextInput
                          placeholder="+91 Phone Number"
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold"
                          placeholderTextColor="#6B7280"
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          /* your sendOTP handler */
                        }}
                        disabled={loading}
                        className="bg-[#FF5A1F] py-5 rounded-2xl items-center shadow-lg shadow-orange-500/40"
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-bold text-lg">
                            Send OTP
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        OTP sent to {phoneNumber}
                      </Text>
                      <View className="bg-gray-50 dark:bg-[#16161E] flex-row items-center px-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <Ionicons
                          name="key-outline"
                          size={20}
                          color="#9CA3AF"
                        />
                        <TextInput
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          className="flex-1 ml-3 text-gray-900 dark:text-white font-semibold"
                          placeholderTextColor="#6B7280"
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          /* your verifyOTP handler */
                        }}
                        disabled={loading}
                        className="bg-[#FF5A1F] py-5 rounded-2xl items-center shadow-lg shadow-orange-500/40"
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-bold text-lg">
                            Verify OTP
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setPhoneStep("INPUT")}
                        className="items-center"
                      >
                        <Text className="text-[#FF5A1F] font-bold text-sm">
                          Change Number
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
              {/* DIVIDER */}
              <View className="flex-row items-center gap-4 my-4">
                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 flex-1" />
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  social login
                </Text>
                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 flex-1" />
              </View>

              {/* GOOGLE BUTTON */}
              <TouchableOpacity
                onPress={() => promptAsync()}
                className="flex-row items-center justify-center py-4 bg-white dark:bg-[#16161E] border border-gray-200 dark:border-gray-800 rounded-2xl"
              >
                <AntDesign name="google" size={20} color="#DB4437" />
                <Text className="ml-3 font-bold text-gray-900 dark:text-white">
                  Sign in with Google
                </Text>
              </TouchableOpacity>

              {/* TOGGLE AUTH MODE */}
              <TouchableOpacity
                onPress={() =>
                  setAuthMode(authMode === "EMAIL" ? "PHONE" : "EMAIL")
                }
                className="items-center py-4"
              >
                <Text className="text-gray-500 dark:text-gray-400 font-medium">
                  Use {authMode === "EMAIL" ? "Phone Number" : "Email Address"}{" "}
                  instead
                </Text>
              </TouchableOpacity>
            </View>

            {/* SIGNUP FOOTER */}
            <View className="mt-8 flex-row justify-center pb-6">
              <Text className="text-gray-500">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                <Text className="text-[#FF5A1F] font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
