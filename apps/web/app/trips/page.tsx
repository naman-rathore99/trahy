"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
    Loader2, Calendar, MapPin, Car, ChevronRight, Clock, CheckCircle
} from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";

// --- TYPES ---
interface Booking {
    id: string;
    listingId: string;
    listingName: string;
    listingImage: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: "confirmed" | "pending" | "cancelled";
    vehicleIncluded?: boolean;
    vehicleType?: string;
    createdAt: string;
}

export default function TripsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // --- 1. AUTH & FETCH ---
    useEffect(() => {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/trips");
                return;
            }
            setUser(currentUser);

            try {
                // Query: Get bookings for this user
                // Note: 'userId' must be saved in your booking document creation step
                // If you get a "Missing Index" error in console, click the link Firebase gives you.
                const q = query(
                    collection(db, "bookings"),
                    where("userId", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[];

                setBookings(data);
            } catch (err) {
                console.error("Error fetching trips:", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
        );
    }

    // --- 2. EMPTY STATE ---
    if (bookings.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar variant="default" />
                <div className="max-w-4xl mx-auto px-4 pt-32 text-center">
                    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">No trips booked... yet!</h1>
                        <p className="text-gray-500 mb-8">Time to dust off your bags and start planning your next adventure.</p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:opacity-80 transition-opacity"
                        >
                            Start Exploring
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <Navbar variant="default" />

            <div className="max-w-4xl mx-auto px-4 pt-32">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Trips</h1>

                <div className="space-y-6">
                    {bookings.map((booking) => {
                        const isUpcoming = isFuture(parseISO(booking.checkIn));

                        return (
                            <div
                                key={booking.id}
                                onClick={() => router.push(`/book/success/${booking.id}`)} // Link to Receipt
                                className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden"
                            >
                                {/* Image */}
                                <div className="w-full sm:w-48 h-48 sm:h-32 shrink-0 rounded-xl overflow-hidden relative">
                                    <img
                                        src={booking.listingImage}
                                        alt={booking.listingName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Status Badge */}
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                                        }`}>
                                        {booking.status}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.listingName}</h3>
                                            <p className="text-gray-500 text-sm flex items-center gap-2 mb-3">
                                                {isUpcoming ? (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                                        <Clock size={12} /> Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">Past Trip</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <span className="text-lg font-bold">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{format(parseISO(booking.checkIn), "dd MMM yyyy")}</span>
                                        <span className="text-gray-300 mx-1">→</span>
                                        <span>{format(parseISO(booking.checkOut), "dd MMM yyyy")}</span>
                                    </div>

                                    {/* Vehicle Badge */}
                                    {booking.vehicleIncluded && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-lg">
                                            <Car size={14} />
                                            <span>Includes {booking.vehicleType || "Vehicle"}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow Icon (Desktop) */}
                                <div className="hidden sm:flex items-center justify-center text-gray-300 group-hover:text-black transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}