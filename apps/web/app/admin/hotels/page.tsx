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
  Mail,
} from "lucide-react";

export default function AdminDashboard() {
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"approved" | "pending" | "banned">(
    "approved",
  );

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/hotels", "GET");
      if (data && data.hotels) setAllHotels(data.hotels);
    } catch (err) {
      console.error("Failed to load hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = allHotels.filter((h) => {
    const status = (h.status || "pending").toLowerCase();
    if (activeTab === "approved")
      return ["approved", "active", "confirmed"].includes(status);
    if (activeTab === "pending") return ["pending", "review"].includes(status);
    if (activeTab === "banned") return ["banned", "rejected"].includes(status);
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Manage Hotels
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {filteredHotels.length} {activeTab} listings found
            </p>
          </div>

          {/* TABS (Pill Style) */}
          <div className="flex p-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
            {[
              {
                id: "approved",
                label: "Active",
                icon: CheckCircle,
                color: "text-green-600",
              },
              {
                id: "pending",
                label: "Pending",
                icon: Clock,
                color: "text-yellow-600",
              },
              {
                id: "banned",
                label: "Banned",
                icon: Ban,
                color: "text-red-600",
              },
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <tab.icon
                  size={16}
                  className={activeTab === tab.id ? tab.color : ""}
                />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
            <Hotel className="text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">
              No hotels found in this tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row"
              >
                {/* IMAGE SECTION */}
                <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 relative shrink-0">
                  {hotel.imageUrl || (hotel.imageUrls && hotel.imageUrls[0]) ? (
                    <img
                      src={hotel.imageUrl || hotel.imageUrls[0]}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Hotel size={32} />
                      <span className="text-xs font-bold mt-2">No Image</span>
                    </div>
                  )}
                  {/* Status Badge (Mobile Overlay) */}
                  <div className="absolute top-3 left-3 md:hidden">
                    <StatusBadge status={hotel.status} />
                  </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                  {/* Top Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {hotel.name || "Unnamed Hotel"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1.5">
                        <MapPin size={14} className="text-rose-500" />
                        {hotel.location || "Location not set"}
                      </div>
                    </div>
                    {/* Price (Hidden on small mobile, visible on desktop) */}
                    <div className="text-right hidden md:block">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{hotel.pricePerNight}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                  </div>

                  {/* Owner Info Block */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {hotel.ownerName?.[0] || "U"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {hotel.ownerName || "Unknown Owner"}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail size={10} /> {hotel.ownerEmail}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between gap-4 mt-auto">
                    <div className="md:hidden">
                      <span className="text-lg font-bold">
                        ₹{hotel.pricePerNight}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        / night
                      </span>
                    </div>

                    <Link
                      href={`/admin/hotels/${hotel.id}`}
                      className="flex-1 md:flex-none bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity text-center"
                    >
                      Manage Hotel
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Small Helper Component for Badges
function StatusBadge({ status }: { status: string }) {
  const s = (status || "pending").toLowerCase();
  let color = "bg-gray-100 text-gray-600";
  if (["approved", "active"].includes(s)) color = "bg-green-100 text-green-700";
  if (["pending", "review"].includes(s))
    color = "bg-yellow-100 text-yellow-700";
  if (["banned", "rejected"].includes(s)) color = "bg-red-100 text-red-700";

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm ${color}`}
    >
      {status}
    </span>
  );
}
