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
  Bed,
  Car,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format, addDays } from "date-fns";

const ITEMS_PER_PAGE = 8;

export default function HomePage() {
  const router = useRouter();

  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // --- 🚨 SEARCH STATE 🚨 ---
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
  const [arrivalTime, setArrivalTime] = useState("14:00"); // 🚨 NEW: Arrival Time

  // --- CAB TRANSFER STATE ---
  const [showCabModal, setShowCabModal] = useState(false);
  const [transferData, setTransferData] = useState({
    enabled: false,
    pickup: "",
    time: "10:00",
  });

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/api/public/hotels", "GET");
        const list = data.hotels || [];
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

  const handleSearch = () => {
    setLoading(true);
    setOpenDate(false);
    setOpenGuest(false);
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
      if (hotelsRef.current)
        hotelsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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
    if (hotelsRef.current)
      hotelsRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const handleSaveTransfer = () => {
    if (!transferData.pickup.trim()) {
      alert("Please enter a pickup location.");
      return;
    }
    setTransferData({ ...transferData, enabled: true });
    setShowCabModal(false);
  };

  const handleClearTransfer = () => {
    setTransferData({ enabled: false, pickup: "", time: "10:00" });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors pb-20 overflow-x-hidden">
      <Navbar variant="transparent" />

      {/* CAB MODAL */}
      {showCabModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Car className="text-rose-600" /> Need a ride?
              </h3>
              <button
                onClick={() => setShowCabModal(false)}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              We'll arrange a cab to pick you up when you arrive on{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {format(dateRange[0].startDate, "MMM dd")}
              </span>{" "}
              and drop you at your booked hotel.
            </p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Pickup Location
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <MapPin size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Mathura Railway Station"
                    value={transferData.pickup}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        pickup: e.target.value,
                      })
                    }
                    className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Arrival Time
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Clock size={18} className="text-gray-400" />
                  <input
                    type="time"
                    value={transferData.time}
                    onChange={(e) =>
                      setTransferData({ ...transferData, time: e.target.value })
                    }
                    className="bg-transparent font-medium text-sm outline-none w-full dark:text-white"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveTransfer}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              Save Transfer Details
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative min-h-[85vh] md:h-[80vh] flex items-center justify-center pt-24 pb-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/home-main.jpg"
            alt="Hero"
            fill
            priority
            className="object-cover brightness-[0.50] dark:brightness-[0.40]"
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center mt-8">
          <div className="text-center mb-8 md:mb-12 text-white space-y-4 animate-in fade-in zoom-in duration-700">
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
              Journey to <span className="text-rose-500">Divinity</span>
            </h1>
            <p className="text-lg md:text-2xl font-medium opacity-90 max-w-2xl mx-auto drop-shadow-md">
              Premium stays & spiritual tours in Mathura & Vrindavan.
            </p>
          </div>

          <div className="w-full max-w-5xl flex gap-2 md:gap-3 px-4 mb-0 animate-in slide-in-from-bottom-10 duration-700 delay-100">
            <div className="bg-white dark:bg-gray-900 text-rose-600 px-6 py-3.5 rounded-t-2xl font-bold flex items-center gap-2 shadow-lg z-10 relative">
              <Bed size={20} />{" "}
              <span className="hidden md:inline">Stays & Hotels</span>
              <span className="md:hidden">Stays</span>
            </div>
            <button
              onClick={() => router.push("/vehicles")}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-all mt-1"
            >
              <Car size={20} />{" "}
              <span className="hidden md:inline">Cabs & Transfers</span>
              <span className="md:hidden">Cabs</span>
            </button>
          </div>

          {/* SMART SEARCH WIDGET */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl rounded-tl-none shadow-2xl w-full max-w-5xl flex flex-col relative animate-in slide-in-from-bottom-10 duration-700 delay-200 border border-gray-100 dark:border-gray-800 z-20">
            <div className="p-3 flex flex-col md:flex-row gap-3 flex-wrap">
              {/* Location */}
              <div className="flex-1 px-5 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-20 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Where
                </label>
                <input
                  type="text"
                  placeholder="Search destinations"
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-bold placeholder:font-medium placeholder:text-gray-400 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="w-px bg-gray-200 dark:bg-gray-800 my-3 hidden md:block"></div>
              <div className="h-px w-full bg-gray-200 dark:bg-gray-800 md:hidden"></div>

              {/* Dates */}
              <div
                className="flex-[1.5] px-5 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative z-30"
                onClick={() => {
                  setOpenDate(!openDate);
                  setOpenGuest(false);
                }}
              >
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Dates
                </label>
                <div className="font-bold text-base flex items-center gap-2 truncate text-gray-900 dark:text-white">
                  <Calendar size={18} className="text-rose-500 shrink-0" />
                  {`${format(dateRange[0].startDate, "MMM dd")} — ${format(dateRange[0].endDate, "MMM dd")}`}
                </div>
                {openDate && (
                  <div
                    ref={calendarRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full mt-2 left-0 md:left-1/2 md:-translate-x-1/2 z-[60] shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200 w-[calc(100vw-2rem)] md:w-auto flex justify-center"
                  >
                    <style
                      dangerouslySetInnerHTML={{
                        __html: `.rdrCalendarWrapper, .rdrDateDisplayWrapper { background-color: #ffffff !important; } .rdrMonthAndYearPickers select { color: #111827 !important; font-weight: bold !important; } .rdrDayNumber span { color: #111827 !important; font-weight: 500 !important; } .rdrDayPassive .rdrDayNumber span { color: #d1d5db !important; } .rdrDayDisabled .rdrDayNumber span { color: #f3f4f6 !important; } .rdrWeekDay { color: #6b7280 !important; } .rdrDateDisplayItem input { color: #111827 !important; }`,
                      }}
                    />
                    <DateRange
                      editableDateInputs={true}
                      onChange={(item: any) => setDateRange([item.selection])}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      minDate={new Date()}
                      rangeColors={["#e11d48"]}
                      direction="vertical"
                      months={1}
                    />
                  </div>
                )}
              </div>

              <div className="w-px bg-gray-200 dark:bg-gray-800 my-3 hidden md:block"></div>
              <div className="h-px w-full bg-gray-200 dark:bg-gray-800 md:hidden"></div>

              {/* 🚨 NEW: Arrival Time 🚨 */}
              <div className="flex-1 px-5 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-20 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check-in Time
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-rose-500 shrink-0" />
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-bold text-base cursor-pointer"
                  />
                </div>
              </div>

              <div className="w-px bg-gray-200 dark:bg-gray-800 my-3 hidden md:block"></div>
              <div className="h-px w-full bg-gray-200 dark:bg-gray-800 md:hidden"></div>

              {/* Guests */}
              <div
                className="flex-1 px-5 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative z-30 min-w-[150px]"
                onClick={() => {
                  setOpenGuest(!openGuest);
                  setOpenDate(false);
                }}
              >
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Guests
                </label>
                <div className="font-bold text-base flex items-center gap-2 text-gray-900 dark:text-white">
                  <Users size={18} className="text-rose-500 shrink-0" />
                  {guests.adults + guests.children} Guests
                </div>
                {openGuest && (
                  <div
                    ref={guestRef}
                    className="absolute top-full right-0 mt-2 w-[calc(100vw-3rem)] md:w-80 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[60] cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          Adults
                        </div>
                        <div className="text-xs text-gray-500">Ages 13+</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateGuest("adults", "dec")}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30"
                          disabled={guests.adults <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                          {guests.adults}
                        </span>
                        <button
                          onClick={() => updateGuest("adults", "inc")}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 flex items-center justify-center"
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
                        <div className="text-xs text-gray-500">Ages 2-12</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateGuest("children", "dec")}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30"
                          disabled={guests.children <= 0}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center text-gray-900 dark:text-white">
                          {guests.children}
                        </span>
                        <button
                          onClick={() => updateGuest("children", "inc")}
                          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <div className="p-2 w-full md:w-auto z-20">
                <button
                  onClick={handleSearch}
                  className="w-full h-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-8 py-4 md:py-0 font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  <Search size={22} strokeWidth={3} />
                  <span className="md:hidden">Search</span>
                </button>
              </div>
            </div>

            {/* ADD-ON BAR */}
            <div className="bg-rose-50/50 dark:bg-rose-900/10 px-5 py-3 border-t border-gray-100 dark:border-gray-800 rounded-b-3xl flex items-center justify-between">
              {transferData.enabled ? (
                <div className="flex items-center justify-between w-full">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowCabModal(true)}
                  >
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Pickup from{" "}
                      <span className="text-rose-600">
                        {transferData.pickup}
                      </span>{" "}
                      at {transferData.time}
                    </span>
                  </div>
                  <button
                    onClick={handleClearTransfer}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCabModal(true)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-500 transition-colors"
                >
                  <Car size={16} /> Need a ride from the station or airport?{" "}
                  <span className="text-rose-600 underline decoration-rose-600/30 underline-offset-4 ml-1">
                    Add Transfer
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LISTINGS SECTION */}
      <div
        ref={hotelsRef}
        className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Stays</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Handpicked Hotels for your comfort.
            </p>
          </div>
          <div className="self-start md:self-auto text-sm font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
            Showing {filteredHotels.length} Hotels
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4"
              >
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl aspect-4/3 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 mx-auto max-w-2xl">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold">No hotels found</h3>
            <p className="text-gray-500 mt-2 text-center">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
              {currentItems.map((hotel) => {
                // 🚨 SMART ROUTING: Pass ALL Context to the Hotel Page 🚨
                const queryParams = new URLSearchParams();

                // Add Context
                queryParams.append(
                  "start",
                  format(dateRange[0].startDate, "yyyy-MM-dd"),
                );
                queryParams.append(
                  "end",
                  format(dateRange[0].endDate, "yyyy-MM-dd"),
                );
                queryParams.append("adults", guests.adults.toString());
                queryParams.append("children", guests.children.toString());
                queryParams.append("time", arrivalTime);

                // Add Cab Info if enabled
                if (transferData.enabled) {
                  queryParams.append("needCab", "true");
                  queryParams.append("cabPickup", transferData.pickup);
                  queryParams.append("cabTime", transferData.time);
                }

                const hotelUrl = `/hotels/${hotel.id}?${queryParams.toString()}`;

                return (
                  <Link
                    href={hotelUrl}
                    key={hotel.id}
                    className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-rose-900/10 hover:border-rose-500/30 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={hotel.images?.[0] || "/placeholder-hotel.png"}
                        alt={hotel.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm text-gray-900 dark:text-white">
                        <Star
                          size={12}
                          className="fill-yellow-400 text-yellow-400"
                        />{" "}
                        4.8
                      </div>
                      <div className="absolute top-3 left-3 bg-black/30 hover:bg-rose-600 backdrop-blur-sm p-2 rounded-full text-white transition-colors">
                        <Heart size={14} />
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg leading-tight truncate pr-2 group-hover:text-rose-600 transition-colors">
                          {hotel.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mb-4">
                        <MapPin size={14} className="text-rose-500 shrink-0" />{" "}
                        <span className="truncate">
                          {hotel.location || hotel.city || "Mathura"}
                        </span>
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
                );
              })}
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
