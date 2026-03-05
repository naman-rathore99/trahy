"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { Loader2, Car, Wallet, CreditCard } from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function VehicleBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth(app);

  const vehicleId = searchParams.get("vehicleId");
  const vehicleName = searchParams.get("vehicleName") || "Vehicle Rental";
  const pricePerDay = Number(searchParams.get("price")) || 0;
  const initialStart = searchParams.get("start") || "";
  const initialEnd = searchParams.get("end") || "";

  const [dates] = useState({ start: initialStart, end: initialEnd });
  const [days, setDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "pay_at_pickup" | "online"
  >("online");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
      const user = auth.currentUser;
      if (!user) return alert("Please log in to continue.");
      const idToken = await user.getIdToken();

      // 1. Create booking
      const createRes = await apiRequest("/api/bookings/vehicle", "POST", {
        vehicleId,
        vehicleName,
        pricePerDay,
        totalPrice,
        startDate: dates.start,
        endDate: dates.end,
        days,
        customer: { ...formData, userId: user.uid },
        paymentMethod,
        status: paymentMethod === "online" ? "pending_payment" : "confirmed",
      });

      if (!createRes?.success || !createRes.bookingId)
        throw new Error("No Booking ID returned");

      // 2. Pay at pickup
      if (paymentMethod === "pay_at_pickup") {
        router.push(`/book/success/${createRes.bookingId}`);
        return;
      }

      // 3. Get Razorpay order
      const paymentRes = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ bookingId: createRes.bookingId, source: "web" }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok)
        throw new Error(paymentData.error || "Payment Gateway Error.");

      // 4. Open Razorpay modal
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        order_id: paymentData.orderId,
        name: "Shubhyatra",
        description: vehicleName,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#e11d48" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: createRes.bookingId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success)
            router.push(`/book/success/${createRes.bookingId}`);
          else router.push(`/book/failure/${createRes.bookingId}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            router.push(`/book/failure/${createRes.bookingId}`);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Booking Failed.");
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
                  className={`flex-1 p-4 border rounded-xl font-bold flex items-center justify-center gap-2 ${paymentMethod === "online" ? "border-rose-600 bg-rose-50 text-rose-700" : "text-gray-500"}`}
                >
                  <CreditCard size={18} /> Pay Online
                </button>
                <button
                  onClick={() => setPaymentMethod("pay_at_pickup")}
                  className={`flex-1 p-4 border rounded-xl font-bold flex items-center justify-center gap-2 ${paymentMethod === "pay_at_pickup" ? "border-rose-600 bg-rose-50 text-rose-700" : "text-gray-500"}`}
                >
                  <Wallet size={18} /> Pay on Pickup
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
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : paymentMethod === "online" ? (
                "Pay Now"
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-rose-600" />
        </div>
      }
    >
      <VehicleBookingContent />
    </Suspense>
  );
}
