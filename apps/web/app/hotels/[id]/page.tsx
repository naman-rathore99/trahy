"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
  Coffee,
  Bath,
  Refrigerator,
  MountainSnow,
  Shirt,
  Dumbbell,
  MonitorSmartphone,
  Check,
  Clock,
  Route,
  Briefcase,
  Map,
  ShieldCheck,
  Sparkles,
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

interface Room {
  id: string;
  type: string;
  basePrice: string | number;
  discountPrice?: string | number;
  maxAdults?: number;
  maxChildren?: number;
  description?: string;
  images?: string[];
}
interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt?: any;
}
interface Hotel {
  id: string;
  name: string;
  location?: string;
  address?: string;
  price?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string;
  mainImage?: string;
  rating?: number;
  hasVehicle?: boolean;
  ownerId?: string;
}

const VEHICLE_OPTIONS = [
  {
    id: "bike",
    label: "2-Wheeler",
    icon: <Bike size={24} />,
    price: 400,
    desc: "Quick city rides",
  },
  {
    id: "auto",
    label: "Auto Rickshaw",
    icon: <Zap size={24} />,
    price: 800,
    desc: "Local sightseeing",
  },
  {
    id: "car",
    label: "Standard Cab",
    icon: <Car size={24} />,
    price: 2000,
    desc: "Comfortable AC drop",
  },
  {
    id: "suv",
    label: "Premium SUV",
    icon: <Users size={24} />,
    price: 3000,
    desc: "Best for families",
  },
  {
    id: "self-drive",
    label: "Self Drive",
    icon: <CarFront size={24} />,
    price: 2500,
    desc: "Drive yourself",
  },
];

const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Free Wi-Fi", icon: <Wifi size={18} /> },
  parking: { label: "Free Parking", icon: <Car size={18} /> },
  ac: { label: "AC", icon: <Snowflake size={18} /> },
  geyser: { label: "Hot Water", icon: <Bath size={18} /> },
  tv: { label: "TV", icon: <Tv size={18} /> },
  pool: { label: "Pool", icon: <Waves size={18} /> },
  dining: { label: "Dining", icon: <Utensils size={18} /> },
  breakfast: { label: "Breakfast", icon: <Coffee size={18} /> },
  fridge: { label: "Mini Fridge", icon: <Refrigerator size={18} /> },
  room_service: { label: "Room Service", icon: <Utensils size={18} /> },
  balcony: { label: "Balcony", icon: <MountainSnow size={18} /> },
  housekeeping: { label: "Housekeeping", icon: <Shirt size={18} /> },
  gym: { label: "Gym Access", icon: <Dumbbell size={18} /> },
  smart_tv: { label: "Smart TV", icon: <MonitorSmartphone size={18} /> },
};

const getRoomPrice = (room: Room): number => {
  const discount = Number(room.discountPrice);
  const base = Number(room.basePrice);
  return discount && !isNaN(discount) && discount > 0 ? discount : base || 0;
};
const getRoomCategory = (room: Room) => room.type || "Standard";

