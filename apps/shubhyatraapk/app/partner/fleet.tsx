import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnerFleet() {
  const router = useRouter();
  
  const [vehicles, setVehicles] = useState([
    { id: '1', name: "Toyota Innova", plate: "UP85 AT 1234", type: "SUV", status: "Available", image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/140809/innova-crysta-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80" },
    { id: '2', name: "Maruti Dzire", plate: "DL1C AA 9999", type: "Sedan", status: "On Trip", image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80" },
    { id: '3', name: "Tempo Traveller", plate: "HR55 T 5678", type: "Minibus", status: "Maintenance", image: "https://5.imimg.com/data5/SELLER/Default/2021/7/KQ/QG/XG/3773534/force-tempo-traveller-302-26-seater.jpg" },
  ]);

  const handleAddVehicle = () => {
    Alert.alert("Add Vehicle", "Feature to add new vehicle coming soon!");
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
            <View className="flex-row items-center gap-4">
                <TouchableOpacity onPress={() => router.back()} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700">
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">My Fleet</Text>
            </View>
            <TouchableOpacity onPress={handleAddVehicle}>
                <Ionicons name="add-circle" size={32} color="#FF5A1F" />
            </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList 
            data={vehicles}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
                <TouchableOpacity className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 shadow-sm flex-row gap-4">
                    <Image source={{ uri: item.image }} className="w-24 h-24 rounded-xl bg-gray-200" resizeMode="cover" />
                    <View className="flex-1 justify-center">
                        <View className="flex-row justify-between items-start">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</Text>
                            <View className={`px-2 py-1 rounded-md ${
                                item.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                (item.status === 'On Trip' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')
                            }`}>
                                <Text className={`text-[10px] font-bold uppercase ${
                                    item.status === 'Available' ? 'text-green-700' : 
                                    (item.status === 'On Trip' ? 'text-blue-700' : 'text-red-700')
                                }`}>{item.status}</Text>
                            </View>
                        </View>
                        <Text className="text-gray-500 font-bold mt-1">{item.plate}</Text>
                        <Text className="text-gray-400 text-xs mt-2">{item.type}</Text>
                    </View>
                </TouchableOpacity>
            )}
        />
      </SafeAreaView>
    </View>
  );
}