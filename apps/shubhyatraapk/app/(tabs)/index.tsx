import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location"; // 🚨 Added Location import!
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert, // 🚨 Added Alert import!
    Dimensions,
    Image,
    ImageBackground,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCollection } from "../../hooks/useFirestore";

// 1. Fallback Image
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800";
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

// 3. Categories & Locations
const CATEGORY_TAGS = {
  Stays: ["All", "Luxury", "Budget", "Near Temple", "Villas"],
  Rides: ["All", "SUV", "Sedan", "Tempo Traveller", "Bus"],
};

const AVAILABLE_LOCATIONS = [
  "All Braj Region",
  "Mathura",
  "Vrindavan",
  "Gokul",
  "Govardhan",
  "Barsana",
];

export default function HomeScreen() {
  const router = useRouter();

  // --- STATES ---
  const [category, setCategory] = useState<"Stays" | "Rides">("Stays");
  const [subCategory, setSubCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Location States
  const [currentLocation, setCurrentLocation] = useState("Mathura");
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch Data
  const { data: hotels, loading: loadingHotels } = useCollection("hotels");
  const { data: vehicles, loading: loadingVehicles } =
    useCollection("vehicles");

  const rawData = (category === "Stays" ? hotels : vehicles) as ListingItem[];
  const isLoading = category === "Stays" ? loadingHotels : loadingVehicles;

  // 4. Enhanced Filter Logic (Now includes Location!)
  const filteredData = rawData.filter((item) => {
    // A. Search Query Match
    const query = searchQuery.toLowerCase();
    const itemName = (item.name || item.title || "").toLowerCase();
    const itemLocation = (item.location || "").toLowerCase();
    const matchesSearch =
      itemName.includes(query) || itemLocation.includes(query);

    // B. Sub-Category Match
    let matchesTag = true;
    if (subCategory !== "All") {
      if (category === "Rides") {
        matchesTag = (item.type || "").includes(subCategory);
      } else {
        matchesTag = true; // Replace with item.tags.includes(subCategory) in your DB if needed
      }
    }

    // C. Location Match
    let matchesLocation = true;
    if (currentLocation !== "All Braj Region") {
      matchesLocation = itemLocation.includes(currentLocation.toLowerCase());
    }

    return matchesSearch && matchesTag && matchesLocation;
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

  // Real GPS Function
  const handleGetGPSLocation = async () => {
    setShowLocationModal(false);

    try {
      // 1. Ask the user for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access in your phone settings to find nearby stays.",
        );
        return;
      }

      // 2. Grab the GPS coordinates
      let location = await Location.getCurrentPositionAsync({});

      // 3. Translate coordinates into a City Name (Reverse Geocoding)
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        // Look for the city name, fallback to district/subregion if city is null
        const city =
          geocode[0].city ||
          geocode[0].district ||
          geocode[0].subregion ||
          "Mathura";
        setCurrentLocation(city);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "Could not fetch your location. Please check your GPS signal.",
      );
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style="light" />

      {/* --- LOCATION MODAL --- */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-2/3">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Select Location
              </Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close-circle" size={28} color="gray" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleGetGPSLocation}
              className="flex-row items-center bg-orange-50 dark:bg-gray-800 p-4 rounded-xl mb-4 border border-orange-100 dark:border-gray-700"
            >
              <Ionicons name="navigate" size={24} color="#FF5A1F" />
              <Text className="ml-3 font-bold text-[#FF5A1F] text-base">
                Use my current GPS location
              </Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => {
                    setCurrentLocation(loc);
                    setShowLocationModal(false);
                  }}
                  className={`flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 ${
                    currentLocation === loc
                      ? "bg-gray-50 dark:bg-gray-800 rounded-lg border-b-0"
                      : ""
                  }`}
                >
                  <Text
                    className={`text-base ${
                      currentLocation === loc
                        ? "font-bold text-[#FF5A1F]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {loc}
                  </Text>
                  {currentLocation === loc && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FF5A1F"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- HERO HEADER --- */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000",
        }}
        className="h-72 w-full justify-end pb-8 rounded-b-[40px] overflow-hidden relative"
      >
        <View className="absolute inset-0 bg-black/50" />

        <SafeAreaView className="px-6 w-full">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => setShowLocationModal(true)}>
              <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">
                Current Location
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location" size={16} color="#FF5A1F" />
                <Text className="text-white font-bold text-lg">
                  {currentLocation}
                </Text>
                <Ionicons name="chevron-down" size={14} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
              <Ionicons name="notifications" size={20} color="white" />
              <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-3xl font-bold leading-tight mb-6">
            Discover the{"\n"}
            <Text className="text-[#FF5A1F]">Divine City</Text>
          </Text>

          {/* SEARCH BAR (Fixed Android Text Clipping) */}
          <View className="bg-white flex-row items-center p-3 rounded-2xl shadow-xl h-14">
            <Ionicons name="search" size={22} color="#FF5A1F" />
            <TextInput
              placeholder={
                category === "Stays"
                  ? "Search hotels, ashrams..."
                  : "Search cars, buses..."
              }
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ paddingVertical: 0 }} // 🚨 This fixes the Android text clipping!
              className="flex-1 ml-3 text-gray-900 font-bold text-base"
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
            onPress={() => {
              setCategory("Stays");
              setSubCategory("All");
            }}
            className={`flex-1 py-3 rounded-full flex-row items-center justify-center gap-2 ${
              category === "Stays" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Ionicons
              name="bed"
              size={18}
              color={category === "Stays" ? "#FF5A1F" : "gray"}
            />
            <Text
              className={`font-bold ${
                category === "Stays" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Stays
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setCategory("Rides");
              setSubCategory("All");
            }}
            className={`flex-1 py-3 rounded-full flex-row items-center justify-center gap-2 ${
              category === "Rides" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Ionicons
              name="car"
              size={18}
              color={category === "Rides" ? "#FF5A1F" : "gray"}
            />
            <Text
              className={`font-bold ${
                category === "Rides" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Rides
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- SUB-CATEGORY PILLS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 pl-6"
        >
          {CATEGORY_TAGS[category].map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setSubCategory(tag)}
              className={`mr-3 px-5 py-2 rounded-full border ${
                subCategory === tag
                  ? "bg-black dark:bg-white border-black dark:border-white"
                  : "bg-transparent border-gray-300 dark:border-gray-700"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  subCategory === tag
                    ? "text-white dark:text-black"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- SECTION 1: RECOMMENDED (Horizontal) --- */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Recommended in{" "}
              {currentLocation === "All Braj Region" ? "Braj" : currentLocation}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
            >
              <Text className="text-[#FF5A1F] font-bold text-xs">See All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#FF5A1F" />
          ) : filteredData.length === 0 ? (
            <Text className="text-gray-500 text-center py-8">
              No stays found in {currentLocation}. Try searching another area.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pl-6"
            >
              {filteredData.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/destination/[id]",
                      params: { id: item.id },
                    })
                  }
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
                      <Text className="text-[10px] font-bold">
                        {item.rating || 4.5}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-gray-900 dark:text-white font-bold text-base mt-2"
                    numberOfLines={1}
                  >
                    {item.name || item.title}
                  </Text>
                  <Text className="text-gray-500 text-xs mb-1">
                    <Ionicons name="location-sharp" size={10} />{" "}
                    {item.location || currentLocation}
                  </Text>
                  <Text className="text-[#FF5A1F] font-bold">
                    ₹{getDisplayPrice(item)}{" "}
                    <Text className="text-gray-400 font-normal text-xs">
                      {category === "Stays" ? "/night" : "/day"}
                    </Text>
                  </Text>
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
                <Text className="text-white text-[10px] font-bold uppercase">
                  Limited Offer
                </Text>
              </View>
              <Text className="text-white text-xl font-bold">
                20% Off on{"\n"}First Booking
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Use Code: BRAJ20
              </Text>
            </View>
            <View className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#FF5A1F] rounded-full opacity-20" />
            <Ionicons
              name="gift"
              size={60}
              color="white"
              style={{ opacity: 0.8 }}
            />
          </View>
        </View>

        {/* --- SECTION 2: TOP RATED (Vertical List) --- */}
        <View className="mt-8 px-6 pb-20">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Top Rated in{" "}
            {currentLocation === "All Braj Region"
              ? "Braj Region"
              : currentLocation}
          </Text>

          {filteredData.slice(0, 6).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/destination/[id]",
                  params: { id: item.id },
                })
              }
              className="flex-row bg-white dark:bg-[#111827] p-3 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <Image
                source={{ uri: getDisplayImage(item) }}
                className="w-24 h-24 rounded-xl bg-gray-200"
              />
              <View className="flex-1 ml-4 justify-center">
                <View className="flex-row justify-between items-start">
                  <Text
                    className="text-gray-900 dark:text-white font-bold text-base flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {item.name || item.title}
                  </Text>
                  <Ionicons name="heart-outline" size={20} color="gray" />
                </View>

                <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                  {category === "Stays"
                    ? `${item.location || currentLocation} • Verified`
                    : "Verified Partner • AC"}
                </Text>

                <View className="flex-row items-center gap-1 mt-2 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
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
