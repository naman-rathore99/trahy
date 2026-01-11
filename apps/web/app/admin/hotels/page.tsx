"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import {
  Edit,
  CheckCircle,
  Clock,
  Ban,
  MapPin,
  Loader2,
  Hotel,
} from "lucide-react";

export default function AdminDashboard() {
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab Order: Active -> Pending -> Banned
  const [activeTab, setActiveTab] = useState<"approved" | "pending" | "banned">(
    "approved"
  );

  useEffect(() => {
    setLoading(true);
    // 1. Fetch All Hotels
    apiRequest("/api/admin/hotels", "GET")
      .then((data) => {
        setAllHotels(data.hotels || []);
        console.log("Fetched hotels:", data.hotels);
      })
      .catch((err) => console.error("Failed to load hotels:", err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ FIX: Case-Insensitive Filtering
  // This safely converts DB status (e.g., "APPROVED") to lowercase ("approved") to match tabs
  const filteredHotels = allHotels.filter((h) => {
    const status = (h.status || "pending").toLowerCase();
    return status === activeTab;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Manage Hotels
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Review and manage hotel listings in Mathura & Vrindavan.
            </p>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveTab("approved")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "approved"
                ? "border-b-2 border-green-600 text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CheckCircle size={16} /> Active Hotels
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Clock size={16} /> Pending Review
          </button>
          <button
            onClick={() => setActiveTab("banned")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "banned"
                ? "border-b-2 border-red-600 text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Ban size={16} /> Banned
          </button>
        </div>

        {/* --- LIST AREA --- */}
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-12 text-center rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Hotel className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No hotels found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              There are no {activeTab} hotels right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 items-start md:items-center transition-colors hover:border-gray-300 dark:hover:border-gray-700"
              >
                {/* Image */}
                <div className="w-full md:w-32 h-48 md:h-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 relative">
                  {(hotel.images && hotel.images[0]) || hotel.imageUrl ? (
                    <img
                      src={hotel.images?.[0] || hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-1">
                        <MapPin size={14} />
                        {hotel.location || "Mathura"}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="hidden md:block text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        ₹{hotel.pricePerNight || hotel.price}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Owner:
                    </span>{" "}
                    {hotel.ownerName || "Unknown"}
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{hotel.ownerEmail || "No Email"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex w-full md:w-auto gap-3 mt-2 md:mt-0">
                  <Link
                    href={`/admin/hotels/${hotel.id}`}
                    className="flex-1 md:flex-none text-center bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={16} /> Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
