"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  MapPin,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Star,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function DestinationDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking Data
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(
    Number(searchParams.get("children") || 0)
  );

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);

  // Refs for clicking outside
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Calculations
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // 1. Fetch Hotel Data
  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      try {
        const data = await apiRequest(`/api/hotels/${id}`, "GET");
        setHotel(data);
      } catch (err) {
        console.error("Error fetching hotel:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // 2. Smart Price Calculator
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);

      if (isValid(start) && isValid(end)) {
        const diff = differenceInDays(end, start);
        if (diff > 0) {
          setNights(diff);
          // Math: (Price * Nights) + Cleaning Fee (800) + Service Fee (500)
          setTotalPrice(diff * hotel.pricePerNight + 1300);
          return;
        }
      }
    }
    setNights(0);
    setTotalPrice(0);
  }, [checkIn, checkOut, hotel]);

  // 3. Handle Click Outside to Close Popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
      if (
        guestRef.current &&
        !guestRef.current.contains(event.target as Node)
      ) {
        setIsGuestOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Calendar Selection Logic
  const selectedRange: DateRange | undefined = {
    from: checkIn ? parseISO(checkIn) : undefined,
    to: checkOut ? parseISO(checkOut) : undefined,
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
    else setCheckIn("");

    if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
    else setCheckOut("");
  };

  // 5. RESERVE FUNCTION (Connects to Database)
  const handleReserve = async () => {
    // A. Check Login
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      alert("Please login to book a trip!");
      router.push("/login");
      return;
    }

    // B. Validate Dates
    if (!checkIn || !checkOut || nights === 0) {
      setIsCalendarOpen(true); // Open calendar if dates missing
      return;
    }

    setBookingLoading(true);

    try {
      // C. Send to API
      await apiRequest("/api/bookings", "POST", {
        listingId: hotel.id,
        listingName: hotel.name,
        listingImage: hotel.imageUrl,
        serviceType: "hotel", // Force type
        checkIn,
        checkOut,
        guests: adults + children,
        totalAmount: totalPrice,
      });

      // D. Success
      router.push("/trips");
    } catch (err: any) {
      alert("Booking Failed: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" /> Loading Property...
      </div>
    );
  if (!hotel)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Property Not Found
      </div>
    );

  return (
    <main className="min-h-screen bg-white pb-20">
      <Navbar variant="default" />

      <div className="max-w-[1200px] mx-auto px-4 pt-24 md:pt-32">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {hotel.name}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star size={16} fill="black" /> <b>4.8</b> (12 reviews)
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-blue-600 font-medium">
              <MapPin size={16} /> {hotel.location}
            </div>
          </div>
        </div>

        {/* IMAGES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10 shadow-sm">
          <div className="md:col-span-2 h-full">
            <img
              src={hotel.imageUrl}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              alt="Main"
            />
          </div>
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
            {(hotel.imageUrls || [])
              .slice(1, 5)
              .map((url: string, i: number) => (
                <div key={i} className="overflow-hidden h-full">
                  <img
                    src={url}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    alt="Gallery"
                  />
                </div>
              ))}
            {/* Fallback if no gallery images */}
            {(!hotel.imageUrls || hotel.imageUrls.length < 2) && (
              <div className="bg-gray-100 h-full flex items-center justify-center text-gray-400 text-sm col-span-2">
                More photos coming soon
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* LEFT: DETAILS */}
          <div className="md:col-span-2 space-y-8">
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold mb-3">About this place</h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {hotel.description}
              </p>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-bold mb-4">What this place offers</h2>
              <div className="grid grid-cols-2 gap-4 text-gray-600">
                <div className="flex gap-3">
                  <Wifi size={20} /> Fast Wifi
                </div>
                <div className="flex gap-3">
                  <Car size={20} /> Free Parking
                </div>
                <div className="flex gap-3">
                  <Coffee size={20} /> Coffee Maker
                </div>
                <div className="flex gap-3">
                  <Utensils size={20} /> Full Kitchen
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BOOKING CARD */}
          <div className="relative">
            <div className="sticky top-28 bg-white border border-gray-200 shadow-xl rounded-2xl p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-2xl font-bold">
                    ₹{hotel.pricePerNight}
                  </span>
                  <span className="text-gray-500"> / night</span>
                </div>
              </div>

              {/* --- CUSTOM INPUTS --- */}
              <div className="border border-gray-400 rounded-lg mb-4 relative">
                {/* 1. DATE PICKER TRIGGER */}
                <div
                  className="grid grid-cols-2 border-b border-gray-400 cursor-pointer"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <div className="p-3 border-r border-gray-400 hover:bg-gray-50 transition-colors">
                    <label className="block text-[10px] font-bold uppercase text-gray-800 mb-1">
                      Check-in
                    </label>
                    <div
                      className={`text-sm font-medium ${checkIn ? "text-black" : "text-gray-400"}`}
                    >
                      {checkIn
                        ? format(parseISO(checkIn), "MMM dd, yyyy")
                        : "Add date"}
                    </div>
                  </div>
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <label className="block text-[10px] font-bold uppercase text-gray-800 mb-1">
                      Check-out
                    </label>
                    <div
                      className={`text-sm font-medium ${checkOut ? "text-black" : "text-gray-400"}`}
                    >
                      {checkOut
                        ? format(parseISO(checkOut), "MMM dd, yyyy")
                        : "Add date"}
                    </div>
                  </div>
                </div>

                {/* 1b. DATE PICKER POPUP */}
                {isCalendarOpen && (
                  <div
                    ref={calendarRef}
                    className="absolute top-0 right-0 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 z-50 transform -translate-y-2"
                  >
                    <DayPicker
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleRangeSelect}
                      min={1}
                      numberOfMonths={1}
                      disabled={{ before: new Date() }}
                      modifiersClassNames={{
                        selected: "bg-black text-white hover:bg-black",
                        range_middle: "bg-gray-100 text-black",
                        today: "text-blue-500 font-bold",
                      }}
                      styles={{ caption: { color: "#000" } }}
                    />
                  </div>
                )}

                {/* 2. GUEST TRIGGER */}
                <div
                  className="p-3 hover:bg-gray-50 cursor-pointer relative"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <label className="block text-[10px] font-bold uppercase text-gray-800 mb-1">
                    Guests
                  </label>
                  <div className="text-sm font-medium text-black">
                    {adults + children} Guests
                  </div>
                </div>

                {/* 2b. GUEST POPUP */}
                {isGuestOpen && (
                  <div
                    ref={guestRef}
                    className="absolute top-full left-0 w-full mt-2 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50"
                  >
                    {/* Adults */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-gray-900">
                        Adults
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdults(Math.max(1, adults - 1));
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm">
                          {adults}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdults(adults + 1);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Children */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">
                        Children
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChildren(Math.max(0, children - 1));
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm">
                          {children}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChildren(children + 1);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGuestOpen(false);
                        }}
                        className="text-sm underline font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleReserve}
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all mb-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Processing...
                  </>
                ) : nights > 0 ? (
                  "Reserve Now"
                ) : (
                  "Check Availability"
                )}
              </button>

              {/* PRICE BREAKDOWN */}
              {nights > 0 ? (
                <div className="space-y-3 text-gray-600 text-sm animate-in fade-in slide-in-from-top-2">
                  <p className="text-center text-xs text-gray-400 mb-4">
                    You won't be charged yet
                  </p>
                  <div className="flex justify-between">
                    <span className="underline">
                      ₹{hotel.pricePerNight} x {nights} nights
                    </span>
                    <span>₹{hotel.pricePerNight * nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Cleaning fee</span>
                    <span>₹800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Service fee</span>
                    <span>₹500</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between font-bold text-base text-gray-900">
                    <span>Total before taxes</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 mt-4">
                  Select dates to see total price
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
