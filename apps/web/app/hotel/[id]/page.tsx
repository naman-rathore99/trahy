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
  ChevronLeft,
  ChevronRight,
  X,
  Bike,
  Zap,
  Users,
  Share2,
  Heart,
  CheckCircle2,
  ShieldCheck,
  Utensils,
  Tag,
  Percent,
  Bed,
  CheckCircle,
  Filter,
  MessageSquare,
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid, addDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- CONFIGURATION ---
const VEHICLE_OPTIONS = [
  {
    id: "bike",
    label: "2-Wheeler",
    icon: <Bike size={20} />,
    price: 400,
    displayPrice: "400+",
    desc: "Scooty / Bike",
  },
  {
    id: "auto",
    label: "Auto / E-Rickshaw",
    icon: <Zap size={20} />,
    price: 800,
    displayPrice: "800+",
    desc: "City Travel",
  },
  {
    id: "car",
    label: "Car (Taxi)",
    icon: <Car size={20} />,
    price: 2000,
    displayPrice: "2000+",
    desc: "AC Cab for 4",
  },
  {
    id: "suv",
    label: "Large Car (SUV)",
    icon: <Users size={20} />,
    price: 3000,
    displayPrice: "3000+",
    desc: "Innova / Ertiga",
  },
];

const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Free Wi-Fi", icon: <Wifi size={18} /> },
  parking: { label: "Free Parking", icon: <Car size={18} /> },
  ac: { label: "Air Conditioning", icon: <Snowflake size={18} /> },
  geyser: { label: "Hot Water", icon: <Droplets size={18} /> },
  tv: { label: "Smart TV", icon: <Tv size={18} /> },
  pool: { label: "Swimming Pool", icon: <Waves size={18} /> },
  dining: { label: "Restaurant", icon: <Utensils size={18} /> },
};

// ✅ HELPER: Auto-Categorize Rooms
const getRoomCategory = (room: any) => {
  const name = (room.name || "").toLowerCase();
  const price = Number(room.price);

  if (name.includes("suite") || name.includes("luxury") || price > 5000)
    return "Luxury";
  if (
    name.includes("deluxe") ||
    name.includes("super") ||
    (price >= 2500 && price <= 5000)
  )
    return "Deluxe";
  return "Standard";
};

