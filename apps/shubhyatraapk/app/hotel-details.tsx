import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Import the Review Component
import HotelReviews from "@/components/HotelReviews";

const VEHICLE_OPTIONS = [
  { id: "bike", label: "2-Wheeler", icon: "bicycle", price: 400 },
  { id: "auto", label: "Auto", icon: "flash", price: 800 },
  { id: "car", label: "Cab", icon: "car", price: 2000 },
];

export default function HotelDetails() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isFavorite, setIsFavorite] = useState(false);

  // Core Booking State (Mock dates for now, normally from a date picker)
  const nights = 2;
  const guests = 2;
  const checkIn = "2026-03-10";
  const checkOut = "2026-03-12";
  const [arrivalTime, setArrivalTime] = useState("14:00");

  // Travel Extras State
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [platformPricing, setPlatformPricing] = useState({
    transferBase: 250,
    transferPerKm: 20,
  });
  const [needTransfer, setNeedTransfer] = useState(false);
  const [transferPickup, setTransferPickup] = useState("");
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [calculatedTransferFare, setCalculatedTransferFare] = useState(0);
  const [delayProtection, setDelayProtection] = useState(false);
  const WAITING_FEE_PRICE = 200;

  // Mock Data
  const hotel = {
    id: "5zDWuUa76DNxfAO2L7AT",
    name: "Nidhivan Sarovar",
    location: "Vrindavan, Mathura",
    rating: 4.8,
    reviews: 128,
    pricePerNight: 4500,
    description:
      "Experience luxury in the heart of Vrindavan. Walking distance from Prem Mandir and Banke Bihari Temple.",
    amenities: ["Free WiFi", "AC", "Restaurant", "Parking", "Spa", "Pool"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=500",
    ],
  };

  // Fetch Pricing for Invisible Calculator
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const pricingSnap = await getDoc(doc(db, "settings", "pricing"));
        if (pricingSnap.exists()) {
          const pData = pricingSnap.data();
          setPlatformPricing({
            transferBase: pData.transferBase || 250,
            transferPerKm: pData.transferPerKm || 20,
          });
        }
      } catch (e) {
        console.log("Failed to fetch pricing");
      }
    };
    fetchPricing();
  }, []);

  // Invisible Calculator Logic
  useEffect(() => {
    if (!needTransfer || !transferPickup) {
      setCalculatedDistance(0);
      setCalculatedTransferFare(0);
      return;
    }
    const pickup = transferPickup.toLowerCase();
    let estimatedKm = 10;
    if (pickup.includes("agra") || pickup.includes("taj")) estimatedKm = 60;
    else if (pickup.includes("delhi") || pickup.includes("ndls"))
      estimatedKm = 150;
    else if (pickup.includes("vrindavan")) estimatedKm = 15;

    setCalculatedDistance(estimatedKm);
    setCalculatedTransferFare(
      platformPricing.transferBase +
        estimatedKm * platformPricing.transferPerKm,
    );
  }, [transferPickup, needTransfer, platformPricing]);

  // Calculate Total
  const roomTotal = hotel.pricePerNight * nights;
  const vehicleTotal = vehicleType
    ? (VEHICLE_OPTIONS.find((v) => v.id === vehicleType)?.price || 0) * nights
    : 0;
  const transferTotal = needTransfer ? calculatedTransferFare : 0;
  const delayTotal = needTransfer && delayProtection ? WAITING_FEE_PRICE : 0;
  const finalTotalAmount =
    roomTotal + vehicleTotal + transferTotal + delayTotal;

  const handleBookNow = () => {
    router.push({
      pathname: "/checkout",
      params: {
        listingId: hotel.id,
        listingName: hotel.name,
        totalAmount: finalTotalAmount,
        roomTotal,
        checkIn,
        checkOut,
        guests,
        arrivalTime,
        // Extras Payload
        needCab: needTransfer ? "true" : "false",
        cabPickup: transferPickup,
        cabPrice: calculatedTransferFare,
        delayProtection: delayProtection ? "true" : "false",
        delayPrice: delayTotal,
        vehicleId: vehicleType || "",
        vehiclePrice: vehicleTotal,
      },
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style="light" />

      {/* --- Hero Image Section --- */}
      <View className="relative h-72">
        <Image
          source={{ uri: hotel.images[0] }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20" />
        <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-6 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#FF5A1F" : "white"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1 -mt-6 bg-white dark:bg-[#09090B] rounded-t-[30px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-black text-gray-900 dark:text-white">
                {hotel.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="location" size={14} color="#FF5A1F" />
                <Text className="text-gray-500 text-sm">{hotel.location}</Text>
              </View>
            </View>
            <View className="items-end">
              <View className="bg-green-500/10 px-2 py-1 rounded flex-row items-center gap-1">
                <Text className="text-green-600 font-bold text-sm">
                  {hotel.rating}
                </Text>
                <Ionicons name="star" size={12} color="#16A34A" />
              </View>
              <Text className="text-gray-400 text-xs mt-1">
                {hotel.reviews} reviews
              </Text>
            </View>
          </View>

          {/* About & Amenities */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            About
          </Text>
          <Text className="text-gray-500 leading-6 mb-6">
            {hotel.description}
          </Text>

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Amenities
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {hotel.amenities.map((item, index) => (
              <View
                key={index}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                <Text className="text-gray-600 dark:text-gray-400 text-xs font-bold">
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View className="h-[1px] bg-gray-100 dark:bg-gray-800 mb-6" />

          {/* 🚨 PREMIUM TRAVEL EXTRAS (MOBILE VERSION) 🚨 */}
          <Text className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Upgrade your trip
          </Text>
          <Text className="text-gray-500 text-xs mb-4">
            Add a seamless transfer or rent a vehicle.
          </Text>

          {/* 1. Arrival Transfer */}
          <View
            className={`p-4 rounded-2xl border-2 mb-4 ${needTransfer ? "border-[#FF5A1F] bg-orange-50/50 dark:bg-orange-900/10" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-black"}`}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
                  <Ionicons name="car" size={20} color="#FF5A1F" />
                </View>
                <View>
                  <Text className="font-black text-gray-900 dark:text-white">
                    Station Transfer
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Pickup on arrival
                  </Text>
                </View>
              </View>
              <Switch
                value={needTransfer}
                onValueChange={setNeedTransfer}
                trackColor={{ true: "#FF5A1F" }}
              />
            </View>

            {needTransfer && (
              <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <View className="bg-white dark:bg-[#111827] flex-row items-center px-3 h-12 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
                  <Ionicons name="location-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    placeholder="Pickup location (e.g. Agra)"
                    placeholderTextColor="#9CA3AF"
                    value={transferPickup}
                    onChangeText={setTransferPickup}
                    className="flex-1 ml-2 text-gray-900 dark:text-white text-sm"
                  />
                </View>

                {transferPickup.length > 0 && (
                  <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 flex-row justify-between items-center mb-3">
                    <Text className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      ~{calculatedDistance} km
                    </Text>
                    <Text className="text-sm font-black text-[#FF5A1F]">
                      + ₹{calculatedTransferFare}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setDelayProtection(!delayProtection)}
                  className={`flex-row items-center justify-between p-3 rounded-xl border ${delayProtection ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20" : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-5 h-5 rounded items-center justify-center border ${delayProtection ? "bg-amber-500 border-amber-500" : "border-gray-300 dark:border-gray-600"}`}
                    >
                      {delayProtection && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text
                      className={`text-sm font-bold ${delayProtection ? "text-amber-900 dark:text-amber-100" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      Delay Protection
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-amber-600">
                    +₹{WAITING_FEE_PRICE}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 2. Vehicle Rentals */}
          <View className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
            <Text className="font-bold text-gray-900 dark:text-white mb-3">
              Rent a Vehicle for {nights} Days
            </Text>
            <View className="flex-row gap-2">
              {VEHICLE_OPTIONS.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() =>
                    setVehicleType(vehicleType === v.id ? null : v.id)
                  }
                  className={`flex-1 p-3 rounded-xl border-2 items-center ${vehicleType === v.id ? "bg-black border-black dark:bg-white dark:border-white" : "bg-gray-50 border-transparent dark:bg-gray-900 dark:border-gray-800"}`}
                >
                  <Ionicons
                    name={v.icon as any}
                    size={24}
                    color={
                      vehicleType === v.id
                        ? isDark
                          ? "black"
                          : "white"
                        : isDark
                          ? "white"
                          : "black"
                    }
                  />
                  <Text
                    className={`text-[10px] font-bold mt-2 ${vehicleType === v.id ? (isDark ? "text-black" : "text-white") : "text-gray-500"}`}
                  >
                    {v.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 dark:bg-gray-800 mb-6" />
          <HotelReviews hotelId={hotel.id} isDark={isDark} />
        </View>
      </ScrollView>

      {/* --- Bottom Action Bar --- */}
      <View className="p-4 bg-white dark:bg-[#09090B] border-t border-gray-100 dark:border-gray-800 flex-row items-center justify-between pb-safe">
        <View>
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            Total Price
          </Text>
          <View className="flex-row items-end gap-1">
            <Text className="text-2xl font-black text-gray-900 dark:text-white">
              ₹{finalTotalAmount.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleBookNow}
          className="bg-[#FF5A1F] px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/30"
        >
          <Text className="text-white font-black text-base">Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
