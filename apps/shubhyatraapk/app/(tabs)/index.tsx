import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCollection } from "../../hooks/useFirestore";

// 1. Fallback Image
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800";
const { width } = Dimensions.get("window");

// 2. Types
type ListingItem = {
  id: string;
  name?: string;
  title?: string;
  price?: string | number;
  pricePerDay?: string | number;
  pricePerNight?: string | number;
  imageUrl?: string;
  mainImage?: string;
  imageUrls?: string[];
  location?: string;
  type?: string;
  rating?: number;
};

// 3. Sub-Categories Data
const CATEGORY_TAGS = {
    Stays: ["All", "Luxury", "Budget", "Near Temple", "Villas"],
    Rides: ["All", "SUV", "Sedan", "Tempo Traveller", "Bus"]
};

export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<"Stays" | "Rides">("Stays");
  const [subCategory, setSubCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data
  const { data: hotels, loading: loadingHotels } = useCollection("hotels");
  const { data: vehicles, loading: loadingVehicles } = useCollection("vehicles");

  const rawData = (category === "Stays" ? hotels : vehicles) as ListingItem[];
  const isLoading = category === "Stays" ? loadingHotels : loadingVehicles;

  // 4. Enhanced Filter Logic
  const filteredData = rawData.filter(item => {
      // Search Query
      const query = searchQuery.toLowerCase();
      const itemName = (item.name || item.title || "").toLowerCase();
      const matchesSearch = itemName.includes(query) || (item.location || "").toLowerCase().includes(query);
      
      // Sub-Category Filter (Simulated logic - adjust based on your real DB fields)
      let matchesTag = true;
      if (subCategory !== "All") {
          // Example: If hotel price > 5000 is Luxury, or vehicle type matches tag
          if (category === "Rides") {
             matchesTag = (item.type || "").includes(subCategory);
          } else {
             // For Stays, we assume 'type' or price logic. 
             // Here simply returning true for now to show data, 
             // in real app check `item.tags` or `item.category`
             matchesTag = true; 
          }
      }

      return matchesSearch && matchesTag;
  });

  // Helpers
  const getDisplayImage = (item: ListingItem) => {
    if (item.mainImage) return item.mainImage;
    if (item.imageUrl) return item.imageUrl;
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    return DEFAULT_IMAGE;
  };

  const getDisplayPrice = (item: ListingItem) => {
    if (item.pricePerNight) return item.pricePerNight;
    if (item.pricePerDay) return item.pricePerDay;
    if (item.price) return item.price;
    return "N/A";
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style="light" />
      
      {/* --- HERO HEADER --- */}
      <ImageBackground 
        source={{ uri: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000" }} 
        className="h-72 w-full justify-end pb-8 rounded-b-[40px] overflow-hidden relative"
      >
        <View className="absolute inset-0 bg-black/50" />
        
        <SafeAreaView className="px-6 w-full">
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">Current Location</Text>
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="location" size={16} color="#FF5A1F" />
                        <Text className="text-white font-bold text-lg">Mathura, India</Text>
                        <Ionicons name="chevron-down" size={14} color="white" />
                    </View>
                </View>
                <TouchableOpacity className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                    <Ionicons name="notifications" size={20} color="white" />
                    <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </TouchableOpacity>
            </View>

            <Text className="text-white text-3xl font-bold leading-tight mb-6">
                Discover the{"\n"}
                <Text className="text-[#FF5A1F]">Divine City</Text>
            </Text>

            {/* SEARCH BAR */}
            <View className="bg-white flex-row items-center p-3 rounded-2xl shadow-xl h-14">
                <Ionicons name="search" size={22} color="#FF5A1F" />
                <TextInput 
                    placeholder={category === "Stays" ? "Search hotels, ashrams..." : "Search cars, buses..."}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 ml-3 text-gray-900 font-bold text-base h-full"
                />
                <View className="h-6 w-[1px] bg-gray-200 mx-2" />
                <TouchableOpacity className="p-1">
                    <Ionicons name="options-outline" size={22} color="gray" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* --- MAIN CATEGORY TOGGLE --- */}
        <View className="flex-row justify-center mt-6 mx-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
            <TouchableOpacity 
                onPress={() => { setCategory("Stays"); setSubCategory("All"); }}
                className={`flex-1 py-3 rounded-full flex-row items-center justify-center gap-2 ${category === 'Stays' ? 'bg-white shadow-sm' : ''}`}
            >
                <Ionicons name="bed" size={18} color={category === 'Stays' ? '#FF5A1F' : 'gray'} />
                <Text className={`font-bold ${category === 'Stays' ? 'text-gray-900' : 'text-gray-500'}`}>Stays</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => { setCategory("Rides"); setSubCategory("All"); }}
                className={`flex-1 py-3 rounded-full flex-row items-center justify-center gap-2 ${category === 'Rides' ? 'bg-white shadow-sm' : ''}`}
            >
                <Ionicons name="car" size={18} color={category === 'Rides' ? '#FF5A1F' : 'gray'} />
                <Text className={`font-bold ${category === 'Rides' ? 'text-gray-900' : 'text-gray-500'}`}>Rides</Text>
            </TouchableOpacity>
        </View>

        {/* --- SUB-CATEGORY PILLS --- */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 pl-6">
            {CATEGORY_TAGS[category].map((tag) => (
                <TouchableOpacity 
                    key={tag}
                    onPress={() => setSubCategory(tag)}
                    className={`mr-3 px-5 py-2 rounded-full border ${subCategory === tag ? 'bg-black dark:bg-white border-black dark:border-white' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
                >
                    <Text className={`text-xs font-bold ${subCategory === tag ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tag}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* --- SECTION 1: RECOMMENDED (Horizontal) --- */}
        <View className="mt-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Recommended for You</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
                    <Text className="text-[#FF5A1F] font-bold text-xs">See All</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FF5A1F" />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
                    {filteredData.slice(0, 5).map((item) => (
                        <TouchableOpacity 
                            key={item.id}
                            onPress={() => router.push({ pathname: "/destination/[id]", params: { id: item.id } })}
                            className="mr-4 w-60"
                        >
                            <View className="relative">
                                <Image 
                                    source={{ uri: getDisplayImage(item) }} 
                                    className="w-full h-40 rounded-2xl bg-gray-200"
                                    resizeMode="cover"
                                />
                                <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg flex-row items-center gap-1">
                                    <Ionicons name="star" size={10} color="#F59E0B" />
                                    <Text className="text-[10px] font-bold">{item.rating || 4.5}</Text>
                                </View>
                            </View>
                            <Text className="text-gray-900 dark:text-white font-bold text-base mt-2" numberOfLines={1}>
                                {item.name || item.title}
                            </Text>
                            <Text className="text-gray-500 text-xs mb-1">
                                <Ionicons name="location-sharp" size={10} /> {category === "Stays" ? (item.location || "Vrindavan") : item.type}
                            </Text>
                            <Text className="text-[#FF5A1F] font-bold">₹{getDisplayPrice(item)} <Text className="text-gray-400 font-normal text-xs">{category === "Stays" ? "/night" : "/day"}</Text></Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>

        {/* --- PROMO BANNER --- */}
        <View className="px-6 mt-8">
            <View className="bg-gray-900 dark:bg-gray-800 rounded-3xl p-6 flex-row justify-between items-center overflow-hidden relative">
                <View className="z-10 flex-1">
                    <View className="bg-[#FF5A1F] self-start px-2 py-1 rounded-md mb-2">
                        <Text className="text-white text-[10px] font-bold uppercase">Limited Offer</Text>
                    </View>
                    <Text className="text-white text-xl font-bold">20% Off on{'\n'}First Booking</Text>
                    <Text className="text-gray-400 text-xs mt-1">Use Code: BRAJ20</Text>
                </View>
                {/* Decorative Circle */}
                <View className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#FF5A1F] rounded-full opacity-20" />
                <Ionicons name="gift" size={60} color="white" style={{ opacity: 0.8 }} />
            </View>
        </View>

        {/* --- SECTION 2: TOP RATED (Vertical List) --- */}
        <View className="mt-8 px-6 pb-20">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Rated in Mathura</Text>
            
            {filteredData.slice(0, 6).map((item) => (
                <TouchableOpacity 
                    key={item.id}
                    onPress={() => router.push({ pathname: "/destination/[id]", params: { id: item.id } })}
                    className="flex-row bg-white dark:bg-[#111827] p-3 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
                >
                    <Image 
                        source={{ uri: getDisplayImage(item) }} 
                        className="w-24 h-24 rounded-xl bg-gray-200"
                    />
                    <View className="flex-1 ml-4 justify-center">
                        <View className="flex-row justify-between items-start">
                            <Text className="text-gray-900 dark:text-white font-bold text-base flex-1 mr-2" numberOfLines={1}>
                                {item.name || item.title}
                            </Text>
                            <Ionicons name="heart-outline" size={20} color="gray" />
                        </View>
                        
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                            {category === "Stays" ? "Near Prem Mandir • 2.5 km" : "Verified Partner • AC"}
                        </Text>

                        <View className="flex-row items-center gap-1 mt-2 mb-1">
                            {[1,2,3,4,5].map(s => (
                                <Ionicons key={s} name="star" size={10} color="#F59E0B" />
                            ))}
                            <Text className="text-xs text-gray-400 ml-1">(128)</Text>
                        </View>

                        <Text className="text-[#FF5A1F] font-bold text-lg">
                            ₹{getDisplayPrice(item)}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </View>
  );
}