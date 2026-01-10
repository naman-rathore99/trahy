'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
// 👇 Ensure ye path sahi ho (src/services/api)
import { getStays } from '../../src/services/api';

export default function StaysScreen() {
    const router = useRouter();

    // ✅ FIX 1: Type define kiya taaki error na aaye
    const [stays, setStays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStays();
    }, []);

    const loadStays = async () => {
        try {
            console.log("🔵 Fetching Stays...");
            // ✅ FIX 2: Result ko 'any' bola taaki TS properties check na kare
            const result: any = await getStays();
            console.log("🟢 API Result:", result);

            // ✅ FIX 3: Smart Check - Data structure handle karna
            if (Array.isArray(result)) {
                setStays(result);
            } else if (result.data && Array.isArray(result.data)) {
                setStays(result.data);
            } else if (result.stays && Array.isArray(result.stays)) {
                setStays(result.stays);
            } else {
                console.error("❌ Data format unknown:", result);
                setStays([]);
            }
        } catch (error) {
            console.error("🔴 Failed to load stays", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
                router.push({
                    pathname: "/hotel-details",
                    params: { hotel: JSON.stringify(item) }
                });
            }}
            className="bg-white mb-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/400' }}
                className="w-full h-48"
                resizeMode="cover"
            />
            <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">{item.name}</Text>
                        <View className="flex-row items-center mt-1">
                            <MapPin size={14} color="gray" />
                            <Text className="text-gray-500 text-xs ml-1">{item.location || "Mathura"}</Text>
                        </View>
                    </View>
                    <View className="flex-row bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                        <Star size={12} color="#D97706" fill="#D97706" />
                        <Text className="text-yellow-700 text-xs font-bold ml-1">{item.rating || 4.5}</Text>
                    </View>
                </View>
                <Text className="text-rose-600 font-bold text-lg">
                    ₹{item.price} <Text className="text-gray-400 text-xs font-normal">/ night</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#E11D48" />
                <Text className="text-gray-400 mt-4 text-sm">Finding best stays...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 px-4 pt-14">
            <StatusBar barStyle="dark-content" />
            <Text className="text-3xl font-bold text-gray-900 mb-6">Find your Stay</Text>
            <FlatList
                data={stays}
                keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">No hotels found available.</Text>
                }
            />
        </View>
    );
}