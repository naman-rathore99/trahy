"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
  Loader2,
  ChevronLeft,
  Calendar,
  Users,
  ShieldCheck,
  Star,
  MapPin,
  Car, // Added Car icon
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

export default function BookingSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Get Booking Data from URL
  const checkIn = searchParams.get("start") || "";
  const checkOut = searchParams.get("end") || "";
  const guests = Number(searchParams.get("guests") || 1);
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";

  // 2. Get Vehicle Data from URL (New)
  const vehicleId = searchParams.get("vehicleId");
  const vehicleName = searchParams.get("vehicleName");
  const vehiclePriceStr = searchParams.get("vehiclePrice");
  const vehiclePrice = vehiclePriceStr ? Number(vehiclePriceStr) : 0;

  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Calculations
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // --- FETCH HOTEL DATA ---
  useEffect(() => {
    if (!id) return;
    apiRequest(`/api/hotels/${id}`, "GET")
      .then((data) => setHotel(data.hotel))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // --- CALCULATE FINAL PRICE ---
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      const diff = differenceInDays(end, start);

      if (diff > 0) {
        setNights(diff);

        // Math: (Room * Nights) + (Vehicle * Nights)
        const roomTotal = diff * hotel.pricePerNight;
        const vehicleTotal = vehiclePrice * diff;

        setTotalPrice(roomTotal + vehicleTotal);
      }
    }
  }, [checkIn, checkOut, hotel, vehiclePrice]);

  // --- PAYMENT HANDLER ---
  const handlePayment = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to continue");
      router.push(`/login?redirect=${window.location.pathname}${window.location.search}`);
      return;
    }

    setPaymentLoading(true);
    // inside handlePayment() in app/book/[id]/page.tsx
    const response = await apiRequest("/api/payment", "POST", {
      listingId: hotel.id,
      listingName: hotel.name,
      listingImage: hotel.imageUrl,
      serviceType: vehicleId ? "package" : "hotel",
      checkIn,
      checkOut,
      guests: Number(adults) + Number(children),
      totalAmount: totalPrice,

      // --- MAKE SURE THESE ARE EXACTLY HERE ---
      vehicleIncluded: !!vehicleId,
      vehicleType: vehicleName,
      vehiclePricePerDay: vehiclePrice, // Ensure this variable exists from URL params
      vehicleTotalAmount: vehiclePrice * nights
    });
    try {
      // Call Payment API
      const response = await apiRequest("/api/payment", "POST", {
        listingId: hotel.id,
        listingName: hotel.name,
        listingImage: hotel.imageUrl,
        serviceType: vehicleId ? "package" : "hotel", // Mark as package if vehicle included
        checkIn,
        checkOut,
        guests: Number(adults) + Number(children),
        totalAmount: totalPrice,

        // Pass Vehicle Data to Backend
        vehicleIncluded: !!vehicleId,
        vehicleType: vehicleName,
        vehiclePricePerDay: vehiclePrice,
        vehicleTotalAmount: vehiclePrice * nights
      });

      // Redirect to PhonePe or Confirmation
      if (response.url) {
        window.location.href = response.url;
      } else {
        // Fallback for demo/testing if no gateway
        router.push("/trips");
      }
    } catch (err: any) {
      console.error(err);
      alert("Payment Failed: " + err.message);
      setPaymentLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  if (!hotel) return <div>Hotel not found</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar variant="default" />

      <div className="max-w-6xl mx-auto px-4 pt-32">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} /> Back to Hotel
        </button>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Request to book
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* --- LEFT: TRIP DETAILS --- */}
          <div className="space-y-8">
            {/* Dates & Guests */}
            <div className="bg-white text-black p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Your Trip</h2>

              {/* DATES */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="font-bold text-gray-900">Dates</p>
                  <p className="text-gray-600 text-sm">
                    {checkIn && checkOut ? (
                      <>
                        {format(parseISO(checkIn), "MMM dd")} – {format(parseISO(checkOut), "MMM dd")}
                      </>
                    ) : (
                      <span className="text-red-500">Select dates</span>
                    )}
                  </p>
                </div>
                <button
                  className="underline text-gray-500 text-sm font-medium"
                  onClick={() => router.back()}
                >
                  Edit
                </button>
              </div>

              {/* GUESTS */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="font-bold text-gray-900">Guests</p>
                  <p className="text-gray-600 text-sm">
                    {Number(adults) + Number(children)} guests
                  </p>
                </div>
                <button
                  className="underline text-gray-500 text-sm font-medium"
                  onClick={() => router.back()}
                >
                  Edit
                </button>
              </div>

              {/* VEHICLE ADD-ON (Show only if selected) */}
              {vehicleName && (
                <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-4 mt-4">
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Car size={16} className="text-rose-600" /> Vehicle Added
                    </p>
                    <p className="text-gray-600 text-sm">
                      {vehicleName}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">Included</span>
                </div>
              )}
            </div>

            {/* Payment Method (Visual Only) */}
            <div className="bg-white text-black p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full text-green-700">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-green-800 font-medium text-sm">
                  Secure Payment via PhonePe / UPI
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                `Pay ₹${totalPrice.toLocaleString("en-IN")}`
              )}
            </button>
          </div>

          {/* --- RIGHT: PRICE SUMMARY --- */}
          <div className="bg-white text-black p-6 rounded-2xl border border-gray-200 shadow-lg h-fit sticky top-32">
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
              <img
                src={hotel.imageUrl}
                className="w-28 h-28 object-cover rounded-xl"
                alt="Hotel"
              />
              <div>
                <p className="text-xs text-gray-500 mb-1">Hotel / Stay</p>
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star size={12} fill="black" /> 4.8 (12 reviews)
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                  <MapPin size={12} /> {hotel.location}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-4">Price Details</h3>
            <div className="space-y-3 text-gray-600 text-sm">
              {/* Room Cost */}
              <div className="flex justify-between">
                <span className="underline">
                  ₹{Number(hotel.pricePerNight).toLocaleString("en-IN")} x{" "}
                  {nights} nights
                </span>
                <span>
                  ₹{(hotel.pricePerNight * nights).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Vehicle Cost (Conditional) */}
              {vehicleName && vehiclePrice > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Car size={14} /> {vehicleName} x {nights} days
                  </span>
                  <span>
                    ₹{(vehiclePrice * nights).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-4 mt-2">
                <span>Total (INR)</span>
                <span>₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}