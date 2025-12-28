"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  MapPin, Wifi, Car, Tv, Snowflake, Droplets, Waves, Star,
  ChevronLeft, ChevronRight, X, Bike, Zap, Users,
  Share2, Heart, CheckCircle2, ShieldCheck, Utensils, Tag, Percent
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid, addDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- VEHICLE CONFIGURATION ---
const VEHICLE_OPTIONS = [
  { id: "bike", label: "2-Wheeler", icon: <Bike size={20} />, price: 400, displayPrice: "400+", desc: "Scooty / Bike" },
  { id: "auto", label: "Auto / E-Rickshaw", icon: <Zap size={20} />, price: 800, displayPrice: "800+", desc: "City Travel" },
  { id: "car", label: "Car (Taxi)", icon: <Car size={20} />, price: 2000, displayPrice: "2000+", desc: "AC Cab for 4" },
  { id: "suv", label: "Large Car (SUV)", icon: <Users size={20} />, price: 3000, displayPrice: "3000+", desc: "Innova / Ertiga" },
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

export default function HotelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(Number(searchParams.get("children") || 0));
  const [vehicleType, setVehicleType] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"range" | "single">("range");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  // Math
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0); // Price after discount

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scroll Spy for Sticky Nav
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "amenities", "policies", "reviews"];
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
    apiRequest(`/api/hotels/${id}`, "GET")
      .then((data) => {
        const modifiedHotel = { ...data.hotel, hasVehicle: true };
        setHotel(modifiedHotel);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
          const roomTotal = diff * hotel.pricePerNight;
          let vehicleTotal = 0;
          if (vehicleType) {
            const vehicle = VEHICLE_OPTIONS.find(v => v.id === vehicleType);
            if (vehicle) vehicleTotal = vehicle.price * diff;
          }
          const total = roomTotal + vehicleTotal;
          setTotalPrice(total);

          // Re-calculate discount if total changes
          if (discount > 0) {
            // Logic to re-verify discount if needed (simplified here)
            setFinalPrice(total - discount);
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
  }, [checkIn, checkOut, hotel, vehicleType, discount]);

  // --- COUPON HANDLER ---
  const handleApplyCoupon = () => {
    if (!couponCode) return;
    setCouponMessage(null);

    // SIMULATED COUPON LOGIC (Replace with API call later)
    if (couponCode.toUpperCase() === "WELCOME500") {
      const discAmount = 500;
      if (totalPrice > 1000) {
        setDiscount(discAmount);
        setFinalPrice(totalPrice - discAmount);
        setCouponMessage({ type: 'success', text: 'Coupon Applied! ₹500 OFF' });
      } else {
        setCouponMessage({ type: 'error', text: 'Min booking value ₹1000 required' });
      }
    } else if (couponCode.toUpperCase() === "MATHURA10") {
      const discAmount = Math.round(totalPrice * 0.10); // 10%
      setDiscount(discAmount);
      setFinalPrice(totalPrice - discAmount);
      setCouponMessage({ type: 'success', text: `Coupon Applied! 10% OFF (₹${discAmount})` });
    } else {
      setDiscount(0);
      setFinalPrice(totalPrice);
      setCouponMessage({ type: 'error', text: 'Invalid Coupon Code' });
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    setFinalPrice(totalPrice);
    setCouponMessage(null);
  };

  // --- HANDLERS ---
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
      window.scrollTo({ top: y, behavior: 'smooth' });
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
    const queryParams = new URLSearchParams();
    queryParams.set("start", checkIn);
    queryParams.set("end", checkOut);
    queryParams.set("adults", adults.toString());
    queryParams.set("children", children.toString());
    queryParams.set("guests", (adults + children).toString());
    queryParams.set("finalPrice", finalPrice.toString()); // Pass final price

    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find(opt => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }
    router.push(`/book/${hotel.id}?${queryParams.toString()}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div></div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 text-gray-900 dark:text-white">Hotel not found</div>;

  return (
    <main className="min-h-screen bg-[#f2f2f2] dark:bg-slate-950 text-gray-900 dark:text-gray-100 pb-20 font-sans transition-colors duration-300">
      <Navbar variant="default" />

      {/* --- 1. HEADER & GALLERY --- */}
      <div className="bg-white dark:bg-slate-900 pb-6 pt-24 md:pt-32 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumbs & Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span className="cursor-pointer hover:text-rose-600">Home</span> /
              <span className="cursor-pointer hover:text-rose-600">Hotels in {hotel.city || "Mathura"}</span> /
              <span className="text-gray-900 dark:text-white font-medium truncate">{hotel.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {hotel.name}
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 flex items-center gap-1">
                  <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                  {hotel.location}, {hotel.city || "Mathura"}
                  <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline ml-2">View on Map</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300">
                  <Share2 size={16} /> Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-rose-600 dark:text-rose-500">
                  <Heart size={16} /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Professional Gallery Grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden relative group">
            <div className="col-span-2 row-span-2 cursor-pointer relative overflow-hidden">
              <img src={hotel.imageUrl || "/placeholder.jpg"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Main" onClick={() => setLightboxIndex(0)} />
            </div>
            {hotel.imageUrls && hotel.imageUrls.slice(1, 5).map((img: string, i: number) => (
              <div key={i} className="col-span-1 row-span-1 cursor-pointer relative overflow-hidden">
                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`Gallery ${i}`} onClick={() => setLightboxIndex(i + 1)} />
                {i === 3 && hotel.imageUrls.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg" onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); }}>
                    +{hotel.imageUrls.length - 5} Photos
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- 2. STICKY NAV --- */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {["Overview", "Amenities", "Policies", "Reviews"].map((item) => {
              const id = item.toLowerCase();
              return (
                <button
                  key={item}
                  onClick={() => scrollToSection(id)}
                  className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeSection === id ? "border-rose-600 text-rose-600 dark:text-rose-500" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* --- 3. MAIN CONTENT SPLIT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN (Details) */}
          <div className="flex-1 space-y-8">

            {/* Overview */}
            <div id="overview" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About this property</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {hotel.description || "Experience the best of Mathura with our premium hospitality. Located near key temples and attractions, offering modern amenities for a spiritual yet comfortable stay."}
              </p>

              {/* Key Highlights */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800">
                  <ShieldCheck size={14} /> Safety & Hygiene Verified
                </div>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">
                  <CheckCircle2 size={14} /> Free Cancellation
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div id="amenities" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
                {hotel.amenities?.map((id: string) => {
                  const a = AMENITY_MAP[id];
                  return a ? (
                    <div key={id} className="flex gap-3 items-center text-gray-700 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {a.icon}
                      </div>
                      <span className="text-sm font-medium">{a.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Vehicle Addon Section */}
            {hotel.hasVehicle && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Car className="text-yellow-400" /> Need a Ride?</h2>
                  <p className="text-gray-300 text-sm mb-4">Add a vehicle to your booking for seamless city travel.</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {VEHICLE_OPTIONS.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setVehicleType(vehicleType === v.id ? null : v.id)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${vehicleType === v.id ? "bg-white text-black border-white" : "bg-white/10 border-white/10 hover:bg-white/20"}`}
                      >
                        <div className="mb-1">{v.icon}</div>
                        <div className="text-xs font-bold">{v.label}</div>
                        <div className="text-[10px] opacity-70">₹{v.displayPrice}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Policies */}
            <div id="policies" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Property Policies</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                <li>Check-in: 12:00 PM | Check-out: 11:00 AM</li>
                <li>Couples are welcome. Valid ID proof required.</li>
                <li>Guests below 18 years of age are not allowed at the property.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN (Sticky Booking Card) */}
          <div className="lg:w-[380px] relative">
            <div className="sticky top-24 space-y-4">

              {/* Price Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                <div className="bg-rose-600 p-2 text-center text-white text-xs font-bold">
                  Limited Time Deal • 10% OFF applied
                </div>

                <div className="p-6">
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{hotel.pricePerNight}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm line-through">₹{Math.round(hotel.pricePerNight * 1.2)}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/ night</span>
                  </div>

                  {/* Booking Inputs */}
                  <div className="border border-gray-300 dark:border-slate-700 rounded-xl mb-4">
                    {/* Date Trigger */}
                    <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700 border-b border-gray-300 dark:border-slate-700" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                      <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Check-in</label>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{checkIn ? format(parseISO(checkIn), "dd MMM yyyy") : "Select Date"}</div>
                      </div>
                      <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Check-out</label>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{checkOut ? format(parseISO(checkOut), "dd MMM yyyy") : "Select Date"}</div>
                      </div>
                    </div>

                    {/* Calendar Popup */}
                    {isCalendarOpen && (
                      <div ref={calendarRef} className="absolute top-16 right-0 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white">
                        <div className="flex justify-between mb-2">
                          <button onClick={selectTonight} className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1 rounded-full font-bold">Stay Tonight</button>
                          <button onClick={() => setIsCalendarOpen(false)} className="text-xs text-rose-600 dark:text-rose-500 font-bold">Close</button>
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

                    {/* Guest Trigger */}
                    {/* Guest Trigger */}
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative"
                      onClick={() => setIsGuestOpen(!isGuestOpen)}
                    >
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Guests & Rooms</label>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{adults + children} Guests, 1 Room</div>

                      {isGuestOpen && (
                        <div
                          ref={guestRef}
                          className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl rounded-xl p-4 z-50 mt-2 cursor-default text-gray-900 dark:text-white animate-in zoom-in-95 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* ADULTS ROW */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Adults</span>
                              <span className="text-xs text-gray-500">Ages 12+</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setAdults(Math.max(1, adults - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-bold">{adults}</span>
                              <button
                                onClick={() => setAdults(adults + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* CHILDREN ROW */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">Children</span>
                              <span className="text-xs text-gray-500">Under 12</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setChildren(Math.max(0, children - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-bold">{children}</span>
                              <button
                                onClick={() => setChildren(children + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* ✅ NEW "DONE" BUTTON */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stops the click from bubbling up (prevents reopening)
                              setIsGuestOpen(false);
                            }}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- COUPON SECTION (Added Here) --- */}
                  {nights > 0 && (
                    <div className="mb-4">
                      {!discount ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Coupon Code"
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm font-bold uppercase focus:outline-none focus:border-rose-500 dark:text-white"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                            />
                          </div>
                          <button
                            onClick={handleApplyCoupon}
                            className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-bold">
                            <Percent size={16} className="fill-current" />
                            Code {couponCode.toUpperCase()} Applied
                          </div>
                          <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                        </div>
                      )}
                      {couponMessage && (
                        <p className={`text-xs mt-1 ml-1 ${couponMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {couponMessage.text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  {nights > 0 && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Base Price ({nights} nights)</span>
                        <span className="font-medium">₹{hotel.pricePerNight * nights}</span>
                      </div>

                      {vehicleType && (
                        <div className="flex justify-between text-green-700 dark:text-green-400">
                          <span>Vehicle ({VEHICLE_OPTIONS.find(v => v.id === vehicleType)?.label})</span>
                          <span className="font-medium">+ ₹{(VEHICLE_OPTIONS.find(v => v.id === vehicleType)?.price || 0) * nights}</span>
                        </div>
                      )}

                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                          <span>Coupon Discount</span>
                          <span>- ₹{discount}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>₹{finalPrice}</span>
                      </div>
                    </div>
                  )}

                  <button onClick={handleReserve} className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-4 rounded-xl font-bold shadow-lg transform transition active:scale-[0.98]">
                    {nights > 0 ? "Book Now" : "Check Availability"}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> Secure Booking • No Hidden Fees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIGHTBOX --- */}
      {lightboxIndex !== null && hotel?.imageUrls && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === 0 ? hotel.imageUrls.length - 1 : lightboxIndex - 1); }} className="absolute left-4 text-white p-4 hover:bg-white/10 rounded-full"><ChevronLeft size={32} /></button>
          <img src={hotel.imageUrls[lightboxIndex]} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === hotel.imageUrls.length - 1 ? 0 : lightboxIndex + 1); }} className="absolute right-4 text-white p-4 hover:bg-white/10 rounded-full"><ChevronRight size={32} /></button>
        </div>
      )}
    </main>
  );
}