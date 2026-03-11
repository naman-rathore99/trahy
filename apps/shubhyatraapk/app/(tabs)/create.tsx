import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Create</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          What would you like to create?
        </Text>

        {/* Option Cards */}
        <TouchableOpacity 
          onPress={() => Alert.alert("Coming Soon", "Create booking feature coming soon")}
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl mb-4 border border-gray-200 dark:border-gray-800"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-full items-center justify-center">
              <Ionicons name="bed-outline" size={24} color="#FF5A1F" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Book a Hotel
              </Text>
              <Text className="text-gray-500 text-sm">
                Find and book your perfect stay
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/(tabs)/vehicle")}
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl mb-4 border border-gray-200 dark:border-gray-800"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center">
              <Ionicons name="car-sport-outline" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Rent a Vehicle
              </Text>
              <Text className="text-gray-500 text-sm">
                Choose from our fleet of vehicles
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => Alert.alert("Coming Soon", "Tour package feature coming soon")}
          className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center">
              <Ionicons name="map-outline" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Book a Tour
              </Text>
              <Text className="text-gray-500 text-sm">
                Explore curated tour packages
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}