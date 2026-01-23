import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

const SAVED_ITEMS = [
  { id: '1', name: 'Hotel Madhuvan', location: 'Mathura', price: '₹1,199', rating: '4.7', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070' },
  { id: '2', name: 'Nidhivan Sarovar', location: 'Vrindavan', price: '₹2,500', rating: '4.9', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070' },
];

// ENSURE THIS EXPORT DEFAULT EXISTS
export default function WishlistScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6">
      <View className="mt-4 mb-6">
        <Text className="text-2xl font-bold text-gray-900">Saved Stays</Text>
        <Text className="text-gray-500">Your favorite places to stay</Text>
      </View>

      <FlatList
        data={SAVED_ITEMS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
            <Image source={{ uri: item.image }} className="w-full h-40" />
            <TouchableOpacity className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm">
              <Ionicons name="heart" size={20} color="#FF5A1F" />
            </TouchableOpacity>

            <View className="p-4">
              <View className="flex-row justify-between items-start">
                <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
                  <Ionicons name="star" size={12} color="#EAB308" />
                  <Text className="text-yellow-700 font-bold ml-1 text-xs">{item.rating}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center mt-1">
                <Feather name="map-pin" size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-1">{item.location}</Text>
              </View>

              <View className="flex-row justify-between items-end mt-4">
                <Text className="text-primary text-xl font-bold">{item.price}<Text className="text-sm text-gray-400 font-normal"> / night</Text></Text>
                <View className="bg-primary px-4 py-2 rounded-xl">
                  <Text className="text-white font-bold text-xs">Book Now</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}