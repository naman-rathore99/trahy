"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { Search, Star, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

// --- CALENDAR STYLES ---
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import Image from "next/image";

export default function HomePage() {
    const router = useRouter();
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // SEARCH STATE
    const [location, setLocation] = useState("");
    const [openDate, setOpenDate] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    // CLOSE CALENDAR ON CLICK OUTSIDE
    const calendarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target)) {
                setOpenDate(false);
            }
        };
        document.addEventListener("click", handleClickOutside, true);
        return () => document.removeEventListener("click", handleClickOutside, true);
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
        router.push(`/search?q=${location}&start=${start}&end=${end}`);
    };

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <Navbar variant="transparent" />

            {/* --- HERO SECTION --- */}
            <div className="relative h-[600px] md:h-[700px] flex items-center justify-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/home-main.jpg"
                        alt="Hero"
                        width={1480}
                        height={600}
                        className="w-full h-full object-cover brightness-[0.70]"
                    />
                </div>

                <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center mt-10">
                    <div className="text-center mb-10 text-white space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight drop-shadow-xl tracking-tight">
                            Yatra & Stays
                        </h1>
                        <p className="text-lg md:text-2xl font-medium opacity-90 drop-shadow-md">
                            Discover spiritual stays in Mathura & Vrindavan
                        </p>
                    </div>

                    {/* --- SEARCH BAR (HIGH VISIBILITY BORDER) --- */}
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl relative border-2 border-gray-300 hover:border-gray-400 transition-colors">
                        <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-300">

                            {/* 1. LOCATION INPUT */}
                            <div className="w-full md:flex-1 px-8 py-4 hover:bg-gray-100 transition-colors rounded-t-[32px] md:rounded-l-[32px] md:rounded-tr-none">
                                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-widest mb-1">
                                    Where
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search destinations"
                                    className="w-full bg-transparent outline-none text-black font-bold placeholder:font-medium placeholder:text-gray-500 text-sm md:text-base truncate"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>

                            {/* 2. DATE PICKER */}
                            <div className="w-full md:flex-1 px-8 py-4 hover:bg-gray-100 transition-colors relative">
                                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-widest mb-1">
                                    Check in - Check out
                                </label>
                                <div
                                    onClick={() => setOpenDate(!openDate)}
                                    className="cursor-pointer text-black font-bold text-sm md:text-base truncate select-none"
                                >
                                    {`${format(dateRange[0].startDate, "MMM dd")} - ${format(dateRange[0].endDate, "MMM dd")}`}
                                </div>

                                {openDate && (
                                    <div
                                        ref={calendarRef}
                                        className="absolute top-20 left-1/2 -translate-x-1/2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200"
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

                            {/* 3. GUESTS INPUT */}
                            <div className="w-full md:flex-1 px-8 py-4 hover:bg-gray-100 transition-colors">
                                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-widest mb-1">
                                    Who
                                </label>
                                <div className="text-black font-bold text-sm md:text-base">
                                    Add guests
                                </div>
                            </div>

                            {/* 4. SEARCH BUTTON */}
                            <div className="p-3 w-full md:w-auto">
                                <button
                                    onClick={handleSearch}
                                    className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Search size={24} strokeWidth={2.5} />
                                    <span className="md:hidden font-bold">Search</span>
                                </button>
                            </div>
                        </div>
                    </div >
                </div >
            </div >

            {/* --- TRENDING LISTINGS (WITH BORDER CARDS) --- */}
            < div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24" >
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
                    Trending Destinations
                </h2>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-rose-600" size={40} />
                    </div>
                ) : hotels.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                        <p className="text-lg font-medium text-gray-600">No properties found.</p>
                        <span className="text-sm text-gray-400">Add hotels from the Admin Dashboard.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {hotels.map((hotel) => (
                            <Link
                                href={`/hotel/${hotel.slug || hotel.id}`}
                                key={hotel.id}
                                // ✅ UPDATED STYLE: Thicker border (border-2) and darker color (gray-300)
                                className="group cursor-pointer block border-2 border-gray-300 rounded-2xl p-3 hover:border-rose-500 hover:shadow-2xl transition-all duration-300 bg-white"
                            >
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3 border border-gray-100">
                                    <img
                                        src={hotel.imageUrl || "/placeholder.jpg"}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Star size={12} className="fill-black text-black" /> 4.8
                                    </div>
                                </div>

                                <div className="px-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-900 truncate pr-2 text-base group-hover:text-rose-600 transition-colors">
                                            {hotel.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                        <MapPin size={14} /> {hotel.location || "Mathura, India"}
                                    </p>
                                    <p className="text-sm text-gray-900 pt-1">
                                        <span className="font-extrabold text-lg">₹{hotel.pricePerNight || hotel.price}</span> <span className="text-gray-500 font-normal">night</span>
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
