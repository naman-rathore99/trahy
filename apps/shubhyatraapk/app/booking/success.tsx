import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function BookingSuccess() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B] justify-center items-center px-6">
      <StatusBar style="dark" />
      
      {/* Success Icon */}
      <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark" size={48} color="#10B981" />
      </View>

      <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Booking Confirmed!</Text>
      <Text className="text-gray-500 text-center mb-10 leading-6">
          Yay! You have successfully booked{"\n"}
          <Text className="font-bold text-gray-900 dark:text-white">Nidhivan Sarovar</Text> for 2 nights.
      </Text>

      {/* Booking ID Card */}
      <View className="w-full bg-gray-50 dark:bg-[#111827] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 items-center mb-10">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Booking ID</Text>
          <Text className="text-2xl font-bold text-[#FF5A1F] mb-4">#8821-XYZ</Text>
          <Text className="text-gray-500 text-xs text-center">
              A confirmation email has been sent to{"\n"}your email address.
          </Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity 
        onPress={() => router.replace("/(tabs)/bookings" as any)} // Go to My Bookings Tab
        className="w-full bg-black dark:bg-white h-14 rounded-2xl items-center justify-center mb-4"
      >
          <Text className="text-white dark:text-black font-bold text-lg">View My Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.replace("/(tabs)" as any)} // Go Home
        className="py-4"
      >
          <Text className="text-gray-500 font-bold">Back to Home</Text>
      </TouchableOpacity>

    </View>
  );
}