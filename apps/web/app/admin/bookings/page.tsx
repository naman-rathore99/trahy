"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

// --- 1. ADD THIS HELPER FUNCTION ---
// This safely converts Firebase Timestamps, strings, or numbers into a JS Date
const safeDate = (dateValue: any) => {
  if (!dateValue) return new Date(); // Fallback to now if missing

  // If it's a Firebase Timestamp (has .toDate)
  if (typeof dateValue === "object" && typeof dateValue.toDate === "function") {
    return dateValue.toDate();
  }

  // If it's a standard string or number
  return new Date(dateValue);
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiRequest("/api/admin/bookings", "GET");
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">All Bookings</h1>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="py-2">User</th>
            <th className="py-2">Property</th>
            <th className="py-2">Status</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b: any) => (
            <tr key={b.id} className="border-b">
              <td className="py-4">
                <div className="font-bold">{b.userName}</div>
                <div className="text-xs text-gray-400">{b.userEmail}</div>
              </td>
              <td className="py-4">{b.propertyName}</td>
              <td className="py-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    b.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {b.status}
                </span>
              </td>
              <td className="py-4">
                <div className="font-medium">
                  {/* USE THE HELPER FUNCTION HERE */}
                  {format(safeDate(b.startDate), "MMM dd")} -{" "}
                  {format(safeDate(b.endDate), "MMM dd")}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {/* FIX IS HERE: */}
                  Booked: {format(safeDate(b.bookedAt), "MMM dd, yyyy")}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
