"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  MapPin, Wifi, Car, Tv, Snowflake, Droplets, Waves, Star, Minus, Plus, Loader2,
  Calendar as CalendarIcon, Share, Heart, ChevronLeft, ChevronRight, X,
  Bike, Zap, Users, Info
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
  wifi: { label: "Fast Wifi", icon: <Wifi size={20} /> },
  parking: { label: "Free Parking", icon: <Car size={20} /> },
  ac: { label: "Air Conditioning", icon: <Snowflake size={20} /> },
  geyser: { label: "Hot Water", icon: <Droplets size={20} /> },
  tv: { label: "Smart TV", icon: <Tv size={20} /> },
  pool: { label: "Swimming Pool", icon: <Waves size={20} /> },
};

export default function DestinationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"range" | "single">("range");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Math
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    apiRequest(`/api/hotels/${id}`, "GET")
      .then((data) => {
        // --- 🔴 DEV: FORCE VEHICLE TRUE ---
        // Remove this line once your DB is updated to hasVehicle: true
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

          // 1. Room Cost
          const roomTotal = diff * hotel.pricePerNight;

          // 2. Vehicle Cost
          let vehicleTotal = 0;
          if (vehicleType) {
            const vehicle = VEHICLE_OPTIONS.find(v => v.id === vehicleType);
            if (vehicle) {
              vehicleTotal = vehicle.price * diff;
            }
          }

          setTotalPrice(roomTotal + vehicleTotal);
        }
      }
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, hotel, vehicleType]);

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

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || !hotel?.imageUrls) return;
    setLightboxIndex((prev) => prev === hotel.imageUrls.length - 1 ? 0 : (prev as number) + 1);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || !hotel?.imageUrls) return;
    setLightboxIndex((prev) => prev === 0 ? hotel.imageUrls.length - 1 : (prev as number) - 1);
  };

  // --- 🔴 FIXED: NAVIGATION HANDLER ---
  const handleReserve = () => {
    // 1. Validate inputs
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true);
      return;
    }

    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      // Pass current selection to login redirect so they don't lose progress
      router.push(`/login?redirect=/destinations/${id}`);
      return;
    }

    // 2. Build Query Params safely
    const queryParams = new URLSearchParams();
    queryParams.set("start", checkIn);
    queryParams.set("end", checkOut);
    queryParams.set("adults", adults.toString());
    queryParams.set("children", children.toString());
    queryParams.set("guests", (adults + children).toString());

    // 3. Add Vehicle Data if selected
    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find(opt => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }

    // 4. Navigate to Summary Page
    // We do NOT call the API here. The Summary page will handle the actual booking/payment.
    router.push(`/book/${hotel.id}?${queryParams.toString()}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!hotel) return <div>Not Found</div>;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      <Navbar variant="default" />

      {/* MOBILE BACK BUTTON */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => router.back()} className="p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800">
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">{hotel.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1 font-bold text-black dark:text-white"><Star size={16} fill="currentColor" /> 4.8</span>
            <span className="flex items-center gap-1 font-medium"><MapPin size={16} /> {hotel.location}</span>
          </div>
        </div>

        {/* IMAGE GRID */}
        <div className="relative aspect-[4/3] md:aspect-[3/1] rounded-3xl overflow-hidden mb-12 shadow-sm border border-gray-100 dark:border-gray-800">
          <img src={hotel.imageUrl} className="w-full h-full object-cover" alt="Main" onClick={() => setLightboxIndex(0)} />
          <button onClick={() => setLightboxIndex(0)} className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-bold shadow-lg">Show photos</button>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24 relative mt-12">
          {/* LEFT: INFO */}
          <div className="lg:col-span-2 space-y-12">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-12">
              <h2 className="text-2xl font-bold mb-4">About this place</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{hotel.description}</p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-800 pb-12">
              <h2 className="text-2xl font-bold mb-8">What this place offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                {hotel.amenities?.map((id: string) => {
                  const a = AMENITY_MAP[id];
                  return a ? <div key={id} className="flex gap-4 items-center">{a.icon} <span>{a.label}</span></div> : null;
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: BOOKING CARD */}
          <div className="relative">
            <div className="sticky top-28  dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-xl">

              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-2xl font-bold">₹{hotel.pricePerNight}</span>
                  <span className="text-sm text-gray-500"> / night</span>
                </div>
              </div>

              {/* DATES & GUESTS */}
              <div className="border border-gray-300 dark:border-gray-700 rounded-2xl mb-6  dark:bg-gray-900">
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                  <button onClick={() => setBookingMode("range")} className={`flex-1 py-3 text-xs font-bold uppercase ${bookingMode === "range" ? "text-rose-600 bg-gray-50 dark:bg-gray-800" : "text-gray-500"}`}>Select Dates</button>
                  <button onClick={() => setBookingMode("single")} className={`flex-1 py-3 text-xs font-bold uppercase ${bookingMode === "single" ? "text-rose-600 bg-gray-50 dark:bg-gray-800" : "text-gray-500"}`}>1 Night Only</button>
                </div>

                <div className="grid grid-cols-2 divide-x dark:divide-gray-700 p-3" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                  <div><label className="text-[10px] font-bold uppercase">Check-in</label><div className="text-sm">{checkIn || "Add date"}</div></div>
                  <div className="pl-3"><label className="text-[10px] font-bold uppercase">Check-out</label><div className="text-sm">{checkOut || "Add date"}</div></div>
                </div>

                {/* --- FIXED CALENDAR POPUP --- */}
                {isCalendarOpen && (
                  <div
                    ref={calendarRef}
                    className="absolute top-16 right-0 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {/* Quick Button: Inverts color in Dark Mode */}
                    <button
                      onClick={selectTonight}
                      className="w-full mb-3 bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-sm font-bold hover:opacity-80 transition-opacity"
                    >
                      Stay Tonight
                    </button>

                    {bookingMode === "single" ? (
                      <DayPicker
                        mode="single"
                        selected={checkIn ? parseISO(checkIn) : undefined}
                        onSelect={handleDateSelect}
                        disabled={{ before: today }}
                        modifiersClassNames={{
                          selected: "bg-rose-600 text-white hover:bg-rose-600",
                          today: "text-rose-500 font-bold",
                          // Ensure standard days are visible in dark mode
                          day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
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
                          selected: "bg-rose-600 text-white hover:bg-rose-600",
                          today: "text-rose-500 font-bold",
                          day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
                        }}
                      />
                    )}
                  </div>
                )}

                <div className="p-3 border-t border-gray-200 dark:border-gray-700" onClick={() => setIsGuestOpen(!isGuestOpen)}>
                  <label className="text-[10px] font-bold uppercase">Guests</label>
                  <div className="text-sm">{adults + children} guests</div>
                </div>

                {isGuestOpen && (
                  <div ref={guestRef} className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl border z-50">
                    <div className="flex justify-between mb-4">
                      <span>Adults</span>
                      <div className="flex gap-3"><button onClick={() => setAdults(Math.max(1, adults - 1))}>-</button><span>{adults}</span><button onClick={() => setAdults(adults + 1)}>+</button></div>
                    </div>
                    <div className="flex justify-between">
                      <span>Children</span>
                      <div className="flex gap-3"><button onClick={() => setChildren(Math.max(0, children - 1))}>-</button><span>{children}</span><button onClick={() => setChildren(children + 1)}>+</button></div>
                    </div>
                  </div>
                )}
              </div>

              {/* --- VEHICLE TYPE SELECTOR --- */}
              {hotel.hasVehicle && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="text-rose-600" size={18} />
                    <span className="font-bold text-sm uppercase tracking-wide">Need a Vehicle?</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setVehicleType(null)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${!vehicleType ? "border-rose-600 bg-rose-50 dark:bg-rose-900/20" : "border-gray-200 hover:border-rose-300"}`}
                    >
                      <span className="text-xs font-bold block">No Vehicle</span>
                    </div>

                    {VEHICLE_OPTIONS.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setVehicleType(v.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${vehicleType === v.id ? "border-rose-600 bg-rose-50 dark:bg-rose-900/20" : "border-gray-200 hover:border-rose-300"}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-rose-600">{v.icon}</div>
                          <span className="text-[10px] font-bold bg-white dark:bg-black px-1 rounded border">~₹{v.displayPrice}</span>
                        </div>
                        <span className="text-xs font-bold block">{v.label}</span>
                      </div>
                    ))}
                  </div>

                  {vehicleType && (
                    <p className="text-[10px] text-gray-500 mt-2 flex gap-1 items-start">
                      <Info size={12} className="mt-0.5 shrink-0" />
                      Vehicle prices are estimated. Final fare depends on vehicle.
                    </p>
                  )}
                </div>
              )}

              <button onClick={handleReserve} className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl flex justify-center">
                Reserve
              </button>

              {/* --- PLAIN FARE BREAKDOWN (No Service Fee) --- */}
              {nights > 0 && (
                <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span className="underline">₹{hotel.pricePerNight} x {nights} nights</span>
                    <span>₹{hotel.pricePerNight * nights}</span>
                  </div>

                  {vehicleType && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Est. {VEHICLE_OPTIONS.find(v => v.id === vehicleType)?.label}</span>
                      <span>~ ₹{(VEHICLE_OPTIONS.find(v => v.id === vehicleType)?.price || 0) * nights}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t pt-4">
                    <span>Est. Total</span>
                    <span>~ ₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && hotel?.imageUrls && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <button onClick={prevImage} className="absolute left-4 text-white"><ChevronLeft size={48} /></button>
          <img src={hotel.imageUrls[lightboxIndex]} className="max-h-[85vh] max-w-full object-contain" />
          <button onClick={nextImage} className="absolute right-4 text-white"><ChevronRight size={48} /></button>
        </div>
      )}
    </main>
  );
}