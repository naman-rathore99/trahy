"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Calendar, Search, Filter, Loader2, User } from "lucide-react";

export default function PartnerBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await apiRequest("/api/partner/bookings", "GET");
            setBookings(res.bookings || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-600" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
                    <p className="text-gray-500">Track upcoming check-ins and history.</p>
                </div>
                {/* Simple Search UI (Visual only for now) */}
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input placeholder="Search guest name..." className="pl-10 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-64 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white" />
                    </div>
                    <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50">
                        <Filter size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="p-4">Guest</th>
                            <th className="p-4">Dates</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No bookings found yet.</td>
                            </tr>
                        ) : (
                            bookings.map((b) => (
                                <tr key={b.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"><User size={16} /></div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{b.guestName || "Guest"}</div>
                                                <div className="text-xs text-gray-500">{b.guestEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        <div className="flex items-center gap-1 font-medium">
                                            <Calendar size={14} />
                                            {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded font-bold text-xs uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                b.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">₹{b.totalAmount}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}