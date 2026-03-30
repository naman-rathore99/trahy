import { auth } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaView } from "react-native-safe-area-context";

// 🚨 1. IMPORT YOUR AXIOS INSTANCE
import api from "@/utils/api";

const { width, height } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://shubhyatra.world";

// ─── Confetti Particle ────────────────────────────────────────────────────────
function ConfettiParticle({
  delay,
  color,
  startX,
}: {
  delay: number;
  color: string;
  startX: number;
}) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height * 0.7,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${Math.random() > 0.5 ? 720 : -720}deg`],
  });
  const size = 6 + Math.random() * 8;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: startX,
        width: size,
        height: size * (Math.random() > 0.5 ? 1 : 2.5),
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? size : 1,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    />
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────
function SuccessOverlay({
  bookingName,
  amount,
  onDone,
}: {
  bookingName: string;
  amount: number;
  onDone: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const CONFETTI_COLORS = [
    "#FF5A1F",
    "#10B981",
    "#6366F1",
    "#F59E0B",
    "#EC4899",
    "#3B82F6",
    "#8B5CF6",
  ];
  const confettiItems = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 600,
    startX: Math.random() * width,
  }));

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.85)",
        alignItems: "center",
        justifyContent: "center",
        opacity: bgOpacity,
      }}
    >
      {confettiItems.map((c) => (
        <ConfettiParticle
          key={c.id}
          delay={c.delay}
          color={c.color}
          startX={c.startX}
        />
      ))}
      <Animated.View
        style={{
          backgroundColor: "white",
          borderRadius: 32,
          padding: 36,
          alignItems: "center",
          width: width * 0.85,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 30,
          elevation: 20,
          transform: [{ scale }],
        }}
      >
        <Animated.View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#DCFCE7",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#10B981",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#111827",
              marginBottom: 6,
            }}
          >
            Booking Confirmed! 🎉
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            Your stay at{"\n"}
            <Text style={{ fontWeight: "700", color: "#111827" }}>
              {bookingName}
            </Text>
            {"\n"}is all set
          </Text>
          <View
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: 100,
              paddingHorizontal: 20,
              paddingVertical: 10,
              marginBottom: 28,
              borderWidth: 1,
              borderColor: "#BBF7D0",
            }}
          >
            <Text style={{ color: "#15803D", fontWeight: "800", fontSize: 18 }}>
              ₹{amount.toLocaleString("en-IN")} Paid
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDone}
            style={{
              backgroundColor: "#111827",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 40,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              View My Trips
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const partnerId = (params.partnerId as string) || "UNKNOWN";
  const listingName = (params.listingName as string) || "Hotel Stay";
  const listingId = (params.listingId as string) || "";

  // 🚨 Catching all the new Price Breakdown Context
  const totalAmount = Number(params.totalAmount) || 0;
  const roomTotal = Number(params.roomTotal) || totalAmount;
  const checkIn = (params.checkIn as string) || "";
  const checkOut = (params.checkOut as string) || "";
  const guests = Number(params.guests) || 2;

  // Extra Params (Cabs, Delay Protection, Rentals)
  const needCab = params.needCab === "true";
  const cabPickup = (params.cabPickup as string) || "";
  const cabPrice = Number(params.cabPrice) || 0;
  const delayProtection = params.delayProtection === "true";
  const delayPrice = Number(params.delayPrice) || 0;
  const vehicleId = (params.vehicleId as string) || "";
  const vehiclePrice = Number(params.vehiclePrice) || 0;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 🚨 REWRITTEN CHECKOUT LOGIC USING AXIOS
  const handleCheckout = async () => {
    if (!name || !phone || !email) {
      Alert.alert("Missing Details", "Please fill in all contact details.");
      return;
    }

    setLoading(true);

    try {
      const currentUser = await new Promise<any>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to book.");
        setLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken(true);

      // STEP 1: CREATE BOOKING (Includes Extras Payload!)
      const createRes = await api.post(
        "/api/bookings/create",
        {
          partnerId,
          listingId,
          listingName,
          checkIn,
          checkOut,
          guests,
          totalAmount,
          serviceType: "hotel_stay",
          customer: { name, email, phone, userId: currentUser.uid },
          paymentMethod: "online",
          status: "pending_payment",
          // Travel Extras Payload - backend will save this!
          extras: {
            needCab,
            cabPickup,
            cabPrice,
            delayProtection,
            delayPrice,
            vehicleId,
            vehiclePrice,
          },
        },
        { headers: { Authorization: `Bearer ${idToken}` } },
      );

      const createData = createRes.data;
      if (!createData.success || !createData.bookingId) {
        throw new Error(createData.error || "Failed to create booking.");
      }

      const generatedBookingId = createData.bookingId;

      // STEP 2: INITIATE RAZORPAY PAYMENT
      const paymentRes = await api.post(
        "/api/payment/initiate",
        { bookingId: generatedBookingId, source: "mobile" },
        { headers: { Authorization: `Bearer ${idToken}` } },
      );

      const paymentData = paymentRes.data;

      // Configure Razorpay modal
      const options = {
        description: `Booking for ${listingName}`,
        image: `${API_URL}/logo.png`, // Optional: Add your logo URL here
        currency: paymentData.currency || "INR",
        key: paymentData.keyId,
        amount: paymentData.amount,
        name: "Shubh Yatra",
        order_id: paymentData.orderId,
        theme: { color: "#FF5A1F" },
        prefill: { email, contact: phone, name },
      };

      // STEP 3: OPEN RAZORPAY & HANDLE CALLBACK
      RazorpayCheckout.open(options)
        .then(async (razorpayData: any) => {
          try {
            await api.post("/api/payment/callback", {
              razorpay_order_id: razorpayData.razorpay_order_id,
              razorpay_payment_id: razorpayData.razorpay_payment_id,
              razorpay_signature: razorpayData.razorpay_signature,
              bookingId: generatedBookingId,
            });

            setLoading(false);
            setShowSuccess(true);
          } catch (e) {
            console.error("Failed to verify payment with backend", e);
            setLoading(false);
            Alert.alert(
              "Verification Error",
              "Payment received, but there was an issue verifying your booking.",
            );
          }
        })
        .catch(async (error: any) => {
          try {
            await api.post("/api/payment/callback", {
              bookingId: generatedBookingId,
              status: "failed",
            });
          } catch (e) {
            console.error("Failed to ping backend about cancellation", e);
          }

          setLoading(false);
          Alert.alert(
            "Payment Cancelled",
            "Your transaction was not completed.",
          );
        });
    } catch (error: any) {
      console.error(
        "Checkout Error Log:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Checkout Error",
        error.response?.data?.error ||
          error.message ||
          "Could not connect to payment gateway.",
      );
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            Secure Checkout
          </Text>
        </View>

        <View className="flex-1">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Booking Summary with Breakdowns */}
            <View className="bg-white dark:bg-[#111827] m-6 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                Booking Summary
              </Text>
              <Text className="text-gray-900 dark:text-white text-xl font-black mb-3">
                {listingName}
              </Text>

              <View className="flex-row gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={14} color="#FF5A1F" />
                  <Text className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                    {checkIn} to {checkOut}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="person-outline" size={14} color="#FF5A1F" />
                  <Text className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                    {guests} Guests
                  </Text>
                </View>
              </View>

              {/* 🚨 THE PRICE BREAKDOWN 🚨 */}
              <View className="space-y-3 mb-4">
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm">Room Total</Text>
                  <Text className="text-gray-900 dark:text-white font-medium">
                    ₹{roomTotal}
                  </Text>
                </View>
                {needCab && (
                  <View className="flex-row justify-between">
                    <Text className="text-[#FF5A1F] text-sm">
                      Station Transfer
                    </Text>
                    <Text className="text-[#FF5A1F] font-medium">
                      +₹{cabPrice}
                    </Text>
                  </View>
                )}
                {delayProtection && (
                  <View className="flex-row justify-between">
                    <Text className="text-amber-500 text-sm">
                      Delay Protection
                    </Text>
                    <Text className="text-amber-500 font-medium">
                      +₹{delayPrice}
                    </Text>
                  </View>
                )}
                {vehicleId && (
                  <View className="flex-row justify-between">
                    <Text className="text-emerald-500 text-sm">
                      Vehicle Rental
                    </Text>
                    <Text className="text-emerald-500 font-medium">
                      +₹{vehiclePrice}
                    </Text>
                  </View>
                )}
              </View>

              <View className="border-t border-gray-100 dark:border-gray-800 pt-4 flex-row justify-between items-center">
                <Text className="text-gray-600 dark:text-gray-400 font-medium">
                  Total Amount
                </Text>
                <Text className="text-[#FF5A1F] text-2xl font-black">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            {/* Guest Details */}
            <View className="px-6 mb-8 gap-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">
                Guest Details
              </Text>
              {[
                {
                  icon: "person-outline",
                  placeholder: "Full Name",
                  value: name,
                  onChangeText: setName,
                  keyboardType: "default",
                  autoCapitalize: "words",
                },
                {
                  icon: "call-outline",
                  placeholder: "Phone Number",
                  value: phone,
                  onChangeText: (t: string) =>
                    setPhone(t.replace(/\D/g, "").slice(0, 10)),
                  keyboardType: "phone-pad",
                  autoCapitalize: "none",
                },
                {
                  icon: "mail-outline",
                  placeholder: "Email Address",
                  value: email,
                  onChangeText: setEmail,
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                },
              ].map(
                ({
                  icon,
                  placeholder,
                  value,
                  onChangeText,
                  keyboardType,
                  autoCapitalize,
                }) => (
                  <View
                    key={placeholder}
                    className="bg-white dark:bg-[#111827] flex-row items-center px-4 h-14 rounded-2xl border border-gray-200 dark:border-gray-800"
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <TextInput
                      placeholder={placeholder}
                      placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                      value={value}
                      onChangeText={onChangeText}
                      keyboardType={keyboardType as any}
                      autoCapitalize={autoCapitalize as any}
                      className="flex-1 ml-3 text-gray-900 dark:text-white"
                    />
                  </View>
                ),
              )}
            </View>

            <View className="px-6 mb-6 items-center justify-center flex-row gap-2">
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Payments are 100% secured by Razorpay
              </Text>
            </View>
          </ScrollView>

          {/* Pay Button */}
          <View className="p-6 bg-white dark:bg-[#09090B] border-t border-gray-100 dark:border-gray-900 shadow-2xl">
            <TouchableOpacity
              disabled={loading}
              onPress={handleCheckout}
              className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-2 ${loading ? "bg-[#FF5A1F]/50" : "bg-[#FF5A1F] active:scale-95"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="lock-closed" size={18} color="white" />
                  <Text className="text-white font-bold text-lg">
                    Pay ₹{totalAmount.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Animated Success Overlay */}
      {showSuccess && (
        <SuccessOverlay
          bookingName={listingName}
          amount={totalAmount}
          onDone={() => router.replace("/(tabs)" as any)}
        />
      )}
    </View>
  );
}
