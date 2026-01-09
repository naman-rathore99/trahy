import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Fuel, Settings } from 'lucide-react-native';
import { getVehicles } from '../services/api';

export default function RentalsScreen({ navigation }: any) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const data = await getVehicles();
            setVehicles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderVehicle = ({ item }: any) => {
        // Fallback Image for Vehicles
        const imageSource = item.image
            ? { uri: item.image }
            : { uri: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf' };

        return (
            <TouchableOpacity className="w-[48%] bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden shadow-sm elevation-2">
                <Image
                    source={imageSource}
                    className="w-full h-32 bg-gray-100"
                    resizeMode="cover"
                />
                <View className="p-3">
                    <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-green-600 font-bold">₹{item.price}<Text className="text-gray-400 text-xs font-normal"> / day</Text></Text>

                    <View className="flex-row justify-between mt-3 border-t border-gray-100 pt-2">
                        <View className="flex-row items-center"><Fuel size={10} color="#6B7280" /><Text className="text-gray-500 text-[10px] ml-1">{item.fuel || 'Petrol'}</Text></View>
                        <View className="flex-row items-center"><Settings size={10} color="#6B7280" /><Text className="text-gray-500 text-[10px] ml-1">{item.gear || 'Manual'}</Text></View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView className="flex-1 px-4">
                <View className="flex-row items-center py-4 bg-white border-b border-gray-100 mb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                        <ArrowLeft color="#1F2937" size={24} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-xl font-bold ml-2">Self-Drive Rentals</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#059669" className="mt-10" />
                ) : (
                    <FlatList
                        data={vehicles}
                        keyExtractor={(item: any) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        renderItem={renderVehicle}
                        ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No vehicles available.</Text>}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}