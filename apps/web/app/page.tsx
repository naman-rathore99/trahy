"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { Search, Star, Loader2, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// --- 1. IMPORT CALENDAR STYLES & COMPONENTS ---
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import { DateRange } from "react-date-range";
import { format } from "date-fns";

export default function HomePage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SEARCH STATE
  const [location, setLocation] = useState("");

  // --- 2. DATE PICKER STATE ---
  const [openDate, setOpenDate] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Click outside to close calendar
  const calendarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, []);

  const handleClickOutside = (e: any) => {
    if (calendarRef.current && !calendarRef.current.contains(e.target)) {
      setOpenDate(false);
    }
  };

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await apiRequest("/api/hotels", "GET");
        setHotels(data.hotels || []);
      } catch (err) {
        console.error("Failed to load hotels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const handleSearch = () => {
    if (!location) return;
    // Format dates for URL (e.g., 2023-12-01)
    const start = format(dateRange[0].startDate, "yyyy-MM-dd");
    const end = format(dateRange[0].endDate, "yyyy-MM-dd");
    router.push(`/search?q=${location}&start=${start}&end=${end}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="transparent" />

      {/* --- HERO SECTION --- */}
      <div className="relative min-h-[600px] flex items-center justify-center pt-20 pb-12 md:py-0">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover brightness-75"
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
          <div className="text-center mb-8 text-white space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-lg">
              Find your next stay
            </h1>
            <p className="text-lg md:text-xl font-medium opacity-90 drop-shadow-md">
              Search deals on hotels, homes, and much more...
            </p>
          </div>

          {/* --- SEARCH BOX --- */}
          <div className="bg-white p-2 rounded-3xl md:rounded-full shadow-2xl w-full max-w-4xl relative">
            <div className="flex flex-col md:flex-row items-center">
              {/* Location Input */}
              <div className="w-full md:flex-1 px-6 py-3 border-b border-gray-100 md:border-b-0 md:border-r md:border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Where
                </label>
                <input
                  type="text"
                  placeholder="Search destinations"
                  className="w-full outline-none text-gray-900 font-bold placeholder:font-normal placeholder:text-gray-400 text-sm md:text-base truncate"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* --- 3. CUSTOM DATE INPUT --- */}
              <div className="w-full md:flex-1 px-6 py-3 border-b border-gray-100 md:border-b-0 md:border-r md:border-gray-200 relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check in - Check out
                </label>

                {/* Clicking this text opens the calendar */}
                <span
                  onClick={() => setOpenDate(!openDate)}
                  className="block w-full cursor-pointer text-gray-900 font-bold text-sm md:text-base truncate select-none hover:text-rose-600 transition-colors"
                >
                  {`${format(dateRange[0].startDate, "MMM dd")} - ${format(dateRange[0].endDate, "MMM dd")}`}
                </span>

                {/* THE POPUP CALENDAR */}
                {openDate && (
                  <div
                    ref={calendarRef}
                    className="absolute top-16 left-0 z-50 shadow-2xl rounded-xl overflow-hidden"
                  >
                    <DateRange
                      editableDateInputs={true}
                      onChange={(item: any) => setDateRange([item.selection])}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      minDate={new Date()}
                      rangeColors={["#e11d48"]} // Rose-600 color
                      className="border border-gray-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Guests Input */}
              <div className="w-full md:flex-1 px-6 py-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Who
                </label>
                <div className="text-gray-900 font-bold text-sm md:text-base">
                  2 guests
                </div>
              </div>

              {/* Search Button */}
              <div className="p-2 w-full md:w-auto">
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Search size={24} />
                  <span className="md:hidden font-bold">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TRENDING LISTINGS --- */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Trending Destinations
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rose-600" size={40} />
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-lg">No properties found.</p>
            <span className="text-sm">Go to Admin Dashboard to add one!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {hotels.map((hotel) => (
              <Link
                href={`/destinations/${hotel.id}`}
                key={hotel.id}
                className="group cursor-pointer block"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3">
                  <img
                    src={hotel.imageUrl || "/placeholder.jpg"}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star size={12} className="fill-black" /> 4.8
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-rose-600 transition-colors">
                      {hotel.location}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {hotel.name}
                    </p>
                    <p className="text-sm text-gray-500">12-17 Dec</p>
                  </div>
                  <div className="text-right shrink-0">
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
