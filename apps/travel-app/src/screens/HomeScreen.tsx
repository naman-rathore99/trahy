import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // ✅ Import Router
import {
    Search, Car, BedDouble, Compass, Map
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ✅ FIXED ROUTES: Now pointing to correct Tab files
const SERVICES = [
    {
        id: '1',
        name: 'Hotels',
        route: '/(tabs)/stays', // 👈 Points to Stays List (API Data)
        icon: <BedDouble size={24} color="#D97706" />,
        bg: 'bg-orange-100'
    },
    {
        id: '2',
        name: 'Cabs',
        route: '/(tabs)/yatra', // (Assuming you have yatra.tsx, else keep as is)
        icon: <Map size={24} color="#2563EB" />,
        bg: 'bg-blue-100'
    },
    {
        id: '3',
        name: 'Rentals',
        route: '/(tabs)/vehicles', // 👈 Points to Vehicles File (Cars Data)
        icon: <Car size={24} color="#059669" />,
        bg: 'bg-green-100'
    },
    {
        id: '4',
        name: 'Packages',
        route: '/(tabs)/home',
        icon: <Compass size={24} color="#7C3AED" />,
        bg: 'bg-purple-100'
    },
];

const BANNERS = [
    { id: '1', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80', title: 'Weekend in Vrindavan', sub: '20% Off on Stays' },
    { id: '2', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80', title: 'Road Trip Special', sub: 'Rentals starting ₹999' },
];

export default function HomeScreen() {
    const router = useRouter(); // ✅ Use Router Hook

    const renderBanner = ({ item }: any) => (
        <TouchableOpacity className="mr-4 relative rounded-2xl overflow-hidden shadow-sm" style={{ width: width * 0.75, height: 160 }}>
            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute inset-0 bg-black/30" />
            <View className="absolute bottom-4 left-4">
                <Text className="text-white text-lg font-bold">{item.title}</Text>
                <Text className="text-gray-200 text-xs">{item.sub}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <SafeAreaView className="flex-1">

                {/* Header */}
                <View className="px-5 py-3 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase">Welcome Back</Text>
                        <Text className="text-gray-900 text-lg font-bold">Naman Rathore 👋</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/profile')} // ✅ Fixed Profile Link
                        className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-white shadow-sm"
                    >
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60' }}
                            className="w-full h-full"
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Search */}
                    <View className="px-5 mt-2">
                        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                            <Search color="gray" size={20} />
                            <TextInput
                                placeholder="Search hotels, cabs, places..."
                                placeholderTextColor="gray"
                                className="flex-1 text-black ml-3"
                            />
                        </View>
                    </View>

                    {/* Services Grid */}
                    <View className="px-5 mt-6">
                        <Text className="text-gray-900 text-base font-bold mb-4">Services</Text>
                        <View className="flex-row justify-between">
                            {SERVICES.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                        // ✅ FIXED: Using router.push with specific paths
                                        if (item.route) router.push(item.route as any);
                                    }}
                                    className="items-center w-[23%]"
                                >
                                    <View className={`w-16 h-16 ${item.bg} rounded-2xl items-center justify-center mb-2`}>
                                        {item.icon}
                                    </View>
                                    <Text className="text-gray-700 text-xs font-medium">{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Offers Banners */}
                    <View className="mt-8">
                        <View className="px-5 mb-4">
                            <Text className="text-gray-900 text-base font-bold">Exclusive Offers</Text>
                        </View>
                        <FlatList
                            data={BANNERS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={renderBanner}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}