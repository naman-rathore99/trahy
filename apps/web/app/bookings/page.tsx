"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

function BookingsContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // Default to 'all'

  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiRequest("/api/admin/bookings", "GET");
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    if (activeTab === "confirmed") return booking.status === "confirmed";
    if (activeTab === "pending") return booking.status === "pending";
    if (activeTab === "failed")
      return booking.status === "failed" || booking.status === "cancelled";
    return true;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 md:pt-32">
      {/* --- STATUS BANNERS --- */}
      {success === "true" && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="bg-green-100 p-2 rounded-full text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-green-800">Payment Successful!</h3>
            <p className="text-sm text-green-700">
              Your booking has been confirmed.
            </p>
          </div>
          <button
            onClick={() => window.history.replaceState({}, "", "/bookings")}
            className="ml-auto text-green-600 font-bold text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {success === "false" && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-800">Payment Failed</h3>
            <p className="text-sm text-red-700">
              The transaction failed or was cancelled.
            </p>
          </div>
          <button
            onClick={() => window.history.replaceState({}, "", "/bookings")}
            className="ml-auto text-red-600 font-bold text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- HEADER & FILTER TABS --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">Manage your trips and payments</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          {["all", "confirmed", "pending", "failed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- EMPTY STATE --- */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Calendar size={48} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No {activeTab === "all" ? "" : activeTab} bookings
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            You don't have any {activeTab === "all" ? "" : activeTab} bookings
            right now.
          </p>
          {activeTab === "all" && (
            <Link
              href="/"
              className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg mt-4"
            >
              Start Exploring
            </Link>
          )}
        </div>
      ) : (
        /* --- LIST --- */
        <div className="space-y-6">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="group bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden"
            >
              {/* Status Bar Color */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  booking.status === "confirmed"
                    ? "bg-green-500"
                    : booking.status === "failed"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />

              <div className="w-full md:w-64 h-48 md:h-40 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                <img
                  src={booking.listingImage || "/placeholder.jpg"}
                  alt={booking.listingName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {booking.listingName}
                    </h3>

                    {/* Badge Logic */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                        booking.status === "confirmed"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : booking.status === "failed"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}
                    >
                      {booking.status === "confirmed" && (
                        <CheckCircle size={12} />
                      )}
                      {booking.status === "pending" && <Clock size={12} />}
                      {booking.status === "failed" && <XCircle size={12} />}
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />{" "}
                      {booking.checkIn
                        ? format(parseISO(booking.checkIn), "MMM dd")
                        : "?"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} /> {booking.guests} Guests
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                  <p className="text-xl font-bold">
                    ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
                  </p>

                  {/* Action Buttons based on Status */}
                  {booking.status === "pending" ||
                  booking.status === "failed" ? (
                    <Link
                      href={`/book/${booking.listingId}?start=${booking.checkIn}&end=${booking.checkOut}&guests=${booking.guests}`}
                      className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700"
                    >
                      Retry Payment <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <button className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg text-sm font-bold">
                      Details <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar variant="default" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        }
      >
        <BookingsContent />
      </Suspense>
    </main>
  );
}
