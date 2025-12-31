"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import {
    Calendar, ShieldCheck, Loader2, ArrowRight,
    Bike, Car, MapPin, CheckCircle, CreditCard, Wallet
} from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

function VehicleBookingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const auth = getAuth(app);

    // Data from URL
    const vehicleId = searchParams.get("vehicleId");
    const vehicleName = searchParams.get("vehicleName") || "Vehicle Rental";
    const pricePerDay = Number(searchParams.get("price")) || 0;
    const initialStart = searchParams.get("start") || "";
    const initialEnd = searchParams.get("end") || "";

    // State
    const [dates, setDates] = useState({ start: initialStart, end: initialEnd });
    const [days, setDays] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(false);

    // ✅ NEW: Payment Method State
    const [paymentMethod, setPaymentMethod] = useState<"pay_at_pickup" | "online">("online");

    // User Form
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    name: user.displayName || prev.name,
                    email: user.email || prev.email,
                }));
            }
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (dates.start && dates.end) {
            const start = parseISO(dates.start);
            const end = parseISO(dates.end);
            if (isValid(start) && isValid(end)) {
                const diff = differenceInDays(end, start);
                if (diff > 0) {
                    setDays(diff);
                    setTotalPrice(diff * pricePerDay);
                } else {
                    setDays(0);
                    setTotalPrice(0);
                }
            }
        }
    }, [dates, pricePerDay]);

    const handleConfirm = async () => {
        if (!formData.name || !formData.phone || !dates.start || !dates.end) {
            return alert("Please fill all details correctly.");
        }
        if (days <= 0) return alert("Invalid dates selected.");

        setLoading(true);
        try {
            const bookingData = {
                vehicleId,
                vehicleName,
                pricePerDay,
                totalPrice,
                startDate: dates.start,
                endDate: dates.end,
                days,
                customer: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    userId: auth.currentUser?.uid || "guest",
                },
                paymentMethod, // Pass the selected method
            };

            if (paymentMethod === "pay_at_pickup") {
                // --- EXISTING FLOW ---
                await apiRequest("/api/bookings/vehicle", "POST", bookingData);
                router.push("/book/success");
            } else {
                // --- ✅ NEW: ONLINE PAYMENT FLOW ---
                // 1. Create booking as "pending"
                const res = await apiRequest("/api/bookings/vehicle", "POST", { ...bookingData, status: "pending_payment" });

                if (res.success && res.bookingId) {
                    // 2. Initiate PhonePe Payment
                    const paymentRes = await apiRequest("/api/payment/initiate", "POST", {
                        bookingId: res.bookingId,
                        amount: totalPrice,
                        mobile: formData.phone,
                    });

                    // 3. Redirect user to PhonePe Gateway
                    if (paymentRes.url) {
                        window.location.href = paymentRes.url;
                    } else {
                        alert("Payment initiation failed.");
                        setLoading(false);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            alert("Booking Failed. Please try again.");
            setLoading(false);
        }
    };

    if (!vehicleId) return <div>Invalid Link</div>;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
            <Navbar variant="default" />

            <div className="max-w-6xl mx-auto px-4 pt-28 md:pt-32">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Complete your booking</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-6">
                        {/* User Details */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" /> Traveler Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                                    <input type="text" className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-medium dark:text-white" placeholder="Enter full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Phone Number</label>
                                    <input type="tel" className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-medium dark:text-white" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                                    <input type="email" className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none font-medium dark:text-white" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* ✅ NEW: Payment Method Selection */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Payment Method</h2>
                            <div className="space-y-3">

                                {/* Option 1: Online Payment */}
                                <div
                                    onClick={() => setPaymentMethod("online")}
                                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/10 ring-1 ring-rose-600' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-rose-600' : 'border-gray-400'}`}>
                                            {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard size={18} /> Pay Online</span>
                                            <p className="text-xs text-gray-500">UPI, Credit/Debit Card, Net Banking (PhonePe)</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Fast & Secure</span>
                                </div>

                                {/* Option 2: Pay at Pickup */}
                                <div
                                    onClick={() => setPaymentMethod("pay_at_pickup")}
                                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'pay_at_pickup' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/10 ring-1 ring-rose-600' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'pay_at_pickup' ? 'border-rose-600' : 'border-gray-400'}`}>
                                            {paymentMethod === 'pay_at_pickup' && <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wallet size={18} /> Pay at Pickup</span>
                                            <p className="text-xs text-gray-500">Pay via Cash or UPI when you arrive</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="relative">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 sticky top-28">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <Car className="text-rose-600" /> Booking Summary
                            </h3>

                            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">{vehicleName}</h4>
                                <p className="text-sm text-gray-500">Self Drive Rental</p>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <div className="flex justify-between"><span>Rate per day</span><span>₹{pricePerDay}</span></div>
                                <div className="flex justify-between"><span>Duration</span><span>{days} Days</span></div>
                                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2 flex justify-between items-end">
                                    <span className="font-bold text-lg text-gray-900 dark:text-white">Total Pay</span>
                                    <span className="font-extrabold text-2xl text-rose-600">₹{totalPrice}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={loading || days <= 0}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (paymentMethod === "online" ? "Pay Now" : "Confirm Booking")}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function VehicleBookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-rose-600" /></div>}>
            <VehicleBookingContent />
        </Suspense>
    );
}