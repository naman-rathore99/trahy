"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
    Loader2, Calendar, MapPin, Car, ChevronRight, Clock, XCircle, Ticket, CheckCircle, AlertTriangle
} from "lucide-react";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";

// --- TYPES ---
interface Booking {
    id: string;
    listingId: string;
    listingName: string;
    listingImage: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: "confirmed" | "pending" | "cancelled" | "failed";
    vehicleIncluded?: boolean;
    vehicleType?: string;
    hasOpenTicket?: boolean; // New field for support queries
    createdAt: string;
}

export default function TripsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // --- 1. FETCH TRIPS ---
    useEffect(() => {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/trips");
                return;
            }

            try {
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

    // --- 2. CANCEL HANDLER ---
    const handleCancel = async (e: React.MouseEvent, bookingId: string) => {
        e.stopPropagation();

        const confirmCancel = window.confirm("Are you sure you want to cancel this trip? This action cannot be undone.");
        if (!confirmCancel) return;

        setCancellingId(bookingId);

        try {
            const res = await fetch("/api/bookings/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            if (res.ok) {
                setBookings((prev) =>
                    prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b)
                );
            } else {
                alert("Failed to cancel booking. Please contact support.");
            }
        } catch (error) {
            alert("Error processing cancellation");
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
        );
    }

    // --- EMPTY STATE ---
    if (bookings.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar variant="default" />
                <div className="max-w-4xl mx-auto px-4 pt-40 text-center">
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
                        const checkOutDate = parseISO(booking.checkOut);

                        // Logic for Status
                        const isCancelled = booking.status === "cancelled";
                        const isFailed = booking.status === "failed";
                        const isCompleted = !isCancelled && !isFailed && isPast(checkOutDate) && !isToday(checkOutDate);
                        const isUpcoming = !isCancelled && !isFailed && !isCompleted;

                        // Logic for Actions
                        const canCancel = isUpcoming && !isCancelled && !isFailed;

                        return (
                            <div
                                key={booking.id}
                                onClick={() => router.push(`/book/success/${booking.id}`)}
                                className={`group bg-white rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden ${isCancelled || isFailed ? 'opacity-75 border-gray-200 bg-gray-50' : 'border-gray-200'}`}
                            >
                                {/* Image & Main Badge */}
                                <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden relative">
                                    <img
                                        src={booking.listingImage}
                                        alt={booking.listingName}
                                        className={`w-full h-full object-cover transition-transform duration-500 ${!isCancelled && 'group-hover:scale-105'} ${isCompleted && 'grayscale'}`}
                                    />

                                    {/* STATUS BADGE */}
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isCancelled ? 'bg-red-500 text-white' :
                                        isFailed ? 'bg-gray-800 text-white' :
                                            isCompleted ? 'bg-gray-600 text-white' :
                                                'bg-emerald-500 text-white'
                                        }`}>
                                        {isCancelled ? "Cancelled" : isFailed ? "Failed" : isCompleted ? "Completed" : "Confirmed"}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-center py-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-gray-600' : 'text-gray-900'}`}>{booking.listingName}</h3>

                                            {/* SUB-STATUS TEXT */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {isCancelled ? (
                                                    <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                                                        <XCircle size={14} /> Booking Cancelled
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                                                        <CheckCircle size={14} /> Trip Ended
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                                        <Clock size={12} /> Upcoming Trip
                                                    </span>
                                                )}

                                                {/* --- NEW: OPEN TICKET ALERT --- */}
                                                {booking.hasOpenTicket && !isCancelled && (
                                                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} /> Request Pending
                                                    </span>
                                                )}
                                            </div>
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
                                    {booking.vehicleIncluded && !isCancelled && !isFailed && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-lg mb-4">
                                            <Car size={14} />
                                            <span>Includes {booking.vehicleType || "Vehicle"}</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-gray-100 sm:border-0 sm:pt-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/book/success/${booking.id}`);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                                        >
                                            <Ticket size={14} /> {isCompleted ? "View Receipt" : "Manage Booking"}
                                        </button>

                                        {canCancel && (
                                            <button
                                                onClick={(e) => handleCancel(e, booking.id)}
                                                disabled={cancellingId === booking.id}
                                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                {cancellingId === booking.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}