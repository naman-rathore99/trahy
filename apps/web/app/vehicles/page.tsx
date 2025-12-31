"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import {
  Calendar,
  ArrowRight,
  Star,
  Fuel,
  Users,
  Zap,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface Vehicle {
  id: string;
  name: string;
  category: string; // "2-Wheeler", "Car", etc.
  type: string; // "SUV", "Scooty"
  price: number;
  seats: number;
  fuel: string;
  imageUrl: string;
  features: string[];
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  // Booking Dates
  const [dates, setDates] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });

  // 1. Fetch Data from Backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await apiRequest("/api/vehicles", "GET");
        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error("Failed to load vehicles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 2. Filter Logic
  const filteredVehicles =
    category === "All"
      ? vehicles
      : vehicles.filter((v) => v.category === category);

  const handleBook = (vehicle: Vehicle) => {
    const query = new URLSearchParams({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      price: vehicle.price.toString(),
      start: dates.start,
      end: dates.end,
      type: "vehicle_only",
    }).toString();

    router.push(`/book/vehicle?${query}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      <Navbar variant="default" />

      {/* --- HERO SECTION --- */}
      <div className="relative bg-black h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1600"
            className="w-full h-full object-cover"
            alt="Hero"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Explore Mathura Your Way
          </h1>
          <p className="text-gray-200 text-lg mb-8">
            Rent bikes, cars, or book a full-day taxi for your spiritual
            journey.
          </p>

          {/* Date Picker Bar */}
          <div className="bg-white dark:bg-gray-900 p-2 rounded-full flex flex-col md:flex-row items-center gap-2 max-w-xl mx-auto shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-6 py-3 w-full">
              <Calendar className="text-rose-600" size={20} />
              <div className="text-left">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={dates.start}
                  onChange={(e) =>
                    setDates({ ...dates, start: e.target.value })
                  }
                  className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                />
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div className="flex-1 flex items-center gap-3 px-6 py-3 w-full">
              <Calendar className="text-rose-600" size={20} />
              <div className="text-left">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">
                  Dropoff Date
                </label>
                <input
                  type="date"
                  value={dates.end}
                  onChange={(e) => setDates({ ...dates, end: e.target.value })}
                  className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                />
              </div>
            </div>
            <button className="bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full font-bold shadow-lg transition-all w-full md:w-auto">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* --- CATEGORY TABS --- */}
      <div className="max-w-7xl mx-auto px-4 mt-12 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-2xl font-bold">Available Vehicles</h2>
          <div className="flex gap-2 p-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto max-w-full">
            {["All", "2-Wheeler", "City Ride", "Car Rental"].map((tab) => (
              <button
                key={tab}
                onClick={() => setCategory(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  category === tab
                    ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- VEHICLE GRID --- */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rose-600" size={40} />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 dark:bg-slate-900 rounded-3xl">
            <p className="text-gray-500 font-medium">
              No vehicles found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group"
              >
                {/* Image Area */}
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={vehicle.imageUrl || "/placeholder-car.jpg"}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star
                      size={12}
                      className="text-yellow-500 fill-yellow-500"
                    />{" "}
                    4.9
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                        {vehicle.type}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {vehicle.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold">
                        ₹{vehicle.price}
                      </span>
                      <span className="text-xs text-gray-500">/ day</span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex items-center gap-4 my-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      <Users size={14} /> {vehicle.seats} Seats
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      <Fuel size={14} /> {vehicle.fuel}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      <Zap size={14} /> Instant
                    </span>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 my-4 pt-4">
                    <ul className="space-y-2">
                      {(vehicle.features || []).map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <ShieldCheck size={14} className="text-green-500" />{" "}
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBook(vehicle)}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    Book Now <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
