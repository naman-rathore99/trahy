"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  MapPin, Wifi, Car, Tv, Snowflake, Droplets, Waves, Star, X, Bike, Zap, Users,
  CheckCircle, Filter, MessageSquare, Bed, Utensils, ShieldCheck, Maximize2,
  Share2, Heart, ChevronDown, Plus, Minus, Send, User
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid, addDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- CONFIGURATION ---
const VEHICLE_OPTIONS = [
  { id: "bike", label: "2-Wheeler", icon: <Bike size={20} />, price: 400, desc: "Scooty" },
  { id: "auto", label: "Auto", icon: <Zap size={20} />, price: 800, desc: "Rickshaw" },
  { id: "car", label: "Cab", icon: <Car size={20} />, price: 2000, desc: "AC Car" },
  { id: "suv", label: "SUV", icon: <Users size={20} />, price: 3000, desc: "Innova" },
];

const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi: { label: "Free Wi-Fi", icon: <Wifi size={16} /> },
  parking: { label: "Free Parking", icon: <Car size={16} /> },
  ac: { label: "AC", icon: <Snowflake size={16} /> },
  geyser: { label: "Hot Water", icon: <Droplets size={16} /> },
  tv: { label: "TV", icon: <Tv size={16} /> },
  pool: { label: "Pool", icon: <Waves size={16} /> },
  dining: { label: "Dining", icon: <Utensils size={16} /> },
};

const getRoomCategory = (room: any) => {
  const name = (room.name || "").toLowerCase();
  const price = Number(room.price);
  if (name.includes("suite") || price > 5000) return "Luxury";
  if (name.includes("deluxe") || (price >= 2500 && price <= 5000)) return "Deluxe";
  return "Standard";
};

// Mock Reviews (Replace with API fetch later)
const MOCK_REVIEWS = [
    { id: 1, user: "Amit Sharma", rating: 5, date: "Oct 12, 2025", text: "Excellent stay! The location near the temple is perfect." },
    { id: 2, user: "Priya Verma", rating: 4, date: "Nov 05, 2025", text: "Rooms were clean, but food service was a bit slow." }
];

