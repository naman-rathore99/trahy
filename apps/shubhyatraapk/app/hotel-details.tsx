import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ 1. Import the Review Component we built
import HotelReviews from "@/components/HotelReviews";

export default function HotelDetails() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock Data (In real app, this comes from API based on ID passed via params)
  const hotel = {
    id: "5zDWuUa76DNxfAO2L7AT", // Mock ID to pass to the review component
    name: "Nidhivan Sarovar",
    location: "Vrindavan, Mathura",
    rating: 4.8,
    reviews: 128,
    price: "₹4,500",
    description:
      "Experience luxury in the heart of Vrindavan. Walking distance from Prem Mandir and Banke Bihari Temple. Enjoy our pure veg restaurant and spa facilities.",
    amenities: ["Free WiFi", "AC", "Restaurant", "Parking", "Spa", "Pool"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=500",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=500",
    ],
  };

  // Helper to pass data to checkout
  const handleBookNow = () => {
    router.push({
      pathname: "/checkout",
      params: {
        listingId: hotel.id,
        listingName: hotel.name,
        totalAmount: 4500, // Derived from your price/nights logic
        checkIn: "2026-03-10", // Example data
        checkOut: "2026-03-12",
        guests: 2,
      },
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <StatusBar style="light" />

      {/* --- Hero Image Section --- */}
      <View className="relative h-72">
        <Image
          source={{ uri: hotel.images[0] }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20" />

        {/* Header Actions */}
        <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-6 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
              <Ionicons name="share-social" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#FF5A1F" : "white"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1 -mt-6 bg-white dark:bg-[#09090B] rounded-t-[30px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6">
          {/* Title & Rating */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                {hotel.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="location" size={14} color="#FF5A1F" />
                <Text className="text-gray-500 text-sm">{hotel.location}</Text>
              </View>
            </View>
            <View className="items-end">
              <View className="bg-green-500/10 px-2 py-1 rounded flex-row items-center gap-1">
                <Text className="text-green-600 font-bold text-sm">
                  {hotel.rating}
                </Text>
                <Ionicons name="star" size={12} color="#16A34A" />
              </View>
              <Text className="text-gray-400 text-xs mt-1">
                {hotel.reviews} reviews
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-6" />

          {/* Gallery Thumbnails */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Gallery
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 px-6 mb-6"
          >
            {hotel.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                className="w-32 h-24 rounded-xl mr-3"
              />
            ))}
          </ScrollView>

          {/* Description */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            About
          </Text>
          <Text className="text-gray-500 leading-6 mb-6">
            {hotel.description}{" "}
            <Text className="text-[#FF5A1F] font-bold">Read More</Text>
          </Text>

          {/* Amenities */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Amenities
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {hotel.amenities.map((item, index) => (
              <View
                key={index}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                <Text className="text-gray-600 dark:text-gray-400 text-xs font-bold">
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ✅ 2. INTEGRATE THE REVIEWS COMPONENT HERE */}
          <View className="h-[1px] bg-gray-100 dark:bg-gray-800 mb-6" />
          <HotelReviews hotelId={hotel.id} isDark={isDark} />
        </View>
      </ScrollView>

      {/* --- Bottom Action Bar --- */}
      <View className="p-6 bg-white dark:bg-[#09090B] border-t border-gray-100 dark:border-gray-800 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Total Price
          </Text>
          <View className="flex-row items-end gap-1">
            <Text className="text-2xl font-black text-gray-900 dark:text-white">
              {hotel.price}
            </Text>
            <Text className="text-gray-500 text-xs mb-1 font-medium">
              / night
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleBookNow}
          className="bg-[#FF5A1F] px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/30"
        >
          <Text className="text-white font-bold text-lg">Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
