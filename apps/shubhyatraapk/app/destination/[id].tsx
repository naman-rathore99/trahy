import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import { useCollection } from "../../hooks/useFirestore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- HELPERS ---
const parsePrice = (price: any) => {
  if (!price) return 0;
  return parseInt(String(price).replace(/[^0-9]/g, "")) || 0;
};

const formatDate = (date: Date | null) => {
  if (!date) return "Select Date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

type Room = {
  id: string;
  type: string;
  basePrice: string | number;
  discountPrice?: string | number;
};

const FALLBACK_ROOMS = [
  { id: "std", type: "Standard", basePrice: "1200", discountPrice: "1000" },
  { id: "dlx", type: "Deluxe", basePrice: "2500", discountPrice: "2200" },
];

const DUMMY_RENTALS = [
  { id: "r1", name: "Scooty", price: "400", type: "scooter", icon: "bicycle" },
  {
    id: "r2",
    name: "Royal Enfield",
    price: "800",
    type: "bike",
    icon: "bicycle",
  },
  {
    id: "r3",
    name: "Thar 4x4",
    price: "3500",
    type: "jeep",
    icon: "car-sport",
  },
];

export default function DestinationDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // --- DATA FETCHING ---
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: allVehicles } = useCollection("vehicles");

  // --- STATE ---
  const [checkInDate, setCheckInDate] = useState<Date | null>(new Date());
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  // ✅ REPLACED TABS WITH RADIO BUTTON STATE
  const [stayType, setStayType] = useState<"single" | "multiple">("single");
  const [nights, setNights] = useState(1);

  const [transportMode, setTransportMode] = useState<"cab" | "rent">("cab");
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // --- 📅 DATE CALCULATION LOGIC ---
  const checkOutDate = checkInDate ? new Date(checkInDate) : null;
  if (checkOutDate) {
    checkOutDate.setDate(checkOutDate.getDate() + nights);
  }

  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();

  const generateRealCalendar = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const hotelId = Array.isArray(id) ? id[0] : id;
        const hotelDoc = await getDoc(doc(db, "hotels", hotelId));

        if (hotelDoc.exists()) {
          const hotelData = { id: hotelDoc.id, ...hotelDoc.data() };
          setHotel(hotelData);

          const roomsSnap = await getDocs(
            collection(db, "hotels", hotelId, "rooms"),
          );
          if (!roomsSnap.empty) {
            const dbRooms = roomsSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Room[];
            setRooms(dbRooms);
            setSelectedRoom(dbRooms[0]);
          } else {
            setRooms(FALLBACK_ROOMS);
            setSelectedRoom(FALLBACK_ROOMS[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- PRICING LOGIC ---
  const cabs = allVehicles.filter(
    (v) =>
      !v.type?.toLowerCase().includes("bike") &&
      !v.type?.toLowerCase().includes("scooter"),
  );
  const vehicleList = transportMode === "cab" ? cabs : DUMMY_RENTALS;

  const getRoomPrice = (room: Room) =>
    parsePrice(room.discountPrice || room.basePrice);

  const currentRoomPrice = selectedRoom
    ? getRoomPrice(selectedRoom)
    : hotel
      ? parsePrice(hotel.pricePerNight)
      : 0;
  const hotelTotal = currentRoomPrice * nights;
  const vehiclePrice = selectedVehicle
    ? parsePrice(selectedVehicle.price || selectedVehicle.pricePerDay)
    : 0;
  const grandTotal = hotelTotal + vehiclePrice;

  const displayImages =
    hotel?.imageUrls?.length > 0
      ? hotel.imageUrls
      : [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=500",
        ];

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width,
    );
    if (slide !== activeSlide) setActiveSlide(slide);
  };

  const renderCalendar = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const calendarDays = generateRealCalendar();

    return (
      <Modal visible={isCalendarVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-900 w-full rounded-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-500 text-xs font-bold uppercase">
                  Select Check-in Date
                </Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentMonth} {currentYear}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarVisible(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={20} color="black" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-2">
              {weekDays.map((d) => (
                <Text
                  key={d}
                  className="w-10 text-center font-bold text-gray-400 text-xs uppercase"
                >
                  {d}
                </Text>
              ))}
            </View>
            <View className="flex-row flex-wrap justify-between">
              {calendarDays.map((day, index) => {
                if (day === null)
                  return (
                    <View key={`empty-${index}`} className="w-10 h-10 mb-2" />
                  );

                const targetDate = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  day,
                );
                const isSelected =
                  checkInDate && targetDate.getTime() === checkInDate.getTime();
                const isPast =
                  day < today.getDate() &&
                  targetDate.getMonth() === today.getMonth();

                return (
                  <TouchableOpacity
                    key={`day-${index}`}
                    disabled={isPast}
                    onPress={() => {
                      setCheckInDate(targetDate);
                      setCalendarVisible(false);
                    }}
                    className={`w-10 h-10 items-center justify-center rounded-full mb-2 ${isSelected ? "bg-[#FF5A1F]" : ""}`}
                  >
                    <Text
                      className={`font-bold ${isSelected ? "text-white" : isPast ? "text-gray-300" : "text-gray-900 dark:text-white"}`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleBooking = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert("Date Missing", "Please select a date to proceed.");
      return;
    }
    router.push({
      pathname: "/checkout",
      params: {
        listingId: hotel.id,
        listingName: hotel.name || hotel.title,
        checkIn: checkInDate.toISOString().split("T")[0],
        checkOut: checkOutDate.toISOString().split("T")[0],
        totalAmount: grandTotal.toString(),
      },
    });
  };

  if (loading || !hotel)
    return (
      <View className="flex-1 justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <StatusBar style="light" />
      {renderCalendar()}

      {/* IMAGE CAROUSEL */}
      <View className="h-[40%] w-full relative">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {displayImages.map((img: string | undefined, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={{ width: SCREEN_WIDTH, height: "100%" }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        <View className="absolute top-12 left-6 right-6 flex-row justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/30 rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 bg-white dark:bg-gray-900 -mt-8 rounded-t-[32px] px-6 pt-8 shadow-2xl">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {hotel.name || hotel.title}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {hotel.location || "Mathura"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xl font-bold text-[#FF5A1F]">
                ₹{currentRoomPrice}
              </Text>
              <Text className="text-gray-400 text-[10px]">per night</Text>
            </View>
          </View>

          {/* ROOM SELECTOR */}
          <Text className="font-bold text-gray-900 dark:text-white mt-4 mb-3">
            Room Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 px-6 mb-6"
          >
            {rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => setSelectedRoom(room)}
                  className={`mr-3 px-5 py-3 rounded-xl border-2 min-w-[120px] ${isSelected ? "bg-orange-50 border-[#FF5A1F]" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                >
                  <Text
                    className={`font-bold text-sm mb-1 ${isSelected ? "text-[#FF5A1F]" : "text-gray-900 dark:text-white"}`}
                  >
                    {room.type || "Standard"}
                  </Text>
                  <Text
                    className={`font-bold text-xs ${isSelected ? "text-[#FF5A1F]" : "text-gray-500"}`}
                  >
                    ₹{getRoomPrice(room)}
                  </Text>
                  {isSelected && (
                    <View className="absolute top-2 right-2">
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FF5A1F"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ✅ CRASH-PROOF RADIO BUTTONS: Stay Duration */}
          <Text className="font-bold text-gray-900 dark:text-white mb-3">
            Stay Duration
          </Text>
          <View className="flex-row gap-6 mb-4">
            <TouchableOpacity
              onPress={() => {
                setStayType("single");
                setNights(1);
              }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name={
                  stayType === "single" ? "radio-button-on" : "radio-button-off"
                }
                size={22}
                color={stayType === "single" ? "#FF5A1F" : "gray"}
              />
              <Text
                className={`text-sm font-bold ${stayType === "single" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                1 Night
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setStayType("multiple");
                setNights(2);
              }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name={
                  stayType === "multiple"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color={stayType === "multiple" ? "#FF5A1F" : "gray"}
              />
              <Text
                className={`text-sm font-bold ${stayType === "multiple" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Multiple Nights
              </Text>
            </TouchableOpacity>
          </View>

          {/* SMART DATE RENDERER */}
          {stayType === "single" ? (
            <TouchableOpacity
              onPress={() => setCalendarVisible(true)}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase">
                  Check-in Date
                </Text>
                <Text className="font-bold text-[#FF5A1F] text-base mt-1">
                  {formatDate(checkInDate)}
                </Text>
              </View>
              <Ionicons name="calendar" size={24} color="#FF5A1F" />
            </TouchableOpacity>
          ) : (
            <View>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setCalendarVisible(true)}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <Text className="text-gray-400 text-[10px] font-bold uppercase">
                    Check-in
                  </Text>
                  <Text className="font-bold text-[#FF5A1F] text-sm mt-1">
                    {formatDate(checkInDate)}
                  </Text>
                </TouchableOpacity>
                <View className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase">
                    Check-out
                  </Text>
                  <Text className="font-bold text-gray-900 dark:text-white text-sm mt-1">
                    {formatDate(checkOutDate)}
                  </Text>
                </View>
              </View>

              {/* Nights Adjuster */}
              <View className="flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <Text className="font-bold text-gray-900 dark:text-white">
                  Total Nights
                </Text>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => setNights(Math.max(2, nights - 1))}
                  >
                    <Ionicons name="remove-circle" size={28} color="#D1D5DB" />
                  </TouchableOpacity>
                  <Text className="font-bold text-lg text-gray-900 dark:text-white w-6 text-center">
                    {nights}
                  </Text>
                  <TouchableOpacity onPress={() => setNights(nights + 1)}>
                    <Ionicons name="add-circle" size={28} color="#FF5A1F" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ✅ CRASH-PROOF RADIO BUTTONS: Add Ride */}
          <Text className="font-bold text-gray-900 dark:text-white mb-3 mt-2">
            Add a Ride? (Optional)
          </Text>
          <View className="flex-row gap-6 mb-4">
            <TouchableOpacity
              onPress={() => {
                setTransportMode("cab");
                setSelectedVehicle(null);
              }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name={
                  transportMode === "cab"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color={transportMode === "cab" ? "#FF5A1F" : "gray"}
              />
              <Text
                className={`text-sm font-bold ${transportMode === "cab" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                With Driver
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTransportMode("rent");
                setSelectedVehicle(null);
              }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name={
                  transportMode === "rent"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color={transportMode === "rent" ? "#FF5A1F" : "gray"}
              />
              <Text
                className={`text-sm font-bold ${transportMode === "rent" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
              >
                Self Drive
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {vehicleList.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setSelectedVehicle(isSelected ? null : v)}
                  className={`mr-2 p-2 w-28 rounded-xl border ${isSelected ? "bg-orange-50 border-[#FF5A1F]" : "bg-white border-gray-200"}`}
                >
                  <Ionicons
                    name={
                      (v.icon as any) ||
                      (v.type?.includes("bike") ? "bicycle" : "car-sport")
                    }
                    size={20}
                    color={isSelected ? "#FF5A1F" : "gray"}
                  />
                  <Text className="font-bold text-xs mt-1" numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text className="text-[#FF5A1F] text-[10px] font-bold">
                    ₹{parsePrice(v.pricePerDay || v.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Total */}
          <View className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-4 flex-row justify-between items-center">
            <Text className="font-bold text-gray-500">Total Estimate</Text>
            <Text className="font-bold text-[#FF5A1F] text-2xl">
              ₹{grandTotal.toLocaleString("en-IN")}
            </Text>
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8">
        <TouchableOpacity
          onPress={handleBooking}
          className="w-full bg-[#FF5A1F] py-4 rounded-2xl flex-row justify-center items-center shadow-lg"
        >
          <Text className="text-white font-bold text-lg mr-2">
            Proceed to Checkout
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
