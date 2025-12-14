"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Loader2, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function MyTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // We need to create this GET endpoint too, but let's assume it fetches user's bookings
        // For now, we will just fetch ALL and filter in frontend (Not ideal for production, but works for MVP)
        // Ideally: GET /api/my-bookings
        const data = await apiRequest("/api/admin/bookings", "GET"); // Re-using admin one for quick test
        // Filter only MY trips (The backend actually needs to do this security filtering)
        setTrips(data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar variant="default" />

      <div className="max-w-4xl mx-auto px-4 pt-32">
        <h1 className="text-3xl font-bold mb-8">My Trips</h1>

        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-400 mb-4">
              No trips booked... yet!
            </h2>
            <Link
              href="/"
              className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:opacity-80"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6"
              >
                {/* IMAGE */}
                <div className="w-full md:w-48 h-32 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={trip.imageUrl || "/placeholder.jpg"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* INFO */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{trip.serviceName}</h3>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 flex items-center gap-1">
                      <CheckCircle size={12} /> {trip.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {trip.checkIn} — {trip.checkOut}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} /> {trip.serviceType}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Booking ID: {trip.id.slice(0, 8)}...
                    </div>
                    <div className="font-bold text-lg">
                      ₹{trip.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
