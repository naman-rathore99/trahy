"use client";

import { useEffect, useState, useRef, use } from "react";
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
  Minus,
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Share,
  Heart,
  ChevronLeft,
  ChevronRight, // Added for carousel
  X, // Added for carousel
  Maximize2, // Added for hover effect
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- AMENITY MAPPING ---
const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Fast Wifi", icon: <Wifi size={20} /> },
  parking: { label: "Free Parking", icon: <Car size={20} /> },
  ac: { label: "Air Conditioning", icon: <Snowflake size={20} /> },
  geyser: { label: "Hot Water", icon: <Droplets size={20} /> },
  tv: { label: "Smart TV", icon: <Tv size={20} /> },
  pool: { label: "Swimming Pool", icon: <Waves size={20} /> },
};

export default function DestinationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const [children, setChildren] = useState(
    Number(searchParams.get("children") || 0)
  );

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Calculations
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Refs
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    apiRequest(`/api/hotels/${id}`, "GET")
      .then((data) => setHotel(data.hotel))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // --- 2. CALCULATE PRICE ---
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      if (isValid(start) && isValid(end)) {
        const diff = differenceInDays(end, start);
        if (diff > 0) {
          setNights(diff);
          setTotalPrice(diff * hotel.pricePerNight + 1300); // Base + Fees
        }
      }
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, hotel]);

  // --- 3. EVENT LISTENERS (Click Outside & Keyboard) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      )
        setIsCalendarOpen(false);
      if (guestRef.current && !guestRef.current.contains(event.target as Node))
        setIsGuestOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (event.key === "Escape") setLightboxIndex(null);
        if (event.key === "ArrowRight") nextImage();
        if (event.key === "ArrowLeft") prevImage();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex]);

  // --- 4. HANDLERS ---
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
    else setCheckIn("");
    if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
    else setCheckOut("");
  };

  // Lightbox Navigation
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || !hotel?.imageUrls) return;
    setLightboxIndex((prev) =>
      prev === hotel.imageUrls.length - 1 ? 0 : (prev as number) + 1
    );
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || !hotel?.imageUrls) return;
    setLightboxIndex((prev) =>
      prev === 0 ? hotel.imageUrls.length - 1 : (prev as number) - 1
    );
  };

  const handleReserve = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      router.push("/login?redirect=/destinations/" + id);
      return;
    }
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true);
      return;
    }
    setBookingLoading(true);
    try {
      await apiRequest("/api/bookings", "POST", {
        listingId: hotel.id,
        listingName: hotel.name,
        listingImage: hotel.imageUrl,
        serviceType: "hotel",
        checkIn,
        checkOut,
        guests: adults + children,
        totalAmount: totalPrice,
      });
      router.push("/trips");
    } catch (err: any) {
      alert("Booking Failed: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
        <Loader2 className="animate-spin mr-3 text-rose-600" size={32} />{" "}
        Loading...
      </div>
    );

  if (!hotel)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <button
          onClick={() => router.push("/")}
          className="text-rose-600 hover:underline"
        >
          Go Home
        </button>
      </div>
    );

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      {/* MOBILE BACK BUTTON */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {hotel.name}
          </h1>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 font-bold text-black dark:text-white">
                <Star size={16} fill="currentColor" /> 4.8
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="underline font-medium cursor-pointer hover:text-rose-600 transition-colors">
                12 reviews
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-300">
                <MapPin size={16} /> {hotel.location}
              </span>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-lg transition-colors">
                <Share size={16} /> <span className="underline">Share</span>
              </button>
              <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-lg transition-colors">
                <Heart size={16} /> <span className="underline">Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- IMAGE GRID (CLICKABLE) --- */}
        <div className="relative aspect-[4/3] md:aspect-[3/1] rounded-3xl overflow-hidden mb-12 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-2">
            {/* Main Image */}
            <div
              className="md:col-span-2 h-full relative group cursor-pointer"
              onClick={() => setLightboxIndex(0)}
            >
              <img
                src={hotel.imageUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Main"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Side Grid */}
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
              {(hotel.imageUrls || [])
                .slice(0, 4)
                .map((url: string, i: number) => (
                  <div
                    key={i}
                    className="relative group overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(i)} // Open lightbox on click
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={`Gallery ${i}`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}

              {/* Fallback if empty */}
              {(!hotel.imageUrls || hotel.imageUrls.length === 0) && (
                <div className="col-span-2 h-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-400">
                  <CalendarIcon size={32} className="opacity-20 mb-2" />
                  <span className="text-xs uppercase tracking-wider font-bold opacity-40">
                    Gallery Empty
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setLightboxIndex(0)}
            className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-bold shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
          >
            Show all photos
          </button>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24 relative">
          {/* LEFT: INFO */}
          <div className="lg:col-span-2 space-y-12">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                About this place
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line font-light">
                {hotel.description}
              </p>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-800 pb-12">
              <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
                What this place offers
              </h2>
              {hotel.amenities && hotel.amenities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                  {hotel.amenities.map((amenityId: string) => {
                    const amenity = AMENITY_MAP[amenityId];
                    if (!amenity) return null;
                    return (
                      <div
                        key={amenityId}
                        className="flex items-center gap-4 text-gray-700 dark:text-gray-300 group"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors">
                          {amenity.icon}
                        </div>
                        <span className="text-lg font-light">
                          {amenity.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-500 text-center border border-dashed border-gray-200 dark:border-gray-800">
                  No amenities specified.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: BOOKING CARD */}
          <div className="relative">
            <div className="sticky top-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{Number(hotel.pricePerNight).toLocaleString("en-IN")}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-light">
                    {" "}
                    / night
                  </span>
                </div>
              </div>

              {/* Inputs */}
              <div className="border border-gray-300 dark:border-gray-700 rounded-2xl mb-6 relative divide-y dark:divide-gray-700">
                <div
                  className="grid grid-cols-2 divide-x dark:divide-gray-700 cursor-pointer"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tl-2xl transition-colors">
                    <label className="block text-[10px] font-bold uppercase text-gray-800 dark:text-gray-300 tracking-wider">
                      Check-in
                    </label>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                      {checkIn
                        ? format(parseISO(checkIn), "dd/MM/yyyy")
                        : "Add date"}
                    </div>
                  </div>
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tr-2xl transition-colors">
                    <label className="block text-[10px] font-bold uppercase text-gray-800 dark:text-gray-300 tracking-wider">
                      Check-out
                    </label>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                      {checkOut
                        ? format(parseISO(checkOut), "dd/MM/yyyy")
                        : "Add date"}
                    </div>
                  </div>
                </div>
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-2xl transition-colors"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <label className="block text-[10px] font-bold uppercase text-gray-800 dark:text-gray-300 tracking-wider">
                    Guests
                  </label>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                    {adults + children} guests
                  </div>
                </div>

                {/* Popups */}
                {isCalendarOpen && (
                  <div
                    ref={calendarRef}
                    className="absolute top-0 right-0 bg-white text-black p-4 rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95"
                  >
                    <DayPicker
                      mode="range"
                      selected={{
                        from: checkIn ? parseISO(checkIn) : undefined,
                        to: checkOut ? parseISO(checkOut) : undefined,
                      }}
                      onSelect={handleRangeSelect}
                      min={1}
                      disabled={{ before: new Date() }}
                      modifiersClassNames={{
                        selected: "bg-black text-white hover:bg-black",
                        today: "text-rose-500 font-bold",
                      }}
                    />
                  </div>
                )}
                {isGuestOpen && (
                  <div
                    ref={guestRef}
                    className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            Adults
                          </p>
                          <p className="text-xs text-gray-500">Age 13+</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(Math.max(1, adults - 1));
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-4 text-center dark:text-white">
                            {adults}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdults(adults + 1);
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            Children
                          </p>
                          <p className="text-xs text-gray-500">Ages 2-12</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(Math.max(0, children - 1));
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-4 text-center dark:text-white">
                            {children}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildren(children + 1);
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleReserve}
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <Loader2 className="animate-spin" />
                ) : nights > 0 ? (
                  "Reserve"
                ) : (
                  "Check availability"
                )}
              </button>

              {nights > 0 && (
                <div className="mt-6 space-y-4 text-gray-600 dark:text-gray-400 text-sm animate-in fade-in">
                  <div className="flex justify-between">
                    <span className="underline">
                      ₹{Number(hotel.pricePerNight).toLocaleString("en-IN")} x{" "}
                      {nights} nights
                    </span>
                    <span>
                      ₹{(hotel.pricePerNight * nights).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Cleaning & Service fee</span>
                    <span>₹1,300</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-800 pt-4 text-lg">
                    <span>Total</span>
                    <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- IMAGE LIGHTBOX (CAROUSEL) --- */}
      {lightboxIndex !== null && hotel?.imageUrls && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
          >
            <X size={32} />
          </button>

          {/* Previous Arrow */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-8 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-20"
          >
            <ChevronLeft size={48} />
          </button>

          {/* Main Image */}
          <div className="relative w-full h-full max-w-7xl mx-auto flex items-center justify-center p-4">
            <img
              src={hotel.imageUrls[lightboxIndex]}
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              alt={`Full screen view ${lightboxIndex}`}
            />
          </div>

          {/* Next Arrow */}
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-8 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-20"
          >
            <ChevronRight size={48} />
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-mono text-sm">
            {lightboxIndex + 1} / {hotel.imageUrls.length}
          </div>
        </div>
      )}
    </main>
  );
}
