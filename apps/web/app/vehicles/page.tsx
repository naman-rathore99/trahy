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
  MapPin,
  Clock,
  Car,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface Vehicle {
  id: string;
  name: string;
  category: string;
  type: string;
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

  // --- 🚦 SMART BOOKING STATE ---
  const [bookingMode, setBookingMode] = useState<"transfer" | "rental">(
    "transfer",
  );

  // Mode 1: Transfer State (Point-to-Point Drop)
  const [transferDetails, setTransferDetails] = useState({
    pickup: "",
    drop: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
  });

  // Mode 2: Rental State (Multi-Day with Delivery/Pickup Locations)
  const [rentalDetails, setRentalDetails] = useState({
    pickup: "",
    drop: "",
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });

  // Fetch Data
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

  const filteredVehicles =
    category === "All"
      ? vehicles
      : vehicles.filter((v) => v.category === category);

  // --- 🚀 SMART BOOKING HANDLER ---
  const handleBook = (vehicle: Vehicle) => {
    const queryParams: Record<string, string> = {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      price: vehicle.price.toString(),
      image: vehicle.imageUrl || "/placeholder-car.jpg",
      mode: bookingMode,
    };

    if (bookingMode === "transfer") {
      if (!transferDetails.pickup || !transferDetails.drop) {
        alert("Please enter both Pickup and Drop locations at the top!");
        return;
      }
      queryParams.pickupLocation = transferDetails.pickup;
      queryParams.dropLocation = transferDetails.drop;
      queryParams.date = transferDetails.date;
      queryParams.time = transferDetails.time;
    } else {
      // 🚨 NEW: Validating Rental Locations
      if (!rentalDetails.pickup || !rentalDetails.drop) {
        alert("Please enter the Delivery & Return locations for your rental!");
        return;
      }
      queryParams.pickupLocation = rentalDetails.pickup;
      queryParams.dropLocation = rentalDetails.drop;
      queryParams.start = rentalDetails.start;
      queryParams.end = rentalDetails.end;
    }

    const query = new URLSearchParams(queryParams).toString();
    router.push(`/book/vehicle?${query}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      <Navbar variant="default" />

      {/* --- HERO SECTION --- */}
      <div className="relative bg-black min-h-[500px] flex items-center justify-center overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 opacity-50">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1600"
            className="w-full h-full object-cover"
            alt="Hero"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl w-full">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Rides & Transfers
          </h1>
          <p className="text-gray-200 text-lg mb-8 drop-shadow-md">
            Need a quick drop to your hotel or a car for the whole day? We've
            got you covered.
          </p>

          {/* --- 🧠 SMART SEARCH WIDGET --- */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden max-w-3xl mx-auto border border-gray-100 dark:border-gray-800">
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setBookingMode("transfer")}
                className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${bookingMode === "transfer" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <MapPin size={18} /> One-Way Drop
              </button>
              <button
                onClick={() => setBookingMode("rental")}
                className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${bookingMode === "rental" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <Car size={18} /> Daily Rental
              </button>
            </div>

            <div className="p-4 flex flex-col md:flex-row gap-4">
              {bookingMode === "transfer" ? (
                // 📍 TRANSFER UI
                <>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <MapPin className="text-rose-600 shrink-0" size={20} />
                      <input
                        type="text"
                        placeholder="Pickup (e.g. Mathura Station)"
                        value={transferDetails.pickup}
                        onChange={(e) =>
                          setTransferDetails({
                            ...transferDetails,
                            pickup: e.target.value,
                          })
                        }
                        className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <MapPin className="text-gray-400 shrink-0" size={20} />
                      <input
                        type="text"
                        placeholder="Drop (e.g. Madhuvan Hotel)"
                        value={transferDetails.drop}
                        onChange={(e) =>
                          setTransferDetails({
                            ...transferDetails,
                            drop: e.target.value,
                          })
                        }
                        className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 md:w-48">
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Calendar className="text-rose-600 shrink-0" size={18} />
                      <input
                        type="date"
                        value={transferDetails.date}
                        onChange={(e) =>
                          setTransferDetails({
                            ...transferDetails,
                            date: e.target.value,
                          })
                        }
                        className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Clock className="text-rose-600 shrink-0" size={18} />
                      <input
                        type="time"
                        value={transferDetails.time}
                        onChange={(e) =>
                          setTransferDetails({
                            ...transferDetails,
                            time: e.target.value,
                          })
                        }
                        className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // 🚗 RENTAL UI (NOW INCLUDES DELIVERY & RETURN LOCATIONS!)
                <>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Car className="text-rose-600 shrink-0" size={20} />
                      <input
                        type="text"
                        placeholder="Delivery Address (Pickup)"
                        value={rentalDetails.pickup}
                        onChange={(e) =>
                          setRentalDetails({
                            ...rentalDetails,
                            pickup: e.target.value,
                          })
                        }
                        className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <MapPin className="text-gray-400 shrink-0" size={20} />
                      <input
                        type="text"
                        placeholder="Return Address (Drop-off)"
                        value={rentalDetails.drop}
                        onChange={(e) =>
                          setRentalDetails({
                            ...rentalDetails,
                            drop: e.target.value,
                          })
                        }
                        className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 md:w-48">
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Calendar className="text-rose-600 shrink-0" size={18} />
                      <div className="flex flex-col flex-1">
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={rentalDetails.start}
                          onChange={(e) =>
                            setRentalDetails({
                              ...rentalDetails,
                              start: e.target.value,
                            })
                          }
                          className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Calendar className="text-rose-600 shrink-0" size={18} />
                      <div className="flex flex-col flex-1">
                        <label className="text-[9px] uppercase font-bold text-gray-500 block">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={rentalDetails.end}
                          onChange={(e) =>
                            setRentalDetails({
                              ...rentalDetails,
                              end: e.target.value,
                            })
                          }
                          className="bg-transparent font-bold text-sm outline-none w-full dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
      <div className="max-w-8xl mx-auto px-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group flex flex-col"
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
                <div className="p-6 flex flex-col flex-1">
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
                      <span className="text-[10px] uppercase font-bold text-gray-500">
                        {bookingMode === "transfer" ? "/ trip" : "/ day"}
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap items-center gap-2 my-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Users size={14} /> {vehicle.seats} Seats
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Fuel size={14} /> {vehicle.fuel}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Zap size={14} className="text-amber-500" /> Instant
                    </span>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 my-4 pt-4 flex-1">
                    <ul className="space-y-2">
                      {(vehicle.features || [])
                        .slice(0, 3)
                        .map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <ShieldCheck
                              size={14}
                              className="text-emerald-500 shrink-0"
                            />{" "}
                            <span className="truncate">{feature}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBook(vehicle)}
                    className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors shadow-md mt-auto"
                  >
                    Select Vehicle <ArrowRight size={18} />
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
