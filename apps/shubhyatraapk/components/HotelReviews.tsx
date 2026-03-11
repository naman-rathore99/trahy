import { app } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ⚠️ IMPORTANT: Replace with your actual live Next.js backend URL
const API_BASE_URL = "https://shubhyatra.world";

interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function HotelReviews({
  hotelId,
  isDark,
}: {
  hotelId: string;
  isDark: boolean;
}) {
  const auth = getAuth(app);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // New Review State
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Reviews on Mount
  useEffect(() => {
    fetchReviews();
  }, [hotelId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews?hotelId=${hotelId}`);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit a New Review
  const submitReview = async () => {
    if (newRating === 0) {
      Alert.alert("Missing Rating", "Please select a star rating first!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "You must be logged in to leave a review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId,
          rating: newRating,
          text: newText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Thank you for your review!");
        setNewRating(0);
        setNewText("");
        fetchReviews(); // Refresh the list
      } else {
        throw new Error(data.error || "Failed to submit review");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color="#FF5A1F"
          />
        ))}
      </View>
    );
  };

  if (loading) return <ActivityIndicator color="#FF5A1F" className="my-6" />;

  return (
    <View className="mt-2 mb-10">
      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Guest Reviews ({reviews.length})
      </Text>

      {/* --- ADD A REVIEW SECTION --- */}
      <View className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
        <Text className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
          Leave a Review
        </Text>

        {/* Interactive Star Selector */}
        <View className="flex-row gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
              <Ionicons
                name={star <= newRating ? "star" : "star-outline"}
                size={36}
                color={
                  star <= newRating ? "#FF5A1F" : isDark ? "#4B5563" : "#D1D5DB"
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Share your experience (optional)"
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={newText}
          onChangeText={setNewText}
          multiline
          className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl min-h-[100px] text-gray-900 dark:text-white text-base border border-gray-100 dark:border-gray-700 mb-4"
          textAlignVertical="top"
        />

        <TouchableOpacity
          onPress={submitReview}
          disabled={isSubmitting}
          className={`py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
            isSubmitting ? "bg-[#FF5A1F]/50" : "bg-[#FF5A1F]"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- REVIEWS LIST --- */}
      {reviews.length === 0 ? (
        <Text className="text-gray-500 text-center italic mb-4">
          No reviews yet. Be the first!
        </Text>
      ) : (
        <View className="gap-4">
          {reviews.map((review) => (
            <View
              key={review.id}
              className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-gray-100 dark:border-gray-800"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-[#FF5A1F]/10 rounded-full items-center justify-center">
                    <Text className="text-[#FF5A1F] font-black text-xl">
                      {review.user.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900 dark:text-white text-base mb-1">
                      {review.user}
                    </Text>
                    {renderStars(review.rating, 14)}
                  </View>
                </View>
                <Text className="text-xs text-gray-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {review.text ? (
                <Text className="text-gray-600 dark:text-gray-300 mt-2 leading-6">
                  "{review.text}"
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
