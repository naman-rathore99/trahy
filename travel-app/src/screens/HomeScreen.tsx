import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Search, MapPin, Bell, Car, BedDouble,
    Compass, Briefcase, Star, ArrowRight, SlidersHorizontal, Map
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// 🟢 1. Main Navigation Grid (The "Pages" of your App)
const MAIN_NAV = [
    { id: '1', name: 'Stays', sub: 'Hotels & Villas', icon: <BedDouble size={28} color="white" />, color: ['#4F46E5', '#3730A3'] }, // Indigo
    { id: '2', name: 'Rentals', sub: 'Self-Drive', icon: <Car size={28} color="white" />, color: ['#2563EB', '#1E40AF'] }, // Blue
    { id: '3', name: 'Cabs', sub: 'Chauffeur', icon: <Map size={28} color="white" />, color: ['#059669', '#047857'] }, // Emerald
    { id: '4', name: 'Packages', sub: 'Holiday', icon: <Compass size={28} color="white" />, color: ['#D97706', '#B45309'] }, // Amber
];

// 🚗 2. Vehicle Fleet (Horizontal Scroll - "The Vehicle Section")
const FLEET_CATEGORIES = [
    {
        id: '1', name: 'Premium', count: '12 Cars', image: 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=600&q=80',
        desc: 'Mercedes, Audi, BMW'
    },
    {
        id: '2', name: 'SUVs', count: '24 Cars', image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80',
        desc: 'Thar, Scorpio, Creta'
    },
    {
        id: '3', name: 'Bikes', count: '15 Bikes', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        desc: 'Himalayan, RE Classic'
    },
];

// 🏨 3. Featured Stays (Vertical List)
const POPULAR_STAYS = [
    {
        id: '101', name: 'Radisson Blu', location: 'Mathura City Center', price: '₹4,500', rating: 4.8,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '102', name: 'Nidhivan Sarovar', location: 'Vrindavan Road', price: '₹3,200', rating: 4.6,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80'
    }
];

export default function HomeScreen({ navigation }: any) {

    // ✨ Render Navigation Grid Item
    const renderNavItem = (item: any) => (
        <TouchableOpacity
            key={item.id}
            className="w-[48%] mb-4"
            activeOpacity={0.9}
            onPress={() => console.log(`Maps to ${item.name}`)}
        >
            <LinearGradient
                colors={item.color}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="p-4 rounded-3xl h-32 justify-between shadow-lg relative overflow-hidden"
            >
                {/* Background Circle Decoration */}
                <View className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />

                <View className="bg-white/20 w-12 h-12 rounded-xl items-center justify-center backdrop-blur-md">
                    {item.icon}
                </View>
                <View>
                    <Text className="text-white text-lg font-bold tracking-tight">{item.name}</Text>
                    <Text className="text-gray-200 text-xs font-medium opacity-80">{item.sub}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    // 🚗 Render Vehicle Fleet Card
    const renderFleet = ({ item }: any) => (
        <TouchableOpacity
            className="mr-4 w-64 h-40 rounded-3xl overflow-hidden relative bg-gray-900 border border-gray-800"
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.image }} className="w-full h-full opacity-60" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} className="absolute bottom-0 w-full p-4 h-full justify-end">
                <Text className="text-white text-xl font-bold">{item.name}</Text>
                <Text className="text-gray-400 text-xs mb-1">{item.desc}</Text>
                <View className="bg-blue-600/30 self-start px-3 py-1 rounded-full border border-blue-500/30">
                    <Text className="text-blue-400 text-[10px] font-bold">{item.count} Available</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <SafeAreaView className="flex-1">

                {/* 🔥 Header */}
                <View className="px-6 py-4 flex-row justify-between items-center bg-black">
                    <View>
                        <Text className="text-gray-400 text-xs font-medium uppercase tracking-widest">Current Location</Text>
                        <TouchableOpacity className="flex-row items-center mt-1">
                            <Text className="text-white text-xl font-bold mr-1">Mathura, UP</Text>
                            <MapPin color="#3B82F6" size={16} fill="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity className="w-10 h-10 bg-gray-900 rounded-full items-center justify-center border border-gray-800">
                        <Bell color="white" size={20} />
                        <View className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full border border-black" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* 🔍 Search Bar (Floating) */}
                    <View className="px-6 my-4">
                        <View className="flex-row items-center bg-gray-900/80 border border-gray-800 rounded-2xl px-4 py-4">
                            <Search color="#9CA3AF" size={20} />
                            <TextInput
                                placeholder="Search hotels, cars, or destinations..."
                                placeholderTextColor="#6B7280"
                                className="flex-1 text-white ml-3 font-medium"
                            />
                            <View className="w-[1px] h-6 bg-gray-700 mx-3" />
                            <TouchableOpacity>
                                <SlidersHorizontal color="#3B82F6" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 🧩 1. Main Navigation Grid */}
                    <View className="px-6 mb-2">
                        <Text className="text-white text-lg font-bold mb-4">Explore</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {MAIN_NAV.map(item => renderNavItem(item))}
                        </View>
                    </View>

                    {/* 🚗 2. The Vehicle Section (Fleet) */}
                    <View className="py-4">
                        <View className="px-6 flex-row justify-between items-center mb-4">
                            <Text className="text-white text-lg font-bold">Our Fleet</Text>
                            <TouchableOpacity>
                                <ArrowRight color="#3B82F6" size={20} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={FLEET_CATEGORIES}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={renderFleet}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingLeft: 24, paddingRight: 10 }}
                        />
                    </View>

                    {/* 🏨 3. Featured Stays */}
                    <View className="px-6 mt-4">
                        <Text className="text-white text-lg font-bold mb-4">Popular Stays</Text>
                        {POPULAR_STAYS.map((stay) => (
                            <TouchableOpacity key={stay.id} className="flex-row bg-gray-900/50 border border-gray-800 p-3 rounded-2xl mb-4">
                                <Image source={{ uri: stay.image }} className="w-24 h-24 rounded-xl bg-gray-800" />
                                <View className="flex-1 ml-4 justify-center">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-white text-base font-bold flex-1">{stay.name}</Text>
                                        <View className="flex-row items-center bg-yellow-500/20 px-2 py-1 rounded-md">
                                            <Star size={10} color="#FBBF24" fill="#FBBF24" />
                                            <Text className="text-[#FBBF24] text-xs font-bold ml-1">{stay.rating}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-500 text-xs mt-1">{stay.location}</Text>
                                    <View className="flex-row justify-between items-center mt-3">
                                        <Text className="text-blue-400 font-bold text-lg">{stay.price}<Text className="text-gray-500 text-xs font-normal"> / night</Text></Text>
                                        <TouchableOpacity className="bg-white px-4 py-2 rounded-lg">
                                            <Text className="text-black text-xs font-bold">Book</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}