"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { MapPin, Search, Star, Loader2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SEARCH STATE
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState("");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
    
        const data = await apiRequest("/api/properties", "GET");

        setHotels(data.properties || []);
      } catch (err) {
        console.error("Failed to load hotels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // 2. SEARCH HANDLER
  const handleSearch = () => {
    if (!location) return;
    router.push(`/search?q=${location}&date=${dates}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="transparent" />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[550px] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover brightness-75"
          />
        </div>

        {/* Search Box */}
        <div className="relative z-10 w-full max-w-4xl px-4">
          <div className="text-center mb-8 text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find your next stay
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Search deals on hotels, homes, and much more...
            </p>
          </div>

          <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2">
            {/* Location Input */}
            <div className="flex-1 px-6 py-3 w-full border-b md:border-b-0 md:border-r border-gray-200">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Where
              </label>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full outline-none text-gray-900 font-medium placeholder:text-gray-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Date Input */}
            <div className="flex-1 px-6 py-3 w-full border-b md:border-b-0 md:border-r border-gray-200">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Check in - Check out
              </label>
              <input
                type="text"
                placeholder="Add dates"
                className="w-full outline-none text-gray-900 font-medium placeholder:text-gray-400"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
              />
            </div>

            {/* Guests Input (Static for now) */}
            <div className="flex-1 px-6 py-3 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Who
              </label>
              <div className="text-gray-900 font-medium">2 guests</div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full transition-colors shrink-0"
            >
              <Search size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* --- TRENDING LISTINGS --- */}
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Trending Destinations
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" />
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
            No properties found. <br />{" "}
            <span className="text-sm">Go to Admin Dashboard to add one!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {hotels.map((hotel) => (
              <Link
                href={`/destinations/${hotel.id}`}
                key={hotel.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3">
                  <img
                    src={hotel.imageUrl || "/placeholder.jpg"}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star size={12} className="fill-black" /> 4.8
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                      {hotel.location}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{hotel.name}</p>
                    <p className="text-sm text-gray-500">12-17 Dec</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      ₹{hotel.price}
                    </div>
                    <div className="text-sm text-gray-500">night</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
