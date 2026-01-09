import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Fuel, Settings, Users } from 'lucide-react-native';

const VEHICLES = [
    { id: '1', name: 'Mahindra Thar 4x4', type: 'SUV', price: '₹3,500', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80', fuel: 'Diesel', seat: '4', gear: 'Manual' },
    { id: '2', name: 'Swift Dzire', type: 'Sedan', price: '₹1,800', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80', fuel: 'Petrol', seat: '5', gear: 'Auto' },
    { id: '3', name: 'Royal Enfield Classic', type: 'Bike', price: '₹900', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80', fuel: 'Petrol', seat: '2', gear: 'Manual' },
];

const CATS = ['All', 'Cars', 'Bikes', 'EV'];

export default function RentalsScreen({ navigation }: any) {
    const [activeCat, setActiveCat] = useState('All');

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1 px-4">
                {/* Header */}
                <View className="flex-row items-center py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="bg-gray-900 p-2 rounded-full">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-4">Self-Drive Rentals</Text>
                </View>

                {/* Filter Chips */}
                <View className="mb-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {CATS.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCat(cat)}
                                className={`mr-3 px-6 py-2 rounded-full border ${activeCat === cat ? 'bg-green-600 border-green-600' : 'bg-gray-900 border-gray-800'}`}
                            >
                                <Text className={activeCat === cat ? 'text-white font-bold' : 'text-gray-400'}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Grid List */}
                <FlatList
                    data={VEHICLES}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    renderItem={({ item }) => (
                        <TouchableOpacity className="w-[48%] bg-gray-900 border border-gray-800 rounded-2xl mb-4 overflow-hidden">
                            <Image source={{ uri: item.image }} className="w-full h-32 bg-gray-800" resizeMode="cover" />
                            <View className="p-3">
                                <Text className="text-white font-bold text-base mb-1">{item.name}</Text>
                                <Text className="text-green-400 font-bold">{item.price}<Text className="text-gray-500 text-xs font-normal"> / day</Text></Text>

                                {/* Specs */}
                                <View className="flex-row justify-between mt-3 border-t border-gray-800 pt-2">
                                    <View className="flex-row items-center"><Fuel size={10} color="#6B7280" /><Text className="text-gray-500 text-[10px] ml-1">{item.fuel}</Text></View>
                                    <View className="flex-row items-center"><Settings size={10} color="#6B7280" /><Text className="text-gray-500 text-[10px] ml-1">{item.gear}</Text></View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </View>
    );
}