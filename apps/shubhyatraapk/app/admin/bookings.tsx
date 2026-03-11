import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminBookings() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- PAGINATION & DATA STATES ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- FILTER & SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Cancelled"];
  const PAYMENT_OPTIONS = ["All", "Paid", "Online", "Pay at Pickup"];

  // --- ⏱️ DEBOUNCE EFFECT FOR SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- 🔄 FETCH DATA FROM FIRESTORE ---
  const fetchBookings = async (isLoadMore = false, isRefresh = false) => {
    if (isLoadMore && (!hasMore || loadingMore)) return;

    if (isRefresh) setRefreshing(true);
    else if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let queryConstraints: any[] = [];

      // 1. Apply Server-Side Filters
      if (statusFilter !== "All") {
        // Map UI "Pending" to DB "pending_payment"
        const dbStatus =
          statusFilter === "Pending"
            ? "pending_payment"
            : statusFilter.toLowerCase();
        queryConstraints.push(where("status", "==", dbStatus));
      }
      if (paymentFilter !== "All") {
        const dbPaymentVal = paymentFilter.toLowerCase().replace(/ /g, "_");
        queryConstraints.push(where("paymentMethod", "==", dbPaymentVal));
      }

      // 2. Sort by newest first
      queryConstraints.push(orderBy("createdAt", "desc"));

      // 3. Pagination Limit
      queryConstraints.push(limit(15));

      // 4. Start After cursor for "Load More"
      if (isLoadMore && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, "bookings"), ...queryConstraints);
      const snapshot = await getDocs(q);

      const fetchedBookings = snapshot.docs.map((doc) => {
        const data = doc.data();

        // ✅ EXACT MAPPING BASED ON YOUR DB SCHEMA
        const resolvedListingName =
          data.listingName || data.hotelName || "Property Booking";
        const totalAmount = data.totalAmount || 0;

        // Format dates beautifully
        const dateDisplay = data.checkIn
          ? `${data.checkIn} to ${data.checkOut}`
          : "Date TBD";

        // Format payment text
        const rawPayment =
          data.paymentMethod || data.paymentStatus || "pending";
        const formattedPayment = rawPayment.replace(/_/g, " ");

        // Format status text
        const rawStatus = data.status || "pending";
        const formattedStatus = rawStatus.replace(/_/g, " ");

        return {
          id: doc.id,
          listing: resolvedListingName,
          customer: data.customer?.name || "Unknown Customer",
          date: dateDisplay,
          status: formattedStatus,
          payment: formattedPayment,
          amount: `₹${totalAmount.toLocaleString("en-IN")}`,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(0),
        };
      });

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 15);

      if (isLoadMore) {
        setBookings((prev) => [...prev, ...fetchedBookings]);
      } else {
        setBookings(fetchedBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchBookings(false, false);
  }, [statusFilter, paymentFilter]);

  // --- 🔍 LOCAL SEARCH FILTER ---
  const filteredBookings = bookings.filter((b) => {
    if (!debouncedSearch) return true;
    const queryLower = debouncedSearch.toLowerCase();
    return (
      b.customer.toLowerCase().includes(queryLower) ||
      b.listing.toLowerCase().includes(queryLower) ||
      b.id.toLowerCase().includes(queryLower)
    );
  });

  // --- DYNAMIC STATUS COLORS ---
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "approved":
      case "paid":
        return "#10B981"; // Green
      case "cancelled":
      case "rejected":
      case "failed":
        return "#EF4444"; // Red
      default:
        return "#F59E0B"; // Yellow (Pending / pending payment)
    }
  };

  // --- RENDER ITEMS FOR FLATLIST ---
  const renderItem = ({ item: b }: { item: any }) => {
    const statusColor = getStatusColor(b.status);
    const isPaid =
      b.payment.toLowerCase().includes("online") ||
      b.payment.toLowerCase() === "paid";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/admin/bookings/${b.id}` as any)}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl mb-4 shadow-sm dark:shadow-none active:scale-95"
      >
        <View className="flex-row justify-between mb-3">
          <View className="flex-row gap-3 flex-1 pr-2">
            <View className="bg-orange-50 dark:bg-[#FF5A1F]/10 p-2 rounded-xl border border-orange-100 dark:border-[#FF5A1F]/20 items-center justify-center">
              <Ionicons name="bed" size={20} color="#FF5A1F" />
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-900 dark:text-white font-bold text-base"
                numberOfLines={1}
              >
                {b.listing}
              </Text>
              <Text className="text-gray-500 text-[10px] uppercase tracking-widest">
                ID: {b.id.substring(0, 8)}
              </Text>
            </View>
          </View>
          <Text className="text-gray-900 dark:text-white font-black text-lg">
            {b.amount}
          </Text>
        </View>

        <View className="flex-row justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
          <View className="flex-row gap-2 items-center">
            <View className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-300 dark:border-gray-700">
              <Ionicons
                name="person"
                size={12}
                color={isDark ? "white" : "gray"}
              />
            </View>
            <Text className="text-gray-700 dark:text-gray-300 text-xs font-bold">
              {b.customer}
            </Text>
          </View>
          <Text className="text-gray-500 text-[10px] font-medium">
            {b.date}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-4">
          <View
            className={`px-2 py-1 rounded-md border`}
            style={{
              borderColor: statusColor + "40",
              backgroundColor: statusColor + "10",
            }}
          >
            <Text
              style={{ color: statusColor }}
              className="text-[10px] font-bold uppercase"
            >
              {b.status}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-gray-500 text-[10px] uppercase font-bold">
              Method:
            </Text>
            <View
              className={`px-2 py-1 rounded-md border ${isPaid ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30" : "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30"}`}
            >
              <Text
                className={`${isPaid ? "text-green-600 dark:text-green-500" : "text-orange-600 dark:text-orange-500"} text-[10px] font-bold uppercase`}
              >
                {b.payment}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 bg-white dark:bg-black flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-900">
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/admin/dashboard" as any)
            }
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
              All Bookings
            </Text>
            <Text className="text-gray-500 text-xs">
              Scroll down to load more
            </Text>
          </View>
        </View>

        {/* --- 🔍 Search & Filters --- */}
        <View className="px-6 py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900 z-10">
          <View className="flex-row items-center bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 mb-4">
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              placeholder="Search loaded records..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center mb-3">
            <Text className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold w-16">
              Status
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full border mr-2 ${statusFilter === status ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white" : "bg-transparent border-gray-300 dark:border-gray-700"}`}
                >
                  <Text
                    className={`text-xs font-bold ${statusFilter === status ? "text-white dark:text-black" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-row items-center">
            <Text className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold w-16">
              Payment
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              {PAYMENT_OPTIONS.map((payment) => (
                <TouchableOpacity
                  key={payment}
                  onPress={() => setPaymentFilter(payment)}
                  className={`px-3 py-1.5 rounded-full border mr-2 ${paymentFilter === payment ? "bg-[#FF5A1F] border-[#FF5A1F]" : "bg-transparent border-gray-300 dark:border-gray-700"}`}
                >
                  <Text
                    className={`text-xs font-bold ${paymentFilter === payment ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {payment}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* --- 🚀 FLATLIST: High Performance List --- */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF5A1F" />
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            // Pagination triggers
            onEndReached={() => fetchBookings(true, false)}
            onEndReachedThreshold={0.5}
            // Pull to refresh
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchBookings(false, true)}
                tintColor="#FF5A1F"
              />
            }
            ListEmptyComponent={
              <View className="items-center mt-10">
                <Ionicons
                  name="calendar-outline"
                  size={64}
                  color={isDark ? "#374151" : "#D1D5DB"}
                />
                <Text className="text-gray-400 font-bold text-lg mt-4">
                  No matching bookings.
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#FF5A1F"
                  className="mt-4 mb-8"
                />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
