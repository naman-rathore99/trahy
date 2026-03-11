import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehicleBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Default data if none is passed
  const carName = params.name || "Premium Sedan";
  const price = params.price || "$25.00";

  return (
    <View className="flex-1 bg-white">
      {/* --- Map Placeholder (Top Half) --- */}
      <View className="h-[45%] bg-gray-200 w-full relative">
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" }} 
          className="w-full h-full opacity-60"
        />
        
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-12 left-6 bg-white p-2 rounded-full shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        {/* Route Card Floating */}
        <View className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-2xl shadow-lg flex-row items-center">
            <View>
                <View className="flex-row items-center mb-3">
                    <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                    <Text className="font-bold text-gray-900">Current Location</Text>
                </View>
                <View className="w-[1px] h-4 bg-gray-300 ml-1.5 mb-1" />
                <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-[#FF5A1F] rounded-full mr-3" />
                    <Text className="font-bold text-gray-900">Mathura Temple</Text>
                </View>
            </View>
            <View className="ml-auto bg-gray-50 px-3 py-1 rounded-lg">
                <Text className="text-xs font-bold text-gray-500">15 mins</Text>
            </View>
        </View>
      </View>

      {/* --- Booking Details (Bottom Half) --- */}
      <SafeAreaView className="flex-1 -mt-4 bg-white rounded-t-[30px] shadow-2xl px-6 pt-2">
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-2">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </View>

            <Text className="text-xl font-bold text-gray-900 mt-4 mb-1">Confirm Your Ride</Text>
            <Text className="text-gray-500 text-sm mb-6">Economy • 4 Seats • AC</Text>

            {/* Selected Car Info */}
            <View className="flex-row items-center justify-between bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6">
                <View className="flex-row items-center">
                    <Image 
                        source={{ uri: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png" }} 
                        className="w-12 h-12" 
                    />
                    <View className="ml-3">
                        <Text className="font-bold text-lg text-gray-900">{carName}</Text>
                        <Text className="text-[#FF5A1F] font-bold text-sm">Nearby</Text>
                    </View>
                </View>
                <Text className="text-2xl font-bold text-gray-900">{price}</Text>
            </View>

            {/* Payment Method */}
            <TouchableOpacity className="flex-row items-center justify-between py-4 border-t border-gray-100 mb-2">
                <View className="flex-row items-center">
                    <Ionicons name="card-outline" size={24} color="#4B5563" />
                    <Text className="ml-3 font-semibold text-gray-700">Visa ending in 4242</Text>
                </View>
                <Text className="text-[#FF5A1F] font-bold">Change</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity className="bg-[#FF5A1F] w-full py-4 rounded-2xl shadow-lg shadow-orange-200 mt-4">
                <Text className="text-white text-center font-bold text-lg">Book Ride Now</Text>
            </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}