"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import {
  CheckCircle, Loader2, Calendar, Car, Home,
  XCircle, HelpCircle, Send, AlertTriangle
} from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestType, setRequestType] = useState<"date_change" | "general">("general");
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  // --- REAL-TIME FETCH ---
  useEffect(() => {
    if (!id) return;
    const db = getFirestore(app);
    const unsub = onSnapshot(doc(db, "bookings", id), (doc) => {
      if (doc.exists()) {
        setBooking({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // --- HANDLER: DATE SELECTION ---
  const handleDateSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from) {
      const fromStr = format(range.from, "MMM dd, yyyy");
      const toStr = range.to ? format(range.to, "MMM dd, yyyy") : "...";
      setSupportMessage(`I would like to request a date change to: ${fromStr} - ${toStr}`);
    }
  };

  // --- HANDLER: CANCEL ---
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel? This action cannot be undone.")) return;

    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
    } catch (err) {
      alert("Error cancelling booking");
    }
  };

  // --- HANDLER: SEND QUERY ---
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await fetch("/api/bookings/support", {
        method: "POST",
        body: JSON.stringify({
          bookingId: id,
          message: supportMessage,
          type: requestType
        }),
      });
      alert("Request sent! The host will contact you shortly.");
      setShowSupport(false);
      setSupportMessage("");
      setSelectedRange(undefined);
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white">Booking not found.</div>;

  const isCancelled = booking.status === 'cancelled';
  const isUpcoming = booking.checkIn ? isFuture(parseISO(booking.checkIn)) : false;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
      <Navbar variant="default" />

      <style jsx global>{`
                .dark .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #e11d48; --rdp-background-color: #202020; margin: 0; }
                .dark .rdp-day_selected:not([disabled]) { color: white; background-color: var(--rdp-accent-color); }
                .dark .rdp-day:hover:not([disabled]) { background-color: #333; }
                .dark .rdp-caption_label, .dark .rdp-head_cell, .dark .rdp-day { color: #e5e7eb; }
                .dark .rdp-button:hover:not([disabled]) { color: white; }
            `}</style>

      <div className="max-w-3xl mx-auto px-4 pt-24 md:pt-32">
        <div className="text-center mb-8">
          {isCancelled ? (
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} strokeWidth={3} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
              <CheckCircle size={40} strokeWidth={3} />
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {isCancelled ? "Booking Cancelled" : "Booking Confirmed!"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Reference ID: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">#{booking.id.slice(0, 6).toUpperCase()}</span>
          </p>
        </div>

        <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-xl border overflow-hidden relative transition-colors ${isCancelled ? 'border-red-100 dark:border-red-900/50 opacity-90' : 'border-gray-100 dark:border-gray-800'}`}>
          <div className={`h-2 w-full ${isCancelled ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} />

          <div className="p-6 md:p-8 space-y-8">
            {/* 1. MAIN INFO */}
            <div className="flex flex-col sm:flex-row gap-5 items-start border-b border-gray-100 dark:border-gray-800 pb-8">
              <img src={booking.listingImage || "/placeholder.jpg"} className={`w-full sm:w-24 h-48 sm:h-24 object-cover rounded-xl shadow-sm ${isCancelled && 'grayscale'}`} alt="Listing" />
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isCancelled ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {booking.serviceType === 'vehicle_only' ? 'Vehicle Rental' : 'Hotel Stay'}
                </p>
                <h2 className={`text-xl font-bold mb-2 ${isCancelled ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{booking.listingName}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                    <Calendar size={14} />
                    {booking.checkIn && format(parseISO(booking.checkIn), "dd MMM")} - {booking.checkOut && format(parseISO(booking.checkOut), "dd MMM")}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SUMMARY */}
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                <span>Status</span>
                <span className={`font-bold uppercase text-xs px-2 py-1 rounded ${isCancelled ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                <span>Total Paid</span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">₹{Number(booking.totalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* 3. SUPPORT REQUESTS */}
            {booking.supportTickets && booking.supportTickets.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm">
                <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} /> Support Requests Sent
                </p>
                <ul className="list-disc pl-4 space-y-1 text-blue-700/80 dark:text-blue-200/80">
                  {booking.supportTickets.map((t: any, i: number) => (
                    <li key={i}>{t.message} <span className="text-xs opacity-60">({new Date(t.createdAt).toLocaleDateString()})</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* MANAGE BOOKING */}
          {!isCancelled && isUpcoming && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 md:p-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">Manage Booking</h3>

              {!showSupport ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleCancel} className="flex-1 flex items-center justify-center gap-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <XCircle size={18} /> Cancel Booking
                  </button>
                  <button onClick={() => { setShowSupport(true); setRequestType("date_change"); }} className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:opacity-80 transition-opacity">
                    <Calendar size={18} /> Change Dates
                  </button>
                  <button onClick={() => { setShowSupport(true); setRequestType("general"); }} className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-white dark:hover:bg-gray-700 transition-colors">
                    <HelpCircle size={18} /> Help
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm uppercase text-gray-500 dark:text-gray-400">
                      {requestType === "date_change" ? "Check Availability" : "How can we help?"}
                    </h4>
                    <button onClick={() => setShowSupport(false)}><XCircle size={20} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white" /></button>
                  </div>
                  {requestType === "date_change" && (
                    <div className="flex justify-center mb-4 border dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                      <DayPicker
                        mode="range"
                        selected={selectedRange}
                        onSelect={handleDateSelect}
                        disabled={{ before: new Date() }}
                        modifiersClassNames={{ selected: "bg-rose-600 text-white", day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md" }}
                      />
                    </div>
                  )}
                  <form onSubmit={handleSupportSubmit}>
                    <textarea
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none text-sm min-h-[80px]"
                      placeholder={requestType === "date_change" ? "Select dates above..." : "Describe your issue..."}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      required
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={() => setShowSupport(false)} className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">Close</button>
                      <button disabled={isSending} type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold hover:opacity-80 flex items-center gap-2 disabled:opacity-50">
                        {isSending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Send Request
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-center border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => router.push("/trips")} className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center gap-2">
              <Home size={16} /> Back to My Trips
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}