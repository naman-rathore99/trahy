import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminVehicles() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const VEHICLES = [
    { id: 1, name: "Test Sedan", seats: "4 Seats", fuel: "CNG", price: "₹1200", type: "Sedan" },
    { id: 2, name: "Family Wagon", seats: "6 Seats", fuel: "CNG", price: "₹1800", type: "SUV" },
    { id: 3, name: "City Scotty", seats: "2 Seats", fuel: "Petrol", price: "₹500", type: "Bike" },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 flex-row justify-between items-center">
            <View>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Vehicle Management</Text>
                <Text className="text-gray-500 text-xs">Manage your fleet inventory</Text>
            </View>
            <TouchableOpacity className="bg-black dark:bg-white px-4 py-2 rounded-lg shadow-sm">
                <Text className="text-white dark:text-black font-bold text-xs">+ Add Vehicle</Text>
            </TouchableOpacity>
        </View>

        <ScrollView className="p-6">
          <View className="flex-row flex-wrap justify-between">
            {VEHICLES.map((v) => (
                <View key={v.id} className="w-[48%] bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 shadow-sm dark:shadow-none">
                    <View className="bg-gray-100 dark:bg-gray-800 self-start px-2 py-1 rounded mb-2">
                        <Text className="text-gray-600 dark:text-white text-[10px] font-bold uppercase">{v.type}</Text>
                    </View>
                    
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">{v.name}</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-3">{v.price}<Text className="text-gray-500 text-xs font-normal"> / day</Text></Text>

                    <View className="flex-row gap-2 mb-4">
                        <View className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded">
                            <Text className="text-gray-500 dark:text-gray-400 text-[10px]">{v.seats}</Text>
                        </View>
                        <View className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded">
                            <Text className="text-gray-500 dark:text-gray-400 text-[10px]">{v.fuel}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        <TouchableOpacity className="flex-1 bg-gray-100 dark:bg-gray-800 py-2 rounded-lg items-center border border-gray-200 dark:border-gray-700">
                             <Ionicons name="pencil" size={14} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-red-50 dark:bg-red-500/10 py-2 rounded-lg items-center border border-red-100 dark:border-red-500/20">
                             <Ionicons name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}