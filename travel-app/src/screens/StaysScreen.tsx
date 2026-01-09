import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MapPin, Wifi, Coffee } from 'lucide-react-native';

const STAYS = [
    { id: '1', name: 'Hotel Goverdhan Palace', location: 'Mathura Station Rd', price: '₹3,500', rating: 4.8, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
    { id: '2', name: 'Nidhivan Sarovar', location: 'Vrindavan', price: '₹4,200', rating: 4.9, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80' },
    { id: '3', name: 'Shri Radha Brij Vasundhara', location: 'Govardhan', price: '₹5,500', rating: 4.7, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
];

export default function StaysScreen({ navigation }: any) {
    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 px-4">

                {/* Header */}
                <View className="flex-row items-center py-4 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="bg-gray-900 p-2 rounded-full">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-4">Stays & Ashrams</Text>
                </View>

                {/* List */}
                <FlatList
                    data={STAYS}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <View className="h-48 relative">
                                <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-md flex-row items-center">
                                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                                    <Text className="text-white text-xs font-bold ml-1">{item.rating}</Text>
                                </View>
                            </View>

                            <View className="p-4">
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        <Text className="text-white text-lg font-bold">{item.name}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <MapPin size={14} color="#9CA3AF" />
                                            <Text className="text-gray-400 text-xs ml-1">{item.location}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-blue-400 text-lg font-bold">{item.price}</Text>
                                </View>

                                {/* Amenities */}
                                <View className="flex-row mt-4 gap-3">
                                    <View className="flex-row items-center bg-gray-800 px-2 py-1 rounded">
                                        <Wifi size={12} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1">Free Wifi</Text>
                                    </View>
                                    <View className="flex-row items-center bg-gray-800 px-2 py-1 rounded">
                                        <Coffee size={12} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-[10px] ml-1">Breakfast</Text>
                                    </View>
                                </View>

                                <TouchableOpacity className="bg-blue-600 mt-4 py-3 rounded-xl items-center">
                                    <Text className="text-white font-bold">Book Room</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </View>
    );
}