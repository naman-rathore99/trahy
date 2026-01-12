'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar, TextInput, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Star, Heart, Search, SlidersHorizontal } from 'lucide-react-native';
// 👇 Ensure this path is correct for your project
import { getStays } from '../../src/services/api';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Popular', 'Trending', 'Nearby', 'Luxury'];

export default function StaysScreen() {
    const router = useRouter();
    const [stays, setStays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        loadStays();
    }, []);

    const loadStays = async () => {
        setLoading(true);
        try {
            const data = await getStays();
            // Handle different API response structures automatically
            const safeData = Array.isArray(data) ? data : (data.data || []);
            setStays(safeData);
        } catch (error) {
            console.error("Failed to load stays", error);
        } finally {
            setLoading(false);
        }
    };

    // 🎨 NEW PROFESSIONAL CARD DESIGN
    const renderCard = ({ item }: { item: any }) => {
        // Smart Image Logic: Picks the best available image
        const imageUri = item.mainImage || item.imageUrl || (item.imageUrls?.[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945';
        const price = item.pricePerNight || item.price || 1500;
        const rating = item.rating || 4.5;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: "/hotel-details", params: { hotel: JSON.stringify(item) } })}
                className="bg-white rounded-[24px] mb-6 shadow-sm border border-slate-100 overflow-hidden"
            >
                {/* 🖼️ Large Hero Image */}
                <View className="relative h-56 w-full">
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-full bg-slate-200"
                        resizeMode="cover"
                    />

                    {/* Floating Top Elements */}
                    <View className="absolute top-4 left-4 right-4 flex-row justify-between items-start">
                        {/* Rating Badge */}
                        <View className="flex-row items-center bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg">
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <Text className="text-slate-800 text-xs font-bold ml-1">{rating}</Text>
                        </View>

                        {/* Heart Button */}
                        <TouchableOpacity className="bg-white/30 backdrop-blur-md p-2 rounded-full">
                            <Heart size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 📝 Card Details */}
                <View className="p-4">
                    {/* Title & Location */}
                    <View className="mb-3">
                        <Text numberOfLines={1} className="text-slate-900 font-extrabold text-xl mb-1">{item.name}</Text>
                        <View className="flex-row items-center">
                            <MapPin size={14} color="#64748B" />
                            <Text numberOfLines={1} className="text-slate-500 text-sm ml-1 font-medium w-[90%]">
                                {item.location || item.city || "Mathura, Uttar Pradesh"}
                            </Text>
                        </View>
                    </View>

                    {/* Price & Action Row */}
                    <View className="flex-row justify-between items-center border-t border-slate-50 pt-3">
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold uppercase">Start from</Text>
                            <View className="flex-row items-baseline">
                                <Text className="text-rose-600 font-extrabold text-xl">₹{price}</Text>
                                <Text className="text-slate-400 text-xs font-medium ml-1">/night</Text>
                            </View>
                        </View>

                        <TouchableOpacity className="bg-slate-900 px-4 py-2 rounded-xl">
                            <Text className="text-white font-bold text-xs">View Deal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // 🏗️ NEW HEADER (With Search & Categories)
    const ListHeader = () => (
        <View className="bg-white pt-2 pb-4">
            {/* Header Titles */}
            <View className="px-5 mb-6">
                <Text className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Location</Text>
                <View className="flex-row items-center">
                    <MapPin size={20} color="#E11D48" className="mr-2" />
                    <Text className="text-slate-900 text-2xl font-extrabold">Mathura, India</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View className="px-5 mb-6">
                <View className="flex-row items-center bg-slate-50 rounded-2xl p-3 px-4 border border-slate-200">
                    <Search size={20} color="#64748B" className="mr-3" />
                    <TextInput
                        placeholder="Search hotels, stays..."
                        placeholderTextColor="#94A3B8"
                        className="flex-1 text-slate-900 font-medium h-10"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <View className="w-[1px] h-6 bg-slate-300 mx-3" />
                    <TouchableOpacity>
                        <SlidersHorizontal size={20} color="#0F172A" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Categories */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                className="mb-4"
            >
                {CATEGORIES.map((category, index) => {
                    const isActive = selectedCategory === category;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setSelectedCategory(category)}
                            className={`mr-3 px-5 py-2.5 rounded-full border ${isActive ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        >
                            <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            <FlatList
                data={loading ? [] : stays}
                keyExtractor={(item: any) => item.id?.toString() || Math.random().toString()}
                renderItem={renderCard}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <View className="mt-20"><ActivityIndicator size="large" color="#E11D48" /></View>
                    ) : (
                        <View className="items-center mt-20 px-10">
                            <Search size={48} color="#CBD5E1" />
                            <Text className="text-center text-slate-400 mt-4 text-lg font-medium">No stays found.</Text>
                        </View>
                    )
                }
                style={{ paddingHorizontal: 20 }}
                ListHeaderComponentStyle={{ marginLeft: -20, marginRight: -20 }}
            />
        </View>
    );
}