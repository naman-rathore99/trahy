"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  CheckCircle,
  BedDouble,
  PartyPopper,
  CreditCard,
  Wallet,
  Calendar,
  User,
  Car,
  MapPin,
  X,
  Minus,
  Plus,
  Bike,
  Zap,
  Users,
  Tag,
} from "lucide-react";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
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

function HotelBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth(app);

  // --- 1. GET TRIP DATA FROM URL ---
  const listingId = searchParams.get("id");
  const listingName = searchParams.get("name") || "Hotel Stay";
  const pricePerNight = Number(searchParams.get("price")) || 0;

  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  // Guests
  const adultsParam = Number(searchParams.get("adults")) || 1;
  const childrenParam = Number(searchParams.get("children")) || 0;
  const totalGuests = adultsParam + childrenParam;

  // Vehicle Data
  const vehicleId = searchParams.get("vehicleId");
  const vehicleName = searchParams.get("vehicleName");
  const vehiclePrice = Number(searchParams.get("vehiclePrice")) || 0;

  // --- 2. STATE ---
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "pay_at_pickup" | "online"
  >("online");
  const [includeBanquet, setIncludeBanquet] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  // Coupon State (NEW)
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>();
  const [editAdults, setEditAdults] = useState(adultsParam);
  const [editChildren, setEditChildren] = useState(childrenParam);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(vehicleId);

  // Calculated Values
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Load User Profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
        }));
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // --- 3. CALCULATE TOTALS ---
  useEffect(() => {
    if (startParam && endParam) {
      const start = parseISO(startParam);
      const end = parseISO(endParam);

      if (isValid(start) && isValid(end)) {
        let numDays = differenceInDays(end, start);
        if (numDays === 0) numDays = 1;
        setNights(numDays);

        const roomTotal = numDays * pricePerNight;
        const vehicleTotal = vehicleId ? numDays * vehiclePrice : 0;
        const banquetTotal = includeBanquet ? 10000 : 0;

        // Apply Discount
        const baseTotal = roomTotal + vehicleTotal + banquetTotal;
        const finalTotal = Math.max(0, baseTotal - discount);

        setTotalPrice(finalTotal);
      }
    }
  }, [
    startParam,
    endParam,
    pricePerNight,
    vehicleId,
    vehiclePrice,
    includeBanquet,
    discount,
  ]);

  // --- 4. COUPON HANDLER ---
  const handleApplyCoupon = () => {
    if (!couponCode) return;

    // DEMO COUPON LOGIC (Replace with API call later)
    if (couponCode.toUpperCase() === "WELCOME500") {
      if (totalPrice < 1000) {
        setCouponMessage({ type: "error", text: "Min booking ₹1000 required" });
        return;
      }
      setDiscount(500);
      setCouponMessage({ type: "success", text: "₹500 Discount Applied!" });
    } else if (couponCode.toUpperCase() === "MATHURA10") {
      const disc = Math.round(totalPrice * 0.1); // 10%
      setDiscount(disc);
      setCouponMessage({
        type: "success",
        text: `10% Discount Applied (-₹${disc})`,
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

  // --- 5. EDIT MODAL HANDLERS ---
  const openEditModal = () => {
    if (startParam && endParam) {
      setEditDateRange({
        from: parseISO(startParam),
        to: parseISO(endParam),
      });
    }
    setEditAdults(adultsParam);
    setEditChildren(childrenParam);
    setEditVehicleId(vehicleId);
    setIsEditModalOpen(true);
  };

  const handleUpdateTrip = () => {
    if (!editDateRange?.from || !editDateRange?.to) {
      alert("Please select valid dates");
      return;
    }

    const newStart = format(editDateRange.from, "yyyy-MM-dd");
    const newEnd = format(editDateRange.to, "yyyy-MM-dd");

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("start", newStart);
    current.set("end", newEnd);
    current.set("adults", editAdults.toString());
    current.set("children", editChildren.toString());
    current.set("guests", (editAdults + editChildren).toString());

    if (editVehicleId) {
      const v = VEHICLE_OPTIONS.find((opt) => opt.id === editVehicleId);
      if (v) {
        current.set("vehicleId", v.id);
        current.set("vehicleName", v.label);
        current.set("vehiclePrice", v.price.toString());
      }
    } else {
      current.delete("vehicleId");
      current.delete("vehicleName");
      current.delete("vehiclePrice");
    }

    router.replace(`/book/hotel?${current.toString()}`);
    setIsEditModalOpen(false);
  };

  const updateGuests = (type: "adults" | "children", op: "inc" | "dec") => {
    if (type === "adults") {
      setEditAdults((prev) =>
        op === "inc" ? prev + 1 : Math.max(1, prev - 1),
      );
    } else {
      setEditChildren((prev) =>
        op === "inc" ? prev + 1 : Math.max(0, prev - 1),
      );
    }
  };

  // --- 6. SUBMIT HANDLER ---
  const handleConfirm = async () => {
    if (!formData.name || !formData.phone) {
      return alert("Please enter your Name and Phone Number.");
    }
    if (!startParam || !endParam) {
      return alert("Invalid Dates. Please select dates.");
    }

    setLoading(true);

    try {
      const bookingPayload = {
        listingId,
        listingName,
        totalAmount: totalPrice, // This now includes the discount
        discountApplied: discount, // Save discount info to DB
        couponCode: discount > 0 ? couponCode : null,
        checkIn: startParam,
        checkOut: endParam,
        includeBanquet,
        serviceType: includeBanquet ? "banquet_booking" : "hotel_stay",
        vehicleIncluded: !!vehicleId,
        vehicleId,
        vehicleName,
        vehiclePrice,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          userId: auth.currentUser?.uid || "guest",
        },
        paymentMethod,
        status: paymentMethod === "online" ? "pending_payment" : "confirmed",
      };

      const createRes = await apiRequest(
        "/api/bookings/create",
        "POST",
        bookingPayload,
      );

      if (!createRes?.success || !createRes.bookingId) {
        throw new Error("Failed to generate Booking ID.");
      }

      if (paymentMethod === "pay_at_pickup") {
        router.push(`/book/success/${createRes.bookingId}`);
      } else {
        const paymentRes = await apiRequest("/api/payment/initiate", "POST", {
          bookingId: createRes.bookingId,
          amount: totalPrice,
          mobile: formData.phone,
        });
        if (paymentRes.url) window.location.href = paymentRes.url;
        else throw new Error("Payment Gateway Error.");
      }
    } catch (error: any) {
      console.error("Booking Error:", error);
      alert(error.message || "Booking Failed.");
      setLoading(false);
    }
  };

  if (!listingId)
    return (
      <div className="pt-32 text-center text-red-500">Invalid Booking Link</div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      <div className="max-w-6xl mx-auto px-4 pt-28 md:pt-32">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Review & Pay
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN: INPUTS --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Trip Details Summary */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="text-rose-600" size={20} /> Your Trip
                </h2>
                <button
                  onClick={openEditModal}
                  className="text-sm text-rose-600 font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="flex gap-4 md:gap-8">
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Check-in
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {startParam
                      ? format(parseISO(startParam), "dd MMM")
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Check-out
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {endParam ? format(parseISO(endParam), "dd MMM") : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Guests
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {totalGuests} <User size={16} />
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Traveler Details */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                Traveler Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-medium"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-medium"
                  value={formData.phone}
                  max={10}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white md:col-span-2 font-medium"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 3. Add-ons */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Optional Add-ons
              </h2>
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${includeBanquet ? "border-rose-600 bg-rose-50 dark:bg-rose-900/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
              >
                <div
                  className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center ${includeBanquet ? "bg-rose-600 border-rose-600" : "border-gray-400"}`}
                >
                  {includeBanquet && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={includeBanquet}
                  onChange={(e) => setIncludeBanquet(e.target.checked)}
                  className="hidden"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PartyPopper size={18} className="text-purple-600" />{" "}
                    Banquet Hall Access
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Include access to the banquet hall for events or parties.
                  </p>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  +₹10,000
                </span>
              </label>
            </div>

            {/* 4. Payment Method */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Payment Method
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  onClick={() => setPaymentMethod("online")}
                  className={`flex-1 p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "online" ? "border-rose-600 bg-rose-50 dark:bg-rose-900/10" : "border-gray-200 dark:border-slate-700 hover:border-gray-300"}`}
                >
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard size={18} /> Pay Online
                  </span>
                  {paymentMethod === "online" && (
                    <CheckCircle size={18} className="text-rose-600" />
                  )}
                </div>
                <div
                  onClick={() => setPaymentMethod("pay_at_pickup")}
                  className={`flex-1 p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === "pay_at_pickup" ? "border-rose-600 bg-rose-50 dark:bg-rose-900/10" : "border-gray-200 dark:border-slate-700 hover:border-gray-300"}`}
                >
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet size={18} /> Pay at Hotel
                  </span>
                  {paymentMethod === "pay_at_pickup" && (
                    <CheckCircle size={18} className="text-rose-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: SUMMARY --- */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 sticky top-28">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <BedDouble className="text-rose-600" /> Booking Summary
              </h3>

              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {listingName}
                </h4>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin size={12} /> Mathura, India
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex justify-between">
                  <span>Room (x{nights} nights)</span>
                  <span className="font-medium">
                    ₹{(pricePerNight * nights).toLocaleString("en-IN")}
                  </span>
                </div>

                {vehicleId && (
                  <div className="flex justify-between text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Car size={14} /> {vehicleName}
                    </span>
                    <span className="font-bold">
                      +₹{(vehiclePrice * nights).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {includeBanquet && (
                  <div className="flex justify-between text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <PartyPopper size={14} /> Banquet Hall
                    </span>
                    <span className="font-bold">+₹10,000</span>
                  </div>
                )}

                {/* --- COUPON SECTION --- */}
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Tag size={14} /> Discount Applied
                    </span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2 flex justify-between items-end">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    Total Pay
                  </span>
                  <span className="font-extrabold text-2xl text-rose-600">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Coupon Input */}
              {!discount ? (
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Have a Coupon?"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="mb-6 flex justify-between items-center text-sm font-bold text-green-600 bg-green-50 p-2 rounded-lg">
                  <span>Coupon Applied</span>
                  <button onClick={removeCoupon}>
                    <X size={16} />
                  </button>
                </div>
              )}
              {couponMessage && (
                <p
                  className={`text-xs text-center mb-4 font-bold ${couponMessage.type === "success" ? "text-green-600" : "text-red-500"}`}
                >
                  {couponMessage.text}
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : paymentMethod === "online" ? (
                  "Pay Now"
                ) : (
                  "Confirm Booking"
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center mt-3">
                By confirming, you agree to our Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ EDIT TRIP MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6">Edit Your Trip</h3>

            {/* 1. Date Selection */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-500 mb-2 uppercase">
                Dates
              </p>
              <div className="flex justify-center border rounded-xl p-2 bg-gray-50 dark:bg-gray-800">
                <DayPicker
                  mode="range"
                  selected={editDateRange}
                  onSelect={setEditDateRange}
                  disabled={{ before: new Date() }}
                />
              </div>
            </div>

            {/* 2. Guest Selection */}
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Adults</p>
                  <p className="text-xs text-gray-500">Age 13+</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateGuests("adults", "dec")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold w-4 text-center">
                    {editAdults}
                  </span>
                  <button
                    onClick={() => updateGuests("adults", "inc")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Children</p>
                  <p className="text-xs text-gray-500">Ages 2-12</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateGuests("children", "dec")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold w-4 text-center">
                    {editChildren}
                  </span>
                  <button
                    onClick={() => updateGuests("children", "inc")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Vehicle Selection (NEW) */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-500 mb-3 uppercase">
                Need a Ride?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {VEHICLE_OPTIONS.map((v) => (
                  <div
                    key={v.id}
                    onClick={() =>
                      setEditVehicleId(editVehicleId === v.id ? null : v.id)
                    }
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${editVehicleId === v.id ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    <div className="flex justify-center mb-1">{v.icon}</div>
                    <div className="text-[10px] font-bold">{v.label}</div>
                    <div className="text-[10px] opacity-70">+₹{v.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpdateTrip}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-lg"
            >
              Update Trip
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function HotelBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-rose-600" />
        </div>
      }
    >
      <HotelBookingContent />
    </Suspense>
  );
}
