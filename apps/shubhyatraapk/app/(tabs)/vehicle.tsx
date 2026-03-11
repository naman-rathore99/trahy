import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehicleScreen() {
  const router = useRouter();

  const VEHICLES = [
    { id: '1', name: "Sedan Premier", price: "₹14/km", time: "5 min", image: "car-sport" },
    { id: '2', name: "SUV XL", price: "₹18/km", time: "8 min", image: "bus" },
    { id: '3', name: "Bike Taxi", price: "₹8/km", time: "2 min", image: "bicycle" },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">City Transport</Text>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Book a Ride</Text>
        </View>

        {/* Search */}
        <View className="px-6 mb-8">
            <View className="bg-gray-100 dark:bg-[#1F2937] p-4 rounded-2xl flex-row items-center mb-3">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <Text className="text-gray-900 dark:text-white font-bold">Current Location</Text>
            </View>
            <View className="bg-gray-100 dark:bg-[#1F2937] p-4 rounded-2xl flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                <TextInput 
                    placeholder="Where to?" 
                    placeholderTextColor="gray"
                    className="flex-1 text-gray-900 dark:text-white font-bold"
                />
            </View>
        </View>

        {/* Vehicle List */}
        <Text className="px-6 text-lg font-bold text-gray-900 dark:text-white mb-4">Available Now</Text>
        <FlatList 
            data={VEHICLES}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            renderItem={({ item }) => (
                <TouchableOpacity className="bg-white dark:bg-[#111827] p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 flex-row items-center shadow-sm">
                    <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center mr-4">
                        <Ionicons name={item.image as any} size={32} color="#FF5A1F" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</Text>
                        <Text className="text-green-600 font-bold text-xs">{item.time} away</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.price}</Text>
                        <Ionicons name="chevron-forward" size={16} color="gray" />
                    </View>
                </TouchableOpacity>
            )}
        />
      </SafeAreaView>
    </View>
  );
}