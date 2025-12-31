"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination"; // ✅ Import Pagination
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  Star,
  Loader2,
  MapPin,
  Users,
  Calendar,
  Minus,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- CALENDAR STYLES ---
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format, addDays } from "date-fns";
import Image from "next/image";

const ITEMS_PER_PAGE = 8; // ✅ Show 8 hotels per page (2 rows on desktop)

export default function HomePage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- SEARCH STATE ---
  const [location, setLocation] = useState("");
  const [openDate, setOpenDate] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const [openGuest, setOpenGuest] = useState(false);
  const [guests, setGuests] = useState({
    adults: 2,
    children: 0,
  });

  // REFS
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null); // To scroll to list on page change

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setOpenDate(false);
      if (guestRef.current && !guestRef.current.contains(e.target))
        setOpenGuest(false);
    };
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, []);

  // FETCH HOTELS
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
    const start = format(dateRange[0].startDate, "yyyy-MM-dd");
    const end = format(dateRange[0].endDate, "yyyy-MM-dd");
    router.push(
      `/search?q=${location}&start=${start}&end=${end}&adults=${guests.adults}&children=${guests.children}`
    );
  };

  const updateGuest = (type: "adults" | "children", op: "inc" | "dec") => {
    setGuests((prev) => ({
      ...prev,
      [type]:
        op === "inc"
          ? prev[type] + 1
          : Math.max(type === "adults" ? 1 : 0, prev[type] - 1),
    }));
  };

  // --- PAGINATION LOGIC ---
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentHotels = hotels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the top of the hotels section, not the whole page
    if (hotelsRef.current) {
      hotelsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors">
      <Navbar variant="transparent" />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[600px] md:h-[750px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/home-main.jpg"
            alt="Hero"
            fill
            priority
            className="object-cover brightness-[0.65]"
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center mt-10">
          <div className="text-center mb-10 text-white space-y-4">
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight drop-shadow-xl tracking-tight">
              Yatra & Stays
            </h1>
            <p className="text-lg md:text-2xl font-medium opacity-90 drop-shadow-md max-w-2xl mx-auto">
              Discover spiritual stays in Mathura, Vrindavan & Gokul.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 p-1 flex flex-col md:flex-row relative">
            {/* Location */}
            <div className="flex-1 px-6 py-3 md:py-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">
                Where
              </label>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full bg-transparent outline-none text-black dark:text-white font-bold placeholder:font-medium placeholder:text-gray-400 text-sm md:text-base truncate"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700 my-2 hidden md:block"></div>
            {/* Dates */}
            <div
              className="flex-1 px-6 py-3 md:py-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-2xl transition-colors cursor-pointer relative"
              onClick={() => setOpenDate(!openDate)}
            >
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">
                Check in - Check out
              </label>
              <div className="text-black dark:text-white font-bold text-sm md:text-base flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />{" "}
                {`${format(dateRange[0].startDate, "MMM dd")} — ${format(dateRange[0].endDate, "MMM dd")}`}
              </div>
              {openDate && (
                <div
                  ref={calendarRef}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item: any) => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    minDate={new Date()}
                    rangeColors={["#e11d48"]}
                    className="text-black"
                  />
                </div>
              )}
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700 my-2 hidden md:block"></div>
            {/* Guests */}
            <div
              className="flex-1 px-6 py-3 md:py-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-2xl transition-colors cursor-pointer relative"
              onClick={() => setOpenGuest(!openGuest)}
            >
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">
                Who
              </label>
              <div className="text-black dark:text-white font-bold text-sm md:text-base flex items-center gap-2">
                <Users size={16} className="text-gray-400" />{" "}
                {guests.adults + guests.children} Guests
              </div>
              {openGuest && (
                <div
                  ref={guestRef}
                  className="absolute top-20 right-0 w-72 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        Adults
                      </div>
                      <div className="text-xs text-gray-500">
                        Ages 13 or above
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuest("adults", "dec")}
                        className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white disabled:opacity-50"
                        disabled={guests.adults <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {guests.adults}
                      </span>
                      <button
                        onClick={() => updateGuest("adults", "inc")}
                        className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        Children
                      </div>
                      <div className="text-xs text-gray-500">Ages 2 - 12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuest("children", "dec")}
                        className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white disabled:opacity-50"
                        disabled={guests.children <= 0}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {guests.children}
                      </span>
                      <button
                        onClick={() => updateGuest("children", "inc")}
                        className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Search Button */}
            <div className="p-2">
              <button
                onClick={handleSearch}
                className="w-full h-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-8 py-3 md:py-0 font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Search size={22} strokeWidth={3} />{" "}
                <span className="md:hidden">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- TRENDING LISTINGS --- */}
      <div
        ref={hotelsRef}
        className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24"
      >
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
          Trending Destinations
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rose-600" size={40} />
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              No properties found.
            </p>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Add hotels from the Admin Dashboard.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
              {currentHotels.map((hotel) => (
                <Link
                  href={`/hotel/${hotel.slug || hotel.id}`}
                  key={hotel.id}
                  className="group cursor-pointer block border border-gray-200 dark:border-gray-800 rounded-2xl p-3 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-xl dark:hover:shadow-rose-900/10 transition-all duration-300 bg-white dark:bg-gray-900"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 mb-3">
                    <Image
                      src={hotel.imageUrl || "/placeholder.jpg"}
                      alt={hotel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Star
                        size={12}
                        className="fill-black dark:fill-white text-black dark:text-white"
                      />{" "}
                      4.8
                    </div>
                  </div>
                  <div className="px-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2 text-base group-hover:text-rose-600 dark:group-hover:text-rose-500 transition-colors">
                        {hotel.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      <MapPin size={14} /> {hotel.location || "Mathura, India"}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white pt-1">
                      <span className="font-extrabold text-lg">
                        ₹{hotel.pricePerNight || hotel.price}
                      </span>{" "}
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        night
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ✅ PAGINATION COMPONENT */}
            <Pagination
              currentPage={currentPage}
              totalItems={hotels.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </main>
  );
}
