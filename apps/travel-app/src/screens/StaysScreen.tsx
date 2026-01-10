'use client'; // ✅ FIX 1: Essential for Web/Next.js

import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { ArrowLeft, Heart, Star, MapPin, CheckCircle2, Bike, Car } from 'lucide-react-native';

// ✅ FIX 2: Default Data for Web (When route.params is missing)
const DEFAULT_HOTEL = {
    id: 'default-1',
    name: 'Mathura Grand Palace',
    price: 1500,
    rating: 4.8,
    location: 'Krishna Nagar, Mathura',
    description: 'Experience luxury and peace near the birth place of Lord Krishna. Featuring modern amenities and traditional hospitality.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd',
        'https://images.unsplash.com/photo-1596436889106-be35e843f974',
    ]
};

const MOCK_ROOMS = [
    { id: 'r1', name: 'Standard', price: 1199, type: 'Standard', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
    { id: 'r2', name: 'Suite', price: 2500, type: 'Luxury', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd' },
];

const ADDONS = [
    { id: 'bike', name: '2-Wheeler', price: 400, icon: (active: boolean) => <Bike size={20} color={active ? 'white' : 'gray'} /> },
    { id: 'cab', name: 'Cab', price: 2000, icon: (active: boolean) => <Car size={20} color={active ? 'white' : 'gray'} /> },
];

export default function HotelDetailsScreen({ navigation, route }: any) {
    // ✅ FIX 3: Use Hook for responsive width on Web
    const { width } = useWindowDimensions();

    // ✅ Logic: Try to get data from navigation (Mobile), otherwise use Default (Web)
    const params = route?.params || {};
    const hotel = params.hotel || DEFAULT_HOTEL;

    const [selectedRoom, setSelectedRoom] = useState(MOCK_ROOMS[0]);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);

    // Prepare Images
    let carouselImages: string[] = [];
    if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
        carouselImages = [...hotel.images];
    } else if (hotel.image) {
        carouselImages = [hotel.image];
    } else {
        carouselImages = [DEFAULT_HOTEL.image];
    }

    const onScroll = (nativeEvent: any) => {
        if (nativeEvent) {
            const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
            if (slide !== activeSlide) setActiveSlide(slide);
        }
    };

    // Price Logic
    const basePrice = Number(hotel.price) || 1500;
    const addonTotal = ADDONS.filter(a => selectedAddons.includes(a.id)).reduce((sum, item) => sum + item.price, 0);
    const totalPrice = basePrice + addonTotal;

    const toggleAddon = (id: string) => {
        if (selectedAddons.includes(id)) setSelectedAddons(prev => prev.filter(item => item !== id));
        else setSelectedAddons(prev => [...prev, id]);
    };

    // Safe Navigation wrapper
    const handleGoBack = () => {
        if (navigation && navigation.goBack) {
            navigation.goBack();
        } else {
            console.log("Back button clicked (No navigation prop on web)");
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* 🖼️ CAROUSEL HEADER */}
                <View className="relative h-80">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={({ nativeEvent }) => onScroll(nativeEvent)}
                        scrollEventThrottle={16}
                    >
                        {carouselImages.map((img: string, index: number) => (
                            <Image
                                key={index}
                                source={{ uri: img }}
                                style={{ width: width, height: 320 }}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Header Buttons */}
                    <View className="absolute top-4 left-0 w-full flex-row justify-between px-4 z-10 pt-8">
                        <TouchableOpacity onPress={handleGoBack} className="bg-white/80 p-2 rounded-full shadow-sm">
                            <ArrowLeft color="black" size={24} />
                        </TouchableOpacity>
                        <View className="flex-row gap-3">
                            <TouchableOpacity className="bg-white/80 p-2 rounded-full shadow-sm">
                                <Heart color="black" size={22} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pagination Dots */}
                    <View className="absolute bottom-4 w-full flex-row justify-center gap-2">
                        {carouselImages.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full ${activeSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                            />
                        ))}
                    </View>
                </View>

                {/* Content */}
                <View className="px-5 -mt-6 bg-white rounded-t-3xl pt-6 shadow-xl">

                    {/* Details */}
                    <View className="mb-2">
                        <Text className="text-gray-900 text-3xl font-bold mb-1">{hotel.name}</Text>
                        <View className="flex-row items-center">
                            <View className="flex-row bg-yellow-50 px-2 py-1 rounded border border-yellow-200 mr-2">
                                <Star size={12} color="#D97706" fill="#D97706" />
                                <Text className="text-yellow-700 text-xs font-bold ml-1">{hotel.rating}</Text>
                            </View>
                            <MapPin size={14} color="#6B7280" />
                            <Text className="text-gray-500 text-sm ml-1">{hotel.location}</Text>
                        </View>
                    </View>

                    <Text className="text-rose-600 text-2xl font-bold mb-6">
                        ₹{basePrice} <Text className="text-gray-400 text-sm font-normal">/ night</Text>
                    </Text>

                    <Text className="text-gray-900 text-lg font-bold mb-2">About</Text>
                    <Text className="text-gray-500 leading-5 mb-6">
                        {hotel.description}
                    </Text>

                    {/* 🛏️ Room Selection */}
                    <Text className="text-gray-900 text-lg font-bold mb-3">Select Room</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        {MOCK_ROOMS.map((room) => (
                            <TouchableOpacity
                                key={room.id}
                                onPress={() => setSelectedRoom(room)}
                                className={`mr-4 p-4 rounded-xl border w-40 shadow-sm bg-white ${selectedRoom.id === room.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                            >
                                <View className="flex-row justify-between mb-8">
                                    <Text className="text-sm font-bold text-gray-500">{room.type}</Text>
                                    {selectedRoom.id === room.id && <CheckCircle2 size={16} color="#E11D48" />}
                                </View>
                                <Text className="text-gray-900 font-bold text-lg mb-1">{room.name}</Text>
                                <Text className="text-rose-600 font-bold">₹{room.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Add-ons */}
                    <View className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
                        <Text className="text-gray-900 text-lg font-bold mb-4">Add-ons</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {ADDONS.map((addon) => {
                                const isSelected = selectedAddons.includes(addon.id);
                                return (
                                    <TouchableOpacity key={addon.id} onPress={() => toggleAddon(addon.id)}
                                        className={`w-[48%] mb-3 p-3 rounded-xl border flex-row items-center justify-between shadow-sm ${isSelected ? 'bg-rose-600 border-rose-600' : 'bg-white border-gray-200'}`}
                                    >
                                        <View className="items-center justify-center">
                                            {addon.icon(isSelected)}
                                            <Text className={`text-xs font-bold mt-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>{addon.name}</Text>
                                        </View>
                                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>+{addon.price}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Footer */}
            <View className="absolute bottom-0 w-full bg-white border-t border-gray-200 p-4 pb-6 flex-row items-center justify-between shadow-lg">
                <View>
                    <Text className="text-rose-600 text-2xl font-bold">₹{totalPrice}</Text>
                    <Text className="text-gray-500 text-xs">Total Price</Text>
                </View>
                <TouchableOpacity className="bg-rose-600 px-8 py-3 rounded-xl shadow-lg">
                    <Text className="text-white font-bold text-lg">Check Availability</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}