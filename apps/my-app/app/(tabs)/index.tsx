import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getHotels, Hotel } from "../../service/api";

// --- 1. LOCAL ASSETS: CITIES ---
const CITIES = [
  {
    id: "all",
    name: "All",
    image: require("../../assets/images/Dwarkadish-temple.jpg"),
  },
  {
    id: "Vrindavan",
    name: "Vrindavan",
    image: require("../../assets/images/prem-mandir.jpg"),
  },
  {
    id: "Mathura",
    name: "Mathura",
    image: require("../../assets/images/Krishna-Janambhumi.png"),
  },

  {
    id: "Govardhan",
    name: "Govardhan",
    image: require("../../assets/images/Govardhan.jpg"),
  },
];

// --- 2. LOCAL ASSETS: PLACES (TEMPLES) ---
const PLACES = [
  {
    id: "1",
    name: "Prem Mandir",
    city: "Vrindavan",
    rating: 4.9,
    distance: "2.5 km",
    image: require("../../assets/images/prem-mandir.jpg"),
  },
  {
    id: "2",
    name: "Banke Bihari",
    city: "Vrindavan",
    rating: 4.8,
    distance: "3.8 km",
    image: require("../../assets/images/banke-bihari.jpg"),
  },
  {
    id: "3",
    name: "Janmabhoomi",
    city: "Mathura",
    rating: 4.9,
    distance: "1.2 km",
    image: require("../../assets/images/Krishna-Janambhumi.png"),
  },
  {
    id: "4",
    name: "Govardhan Hill",
    city: "Govardhan",
    rating: 4.9,
    distance: "15 km",
    image: require("../../assets/images/Govardhan.jpg"),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // State
  const [activeCity, setActiveCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Real Data State for Hotels
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Hotels from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getHotels();
        setHotels(data);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredPlaces = useMemo(() => {
    return PLACES.filter((p) => {
      const matchCity = activeCity === "all" || p.city === activeCity;
      const matchSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCity && matchSearch;
    });
  }, [activeCity, searchQuery]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const cityString = h.location || "";
      const matchCity = activeCity === "all" || cityString.includes(activeCity);
      const matchSearch = h.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCity && matchSearch;
    });
  }, [activeCity, searchQuery, hotels]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF5A1F" />
        <Text className="text-gray-500 mt-4">Finding best stays...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="px-6 pt-4 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Location
            </Text>
            <TouchableOpacity
              onPress={() => setActiveCity("all")}
              className="flex-row items-center mt-1"
            >
              <Feather name="map-pin" size={18} color="#FF5A1F" />
              <Text className="text-gray-900 font-bold text-xl ml-1">
                {activeCity === "all" ? "All Braj Area" : activeCity}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color="gray"
                className="ml-1"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-10 h-10 rounded-full border border-gray-200"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center border border-orange-200">
                <Text className="text-[#FF5A1F] font-bold text-lg">
                  {user?.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View className="mx-6 mt-6 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search hotel, temple, city..."
            className="flex-1 ml-3 text-gray-900 font-medium"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Feather name="sliders" size={20} color="#9CA3AF" />
        </View>

        {/* POPULAR DESTINATIONS (Using Local Assets) */}
        <View className="mt-8">
          <View className="px-6 mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Popular Destinations
            </Text>
            <Text className="text-gray-500 text-xs">Cities you must visit</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 20 }}
          >
            {CITIES.map((item) => {
              const isActive = activeCity === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveCity(isActive ? "all" : item.id)}
                  className="items-center space-y-2"
                >
                  <View
                    className={`w-16 h-16 rounded-full bg-gray-100 items-center justify-center overflow-hidden border-2 ${isActive ? "border-[#FF5A1F]" : "border-transparent"}`}
                  >
                    {/* ✅ Local Asset Image */}
                    <Image
                      source={item.image}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    className={`text-xs font-medium ${isActive ? "text-[#FF5A1F] font-bold" : "text-gray-600"}`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* EXPLORE NEARBY (Using Local Assets) */}
        <View className="mt-8">
          <View className="px-6 flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Explore Nearby
            </Text>
            <TouchableOpacity onPress={() => setActiveCity("all")}>
              <Text className="text-[#FF5A1F] font-bold text-xs">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  className="w-48 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden pb-3"
                  onPress={() => router.push(`/details/${place.id}` as any)}
                >
                  {/* ✅ Local Asset Image */}
                  <Image
                    source={place.image}
                    className="w-full h-32 bg-gray-200"
                    resizeMode="cover"
                  />
                  <View className="px-3 pt-3">
                    <Text
                      className="font-bold text-gray-900 text-sm mb-1"
                      numberOfLines={1}
                    >
                      {place.name}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Feather name="map-pin" size={10} color="#FF5A1F" />
                        <Text className="text-gray-500 text-[10px] ml-1">
                          {place.distance}
                        </Text>
                      </View>
                      <View className="bg-green-100 px-1.5 py-0.5 rounded flex-row items-center">
                        <Text className="text-green-700 font-bold text-[10px] mr-1">
                          {place.rating}
                        </Text>
                        <FontAwesome name="star" size={8} color="green" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-400 italic px-6">
                No places found in this area.
              </Text>
            )}
          </ScrollView>
        </View>

        {/* RECOMMENDED STAYS (Using API Data - Remote URLs) */}
        <View className="mt-8 px-6">
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Recommended Stays
            </Text>
            <Text className="text-gray-500 text-xs">
              Handpicked hotels for your comfort
            </Text>
          </View>

          <View className="gap-6">
            {filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <TouchableOpacity
                  key={hotel.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
                  onPress={() => router.push(`/details/${hotel.id}` as any)}
                >
                  <View>
                    {/* ✅ Hotels still use { uri: ... } because they come from the API */}
                    <Image
                      source={{ uri: hotel.image }}
                      className="w-full h-48"
                      resizeMode="cover"
                    />
                    <TouchableOpacity className="absolute top-4 right-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center backdrop-blur-md">
                      <Feather name="heart" size={20} color="white" />
                    </TouchableOpacity>
                    {hotel.tag && (
                      <View className="absolute bottom-4 left-4 bg-[#FF5A1F] px-3 py-1 rounded-lg">
                        <Text className="text-white text-xs font-bold uppercase">
                          {hotel.tag}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="p-5 bg-[#1A1A1A]">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-4">
                        <Text
                          className="text-white text-xl font-bold"
                          numberOfLines={1}
                        >
                          {hotel.title}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Feather name="map-pin" size={14} color="#9CA3AF" />
                          <Text
                            className="text-gray-400 text-sm ml-1 capitalize"
                            numberOfLines={1}
                          >
                            {hotel.location}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-400 text-xs">Per Night</Text>
                        <Text className="text-white text-2xl font-bold">
                          {hotel.price}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center mt-6 pt-4 border-t border-gray-800">
                      <View className="flex-row items-center space-x-2">
                        <FontAwesome name="star" size={14} color="#F59E0B" />
                        <Text className="text-white font-bold ml-1">
                          {hotel.rating}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          (Verified)
                        </Text>
                      </View>

                      <TouchableOpacity className="flex-row items-center bg-white px-4 py-2 rounded-full">
                        <Text className="text-black font-bold mr-2">
                          Book Now
                        </Text>
                        <Feather
                          name="arrow-up-right"
                          size={18}
                          color="black"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center py-10 bg-gray-50 rounded-xl">
                <Text className="text-gray-400">
                  No hotels found{" "}
                  {activeCity !== "all" ? `in ${activeCity}` : ""}.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
