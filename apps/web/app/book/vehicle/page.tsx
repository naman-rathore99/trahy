"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { Loader2, CheckCircle, Car, Wallet, CreditCard } from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

function VehicleBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth(app);

  // Get Data from URL
  const vehicleId = searchParams.get("vehicleId");
  const vehicleName = searchParams.get("vehicleName") || "Vehicle Rental";
  const pricePerDay = Number(searchParams.get("price")) || 0;
  const initialStart = searchParams.get("start") || "";
  const initialEnd = searchParams.get("end") || "";

  const [dates, setDates] = useState({ start: initialStart, end: initialEnd });
  const [days, setDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "pay_at_pickup" | "online"
  >("online");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user)
        setFormData((prev) => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
        }));
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (dates.start && dates.end) {
      const start = parseISO(dates.start);
      const end = parseISO(dates.end);
      if (isValid(start) && isValid(end)) {
        const diff = differenceInDays(end, start);
        setDays(diff > 0 ? diff : 0);
        setTotalPrice((diff > 0 ? diff : 0) * pricePerDay);
      }
    }
  }, [dates, pricePerDay]);

  const handleConfirm = async () => {
    if (!formData.name || !formData.phone || !dates.start || !dates.end)
      return alert("Please fill all details.");
    setLoading(true);

    try {
      // 1. Create Booking
      const createRes = await apiRequest("/api/bookings/vehicle", "POST", {
        vehicleId,
        vehicleName,
        pricePerDay,
        totalPrice,
        startDate: dates.start,
        endDate: dates.end,
        days,
        customer: { ...formData, userId: auth.currentUser?.uid || "guest" },
        paymentMethod,
        status: paymentMethod === "online" ? "pending_payment" : "confirmed",
      });

      if (!createRes?.success || !createRes.bookingId)
        throw new Error("No Booking ID returned");

      // 2. Payment Redirect
      if (paymentMethod === "pay_at_pickup") {
        router.push(`/book/success/${createRes.bookingId}`);
      } else {
        const paymentRes = await apiRequest("/api/payment/initiate", "POST", {
          bookingId: createRes.bookingId,
          amount: totalPrice,
          mobile: formData.phone,
        });
        if (paymentRes.url) window.location.href = paymentRes.url;
        else throw new Error("Payment init failed");
      }
    } catch (error) {
      console.error(error);
      alert("Booking Failed. Please try again.");
      setLoading(false);
    }
  };

  if (!vehicleId)
    return <div className="pt-32 text-center">Invalid Vehicle Link</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      <Navbar variant="default" />
      <div className="max-w-6xl mx-auto px-4 pt-32">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Confirm Rental
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 dark:text-white">
                Your Details
              </h2>
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="p-3 border rounded-xl dark:bg-slate-800 dark:text-white"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="p-3 border rounded-xl dark:bg-slate-800 dark:text-white"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="p-3 border rounded-xl dark:bg-slate-800 dark:text-white"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 dark:text-white">
                Payment
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setPaymentMethod("online")}
                  className={`flex-1 p-4 border rounded-xl font-bold ${paymentMethod === "online" ? "border-rose-600 bg-rose-50 text-rose-700" : "text-gray-500"}`}
                >
                  Pay Online
                </button>
                <button
                  onClick={() => setPaymentMethod("pay_at_pickup")}
                  className={`flex-1 p-4 border rounded-xl font-bold ${paymentMethod === "pay_at_pickup" ? "border-rose-600 bg-rose-50 text-rose-700" : "text-gray-500"}`}
                >
                  Pay on Pickup
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl h-fit border border-gray-200 dark:border-gray-800 sticky top-28">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
              <Car className="text-rose-600" /> Summary
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p className="text-lg font-bold text-black dark:text-white">
                {vehicleName}
              </p>
              <div className="flex justify-between">
                <span>Rate</span>
                <span>₹{pricePerDay}/day</span>
              </div>
              <div className="flex justify-between">
                <span>Days</span>
                <span>{days}</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-end">
                <span className="font-bold text-lg dark:text-white">Total</span>
                <span className="font-extrabold text-2xl text-rose-600">
                  ₹{totalPrice}
                </span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VehicleBookingContent />
    </Suspense>
  );
}
