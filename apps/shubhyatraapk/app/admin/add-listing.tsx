import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminAddListing() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [type, setType] = useState<"hotel" | "vehicle">("hotel");

  // Safe colors for placeholders and icons
  const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";
  const iconColor = isDark ? "#FFFFFF" : "#111827";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        
        {/* --- Header --- */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
          >
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            Add New Listing
          </Text>
        </View>

        <ScrollView className="p-6">
          
          {/* --- Type Toggle --- */}
          <View className="flex-row p-1 rounded-xl mb-6 border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#111827]">
            <TouchableOpacity
              onPress={() => setType("hotel")}
              className={`flex-1 py-3 rounded-lg items-center ${
                type === "hotel" ? "bg-white dark:bg-gray-700" : ""
              }`}
            >
              <Text
                className={`font-bold ${
                  type === "hotel"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-500"
                }`}
              >
                Hotel Room
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType("vehicle")}
              className={`flex-1 py-3 rounded-lg items-center ${
                type === "vehicle" ? "bg-white dark:bg-gray-700" : ""
              }`}
            >
              <Text
                className={`font-bold ${
                  type === "vehicle"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-500"
                }`}
              >
                Vehicle
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Form Fields --- */}
          <View className="gap-5">
            {/* Listing Name */}
            <View>
              <Text className="text-gray-600 dark:text-gray-400 font-bold mb-2 ml-1">
                Listing Name
              </Text>
              <TextInput
                placeholder={
                  type === "hotel"
                    ? "e.g. Deluxe Suite - Nidhivan"
                    : "e.g. Toyota Innova - UP85"
                }
                placeholderTextColor={placeholderColor}
                className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-xl font-medium"
              />
            </View>

            {/* Price & Capacity Row */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-gray-600 dark:text-gray-400 font-bold mb-2 ml-1">
                  Price / Night
                </Text>
                <TextInput
                  placeholder="₹2500"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-xl font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 dark:text-gray-400 font-bold mb-2 ml-1">
                  {type === "hotel" ? "Capacity" : "Seats"}
                </Text>
                <TextInput
                  placeholder={type === "hotel" ? "2 Adults" : "7 Seats"}
                  placeholderTextColor={placeholderColor}
                  className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-xl font-medium"
                />
              </View>
            </View>

            {/* Partner Assign */}
            <View>
              <Text className="text-gray-600 dark:text-gray-400 font-bold mb-2 ml-1">
                Assign to Partner (Optional)
              </Text>
              <TextInput
                placeholder="Enter Partner ID or Name"
                placeholderTextColor={placeholderColor}
                className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-xl font-medium"
              />
            </View>

            {/* Image Upload Mock */}
            <TouchableOpacity className="h-40 bg-gray-100 dark:bg-[#111827] border border-dashed border-gray-300 dark:border-gray-700 rounded-xl items-center justify-center mt-2">
              <Ionicons
                name="image-outline"
                size={32}
                color={isDark ? "#6B7280" : "#9CA3AF"}
              />
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-medium">
                Tap to upload cover image
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* --- Footer --- */}
        <View className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <TouchableOpacity className="w-full bg-rose-600 h-14 rounded-2xl items-center justify-center">
            <Text className="text-white font-bold text-lg">
              Publish Listing
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}