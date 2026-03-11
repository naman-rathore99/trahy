import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define what our database booking looks like
interface Booking {
  id: string;
  listingName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
  serviceType: string;
  createdAt: any;
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Live Data from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("customer.userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const fetchedBookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];

        setBookings(fetchedBookings);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Helper functions to make the data look pretty in your UI
  const formatStatus = (status: string) => {
    if (status === "pending_payment") return "Pending";
    // Capitalizes first letter (e.g., "confirmed" -> "Confirmed")
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Dates TBD";
    const date = new Date(dateString);
    // Returns formats like "12 Feb"
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getIcon = (serviceType: string) => {
    return serviceType === "hotel_stay" ? "bed" : "car";
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090B]">
      <SafeAreaView className="flex-1">
        <View className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            My Trips
          </Text>
        </View>

        {/* 3. Show Loading, Empty State, or Your Beautiful List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#5f259f" />
          </View>
        ) : bookings.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="airplane-outline" size={64} color="gray" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 text-center">
              No trips booked yet
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              When you complete a booking, it will show up here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity className="bg-white dark:bg-[#111827] p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 shadow-sm flex-row items-center">
                <View className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl items-center justify-center mr-4">
                  <Ionicons
                    name={getIcon(item.serviceType)}
                    size={24}
                    color="gray"
                  />
                </View>
                <View className="flex-1 pr-2">
                  <Text
                    className="font-bold text-gray-900 dark:text-white text-base"
                    numberOfLines={1}
                  >
                    {item.listingName}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {formatDate(item.checkIn)} • {formatStatus(item.status)}
                  </Text>
                </View>
                <Text className="font-bold text-[#FF5A1F] text-base">
                  ₹{item.totalAmount?.toLocaleString("en-IN") || 0}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
