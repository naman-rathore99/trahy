"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  MapPin,
  Wifi,
  Car,
  Tv,
  Snowflake,
  Droplets,
  Waves,
  Star,
  X,
  Bike,
  Zap,
  Users,
  CheckCircle,
  Utensils,
  Maximize2,
  Share2,
  Heart,
  ChevronDown,
  Plus,
  Minus,
  Send,
  User,
  BedDouble,
  Bath,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import {
  format,
  parseISO,
  differenceInDays,
  isValid,
  addDays,
  isBefore,
} from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- CONFIGURATION ---
const VEHICLE_OPTIONS = [
  {
    id: "bike",
    label: "2-Wheeler",
    icon: <Bike size={20} />,
    price: 400,
    desc: "Scooty",
  },
  {
    id: "auto",
    label: "Auto",
    icon: <Zap size={20} />,
    price: 800,
    desc: "Rickshaw",
  },
  {
    id: "car",
    label: "Cab",
    icon: <Car size={20} />,
    price: 2000,
    desc: "AC Car",
  },
  {
    id: "suv",
    label: "SUV",
    icon: <Users size={20} />,
    price: 3000,
    desc: "Innova",
  },
];

const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Free Wi-Fi", icon: <Wifi size={16} /> },
  parking: { label: "Free Parking", icon: <Car size={16} /> },
  ac: { label: "AC", icon: <Snowflake size={16} /> },
  geyser: { label: "Hot Water", icon: <Droplets size={16} /> },
  tv: { label: "TV", icon: <Tv size={16} /> },
  pool: { label: "Pool", icon: <Waves size={16} /> },
  dining: { label: "Dining", icon: <Utensils size={16} /> },
};

// --- HELPER: CATEGORIZE ROOMS ---
const getRoomCategory = (room: any) => {
  const name = (room.name || "").toLowerCase();
  const price = Number(room.price);
  if (name.includes("suite") || price > 5000) return "Luxury";
  if (name.includes("deluxe") || (price >= 2500 && price <= 5000))
    return "Deluxe";
  return "Standard";
};

// --- MOCK REVIEWS ---
const MOCK_REVIEWS = [
  {
    id: 1,
    user: "Amit Sharma",
    rating: 5,
    date: "Oct 12, 2025",
    text: "Excellent stay! The location near the temple is perfect.",
  },
  {
    id: 2,
    user: "Priya Verma",
    rating: 4,
    date: "Nov 05, 2025",
    text: "Rooms were clean, but food service was a bit slow.",
  },
];

