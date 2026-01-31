import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const SAVED_PLACES = [
  {
    id: "1",
    title: "Kyoto, Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop",
    rating: 4.9,
    price: "$450",
  },
  {
    id: "2",
    title: "Santorini, Greece",
    image:
      "https://images.unsplash.com/photo-1613395877344-13d4c2807df5?q=80&w=2000&auto=format&fit=crop",
    rating: 4.8,
    price: "$600",
  },
  {
    id: "3",
    title: "Bali, Indonesia",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000&auto=format&fit=crop",
    rating: 4.7,
    price: "$300",
  },
];

export default function SavedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6">
      <View className="flex-row justify-between items-center my-6">
        <Text className="text-2xl font-bold text-gray-900">Saved Places</Text>
        <TouchableOpacity>
          <Text className="text-[#FF5A1F] font-medium">Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={SAVED_PLACES}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white rounded-3xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
            <Image source={{ uri: item.image }} className="w-full h-40" />
            <View className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  {item.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.rating} (Review)
                  </Text>
                </View>
              </View>
              <View>
                <Text className="text-xl font-bold text-[#FF5A1F]">
                  {item.price}
                </Text>
                <Text className="text-gray-400 text-xs text-right">/night</Text>
              </View>
            </View>
            {/* Bookmark Icon */}
            <TouchableOpacity className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full">
              <Ionicons name="bookmark" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
