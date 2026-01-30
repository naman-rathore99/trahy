"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  User,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  CreditCard,
  MoreVertical,
  BedDouble,
  Search,
  Filter,
} from "lucide-react";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";

// --- TYPES ---
interface Booking {
  id: string;
  guestName: string;
  guestContact?: string;
  roomType?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  guestsCount?: number;
}

export default function PartnerBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "history">(
    "active",
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/partner/bookings", "GET");

      // Normalize Data
      const normalized = (data.bookings || []).map((b: any) => ({
        ...b,
        guestName: b.customerName || b.customer?.name || "Guest",
        guestContact: b.customerContact || b.customer?.phone || "N/A",
        checkIn: b.checkIn || b.startDate, // Handle both formats
        checkOut: b.checkOut || b.endDate,
        roomType: b.listingName || "Standard Room",
        totalAmount: Number(b.totalAmount || b.totalPrice || 0),
        paymentStatus: b.paymentStatus || "pending",
      }));

      setBookings(normalized);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  const filteredBookings = bookings.filter((b) => {
    // 1. Search Filter
    if (
      searchTerm &&
      !b.guestName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    const checkIn = parseISO(b.checkIn);
    const checkOut = parseISO(b.checkOut);

    // 2. Tab Filter
    if (activeTab === "active") {
      // Arriving Today OR Currently In-House (Past check-in, Future check-out)
      return (
        (isToday(checkIn) && b.status === "confirmed") ||
        (isPast(checkIn) && isFuture(checkOut) && b.status === "confirmed")
      );
    }
    if (activeTab === "upcoming") {
      return isFuture(checkIn) && b.status !== "cancelled";
    }
    if (activeTab === "history") {
      return isPast(checkOut) || b.status === "cancelled";
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-24 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Guest Manager
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track arrivals, departures, and active stays.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 flex shadow-sm">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
              In-House
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "upcoming" ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
              History
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            placeholder="Search guest name..."
            className="w-full pl-10 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LIST */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 font-medium">
              No bookings found for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Status Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.status === "confirmed" ? "bg-green-500" : booking.status === "cancelled" ? "bg-red-500" : "bg-yellow-500"}`}
                ></div>

                <div className="pl-3">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 font-bold text-lg">
                        {booking.guestName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {booking.guestName}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={10} /> {booking.guestContact}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-gray-900 dark:text-white">
                        ₹{booking.totalAmount.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-block mt-1 ${getStatusColor(booking.paymentStatus)}`}
                      >
                        {booking.paymentStatus}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex justify-between items-center text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-gray-400 font-bold">
                        Check In
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={14} className="text-rose-500" />{" "}
                        {format(parseISO(booking.checkIn), "dd MMM")}
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[10px] uppercase text-gray-400 font-bold">
                        Room
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-2">
                        {booking.roomType}{" "}
                        <BedDouble size={14} className="text-blue-500" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- DETAILS SLIDE-OVER --- */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedBooking(null)}
            ></div>
            <div className="relative w-full max-w-md bg-white dark:bg-black h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* ID Card */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                  <div className="w-20 h-20 bg-white dark:bg-black rounded-full mx-auto mb-3 flex items-center justify-center shadow-sm">
                    <User size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedBooking.guestName}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {selectedBooking.guestContact}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(selectedBooking.status)}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>

                {/* Stay Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase text-gray-500">
                    Stay Information
                  </h4>
                  <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-400">Check In</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {format(
                          parseISO(selectedBooking.checkIn),
                          "dd MMM yyyy",
                        )}
                      </p>
                    </div>
                    <Clock size={20} className="text-gray-300" />
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Check Out</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {format(
                          parseISO(selectedBooking.checkOut),
                          "dd MMM yyyy",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Room Type
                    </span>
                    <span className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                      <BedDouble size={16} /> {selectedBooking.roomType}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase text-gray-500">
                    Payment Status
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-gray-400" size={20} />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          Total Amount
                        </p>
                        <p className="text-xs text-gray-500">
                          Includes taxes & fees
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                      ₹{selectedBooking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
