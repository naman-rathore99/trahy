import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StatusBar, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
    ArrowLeft, Heart, Star, MapPin, CheckCircle2,
    Bike, Car, Wifi, Utensils, ShieldCheck, Wind, Tv, Droplets, Waves, Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ✅ 1. Define the Type for your Hotel Data
interface Hotel {
    id?: string;
    name: string;
    mainImage?: string;
    imageUrl?: string;
    imageUrls?: string[];
    location?: string;
    city?: string;
    address?: string;
    pricePerNight?: number | string;
    rating?: number | string;
    totalReviews?: number;
    description?: string;
    amenities?: string[];
}

// 🛠️ HELPER: Map API amenity strings to Icons
const getAmenityIcon = (name: string) => {
    const key = name.toLowerCase().trim();
    if (key.includes('wifi')) return <Wifi size={18} color="#475569" />;
    if (key.includes('ac') || key.includes('air')) return <Wind size={18} color="#475569" />;
    if (key.includes('food') || key.includes('break')) return <Utensils size={18} color="#475569" />;
    if (key.includes('tv')) return <Tv size={18} color="#475569" />;
    if (key.includes('geyser') || key.includes('water')) return <Droplets size={18} color="#475569" />;
    if (key.includes('pool')) return <Waves size={18} color="#475569" />;
    if (key.includes('park')) return <Car size={18} color="#475569" />;
    return <ShieldCheck size={18} color="#475569" />;
};

const MOCK_ROOMS = [
    { id: 'r1', name: 'Base Room', price: 0, type: 'Standard', size: 'Included', capacity: '2 Adults' },
    { id: 'r2', name: 'Premium Suite', price: 1200, type: 'Upgrade', size: '+150 sqft', capacity: '3 Adults' },
];

const ADDONS = [
    { id: 'bike', name: 'Scooty Rental', price: 400, desc: 'Per Day', icon: (active: boolean) => <Bike size={22} color={active ? '#E11D48' : '#64748B'} /> },
    { id: 'cab', name: 'Private Cab', price: 2000, desc: 'Full Day', icon: (active: boolean) => <Car size={22} color={active ? '#E11D48' : '#64748B'} /> },
];

