import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Search, MapPin, Bell, Car, BedDouble,
    Compass, Map, Star, ArrowRight, SlidersHorizontal
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// 🟠 1. Updated Data with Routes (Bilkul Sahi Hai ✅)
const MAIN_NAV = [
    { id: '1', name: 'Stays', sub: 'Hotels & Ashrams', route: 'Stays', icon: <BedDouble size={28} color="white" />, color: ['#D97706', '#92400E'] },
    { id: '2', name: 'Yatra', sub: 'Cabs & Rides', route: 'Yatra', icon: <Map size={28} color="white" />, color: ['#2563EB', '#1E40AF'] },
    { id: '3', name: 'Rentals', sub: 'Self-Drive', route: 'Rentals', icon: <Car size={28} color="white" />, color: ['#059669', '#047857'] },
    { id: '4', name: 'Darshan', sub: 'Packages', route: 'Home', icon: <Compass size={28} color="white" />, color: ['#7C3AED', '#5B21B6'] },
];

// ... (Fleet aur Stays data same rahega)

export default function HomeScreen({ navigation }: any) {

    // ✨ Updated Render Function (Bilkul Sahi Hai ✅)
    const renderNavItem = (item: any) => (
        <TouchableOpacity
            key={item.id}
            className="w-[48%] mb-4"
            activeOpacity={0.9}
            // 👇 Yeh line Navigation ko trigger karegi
            onPress={() => navigation.navigate(item.route)}
        >
            <LinearGradient
                colors={item.color}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="p-4 rounded-3xl h-32 justify-between shadow-lg relative overflow-hidden border border-white/10"
            >
                <View className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                <View className="bg-black/20 w-12 h-12 rounded-xl items-center justify-center backdrop-blur-md">
                    {item.icon}
                </View>
                <View>
                    <Text className="text-white text-lg font-bold tracking-tight">{item.name}</Text>
                    <Text className="text-gray-200 text-xs font-medium opacity-90">{item.sub}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        // ... Baaki ka JSX code same rahega ...
        <View className="flex-1 bg-black">
            {/* ... */}
            {/* Grid Render karte waqt bas yeh ensure karein: */}
            <View className="px-6 mb-2">
                <Text className="text-white text-lg font-bold mb-4">Services</Text>
                <View className="flex-row flex-wrap justify-between">
                    {MAIN_NAV.map(item => renderNavItem(item))}
                </View>
            </View>
            {/* ... */}
        </View>
    );
}