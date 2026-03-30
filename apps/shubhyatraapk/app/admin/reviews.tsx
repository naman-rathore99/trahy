import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  collectionGroup,
  deleteDoc,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  updateDoc, // 🚨 NEW: Required for saving edits
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
import { db } from "../../config/firebase"; // Adjust path if needed

interface Review {
  id: string;
  ref: DocumentReference;
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

  // 🚨 NEW: Edit Mode States
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // --- 🔄 FIRESTORE INTEGRATION ---
  useEffect(() => {
    let unsubscribe: () => void;

    const setupReviewsWithNames = async () => {
      try {
        const hotelsSnapshot = await getDocs(collection(db, "hotels"));
        const hotelNamesMap: Record<string, string> = {};

        hotelsSnapshot.docs.forEach((doc) => {
          hotelNamesMap[doc.id] = doc.data().name || "Unknown Property";
        });

        const q = query(collectionGroup(db, "reviews"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const rawReviews: Review[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              const hotelId =
                doc.ref.parent.parent?.id || data.hotelId || "unknown";

              return {
                id: doc.id,
                ref: doc.ref,
                hotelId: hotelId,
                hotelName:
                  hotelNamesMap[hotelId] ||
                  data.hotelName ||
                  "Unknown Property",
                user: data.userName || data.user || "Anonymous Guest",
                rating: data.rating || 0,
                comment: data.comment || "No comment provided.",
                date: data.createdAt?.toDate
                  ? data.createdAt.toDate().toLocaleDateString()
                  : "Just now",
              };
            });

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

            const groupedArray = Object.values(groupedMap);
            setGroupedReviews(groupedArray);

            if (groupedArray.length > 0 && !expandedId) {
              setExpandedId(groupedArray[0].id);
            }

            setLoading(false);
          },
          (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error("Error setting up reviews:", error);
        setLoading(false);
      }
    };

    setupReviewsWithNames();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- 🗑️ DELETE REVIEW ---
  const handleDeleteReview = (reviewRef: DocumentReference) => {
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
              await deleteDoc(reviewRef);
            } catch (error) {
              Alert.alert("Error", "Failed to delete the review.");
            }
          },
        },
      ],
    );
  };

  // --- ✏️ EDIT REVIEW LOGIC ---
  const handleStartEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleSaveEdit = async (reviewRef: DocumentReference) => {
    if (!editComment.trim()) {
      Alert.alert("Invalid Input", "Comment cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      // Push the new data exactly to the subcollection reference
      await updateDoc(reviewRef, {
        rating: editRating,
        comment: editComment.trim(),
        isEditedByAdmin: true, // Good practice to track admin overrides
        updatedAt: new Date().toISOString(),
      });

      setEditingReviewId(null);
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update the review.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHotels = groupedReviews.filter((hotel) => {
    return hotel.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleExpand = (id: string) => {
    // If we collapse a tab, cancel any active edits inside it so the UI stays clean
    if (editingReviewId) handleCancelEdit();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] flex-row justify-between items-center">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 active:scale-95"
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={isDark ? "white" : "black"}
              />
            </TouchableOpacity>
            <View>
              <Text className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
                Hotel Reviews
              </Text>
              <Text className="text-gray-500 text-xs font-medium">
                Content Moderation
              </Text>
            </View>
          </View>
        </View>

        {/* --- Search Bar --- */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 h-12 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search properties..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          className="px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FF5A1F" className="mt-10" />
          ) : filteredHotels.length === 0 ? (
            <View className="items-center justify-center mt-20">
              <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
                <Ionicons name="star-half-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-black text-lg">
                No reviews found
              </Text>
              <Text className="text-gray-500 text-center mt-2 text-sm">
                There are no user reviews matching your search.
              </Text>
            </View>
          ) : (
            filteredHotels.map((hotel) => (
              <View
                key={hotel.id}
                className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[24px] overflow-hidden mb-5 shadow-sm"
              >
                {/* Accordion Header */}
                <TouchableOpacity
                  onPress={() => toggleExpand(hotel.id)}
                  className="bg-gray-50 dark:bg-[#1F2937] p-4 flex-row justify-between items-center border-b border-gray-100 dark:border-gray-800/50"
                >
                  <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl items-center justify-center border border-pink-100 dark:border-pink-900/30">
                      <Ionicons name="business" size={20} color="#EC4899" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-gray-900 dark:text-white font-black text-base tracking-tight"
                        numberOfLines={1}
                      >
                        {hotel.name}
                      </Text>
                      <Text className="text-gray-500 text-xs font-bold uppercase mt-0.5">
                        {hotel.reviewCount}{" "}
                        {hotel.reviewCount === 1 ? "Review" : "Reviews"}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white dark:bg-gray-800 w-8 h-8 rounded-full items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                    <Ionicons
                      name={
                        expandedId === hotel.id ? "chevron-up" : "chevron-down"
                      }
                      size={18}
                      color={isDark ? "white" : "black"}
                    />
                  </View>
                </TouchableOpacity>

                {/* Reviews List */}
                {expandedId === hotel.id && (
                  <View className="p-4 bg-white dark:bg-[#111827]">
                    {hotel.reviews.map((r) => {
                      const isEditing = editingReviewId === r.id;

                      return (
                        <View
                          key={r.id}
                          className={`border p-4 rounded-2xl mb-3 ${
                            isEditing
                              ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50"
                              : "bg-gray-50 dark:bg-[#1F2937]/50 border-gray-100 dark:border-gray-800"
                          }`}
                        >
                          <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1 pr-2">
                              <Text className="text-gray-900 dark:text-white font-bold text-sm">
                                {r.user}{" "}
                                {isEditing && (
                                  <Text className="text-blue-500 font-normal">
                                    (Editing)
                                  </Text>
                                )}
                              </Text>
                              <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase mt-0.5">
                                {r.date}
                              </Text>
                            </View>

                            {/* Rating Display / Edit Toggle */}
                            {isEditing ? (
                              <View className="flex-row items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <TouchableOpacity
                                    key={star}
                                    onPress={() => setEditRating(star)}
                                  >
                                    <Ionicons
                                      name={
                                        star <= editRating
                                          ? "star"
                                          : "star-outline"
                                      }
                                      size={18}
                                      color="#F59E0B"
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            ) : (
                              <View className="bg-yellow-50 dark:bg-yellow-900/30 flex-row items-center gap-1 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                                <Ionicons
                                  name="star"
                                  size={12}
                                  color="#F59E0B"
                                />
                                <Text className="text-yellow-700 dark:text-yellow-500 text-xs font-black">
                                  {r.rating.toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Comment Display / Edit Toggle */}
                          {isEditing ? (
                            <TextInput
                              value={editComment}
                              onChangeText={setEditComment}
                              multiline
                              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-blue-200 dark:border-blue-800 rounded-xl p-3 min-h-[80px] mb-4"
                              textAlignVertical="top"
                            />
                          ) : (
                            <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-4">
                              "{r.comment}"
                            </Text>
                          )}

                          {/* Action Buttons */}
                          <View className="flex-row justify-end pt-3 border-t border-gray-200 dark:border-gray-700/50">
                            {isEditing ? (
                              <View className="flex-row gap-3">
                                <TouchableOpacity
                                  onPress={handleCancelEdit}
                                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
                                >
                                  <Text className="text-gray-700 dark:text-gray-300 font-bold text-xs">
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleSaveEdit(r.ref)}
                                  disabled={isSaving}
                                  className="flex-row items-center gap-1 px-4 py-2 rounded-lg bg-blue-600"
                                >
                                  {isSaving ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="white"
                                    />
                                  ) : (
                                    <>
                                      <Ionicons
                                        name="checkmark"
                                        size={14}
                                        color="white"
                                      />
                                      <Text className="text-white font-bold text-xs">
                                        Save
                                      </Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View className="flex-row gap-3">
                                <TouchableOpacity
                                  onPress={() => handleStartEdit(r)}
                                  className="flex-row items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30"
                                >
                                  <Ionicons
                                    name="pencil"
                                    size={14}
                                    color="#3B82F6"
                                  />
                                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                    Edit
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => handleDeleteReview(r.ref)}
                                  className="flex-row items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30"
                                >
                                  <Ionicons
                                    name="trash"
                                    size={14}
                                    color="#EF4444"
                                  />
                                  <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                                    Delete
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