export default function HotelDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // ✅ 2. Parse Data Safely
    let parsedHotel: Hotel | null = null;
    try {
        if (typeof params.hotel === 'string') {
            parsedHotel = JSON.parse(params.hotel);
        } else {
            parsedHotel = params.hotel as unknown as Hotel;
        }
    } catch (e) {
        console.error("Failed to parse hotel data", e);
    }

    if (!parsedHotel || !parsedHotel.name) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500 mb-4">Hotel data could not be loaded.</Text>
                <TouchableOpacity onPress={() => router.back()} className="p-3 bg-gray-100 rounded-full">
                    <Text>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ✅ 3. Normalize Data & Prepare Gallery
    const primaryImage = parsedHotel.mainImage || parsedHotel.imageUrl || (parsedHotel.imageUrls?.[0]) || 'https://via.placeholder.com/400';

    // Logic: If imageUrls exist, use them. If not, make a list containing just the main image.
    const carouselImages = (parsedHotel.imageUrls && parsedHotel.imageUrls.length > 0)
        ? parsedHotel.imageUrls
        : [primaryImage];

    const hotel = {
        name: parsedHotel.name,
        location: parsedHotel.location || parsedHotel.city || parsedHotel.address || 'Mathura',
        price: parsedHotel.pricePerNight || 1500,
        rating: parsedHotel.rating || 4.5,
        reviews: parsedHotel.totalReviews || 0,
        description: parsedHotel.description || `Experience a wonderful stay at ${parsedHotel.name}.`,
        amenities: Array.isArray(parsedHotel.amenities) ? parsedHotel.amenities : []
    };

    const [selectedRoom, setSelectedRoom] = useState(MOCK_ROOMS[0]);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0); // For Pagination Dots

    // Scroll Handler for Carousel
    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
        if (slide !== activeSlide) setActiveSlide(slide);
    };

    const roomDiff = selectedRoom.price;
    const addonTotal = ADDONS.filter(a => selectedAddons.includes(a.id)).reduce((sum, item) => sum + item.price, 0);
    const finalPrice = Number(hotel.price) + roomDiff + addonTotal;

    const toggleAddon = (id: string) => {
        if (selectedAddons.includes(id)) setSelectedAddons(prev => prev.filter(item => item !== id));
        else setSelectedAddons(prev => [...prev, id]);
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }} bounces={false}>

                {/* 🖼️ RESTORED CAROUSEL HEADER */}
                <View className="relative h-[45vh]">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                    >
                        {carouselImages.map((img, index) => (
                            <View key={index} style={{ width: width, height: '100%' }}>
                                <Image
                                    source={{ uri: img }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                {/* Gradient Overlay per slide */}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
                                    className="absolute inset-0"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Header Buttons */}
                    <View className="absolute top-12 left-0 w-full flex-row justify-between px-5 z-20">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                            <ArrowLeft color="white" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                            <Heart color={isFavorite ? "#E11D48" : "white"} fill={isFavorite ? "#E11D48" : "transparent"} size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Pagination Dots */}
                    {carouselImages.length > 1 && (
                        <View className="absolute bottom-28 w-full flex-row justify-center gap-2 z-20">
                            {carouselImages.map((_, index) => (
                                <View
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all ${activeSlide === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                                />
                            ))}
                        </View>
                    )}

                    {/* Title & Info */}
                    <View className="absolute bottom-8 left-5 right-5 z-10">
                        <View className="flex-row items-center space-x-2 mb-2">
                            <View className="flex-row items-center bg-yellow-500/90 px-2 py-1 rounded-md backdrop-blur-sm">
                                <Star size={12} color="white" fill="white" />
                                <Text className="text-white text-xs font-bold ml-1">
                                    {hotel.rating} {hotel.reviews > 0 && `(${hotel.reviews})`}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-white text-3xl font-extrabold shadow-sm leading-tight">{hotel.name}</Text>
                        <View className="flex-row items-center mt-2 opacity-90">
                            <MapPin size={16} color="white" />
                            <Text className="text-white text-sm ml-1 font-medium">{hotel.location}</Text>
                        </View>
                    </View>
                </View>

                {/* 📄 DETAILS BODY */}
                <View className="-mt-6 bg-slate-50 rounded-t-[32px] pt-6 px-4 shadow-2xl">

                    {/* AMENITIES */}
                    <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <View className="flex-row items-center mb-3">
                            <Info size={18} color="#0F172A" className="mr-2" />
                            <Text className="text-slate-900 text-base font-bold">Amenities</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {hotel.amenities.length > 0 ? hotel.amenities.map((amenity: string, index: number) => (
                                <View key={index} className="flex-row items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                    {getAmenityIcon(amenity)}
                                    <Text className="text-slate-600 text-xs font-semibold ml-2 capitalize">{amenity}</Text>
                                </View>
                            )) : <Text className="text-slate-400 text-sm italic">No specific amenities listed.</Text>}
                        </View>
                    </View>

                    {/* DESCRIPTION */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <Text className="text-slate-900 text-lg font-bold mb-2">About the stay</Text>
                        <Text className="text-slate-600 leading-6 text-sm font-medium">
                            {hotel.description}
                        </Text>
                    </View>

                    {/* ROOMS */}
                    <View className="bg-white py-5 pl-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <Text className="text-slate-900 text-lg font-bold mb-4 pr-5">Select Room</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-5">
                            {MOCK_ROOMS.map((room) => {
                                const isActive = selectedRoom.id === room.id;
                                const currentRoomPrice = Number(hotel.price) + room.price;
                                return (
                                    <TouchableOpacity
                                        key={room.id}
                                        activeOpacity={0.9}
                                        onPress={() => setSelectedRoom(room)}
                                        className={`mr-4 p-4 rounded-2xl border-2 w-[180px] bg-white ${isActive ? 'border-rose-500' : 'border-slate-100'}`}
                                    >
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className={`px-2 py-1 rounded-md ${isActive ? 'bg-rose-100' : 'bg-slate-100'}`}>
                                                <Text className={`text-[10px] font-bold ${isActive ? 'text-rose-700' : 'text-slate-500'}`}>{room.type}</Text>
                                            </View>
                                            {isActive && <CheckCircle2 size={18} color="#E11D48" fill="#E11D48" className="bg-white rounded-full" />}
                                        </View>
                                        <Text className="text-slate-900 font-bold text-lg mb-1">{room.name}</Text>
                                        <Text className="text-slate-500 text-xs mb-3">{room.capacity} • {room.size}</Text>
                                        <Text className="text-rose-600 font-bold text-lg">₹{currentRoomPrice}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* ADD-ONS */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <Text className="text-slate-900 text-lg font-bold mb-4">Extras</Text>
                        {ADDONS.map((addon) => {
                            const isSelected = selectedAddons.includes(addon.id);
                            return (
                                <TouchableOpacity
                                    key={addon.id}
                                    onPress={() => toggleAddon(addon.id)}
                                    activeOpacity={0.8}
                                    className={`mb-3 p-3 rounded-xl border-2 flex-row items-center justify-between ${isSelected ? 'border-rose-500 bg-rose-50/50' : 'border-slate-100 bg-slate-50'}`}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-rose-200' : 'bg-white border border-slate-200'}`}>
                                            {addon.icon(isSelected)}
                                        </View>
                                        <View>
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-rose-900' : 'text-slate-700'}`}>{addon.name}</Text>
                                            <Text className="text-slate-400 text-xs">{addon.desc}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className={`font-bold ${isSelected ? 'text-rose-600' : 'text-slate-900'}`}>+ ₹{addon.price}</Text>
                                        {isSelected && <CheckCircle2 size={16} color="#E11D48" fill="#E11D48" className="mt-1" />}
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* 💵 FOOTER */}
            <View className="absolute bottom-0 w-full bg-white px-5 py-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 rounded-t-3xl">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Total Price</Text>
                        <View className="flex-row items-end">
                            <Text className="text-slate-900 text-3xl font-extrabold">₹{finalPrice}</Text>
                            <Text className="text-slate-400 text-sm font-medium mb-1.5 ml-1">/ night</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        className="bg-rose-600 px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 flex-row items-center"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-bold text-lg mr-2">Book Now</Text>
                        <ArrowLeft size={18} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}