export default function HotelDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);

  // --- STATE ---
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>(MOCK_REVIEWS);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // UI State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isShareCopied, setIsShareCopied] = useState(false);

  // Booking State
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(
    Number(searchParams.get("children") || 0)
  );
  const [vehicleType, setVehicleType] = useState<string | null>(null);

  // Review State
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);

  // Popover Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"range" | "single">("range");

  // Math
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Refs
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        console.log("Fetching hotel ID:", id);
        const hotelData = await apiRequest(`/api/public/hotels/${id}`, "GET");

        console.log("API Response:", hotelData);

        if (!hotelData || !hotelData.hotel) {
          throw new Error("API returned empty hotel data. ID might be wrong.");
        }

        setHotel({ ...hotelData.hotel, hasVehicle: true });

        const fetchedRooms = hotelData.rooms || [];
        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) setSelectedRoom(fetchedRooms[0]);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setErrorMsg(err.message || "Failed to load hotel");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- CALCULATE PRICE ---
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);

      if (isValid(start) && isValid(end) && isBefore(start, end)) {
        const diff = differenceInDays(end, start);
        setNights(diff);

        const basePrice = selectedRoom
          ? Number(selectedRoom.price)
          : Number(hotel.price || hotel.pricePerNight);
        const roomTotal = diff * basePrice;

        let vehicleTotal = 0;
        if (vehicleType) {
          const v = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
          if (v) vehicleTotal = v.price * diff;
        }
        setTotalPrice(roomTotal + vehicleTotal);
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  }, [checkIn, checkOut, hotel, selectedRoom, vehicleType]);

  // --- CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestRef.current && !guestRef.current.contains(event.target as Node))
        setIsGuestOpen(false);
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      )
        setIsCalendarOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  // ✅ ADDED BACK: Function to select today quickly
  const selectTonight = () => {
    const now = new Date();
    setCheckIn(format(now, "yyyy-MM-dd"));
    setCheckOut(format(addDays(now, 1), "yyyy-MM-dd"));
    setBookingMode("single");
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (val: any) => {
    if (bookingMode === "single" && val) {
      const date = val as Date;
      setCheckIn(format(date, "yyyy-MM-dd"));
      setCheckOut(format(addDays(date, 1), "yyyy-MM-dd"));
      setIsCalendarOpen(false);
    } else {
      const range = val as DateRange;
      if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
      if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
    }
  };

  const handleReserve = () => {
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true);
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push(`/login?redirect=/hotels/${id}`);
      return;
    }

    const queryParams = new URLSearchParams({
      id: hotel.id,
      name: hotel.name,
      start: checkIn,
      end: checkOut,
      adults: adults.toString(),
      children: children.toString(),
      roomId: selectedRoom?.id || "standard",
      roomName: selectedRoom?.type || selectedRoom?.name || "Standard Room",
      price: (selectedRoom
        ? Number(selectedRoom.price)
        : Number(hotel.price || hotel.pricePerNight)
      ).toString(),
    });

    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find((opt) => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }
    router.push(`/book/hotel?${queryParams.toString()}`);
  };

  // --- RENDER LOADING ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );

  // --- RENDER ERROR ---
  if (errorMsg || !hotel)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-black p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full">
          <ShieldAlert size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hotel Not Found
        </h2>
        <div className="max-w-md bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-left font-mono text-xs text-gray-600 dark:text-gray-300 overflow-auto">
          <p className="mb-2 font-bold">Debug Info:</p>
          <p>ID Requested: {id}</p>
          <p>Error: {errorMsg || "Unknown Error"}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-all"
        >
          Return Home
        </button>
      </div>
    );

  const galleryImages =
    hotel.images && hotel.images.length > 0
      ? hotel.images
      : ["/placeholder-hotel.jpg"];
  const filteredRooms = rooms.filter(
    (r) => activeTab === "All" || getRoomCategory(r) === activeTab
  );

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-24 lg:pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      <style jsx global>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #e11d48;
          --rdp-background-color: #e11d48;
          margin: 0;
        }
        .rdp-day_selected:not([disabled]) {
          color: white;
          background-color: var(--rdp-accent-color);
        }
        .rdp-button:hover:not([disabled]) {
          background-color: #fce7f3;
          color: #e11d48;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* --- LEFT: GALLERY --- */}
          <div className="h-fit lg:sticky lg:top-24">
            <div className="flex flex-col-reverse md:flex-row gap-4 h-[400px] md:h-[500px]">
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 shrink-0 h-20 md:h-full">
                {galleryImages.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 md:w-full md:h-20 aspect-square shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImageIndex === idx ? "border-rose-600 opacity-100" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Thumb ${idx}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden relative group border border-gray-100 dark:border-gray-800">
                <img
                  src={galleryImages[activeImageIndex]}
                  alt="Hotel Main"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
                  onClick={() => setLightboxIndex(activeImageIndex)}
                />
                <button
                  onClick={() => setLightboxIndex(activeImageIndex)}
                  className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/40 transition-all text-white"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT: DETAILS & OPTIONS --- */}
          <div className="space-y-8">
            {/* 1. Header & Price */}
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
                    {hotel.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-md text-yellow-700 dark:text-yellow-500 font-bold">
                      <Star size={14} className="fill-current" /> 4.8
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {hotel.location || hotel.address}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 relative"
                  >
                    {isShareCopied ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <Share2 size={18} />
                    )}
                  </button>
                  <button className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-colors text-gray-500">
                    <Heart size={18} />
                  </button>
                </div>
              </div>

              <div className="text-3xl font-extrabold text-rose-600 flex items-baseline gap-2">
                ₹
                {selectedRoom
                  ? Number(selectedRoom.price).toLocaleString("en-IN")
                  : Number(hotel.price || hotel.pricePerNight).toLocaleString(
                      "en-IN"
                    )}
                <span className="text-sm text-gray-400 font-normal">
                  / night
                </span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* 2. Description & Amenities */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">About this place</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                  {hotel.description ||
                    "Experience luxury at its finest. This property offers modern amenities, excellent hospitality, and close proximity to major spiritual attractions in Mathura."}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {hotel.amenities?.slice(0, 6).map(
                    (id: string) =>
                      AMENITY_MAP[id.toLowerCase()] && (
                        <span
                          key={id}
                          className="text-xs font-medium px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-2"
                        >
                          {AMENITY_MAP[id.toLowerCase()].icon}{" "}
                          {AMENITY_MAP[id.toLowerCase()].label}
                        </span>
                      )
                  )}
                </div>
              </div>
            </div>

            {/* 3. Room Selection (Improved Grid) */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <BedDouble size={18} className="text-rose-600" /> Select Room
                Type
              </h3>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
                {["All", "Standard", "Deluxe", "Luxury"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === tab ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${selectedRoom?.id === room.id ? "border-rose-600 bg-rose-50/50 dark:bg-rose-900/10" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {getRoomCategory(room)}
                      </span>
                      {selectedRoom?.id === room.id && (
                        <CheckCircle size={16} className="text-rose-600" />
                      )}
                    </div>
                    <div className="font-bold text-base leading-tight mb-1">
                      {room.type || room.name}
                    </div>
                    <div className="flex gap-2 text-[10px] text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> Max {room.maxAdults || 2}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble size={12} /> King Bed
                      </span>
                    </div>
                    <div className="text-rose-600 font-black text-lg">
                      ₹{room.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Booking Widget */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-4">Your Trip</h3>

              <div className="grid grid-cols-2 gap-4 relative">
                <div
                  ref={calendarRef}
                  className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-3 cursor-pointer hover:border-rose-500 transition-colors"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Dates
                  </label>
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {checkIn
                      ? `${format(parseISO(checkIn), "dd MMM")} - ${checkOut ? format(parseISO(checkOut), "dd MMM") : "Checkout"}`
                      : "Select Dates"}
                  </div>

                  {isCalendarOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl z-50 p-4 w-[320px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DayPicker
                        mode="range"
                        selected={{
                          from: checkIn ? parseISO(checkIn) : undefined,
                          to: checkOut ? parseISO(checkOut) : undefined,
                        }}
                        onSelect={handleDateSelect}
                        disabled={{ before: today }}
                      />
                      <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        {/* ✅ ADDED BACK: Today Button */}
                        <button
                          onClick={selectTonight}
                          className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-sm font-bold text-rose-600 px-4 py-1"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  ref={guestRef}
                  className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-3 cursor-pointer hover:border-rose-500 transition-colors relative"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Guests
                  </label>
                  <div className="font-bold text-sm">
                    {adults + children} Guests
                  </div>

                  {isGuestOpen && (
                    <div
                      className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-4 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="font-bold text-sm">Adults</p>
                          <p className="text-xs text-gray-500">Age 13+</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(Math.max(1, adults - 1));
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-4 text-center">
                            {adults}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(adults + 1);
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">Children</p>
                          <p className="text-xs text-gray-500">Age 2-12</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(Math.max(0, children - 1));
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-4 text-center">
                            {children}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(children + 1);
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle */}
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-2">
                  {VEHICLE_OPTIONS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() =>
                        setVehicleType(vehicleType === v.id ? null : v.id)
                      }
                      className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${vehicleType === v.id ? "border-black bg-black text-white dark:bg-white dark:text-black" : "bg-white dark:bg-black border-gray-200 dark:border-gray-700 hover:border-gray-400"}`}
                    >
                      <div className="flex justify-center mb-1">{v.icon}</div>
                      <div className="text-[9px] font-bold">{v.label}</div>
                      <div className="text-[9px] opacity-70">+₹{v.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="hidden lg:flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                    Total Estimate
                  </p>
                  <div className="text-2xl font-black text-rose-600">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {nights} Nights • {selectedRoom?.name || "Room"}
                  </p>
                </div>
                <button
                  onClick={handleReserve}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  {nights > 0 ? "Book Now" : "Check Availability"}
                </button>
              </div>
            </div>

            {/* --- REVIEWS --- */}
            <div className="pt-8">
              <h3 className="font-bold text-xl mb-6">Guest Reviews</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold text-xs">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{review.user}</p>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={
                                i < review.rating
                                  ? "fill-current"
                                  : "text-gray-300 fill-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE STICKY FOOTER --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 lg:hidden z-40 pb-safe">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Price</p>
            <div className="text-xl font-black text-rose-600">
              ₹{totalPrice.toLocaleString("en-IN")}
            </div>
          </div>
          <button
            onClick={handleReserve}
            className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex-1"
          >
            {nights > 0 ? "Reserve" : "Check Dates"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && galleryImages && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={galleryImages[lightboxIndex]}
            className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}
