"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
  Loader2, Calendar as CalendarIcon, Car, MessageSquare, Send, X,
  Search, MapPin, ExternalLink, CalendarDays, CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, areIntervalsOverlapping } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- TYPES ---
interface Booking {
  id: string;
  listingId: string; // The Hotel ID
  listingName: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled" | "failed";
  vehicleIncluded?: boolean;
  vehicleType?: string;
  createdAt: string;
  supportTickets?: { message: string; type: string; createdAt: string }[];
  adminReplies?: { message: string; createdAt: string }[];
  hasOpenTicket?: boolean;
  userId: string;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTERS
  const [filter, setFilter] = useState<"all" | "vehicle" | "queries" | "confirmed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // MODAL STATES
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "chat" | "reschedule">("details");

  // CHAT STATE
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // RESCHEDULE STATE
  const [newDateRange, setNewDateRange] = useState<DateRange | undefined>();
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push("/login"); return; }
      const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        setLoading(false);
      });
      return () => unsub();
    });
    return () => unsubscribeAuth();
  }, [router]);

  // --- LOGIC: CONFLICT CHECKER (Specific Hotel) ---
  // Checks if 'selectedBooking.listingId' is occupied by ANYONE ELSE during 'newDateRange'
  const checkSpecificConflict = () => {
    if (!selectedBooking || !newDateRange?.from || !newDateRange?.to) return [];

    return bookings.filter(b => {
      // 1. Must be the SAME HOTEL
      if (b.listingId !== selectedBooking.listingId) return false;
      // 2. Ignore self (don't conflict with the current booking we are moving)
      if (b.id === selectedBooking.id) return false;
      // 3. Ignore cancelled
      if (b.status === 'cancelled' || b.status === 'failed') return false;

      // 4. Check overlap
      return areIntervalsOverlapping(
        { start: newDateRange.from!, end: newDateRange.to! },
        { start: parseISO(b.checkIn), end: parseISO(b.checkOut) },
        { inclusive: true }
      );
    });
  };

  const specificConflicts = checkSpecificConflict();
  const isSpecificAvailable = newDateRange?.from && newDateRange?.to && specificConflicts.length === 0;

  // --- HANDLERS ---
  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    // Open "Chat" first if there is a query, otherwise "Details"
    setModalTab(booking.hasOpenTicket ? "chat" : "details");
    setIsModalOpen(true);
    setNewDateRange(undefined); // Reset calendar
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedBooking) return;
    setIsSending(true);
    try {
      await fetch("/api/bookings/reply", {
        method: "POST",
        body: JSON.stringify({ bookingId: selectedBooking.id, message: replyMessage })
      });
      setReplyMessage("");
    } catch (err) { alert("Failed to send reply"); }
    finally { setIsSending(false); }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking || !newDateRange?.from || !newDateRange?.to) return;
    if (!confirm(`Move booking to ${format(newDateRange.from, "MMM dd")}?`)) return;

    setIsRescheduling(true);
    try {
      // 1. Call Update API
      const res = await fetch("/api/bookings/update-dates", {
        method: "POST",
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newCheckIn: format(newDateRange.from, "yyyy-MM-dd"),
          newCheckOut: format(newDateRange.to, "yyyy-MM-dd")
        })
      });

      if (res.ok) {
        alert("Booking Moved Successfully!");
        setModalTab("chat"); // Switch to chat to see system message
      } else {
        alert("Failed to move booking.");
      }
    } catch (e) { alert("Error moving booking"); }
    finally { setIsRescheduling(false); }
  };

  // Filter Main List
  const filteredBookings = bookings.filter((b) => {
    if (filter === "vehicle" && (!b.vehicleIncluded || b.status === 'cancelled')) return false;
    if (filter === "queries" && !b.hasOpenTicket) return false;
    if (filter === "confirmed" && b.status !== "confirmed") return false;
    if (searchQuery) {
      return b.listingName.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (loading) return <div className="h-screen flex justify-center items-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-rose-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      <style jsx global>{`
         .dark .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #2563eb; --rdp-background-color: #202020; margin: 0; }
         .dark .rdp-day_selected:not([disabled]) { color: white; background-color: var(--rdp-accent-color); }
         .dark .rdp-day:hover:not([disabled]) { background-color: #333; }
         .dark .rdp-caption_label, .dark .rdp-head_cell, .dark .rdp-day { color: #e5e7eb; }
         .dark .rdp-button:hover:not([disabled]) { color: white; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 pt-24 md:pt-32">

        {/* HEADER */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage stays, vehicles & guest queries.</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              placeholder="Search bookings..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter("all")} className={`px-4 py-3 rounded-xl text-sm font-bold border ${filter === 'all' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-800'}`}>All</button>
            <button onClick={() => setFilter("queries")} className={`px-4 py-3 rounded-xl text-sm font-bold border flex items-center gap-2 ${filter === 'queries' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-800'}`}><MessageSquare size={16} /> Queries</button>
          </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => openModal(booking)}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-4">
                  <img src={booking.listingImage} className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{booking.listingName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">#{booking.id.slice(0, 6).toUpperCase()} • {format(parseISO(booking.checkIn), "dd MMM")}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{booking.status}</span>
                  {booking.hasOpenTicket && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1 animate-pulse"><MessageSquare size={10} /> Request Pending</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* THE "SUPER MODAL" (DETAILS + CHAT + RESCHEDULE) */}
      {/* ========================================================= */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border dark:border-gray-800 overflow-hidden flex flex-col h-[650px] max-h-[90vh]">

            {/* MODAL TABS */}
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-4 text-sm font-bold">
                <button onClick={() => setModalTab("chat")} className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${modalTab === 'chat' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}>
                  💬 Chat {selectedBooking.hasOpenTicket && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                </button>
                <button onClick={() => setModalTab("reschedule")} className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${modalTab === 'reschedule' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}>
                  📅 Reschedule
                </button>
                <button onClick={() => setModalTab("details")} className={`pb-1 border-b-2 transition-colors ${modalTab === 'details' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}>
                  📋 Details
                </button>
              </div>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="dark:text-white" /></button>
            </div>

            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">

              {/* --- TAB 1: CHAT --- */}
              {modalTab === "chat" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50 dark:bg-black/20">
                    {/* Messages */}
                    {[...(selectedBooking.supportTickets || []).map(t => ({ ...t, s: 'guest' })), ...(selectedBooking.adminReplies || []).map(r => ({ ...r, s: 'admin' }))]
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((m, i) => (
                        <div key={i} className={`flex ${m.s === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.s === 'admin' ? 'bg-black dark:bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-700'}`}>
                            {m.message}
                            <p className="text-[10px] opacity-60 text-right mt-1">{format(parseISO(m.createdAt), "hh:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    {(!selectedBooking.supportTickets?.length && !selectedBooking.adminReplies?.length) && <div className="text-center text-gray-400 text-sm mt-10">No messages.</div>}
                  </div>
                  {/* Reply Input */}
                  <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
                    <input
                      className="flex-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none"
                      placeholder="Type reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <button onClick={handleSendReply} disabled={isSending} className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-80">
                      {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* --- TAB 2: RESCHEDULE (THE KEY FEATURE) --- */}
              {modalTab === "reschedule" && (
                <div className="p-6 flex flex-col h-full">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Check {selectedBooking.listingName} Availability</h3>
                    <p className="text-sm text-gray-500">Currently booked: <span className="font-bold text-gray-800 dark:text-gray-300">{selectedBooking.checkIn} to {selectedBooking.checkOut}</span></p>
                  </div>

                  {/* Calendar */}
                  <div className="flex justify-center bg-gray-50 dark:bg-black rounded-2xl p-2 mb-4">
                    <DayPicker
                      mode="range"
                      selected={newDateRange}
                      onSelect={setNewDateRange}
                      min={1}
                      modifiersStyles={{ selected: { fontWeight: 'bold' } }}
                    />
                  </div>

                  {/* Status Box */}
                  <div className="mt-auto">
                    {!newDateRange?.from || !newDateRange?.to ? (
                      <div className="p-4 text-center text-gray-400 border border-dashed rounded-xl">Select new dates above.</div>
                    ) : (
                      <div>
                        {/* STATUS LOGIC */}
                        {specificConflicts.length > 0 ? (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl">
                            <p className="font-bold text-red-600 flex items-center gap-2"><AlertCircle size={18} /> Conflict Found!</p>
                            <p className="text-sm text-red-500 mt-1">
                              Booking #{specificConflicts[0].id.slice(0, 4)} is already staying in this hotel on these dates.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 rounded-xl">
                              <p className="font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={18} /> Available!</p>
                              <p className="text-sm text-emerald-500 mt-1">
                                {selectedBooking.listingName} is free from {format(newDateRange.from, "MMM dd")} - {format(newDateRange.to, "MMM dd")}.
                              </p>
                            </div>
                            <button
                              onClick={handleConfirmReschedule}
                              disabled={isRescheduling}
                              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-80 flex justify-center gap-2"
                            >
                              {isRescheduling ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                              Approve & Move Booking
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB 3: DETAILS --- */}
              {modalTab === "details" && (
                <div className="p-6 space-y-6">
                  {/* Standard Details View */}
                  <div className="flex gap-4">
                    <img src={selectedBooking.listingImage} className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                    <div>
                      <h2 className="text-xl font-bold dark:text-white">{selectedBooking.listingName}</h2>
                      <p className="text-sm text-gray-500"><MapPin size={12} className="inline" /> Mathura</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p className="text-xs text-gray-500 uppercase">Check In</p><p className="font-bold dark:text-white">{format(parseISO(selectedBooking.checkIn), "EEE, dd MMM")}</p></div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p className="text-xs text-gray-500 uppercase">Total</p><p className="font-bold dark:text-white">₹{selectedBooking.totalAmount}</p></div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </main>
  );
}