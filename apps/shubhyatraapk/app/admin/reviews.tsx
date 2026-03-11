import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define TypeScript Interfaces for safety
interface Review {
  id: string;
  hotelId: string;
  hotelName: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface GroupedHotel {
  id: string;
  name: string;
  reviewCount: number;
  reviews: Review[];
}

export default function AdminReviews() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- STATES ---
  const [groupedReviews, setGroupedReviews] = useState<GroupedHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- 🔄 FIRESTORE INTEGRATION ---
  useEffect(() => {
    // Assuming you have a root 'reviews' collection where each doc has a 'hotelId' and 'hotelName'
    const q = query(collection(db, "reviews"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rawReviews: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            hotelId: data.hotelId || "unknown_hotel",
            hotelName: data.hotelName || "Unknown Property",
            user: data.userName || "Anonymous",
            rating: data.rating || 0,
            comment: data.comment || "No comment provided.",
            date: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleDateString()
              : "Just now",
          };
        });

        // 🧠 Group the flat reviews array by Hotel ID so the UI accordion works
        const groupedMap = rawReviews.reduce(
          (acc: Record<string, GroupedHotel>, review) => {
            if (!acc[review.hotelId]) {
              acc[review.hotelId] = {
                id: review.hotelId,
                name: review.hotelName,
                reviewCount: 0,
                reviews: [],
              };
            }
            acc[review.hotelId].reviews.push(review);
            acc[review.hotelId].reviewCount += 1;
            return acc;
          },
          {},
        );

        // Convert the map back to an array
        const groupedArray = Object.values(groupedMap);
        setGroupedReviews(groupedArray);

        // Auto-expand the first item if none is expanded
        if (groupedArray.length > 0 && !expandedId) {
          setExpandedId(groupedArray[0].id);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // --- 🗑️ DELETE REVIEW LOGIC ---
  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to permanently delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reviews", reviewId));
              // Note: onSnapshot will automatically update the UI after deletion!
            } catch (error) {
              Alert.alert("Error", "Failed to delete the review.");
            }
          },
        },
      ],
    );
  };

  // --- 🔍 LOCAL SEARCH FILTER ---
  const filteredHotels = groupedReviews.filter((hotel) => {
    const queryLower = searchQuery.toLowerCase();
    return hotel.name.toLowerCase().includes(queryLower);
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/admin/dashboard" as any);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 bg-white dark:bg-black flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleBack}
              className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full border border-gray-200 dark:border-gray-800"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <View>
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Hotel Reviews
              </Text>
              <Text className="text-gray-500 text-xs">
                Manage reviews category-wise
              </Text>
            </View>
          </View>

          {/* Search Bar (Mini version for Header) */}
          <View className="w-1/3 flex-row items-center bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl px-3 h-10">
            <Ionicons
              name="search"
              size={16}
              color={isDark ? "gray" : "#9CA3AF"}
            />
            <TextInput
              placeholder="Search..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-gray-900 dark:text-white text-xs p-0"
            />
          </View>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#FF5A1F" className="mt-10" />
          ) : filteredHotels.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons
                name="star-half-outline"
                size={64}
                color={isDark ? "#374151" : "#D1D5DB"}
              />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No reviews found.
              </Text>
            </View>
          ) : (
            filteredHotels.map((hotel) => (
              <View
                key={hotel.id}
                className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4 shadow-sm dark:shadow-none"
              >
                {/* Accordion Header */}
                <TouchableOpacity
                  onPress={() => toggleExpand(hotel.id)}
                  className="bg-gray-50 dark:bg-[#1f2937] p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-transparent"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 bg-pink-50 dark:bg-pink-500/10 rounded-xl items-center justify-center border border-pink-100 dark:border-pink-500/20">
                      <Ionicons name="business" size={20} color="#EC4899" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-gray-900 dark:text-white font-bold text-base"
                        numberOfLines={1}
                      >
                        {hotel.name}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {hotel.reviewCount}{" "}
                        {hotel.reviewCount === 1 ? "Review" : "Reviews"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={
                      expandedId === hotel.id ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color={isDark ? "gray" : "#9CA3AF"}
                  />
                </TouchableOpacity>

                {/* Reviews List (Collapsible) */}
                {expandedId === hotel.id && (
                  <View>
                    {/* Table Header */}
                    <View className="flex-row px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
                      <Text className="flex-[2] text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">
                        User
                      </Text>
                      <Text className="flex-1 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">
                        Rating
                      </Text>
                      <Text className="flex-[3] text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">
                        Comment
                      </Text>
                      <Text className="flex-1 text-right text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">
                        Action
                      </Text>
                    </View>

                    {/* Rows */}
                    {hotel.reviews.map((r) => (
                      <View
                        key={r.id}
                        className="flex-row px-4 py-4 border-b border-gray-100 dark:border-gray-800 items-center"
                      >
                        {/* User */}
                        <View className="flex-[2] pr-2">
                          <Text
                            className="text-gray-900 dark:text-white font-bold text-xs"
                            numberOfLines={1}
                          >
                            {r.user}
                          </Text>
                          <Text className="text-gray-500 dark:text-gray-600 text-[10px]">
                            {r.date}
                          </Text>
                        </View>

                        {/* Rating */}
                        <View className="flex-1">
                          <View className="bg-yellow-50 dark:bg-yellow-500/10 self-start flex-row items-center gap-1 px-1.5 py-0.5 rounded border border-yellow-100 dark:border-yellow-500/20">
                            <Ionicons name="star" size={10} color="#F59E0B" />
                            <Text className="text-yellow-600 dark:text-[#F59E0B] text-[10px] font-bold">
                              {r.rating}
                            </Text>
                          </View>
                        </View>

                        {/* Comment */}
                        <Text
                          className="flex-[3] text-gray-600 dark:text-gray-400 text-xs pr-2"
                          numberOfLines={3}
                        >
                          {r.comment}
                        </Text>

                        {/* Actions */}
                        <View className="flex-1 flex-row justify-end gap-3">
                          <TouchableOpacity>
                            <Ionicons name="pencil" size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteReview(r.id)}
                          >
                            <Ionicons name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