export default function HotelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);

  // State
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>(MOCK_REVIEWS);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("All");

  // Booking State
  const [checkIn, setCheckIn] = useState(searchParams.get("start") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("end") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults") || 2));
  const [children, setChildren] = useState(Number(searchParams.get("children") || 0));
  const [vehicleType, setVehicleType] = useState<string | null>(null);

  // Review State
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);

  // UI Toggles
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"range" | "single">("range");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Math
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch Data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const hotelData = await apiRequest(`/api/hotels/${id}`, "GET");
        setHotel({ ...hotelData.hotel, hasVehicle: true });
        const roomsData = await apiRequest(`/api/hotels/${id}/rooms`, "GET");
        setRooms(roomsData.rooms || []);
        if (roomsData.rooms?.length > 0) setSelectedRoom(roomsData.rooms[0]);
        // TODO: Fetch real reviews here: apiRequest(`/api/hotels/${id}/reviews`, "GET")
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Calculate Price
  useEffect(() => {
    if (checkIn && checkOut && hotel) {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      if (isValid(start) && isValid(end)) {
        const diff = differenceInDays(end, start);
        if (diff > 0) {
          setNights(diff);
          const basePrice = selectedRoom ? Number(selectedRoom.price) : Number(hotel.pricePerNight);
          const roomTotal = diff * basePrice;
          let vehicleTotal = 0;
          if (vehicleType) {
            const v = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
            if (v) vehicleTotal = v.price * diff;
          }
          setTotalPrice(roomTotal + vehicleTotal);
        }
      }
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, hotel, selectedRoom, vehicleType]);

  // Click Outside Handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setIsGuestOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const updateGuests = (type: 'adults' | 'children', op: 'inc' | 'dec') => {
    if (type === 'adults') {
        setAdults(prev => op === 'inc' ? prev + 1 : Math.max(1, prev - 1));
    } else {
        setChildren(prev => op === 'inc' ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleDateSelect = (val: any) => {
    if (bookingMode === "single" && val) {
      const date = val as Date;
      setCheckIn(format(date, "yyyy-MM-dd"));
      setCheckOut(format(addDays(date, 1), "yyyy-MM-dd"));
      setIsCalendarOpen(false);
    } else {
      const range = val as DateRange;
      if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
      else setCheckIn("");
      if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
      else setCheckOut("");
    }
  };

  const selectTonight = () => {
    const now = new Date();
    setCheckIn(format(now, "yyyy-MM-dd"));
    setCheckOut(format(addDays(now, 1), "yyyy-MM-dd"));
    setBookingMode("single");
    setIsCalendarOpen(false);
  };

  const handleReserve = () => {
    if (!checkIn || !checkOut || nights === 0) { setIsCalendarOpen(true); return; }
    const user = auth.currentUser;
    if (!user) { router.push(`/login?redirect=/hotel/${id}`); return; }

    const queryParams = new URLSearchParams({
      id: hotel.id, name: hotel.name, start: checkIn, end: checkOut,
      adults: adults.toString(), children: children.toString(),
      roomId: selectedRoom?.id || "standard",
      roomName: selectedRoom?.name || "Standard Room",
      price: (selectedRoom ? Number(selectedRoom.price) : Number(hotel.pricePerNight)).toString(),
    });

    if (vehicleType) {
      const v = VEHICLE_OPTIONS.find((opt) => opt.id === vehicleType);
      if (v) {
        queryParams.set("vehicleId", v.id);
        queryParams.set("vehicleName", v.label);
        queryParams.set("vehiclePrice", v.price.toString());
      }
    }
    router.push(`/book/hotel?${queryParams.toString()}`);
  };

  const handleReviewSubmit = () => {
      if(!newReview.trim()) return;
      const review = {
          id: Date.now(),
          user: auth.currentUser?.displayName || "Guest User",
          rating: newRating,
          date: format(new Date(), "MMM dd, yyyy"),
          text: newReview
      };
      setReviews([review, ...reviews]);
      setNewReview("");
      alert("Review submitted! (This is a demo, connect API to save)");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div></div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center">Hotel not found</div>;

  const galleryImages = hotel.imageUrls && hotel.imageUrls.length > 0 ? hotel.imageUrls : ["/placeholder.jpg"];
  const filteredRooms = rooms.filter((r) => activeTab === "All" || getRoomCategory(r) === activeTab);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      <style jsx global>{`
        .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #e11d48; --rdp-background-color: #e11d48; margin: 0; }
        .rdp-day_selected:not([disabled]) { color: white; background-color: var(--rdp-accent-color); }
        .rdp-button:hover:not([disabled]) { background-color: #fce7f3; color: #e11d48; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* --- LEFT: GALLERY (Sticky) --- */}
            <div className="h-fit lg:sticky lg:top-24">
                <div className="flex flex-col-reverse md:flex-row gap-4 h-[500px]">
                    {/* Thumbnails */}
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 shrink-0 h-24 md:h-full">
                        {galleryImages.map((img: string, idx: number) => (
                            <div 
                                key={idx}
                                onMouseEnter={() => setActiveImageIndex(idx)}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-20 h-20 md:w-full md:h-20 aspect-square shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeImageIndex === idx ? "border-rose-600 opacity-100" : "border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-100"}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                            </div>
                        ))}
                    </div>
                    {/* Main Image */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden relative group border border-gray-100 dark:border-gray-800">
                        <img
                            src={galleryImages[activeImageIndex]}
                            alt="Hotel Main"
                            className="w-full h-full object-cover"
                            onClick={() => setLightboxIndex(activeImageIndex)}
                        />
                        <button 
                            onClick={() => setLightboxIndex(activeImageIndex)}
                            className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                            <Maximize2 size={20} className="text-black dark:text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: DETAILS & OPTIONS (Scroll) --- */}
            <div className="space-y-8">
                
                {/* 1. Header & Price */}
                <div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">{hotel.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <div className="flex items-center gap-1"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="font-bold text-black dark:text-white">4.8</span></div>
                                <span>•</span>
                                <div className="flex items-center gap-1"><MapPin size={16} />{hotel.location}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><Share2 size={18}/></button>
                            <button className="p-2 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><Heart size={18}/></button>
                        </div>
                    </div>
                    
                    <div className="text-3xl font-extrabold text-rose-600">
                        ₹{selectedRoom ? Number(selectedRoom.price).toLocaleString('en-IN') : Number(hotel.pricePerNight).toLocaleString('en-IN')} 
                        <span className="text-sm text-gray-400 font-normal ml-1">/ night</span>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* 2. Date & Guest Selection (Grid) */}
                <div className="grid grid-cols-2 gap-4 relative">
                    {/* Date Picker */}
                    <div 
                        ref={calendarRef}
                        className="border border-gray-300 dark:border-gray-700 rounded-xl p-3 cursor-pointer relative hover:border-black dark:hover:border-white transition-colors" 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    >
                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Trip Dates</label>
                        <div className="font-bold text-sm truncate flex justify-between items-center">
                            {checkIn ? `${format(parseISO(checkIn), "MMM dd")} - ${checkOut ? format(parseISO(checkOut), "MMM dd") : "Checkout"}` : "Select Dates"}
                            <ChevronDown size={16}/>
                        </div>
                        
                        {/* Calendar Popover */}
                        {isCalendarOpen && (
                            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl z-50 p-4 w-auto min-w-[320px]" onClick={(e) => e.stopPropagation()}>
                                {bookingMode === "single" ? (
                                    <DayPicker mode="single" selected={checkIn ? parseISO(checkIn) : undefined} onSelect={handleDateSelect} disabled={{ before: today }} />
                                ) : (
                                    <DayPicker mode="range" selected={{ from: checkIn ? parseISO(checkIn) : undefined, to: checkOut ? parseISO(checkOut) : undefined }} onSelect={handleDateSelect} disabled={{ before: today }} />
                                )}
                                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={selectTonight} className="text-xs font-bold text-gray-500 hover:text-black">Today</button>
                                    <button onClick={() => setIsCalendarOpen(false)} className="text-xs font-bold text-rose-600">Done</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guest Picker (Fixed) */}
                    <div 
                        ref={guestRef}
                        className="border border-gray-300 dark:border-gray-700 rounded-xl p-3 cursor-pointer relative hover:border-black dark:hover:border-white transition-colors" 
                        onClick={() => setIsGuestOpen(!isGuestOpen)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Guests</label>
                                <div className="font-bold text-sm">{adults + children} Guests</div>
                            </div>
                            <Users size={18} className="text-gray-400"/>
                        </div>

                        {/* Guest Popover */}
                        {isGuestOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 shadow-xl rounded-xl p-4 z-50 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="font-bold text-sm">Adults</p>
                                        <p className="text-xs text-gray-500">Age 13+</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateGuests('adults', 'dec')} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"><Minus size={14}/></button>
                                        <span className="font-bold w-4 text-center">{adults}</span>
                                        <button onClick={() => updateGuests('adults', 'inc')} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"><Plus size={14}/></button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm">Children</p>
                                        <p className="text-xs text-gray-500">Ages 2-12</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateGuests('children', 'dec')} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"><Minus size={14}/></button>
                                        <span className="font-bold w-4 text-center">{children}</span>
                                        <button onClick={() => updateGuests('children', 'inc')} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800"><Plus size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Room Selection */}
                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Bed size={18} className="text-rose-600"/> Select Room Type</h3>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {["All", "Standard", "Deluxe", "Luxury"].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 text-xs rounded-full border ${activeTab === tab ? "bg-black text-white border-black dark:bg-white dark:text-black" : "border-gray-300 text-gray-500"}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        {filteredRooms.map((room) => (
                            <div 
                                key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-24 ${selectedRoom?.id === room.id ? "border-rose-600 bg-rose-50 dark:bg-rose-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-400"}`}
                            >
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase">{getRoomCategory(room)}</div>
                                    <div className="font-bold text-sm leading-tight line-clamp-1">{room.name}</div>
                                </div>
                                <div className="text-rose-600 font-bold text-sm mt-1">₹{room.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Vehicle Addon */}
                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Car size={18} className="text-rose-600"/> Add a Ride</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {VEHICLE_OPTIONS.map((v) => (
                            <div 
                                key={v.id} 
                                onClick={() => setVehicleType(vehicleType === v.id ? null : v.id)}
                                className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${vehicleType === v.id ? "border-black bg-black text-white dark:bg-white dark:text-black" : "border-gray-200 hover:border-gray-400"}`}
                            >
                                <div className="flex justify-center mb-1">{v.icon}</div>
                                <div className="text-[10px] font-bold">{v.label}</div>
                                <div className="text-[10px] opacity-70">+₹{v.price}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Description & Amenities */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Description</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {hotel.description || "Experience luxury at its finest in the heart of Mathura."}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-3">Popular Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {hotel.amenities?.slice(0, 6).map((id: string) => AMENITY_MAP[id] && (
                                <span key={id} className="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                    {AMENITY_MAP[id].icon} {AMENITY_MAP[id].label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Action Bar */}
                <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-gray-800 mt-6 shadow-sm">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Total Estimate</p>
                        <p className="text-2xl font-black text-rose-600">₹{totalPrice.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400">{nights} Nights • {adults+children} Guests</p>
                    </div>
                    <button 
                        onClick={handleReserve}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                    >
                        {nights > 0 ? "Book Now" : "Check Availability"}
                    </button>
                </div>

            </div>
        </div>

        {/* --- REVIEW SECTION (NEW) --- */}
        <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-12">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">Guest Reviews <span className="text-base font-normal text-gray-500">({reviews.length})</span></h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Review Form */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl h-fit">
                    <h3 className="font-bold text-lg mb-4">Write a Review</h3>
                    <div className="flex gap-2 mb-4">
                        {[1,2,3,4,5].map(star => (
                            <Star 
                                key={star} 
                                size={24} 
                                onClick={() => setNewRating(star)}
                                className={`cursor-pointer transition-all ${star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                            />
                        ))}
                    </div>
                    <textarea 
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-black min-h-[100px] mb-4 text-sm"
                        placeholder="Share your experience..."
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                    />
                    <button 
                        onClick={handleReviewSubmit}
                        className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Send size={16}/> Submit Review
                    </button>
                </div>

                {/* Review List */}
                <div className="lg:col-span-2 space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold">
                                    <User size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{review.user}</p>
                                    <p className="text-xs text-gray-500">{review.date}</p>
                                </div>
                                <div className="ml-auto flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && galleryImages && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md p-4">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={24} /></button>
          <img src={galleryImages[lightboxIndex]} className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </main>
  );
}