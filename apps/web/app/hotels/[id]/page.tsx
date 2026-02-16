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
  Plus,
  Minus,
  User,
  BedDouble,
  Trash2,
  CarFront,
} from "lucide-react";
import {
  format,
  parseISO,
  differenceInDays,
  isValid,
  addDays,
  isBefore,
} from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Link from "next/link";

// --- 1. UPDATED INTERFACES (Flexible for DB variations) ---
interface Room {
  id: string;
  type: string;
  basePrice: string | number;
  discountPrice?: string | number;
  maxAdults?: number;
  maxChildren?: number;
  description?: string;
  images?: string[]; // Arrays of room-specific photos
}

interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt?: { seconds: number } | string | Date;
}

interface Hotel {
  id: string;
  name: string;
  location?: string;
  address?: string;
  price?: number;
  description?: string;
  amenities?: string[];
  // Handle inconsistent DB naming (images vs imageUrls)
  images?: string[];
  imageUrls?: string[];
  mainImage?: string;
  rating?: number;
  hasVehicle?: boolean;
}

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
  // ✅ NEW OPTION ADDED
  {
    id: "self-drive",
    label: "Self Drive",
    icon: <CarFront size={20} />,
    price: 2500,
    desc: "Private Car",
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

// --- HELPERS ---
const getRoomPrice = (room: Room): number => {
  const discount = Number(room.discountPrice);
  const base = Number(room.basePrice);
  return discount && !isNaN(discount) && discount > 0 ? discount : base || 0;
};

const getRoomCategory = (room: Room) => {
  return room.type || "Standard";
};

// --- COMPONENT ---
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
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Review Input State
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

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
    Number(searchParams.get("children") || 0),
  );
  const [vehicleType, setVehicleType] = useState<string | null>(null);

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

  // --- 1. FETCH HOTEL & CHECK ADMIN ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const hotelData = await apiRequest(`/api/public/hotels/${id}`, "GET");
        if (!hotelData || !hotelData.hotel)
          throw new Error("API returned empty hotel data.");

        setHotel({ ...hotelData.hotel, hasVehicle: true });

        const fetchedRooms = hotelData.rooms || [];
        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) setSelectedRoom(fetchedRooms[0]);

        fetchReviews();

        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdTokenResult();
          if (token.claims.role === "admin") setIsAdmin(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load hotel");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, auth.currentUser]);

  // --- 2. FETCH REVIEWS HELPER ---
  const fetchReviews = async () => {
    try {
      const data = await apiRequest(`/api/reviews?hotelId=${id}`, "GET");
      if (data && data.reviews) setReviews(data.reviews);
    } catch (e) {
      console.error("Review fetch error", e);
    }
  };

  // --- 3. SUBMIT REVIEW ---
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return router.push("/login");
    setSubmittingReview(true);
    try {
      const res = await apiRequest("/api/reviews", "POST", {
        hotelId: id,
        rating: reviewRating,
        text: reviewText,
      });
      setReviews((prev) => [
        {
          id: "temp-" + Date.now(),
          user: auth.currentUser?.displayName || "Me",
          rating: reviewRating,
          text: reviewText,
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setReviewText("");
      if (hotel) setHotel({ ...hotel, rating: res.newRating });
    } catch (error: any) {
      alert("Failed to post review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // --- 4. ADMIN DELETE REVIEW ---
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Admin: Are you sure you want to delete this review?")) return;
    try {
      await apiRequest("/api/admin/delete-review", "POST", {
        hotelId: id,
        reviewId,
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      alert("Delete failed");
    }
  };

  // --- CALCULATE PRICE ---
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      if (isValid(start) && isValid(end) && isBefore(start, end)) {
        const diff = differenceInDays(end, start);
        setNights(diff);

        let basePrice = 0;
        if (selectedRoom) basePrice = getRoomPrice(selectedRoom);
        if (!basePrice) basePrice = Number(hotel.price || 0);

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

  // Click Outside
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  const selectTonight = () => {
    const now = new Date();
    setCheckIn(format(now, "yyyy-MM-dd"));
    setCheckOut(format(addDays(now, 1), "yyyy-MM-dd"));
    setBookingMode("single");
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (val: any) => {
    if (bookingMode === "single" && val) {
      setCheckIn(format(val, "yyyy-MM-dd"));
      setCheckOut(format(addDays(val, 1), "yyyy-MM-dd"));
      setIsCalendarOpen(false);
    } else {
      if (val?.from) setCheckIn(format(val.from, "yyyy-MM-dd"));
      if (val?.to) setCheckOut(format(val.to, "yyyy-MM-dd"));
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
    if (!hotel) return;

    let finalPrice = 0;
    if (selectedRoom) finalPrice = getRoomPrice(selectedRoom);
    else finalPrice = Number(hotel.price || 0);

    const queryParams = new URLSearchParams({
      id: hotel.id,
      name: hotel.name,
      start: checkIn,
      end: checkOut,
      adults: adults.toString(),
      children: children.toString(),
      roomId: selectedRoom?.id || "standard",
      roomName: selectedRoom?.type || "Standard Room",
      price: finalPrice.toString(),
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  if (errorMsg || !hotel)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white">
        <h2 className="text-2xl font-bold">Hotel Not Found</h2>
      </div>
    );

  // --- 🔥 FIXED IMAGE AGGREGATION LOGIC ---
  // 1. Gather Hotel Images (Handle inconsistently named DB fields)
  const hotelImages = hotel.images?.length
    ? hotel.images
    : hotel.imageUrls?.length
      ? hotel.imageUrls
      : [];
  if (hotelImages.length === 0 && hotel.mainImage)
    hotelImages.push(hotel.mainImage);

  // 2. Gather Room Images (Flatten all room images)
  const roomImages = rooms.flatMap((r) => r.images || []);

  // 3. Combine & Deduplicate
  const allRawImages = [...hotelImages, ...roomImages];
  const galleryImages = Array.from(new Set(allRawImages)).filter(Boolean); // Remove duplicates & nulls

  // 4. Fallback
  if (galleryImages.length === 0) galleryImages.push("/placeholder-hotel.jpg");

  // --- DYNAMIC TABS LOGIC ---
  const availableCategories = Array.from(new Set(rooms.map(getRoomCategory)));
  const sortOrder = ["Standard", "Deluxe", "Luxury", "Suite"];
  availableCategories.sort(
    (a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
  );
  const availableTabs =
    availableCategories.length > 0 ? ["All", ...availableCategories] : [];
  const filteredRooms = rooms.filter(
    (r) => activeTab === "All" || getRoomCategory(r) === activeTab,
  );
  const displayPrice = selectedRoom
    ? getRoomPrice(selectedRoom)
    : rooms.length > 0
      ? getRoomPrice(rooms[0])
      : hotel.price || 0;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-24 lg:pb-20 transition-colors duration-200">
      <Navbar variant="default" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* LEFT: GALLERY (Now showing combined images) */}
          <div className="h-fit lg:sticky lg:top-24">
            <div className="flex flex-col-reverse md:flex-row gap-4 h-[400px] md:h-[500px]">
              <div className="flex md:flex-col gap-3 overflow-auto no-scrollbar md:w-20 shrink-0 h-20 md:h-full">
                {galleryImages.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 aspect-square rounded-xl overflow-hidden cursor-pointer border-2 ${activeImageIndex === idx ? "border-rose-600" : "border-transparent dark:border-gray-800"}`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Thumb ${idx}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex-1 rounded-3xl overflow-hidden relative group bg-gray-100 dark:bg-gray-900">
                <img
                  src={galleryImages[activeImageIndex] || galleryImages[0]}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  onClick={() => setLightboxIndex(activeImageIndex)}
                  alt="Main Hotel"
                />
                <button
                  onClick={() => setLightboxIndex(activeImageIndex)}
                  className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-900 dark:text-white">
                    {hotel.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-0.5 rounded-md font-bold">
                      <Star size={14} className="fill-current" />{" "}
                      {hotel.rating || "New"}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {hotel.location || hotel.address}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                  >
                    {isShareCopied ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <Share2 size={18} />
                    )}
                  </button>
                  <button className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <Heart size={18} />
                  </button>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-rose-600 flex items-baseline gap-2">
                ₹{displayPrice.toLocaleString("en-IN")}
                <span className="text-sm text-gray-400 font-normal">
                  / night
                </span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                About
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                {hotel.description || "Experience luxury at its finest."}
              </p>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Amenities
              </h3>
              <div className="flex flex-wrap gap-3">
                {hotel.amenities?.slice(0, 6).map((id: string) => {
                  const key = id.toLowerCase();
                  const amenity = AMENITY_MAP[key];
                  return amenity ? (
                    <span
                      key={id}
                      className="text-xs font-medium px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      {amenity.icon} {amenity.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {rooms.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <BedDouble size={18} className="text-rose-600" /> Select Room
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeTab === tab ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredRooms.map((room) => {
                    const price = getRoomPrice(room);
                    const basePrice = Number(room.basePrice);
                    const hasDiscount = price < basePrice;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer relative overflow-hidden transition-all ${selectedRoom?.id === room.id ? "border-rose-600 bg-rose-50/50 dark:bg-rose-900/10" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                            {getRoomCategory(room)}
                          </span>
                          {selectedRoom?.id === room.id && (
                            <CheckCircle size={16} className="text-rose-600" />
                          )}
                        </div>
                        <div className="font-bold text-base mb-1 text-gray-900 dark:text-white">
                          {room.type}
                        </div>
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{basePrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          <div className="text-rose-600 font-black text-lg">
                            ₹{price.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOOKING WIDGET */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                Your Trip
              </h3>
              <div className="grid grid-cols-2 gap-4 relative">
                <div
                  ref={calendarRef}
                  className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Dates
                  </label>
                  <div className="font-bold text-sm truncate text-gray-900 dark:text-white">
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
                        <button
                          onClick={selectTonight}
                          className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-sm font-bold text-rose-600"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  ref={guestRef}
                  className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer relative"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Guests
                  </label>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {adults + children} Guests
                  </div>
                  {isGuestOpen && (
                    <div
                      className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-4 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            Adults
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(Math.max(1, adults - 1));
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                            {adults}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(adults + 1);
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            Children
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(Math.max(0, children - 1));
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                            {children}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(children + 1);
                            }}
                            className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VEHICLE GRID (With Self Drive Added) */}
              <div className="mt-4">
                <div className="grid grid-cols-5 gap-2">
                  {VEHICLE_OPTIONS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() =>
                        setVehicleType(vehicleType === v.id ? null : v.id)
                      }
                      className={`p-2 rounded-xl border text-center cursor-pointer transition-colors ${vehicleType === v.id ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white" : "bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"}`}
                    >
                      <div className="flex justify-center mb-1">{v.icon}</div>
                      <div className="text-[9px] font-bold whitespace-nowrap">
                        {v.label}
                      </div>
                      <div className="text-[9px] opacity-70">+₹{v.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="text-2xl font-black text-rose-600">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </div>
                <button
                  onClick={handleReserve}
                  className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-rose-700 transition-colors"
                >
                  {nights > 0 ? "Book Now" : "Check Availability"}
                </button>
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="pt-8">
              <h3 className="font-bold text-xl mb-6 flex justify-between items-center text-gray-900 dark:text-white">
                Guest Reviews
                <span className="text-sm font-normal text-gray-500">
                  {reviews.length} reviews
                </span>
              </h3>

              {auth.currentUser ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-6"
                >
                  <p className="text-sm font-bold mb-2 text-gray-900 dark:text-white">
                    Write a Review
                  </p>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`${star <= reviewRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                      >
                        <Star size={24} className="fill-current" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white mb-3 text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                  <button
                    disabled={submittingReview}
                    type="submit"
                    className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Please{" "}
                  <Link href="/login">
                    <span className="text-rose-600 font-bold hover:underline">
                      login
                    </span>
                  </Link>{" "}
                  to write a review.
                </div>
              )}

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl relative group"
                  >
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="absolute bottom-4 right-4 text-gray-400 hover:text-red-600 p-1 "
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 font-bold text-xs">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                          {review.user}
                        </p>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={
                                i < review.rating
                                  ? "fill-current"
                                  : "text-gray-300 fill-gray-300 dark:text-gray-700 dark:fill-gray-700"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">
                        {typeof review.createdAt === "object" &&
                        "seconds" in review.createdAt!
                          ? new Date(
                              review.createdAt.seconds * 1000,
                            ).toLocaleDateString()
                          : "Just now"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {review.text}
                    </p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-gray-400 text-sm">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FOOTER */}
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

      {/* LIGHTBOX */}
      {lightboxIndex !== null && galleryImages && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={galleryImages[lightboxIndex]}
            className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
            alt="Lightbox"
          />
        </div>
      )}
    </main>
  );
}
