"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  Star,
  MapPin,
  Users,
  Calendar,
  Minus,
  Plus,
  ArrowRight,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// --- CALENDAR ---
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format, addDays } from "date-fns";

const ITEMS_PER_PAGE = 8;

export default function HomePage() {
  const router = useRouter();

  // --- STATE ---
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // --- SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [openDate, setOpenDate] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);
  const [openGuest, setOpenGuest] = useState(false);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });

  // --- REFS ---
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);

  // --- CLICK OUTSIDE LISTENER ---
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

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/api/public/hotels", "GET");
        const list = data.hotels || [];
        console.log(list);
        setAllHotels(list);
        setFilteredHotels(list);
      } catch (err) {
        console.error("Failed to load hotels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // --- SEARCH LOGIC ---
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const filtered = allHotels.filter((hotel) => {
        const query = searchTerm.toLowerCase();
        return (
          hotel.name?.toLowerCase().includes(query) ||
          hotel.location?.toLowerCase().includes(query) ||
          hotel.city?.toLowerCase().includes(query)
        );
      });
      setFilteredHotels(filtered);
      setCurrentPage(1);
      setLoading(false);
      if (hotelsRef.current) {
        hotelsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 400);
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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredHotels.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (hotelsRef.current) {
      hotelsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors pb-20">
      <Navbar variant="transparent" />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[65vh] min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/home-main.jpg"
            alt="Hero"
            fill
            priority
            className="object-cover brightness-[0.60]"
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center mt-10">
          <div className="text-center mb-10 text-white space-y-4 animate-in fade-in zoom-in duration-700">
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight tracking-tight">
              Journey to <span className="text-rose-500">Divinity</span>
            </h1>
            <p className="text-lg md:text-2xl font-medium opacity-90 max-w-2xl mx-auto">
              Premium stays & spiritual tours in Mathura & Vrindavan.
            </p>
          </div>

          {/* SEARCH BAR WIDGET */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl p-2 flex flex-col md:flex-row gap-2 relative animate-in slide-in-from-bottom-10 duration-700 delay-200 border border-gray-100 dark:border-gray-800">
            {/* 1. Location Input */}
            <div className="flex-1 px-6 py-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Where
              </label>
              <input
                type="text"
                placeholder="Search hotels or destinations"
                className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-bold placeholder:font-medium placeholder:text-gray-400 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="w-px bg-gray-200 dark:bg-gray-700 my-3 hidden md:block"></div>

            {/* 2. Date Picker */}
            <div
              className="flex-1 px-6 py-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer relative"
              onClick={() => setOpenDate(!openDate)}
            >
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Dates
              </label>
              <div className="font-bold text-base flex items-center gap-2 truncate">
                <Calendar size={18} className="text-rose-500" />
                {`${format(dateRange[0].startDate, "MMM dd")} — ${format(dateRange[0].endDate, "MMM dd")}`}
              </div>

              {openDate && (
                <div
                  ref={calendarRef}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-50 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border dark:border-gray-700"
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item: any) => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    minDate={new Date()}
                    rangeColors={["#e11d48"]}
                  />
                </div>
              )}
            </div>

            <div className="w-px bg-gray-200 dark:bg-gray-700 my-3 hidden md:block"></div>

            {/* 3. Guests */}
            <div
              className="flex-1 px-6 py-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer relative"
              onClick={() => setOpenGuest(!openGuest)}
            >
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Guests
              </label>
              <div className="font-bold text-base flex items-center gap-2">
                <Users size={18} className="text-rose-500" />
                {guests.adults + guests.children} Guests
              </div>

              {openGuest && (
                <div
                  ref={guestRef}
                  className="absolute top-20 right-0 w-80 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border dark:border-gray-700 z-50 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="font-bold">Adults</div>
                      <div className="text-xs text-gray-500">Ages 13+</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuest("adults", "dec")}
                        className="w-8 h-8 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-50"
                        disabled={guests.adults <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {guests.adults}
                      </span>
                      <button
                        onClick={() => updateGuest("adults", "inc")}
                        className="w-8 h-8 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">Children</div>
                      <div className="text-xs text-gray-500">Ages 2-12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuest("children", "dec")}
                        className="w-8 h-8 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-50"
                        disabled={guests.children <= 0}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {guests.children}
                      </span>
                      <button
                        onClick={() => updateGuest("children", "inc")}
                        className="w-8 h-8 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Button */}
            <div className="p-1">
              <button
                onClick={handleSearch}
                className="w-full h-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-8 py-4 md:py-0 font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                <Search size={24} strokeWidth={3} />
                <span className="md:hidden">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTINGS SECTION --- */}
      <div
        ref={hotelsRef}
        className="max-w-[1400px] mx-auto px-4 md:px-8 py-16"
      >
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Stays</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Handpicked Hotels for your comfort.
            </p>
          </div>
          <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
            Showing {filteredHotels.length} Hotels
          </div>
        </div>

        {loading ? (
          // --- SKELETON LOADER ---
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4"
              >
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl aspect-[4/3] mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          // --- EMPTY STATE ---
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold">No hotels found</h3>
            <p className="text-gray-500 mt-2">
              Try searching for a different location or check spelling.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilteredHotels(allHotels);
              }}
              className="mt-6 text-rose-600 font-bold hover:underline"
            >
              Show all hotels
            </button>
          </div>
        ) : (
          // --- HOTEL CARD GRID ---
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {currentItems.map((hotel) => (
                <Link
                  href={`/hotels/${hotel.id}`}
                  key={hotel.id}
                  className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-rose-900/5 hover:border-rose-500/50 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* IMAGE SECTION */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200">
                    <Image
                      src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
                      alt={hotel.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Floating Badges */}
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Star
                        size={12}
                        className="fill-yellow-400 text-yellow-400"
                      />{" "}
                      4.8
                    </div>

                    <div className="absolute top-3 left-3 bg-black/20 hover:bg-rose-600 backdrop-blur-sm p-2 rounded-full text-white transition-colors">
                      <Heart size={14} />
                    </div>
                  </div>

                  {/* CONTENT SECTION */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight truncate pr-2 group-hover:text-rose-600 transition-colors">
                        {hotel.name}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mb-4">
                      <MapPin size={14} className="text-rose-500" />{" "}
                      {hotel.location || hotel.city || "Mathura"}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          Start from
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold text-lg">
                          {formatPrice(hotel.price || hotel.pricePerNight)}
                          <span className="text-sm text-gray-400 font-normal">
                            /night
                          </span>
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredHotels.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </main>
  );
}
