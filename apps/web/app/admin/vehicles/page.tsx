"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Car,
  MapPin,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Loader2,
  Fuel,
  Gauge,
} from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH VEHICLES
  const fetchVehicles = async () => {
    try {
      // We fetch ALL hotels, then filter for 'vehicle'
      const data = await apiRequest("/api/admin/hotels", "GET");
      const onlyVehicles = (data.hotels || []).filter(
        (p: any) => p.type === "vehicle"
      );
      setVehicles(onlyVehicles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // APPROVE ACTION
  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this vehicle?")) return;

    try {
      await apiRequest("/api/admin/hotels/approve", "POST", {
        propertyId: id,
        status: "approved",
      });
      // Optimistic Update
      setVehicles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
      );
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Vehicle Fleet
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage cars, bikes, and rental transport.
          </p>
        </div>
        <div className="text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg border border-purple-100 dark:border-purple-900">
          Total Vehicles: {vehicles.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Rate</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* VEHICLE INFO */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-16 bg-gray-200 rounded-lg overflow-hidden relative">
                      <img
                        src={v.imageUrl || "/placeholder-car.jpg"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {v.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {v.location}
                      </div>
                    </div>
                  </div>
                </td>

                {/* DETAILS (Fuel, Type) */}
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 flex items-center gap-1">
                      <Car size={10} /> {v.category || "Sedan"}{" "}
                      {/* e.g. SUV, Hatchback */}
                    </span>
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 flex items-center gap-1">
                      <Fuel size={10} /> {v.fuelType || "Petrol"}
                    </span>
                  </div>
                </td>

                {/* RATE */}
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">
                    ₹{v.price}
                  </div>
                  <div className="text-[10px] text-gray-400">per day</div>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  {v.status === "approved" ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded w-fit">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right">
                  {v.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(v.id)}
                      className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Car
                      size={40}
                      className="text-gray-200 dark:text-gray-800"
                    />
                    <span>No vehicles found in fleet.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