export default function HotelDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Core Booking State
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [arrivalTime, setArrivalTime] = useState(
    searchParams.get("time") || "14:00",
  );
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(
    Number(searchParams.get("children") || 0),
  );

  // Travel Extras State
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [platformPricing, setPlatformPricing] = useState({
    transferBase: 250,
    transferPerKm: 20,
  });
  const [needTransfer, setNeedTransfer] = useState(
    searchParams.get("needCab") === "true",
  );
  const [transferPickup, setTransferPickup] = useState(
    searchParams.get("cabPickup") || "",
  );
  const [transferTime, setTransferTime] = useState(
    searchParams.get("cabTime") || searchParams.get("time") || "10:00",
  );
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [calculatedTransferFare, setCalculatedTransferFare] = useState(0);
  const [delayProtection, setDelayProtection] = useState(false);
  const WAITING_FEE_PRICE = 200;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

        const pricingRef = doc(db, "settings", "pricing");
        const pricingSnap = await getDoc(pricingRef);
        if (pricingSnap.exists()) {
          const pData = pricingSnap.data();
          setPlatformPricing({
            transferBase: pData.transferBase || 250,
            transferPerKm: pData.transferPerKm || 20,
          });
        }
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

  useEffect(() => {
    if (!needTransfer || !transferPickup) {
      setCalculatedDistance(0);
      setCalculatedTransferFare(0);
      return;
    }
    const pickup = transferPickup.toLowerCase();
    let estimatedKm = 10;
    if (pickup.includes("agra") || pickup.includes("taj")) estimatedKm = 60;
    else if (pickup.includes("delhi") || pickup.includes("ndls"))
      estimatedKm = 150;
    else if (pickup.includes("vrindavan") || pickup.includes("premmandir"))
      estimatedKm = 15;
    else if (pickup.includes("airport")) estimatedKm = 65;
    setCalculatedDistance(estimatedKm);
    setCalculatedTransferFare(
      platformPricing.transferBase +
        estimatedKm * platformPricing.transferPerKm,
    );
  }, [transferPickup, needTransfer, platformPricing]);

  const fetchReviews = async () => {
    try {
      const data = await apiRequest(`/api/reviews?hotelId=${id}`, "GET");
      if (data && data.reviews) setReviews(data.reviews);
    } catch (e) {
      console.error(e);
    }
  };

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

  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      if (isValid(start) && isValid(end) && isBefore(start, end)) {
        const diff = differenceInDays(end, start);
        setNights(diff);
        let basePrice = selectedRoom
          ? getRoomPrice(selectedRoom)
          : Number(hotel.price || 0);
        const roomTotal = diff * basePrice;
        let vehicleTotal = 0;
        if (vehicleType) {
          const v = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
          if (v) vehicleTotal = v.price * diff;
        }
        let finalTransferTotal = needTransfer ? calculatedTransferFare : 0;
        if (needTransfer && delayProtection)
          finalTransferTotal += WAITING_FEE_PRICE;
        setTotalPrice(roomTotal + vehicleTotal + finalTransferTotal);
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  }, [
    checkIn,
    checkOut,
    hotel,
    selectedRoom,
    vehicleType,
    needTransfer,
    calculatedTransferFare,
    delayProtection,
  ]);

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

  const handleDateSelect = (val: any) => {
    if (val?.from) setCheckIn(format(val.from, "yyyy-MM-dd"));
    if (val?.to) setCheckOut(format(val.to, "yyyy-MM-dd"));
  };

  const bestImage =
    hotel?.mainImage ||
    hotel?.imageUrl ||
    (hotel?.imageUrls && hotel.imageUrls[0]) ||
    (hotel?.images && hotel.images[0]) ||
    "/placeholder.jpg";
  const displayPrice = selectedRoom
    ? getRoomPrice(selectedRoom)
    : rooms.length > 0
      ? getRoomPrice(rooms[0])
      : hotel?.price || 0;

  const handleReserve = () => {
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true);
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!auth.currentUser) return router.push(`/login?redirect=/hotels/${id}`);
    if (!hotel) return;

    const queryParams = new URLSearchParams({
      id: hotel.id,
      name: hotel.name,
      image: bestImage,
      start: checkIn,
      end: checkOut,
      checkInTime: arrivalTime,
      adults: adults.toString(),
      children: children.toString(),
      roomId: selectedRoom?.id || "standard",
      roomName: selectedRoom?.type || "Standard Room",
      price: displayPrice.toString(),
      partnerId: hotel.ownerId || "UNKNOWN",
    });

    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find((opt) => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }

    if (needTransfer) {
      queryParams.set("needCab", "true");
      queryParams.set("cabPickup", transferPickup);
      queryParams.set("cabTime", transferTime);
      queryParams.set("cabPrice", calculatedTransferFare.toString());
      queryParams.set("delayProtection", delayProtection.toString());
      queryParams.set("cabDistance", calculatedDistance.toString());
    }

    router.push(`/book/hotel?${queryParams.toString()}`);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  if (errorMsg || !hotel)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#09090B]">
        <h2 className="text-2xl font-bold">Hotel Not Found</h2>
      </div>
    );

  const allRawImages = [
    hotel.mainImage,
    hotel.imageUrl,
    ...(hotel.imageUrls || []),
    ...(hotel.images || []),
    ...rooms.flatMap((r) => r.images || []),
  ];
  const galleryImages = Array.from(new Set(allRawImages)).filter(
    Boolean,
  ) as string[];

  // Pad images to make sure mosaic looks good
  while (galleryImages.length < 5) {
    galleryImages.push(galleryImages[0] || "/placeholder.jpg");
  }

  const availableCategories = Array.from(
    new Set(rooms.map(getRoomCategory)),
  ).sort(
    (a, b) =>
      ["Standard", "Deluxe", "Luxury", "Suite"].indexOf(a) -
      ["Standard", "Deluxe", "Luxury", "Suite"].indexOf(b),
  );
  const availableTabs =
    availableCategories.length > 0 ? ["All", ...availableCategories] : [];
  const filteredRooms = rooms.filter(
    (r) => activeTab === "All" || getRoomCategory(r) === activeTab,
  );

  return (
    <main className="min-h-screen bg-white dark:bg-[#09090B] text-gray-900 dark:text-gray-100 pb-24 lg:pb-20">
      <Navbar variant="default" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 md:pt-40">
        {/* --- 1. PREMIUM HEADER --- */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={12} /> Top Rated Stay
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-gray-900 dark:text-white leading-tight">
                {hotel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1 text-gray-900 dark:text-white font-bold">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />{" "}
                  {hotel.rating || "New"}{" "}
                  <span className="font-normal text-gray-500 underline ml-1">
                    ({reviews.length} reviews)
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 hover:underline cursor-pointer">
                  <MapPin size={16} className="text-rose-600" />
                  {hotel.location || hotel.address}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold transition-all shadow-sm"
              >
                {isShareCopied ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <Share2 size={16} />
                )}{" "}
                {isShareCopied ? "Copied" : "Share"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold transition-all shadow-sm">
                <Heart size={16} /> Save
              </button>
            </div>
          </div>
        </div>

        {/* --- 2. THE AIRBNB-STYLE MOSAIC GALLERY --- */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[450px] mb-12 rounded-3xl overflow-hidden shadow-sm">
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={galleryImages[0]}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              alt="Main"
            />
          </div>
          <div
            className="col-span-1 row-span-1 relative cursor-pointer group"
            onClick={() => setLightboxIndex(1)}
          >
            <img
              src={galleryImages[1]}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              alt="Thumb 1"
            />
          </div>
          <div
            className="col-span-1 row-span-1 relative cursor-pointer group"
            onClick={() => setLightboxIndex(2)}
          >
            <img
              src={galleryImages[2]}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              alt="Thumb 2"
            />
          </div>
          <div
            className="col-span-1 row-span-1 relative cursor-pointer group"
            onClick={() => setLightboxIndex(3)}
          >
            <img
              src={galleryImages[3]}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              alt="Thumb 3"
            />
          </div>
          <div
            className="col-span-1 row-span-1 relative cursor-pointer group"
            onClick={() => setLightboxIndex(4)}
          >
            <img
              src={galleryImages[4]}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
              alt="Thumb 4"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
                <Map size={16} /> Show all photos
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Gallery Fallback */}
        <div className="md:hidden flex overflow-x-auto gap-2 snap-x snap-mandatory mb-8 no-scrollbar -mx-4 px-4">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="w-[85vw] h-[250px] shrink-0 snap-center rounded-2xl overflow-hidden"
              onClick={() => setLightboxIndex(idx)}
            >
              <img src={img} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* --- 3. TWO-COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* LEFT: CONTENT (Wide Area) */}
          <div className="xl:col-span-2 space-y-12">
            {/* Quick Stats Bar */}
            <div className="flex flex-wrap gap-6 py-6 border-y border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Guests
                  </p>
                  <p className="text-sm text-gray-500">
                    Up to {adults + children}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BedDouble size={24} className="text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Rooms
                  </p>
                  <p className="text-sm text-gray-500">Private & Secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Verified
                  </p>
                  <p className="text-sm text-gray-500">Trusted Partner</p>
                </div>
              </div>
            </div>

            {/* About */}
            <section>
              <h2 className="text-2xl font-black mb-4 text-gray-900 dark:text-white">
                About this space
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                {hotel.description ||
                  "Experience luxury at its finest. This beautiful property offers everything you need for a comfortable stay in the heart of the city."}
              </p>
            </section>

            {/* Card-Based Amenities */}
            <section>
              <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">
                What this place offers
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities?.map((rawString: string) => {
                  const key = rawString.toLowerCase().trim();
                  let amenity = AMENITY_MAP[key];
                  if (!amenity) {
                    const foundKey = Object.keys(AMENITY_MAP).find((k) =>
                      key.includes(k),
                    );
                    if (foundKey) amenity = AMENITY_MAP[foundKey];
                  }
                  return (
                    <div
                      key={rawString}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-200 font-medium shadow-sm"
                    >
                      <div className="text-rose-600">
                        {amenity?.icon || <Check size={20} />}
                      </div>
                      {amenity?.label || rawString}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Rooms */}
            {rooms.length > 0 && (
              <section className="bg-gray-50 dark:bg-[#111827] -mx-4 sm:mx-0 p-4 sm:p-8 rounded-none sm:rounded-3xl border border-transparent sm:border-gray-100 dark:sm:border-gray-800">
                <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">
                  Choose your room
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === tab ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRooms.map((room) => {
                    const price = getRoomPrice(room);
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer relative transition-all bg-white dark:bg-black ${selectedRoom?.id === room.id ? "border-rose-600 shadow-md" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                            {getRoomCategory(room)}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRoom?.id === room.id ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 dark:border-gray-600"}`}
                          >
                            {selectedRoom?.id === room.id && (
                              <Check size={14} strokeWidth={3} />
                            )}
                          </div>
                        </div>
                        <div className="font-bold text-lg mb-1 text-gray-900 dark:text-white">
                          {room.type}
                        </div>
                        <div className="text-gray-900 dark:text-white font-black text-2xl mt-4">
                          ₹{price.toLocaleString("en-IN")}{" "}
                          <span className="text-sm font-medium text-gray-500">
                            /night
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* PREMIUM TRAVEL EXTRAS */}
            <section>
              <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">
                Upgrade your trip
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add a seamless transfer or rent a vehicle for your stay in
                Mathura.
              </p>

              {/* Add-on 1: Transfer */}
              <div
                className={`p-6 rounded-3xl border-2 transition-all mb-6 ${needTransfer ? "border-rose-600 bg-rose-50/30 dark:bg-rose-900/10 shadow-md" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-gray-300"}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Car size={24} className="text-rose-600" />
                    </div>
                    <div>
                      <span className="font-black text-lg text-gray-900 dark:text-white block">
                        Arrival Transfer
                      </span>
                      <span className="text-sm text-gray-500">
                        Pickup from Station or Airport
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={needTransfer}
                      onChange={(e) => setNeedTransfer(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {needTransfer && (
                  <div className="pt-4 border-t border-rose-100 dark:border-rose-900/30 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 flex items-center gap-3 bg-white dark:bg-[#111827] px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <MapPin size={18} className="text-gray-400" />
                        <input
                          type="text"
                          placeholder="Pickup Point (e.g. Mathura Station)"
                          value={transferPickup}
                          onChange={(e) => setTransferPickup(e.target.value)}
                          className="bg-transparent font-medium outline-none w-full text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="w-full sm:w-40 flex items-center gap-3 bg-white dark:bg-[#111827] px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Clock size={18} className="text-gray-400" />
                        <input
                          type="time"
                          value={transferTime}
                          onChange={(e) => setTransferTime(e.target.value)}
                          className="bg-transparent font-medium outline-none w-full text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {transferPickup && (
                      <div className="bg-white dark:bg-black p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Route size={16} className="text-rose-500" />{" "}
                          Estimated Distance: {calculatedDistance} km
                        </span>
                        <span className="text-xl font-black text-rose-600">
                          + ₹{calculatedTransferFare}
                        </span>
                      </div>
                    )}

                    <div
                      onClick={() => setDelayProtection(!delayProtection)}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all shadow-sm ${delayProtection ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20" : "bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700"}`}
                    >
                      <div
                        className={`mt-1 w-5 h-5 rounded flex items-center justify-center border shrink-0 ${delayProtection ? "bg-amber-500 border-amber-500 text-white" : "border-gray-300 dark:border-gray-600"}`}
                      >
                        {delayProtection && <Check size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            Delay Protection
                          </span>
                          <span className="text-sm font-bold text-amber-600">
                            +₹{WAITING_FEE_PRICE}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Driver waits up to 2 extra hours for delayed
                          trains/flights.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add-on 2: Vehicle Rentals */}
              <div className="p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Bike
                      size={20}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </div>
                  <span className="font-black text-lg text-gray-900 dark:text-white block">
                    Rent a Vehicle
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {VEHICLE_OPTIONS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() =>
                        setVehicleType(vehicleType === v.id ? null : v.id)
                      }
                      className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all ${vehicleType === v.id ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md" : "bg-gray-50 dark:bg-black border-transparent hover:border-gray-300 dark:hover:border-gray-700"}`}
                    >
                      <div className="flex justify-center mb-3 opacity-80">
                        {v.icon}
                      </div>
                      <div className="text-xs font-bold whitespace-nowrap mb-1">
                        {v.label}
                      </div>
                      <div className="text-xs font-black mt-2">
                        +₹{v.price}
                        <span className="font-normal opacity-70">/day</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className="pb-10 pt-4 border-t border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="text-yellow-400 fill-yellow-400" />{" "}
                {hotel.rating || "New"}{" "}
                <span className="text-gray-400 font-medium text-lg">
                  · {reviews.length} Reviews
                </span>
              </h2>

              {auth.currentUser ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-white dark:bg-[#111827] p-6 rounded-3xl mb-8 border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <p className="text-base font-bold mb-3 text-gray-900 dark:text-white">
                    Share your experience
                  </p>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`${star <= reviewRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-700"}`}
                      >
                        <Star size={28} className="fill-current" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you love about this place?"
                    className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                    required
                  />
                  <button
                    disabled={submittingReview}
                    type="submit"
                    className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 dark:bg-[#111827] p-6 rounded-3xl mb-8 text-center border border-gray-200 dark:border-gray-800">
                  <p className="text-gray-600 dark:text-gray-400">
                    Please{" "}
                    <Link href="/login">
                      <span className="text-rose-600 font-bold hover:underline">
                        log in
                      </span>
                    </Link>{" "}
                    to share your experience.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="relative group p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 shadow-sm"
                  >
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-black rounded-full flex items-center justify-center text-gray-500">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-base text-gray-900 dark:text-white">
                          {review.user}
                        </p>
                        <div className="flex text-yellow-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < review.rating
                                  ? "fill-current"
                                  : "text-gray-300 fill-gray-300 dark:text-gray-700"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 🚨 RIGHT: THE CLEAN STICKY BOOKING WIDGET 🚨 */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-28 bg-white dark:bg-[#111827] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="mb-6">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-gray-500 font-medium"> / night</span>
              </div>

              {/* Dates & Guests */}
              <div className="border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden mb-4 relative">
                <div className="flex border-b border-gray-300 dark:border-gray-700">
                  <div
                    className="flex-1 p-3 border-r border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  >
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">
                      Check-in
                    </label>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {checkIn
                        ? format(parseISO(checkIn), "dd/MM/yyyy")
                        : "Add Date"}
                    </span>
                  </div>
                  <div
                    className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  >
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">
                      Checkout
                    </label>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {checkOut
                        ? format(parseISO(checkOut), "dd/MM/yyyy")
                        : "Add Date"}
                    </span>
                  </div>
                </div>
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">
                    Guests
                  </label>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {adults} Adults{" "}
                    {children > 0 ? `, ${children} Children` : ""}
                  </span>
                </div>

                {/* Hidden Dropdowns */}
                {isCalendarOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl z-[60] p-4 w-[320px]"
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
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="w-full mt-2 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold"
                    >
                      Done
                    </button>
                  </div>
                )}
                {isGuestOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-6 z-[60]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <p className="font-bold text-gray-900 dark:text-white">
                        Adults
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                          {adults}
                        </span>
                        <button
                          onClick={() => setAdults(adults + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900 dark:text-white">
                        Children
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                          {children}
                        </span>
                        <button
                          onClick={() => setChildren(children + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Arrival */}
              <div className="mb-6 flex items-center gap-3 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Clock size={18} className="text-gray-400" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wider">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="bg-transparent font-bold text-sm outline-none w-full text-gray-900 dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="space-y-4 mb-6 text-sm text-gray-600 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span className="underline decoration-gray-300 dark:decoration-gray-700 underline-offset-4">
                      ₹{selectedRoom ? getRoomPrice(selectedRoom) : hotel.price}{" "}
                      x {nights} nights
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹
                      {(
                        (selectedRoom
                          ? getRoomPrice(selectedRoom)
                          : hotel.price!) * nights
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {needTransfer && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-500 font-medium">
                      <span>Transfer Add-on</span>
                      <span>+₹{calculatedTransferFare}</span>
                    </div>
                  )}
                  {delayProtection && (
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>Delay Protection</span>
                      <span>+₹{WAITING_FEE_PRICE}</span>
                    </div>
                  )}
                  {vehicleType && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Vehicle Rental</span>
                      <span>
                        +₹
                        {VEHICLE_OPTIONS.find((v) => v.id === vehicleType)
                          ?.price! * nights}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {nights > 0 ? (
                <div className="flex justify-between items-center mb-6 text-xl font-black text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <div className="text-center mb-6 text-sm font-medium text-gray-500">
                  Select dates to view total price
                </div>
              )}

              <button
                onClick={handleReserve}
                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-rose-600/20 hover:bg-rose-700 hover:-translate-y-1 transition-all active:scale-95"
              >
                {nights > 0 ? "Reserve" : "Check Availability"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FOOTER (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-800 p-4 xl:hidden z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Price
            </p>
            <div className="text-2xl font-black text-rose-600">
              ₹{totalPrice.toLocaleString("en-IN")}
            </div>
          </div>
          <button
            onClick={handleReserve}
            className="bg-rose-600 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all"
          >
            {nights > 0 ? "Reserve" : "Check Dates"}
          </button>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-200">
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