export default function HotelDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [activeTab, setActiveTab] = useState("All");

  // Booking State
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(
    Number(searchParams.get("children") || 0)
  );
  const [vehicleType, setVehicleType] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"range" | "single">("range");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  // Math
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "overview",
        "amenities",
        "rooms",
        "policies",
        "reviews",
      ];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const hotelData = await apiRequest(`/api/hotels/${id}`, "GET");
        setHotel({ ...hotelData.hotel, hasVehicle: true });

        const roomsData = await apiRequest(`/api/hotels/${id}/rooms`, "GET");
        const fetchedRooms = roomsData.rooms || [];
        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) {
          setSelectedRoom(fetchedRooms[0]);
        }
      } catch (err) {
        console.error(err);
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
      if (isValid(start) && isValid(end)) {
        const diff = differenceInDays(end, start);
        if (diff > 0) {
          setNights(diff);

          // Use Selected Room Price, fallback to hotel base price
          const basePrice = selectedRoom
            ? Number(selectedRoom.price)
            : Number(hotel.pricePerNight);
          const roomTotal = diff * basePrice;

          let vehicleTotal = 0;
          if (vehicleType) {
            const vehicle = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
            if (vehicle) vehicleTotal = vehicle.price * diff;
          }

          const total = roomTotal + vehicleTotal;
          setTotalPrice(total);

          if (discount > 0) {
            setFinalPrice(Math.max(0, total - discount));
          } else {
            setFinalPrice(total);
          }
        }
      }
    } else {
      setNights(0);
      setTotalPrice(0);
      setFinalPrice(0);
    }
  }, [checkIn, checkOut, hotel, selectedRoom, vehicleType, discount]);

  // --- HANDLERS ---
  const handleApplyCoupon = () => {
    if (!couponCode) return;
    setCouponMessage(null);
    if (couponCode.toUpperCase() === "WELCOME500") {
      const discAmount = 500;
      if (totalPrice > 1000) {
        setDiscount(discAmount);
        setCouponMessage({ type: "success", text: "Coupon Applied! ₹500 OFF" });
      } else {
        setCouponMessage({
          type: "error",
          text: "Min booking value ₹1000 required",
        });
      }
    } else if (couponCode.toUpperCase() === "MATHURA10") {
      const discAmount = Math.round(totalPrice * 0.1);
      setDiscount(discAmount);
      setCouponMessage({
        type: "success",
        text: `Coupon Applied! 10% OFF (₹${discAmount})`,
      });
    } else {
      setDiscount(0);
      setCouponMessage({ type: "error", text: "Invalid Coupon Code" });
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    setCouponMessage(null);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
    else setCheckIn("");
    if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
    else setCheckOut("");
  };

  const handleDateSelect = (val: any) => {
    if (bookingMode === "single" && val) {
      const date = val as Date;
      setCheckIn(format(date, "yyyy-MM-dd"));
      setCheckOut(format(addDays(date, 1), "yyyy-MM-dd"));
      setIsCalendarOpen(false);
    } else {
      const range = val as DateRange;
      handleRangeSelect(range);
    }
  };

  // ✅ ADDED: Missing selectTonight function
  const selectTonight = () => {
    const now = new Date();
    setCheckIn(format(now, "yyyy-MM-dd"));
    setCheckOut(format(addDays(now, 1), "yyyy-MM-dd"));
    setBookingMode("single");
    setIsCalendarOpen(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleReserve = () => {
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true);
      return;
    }
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      router.push(`/login?redirect=/hotel/${id}`);
      return;
    }
    const queryParams = new URLSearchParams({
      start: checkIn,
      end: checkOut,
      adults: adults.toString(),
      children: children.toString(),
      guests: (adults + children).toString(),
      roomId: selectedRoom?.id || "standard",
      roomName: selectedRoom?.name || "Standard Room",
      price: (selectedRoom
        ? Number(selectedRoom.price)
        : Number(hotel.pricePerNight)
      ).toString(),
      finalPrice: finalPrice.toString(),
    });
    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find((opt) => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }
    router.push(`/book/${hotel.id}?${queryParams.toString()}`);
  };

  // ✅ FILTER LOGIC
  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "All") return true;
    return getRoomCategory(room) === activeTab;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  if (!hotel)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
        Hotel not found
      </div>
    );

  return (
    <main className="min-h-screen bg-[#f2f2f2] dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-20 font-sans transition-colors duration-300">
      <Navbar variant="default" />

      {/* --- HEADER --- */}
      <div className="bg-white dark:bg-slate-900 pb-6 pt-24 md:pt-32 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {hotel.name}{" "}
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 flex items-center gap-1">
              <MapPin size={16} className="text-blue-600 dark:text-blue-400" />{" "}
              {hotel.location}, {hotel.city || "Mathura"}
            </p>
          </div>
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden relative group">
            <div className="col-span-2 row-span-2 cursor-pointer relative overflow-hidden">
              <img
                src={hotel.imageUrl || "/placeholder.jpg"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Main"
                onClick={() => setLightboxIndex(0)}
              />
            </div>
            {hotel.imageUrls &&
              hotel.imageUrls.slice(1, 5).map((img: string, i: number) => (
                <div
                  key={i}
                  className="col-span-1 row-span-1 cursor-pointer relative overflow-hidden"
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={`Gallery ${i}`}
                    onClick={() => setLightboxIndex(i + 1)}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* --- STICKY NAV --- */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {["Overview", "Amenities", "Rooms", "Policies", "Reviews"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeSection === item.toLowerCase() ? "border-rose-600 text-rose-600 dark:text-rose-500" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            {/* Overview */}
            <div
              id="overview"
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                About this property
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                {hotel.description ||
                  "Experience the best of Mathura with our premium hospitality..."}
              </p>
            </div>

            {/* Amenities */}
            <div
              id="amenities"
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
                {hotel.amenities?.map((id: string) =>
                  AMENITY_MAP[id] ? (
                    <div
                      key={id}
                      className="flex gap-3 items-center text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                        {AMENITY_MAP[id].icon}
                      </div>
                      <span className="text-sm font-medium">
                        {AMENITY_MAP[id].label}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* ✅ ROOM SELECTION WITH TABS */}
            <div id="rooms" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Choose your room
                </h2>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                  {["All", "Standard", "Deluxe", "Luxury"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-8 bg-gray-100 dark:bg-slate-900 rounded-xl text-center flex flex-col items-center">
                  <Filter className="text-gray-400 mb-2" />
                  <p className="text-gray-500 font-medium">
                    No {activeTab} rooms available.
                  </p>
                  <button
                    onClick={() => setActiveTab("All")}
                    className="text-rose-600 text-sm font-bold mt-2 hover:underline"
                  >
                    View all rooms
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const category = getRoomCategory(room);
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-rose-600 bg-rose-50 dark:bg-rose-900/10 shadow-md ring-1 ring-rose-600" : "border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"}`}
                      >
                        <div
                          className={`absolute top-4 left-4 z-10 px-2 py-1 text-[10px] font-bold uppercase rounded bg-black/70 text-white backdrop-blur-sm`}
                        >
                          {category}
                        </div>
                        <div className="w-full md:w-48 h-40 md:h-auto bg-gray-200 rounded-lg relative overflow-hidden shrink-0">
                          <img
                            src={
                              room.imageUrl ||
                              hotel.imageUrl ||
                              "/placeholder.jpg"
                            }
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={room.name}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
                                {room.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Free Cancellation • Breakfast Included
                              </p>
                            </div>
                            {isSelected ? (
                              <CheckCircle
                                className="text-rose-600 fill-rose-100 dark:fill-rose-900"
                                size={24}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-700"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3 mb-4">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <Users size={14} /> {room.capacity} Guests
                            </span>
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <Bed size={14} /> King Bed
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex flex-col">
                              <span className="font-bold text-xl text-gray-900 dark:text-white">
                                ₹{room.price}
                              </span>
                              <span className="text-xs text-gray-500">
                                + taxes & fees
                              </span>
                            </div>
                            <button
                              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isSelected ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30" : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black"}`}
                            >
                              {isSelected ? "Selected" : "Select Room"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vehicle Addon */}
            {hotel.hasVehicle && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-900 text-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Car className="text-yellow-400" /> Need a Ride?
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {VEHICLE_OPTIONS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() =>
                        setVehicleType(vehicleType === v.id ? null : v.id)
                      }
                      className={`cursor-pointer p-3 rounded-lg border transition-all ${vehicleType === v.id ? "bg-white text-black border-white" : "bg-white/10 border-white/10 hover:bg-white/20"}`}
                    >
                      <div className="mb-1">{v.icon}</div>
                      <div className="text-xs font-bold">{v.label}</div>
                      <div className="text-[10px] opacity-70">
                        ₹{v.displayPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div
              id="policies"
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Property Policies
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                <li>Check-in: 12:00 PM | Check-out: 11:00 AM</li>
                <li>Couples are welcome. Valid ID proof required.</li>
                <li>Guests below 18 years of age are not allowed.</li>
              </ul>
            </div>

            {/* Reviews Placeholder */}
            <div
              id="reviews"
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="text-rose-600" size={20} /> Guest
                Reviews
              </h2>
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <p className="text-gray-500 font-medium">
                  No reviews yet. Be the first to review!
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Sticky Booking Card) */}
          <div className="lg:w-[380px] relative">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                <div className="bg-rose-600 p-2 text-center text-white text-xs font-bold">
                  Limited Time Deal • 10% OFF applied
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹
                        {selectedRoom
                          ? Number(selectedRoom.price)
                          : Number(hotel.pricePerNight)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        / night
                      </span>
                    </div>
                    {selectedRoom && (
                      <div className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                        {selectedRoom.name}
                      </div>
                    )}
                  </div>

                  {/* Date & Guest Selectors */}
                  <div className="border border-gray-300 dark:border-slate-700 rounded-xl mb-4">
                    <div
                      className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700 border-b border-gray-300 dark:border-slate-700"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    >
                      <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">
                          Check-in
                        </label>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {checkIn
                            ? format(parseISO(checkIn), "dd MMM")
                            : "Select"}
                        </div>
                      </div>
                      <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">
                          Check-out
                        </label>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {checkOut
                            ? format(parseISO(checkOut), "dd MMM")
                            : "Select"}
                        </div>
                      </div>
                    </div>
                    {/* ✅ FIXED: DayPicker Split Logic */}
                    {isCalendarOpen && (
                      <div
                        ref={calendarRef}
                        className="absolute top-16 right-0 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white"
                      >
                        <div className="flex justify-between mb-2">
                          <button
                            onClick={selectTonight}
                            className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 px-3 py-1 rounded-full font-bold"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setIsCalendarOpen(false)}
                            className="text-xs text-rose-600 font-bold"
                          >
                            Close
                          </button>
                        </div>
                        {bookingMode === "single" ? (
                          <DayPicker
                            mode="single"
                            selected={checkIn ? parseISO(checkIn) : undefined}
                            onSelect={handleDateSelect}
                            disabled={{ before: today }}
                            modifiersClassNames={{
                              selected: "bg-rose-600 text-white",
                              day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md",
                            }}
                          />
                        ) : (
                          <DayPicker
                            mode="range"
                            selected={{
                              from: checkIn ? parseISO(checkIn) : undefined,
                              to: checkOut ? parseISO(checkOut) : undefined,
                            }}
                            onSelect={handleDateSelect}
                            disabled={{ before: today }}
                            modifiersClassNames={{
                              selected: "bg-rose-600 text-white",
                              day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md",
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setIsGuestOpen(!isGuestOpen)}
                    >
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">
                        Guests
                      </label>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">
                        {adults + children} Guests
                      </div>
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="mb-4 space-y-3">
                      {!discount ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Coupon"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm uppercase font-bold bg-transparent"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                          />
                          <button
                            onClick={handleApplyCoupon}
                            className="bg-black dark:bg-white text-white dark:text-black px-4 rounded-lg text-sm font-bold"
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/30 border border-green-200 p-2 rounded-lg text-green-700 dark:text-green-400 text-xs font-bold">
                          <span>Code Applied</span>
                          <button onClick={removeCoupon}>
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <div className="flex justify-between">
                          <span>Base ({nights} nights)</span>
                          <span className="font-medium">
                            ₹
                            {(selectedRoom
                              ? Number(selectedRoom.price)
                              : Number(hotel.pricePerNight)) * nights}
                          </span>
                        </div>
                        {vehicleType && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Vehicle</span>
                            <span>
                              + ₹
                              {(VEHICLE_OPTIONS.find(
                                (v) => v.id === vehicleType
                              )?.price || 0) * nights}
                            </span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                            <span>Discount</span>
                            <span>- ₹{discount}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                          <span>Total</span>
                          <span>₹{finalPrice}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleReserve}
                    className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-4 rounded-xl font-bold shadow-lg transform transition active:scale-[0.98]"
                  >
                    {nights > 0 ? "Book Now" : "Check Availability"}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> Secure Booking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && hotel?.imageUrls && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={hotel.imageUrls[lightboxIndex]}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}
