'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Car, Bike } from 'lucide-react-native';
// 👇 IMPORT PATH FIXED (Pointing to src)
import { getVehicles } from '../../src/services/api';

export default function VehiclesScreen() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const data = await getVehicles();

            const [vehicles, setVehicles] = useState<any[]>([]);
        } catch (error) {
            console.error("Failed to load vehicles", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        if (type?.toLowerCase().includes('scooty') || type?.toLowerCase().includes('bike')) return <Bike size={20} color="#E11D48" />;
        return <Car size={20} color="#E11D48" />;
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity className="bg-white mb-4 p-4 rounded-xl border border-gray-100 flex-row items-center shadow-sm">
            <View className="h-16 w-16 bg-rose-50 rounded-lg items-center justify-center mr-4">
                {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full rounded-lg" resizeMode="cover" />
                ) : (
                    getIcon(item.type)
                )}
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                <Text className="text-gray-500 text-xs">{item.type} • {item.fuelType || 'Petrol'}</Text>
            </View>
            <View className="items-end">
                <Text className="text-rose-600 font-bold text-lg">₹{item.price}</Text>
                <Text className="text-gray-400 text-[10px]">/ day</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#E11D48" />
        </View>
    );

    return (
        <View className="flex-1 bg-white px-4 pt-14">
            <Text className="text-3xl font-bold text-gray-900 mb-6">Rent a Vehicle</Text>
            <FlatList
                data={vehicles}
                keyExtractor={(item: any) => item.id?.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );
}