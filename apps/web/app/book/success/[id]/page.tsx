"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import {
    CheckCircle, Loader2, MapPin, Calendar, Users, Car, Download, Home
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // --- REAL-TIME FETCH ---
    // We use onSnapshot so if the API update is split-second slower, 
    // the UI updates instantly when the status flips to 'confirmed'
    useEffect(() => {
        if (!id) return;
        const db = getFirestore(app);
        const unsub = onSnapshot(doc(db, "bookings", id), (doc) => {
            if (doc.exists()) {
                setBooking({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
        });
        return () => unsub();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Booking not found.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <Navbar variant="default" />

            <div className="max-w-3xl mx-auto px-4 pt-32">

                {/* SUCCESS HEADER */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-gray-500">
                        Thank you. Your booking ID is <span className="font-mono font-bold text-gray-700">#{booking.id.slice(0, 6).toUpperCase()}</span>
                    </p>
                </div>

                {/* TICKET CARD */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                    {/* Top Decorative Border */}
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

                    <div className="p-8 space-y-8">

                        {/* 1. HOTEL DETAILS */}
                        <div className="flex gap-5 items-start border-b border-gray-100 pb-8">
                            <img
                                src={booking.listingImage}
                                className="w-24 h-24 object-cover rounded-xl shadow-sm"
                                alt="Hotel"
                            />
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
                                    {booking.serviceType === 'package' ? 'Stay + Vehicle Package' : 'Hotel Stay'}
                                </p>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{booking.listingName}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                                        <Calendar size={14} />
                                        {format(parseISO(booking.checkIn), "dd MMM")} - {format(parseISO(booking.checkOut), "dd MMM")}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                                        <Users size={14} /> {booking.guests} Guests
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. VEHICLE DETAILS (Conditional) */}
                        {booking.vehicleIncluded && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-center gap-4">
                                <div className="bg-white p-3 rounded-full text-rose-600 shadow-sm">
                                    <Car size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{booking.vehicleType}</p>
                                    <p className="text-sm text-gray-600">Vehicle included for entire stay</p>
                                </div>
                            </div>
                        )}

                        {/* 3. PAYMENT SUMMARY */}
                        <div className="space-y-3">
                            <p className="font-bold text-gray-900 mb-2">Payment Summary</p>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Status</span>
                                <span className="font-bold text-emerald-600 uppercase text-xs bg-emerald-50 px-2 py-1 rounded">Paid via Online</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Total Amount Paid</span>
                                <span className="font-bold text-gray-900 text-lg">₹{Number(booking.totalAmount).toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                    </div>

                    {/* ACTIONS FOOTER */}
                    <div className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                        >
                            <Download size={18} /> Download Receipt
                        </button>
                        <button
                            onClick={() => router.push("/trips")}
                            className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            <Home size={18} /> Go to My Trips
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}