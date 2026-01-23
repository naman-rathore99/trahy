import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getHotelDetails,
  getReviews,
  postReview,
  HotelDetails,
  Review,
  Room,
} from "../service/api";

const { width } = Dimensions.get("window");

// --- CONSTANTS ---
const VEHICLES = [
  { id: "none", name: "No Vehicle", price: 0, icon: "walk" },
  { id: "bike", name: "2-Wheeler", price: 400, icon: "motorbike" },
  { id: "auto", name: "Auto", price: 800, icon: "rickshaw" },
  { id: "cab", name: "Cab", price: 2000, icon: "car" },
];

const getAmenityIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("wifi")) return "wifi";
  if (lowerName.includes("ac") || lowerName.includes("air")) return "wind";
  if (lowerName.includes("tv")) return "tv";
  if (lowerName.includes("parking")) return "truck";
  if (lowerName.includes("food") || lowerName.includes("breakfast"))
    return "coffee";
  if (lowerName.includes("pool")) return "droplet";
  return "check-circle";
};

export default function DetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Data State
  const [data, setData] = useState<HotelDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);

  // Review State
  const [reviewText, setReviewText] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      console.log("🔹 Details Screen Mounted. ID:", id);
      loadAllData();
    }
  }, [id]);

  const loadAllData = async () => {
    setLoading(true);

    try {
      // 1. Fetch Hotel Details
      const hotelData = await getHotelDetails(id as string);
      if (hotelData) {
        console.log("✅ Hotel Loaded:", hotelData.hotel.title);
        console.log("📸 Image URL:", hotelData.hotel.image); // Check this in terminal
        setData(hotelData);

        // Auto-select Room
        if (hotelData.rooms.length > 0) {
          setSelectedRoom(hotelData.rooms[0]);
        } else {
          // Fallback if no rooms found
          setSelectedRoom({
            id: "default",
            name: "Standard Room",
            price: parseInt(hotelData.hotel.price.replace(/\D/g, "")) || 1000,
          });
        }
      }

      // 2. Fetch Reviews (Using your existing API)
      const reviewsData = await getReviews(id as string);
      console.log(`📝 Reviews Loaded: ${reviewsData.length}`);
      setReviews(reviewsData);
    } catch (e) {
      console.error("❌ Error loading details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async () => {
    if (!reviewText.trim())
      return Alert.alert("Error", "Please write a comment");

    setSubmittingReview(true);
    try {
      await postReview(id as string, userRating, reviewText);
      setReviewText("");

      // Refresh reviews after posting
      const newReviews = await getReviews(id as string);
      setReviews(newReviews);

      Alert.alert("Success", "Review posted!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to post. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculations
  const roomPrice = selectedRoom ? selectedRoom.price : 0;
  const totalPrice = roomPrice + selectedVehicle.price;

  if (loading || !data) {
    return (
      <View className="flex-1 bg-[#F4F6F9] justify-center items-center">
        <ActivityIndicator size="large" color="#FF5A1F" />
        <Text className="text-gray-400 mt-2">Loading Hotel...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F4F6F9]">
      <StatusBar style="light" />

      {/* 1. HERO IMAGE */}
      {/* Added bg-gray-300 so you can see the box even if image fails */}
      <View className="w-full h-72 bg-gray-300 relative">
        <Image
          source={{ uri: data.hotel.image }}
          className="w-full h-full"
          resizeMode="cover"
          onError={(e) =>
            console.log("❌ Image Failed to Load:", e.nativeEvent.error)
          }
        />
        <View className="absolute inset-0 bg-black/30" />

        <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-6 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 backdrop-blur-md p-2.5 rounded-full"
          >
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1 -mt-8 bg-[#F4F6F9] rounded-t-[32px] pt-8 px-6 pb-40">
        {/* 2. TITLE & RATING */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-gray-900 text-2xl font-bold">
              {data.hotel.title}
            </Text>
            <View className="flex-row items-center mt-2">
              <Feather name="map-pin" size={14} color="#6B7280" />
              <Text className="text-gray-500 ml-1 text-sm">
                {data.hotel.location}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <View className="bg-green-100 px-2 py-1 rounded-lg flex-row items-center">
              <Ionicons name="star" size={12} color="#16A34A" />
              <Text className="text-green-800 font-bold ml-1 text-xs">
                {data.hotel.rating}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-gray-500 mt-4 leading-5 text-sm">
          {data.hotel.description ||
            "Welcome to our premium stay. Enjoy luxury and comfort."}
        </Text>

        {/* 3. AMENITIES */}
        {data.hotel.amenities.length > 0 && (
          <View className="mt-6">
            <Text className="text-gray-900 text-sm font-bold mb-3 uppercase tracking-wider">
              Amenities
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.hotel.amenities.map((item, index) => (
                <View
                  key={index}
                  className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex-row items-center"
                >
                  <Feather
                    name={getAmenityIcon(item) as any}
                    size={14}
                    color="#FF5A1F"
                  />
                  <Text className="text-gray-600 text-xs font-medium ml-2 capitalize">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-[1px] bg-gray-200 my-6" />

        {/* 4. ROOM SELECTION */}
        {data.rooms.length > 0 ? (
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Select Room
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-6 px-6"
            >
              {data.rooms.map((room) => {
                const isActive = selectedRoom?.id === room.id;
                return (
                  <TouchableOpacity
                    key={room.id}
                    onPress={() => setSelectedRoom(room)}
                    className={`w-36 p-4 rounded-2xl mr-3 border-2 ${isActive ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${isActive ? "text-gray-400" : "text-gray-500"}`}
                      numberOfLines={1}
                    >
                      {room.name}
                    </Text>
                    <Text
                      className={`text-lg font-bold mt-1 ${isActive ? "text-white" : "text-gray-900"}`}
                    >
                      ₹{room.price}
                    </Text>
                    {isActive && (
                      <View className="absolute top-2 right-2">
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#FF5A1F"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          // FALLBACK IF NO ROOMS FOUND
          <View className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
            <Text className="text-orange-800 font-bold">
              Standard Room Available
            </Text>
            <Text className="text-orange-600 text-xs">
              Price included in total.
            </Text>
          </View>
        )}

        {/* 5. REVIEWS SECTION */}
        <View className="mb-8">
          <Text className="text-gray-900 text-lg font-bold mb-4">
            Reviews ({reviews.length})
          </Text>

          {/* Post Review Box */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 shadow-sm">
            <Text className="text-gray-900 font-bold mb-2">Write a Review</Text>
            <View className="flex-row gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserRating(star)}
                >
                  <Ionicons
                    name="star"
                    size={24}
                    color={star <= userRating ? "#EAB308" : "#E5E7EB"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              className="bg-gray-50 p-3 rounded-xl text-gray-900 h-20 text-top border border-gray-200"
            />
            <TouchableOpacity
              onPress={handlePostReview}
              disabled={submittingReview}
              className="bg-gray-900 self-end px-6 py-2.5 rounded-full mt-3"
            >
              {submittingReview ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-bold text-xs">Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* List Reviews */}
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <View
                key={rev.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 mb-3"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center">
                      <Text className="font-bold text-orange-600">
                        {(rev.user || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-bold text-gray-900">
                        {rev.user || "Guest"}
                      </Text>
                      <View className="flex-row gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={10}
                            color={i < rev.rating ? "#EAB308" : "#E5E7EB"}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-[10px]">
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "Just now"}
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm mt-3 ml-11">
                  {rev.text}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 text-center italic">
              No reviews yet. Be the first!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* 6. BOTTOM BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-5 pb-8 border-t border-gray-100 shadow-lg flex-row items-center justify-between z-10">
        <View>
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Total Price
          </Text>
          <View className="flex-row items-end">
            <Text className="text-gray-900 text-3xl font-bold">
              ₹{totalPrice.toLocaleString()}
            </Text>
            {selectedVehicle.price > 0 && (
              <Text className="text-green-600 text-xs font-bold mb-1.5 ml-1">
                (+Ride)
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity className="bg-gray-900 px-8 py-4 rounded-2xl shadow-lg shadow-gray-400">
          <Text className="text-white font-bold text-base">Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
