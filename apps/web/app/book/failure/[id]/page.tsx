"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { XCircle, RefreshCcw, Home, Loader2 } from "lucide-react";

export default function PaymentFailurePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // --- RETRY LOGIC ---
    const handleRetry = async () => {
        setLoading(true);
        try {
            const db = getFirestore(app);
            const docRef = doc(db, "bookings", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                const params = new URLSearchParams();
                params.set("start", data.checkIn);
                params.set("end", data.checkOut);
                params.set("guests", data.guests);

                // ✅ FIX: DETECT VEHICLE VS HOTEL
                if (data.serviceType === "vehicle_only") {
                    // Redirect to Vehicle Checkout
                    params.set("vehicleId", data.listingId);
                    params.set("vehicleName", data.listingName);
                    params.set("price", data.vehiclePrice?.toString() || "0");
                    params.set("type", "vehicle_only");

                    router.push(`/book/vehicle?${params.toString()}`);
                } else {
                    // Redirect to Hotel Checkout
                    if (data.vehicleIncluded) {
                        params.set("vehicleName", data.vehicleType);
                    }
                    router.push(`/book/${data.listingId}?${params.toString()}`);
                }

            } else {
                alert("Booking details not found. Please start over.");
                router.push("/");
            }
        } catch (error) {
            console.error("Retry Error:", error);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <Navbar variant="default" />

            <div className="max-w-md mx-auto px-4 pt-40 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-500 mb-8">
                    We couldn't process your payment. Your booking has not been confirmed.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleRetry}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                        Retry Payment
                    </button>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        <Home size={18} /> Go Home
                    </button>
                </div>
            </div>
        </main>
    );
}