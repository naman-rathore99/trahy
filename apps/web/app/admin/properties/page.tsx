"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { Edit, Eye, CheckCircle, Clock, Ban } from "lucide-react";

export default function PropertyManagePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // NEW: State to control which tab is active
  const [filter, setFilter] = useState<"pending" | "approved" | "banned">(
    "pending"
  );

  useEffect(() => {
    setLoading(true);
    // Fetch based on the current filter
    apiRequest(`/api/admin/properties?status=${filter}`, "GET")
      .then((data) => setProperties(data.properties || []))
      .finally(() => setLoading(false));
  }, [filter]); // Re-run whenever 'filter' changes

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Properties</h1>
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setFilter("pending")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${filter === "pending" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
          >
            <Clock size={16} /> Pending Review
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${filter === "approved" ? "border-b-2 border-green-600 text-green-600" : "text-gray-500"}`}
          >
            <CheckCircle size={16} /> Active Listings
          </button>
          <button
            onClick={() => setFilter("banned")}
            className={`pb-3 px-4 font-medium flex items-center gap-2 ${filter === "banned" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500"}`}
          >
            <Ban size={16} /> Banned
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm text-gray-500">
            No properties found in this category.
          </div>
        ) : (
          <div className="grid gap-4">
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white p-6 rounded-xl shadow-sm border flex gap-6 items-center"
              >
                <img
                  src={prop.imageUrl || "/placeholder.jpg"}
                  className="w-32 h-24 object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{prop.name}</h3>
                  <p className="text-gray-500">
                    {prop.location} • ₹{prop.pricePerNight}/night
                  </p>

                  {/* Status Badge */}
                  <div className="mt-2">
                    {filter === "pending" && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold uppercase">
                        Pending
                      </span>
                    )}
                    {filter === "approved" && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold uppercase">
                        Live
                      </span>
                    )}
                    {filter === "banned" && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold uppercase">
                        Banned
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/admin/properties/${prop.id}`}
                    className="bg-black text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2"
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
